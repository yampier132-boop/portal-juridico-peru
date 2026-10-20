# Administración y publicaciones

El panel de publicaciones está en `admin/` y se sirve desde un Cloudflare Worker, separado de la web pública de GitHub Pages. La página pública no entrega los archivos del panel. La persona administradora inicia sesión con GitHub; el Worker solo autoriza el usuario configurado en `ADMIN_GITHUB_LOGIN` y guarda las publicaciones en `contenido/publicaciones.json`.

## Antes de activarlo

- Instala Node.js LTS en el equipo desde el sitio oficial de Node.js.
- Crea una cuenta de Cloudflare y una OAuth App de GitHub.
- No pegues contraseñas, tokens ni secretos en archivos del repositorio ni los compartas en el chat.

## Configuración inicial

1. Abre PowerShell en la carpeta del repositorio e inicia sesión en Cloudflare:

   ```powershell
   npx wrangler@latest login
   ```

2. Crea el espacio donde Cloudflare guardará los estados temporales del inicio de sesión:

   ```powershell
   npx wrangler@latest kv namespace create AUTH_KV
   ```

   Copia el `id` que entrega el comando y reemplaza `REEMPLAZAR_CON_EL_ID_DE_KV` en `wrangler.toml`.

3. En `wrangler.toml`, reemplaza `REEMPLAZAR_CON_TU_USUARIO_DE_GITHUB` por el nombre exacto de tu cuenta de GitHub. Ese valor limita qué cuenta puede entrar.

4. Despliega el Worker:

   ```powershell
   npx wrangler@latest deploy
   ```

   Cloudflare mostrará una dirección parecida a `https://de-ley-admin.<tu-cuenta>.workers.dev`. Guárdala: esa será la dirección del panel. La dirección no es una contraseña; el inicio de sesión y la autorización del servidor protegen las publicaciones.

5. En GitHub, crea una OAuth App en **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - **Application name:** `De Ley - Administración`
   - **Homepage URL:** la dirección `workers.dev` que te dio Cloudflare
   - **Authorization callback URL:** esa misma dirección seguida de `/auth/callback`
   - La aplicación solo solicita leer el perfil de GitHub; no solicita permisos del repositorio.

6. En GitHub, crea un token de acceso personal de tipo **Fine-grained** limitado únicamente al repositorio `yampier132-boop/portal-juridico-peru` y con permiso **Contents: Read and write**. No le concedas permisos de administración.

7. Guarda los tres valores como secretos del Worker. Cada comando pedirá el valor sin añadirlo al repositorio:

   ```powershell
   npx wrangler@latest secret put GITHUB_CLIENT_ID
   npx wrangler@latest secret put GITHUB_CLIENT_SECRET
   npx wrangler@latest secret put GITHUB_CONTENTS_TOKEN
   ```

8. Vuelve a desplegar para aplicar la configuración:

   ```powershell
   npx wrangler@latest deploy
   ```

9. Abre la dirección `workers.dev`, inicia sesión con la cuenta de GitHub autorizada y prueba una publicación que puedas revisar. El Worker actualiza el archivo de publicaciones en `main`; GitHub Pages lo muestra cuando termina su despliegue.

## Cómo se usa el formulario

El panel tiene campos comunes y cambia los campos específicos según el tipo de publicación: Actualidad, Normas, Jurisprudencia, Modelos y formatos, Guías, Investigación u Opinión. La validación se repite en el servidor, los enlaces deben usar HTTPS y los campos se muestran como texto para evitar que se interpreten como código.

El panel no está enlazado en la navegación pública. Aunque alguien descubra su dirección, solo la cuenta de GitHub indicada en `ADMIN_GITHUB_LOGIN` puede guardar publicaciones. La sesión expira después de ocho horas. Cambiar la cuenta permitida y desplegar el Worker retira el acceso de la sesión anterior.
