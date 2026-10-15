/**
 * Textos de la interfaz en español neutro (fuente de verdad: `en.ts` debe tener
 * las mismas claves). Tuteo, sin voseo ni modismos regionales.
 * El copy marcado como «ejemplo» en el README es provisional.
 */
/** Una pregunta del hero, con el ejemplo para el input; con `link`, termina en un enlace. */
interface HeroAsk {
  text: string
  placeholder: string
  link?: { text: string; href: string }
}

export const es = {
  meta: {
    homeTitle: 'John Mcan | Desarrollo web full-stack',
    homeDescription:
      'Portafolio de John Mcan: productos web rápidos y completos, del modelo de datos a la interfaz.',
    projectsTitle: 'Proyectos',
    projectsDescription: 'Proyectos seleccionados de John Mcan, con el detalle de cada uno.',
    contactTitle: 'Contacto',
    contactDescription: 'Escríbeme para conversar sobre tu proyecto.',
    notFoundTitle: 'Página no encontrada',
  },
  a11y: {
    skip: 'Saltar al contenido',
    mainNav: 'Navegación principal',
    language: 'Idioma',
    themeToLight: 'Cambiar a tema claro',
    themeToDark: 'Cambiar a tema oscuro',
  },
  nav: {
    home: 'Inicio',
    projects: 'Proyectos',
    contact: 'Contacto',
  },
  hero: {
    lead: 'Construyo productos web completos, del modelo de datos a la interfaz.',
    /**
     * La pregunta sobre el input rota entre estas, tecla a tecla; cada una trae su
     * ejemplo para el input. La primera es la que se ve al cargar y el nombre del
     * input. La última es un guiño: la radio, el proyecto más reciente.
     */
    asks: [
      { text: '¿qué quieres construir?', placeholder: 'una app para…' },
      { text: '¿necesitas hacer una consulta?', placeholder: 'quiero saber si…' },
      { text: '¿quieres aplicar la IA en algún proyecto?', placeholder: 'un asistente que…' },
      { text: '¿tienes alguna propuesta?', placeholder: 'te propongo…' },
      { text: '¿pasas a saludar?', placeholder: 'hola…' },
      {
        text: 'escucha algo de música ',
        link: { text: 'aquí', href: 'https://www.nex-radio.com/' },
        placeholder: 'o escríbeme algo…',
      },
    ] satisfies [HeroAsk, ...HeroAsk[]],
    askSubmit: 'Enviar',
    ctaProjects: 'Ver proyectos',
    status: 'Disponible para proyectos desde noviembre',
  },
  projects: {
    featuredTitle: 'Proyectos seleccionados',
    seeAll: 'Ver los {count}',
    indexTitle: 'Proyectos',
    indexLead: 'Lo que he construido, con el contexto y las decisiones detrás de cada uno.',
    role: 'Rol',
    year: 'Año',
    stack: 'Stack',
    live: 'Ver sitio',
    repo: 'Ver código',
    back: 'Todos los proyectos',
  },
  timeline: {
    title: 'Trayectoria',
    /** Cómo la nombra el prompt del header: `~/trayectoria`. */
    path: 'trayectoria',
  },
  contactCta: {
    title: '¿Tienes un proyecto en mente?',
    body: 'Cuéntame qué necesitas y te respondo en menos de 48 horas.',
    cta: 'Escríbeme',
  },
  email: {
    copy: 'Copiar correo',
    copied: 'Correo copiado',
  },
  contact: {
    title: 'Contacto',
    lead: 'Cuéntame qué quieres construir. Leo cada mensaje y respondo en menos de 48 horas.',
    direct: 'También puedes escribirme directo:',
    name: 'Nombre',
    email: 'Correo',
    message: 'Mensaje',
    messageHint: 'Qué necesitas, para cuándo y, si lo tienes, el presupuesto.',
    submit: 'Enviar mensaje',
    sending: 'Enviando…',
    sent: 'Mensaje enviado. Te respondo pronto a tu correo.',
    errorInvalid: 'Revisa los campos: falta información o el correo no es válido.',
    errorSend: 'El mensaje no salió. Vuelve a intentarlo o escríbeme a {email}.',
  },
  notFound: {
    title: 'Esta página no existe',
    body: 'El enlace está roto o la página cambió de lugar.',
    home: 'Volver al inicio',
  },
  footer: {
    rights: 'Todos los derechos reservados.',
  },
}

/** Mismas claves, cualquier texto: `en.ts` se valida contra esto. */
export type Dictionary = typeof es
