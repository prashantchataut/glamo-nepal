import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@glamonepal.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe@123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  const categories = [
    { name: "Skincare", slug: "skincare", description: "Face creams, serums, cleansers, and more" },
    { name: "Makeup", slug: "makeup", description: "Lipstick, foundation, eyeshadow, and more" },
    { name: "Hair Care", slug: "hair-care", description: "Shampoo, conditioner, hair oils, and treatments" },
    { name: "Body Care", slug: "body-care", description: "Body lotions, scrubs, and bath essentials" },
    { name: "Fragrance", slug: "fragrance", description: "Perfumes and body mists" },
    { name: "Tools & Brushes", slug: "tools-brushes", description: "Makeup brushes, sponges, and beauty tools" },
    { name: "Sun Care", slug: "sun-care", description: "Sunscreens and after-sun care" },
    { name: "Men's Grooming", slug: "mens-grooming", description: "Skincare and grooming essentials for men" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
      },
    });
  }
  console.log(`Created ${categories.length} categories`);

  const settings = [
    { key: "site_name", value: "GLAMO Nepal", group: "general" },
    { key: "site_tagline", value: "Beauty, Cosmetics & Skincare", group: "general" },
    { key: "site_description", value: "Nepal's premier beauty and cosmetics destination", group: "general" },
    { key: "contact_email", value: "admin@glamonepal.com", group: "contact" },
    { key: "contact_phone", value: "+977 9818212188", group: "contact" },
    { key: "contact_address", value: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal", group: "contact" },
    { key: "instagram_handle", value: "@glamo_nepal", group: "social" },
    { key: "instagram_url", value: "https://www.instagram.com/glamo_nepal/", group: "social" },
    { key: "currency", value: "NPR", group: "general" },
    { key: "free_shipping_threshold", value: "2000", group: "shipping" },
    { key: "flat_shipping_fee", value: "150", group: "shipping" },
    { key: "tax_rate", value: "0", group: "general" },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`Created ${settings.length} site settings`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });