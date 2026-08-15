import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    await requireAuth();

    const issues = await prisma.issue.findMany({
      where: projectId ? { projectId } : undefined,
      include: { project: true, assignedTo: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(issues);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const issue = await prisma.issue.create({
      data: {
        projectId: body.projectId,
        title: body.title,
        category: body.category || 'Quality',
        severity: body.severity || 'Medium',
        status: body.status || 'Open',
        description: body.description || null,
        photoUrl: body.photoUrl || null,
        assignedToId: body.assignedToId || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        actionPlan: body.actionPlan || null
      }
    });
    return NextResponse.json(issue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const { id, status, actionPlan, severity } = body;
    const updated = await prisma.issue.update({
      where: { id },
      data: {
        ...(status && {
          status,
          resolvedAt: status === 'Resolved' || status === 'Closed' ? new Date() : null
        }),
        ...(actionPlan !== undefined && { actionPlan }),
        ...(severity && { severity })
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

    await prisma.issue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
