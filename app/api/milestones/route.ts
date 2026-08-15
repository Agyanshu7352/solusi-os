import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const milestone = await prisma.milestone.create({
      data: {
        projectId: body.projectId,
        phase: body.phase,
        name: body.name,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : null,
        plannedFinish: body.plannedFinish ? new Date(body.plannedFinish) : null,
        status: body.status || 'Pending',
        progress: body.progress ? parseFloat(body.progress) : 0,
        responsiblePerson: body.responsiblePerson || null,
        notes: body.notes || null,
        sortOrder: body.sortOrder ? parseInt(body.sortOrder) : 0
      }
    });
    return NextResponse.json(milestone);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const { id, status, progress, actualFinish, notes, name, phase } = body;
    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(progress !== undefined && { progress: parseFloat(progress) }),
        ...(actualFinish && { actualFinish: new Date(actualFinish) }),
        ...(notes !== undefined && { notes }),
        ...(name && { name }),
        ...(phase && { phase })
      }
    });

    // Recalculate project overall progress %
    const milestones = await prisma.milestone.findMany({
      where: { projectId: updated.projectId }
    });
    if (milestones.length > 0) {
      const avgProgress = milestones.reduce((acc, m) => acc + m.progress, 0) / milestones.length;
      await prisma.project.update({
        where: { id: updated.projectId },
        data: { progress: Math.round(avgProgress) }
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing milestone ID' }, { status: 400 });

    const deleted = await prisma.milestone.delete({
      where: { id }
    });
    return NextResponse.json(deleted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
