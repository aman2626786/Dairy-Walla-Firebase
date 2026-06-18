import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  let count = 0;
  for (const p of products) {
    if (p.imageUrl && p.imageUrl.includes('firebase')) {
      count++;
      console.log(`Product: ${p.name} | Image: ${p.imageUrl}`);
    }
  }
  console.log(`Found ${count} products with firebase images`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
