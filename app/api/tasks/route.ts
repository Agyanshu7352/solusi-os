import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    await requireAuth();

    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      include: { milestone: true, assignedTo: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        projectId: body.projectId,
        milestoneId: body.milestoneId || null,
        title: body.title,
        category: body.category || 'General',
        priority: body.priority || 'Medium',
        status: body.status || 'Pending',
        assignedToId: body.assignedToId || null,
        trade: body.trade || null,
        sopStep: body.sopStep || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null
      }
    });
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const { id, status, priority, title } = body;
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(status && {
          status,
          completedAt: status === 'Completed' ? new Date() : null
        }),
        ...(priority && { priority }),
        ...(title && { title })
      }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
