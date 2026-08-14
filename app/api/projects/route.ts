import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: true,
          projectManager: true,
          supervisor: true,
          milestones: {
            include: { tasks: true },
            orderBy: { sortOrder: 'asc' }
          },
          tasks: { orderBy: { createdAt: 'desc' } },
          designItems: { orderBy: { createdAt: 'desc' } },
          moodboards: { include: { items: true }, orderBy: { createdAt: 'desc' } },
          approvals: { orderBy: { createdAt: 'desc' } },
          quotations: { include: { boqLines: true } },
          boqLines: true,
          variations: { include: { approvals: true } },
          siteReports: { include: { photos: true, supervisor: true }, orderBy: { createdAt: 'desc' } },
          labourAssignments: { include: { worker: true } },
          issues: { orderBy: { createdAt: 'desc' } },
          purchaseOrders: { include: { items: true } },
          financeEntries: { orderBy: { entryDate: 'desc' } }
        }
      });
      return NextResponse.json(project);
    }

    const projects = await prisma.project.findMany({
      include: {
        client: true,
        projectManager: true,
        supervisor: true,
        milestones: true,
        _count: {
          select: { tasks: true, issues: true, siteReports: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const project = await prisma.project.create({
      data: {
        name: body.name,
        code,
        clientId: body.clientId || null,
        location: body.location || null,
        areaSqFt: body.areaSqFt ? parseFloat(body.areaSqFt) : null,
        contractValue: body.contractValue ? parseFloat(body.contractValue) : 0,
        approvedBudget: body.approvedBudget ? parseFloat(body.approvedBudget) : 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status || 'Planning'
      }
    });

    // Create default 7 standard execution milestones
    const defaultMilestones = [
      { phase: 'Pre-Execution', name: 'Site Measurement & Technical Survey', sortOrder: 1 },
      { phase: 'Design', name: '3D Render Approval & Working Drawings', sortOrder: 2 },
      { phase: 'Procurement', name: 'Long-lead Materials Purchase & Vendor POs', sortOrder: 3 },
      { phase: 'Civil & MEP', name: 'Partition Framing, Electrical & Plumbing Lines', sortOrder: 4 },
      { phase: 'Furniture & Interiors', name: 'Woodwork Paneling & Workstations Assembly', sortOrder: 5 },
      { phase: 'Finalisation', name: 'Deep Clean, Snag Fixes & Testing', sortOrder: 6 },
      { phase: 'Commercial Closure', name: 'Client Handover & Final Invoice Sign-off', sortOrder: 7 }
    ];

    for (const m of defaultMilestones) {
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          phase: m.phase,
          name: m.name,
          sortOrder: m.sortOrder,
          status: 'Pending',
          progress: 0
        }
      });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, progress, status, contractValue, approvedBudget, actualCost } = body;
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(progress !== undefined && { progress: parseFloat(progress) }),
        ...(status && { status }),
        ...(contractValue !== undefined && { contractValue: parseFloat(contractValue) }),
        ...(approvedBudget !== undefined && { approvedBudget: parseFloat(approvedBudget) }),
        ...(actualCost !== undefined && { actualCost: parseFloat(actualCost) })
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
    // Delete cascading child elements
    await prisma.milestone.deleteMany({ where: { projectId: id } });
    await prisma.task.deleteMany({ where: { projectId: id } });
    await prisma.designItem.deleteMany({ where: { projectId: id } });
    await prisma.moodboard.deleteMany({ where: { projectId: id } });
    await prisma.clientApproval.deleteMany({ where: { projectId: id } });
    await prisma.siteReport.deleteMany({ where: { projectId: id } });
    await prisma.labourAssignment.deleteMany({ where: { projectId: id } });
    await prisma.issue.deleteMany({ where: { projectId: id } });
    await prisma.variationRequest.deleteMany({ where: { projectId: id } });
    await prisma.financeEntry.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
