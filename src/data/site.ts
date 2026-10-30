/** Datos personales del sitio en un solo lugar. Los marcados con «ejemplo» son provisionales. */
export const SITE = {
  name: 'John Mcan', // ejemplo: tomado del dominio
  url: 'https://johnmcan.dev',
  /** La preview de `main2` (`pnpm deploy:preview`): sus URL absolutas apuntan aquí y no se indexa. */
  previewUrl: 'https://preview.johnmcan.dev',
  email: 'hola@johnmcan.dev', // ejemplo
  jobTitle: { es: 'Desarrollador web full-stack', en: 'Full-stack web developer' }, // ejemplo
  socials: [{ label: 'GitHub', href: 'https://github.com/john-Mcan' }],
} as const
