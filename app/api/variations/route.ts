import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    const variations = await prisma.variationRequest.findMany({
      where: projectId ? { projectId } : undefined,
      include: { project: true, approvals: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(variations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const variationNo = `VAR-2026-${Math.floor(100 + Math.random() * 900)}`;

    const variation = await prisma.variationRequest.create({
      data: {
        variationNo,
        projectId: body.projectId,
        title: body.title,
        type: body.type || 'Addition',
        reason: body.reason || null,
        costDifference: body.costDifference ? parseFloat(body.costDifference) : 0,
        priceImpact: body.priceImpact ? parseFloat(body.priceImpact) : 0,
        status: body.status || 'Draft'
      }
    });

    // Create client approval request automatically
    await prisma.clientApproval.create({
      data: {
        projectId: body.projectId,
        type: 'Variation',
        title: `Variation ${variationNo}: ${body.title}`,
        variationId: variation.id,
        status: 'Pending'
      }
    });

    return NextResponse.json(variation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    const updated = await prisma.variationRequest.update({
      where: { id },
      data: {
        status,
        ...(status === 'Client Approved' && { approvedAt: new Date() })
      }
    });

    // If client approved, update the contract value of the project
    if (status === 'Client Approved') {
      const project = await prisma.project.findUnique({ where: { id: updated.projectId } });
      if (project) {
        await prisma.project.update({
          where: { id: updated.projectId },
          data: { contractValue: project.contractValue + updated.priceImpact }
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
    await prisma.clientApproval.deleteMany({ where: { variationId: id } });
    await prisma.variationRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
