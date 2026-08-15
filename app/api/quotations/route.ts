import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    await requireAuth();

    const quotations = await prisma.quotation.findMany({
      where: projectId ? { projectId } : undefined,
      include: { project: true, client: true, lead: true, boqLines: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(quotations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const quoteNo = `QUO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const materialCost = parseFloat(body.materialCost || '0');
    const labourCost = parseFloat(body.labourCost || '0');
    const overheads = parseFloat(body.overheads || '0');
    const markupPct = parseFloat(body.markupPct || '18');

    const subtotal = (materialCost + labourCost + overheads) * (1 + markupPct / 100);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const quotation = await prisma.quotation.create({
      data: {
        quoteNo,
        projectId: body.projectId || null,
        clientId: body.clientId || null,
        leadId: body.leadId || null,
        title: body.title,
        materialCost,
        labourCost,
        overheads,
        markupPct,
        subtotal,
        tax,
        total,
        targetMargin: parseFloat(body.targetMargin || '20'),
        status: body.status || 'Draft',
        advancePaid: parseFloat(body.advancePaid || '0')
      }
    });

    return NextResponse.json(quotation);
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

    await prisma.boqLine.deleteMany({ where: { quotationId: id } });
    await prisma.quotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
