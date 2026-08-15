import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  try {
    await requireAuth();

    const reports = await prisma.siteReport.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
        supervisor: true,
        photos: true
      },
      orderBy: { reportDate: 'desc' }
    });
    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const report = await prisma.siteReport.create({
      data: {
        projectId: body.projectId,
        supervisorId: body.supervisorId || null,
        labourPresent: body.labourPresent ? parseInt(body.labourPresent) : 0,
        workCompleted: body.workCompleted,
        materialsRecd: body.materialsRecd || null,
        remarks: body.remarks || null,
        weather: body.weather || 'Clear',
        photos: body.photoUrl ? {
          create: [{
            imageUrl: body.photoUrl,
            caption: body.photoCaption || 'Site Progress Photo',
            tag: 'Progress'
          }]
        } : body.photos ? {
          create: body.photos.map((p: any) => ({
            imageUrl: p.imageUrl,
            caption: p.caption || null,
            tag: p.tag || 'Progress'
          }))
        } : undefined
      },
      include: { photos: true }
    });
    return NextResponse.json(report);
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

    await prisma.sitePhoto.deleteMany({ where: { reportId: id } });
    await prisma.siteReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
