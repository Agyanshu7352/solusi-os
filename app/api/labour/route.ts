import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [workers, assignments] = await Promise.all([
      prisma.tradeWorker.findMany({
        include: { assignments: { include: { project: true } } },
        orderBy: { name: 'asc' }
      }),
      prisma.labourAssignment.findMany({
        include: { worker: true, project: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    return NextResponse.json({ workers, assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.type === 'worker') {
      const worker = await prisma.tradeWorker.create({
        data: {
          name: body.name,
          trade: body.trade,
          phone: body.phone || null,
          dailyRate: body.dailyRate ? parseFloat(body.dailyRate) : 0,
          rating: body.rating ? parseFloat(body.rating) : 5.0
        }
      });
      return NextResponse.json(worker);
    } else {
      const assignment = await prisma.labourAssignment.create({
        data: {
          projectId: body.projectId,
          workerId: body.workerId,
          taskName: body.taskName,
          completionPct: body.completionPct ? parseFloat(body.completionPct) : 0,
          status: body.status || 'Assigned',
          dueDate: body.dueDate ? new Date(body.dueDate) : null
        }
      });
      return NextResponse.json(assignment);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  try {
    if (type === 'worker') {
      await prisma.labourAssignment.deleteMany({ where: { workerId: id } });
      await prisma.tradeWorker.delete({ where: { id } });
    } else {
      await prisma.labourAssignment.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
