import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    await requireAuth();

    const entries = await prisma.financeEntry.findMany({
      where: projectId ? { projectId } : undefined,
      include: { project: true },
      orderBy: { entryDate: 'desc' }
    });

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        contractValue: true,
        approvedBudget: true,
        actualCost: true
      }
    });

    const summary = projects.map(p => {
      const pEntries = entries.filter(e => e.projectId === p.id);
      const revenue = pEntries
        .filter(e => e.type === 'Invoice' || e.type === 'Client Payment')
        .reduce((a, b) => a + b.amount, 0);
      const materialCost = pEntries.filter(e => e.type === 'Material Cost').reduce((a, b) => a + b.amount, 0);
      const labourCost = pEntries.filter(e => e.type === 'Labour Cost').reduce((a, b) => a + b.amount, 0);
      const totalCost = p.actualCost || (materialCost + labourCost);
      const grossProfit = p.contractValue - totalCost;
      const margin = p.contractValue > 0 ? (grossProfit / p.contractValue) * 100 : 0;

      return {
        id: p.id,
        name: p.name,
        contractValue: p.contractValue,
        actualCost: totalCost,
        revenue,
        grossProfit,
        margin: Math.round(margin * 10) / 10
      };
    });

    return NextResponse.json({ entries, summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const entry = await prisma.financeEntry.create({
      data: {
        projectId: body.projectId || null,
        type: body.type, // Invoice, Client Payment, Material Cost, Labour Cost, Subcontractor Cost, Overhead
        category: body.category || null,
        referenceNo: body.referenceNo || null,
        amount: parseFloat(body.amount),
        paymentMode: body.paymentMode || 'Bank Transfer',
        status: body.status || 'Completed',
        notes: body.notes || null
      }
    });

    // If it's a cost entry, update actualCost in Project table
    if (body.projectId && ['Material Cost', 'Labour Cost', 'Subcontractor Cost', 'Expense'].includes(body.type)) {
      const project = await prisma.project.findUnique({ where: { id: body.projectId } });
      if (project) {
        await prisma.project.update({
          where: { id: body.projectId },
          data: { actualCost: project.actualCost + parseFloat(body.amount) }
        });
      }
    }

    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  try {
    await requireAuth();

    await prisma.financeEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
