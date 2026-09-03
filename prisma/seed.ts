import { PrismaClient, Role, LoanStatus, EventType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Users ────────────────────────────────────────────────────────────────
  const librarianPassword = await bcrypt.hash('librarian123', 12)
  const memberPassword = await bcrypt.hash('member123', 12)
  const member2Password = await bcrypt.hash('member234', 12)

  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.dev' },
    update: {},
    create: {
      email: 'librarian@library.dev',
      passwordHash: librarianPassword,
      name: 'Alex Librarian',
      role: Role.LIBRARIAN,
    },
  })

  const librarian2 = await prisma.user.upsert({
    where: { email: 'sam@library.dev' },
    update: {},
    create: {
      email: 'sam@library.dev',
      passwordHash: librarianPassword,
      name: 'Sam Keeper',
      role: Role.LIBRARIAN,
    },
  })

  const member = await prisma.user.upsert({
    where: { email: 'member@library.dev' },
    update: {},
    create: {
      email: 'member@library.dev',
      passwordHash: memberPassword,
      name: 'Jordan Member',
      role: Role.MEMBER,
    },
  })

  const member2 = await prisma.user.upsert({
    where: { email: 'casey@library.dev' },
    update: {},
    create: {
      email: 'casey@library.dev',
      passwordHash: member2Password,
      name: 'Casey Borrower',
      role: Role.MEMBER,
    },
  })

  console.log('✅ Users created')

  // ── Catalogue Items ──────────────────────────────────────────────────────
  const items = await Promise.all([
    prisma.catalogueItem.upsert({
      where: { code: 'CAM-001' },
      update: {},
      create: { title: 'Canon EOS R5 Camera', category: 'Photography', code: 'CAM-001' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'CAM-002' },
      update: {},
      create: { title: 'Sony A7 III Camera', category: 'Photography', code: 'CAM-002' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'PROJ-001' },
      update: {},
      create: { title: 'Epson EB-2250U Projector', category: 'AV Equipment', code: 'PROJ-001' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'PROJ-002' },
      update: {},
      create: { title: 'BenQ TH585P Projector', category: 'AV Equipment', code: 'PROJ-002' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'TOOL-001' },
      update: {},
      create: { title: 'DeWalt Cordless Drill Set', category: 'Tools', code: 'TOOL-001' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'TOOL-002' },
      update: {},
      create: { title: 'Bosch Circular Saw', category: 'Tools', code: 'TOOL-002' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'LENS-001' },
      update: {},
      create: { title: 'Canon 70-200mm f/2.8 Lens', category: 'Photography', code: 'LENS-001' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'AUDIO-001' },
      update: {},
      create: { title: 'Rode NTG5 Shotgun Microphone', category: 'Audio', code: 'AUDIO-001' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'AUDIO-002' },
      update: {},
      create: { title: 'Zoom H6 Field Recorder', category: 'Audio', code: 'AUDIO-002' },
    }),
    prisma.catalogueItem.upsert({
      where: { code: 'ARCH-001' },
      update: {},
      create: { title: 'Old Overhead Projector (Archived)', category: 'AV Equipment', code: 'ARCH-001', archived: true },
    }),
  ])

  console.log('✅ Catalogue items created')

  // ── Custodians ───────────────────────────────────────────────────────────
  await prisma.catalogueItem.update({
    where: { code: 'CAM-001' },
    data: { custodians: { connect: [{ id: librarian.id }] } },
  })
  await prisma.catalogueItem.update({
    where: { code: 'CAM-002' },
    data: { custodians: { connect: [{ id: librarian.id }] } },
  })
  await prisma.catalogueItem.update({
    where: { code: 'LENS-001' },
    data: { custodians: { connect: [{ id: librarian.id }] } },
  })
  await prisma.catalogueItem.update({
    where: { code: 'PROJ-001' },
    data: { custodians: { connect: [{ id: librarian2.id }] } },
  })
  await prisma.catalogueItem.update({
    where: { code: 'PROJ-002' },
    data: { custodians: { connect: [{ id: librarian2.id }] } },
  })
  await prisma.catalogueItem.update({
    where: { code: 'AUDIO-001' },
    data: { custodians: { connect: [{ id: librarian2.id }] } },
  })

  console.log('✅ Custodians assigned')

  // ── Loans ────────────────────────────────────────────────────────────────
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 14)
  const pastDue = new Date()
  pastDue.setDate(pastDue.getDate() - 7)
  const pastReturned = new Date()
  pastReturned.setDate(pastReturned.getDate() - 5)

  await prisma.loan.create({
    data: {
      itemId: items[2].id,
      borrowerId: member.id,
      issuedById: librarian.id,
      processedById: librarian.id,
      status: LoanStatus.RETURNED,
      requestedAt: pastDate,
      issuedAt: pastDate,
      dueDate: pastDue,
      returnedAt: pastReturned,
      events: {
        create: [
          { eventType: EventType.REQUESTED, actorId: member.id, createdAt: pastDate },
          { eventType: EventType.ISSUED, actorId: librarian.id, createdAt: pastDate, note: 'Issued for department presentation' },
          { eventType: EventType.RETURNED, actorId: librarian.id, createdAt: pastReturned, note: 'Returned in good condition' },
        ],
      },
    },
  })

  const issuedDate = new Date()
  issuedDate.setDate(issuedDate.getDate() - 2)
  const futureDue = new Date()
  futureDue.setDate(futureDue.getDate() + 5)

  await prisma.loan.create({
    data: {
      itemId: items[0].id,
      borrowerId: member.id,
      issuedById: librarian.id,
      status: LoanStatus.ISSUED,
      requestedAt: issuedDate,
      issuedAt: issuedDate,
      dueDate: futureDue,
      events: {
        create: [
          { eventType: EventType.REQUESTED, actorId: member.id, createdAt: issuedDate },
          { eventType: EventType.ISSUED, actorId: librarian.id, createdAt: issuedDate, note: 'Approved for photoshoot project' },
        ],
      },
    },
  })

  const overdueIssuedDate = new Date()
  overdueIssuedDate.setDate(overdueIssuedDate.getDate() - 10)
  const overdueDue = new Date()
  overdueDue.setDate(overdueDue.getDate() - 3)

  await prisma.loan.create({
    data: {
      itemId: items[6].id,
      borrowerId: member2.id,
      issuedById: librarian.id,
      status: LoanStatus.ISSUED,
      requestedAt: overdueIssuedDate,
      issuedAt: overdueIssuedDate,
      dueDate: overdueDue,
      events: {
        create: [
          { eventType: EventType.REQUESTED, actorId: member2.id, createdAt: overdueIssuedDate },
          { eventType: EventType.ISSUED, actorId: librarian.id, createdAt: overdueIssuedDate },
        ],
      },
    },
  })

  await prisma.loan.create({
    data: {
      itemId: items[1].id,
      borrowerId: member2.id,
      status: LoanStatus.REQUESTED,
      requestedAt: new Date(),
      events: {
        create: [{ eventType: EventType.REQUESTED, actorId: member2.id }],
      },
    },
  })

  const lostDate = new Date()
  lostDate.setDate(lostDate.getDate() - 20)
  const lostDue = new Date()
  lostDue.setDate(lostDue.getDate() - 10)
  const lostAt = new Date()
  lostAt.setDate(lostAt.getDate() - 8)

  await prisma.loan.create({
    data: {
      itemId: items[7].id,
      borrowerId: member.id,
      issuedById: librarian2.id,
      processedById: librarian2.id,
      status: LoanStatus.LOST,
      requestedAt: lostDate,
      issuedAt: lostDate,
      dueDate: lostDue,
      lostAt: lostAt,
      events: {
        create: [
          { eventType: EventType.REQUESTED, actorId: member.id, createdAt: lostDate },
          { eventType: EventType.ISSUED, actorId: librarian2.id, createdAt: lostDate },
          { eventType: EventType.LOST, actorId: librarian2.id, createdAt: lostAt, note: 'Borrower reported item missing after event' },
        ],
      },
    },
  })

  for (let i = 1; i <= 6; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7 - 1)
    const due = new Date(d)
    due.setDate(due.getDate() + 5)
    const ret = new Date(due)
    ret.setDate(ret.getDate() + 1)
    await prisma.loan.create({
      data: {
        itemId: items[i % 5 + 3].id,
        borrowerId: i % 2 === 0 ? member.id : member2.id,
        issuedById: librarian.id,
        processedById: librarian.id,
        status: LoanStatus.RETURNED,
        requestedAt: d,
        issuedAt: d,
        dueDate: due,
        returnedAt: ret,
        events: {
          create: [
            { eventType: EventType.REQUESTED, actorId: i % 2 === 0 ? member.id : member2.id, createdAt: d },
            { eventType: EventType.ISSUED, actorId: librarian.id, createdAt: d },
            { eventType: EventType.RETURNED, actorId: librarian.id, createdAt: ret },
          ],
        },
      },
    })
  }

  console.log('✅ Loans and events created')
  console.log('\n🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
