import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

// Must match lib/auth.ts hashing parameters
function hashPassword(password: string): string {
  const salt = randomBytes(32);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

// Default password for all seeded users (development only)
const DEFAULT_PASSWORD = 'solusi2026';

async function main() {
  console.log('Seeding Solusi OS database...');  // Clean existing tables
  await prisma.financeEntry.deleteMany();
  await prisma.clientApproval.deleteMany();
  await prisma.variationRequest.deleteMany();
  await prisma.boqLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.material.deleteMany();
  await prisma.labourAssignment.deleteMany();
  await prisma.tradeWorker.deleteMany();
  await prisma.sitePhoto.deleteMany();
  await prisma.siteReport.deleteMany();
  await prisma.moodboardItem.deleteMany();
  await prisma.moodboard.deleteMany();
  await prisma.designItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users / Team Members
  const adminUser = await prisma.user.create({
    data: {
      email: 'shivay7352@gmail.com',
      name: 'Shivay (Systems Admin)',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'owner',
      phone: '+91 98765 00000'
    }
  });

  const owner = await prisma.user.create({
    data: {
      email: 'shubham@solusidesign.com',
      name: 'Shubham Chaudhary',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'owner',
      phone: '+91 98765 43210'
    }
  });

  const pm = await prisma.user.create({
    data: {
      email: 'vikram.pm@solusidesign.com',
      name: 'Vikram Malhotra',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'pm',
      phone: '+91 98111 22334'
    }
  });

  const designer = await prisma.user.create({
    data: {
      email: 'ananya.design@solusidesign.com',
      name: 'Ananya Sharma',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'designer',
      phone: '+91 98222 33445'
    }
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'rajesh.site@solusidesign.com',
      name: 'Rajesh Kumar',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'supervisor',
      phone: '+91 98333 44556'
    }
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@techcorp.com',
      name: 'Aarav Mehta (TechCorp)',
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: 'client',
      phone: '+91 99000 11223'
    }
  });

  // 2. Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'TechCorp Solutions India',
      company: 'TechCorp Group',
      email: 'info@techcorp.com',
      phone: '+91 11 4567 8900',
      city: 'Cyber City, Gurugram',
      unitBuildingName: 'Horizon Two Towers',
      unitNumber: '8th & 9th Floor',
      status: 'Active'
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Apex Capital Advisors',
      company: 'Apex Capital Ltd',
      email: 'projects@apexcapital.in',
      phone: '+91 22 8899 0011',
      city: 'BKC, Mumbai',
      unitBuildingName: 'Maker Maxity',
      unitNumber: '5th Floor Suite B',
      status: 'Active'
    }
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Artisan Culinary Labs',
      company: 'Artisan Foods',
      email: 'hello@artisancafe.in',
      phone: '+91 80 3344 5566',
      city: 'Indiranagar, Bengaluru',
      unitBuildingName: '100ft Road Retail Hub',
      unitNumber: 'Ground & 1st Floor',
      status: 'Prospect'
    }
  });

  // 3. CRM Leads (Phase 2)
  const lead1 = await prisma.lead.create({
    data: {
      clientId: client1.id,
      contactName: 'Aarav Mehta',
      companyName: 'TechCorp Solutions',
      phone: '+91 99000 11223',
      email: 'aarav@techcorp.com',
      projectType: 'Office Workspace',
      estimatedArea: 14500,
      estimatedBudget: 18500000,
      stage: 'Won',
      notes: 'Turnkey commercial fitout for 180 seats + executive suites.',
      assignedToId: pm.id
    }
  });

  const lead2 = await prisma.lead.create({
    data: {
      clientId: client2.id,
      contactName: 'Priya Nambiar',
      companyName: 'Apex Capital',
      phone: '+91 98980 12345',
      email: 'p.nambiar@apexcapital.in',
      projectType: 'Financial Trading Floor',
      estimatedArea: 8500,
      estimatedBudget: 12000000,
      stage: 'Won',
      notes: 'High-end acoustic isolation, trading desks & boardrooms.',
      assignedToId: pm.id
    }
  });

  const lead3 = await prisma.lead.create({
    data: {
      clientId: client3.id,
      contactName: 'Rohan Deshmukh',
      companyName: 'Artisan Culinary',
      phone: '+91 97777 88888',
      email: 'rohan@artisancafe.in',
      projectType: 'Retail & Cafe Experience',
      estimatedArea: 3800,
      estimatedBudget: 6500000,
      stage: 'Quotation',
      siteVisitDate: new Date('2026-08-10'),
      notes: 'Industrial rustic aesthetic with specialty espresso bar layout.',
      assignedToId: pm.id
    }
  });

  const lead4 = await prisma.lead.create({
    data: {
      contactName: 'Meera Sengupta',
      companyName: 'NexGen BioHealth',
      phone: '+91 96666 55555',
      email: 'm.sengupta@nexgenbio.com',
      projectType: 'Medical Experience Center',
      estimatedArea: 6200,
      estimatedBudget: 9500000,
      stage: 'Design Discussion',
      siteVisitDate: new Date('2026-08-12'),
      notes: 'Cleanroom specifications & sterile luxury reception lounge.',
      assignedToId: pm.id
    }
  });

  // 4. Projects (Phase 1 & Phase 5)
  const project1 = await prisma.project.create({
    data: {
      name: 'TechCorp Headquarters Fitout',
      code: 'PRJ-2026-001',
      clientId: client1.id,
      leadId: lead1.id,
      location: 'Horizon Two Towers, Sector 43, Gurugram',
      areaSqFt: 14500,
      contractValue: 18500000,
      approvedBudget: 14800000,
      actualCost: 9200000,
      progress: 62,
      status: 'On Track',
      projectManagerId: pm.id,
      supervisorId: supervisor.id,
      startDate: new Date('2026-06-01'),
      dueDate: new Date('2026-09-30')
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Apex Capital Executive Floor',
      code: 'PRJ-2026-002',
      clientId: client2.id,
      leadId: lead2.id,
      location: 'Maker Maxity, BKC, Mumbai',
      areaSqFt: 8500,
      contractValue: 12400000,
      approvedBudget: 9800000,
      actualCost: 4500000,
      progress: 38,
      status: 'On Track',
      projectManagerId: pm.id,
      supervisorId: supervisor.id,
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-10-15')
    }
  });

  // 5. Milestones (Phase 5)
  const m1 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      phase: 'Pre-Execution',
      name: 'Site Measurement & Baseline Surveys',
      plannedStart: new Date('2026-06-01'),
      plannedFinish: new Date('2026-06-10'),
      actualFinish: new Date('2026-06-09'),
      status: 'Done',
      progress: 100,
      responsiblePerson: 'Rajesh Kumar (Supervisor)',
      sortOrder: 1
    }
  });

  const m2 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      phase: 'Design',
      name: 'Approved 3D Render & Working Drawings Package',
      plannedStart: new Date('2026-06-11'),
      plannedFinish: new Date('2026-06-30'),
      actualFinish: new Date('2026-06-28'),
      status: 'Done',
      progress: 100,
      responsiblePerson: 'Ananya Sharma (Lead Designer)',
      sortOrder: 2
    }
  });

  const m3 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      phase: 'Civil & MEP',
      name: 'Partition Walls, Electrical Conduits & HVAC Rough-ins',
      plannedStart: new Date('2026-07-01'),
      plannedFinish: new Date('2026-07-31'),
      actualFinish: new Date('2026-07-29'),
      status: 'Done',
      progress: 100,
      responsiblePerson: 'Rajesh Kumar (Supervisor)',
      sortOrder: 3
    }
  });

  const m4 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      phase: 'Furniture & Interiors',
      name: 'Acoustic Ceiling Panels & Modular Workstations Installation',
      plannedStart: new Date('2026-08-01'),
      plannedFinish: new Date('2026-08-25'),
      status: 'In Progress',
      progress: 55,
      responsiblePerson: 'Rajesh Kumar (Supervisor)',
      sortOrder: 4
    }
  });

  const m5 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      phase: 'Finalisation',
      name: 'Snagging, Deep Clean & Air Balance Testing',
      plannedStart: new Date('2026-08-26'),
      plannedFinish: new Date('2026-09-15'),
      status: 'Pending',
      progress: 0,
      responsiblePerson: 'Vikram Malhotra (PM)',
      sortOrder: 5
    }
  });

  // 6. Tasks & SOP Checklists (Phase 5 & 7)
  await prisma.task.createMany({
    data: [
      {
        projectId: project1.id,
        milestoneId: m4.id,
        title: 'Install Double-Glazed Glass Partitions in Cabin 1 to 6',
        category: 'Glasswork',
        priority: 'High',
        status: 'In Progress',
        assignedToId: supervisor.id,
        trade: 'Glasswork Specialist',
        dueDate: new Date('2026-08-18'),
        sopStep: 'SOP-GL-02: Laser alignment check before silicone sealing'
      },
      {
        projectId: project1.id,
        milestoneId: m4.id,
        title: 'Lay Italian Botticino Marble in Boardroom Entrance',
        category: 'Civil',
        priority: 'High',
        status: 'Completed',
        assignedToId: supervisor.id,
        trade: 'Mason',
        completedAt: new Date('2026-08-08'),
        sopStep: 'SOP-CV-05: Sub-floor leveling test'
      },
      {
        projectId: project1.id,
        milestoneId: m4.id,
        title: 'Cable Termination & DB Dressing in Server Room',
        category: 'MEP',
        priority: 'High',
        status: 'In Progress',
        assignedToId: supervisor.id,
        trade: 'Electrician',
        dueDate: new Date('2026-08-20'),
        sopStep: 'SOP-EL-04: Continuity and insulation testing'
      }
    ]
  });

  // 7. Design Studio & Moodboards (Phase 4)
  const d1 = await prisma.designItem.create({
    data: {
      projectId: project1.id,
      type: '3D Render',
      title: 'Executive Boardroom & Townhall 3D View v3',
      fileUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      version: 3,
      status: 'Approved',
      notes: 'Approved by Client on June 24th with warm oak acoustic louvers.'
    }
  });

  const moodboard1 = await prisma.moodboard.create({
    data: {
      projectId: project1.id,
      name: 'TechCorp Executive Suite Mood Palette',
      description: 'Walnut wood veneer, brushed brass trims, charcoal acoustic felt, leather finishes.',
      version: 2,
      status: 'Approved'
    }
  });

  // 8. Client Approvals Engine (Phase 4, 10, 12)
  await prisma.clientApproval.create({
    data: {
      projectId: project1.id,
      type: 'Design',
      title: 'Townhall & Reception 3D Visualizer Package',
      designItemId: d1.id,
      status: 'Approved',
      clientNote: 'Looks fantastic! Approved for procurement.',
      decidedAt: new Date('2026-06-25')
    }
  });

  // 9. Site Control (Phase 6)
  const report1 = await prisma.siteReport.create({
    data: {
      projectId: project1.id,
      supervisorId: supervisor.id,
      reportDate: new Date('2026-08-13'),
      labourPresent: 24,
      workCompleted: 'Completed acoustic ceiling framing in Zone B. Glass partition tracking 80% finished in Executive Cabins.',
      materialsRecd: 'Received 120 sq meters of acoustic felt panels from Saint-Gobain.',
      remarks: 'Work on schedule. HVAC duct pressure testing passed with zero leaks.',
      weather: 'Clear'
    }
  });

  await prisma.sitePhoto.createMany({
    data: [
      {
        reportId: report1.id,
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
        caption: 'Acoustic ceiling grid installation in main bay',
        tag: 'Progress'
      },
      {
        reportId: report1.id,
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
        caption: 'Glass partition tracking verification in Cabin 3',
        tag: 'Quality'
      }
    ]
  });

  // 10. Labour Management (Phase 7)
  const worker1 = await prisma.tradeWorker.create({
    data: {
      name: 'Gurmeet Singh & Crew',
      trade: 'Carpentry',
      phone: '+91 98199 00112',
      dailyRate: 1200,
      rating: 4.8
    }
  });

  const worker2 = await prisma.tradeWorker.create({
    data: {
      name: 'Ramesh Spark Line Electricians',
      trade: 'Electrician',
      phone: '+91 98299 11223',
      dailyRate: 1100,
      rating: 4.9
    }
  });

  await prisma.labourAssignment.createMany({
    data: [
      {
        projectId: project1.id,
        workerId: worker1.id,
        taskName: 'Wood Paneling & Fluted Louvers in Reception',
        completionPct: 75,
        status: 'In Progress',
        dueDate: new Date('2026-08-20')
      },
      {
        projectId: project1.id,
        workerId: worker2.id,
        taskName: 'Linear Architectural LED Light Fixtures Installation',
        completionPct: 60,
        status: 'In Progress',
        dueDate: new Date('2026-08-22')
      }
    ]
  });

  // 11. Materials & Procurement (Phase 8)
  const mat1 = await prisma.material.create({
    data: {
      code: 'MAT-GLS-001',
      name: '12mm Toughened Clear Glass Panel',
      category: 'Glass',
      unit: 'sqft',
      supplier: 'Saint-Gobain Glass India',
      unitRate: 185,
      stockQty: 2400,
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
    }
  });

  const mat2 = await prisma.material.create({
    data: {
      code: 'MAT-WOD-004',
      name: 'American Walnut Natural Wood Veneer',
      category: 'Woodwork',
      unit: 'sqft',
      supplier: 'Greenlam Industries',
      unitRate: 240,
      stockQty: 1800,
      imageUrl: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=600&q=80'
    }
  });

  const mat3 = await prisma.material.create({
    data: {
      code: 'MAT-LGT-012',
      name: '40W Continuous Linear Aluminum Recessed Profile LED',
      category: 'Lighting',
      unit: 'rft',
      supplier: 'Wipro Lighting Solutions',
      unitRate: 850,
      stockQty: 450,
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
    }
  });

  // Purchase Order
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNo: 'PO-2026-089',
      projectId: project1.id,
      vendorName: 'Saint-Gobain Glass India',
      status: 'Delivered',
      totalAmount: 444000,
      expectedDate: new Date('2026-08-05'),
      createdById: pm.id
    }
  });

  await prisma.purchaseOrderItem.create({
    data: {
      poId: po1.id,
      materialId: mat1.id,
      itemName: '12mm Toughened Clear Glass Panel',
      quantity: 2400,
      unitRate: 185,
      total: 444000,
      receivedQty: 2400
    }
  });

  // Inventory transaction
  await prisma.inventoryTransaction.create({
    data: {
      materialId: mat1.id,
      projectId: project1.id,
      type: 'Stock_In',
      quantity: 2400,
      unitRate: 185,
      reference: 'GRN-2026-089'
    }
  });

  // 12. Issues & Snags (Phase 9)
  await prisma.issue.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Executive Boardroom door frame misalignment by 3mm',
        category: 'Quality',
        severity: 'Medium',
        status: 'Action Taken',
        description: 'Carpenter instructed to re-shim jamb before veneer wrap.',
        assignedToId: supervisor.id,
        deadline: new Date('2026-08-16'),
        actionPlan: 'Re-align frame, test latching action, obtain supervisor signoff.'
      },
      {
        projectId: project1.id,
        title: 'Cable trench cover plate scratch during tile cutting',
        category: 'Damage',
        severity: 'Low',
        status: 'Open',
        description: 'Powder-coated metal plate scratched near workstation 14.',
        assignedToId: supervisor.id,
        deadline: new Date('2026-08-18'),
        actionPlan: 'Touch-up paint spray or replace plate.'
      }
    ]
  });

  // 13. Quotation, BOQ & Variations (Phase 3 & Phase 10)
  const quote1 = await prisma.quotation.create({
    data: {
      quoteNo: 'QUO-2026-042',
      projectId: project1.id,
      clientId: client1.id,
      leadId: lead1.id,
      title: 'TechCorp 14,500 sq ft Turnkey Commercial Office Fitout',
      materialCost: 9800000,
      labourCost: 4200000,
      overheads: 1200000,
      markupPct: 18,
      subtotal: 15200000,
      tax: 3300000,
      total: 18500000,
      targetMargin: 22.5,
      status: 'Approved',
      advancePaid: 3700000
    }
  });

  await prisma.boqLine.createMany({
    data: [
      {
        projectId: project1.id,
        quotationId: quote1.id,
        item: 'Double Glazed Acoustic Glass Partitioning',
        category: 'Glasswork',
        specification: '12mm toughened glass with anodized black aluminum tracks',
        quantity: 3800,
        unit: 'sqft',
        rate: 650,
        amount: 2470000,
        actualCost: 1950000
      },
      {
        projectId: project1.id,
        quotationId: quote1.id,
        item: 'Acoustic Baffle & Felt Ceiling Grid System',
        category: 'False Ceiling',
        specification: 'PET felt baffles NRC 0.85 fire-rated class A',
        quantity: 12000,
        unit: 'sqft',
        rate: 320,
        amount: 3840000,
        actualCost: 2900000
      },
      {
        projectId: project1.id,
        quotationId: quote1.id,
        item: 'Modular Height Adjustable Workstations (180 Pax)',
        category: 'Furniture',
        specification: 'Dual motor electric frame with wire management',
        quantity: 180,
        unit: 'nos',
        rate: 28000,
        amount: 5040000,
        actualCost: 4100000
      }
    ]
  });

  const variation1 = await prisma.variationRequest.create({
    data: {
      variationNo: 'VAR-2026-004',
      projectId: project1.id,
      title: 'Addition of Townhall LED Video Wall Backing Structure',
      type: 'Addition',
      reason: 'Client requested high-density P1.8 LED display in main lounge.',
      costDifference: 420000,
      priceImpact: 650000,
      status: 'Client Approved',
      approvedAt: new Date('2026-08-02')
    }
  });

  await prisma.clientApproval.create({
    data: {
      projectId: project1.id,
      type: 'Variation',
      title: 'Variation VAR-2026-004: Townhall Video Wall Backing',
      variationId: variation1.id,
      status: 'Approved',
      clientNote: 'Approved additional ₹6.5L for video wall framing.',
      decidedAt: new Date('2026-08-02')
    }
  });

  // 14. Finance & P&L (Phase 11)
  await prisma.financeEntry.createMany({
    data: [
      {
        projectId: project1.id,
        type: 'Invoice',
        category: 'Mobilization Advance',
        referenceNo: 'INV-2026-001',
        amount: 3700000,
        paymentMode: 'Bank Transfer',
        entryDate: new Date('2026-06-02'),
        status: 'Completed',
        notes: '20% Mobilization advance received.'
      },
      {
        projectId: project1.id,
        type: 'Client Payment',
        category: 'Milestone 2 Completion',
        referenceNo: 'RCT-2026-034',
        amount: 5550000,
        paymentMode: 'Bank Transfer',
        entryDate: new Date('2026-07-05'),
        status: 'Completed',
        notes: '30% Milestone payment upon Civil & MEP completion.'
      },
      {
        projectId: project1.id,
        type: 'Material Cost',
        category: 'Glass Supply',
        referenceNo: 'EXP-2026-102',
        amount: 444000,
        paymentMode: 'Bank Transfer',
        entryDate: new Date('2026-08-05'),
        status: 'Completed',
        notes: 'Paid Saint-Gobain PO-2026-089'
      },
      {
        projectId: project1.id,
        type: 'Labour Cost',
        category: 'Carpentry & Electrical Fortnightly Payout',
        referenceNo: 'EXP-2026-118',
        amount: 280000,
        paymentMode: 'Bank Transfer',
        entryDate: new Date('2026-08-10'),
        status: 'Completed'
      }
    ]
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
