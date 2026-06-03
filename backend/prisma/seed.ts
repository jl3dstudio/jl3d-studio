// Seed do banco de dados JL3D Studio
// Cria dados de exemplo realistas para demonstração
import { PrismaClient, UserRole, FilamentType, ClientType, QuoteStatus, OrderStatus, PaymentStatus, ExpenseCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados JL3D Studio...')

  // ── Limpar dados existentes ──
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

  // ── Usuário Admin ──
  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      id: uuid(),
      email: 'admin@jl3d.com',
      passwordHash,
      name: 'João Lima',
      role: UserRole.ADMIN,
    },
  })

  await prisma.company.create({
    data: {
      userId: admin.id,
      name: 'JL3D Impressão 3D',
      slogan: 'Do arquivo à realidade',
      cnpj: '12.345.678/0001-90',
      address: 'Rua das Impressoras, 123 - São Paulo/SP',
      phone: '(11) 91234-5678',
      whatsapp: '5511912345678',
      email: 'contato@jl3d.com',
      website: 'www.jl3d.com',
    },
  })

  console.log('✅ Usuário admin criado: admin@jl3d.com / admin123')

  // ── Usuário Operador ──
  const opHash = await bcrypt.hash('operador123', 10)
  const operador = await prisma.user.create({
    data: {
      id: uuid(),
      email: 'operador@jl3d.com',
      passwordHash: opHash,
      name: 'Lucas Operador',
      role: UserRole.OPERATOR,
    },
  })
  console.log('✅ Usuário operador criado: operador@jl3d.com / operador123')

  // ── Configurações do sistema ──
  const settingsList = [
    { key: 'kwh_price', value: '0.75', description: 'Preço do kWh em R$' },
    { key: 'operator_hourly_rate', value: '15.00', description: 'Valor da hora do operador em R$' },
    { key: 'failure_rate_percent', value: '5', description: 'Taxa de falha estimada em %' },
    { key: 'default_margin_percent', value: '80', description: 'Margem de lucro padrão em %' },
    { key: 'currency', value: 'BRL', description: 'Moeda do sistema' },
    { key: 'timezone', value: 'America/Sao_Paulo', description: 'Fuso horário' },
    { key: 'quote_validity_days', value: '7', description: 'Validade padrão dos orçamentos em dias' },
  ]
  for (const s of settingsList) {
    await prisma.settings.create({ data: s })
  }
  console.log('✅ Configurações do sistema criadas')

  // ── Impressoras ──
  const printer1 = await prisma.printer.create({
    data: {
      name: 'Bambu Lab A1 Mini',
      model: 'A1 Mini',
      powerWatts: 350,
      purchaseValue: 2800,
      usefulLifeHours: 5000,
      totalHoursUsed: 1240,
    },
  })
  const printer2 = await prisma.printer.create({
    data: {
      name: 'Creality Ender 3 V3',
      model: 'Ender 3 V3',
      powerWatts: 270,
      purchaseValue: 1200,
      usefulLifeHours: 4000,
      totalHoursUsed: 890,
    },
  })
  console.log('✅ Impressoras criadas')

  // ── Filamentos ──
  const filPlaWhite = await prisma.filament.create({
    data: {
      name: 'PLA Branco Premium',
      type: FilamentType.PLA,
      brand: 'Bambu Lab',
      colorName: 'Branco',
      colorHex: '#F5F5F0',
      spoolWeightG: 1000,
      pricePaid: 89.90,
      purchaseDate: new Date('2024-10-15'),
      currentWeightG: 420,
      minStockG: 100,
      tags: ['premium', 'resistente'],
    },
  })
  const filPlaBlack = await prisma.filament.create({
    data: {
      name: 'PLA Preto Matte',
      type: FilamentType.PLA,
      brand: 'Bambu Lab',
      colorName: 'Preto Matte',
      colorHex: '#1A1A1A',
      spoolWeightG: 1000,
      pricePaid: 89.90,
      purchaseDate: new Date('2024-10-15'),
      currentWeightG: 680,
      minStockG: 100,
      tags: ['premium', 'matte'],
    },
  })
  const filPetgBlue = await prisma.filament.create({
    data: {
      name: 'PETG Azul Translúcido',
      type: FilamentType.PETG,
      brand: 'eSUN',
      colorName: 'Azul Translúcido',
      colorHex: '#1E6FD9',
      spoolWeightG: 1000,
      pricePaid: 79.90,
      purchaseDate: new Date('2024-11-01'),
      currentWeightG: 850,
      minStockG: 150,
      tags: ['petg', 'funcional'],
    },
  })
  const filPlaRed = await prisma.filament.create({
    data: {
      name: 'PLA Vermelho Brilhante',
      type: FilamentType.PLA,
      brand: 'Polymaker',
      colorName: 'Vermelho',
      colorHex: '#E53935',
      spoolWeightG: 1000,
      pricePaid: 85.00,
      purchaseDate: new Date('2024-09-20'),
      currentWeightG: 75, // Estoque baixo - vai gerar alerta!
      minStockG: 100,
      tags: ['decorativo'],
    },
  })
  const filTpuGray = await prisma.filament.create({
    data: {
      name: 'TPU Cinza Flexível',
      type: FilamentType.TPU,
      brand: 'Sunlu',
      colorName: 'Cinza',
      colorHex: '#8E9196',
      spoolWeightG: 500,
      pricePaid: 95.00,
      purchaseDate: new Date('2024-11-10'),
      currentWeightG: 380,
      minStockG: 80,
      tags: ['flexível', 'peças funcionais'],
    },
  })
  console.log('✅ Filamentos criados')

  // ── Produtos do catálogo ──
  const kwh = 0.75
  const printerDepreciation1 = printer1.purchaseValue / printer1.usefulLifeHours // R$/h
  const printerDepreciation2 = printer2.purchaseValue / printer2.usefulLifeHours
  const laborRate = 15 // R$/h
  const failureRate = 0.05

  // Produto: Suporte de parede
  const costSuporteParede = (filPlaBlack.pricePaid / filPlaBlack.spoolWeightG) * 85
    + (printer1.powerWatts / 1000) * 2.5 * kwh
    + printerDepreciation1 * 2.5
    + laborRate * (15 / 60)
  const prod1 = await prisma.product.create({
    data: {
      name: 'Suporte de Parede Modular',
      description: 'Suporte articulado para parede, modular e resistente',
      emoji: '📐',
      filamentId: filPlaBlack.id,
      weightG: 85,
      printTimeMin: 150,
      laborTimeMin: 15,
      postProcessCost: 0,
      baseCost: Math.round(costSuporteParede * (1 + failureRate) * 100) / 100,
      suggestedPrice: Math.round(costSuporteParede * (1 + failureRate) * 1.8 * 100) / 100,
      marginPercent: 80,
      tags: ['decoração', 'organização'],
    },
  })

  // Produto: Capa de celular
  const costCapa = (filPlaWhite.pricePaid / filPlaWhite.spoolWeightG) * 45
    + (printer1.powerWatts / 1000) * 1.5 * kwh
    + printerDepreciation1 * 1.5
    + laborRate * (10 / 60)
  const prod2 = await prisma.product.create({
    data: {
      name: 'Capa Personalizada Celular',
      description: 'Capa impressa em PLA, personalizável com nome/logo',
      emoji: '📱',
      filamentId: filPlaWhite.id,
      weightG: 45,
      printTimeMin: 90,
      laborTimeMin: 10,
      postProcessCost: 2.00,
      baseCost: Math.round(costCapa * (1 + failureRate) * 100) / 100,
      suggestedPrice: Math.round(costCapa * (1 + failureRate) * 2.5 * 100) / 100,
      marginPercent: 150,
      tags: ['personalizado', 'celular'],
    },
  })

  // Produto: Peça funcional PETG
  const costPecaFuncional = (filPetgBlue.pricePaid / filPetgBlue.spoolWeightG) * 120
    + (printer1.powerWatts / 1000) * 4 * kwh
    + printerDepreciation1 * 4
    + laborRate * (20 / 60)
  const prod3 = await prisma.product.create({
    data: {
      name: 'Engrenagem Industrial PETG',
      description: 'Peça funcional em PETG para uso técnico/industrial',
      emoji: '⚙️',
      filamentId: filPetgBlue.id,
      weightG: 120,
      printTimeMin: 240,
      laborTimeMin: 20,
      postProcessCost: 5.00,
      baseCost: Math.round(costPecaFuncional * (1 + failureRate) * 100) / 100,
      suggestedPrice: Math.round(costPecaFuncional * (1 + failureRate) * 2.0 * 100) / 100,
      marginPercent: 100,
      tags: ['funcional', 'industrial', 'petg'],
    },
  })

  // Produto: Miniatura decorativa
  const costMiniatura = (filPlaRed.pricePaid / filPlaRed.spoolWeightG) * 30
    + (printer1.powerWatts / 1000) * 3 * kwh
    + printerDepreciation1 * 3
    + laborRate * (30 / 60)
  const prod4 = await prisma.product.create({
    data: {
      name: 'Miniatura Decorativa',
      description: 'Estatueta/miniatura decorativa de alta resolução',
      emoji: '🗿',
      filamentId: filPlaRed.id,
      weightG: 30,
      printTimeMin: 180,
      laborTimeMin: 30,
      postProcessCost: 8.00,
      baseCost: Math.round(costMiniatura * (1 + failureRate) * 100) / 100,
      suggestedPrice: Math.round(costMiniatura * (1 + failureRate) * 3.0 * 100) / 100,
      marginPercent: 200,
      tags: ['decoração', 'miniatura'],
    },
  })

  // Produto: Garra robótica TPU
  const costGarra = (filTpuGray.pricePaid / filTpuGray.spoolWeightG) * 95
    + (printer2.powerWatts / 1000) * 5 * kwh
    + printerDepreciation2 * 5
    + laborRate * (45 / 60)
  const prod5 = await prisma.product.create({
    data: {
      name: 'Garra Robótica Flexível TPU',
      description: 'Garra articulada em TPU para projetos de robótica',
      emoji: '🦾',
      filamentId: filTpuGray.id,
      weightG: 95,
      printTimeMin: 300,
      laborTimeMin: 45,
      postProcessCost: 10.00,
      baseCost: Math.round(costGarra * (1 + failureRate) * 100) / 100,
      suggestedPrice: Math.round(costGarra * (1 + failureRate) * 2.2 * 100) / 100,
      marginPercent: 120,
      tags: ['robótica', 'tpu', 'funcional'],
    },
  })
  console.log('✅ Produtos do catálogo criados')

  // ── Clientes ──
  const cliente1 = await prisma.client.create({
    data: {
      name: 'Carlos Mendonça',
      type: ClientType.PERSON,
      whatsapp: '5511987654321',
      email: 'carlos@email.com',
      address: 'Av. Paulista, 500 - São Paulo/SP',
      tags: ['vip', 'recorrente'],
      notes: 'Cliente frequente, prefere PLA premium',
    },
  })
  const cliente2 = await prisma.client.create({
    data: {
      name: 'Loja Gadgets & Cia',
      type: ClientType.RETAILER,
      whatsapp: '5511976543210',
      email: 'compras@gadgetsecia.com',
      address: 'Rua Augusta, 1200 - São Paulo/SP',
      document: '98.765.432/0001-11',
      tags: ['lojista', 'volume'],
      notes: 'Pede em volume, negocia desconto acima de 10 unidades',
    },
  })
  const cliente3 = await prisma.client.create({
    data: {
      name: 'Engenharia Inovação LTDA',
      type: ClientType.COMPANY,
      whatsapp: '5511965432109',
      email: 'projetos@engenovacao.com.br',
      address: 'Rua Funchal, 418 - São Paulo/SP',
      document: '11.222.333/0001-55',
      tags: ['empresa', 'peças funcionais'],
    },
  })
  const cliente4 = await prisma.client.create({
    data: {
      name: 'Ana Paula Costa',
      type: ClientType.PERSON,
      whatsapp: '5511954321098',
      email: 'anapaula@gmail.com',
      tags: ['novo'],
    },
  })
  console.log('✅ Clientes criados')

  // ── Orçamentos ──
  const orcamento1 = await prisma.quote.create({
    data: {
      number: 'ORC-0001',
      clientId: cliente1.id,
      userId: admin.id,
      status: QuoteStatus.APPROVED,
      discountType: 'FIXED',
      discountValue: 10.00,
      paymentMethod: 'PIX',
      validUntil: new Date('2024-12-31'),
      subtotal: prod2.suggestedPrice * 3,
      total: prod2.suggestedPrice * 3 - 10.00,
      publicToken: uuid(),
      items: {
        create: [
          {
            productId: prod2.id,
            name: prod2.name,
            quantity: 3,
            unitPrice: prod2.suggestedPrice,
            totalPrice: prod2.suggestedPrice * 3,
          },
        ],
      },
    },
  })

  const orcamento2 = await prisma.quote.create({
    data: {
      number: 'ORC-0002',
      clientId: cliente2.id,
      userId: admin.id,
      status: QuoteStatus.SENT,
      discountType: 'PERCENT',
      discountValue: 10,
      paymentMethod: 'Transferência',
      validUntil: new Date('2024-12-15'),
      subtotal: prod1.suggestedPrice * 20,
      total: prod1.suggestedPrice * 20 * 0.9,
      publicToken: uuid(),
      items: {
        create: [
          {
            productId: prod1.id,
            name: prod1.name,
            quantity: 20,
            unitPrice: prod1.suggestedPrice,
            totalPrice: prod1.suggestedPrice * 20,
          },
        ],
      },
    },
  })

  const orcamento3 = await prisma.quote.create({
    data: {
      number: 'ORC-0003',
      clientId: cliente3.id,
      userId: admin.id,
      status: QuoteStatus.APPROVED,
      paymentMethod: 'Boleto',
      subtotal: prod3.suggestedPrice * 5 + prod5.suggestedPrice * 2,
      total: prod3.suggestedPrice * 5 + prod5.suggestedPrice * 2,
      publicToken: uuid(),
      items: {
        create: [
          {
            productId: prod3.id,
            name: prod3.name,
            quantity: 5,
            unitPrice: prod3.suggestedPrice,
            totalPrice: prod3.suggestedPrice * 5,
          },
          {
            productId: prod5.id,
            name: prod5.name,
            quantity: 2,
            unitPrice: prod5.suggestedPrice,
            totalPrice: prod5.suggestedPrice * 2,
          },
        ],
      },
    },
  })

  await prisma.quote.create({
    data: {
      number: 'ORC-0004',
      clientId: cliente4.id,
      userId: admin.id,
      status: QuoteStatus.DRAFT,
      subtotal: prod4.suggestedPrice * 2,
      total: prod4.suggestedPrice * 2,
      publicToken: uuid(),
      items: {
        create: [
          {
            productId: prod4.id,
            name: prod4.name,
            quantity: 2,
            unitPrice: prod4.suggestedPrice,
            totalPrice: prod4.suggestedPrice * 2,
          },
        ],
      },
    },
  })
  console.log('✅ Orçamentos criados')

  // ── Pedidos ──
  const pedido1 = await prisma.order.create({
    data: {
      number: 'PED-0001',
      clientId: cliente1.id,
      userId: admin.id,
      quoteId: orcamento1.id,
      status: OrderStatus.DELIVERED,
      estimatedDelivery: new Date('2024-11-20'),
      deliveredAt: new Date('2024-11-19'),
      subtotal: orcamento1.subtotal,
      total: orcamento1.total,
      printTimeMinReal: 135,
      items: {
        create: [
          {
            productId: prod2.id,
            filamentId: filPlaWhite.id,
            printerId: printer1.id,
            name: prod2.name,
            quantity: 3,
            weightG: prod2.weightG,
            printTimeMin: prod2.printTimeMin,
            unitPrice: prod2.suggestedPrice,
            totalPrice: prod2.suggestedPrice * 3,
            filamentUsedG: prod2.weightG! * 3,
          },
        ],
      },
    },
  })

  const pedido2 = await prisma.order.create({
    data: {
      number: 'PED-0002',
      clientId: cliente3.id,
      userId: admin.id,
      quoteId: orcamento3.id,
      status: OrderStatus.PRINTING,
      estimatedDelivery: new Date('2024-12-10'),
      subtotal: orcamento3.subtotal,
      total: orcamento3.total,
      productionNotes: 'Peças técnicas — verificar tolerâncias',
      items: {
        create: [
          {
            productId: prod3.id,
            filamentId: filPetgBlue.id,
            printerId: printer1.id,
            name: prod3.name,
            quantity: 5,
            weightG: prod3.weightG,
            printTimeMin: prod3.printTimeMin,
            unitPrice: prod3.suggestedPrice,
            totalPrice: prod3.suggestedPrice * 5,
          },
          {
            productId: prod5.id,
            filamentId: filTpuGray.id,
            printerId: printer2.id,
            name: prod5.name,
            quantity: 2,
            weightG: prod5.weightG,
            printTimeMin: prod5.printTimeMin,
            unitPrice: prod5.suggestedPrice,
            totalPrice: prod5.suggestedPrice * 2,
          },
        ],
      },
    },
  })

  const pedido3 = await prisma.order.create({
    data: {
      number: 'PED-0003',
      clientId: cliente1.id,
      userId: operador.id,
      status: OrderStatus.READY,
      estimatedDelivery: new Date('2024-12-05'),
      subtotal: prod1.suggestedPrice * 10,
      total: prod1.suggestedPrice * 10,
      items: {
        create: [
          {
            productId: prod1.id,
            filamentId: filPlaBlack.id,
            printerId: printer2.id,
            name: prod1.name,
            quantity: 10,
            weightG: prod1.weightG,
            printTimeMin: prod1.printTimeMin,
            unitPrice: prod1.suggestedPrice,
            totalPrice: prod1.suggestedPrice * 10,
          },
        ],
      },
    },
  })

  const pedido4 = await prisma.order.create({
    data: {
      number: 'PED-0004',
      clientId: cliente4.id,
      userId: admin.id,
      status: OrderStatus.PENDING,
      estimatedDelivery: new Date('2024-12-20'),
      subtotal: prod4.suggestedPrice * 2,
      total: prod4.suggestedPrice * 2,
      items: {
        create: [
          {
            productId: prod4.id,
            filamentId: filPlaRed.id,
            printerId: printer1.id,
            name: prod4.name,
            quantity: 2,
            weightG: prod4.weightG,
            printTimeMin: prod4.printTimeMin,
            unitPrice: prod4.suggestedPrice,
            totalPrice: prod4.suggestedPrice * 2,
          },
        ],
      },
    },
  })

  // Histórico de status dos pedidos
  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: pedido1.id, userId: admin.id, toStatus: OrderStatus.PENDING, createdAt: new Date('2024-11-10') },
      { orderId: pedido1.id, userId: admin.id, fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PRINTING, createdAt: new Date('2024-11-11') },
      { orderId: pedido1.id, userId: admin.id, fromStatus: OrderStatus.PRINTING, toStatus: OrderStatus.READY, createdAt: new Date('2024-11-18') },
      { orderId: pedido1.id, userId: admin.id, fromStatus: OrderStatus.READY, toStatus: OrderStatus.DELIVERED, createdAt: new Date('2024-11-19') },
      { orderId: pedido2.id, userId: admin.id, toStatus: OrderStatus.PENDING, createdAt: new Date('2024-11-25') },
      { orderId: pedido2.id, userId: admin.id, fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PRINTING, createdAt: new Date('2024-11-26') },
      { orderId: pedido3.id, userId: operador.id, toStatus: OrderStatus.PENDING, createdAt: new Date('2024-11-28') },
      { orderId: pedido3.id, userId: operador.id, fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PRINTING, createdAt: new Date('2024-11-29') },
      { orderId: pedido3.id, userId: operador.id, fromStatus: OrderStatus.PRINTING, toStatus: OrderStatus.READY, createdAt: new Date('2024-12-02') },
      { orderId: pedido4.id, userId: admin.id, toStatus: OrderStatus.PENDING, createdAt: new Date('2024-12-01') },
    ],
  })
  console.log('✅ Pedidos e histórico criados')

  // ── Financeiro ──
  // Receitas
  await prisma.revenue.create({
    data: {
      orderId: pedido1.id,
      description: `Pedido ${pedido1.number} - ${cliente1.name}`,
      amount: pedido1.total,
      paymentMethod: 'PIX',
      status: PaymentStatus.RECEIVED,
      paidAt: new Date('2024-11-19'),
    },
  })
  await prisma.revenue.create({
    data: {
      orderId: pedido3.id,
      description: `Pedido ${pedido3.number} - ${cliente1.name}`,
      amount: pedido3.total,
      paymentMethod: 'PIX',
      status: PaymentStatus.PENDING,
      dueDate: new Date('2024-12-07'),
    },
  })
  await prisma.revenue.create({
    data: {
      description: 'Venda avulsa — suporte de notebook',
      amount: 45.00,
      paymentMethod: 'Dinheiro',
      status: PaymentStatus.RECEIVED,
      paidAt: new Date('2024-11-15'),
    },
  })

  // Despesas
  await prisma.expense.createMany({
    data: [
      {
        category: ExpenseCategory.FILAMENT,
        description: 'Compra carretéis PLA Bambu Lab (5 un)',
        amount: 449.50,
        date: new Date('2024-10-15'),
      },
      {
        category: ExpenseCategory.FILAMENT,
        description: 'PETG eSUN + TPU Sunlu',
        amount: 174.90,
        date: new Date('2024-11-01'),
      },
      {
        category: ExpenseCategory.ENERGY,
        description: 'Conta de energia — Outubro/2024',
        amount: 187.40,
        date: new Date('2024-11-05'),
      },
      {
        category: ExpenseCategory.ENERGY,
        description: 'Conta de energia — Novembro/2024',
        amount: 203.15,
        date: new Date('2024-12-05'),
      },
      {
        category: ExpenseCategory.MAINTENANCE,
        description: 'Troca de bico e correia Ender 3',
        amount: 68.00,
        date: new Date('2024-10-22'),
      },
      {
        category: ExpenseCategory.MARKETING,
        description: 'Impulsionamento Instagram — Novembro',
        amount: 150.00,
        date: new Date('2024-11-01'),
      },
      {
        category: ExpenseCategory.OTHER,
        description: 'Material de embalagem (caixas e fita)',
        amount: 45.00,
        date: new Date('2024-11-10'),
      },
    ],
  })
  console.log('✅ Financeiro criado')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('═══════════════════════════════════════')
  console.log('📧 Admin: admin@jl3d.com / admin123')
  console.log('📧 Operador: operador@jl3d.com / operador123')
  console.log('═══════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
