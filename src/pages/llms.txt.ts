import type { APIRoute } from 'astro'
import { llmsIndex } from '@/lib/llms'
import { plainText } from '@/lib/seo'

export const GET: APIRoute = async () => plainText(await llmsIndex())
