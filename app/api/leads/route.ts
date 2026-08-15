import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    const leads = await prisma.lead.findMany({
      include: {
        client: true,
        assignedTo: true,
        quotations: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const lead = await prisma.lead.create({
      data: {
        contactName: body.contactName,
        companyName: body.companyName || null,
        phone: body.phone || null,
        email: body.email || null,
        projectType: body.projectType || 'Office Workspace',
        estimatedArea: body.estimatedArea ? parseFloat(body.estimatedArea) : null,
        estimatedBudget: body.estimatedBudget ? parseFloat(body.estimatedBudget) : null,
        stage: body.stage || 'Lead',
        notes: body.notes || null,
        clientId: body.clientId || null,
        assignedToId: body.assignedToId || null
      }
    });
    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const { id, stage, notes } = body;
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(stage && { stage }),
        ...(notes !== undefined && { notes })
      }
    });
    return NextResponse.json(updated);
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

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
