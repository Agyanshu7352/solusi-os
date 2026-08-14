import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    const approvals = await prisma.clientApproval.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
        designItem: true,
        moodboard: true,
        variation: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(approvals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const approval = await prisma.clientApproval.create({
      data: {
        projectId: body.projectId,
        type: body.type || 'Design',
        title: body.title,
        status: 'Pending',
        clientNote: body.clientNote || null
      }
    });
    return NextResponse.json(approval);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, clientNote } = body;
    const updated = await prisma.clientApproval.update({
      where: { id },
      data: {
        status, // Approved, Rejected, Revision Requested
        ...(clientNote !== undefined && { clientNote }),
        decidedAt: new Date()
      }
    });

    // Sync with variation if approval is linked to variation
    if (updated.variationId && status === 'Approved') {
      const varReq = await prisma.variationRequest.update({
        where: { id: updated.variationId },
        data: { status: 'Client Approved', approvedAt: new Date() }
      });
      // Recalculate contract value
      const project = await prisma.project.findUnique({ where: { id: updated.projectId } });
      if (project) {
        await prisma.project.update({
          where: { id: updated.projectId },
          data: { contractValue: project.contractValue + varReq.priceImpact }
        });
      }
    }

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
    await prisma.clientApproval.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
