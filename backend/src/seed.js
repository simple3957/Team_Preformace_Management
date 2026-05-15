require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding database...');

  // Create a manager
  const managerPassword = await bcrypt.hash('password123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: managerPassword,
      name: 'Alex Chen',
      role: 'manager'
    }
  });
  console.log('Created manager:', manager.name);

  // Create employees
  const empPassword = await bcrypt.hash('password123', 12);

  const employee1 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      password: empPassword,
      name: 'Sarah Johnson',
      role: 'employee',
      managerId: manager.id
    }
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'david@example.com' },
    update: {},
    create: {
      email: 'david@example.com',
      password: empPassword,
      name: 'David Kim',
      role: 'employee',
      managerId: manager.id
    }
  });

  const employee3 = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      email: 'maria@example.com',
      password: empPassword,
      name: 'Maria Rodriguez',
      role: 'employee',
      managerId: manager.id
    }
  });

  console.log('Created employees:', employee1.name, employee2.name, employee3.name);

  // Create a review cycle
  const cycle = await prisma.reviewCycle.upsert({
    where: { id: 'seed-cycle-q1-2024' },
    update: {},
    create: {
      id: 'seed-cycle-q1-2024',
      title: 'Q1 2024 Performance Review',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      status: 'Open',
      createdBy: manager.id
    }
  });
  console.log('Created review cycle:', cycle.title);

  // Create some goals for employee1
  await prisma.goal.createMany({
    data: [
      {
        title: 'Increase Sales by 15%',
        description: 'Implement new outreach strategies and track conversion rates.',
        status: 'In Progress',
        employeeId: employee1.id,
        reviewCycleId: cycle.id
      },
      {
        title: 'Complete Leadership Training',
        description: 'Attend three workshops and submit a reflection paper.',
        status: 'Not Started',
        employeeId: employee1.id,
        reviewCycleId: cycle.id
      }
    ]
  });

  await prisma.goal.createMany({
    data: [
      {
        title: 'Ship Feature X',
        description: 'Design, implement, and deploy the new feature by end of quarter.',
        status: 'In Progress',
        employeeId: employee2.id,
        reviewCycleId: cycle.id
      }
    ]
  });

  console.log('Created sample goals');
  console.log('\n--- Seed complete ---');
  console.log('Login credentials:');
  console.log('  Manager: manager@example.com / password123');
  console.log('  Employee 1: sarah@example.com / password123');
  console.log('  Employee 2: david@example.com / password123');
  console.log('  Employee 3: maria@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
