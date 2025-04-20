const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create sample products
  const products = [
    {
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake with a smooth ganache frosting',
      price: 35.99,
      imageUrl: 'https://placehold.co/400x300?text=Chocolate+Cake',
      available: true
    },
    {
      name: 'Vanilla Cupcakes',
      description: 'Light and fluffy vanilla cupcakes with buttercream frosting',
      price: 2.99,
      imageUrl: 'https://placehold.co/400x300?text=Vanilla+Cupcakes',
      available: true
    },
    {
      name: 'Sourdough Bread',
      description: 'Artisanal sourdough bread baked fresh daily',
      price: 6.99,
      imageUrl: 'https://placehold.co/400x300?text=Sourdough+Bread',
      available: true
    },
    {
      name: 'Croissant',
      description: 'Buttery, flaky French pastry',
      price: 3.49,
      imageUrl: 'https://placehold.co/400x300?text=Croissant',
      available: true
    },
    {
      name: 'Cinnamon Roll',
      description: 'Sweet roll with cinnamon-sugar filling and cream cheese frosting',
      price: 4.99,
      imageUrl: 'https://placehold.co/400x300?text=Cinnamon+Roll',
      available: true
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: products.indexOf(product) + 1 },
      update: product,
      create: product,
    });
  }

  // Create a sample user
  const user = {
    email: 'customer@example.com',
    name: 'Sample Customer'
  };

  await prisma.user.upsert({
    where: { email: user.email },
    update: user,
    create: user,
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
