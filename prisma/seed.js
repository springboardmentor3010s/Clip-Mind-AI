const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clipmind.ai' },
    update: {},
    create: {
      email: 'admin@clipmind.ai',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      bio: 'Platform administrator',
    },
  });

  // Create content creator
  const creatorPassword = await bcrypt.hash('Creator@123', 12);
  const creator = await prisma.user.upsert({
    where: { email: 'creator@clipmind.ai' },
    update: {},
    create: {
      email: 'creator@clipmind.ai',
      passwordHash: creatorPassword,
      name: 'Alex Creator',
      role: 'CONTENT_CREATOR',
      bio: 'Video content creator',
    },
  });

  // Create educator
  const educatorPassword = await bcrypt.hash('Educator@123', 12);
  const educator = await prisma.user.upsert({
    where: { email: 'educator@clipmind.ai' },
    update: {},
    create: {
      email: 'educator@clipmind.ai',
      passwordHash: educatorPassword,
      name: 'Dr. Sarah Educator',
      role: 'EDUCATOR',
      bio: 'University professor',
    },
  });

  // Create learner
  const learnerPassword = await bcrypt.hash('Learner@123', 12);
  const learner = await prisma.user.upsert({
    where: { email: 'learner@clipmind.ai' },
    update: {},
    create: {
      email: 'learner@clipmind.ai',
      passwordHash: learnerPassword,
      name: 'Jamie Learner',
      role: 'LEARNER',
      bio: 'Avid learner',
    },
  });

  console.log('✅ Seed users created:');
  console.log('  Admin:    admin@clipmind.ai / Admin@123');
  console.log('  Creator:  creator@clipmind.ai / Creator@123');
  console.log('  Educator: educator@clipmind.ai / Educator@123');
  console.log('  Learner:  learner@clipmind.ai / Learner@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
