import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    await requireAuth();

    const [designItems, moodboards] = await Promise.all([
      prisma.designItem.findMany({
        where: projectId ? { projectId } : undefined,
        include: { project: true, approvals: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.moodboard.findMany({
        where: projectId ? { projectId } : undefined,
        include: { project: true, items: { include: { material: true } }, approvals: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    return NextResponse.json({ designItems, moodboards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();

    if (body.type === 'moodboard') {
      const moodboard = await prisma.moodboard.create({
        data: {
          projectId: body.projectId,
          name: body.title,
          description: body.notes || null,
          status: body.status || 'Draft'
        }
      });
      return NextResponse.json(moodboard);
    } else {
      const designItem = await prisma.designItem.create({
        data: {
          projectId: body.projectId,
          type: body.designType || '3D Render',
          title: body.title,
          fileUrl: body.fileUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
          status: body.status || 'Draft',
          notes: body.notes || null
        }
      });

      // Automatically create a client approval request for new design item
      await prisma.clientApproval.create({
        data: {
          projectId: body.projectId,
          type: 'Design',
          title: `${body.designType || 'Design'}: ${body.title}`,
          designItemId: designItem.id,
          status: 'Pending'
        }
      });

      return NextResponse.json(designItem);
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
    await requireAuth();

    if (type === 'moodboard') {
      await prisma.moodboardItem.deleteMany({ where: { moodboardId: id } });
      await prisma.clientApproval.deleteMany({ where: { moodboardId: id } });
      await prisma.moodboard.delete({ where: { id } });
    } else {
      await prisma.clientApproval.deleteMany({ where: { designItemId: id } });
      await prisma.designItem.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
