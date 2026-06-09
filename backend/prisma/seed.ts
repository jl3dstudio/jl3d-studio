// Seed do banco de dados JL3D Studio
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados JL3D Studio...')

  // ── Limpar todos os dados existentes ──
  await prisma.auditLog.deleteMany()
  await prisma.orderFile.deleteMany()
  await prisma.orderStatusHistory.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.quoteItem.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.revenue.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.filamentEntry.deleteMany()
  await prisma.product.deleteMany()
  await prisma.filament.deleteMany()
  await prisma.client.deleteMany()
  await prisma.printer.deleteMany()
  await prisma.settings.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Dados anteriores removidos')

  // ── Usuário Admin Master ──
  const passwordHash = await bcrypt.hash('Jl3d@2026', 10)
  const admin = await prisma.user.create({
    data: {
      id: uuid(),
      email: 'maykell@jl3d.com',
      passwordHash,
      name: 'Maykell',
      role: UserRole.ADMIN,
    },
  })
  console.log(`✅ Usuário admin criado: maykell@jl3d.com`)

  // ── Empresa ──
  await prisma.company.create({
    data: {
      userId: admin.id,
      name: 'JL3D Impressão 3D',
      slogan: 'Do arquivo à realidade',
      email: 'contato@jl3d.com',
    },
  })
  console.log('✅ Empresa criada')

  // ── Configurações do sistema ──
  const settings = [
    { key: 'electricity_cost_kwh', value: '0.75', description: 'Custo do kWh em R$' },
    { key: 'default_profit_margin', value: '40', description: 'Margem de lucro padrão (%)' },
    { key: 'default_labor_hour', value: '50', description: 'Valor hora trabalho (R$)' },
    { key: 'currency', value: 'BRL', description: 'Moeda padrão' },
    { key: 'quote_validity_days', value: '15', description: 'Validade padrão de orçamentos (dias)' },
    { key: 'low_stock_alert_g', value: '200', description: 'Alerta de estoque baixo (gramas)' },
    { key: 'company_name', value: 'JL3D Impressão 3D', description: 'Nome da empresa' },
  ]
  await prisma.settings.createMany({ data: settings })
  console.log('✅ Configurações criadas')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('═══════════════════════════════════════')
  console.log('📧 Admin: maykell@jl3d.com')
  console.log('🔑 Senha: Jl3d@2026')
  console.log('═══════════════════════════════════════')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
