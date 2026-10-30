import type { APIRoute } from 'astro'
import { llmsFull } from '@/lib/llms'
import { plainText } from '@/lib/seo'

export const GET: APIRoute = async () => plainText(await llmsFull())
