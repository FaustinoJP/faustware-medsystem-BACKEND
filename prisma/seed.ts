import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Administrador do sistema',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@faustware.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@faustware.com',
      passwordHash: await bcrypt.hash('123456', 10),
      roleId: adminRole.id,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Seed executada com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
