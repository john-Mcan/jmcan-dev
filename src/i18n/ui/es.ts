/**
 * Textos de la interfaz en español neutro (fuente de verdad: `en.ts` debe tener
 * las mismas claves). Tuteo, sin voseo ni modismos regionales.
 * El copy marcado como «ejemplo» en el README es provisional.
 */
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
    lead: 'Desarrollo productos web completos, del modelo de datos a la interfaz.',
    ctaProjects: 'Ver proyectos',
    ctaContact: 'Escríbeme',
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
