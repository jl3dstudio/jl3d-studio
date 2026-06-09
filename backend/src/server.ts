// Entry point para desenvolvimento e deploy tradicional (Railway/VPS)
import 'dotenv/config'
import { buildApp } from './app'
import { env } from './utils/env'

async function start() {
  try {
    const app = await buildApp()
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 JL3D Studio API rodando em http://localhost:${env.PORT}`)
    console.log(`📖 Documentação disponível em http://localhost:${env.PORT}/docs`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()
