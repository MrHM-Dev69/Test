import { PrismaClient, ProductDomain, ProductType, CourseLevel, LessonType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "مدیر ارشد",
  ADMIN: "مدیر",
  MANAGER: "مدیر بخش",
  SHOP_MANAGER: "مدیر فروشگاه",
  ACADEMY_MANAGER: "مدیر آکادمی",
  ACCOUNTANT: "حسابدار",
  SUPPORT: "پشتیبانی",
  EDITOR: "ویرایشگر",
  CUSTOMER: "مشتری",
};

async function seedRoles() {
  for (const [name, label] of Object.entries(ROLE_LABELS)) {
    await prisma.role.upsert({
      where: { name: name as never },
      update: {},
      create: { name: name as never, label },
    });
  }
}

async function seedUsers() {
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const customerRole = await prisma.role.findUniqueOrThrow({ where: { name: "CUSTOMER" } });

  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "مدیر سیستم",
      email: "admin@example.com",
      phone: "09120000000",
      passwordHash: adminPasswordHash,
      roleId: superAdminRole.id,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });

  const customerPasswordHash = await bcrypt.hash("Customer@12345", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "مشتری نمونه",
      email: "customer@example.com",
      phone: "09121111111",
      passwordHash: customerPasswordHash,
      roleId: customerRole.id,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });

  return { customer };
}

async function seedProfile() {
  const existing = await prisma.profile.findFirst();
  if (existing) return;
  await prisma.profile.create({
    data: {
      fullName: "علی رضایی",
      headline: "توسعه‌دهنده وب و نرم‌افزار | بیش از ۵ سال تجربه",
      bio: "توسعه‌دهنده باتجربه در حوزه وب، وردپرس، FiveM، VMP و MTA با تمرکز بر ساخت محصولات دیجیتال باکیفیت و آموزش برنامه‌نویسی.",
      email: "admin@example.com",
      phone: "09120000000",
      location: "تهران، ایران",
      availability: "در دسترس برای همکاری پروژه‌ای",
      yearsExperience: 5,
      socialLinks: { github: "https://github.com", linkedin: "https://linkedin.com" },
    },
  });
}

async function seedSkillsExperienceEducation() {
  const skillCount = await prisma.skill.count();
  if (skillCount === 0) {
    await prisma.skill.createMany({
      data: [
        { name: "Next.js", category: "Web", level: "EXPERT", order: 1 },
        { name: "TypeScript", category: "Web", level: "EXPERT", order: 2 },
        { name: "PostgreSQL / Prisma", category: "Backend", level: "ADVANCED", order: 3 },
        { name: "WordPress / WooCommerce", category: "WordPress", level: "ADVANCED", order: 4 },
        { name: "FiveM / Lua", category: "FiveM", level: "ADVANCED", order: 5 },
        { name: "MTA:SA", category: "MTA", level: "INTERMEDIATE", order: 6 },
      ],
    });
  }

  const expCount = await prisma.experience.count();
  if (expCount === 0) {
    await prisma.experience.create({
      data: {
        role: "توسعه‌دهنده ارشد وب",
        company: "فریلنسر",
        startDate: new Date("2020-01-01"),
        isCurrent: true,
        description: "طراحی و توسعه پلتفرم‌های وب، فروشگاه دیجیتال و اسکریپت‌های اختصاصی برای سرورهای گیمینگ.",
        order: 1,
      },
    });
  }

  const eduCount = await prisma.educationItem.count();
  if (eduCount === 0) {
    await prisma.educationItem.create({
      data: {
        degree: "کارشناسی",
        institution: "دانشگاه",
        fieldOfStudy: "مهندسی کامپیوتر",
        startDate: new Date("2021-09-01"),
        isCurrent: true,
        order: 1,
      },
    });
  }
}

async function seedCategoriesAndTags() {
  const categoryDefs = [
    { name: "توسعه وب", slug: "web-development", domain: ProductDomain.WEB },
    { name: "وردپرس", slug: "wordpress", domain: ProductDomain.WORDPRESS },
    { name: "فایوم", slug: "fivem", domain: ProductDomain.FIVEM },
    { name: "وی‌ام‌پی", slug: "vmp", domain: ProductDomain.VMP },
    { name: "ام‌تی‌ای", slug: "mta", domain: ProductDomain.MTA },
  ];

  const categories: Record<string, string> = {};
  for (const def of categoryDefs) {
    const category = await prisma.category.upsert({
      where: { slug: def.slug },
      update: {},
      create: def,
    });
    categories[def.slug] = category.id;
  }

  const tagDefs = ["React", "Next.js", "Tailwind", "Elementor", "Admin System", "Job System", "UI Kit"];
  for (const name of tagDefs) {
    await prisma.tag.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    });
  }

  return categories;
}

async function seedProducts(categories: Record<string, string>) {
  const productCount = await prisma.product.count();
  if (productCount > 0) return;

  await prisma.product.create({
    data: {
      title: "قالب پنل ادمین رایگان (React + Tailwind)",
      slug: "free-admin-dashboard-kit",
      description: "یک قالب پنل مدیریت رایگان و متن‌باز ساخته‌شده با React و Tailwind CSS، مناسب برای شروع سریع پروژه‌های داشبورد.",
      shortDescription: "قالب رایگان داشبورد مدیریتی",
      categoryId: categories["web-development"],
      domain: ProductDomain.WEB,
      productType: ProductType.FREE_PRODUCT,
      isFree: true,
      price: 0,
      isPublished: true,
      isFeatured: true,
      requirements: "Node.js 18+",
      compatibility: "React 18+, Next.js 14+",
    },
  });

  await prisma.product.create({
    data: {
      title: "سیستم اقتصادی پیشرفته FiveM",
      slug: "fivem-advanced-economy-system",
      description: "سیستم اقتصادی کامل برای سرورهای FiveM شامل بانک، مشاغل، و فروشگاه‌های درون‌بازی با پشتیبانی از ESX/QBCore.",
      shortDescription: "سیستم اقتصادی حرفه‌ای برای FiveM",
      categoryId: categories["fivem"],
      domain: ProductDomain.FIVEM,
      productType: ProductType.PREMIUM_PRODUCT,
      isFree: false,
      price: 1_200_000,
      salePrice: 950_000,
      isPublished: true,
      isFeatured: true,
      version: "2.1.0",
      license: "استفاده تجاری - تک سرور",
      downloadLimit: 5,
      downloadExpiryDays: 365,
      requirements: "ESX Legacy یا QBCore",
      compatibility: "FiveM Latest Build",
    },
  });

  await prisma.product.create({
    data: {
      title: "قالب فروشگاهی وردپرس پریمیوم",
      slug: "premium-woocommerce-theme",
      description: "قالب فروشگاهی حرفه‌ای برای ووکامرس با طراحی مدرن، سرعت بالا و پشتیبانی کامل از المنتور.",
      shortDescription: "قالب پریمیوم ووکامرس",
      categoryId: categories["wordpress"],
      domain: ProductDomain.WORDPRESS,
      productType: ProductType.PREMIUM_PRODUCT,
      isFree: false,
      price: 690_000,
      isPublished: true,
      version: "1.4.0",
      license: "استفاده تجاری - تک دامنه",
      downloadLimit: 5,
    },
  });
}

async function seedCourses(categories: Record<string, string>) {
  const courseCount = await prisma.course.count();
  if (courseCount > 0) return;

  const freeCourse = await prisma.course.create({
    data: {
      title: "شروع کار با Next.js",
      slug: "getting-started-with-nextjs",
      description: "دوره رایگان مقدماتی برای یادگیری Next.js از پایه تا ساخت اولین پروژه.",
      categoryId: categories["web-development"],
      domain: ProductDomain.WEB,
      level: CourseLevel.BEGINNER,
      durationMinutes: 120,
      isFree: true,
      price: 0,
      isPublished: true,
      isFeatured: true,
    },
  });

  const section = await prisma.courseSection.create({
    data: { courseId: freeCourse.id, title: "مقدمه", order: 1 },
  });

  await prisma.lesson.createMany({
    data: [
      { sectionId: section.id, title: "نصب و راه‌اندازی", type: LessonType.VIDEO, isPreview: true, order: 1, durationSeconds: 600 },
      { sectionId: section.id, title: "ساختار پروژه", type: LessonType.VIDEO, order: 2, durationSeconds: 900 },
      { sectionId: section.id, title: "روتینگ در App Router", type: LessonType.ARTICLE, order: 3 },
    ],
  });

  await prisma.course.create({
    data: {
      title: "دوره کامل توسعه اسکریپت FiveM",
      slug: "complete-fivem-scripting-course",
      description: "آموزش کامل توسعه اسکریپت برای FiveM شامل ساخت سیستم شغل، پلیس و اقتصاد.",
      categoryId: categories["fivem"],
      domain: ProductDomain.FIVEM,
      level: CourseLevel.INTERMEDIATE,
      durationMinutes: 600,
      isFree: false,
      price: 1_500_000,
      isPublished: true,
      isFeatured: true,
    },
  });
}

async function seedContentAndSettings() {
  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    await prisma.faqItem.createMany({
      data: [
        { question: "روش‌های پرداخت چیست؟", answer: "پرداخت از طریق درگاه‌های زرین‌پال و آیدی‌پی امکان‌پذیر است.", order: 1 },
        { question: "آیا امکان بازگشت وجه وجود دارد؟", answer: "بله، طبق قوانین بازگشت وجه امکان‌پذیر است.", order: 2 },
      ],
    });
  }

  const pageSlugs: Record<string, string> = {
    terms: "قوانین و مقررات",
    privacy: "حریم خصوصی",
    "refund-policy": "قوانین بازگشت وجه",
    license: "مجوز استفاده",
    "cookie-policy": "قوانین کوکی",
    disclaimer: "سلب مسئولیت",
  };
  for (const [slug, title] of Object.entries(pageSlugs)) {
    await prisma.page.upsert({
      where: { slug },
      update: {},
      create: { slug, title, body: `<p>محتوای صفحه ${title} در اینجا قرار می‌گیرد.</p>` },
    });
  }

  await prisma.setting.upsert({
    where: { key: "site" },
    update: {},
    create: {
      key: "site",
      value: { siteName: "برند شخصی", contactEmail: "admin@example.com", contactPhone: "09120000000" },
    },
  });
}

async function main() {
  await seedRoles();
  const { customer } = await seedUsers();
  await seedProfile();
  await seedSkillsExperienceEducation();
  const categories = await seedCategoriesAndTags();
  await seedProducts(categories);
  await seedCourses(categories);
  await seedContentAndSettings();

  console.log("Seed complete.");
  console.log("Admin login: admin@example.com / Admin@12345");
  console.log(`Customer login: customer@example.com / Customer@12345 (id: ${customer.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
