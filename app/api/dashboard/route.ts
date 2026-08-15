import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();

    const [
      clientsCount,
      projectsCount,
      activeProjects,
      leadsCount,
      leadsByStage,
      projects,
      recentSiteReports,
      openIssuesCount,
      financeEntries,
      quotations
    ] = await Promise.all([
      prisma.client.count(),
      prisma.project.count(),
      prisma.project.findMany({
        include: {
          client: true,
          projectManager: true,
          milestones: true,
          _count: {
            select: { issues: true, tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lead.count(),
      prisma.lead.groupBy({
        by: ['stage'],
        _count: { _all: true }
      }),
      prisma.project.findMany({
        select: {
          contractValue: true,
          approvedBudget: true,
          actualCost: true
        }
      }),
      prisma.siteReport.findMany({
        take: 5,
        include: {
          project: true,
          supervisor: true,
          photos: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.issue.count({
        where: { status: { in: ['Open', 'Action Taken'] } }
      }),
      prisma.financeEntry.findMany(),
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalContractValue = projects.reduce((acc, p) => acc + p.contractValue, 0);
    const totalActualCost = projects.reduce((acc, p) => acc + p.actualCost, 0);
    const totalBudget = projects.reduce((acc, p) => acc + p.approvedBudget, 0);
    const totalRevenue = financeEntries
      .filter(f => f.type === 'Invoice' || f.type === 'Client Payment')
      .reduce((acc, f) => acc + f.amount, 0);
    const grossProfit = totalContractValue - totalActualCost;
    const profitMargin = totalContractValue > 0 ? ((grossProfit / totalContractValue) * 100).toFixed(1) : 0;

    return NextResponse.json({
      metrics: {
        clientsCount,
        projectsCount,
        leadsCount,
        openIssuesCount,
        totalContractValue,
        totalActualCost,
        totalBudget,
        totalRevenue,
        grossProfit,
        profitMargin
      },
      leadsByStage,
      activeProjects,
      recentSiteReports,
      recentQuotations: quotations
    });
  } catch (error: any) {
    console.error('Error fetching dashboard API:', error);
    return NextResponse.json({ error: error.message || 'Failed to load dashboard' }, { status: 500 });
  }
}
