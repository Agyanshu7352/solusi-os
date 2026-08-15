import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    const [materials, purchaseOrders, inventoryTxns] = await Promise.all([
      prisma.material.findMany({ orderBy: { code: 'asc' } }),
      prisma.purchaseOrder.findMany({
        include: { project: true, items: { include: { material: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.inventoryTransaction.findMany({
        include: { material: true, project: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    return NextResponse.json({ materials, purchaseOrders, inventoryTxns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    if (body.type === 'material') {
      const code = `MAT-${body.category?.substring(0, 3).toUpperCase() || 'GEN'}-${Math.floor(100 + Math.random() * 900)}`;
      const material = await prisma.material.create({
        data: {
          code,
          name: body.name,
          category: body.category || 'General',
          unit: body.unit || 'nos',
          supplier: body.supplier || null,
          unitRate: body.unitRate ? parseFloat(body.unitRate) : 0,
          stockQty: body.stockQty ? parseFloat(body.stockQty) : 0,
          imageUrl: body.imageUrl || null
        }
      });
      return NextResponse.json(material);
    } else {
      const poNo = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;
      const po = await prisma.purchaseOrder.create({
        data: {
          poNo,
          projectId: body.projectId,
          vendorName: body.vendorName,
          status: body.status || 'Draft',
          totalAmount: body.totalAmount ? parseFloat(body.totalAmount) : 0,
          items: body.items ? {
            create: body.items.map((i: any) => ({
              itemName: i.itemName,
              materialId: i.materialId || null,
              quantity: parseFloat(i.quantity),
              unitRate: parseFloat(i.unitRate),
              total: parseFloat(i.quantity) * parseFloat(i.unitRate)
            }))
          } : undefined
        },
        include: { items: true }
      });
      return NextResponse.json(po);
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

    if (type === 'po') {
      await prisma.purchaseOrderItem.deleteMany({ where: { poId: id } });
      await prisma.purchaseOrder.delete({ where: { id } });
    } else {
      await prisma.material.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
