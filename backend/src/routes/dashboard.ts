import { FastifyInstance } from 'fastify'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { success } from '../utils/response'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  // GET /api/dashboard — KPIs e dados para o dashboard
  app.get('/', async (_request, reply) => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // KPIs do mês atual
    const [
      monthRevenue,
      activeOrders,
      monthExpenses,
      activeClients,
      lowStockFilaments,
      recentOrders,
    ] = await Promise.all([
      // Receita do mês (recebidas)
      prisma.revenue.aggregate({
        where: { status: 'RECEIVED', paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      // Pedidos em andamento
      prisma.order.count({
        where: { status: { in: ['PENDING', 'PRINTING', 'POST_PROCESS', 'READY'] } },
      }),
      // Despesas do mês
      prisma.expense.aggregate({
        where: { date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      // Clientes ativos (com pelo menos 1 pedido)
      prisma.client.count({ where: { isActive: true } }),
      // Filamentos abaixo do mínimo
      prisma.filament.findMany({
        where: { isActive: true },
        select: { id: true, name: true, colorHex: true, colorName: true, currentWeightG: true, minStockG: true },
      }),
      // Últimos 5 pedidos
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, number: true, status: true, total: true, createdAt: true,
          client: { select: { name: true } },
        },
      }),
    ])

    const lowStock = lowStockFilaments.filter(f => f.currentWeightG <= f.minStockG)

    // Receita dos últimos 6 meses
    const revenueByMonth = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(now, 5 - i)
        return prisma.revenue.aggregate({
          where: {
            status: 'RECEIVED',
            paidAt: { gte: startOfMonth(month), lte: endOfMonth(month) },
          },
          _sum: { amount: true },
        }).then(r => ({
          month: format(month, 'MMM/yy'),
          value: r._sum.amount || 0,
        }))
      })
    )

    // Pedidos por status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    })

    // Top 5 produtos mais vendidos
    const topProducts = await prisma.orderItem.groupBy({
      by: ['name'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    })

    // Distribuição de materiais
    const materialDistribution = await prisma.orderItem.groupBy({
      by: ['filamentId'],
      _count: true,
      where: { filamentId: { not: null } },
    })

    const filamentNames = await prisma.filament.findMany({
      where: { id: { in: materialDistribution.map(m => m.filamentId!).filter(Boolean) } },
      select: { id: true, name: true, colorHex: true },
    })

    const materialData = materialDistribution.map(m => {
      const fil = filamentNames.find(f => f.id === m.filamentId)
      return { name: fil?.name || 'Desconhecido', count: m._count, color: fil?.colorHex || '#8E9196' }
    })

    // Lucro estimado do mês
    const revenue = monthRevenue._sum.amount || 0
    const expenses = monthExpenses._sum.amount || 0
    const profit = revenue - expenses
    const profitPercent = revenue > 0 ? (profit / revenue) * 100 : 0

    return reply.send(success({
      kpis: {
        monthRevenue: revenue,
        activeOrders,
        profitEstimate: profit,
        profitPercent: Math.round(profitPercent * 10) / 10,
        activeClients,
        lowStockCount: lowStock.length,
      },
      charts: {
        revenueByMonth,
        ordersByStatus: ordersByStatus.map(o => ({ status: o.status, count: o._count })),
        topProducts: topProducts.map(p => ({
          name: p.name,
          quantity: p._sum.quantity || 0,
          revenue: p._sum.totalPrice || 0,
        })),
        materialDistribution: materialData,
      },
      alerts: {
        lowStockFilaments: lowStock,
      },
      recentOrders,
    }))
  })
}
