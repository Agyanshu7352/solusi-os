import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    const clients = await prisma.client.findMany({
      include: {
        projects: true,
        leads: true,
        _count: { select: { projects: true, leads: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        company: body.company || null,
        email: body.email || null,
        phone: body.phone || null,
        city: body.city || null,
        unitBuildingName: body.unitBuildingName || null,
        unitNumber: body.unitNumber || null,
        status: body.status || 'Active'
      }
    });
    return NextResponse.json(client);
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

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
