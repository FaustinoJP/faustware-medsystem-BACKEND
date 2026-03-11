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


// ============================================================
// .env (exemplo)
// ============================================================
// DATABASE_URL="postgresql://postgres:postgres@localhost:5432/faustware_medsystem?schema=public"
// JWT_SECRET="faustware-medsystem-super-secret"
// JWT_EXPIRES_IN="1d"
// PORT=4000

// ============================================================
// package.json (dependências principais sugeridas)
// ============================================================
// {
//   "dependencies": {
//     "@nestjs/common": "^11.0.0",
//     "@nestjs/config": "^4.0.0",
//     "@nestjs/core": "^11.0.0",
//     "@nestjs/jwt": "^11.0.0",
//     "@nestjs/passport": "^11.0.0",
//     "@nestjs/platform-express": "^11.0.0",
//     "@nestjs/swagger": "^11.0.0",
//     "@prisma/client": "^6.0.0",
//     "bcryptjs": "^3.0.2",
//     "class-transformer": "^0.5.1",
//     "class-validator": "^0.14.1",
//     "passport": "^0.7.0",
//     "passport-jwt": "^4.0.1",
//     "reflect-metadata": "^0.2.2",
//     "rxjs": "^7.8.1"
//   },
//   "devDependencies": {
//     "@nestjs/cli": "^11.0.0",
//     "@nestjs/schematics": "^11.0.0",
//     "@nestjs/testing": "^11.0.0",
//     "@types/bcryptjs": "^2.4.6",
//     "@types/node": "^22.0.0",
//     "@types/passport-jwt": "^4.0.1",
//     "prisma": "^6.0.0",
//     "ts-node": "^10.9.2",
//     "typescript": "^5.7.0"
//   }
// }

// ============================================================
// COMANDOS INICIAIS
// ============================================================
// npm install
// npx prisma generate
// npx prisma migrate dev --name init
// npx ts-node prisma/seed.ts
// npm run start:dev
