// Vercel Serverless Function — JL3D Studio Backend
import 'dotenv/config'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../backend/src/app'

// Cache da instância entre invocações (warm start)
let cachedApp: FastifyInstance | null = null

async function getApp(): Promise<FastifyInstance> {
  if (cachedApp) return cachedApp
  cachedApp = await buildApp()
  await cachedApp.ready()
  return cachedApp
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp()
  app.server.emit('request', req, res)
}
