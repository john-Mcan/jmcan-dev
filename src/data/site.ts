/** Datos personales del sitio en un solo lugar. Los marcados con «ejemplo» son provisionales. */
export const SITE = {
  name: 'John Mcan', // ejemplo: tomado del dominio
  url: 'https://johnmcan.dev',
  /** La preview (`pnpm deploy:preview`): sus URL absolutas apuntan aquí y no se indexa. */
  previewUrl: 'https://preview.johnmcan.dev',
  /** Una regla de Email Routing de la zona lo reenvía al correo personal; el resto se descarta. */
  email: 'contacto@johnmcan.dev',
  jobTitle: {
    es: 'Desarrollador full-stack y asistente comercial',
    en: 'Full-stack developer and sales assistant',
  },
  socials: [
    { label: 'GitHub', href: 'https://github.com/john-Mcan' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/john-moya-cantillana-519469192' },
  ],
} as const
