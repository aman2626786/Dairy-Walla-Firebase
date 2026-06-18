import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const recentProducts = await prisma.product.findMany({
    where: { createdAt: { gte: threeDaysAgo } }
  });
  
  console.log(`Products created in last 3 days: ${recentProducts.length}`);
  for (const p of recentProducts) {
    console.log(`Product: ${p.name} | CreatedAt: ${p.createdAt} | Image: ${p.imageUrl}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
