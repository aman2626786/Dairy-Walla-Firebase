import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { distributorId: '6a2e6b4883c3e02206dbf2d7' }
  });
  
  for (const p of products) {
    console.log(`Product: ${p.name} | CreatedAt: ${p.createdAt} | ID: ${p.id} | Image: ${p.imageUrl}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
