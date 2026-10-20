export const materias = [
  "Penal",
  "Civil",
  "Constitucional",
  "Laboral",
  "Administrativo",
  "Otra",
];

export const tiposPublicacion = [
  {
    id: "actualidad",
    nombre: "Actualidad",
    descripcion: "Novedades jurídicas con contexto y referencias verificables.",
    campos: [
      { id: "fechaHecho", etiqueta: "Fecha del hecho", tipo: "date", requerido: true },
      { id: "queOcurrio", etiqueta: "¿Qué ocurrió?", tipo: "textarea", requerido: true },
      { id: "relevancia", etiqueta: "¿Por qué es relevante?", tipo: "textarea", requerido: true },
      { id: "fuentes", etiqueta: "Fuentes y enlaces", tipo: "textarea", requerido: true },
    ],
  },
  {
    id: "normas",
    nombre: "Normas",
    descripcion: "Normas explicadas con datos de publicación y vigencia.",
    campos: [
      { id: "identificacion", etiqueta: "Número y nombre completo de la norma", tipo: "text", requerido: true },
      { id: "fechaPublicacionNorma", etiqueta: "Fecha de publicación de la norma", tipo: "date", requerido: true },
      { id: "fechaVigencia", etiqueta: "Fecha de entrada en vigencia", tipo: "date", requerido: false },
      { id: "cambios", etiqueta: "Cambios principales", tipo: "textarea", requerido: true },
      { id: "implicancias", etiqueta: "A quiénes y cómo podría afectar", tipo: "textarea", requerido: true },
      { id: "fuenteOficial", etiqueta: "Enlace a la fuente oficial", tipo: "url", requerido: true },
    ],
  },
  {
    id: "jurisprudencia",
    nombre: "Jurisprudencia",
    descripcion: "Decisiones y criterios judiciales con referencia a su expediente.",
    campos: [
      { id: "organo", etiqueta: "Órgano jurisdiccional", tipo: "text", requerido: true },
      { id: "expediente", etiqueta: "Número de expediente o resolución", tipo: "text", requerido: true },
      { id: "fechaDecision", etiqueta: "Fecha de la decisión", tipo: "date", requerido: true },
      { id: "problemaJuridico", etiqueta: "Problema jurídico", tipo: "textarea", requerido: true },
      { id: "criterio", etiqueta: "Criterio o decisión principal", tipo: "textarea", requerido: true },
      { id: "analisis", etiqueta: "Análisis", tipo: "textarea", requerido: true },
      { id: "fuenteOficial", etiqueta: "Enlace a la decisión o fuente oficial", tipo: "url", requerido: true },
    ],
  },
  {
    id: "modelos",
    nombre: "Modelos y formatos",
    descripcion: "Documentos de referencia con límites y advertencias claras.",
    campos: [
      { id: "finalidad", etiqueta: "¿Para qué sirve este modelo?", tipo: "textarea", requerido: true },
      { id: "destinatario", etiqueta: "¿A quién está dirigido?", tipo: "text", requerido: true },
      { id: "cuandoUsar", etiqueta: "¿Cuándo podría utilizarse?", tipo: "textarea", requerido: true },
      { id: "requisitos", etiqueta: "Información o requisitos que deben revisarse", tipo: "textarea", requerido: true },
      { id: "contenidoModelo", etiqueta: "Contenido del modelo", tipo: "textarea", requerido: true },
      { id: "advertencias", etiqueta: "Advertencias para su adaptación", tipo: "textarea", requerido: true },
      { id: "fuente", etiqueta: "Fuente o referencia (si corresponde)", tipo: "url", requerido: false },
    ],
  },
  {
    id: "guias",
    nombre: "Guías",
    descripcion: "Explicaciones paso a paso de trámites y procedimientos.",
    campos: [
      { id: "destinatario", etiqueta: "¿A quién está dirigida la guía?", tipo: "text", requerido: true },
      { id: "requisitos", etiqueta: "Requisitos previos", tipo: "textarea", requerido: true },
      { id: "pasos", etiqueta: "Pasos del procedimiento", tipo: "textarea", requerido: true },
      { id: "plazos", etiqueta: "Plazos importantes", tipo: "textarea", requerido: false },
      { id: "dondeRealizar", etiqueta: "¿Dónde o ante quién se realiza?", tipo: "textarea", requerido: true },
      { id: "fuenteOficial", etiqueta: "Enlace a la fuente oficial", tipo: "url", requerido: true },
    ],
  },
  {
    id: "investigacion",
    nombre: "Investigación",
    descripcion: "Trabajos con pregunta, método, hallazgos y referencias.",
    campos: [
      { id: "pregunta", etiqueta: "Pregunta de investigación", tipo: "textarea", requerido: true },
      { id: "metodologia", etiqueta: "Metodología", tipo: "textarea", requerido: true },
      { id: "hallazgos", etiqueta: "Hallazgos o argumento central", tipo: "textarea", requerido: true },
      { id: "limitaciones", etiqueta: "Alcances y limitaciones", tipo: "textarea", requerido: false },
      { id: "bibliografia", etiqueta: "Bibliografía y fuentes consultadas", tipo: "textarea", requerido: true },
    ],
  },
  {
    id: "opinion",
    nombre: "Opinión",
    descripcion: "Comentarios de autor claramente diferenciados de información oficial.",
    campos: [
      { id: "tesis", etiqueta: "Tesis o postura principal", tipo: "textarea", requerido: true },
      { id: "argumentos", etiqueta: "Argumentos y análisis", tipo: "textarea", requerido: true },
      { id: "referencias", etiqueta: "Fuentes y referencias", tipo: "textarea", requerido: true },
      { id: "declaracion", etiqueta: "Intereses o vínculos que conviene declarar", tipo: "textarea", requerido: false },
    ],
  },
];

export const camposComunes = [
  { id: "titulo", etiqueta: "Título", tipo: "text", requerido: true, maximo: 180 },
  { id: "resumen", etiqueta: "Resumen para el portal", tipo: "textarea", requerido: true, maximo: 500 },
  { id: "autor", etiqueta: "Autor o entidad responsable", tipo: "text", requerido: true, maximo: 120 },
  { id: "fechaPublicacionPortal", etiqueta: "Fecha de publicación en el portal", tipo: "date", requerido: true },
  { id: "materia", etiqueta: "Materia", tipo: "select", requerido: true, opciones: materias },
  { id: "fuentePrincipal", etiqueta: "Nombre de la fuente principal (si corresponde)", tipo: "text", requerido: false, maximo: 160 },
  { id: "enlacePrincipal", etiqueta: "Enlace a la fuente principal (si corresponde)", tipo: "url", requerido: false, maximo: 500 },
];
