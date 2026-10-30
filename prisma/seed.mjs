import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();
const hash = (password) => bcrypt.hash(password, 10);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysAhead = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

/**
 * قبل از هر پاک‌سازی، یک نسخهٔ JSON از داده‌های موجود ذخیره می‌کند.
 * مسیر پیش‌فرض: backups/ (قابل تغییر با BACKUP_DIR)
 */
async function snapshotExistingData() {
  const dir = process.env.BACKUP_DIR ?? "./backups";
  await mkdir(dir, { recursive: true });
  const [users, consents, categories, products, messages, moduleSettings, modulePrefs, cartItems, orders, reviews, notifications, subscriptions, auditLogs, approvalRequests] =
    await Promise.all([
      db.user.findMany(),
      db.consent.findMany(),
      db.category.findMany(),
      db.product.findMany(),
      db.message.findMany(),
      db.moduleSetting.findMany(),
      db.userModulePreference.findMany(),
      db.cartItem.findMany(),
      db.order.findMany({ include: { items: true } }),
      db.review.findMany(),
      db.notification.findMany(),
      db.subscription.findMany(),
      db.auditLog.findMany(),
      db.approvalRequest.findMany(),
    ]);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `snapshot-${stamp}.json`);
  await writeFile(
    file,
    JSON.stringify(
      {
        takenAt: new Date().toISOString(),
        counts: { users: users.length, products: products.length, messages: messages.length, orders: orders.length },
        data: {
          users,
          consents,
          categories,
          products,
          messages,
          moduleSettings,
          modulePrefs,
          cartItems,
          orders,
          reviews,
          notifications,
          subscriptions,
          auditLogs,
          approvalRequests,
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`🗄️  نسخهٔ پشتیبان داده‌های فعلی ذخیره شد: ${file}`);
}

async function main() {
  const existing = await db.user.count();
  if (existing > 0 && process.env.SKIP_IF_SEEDED === "true") {
    console.log("ℹ️ داده از قبل موجود است؛ از seed صرف‌نظر شد.");
    return;
  }
  if (existing > 0 && process.env.ALLOW_WIPE !== "true") {
    console.log("⛔ این دیتابیس داده دارد و seed پاک‌کننده است؛ اجرا نشد.");
    console.log("   برای بکاپ:      npm run db:backup");
    console.log("   برای پاک‌سازی:  ALLOW_WIPE=true node prisma/seed.mjs  (فقط با تأیید کارفرما)");
    return;
  }
  if (existing > 0) await snapshotExistingData();
  console.log("🌱 پاک‌سازی داده‌های قبلی…");
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.review.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.subscription.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.userModulePreference.deleteMany();
  await db.moduleSetting.deleteMany();
  await db.approvalRequest.deleteMany();
  await db.consent.deleteMany();
  await db.user.deleteMany();

  console.log("👩‍🏫 ساخت کاربران…");
  const [adminPw, parentPw, childPw] = await Promise.all([
    hash("Admin@1405"),
    hash("Parent@1405"),
    hash("Child@1405"),
  ]);

  const admin = await db.user.create({
    data: {
      name: "سرپرست جوانه",
      email: "admin@javaneh.ir",
      passwordHash: adminPw,
      role: "ADMIN",
      avatarColor: "#0f766e",
      bio: "تیم ایمنی و کیفیت بازارچه",
    },
  });

  const parent = await db.user.create({
    data: {
      name: "مهسا رضایی",
      email: "mahsa@example.com",
      passwordHash: parentPw,
      role: "PARENT",
      phone: "09121234567",
      avatarColor: "#c2410c",
      bio: "مادر سارا و امیر",
    },
  });

  const sara = await db.user.create({
    data: {
      name: "سارا رضایی",
      email: "sara@example.com",
      passwordHash: childPw,
      role: "CHILD",
      birthDate: new Date("2014-05-12"),
      plan: "STARTER",
      parentId: parent.id,
      avatarColor: "#db2777",
      bio: "دوست‌دار بافتنی، رنگ و نقاشی 🎨",
    },
  });

  const amir = await db.user.create({
    data: {
      name: "امیر رضایی",
      email: "amir@example.com",
      passwordHash: childPw,
      role: "CHILD",
      birthDate: new Date("2016-02-03"),
      plan: "FREE",
      parentId: parent.id,
      avatarColor: "#0284c7",
      bio: "عاشق علوم و ساخت‌وساز 🚀",
    },
  });

  const nika = await db.user.create({
    data: {
      name: "نیکا احمدی",
      email: "nika@example.com",
      passwordHash: childPw,
      role: "CHILD",
      birthDate: new Date("2009-08-20"),
      plan: "PRO",
      avatarColor: "#7c3aed",
      bio: "تصویرگر دیجیتال و قصه‌گوی کوچک ✏️",
    },
  });

  const reza = await db.user.create({
    data: {
      name: "رضا کریمی",
      email: "reza@example.com",
      passwordHash: childPw,
      role: "CHILD",
      birthDate: new Date("2015-11-11"),
      parentId: parent.id,
      avatarColor: "#65a30d",
      bio: "خریدار کنجکاو بازارچه",
    },
  });

  await db.consent.createMany({
    data: [
      {
        childId: sara.id,
        parentName: parent.name,
        parentEmail: parent.email,
        parentPhone: parent.phone,
        status: "APPROVED",
        approvedAt: daysAgo(40),
        method: "email",
      },
      {
        childId: amir.id,
        parentName: parent.name,
        parentEmail: parent.email,
        parentPhone: parent.phone,
        status: "PENDING",
        method: "email",
      },
      {
        childId: reza.id,
        parentName: parent.name,
        parentEmail: parent.email,
        parentPhone: parent.phone,
        status: "APPROVED",
        approvedAt: daysAgo(12),
        method: "email",
      },
    ],
  });

  console.log("🗂️ ساخت دسته‌بندی‌ها…");
  const categoryData = [
    { slug: "handicraft", title: "صنایع دستی", emoji: "🧶", tint: "#fbcfe8", sort: 1 },
    { slug: "art", title: "هنر و نقاشی", emoji: "🎨", tint: "#fde68a", sort: 2 },
    { slug: "education", title: "مهارت و آموزش", emoji: "🧠", tint: "#bfdbfe", sort: 3 },
    { slug: "books", title: "کتاب و قصه", emoji: "📚", tint: "#bbf7d0", sort: 4 },
    { slug: "games", title: "بازی و سرگرمی", emoji: "🎲", tint: "#ddd6fe", sort: 5 },
    { slug: "digital", title: "خدمات دیجیتال", emoji: "💻", tint: "#a5f3fc", sort: 6 },
  ];
  const categories = {};
  for (const category of categoryData) {
    categories[category.slug] = await db.category.create({ data: category });
  }

  console.log("🎁 ساخت محصولات…");
  const productData = [
    {
      title: "دستبند بافتنی رنگین‌کمان",
      description:
        "دستبند دست‌بافت با نخ پنبه‌ای نرم و رنگ‌های شاد. هر دستبند با دقت و حوصله بافته شده و اندازهٔ آن قابل تنظیم است. مناسب برای هدیه دادن به دوستان.",
      type: "PHYSICAL",
      status: "APPROVED",
      price: 85000,
      tags: ["دست‌ساز", "بافتنی", "رنگین‌کمان"],
      stock: 12,
      featured: true,
      views: 342,
      categoryId: categories.handicraft.id,
      sellerId: sara.id,
      createdAt: daysAgo(24),
    },
    {
      title: "نقاشی آبرنگ «جنگل جادویی»",
      description:
        "یک نقاشی اورجینال آبرنگ روی کاغذ مخصوص با قاب چوبی سبک. تصویر جنگلی پر از جغدهای کوچک و چراغ‌های کرم‌شب‌تاب است. اندازهٔ اثر ۳۰×۴۰ سانتی‌متر.",
      type: "PHYSICAL",
      status: "APPROVED",
      price: 420000,
      tags: ["آبرنگ", "نقاشی", "جغد"],
      stock: 1,
      featured: true,
      views: 517,
      categoryId: categories.art.id,
      sellerId: nika.id,
      createdAt: daysAgo(18),
    },
    {
      title: "آموزش اوریگامی: ۱۰ شکل آسان",
      description:
        "فایل PDF تصویری با راهنمای گام‌به‌گام ساخت ده شکل اوریگامی: قایق، جغد، خرگوش و… همراه با ویدیوی کوتاه. مناسب ۷ سال به بالا. لینک دانلود بلافاصله پس از پرداخت ارسال می‌شود.",
      type: "DIGITAL",
      status: "APPROVED",
      price: 49000,
      tags: ["اوریگامی", "آموزش", "PDF"],
      featured: false,
      views: 289,
      categoryId: categories.education.id,
      sellerId: nika.id,
      createdAt: daysAgo(30),
    },
    {
      title: "داستان صوتی «جغد کوچک و کتاب جادو»",
      description:
        "قصهٔ صوتی ۱۲ دقیقه‌ای با صدای گرم راوی و موسیقی آرام. ماجرای جغد کوچکی که با خواندن کتاب، جنگل را از تاریکی نجات می‌دهد. فایل MP3 با کیفیت بالا.",
      type: "DIGITAL",
      status: "APPROVED",
      price: 39000,
      tags: ["قصه", "صوتی", "جغد"],
      featured: true,
      views: 803,
      categoryId: categories.books.id,
      sellerId: nika.id,
      createdAt: daysAgo(9),
    },
    {
      title: "کارت تبریک دست‌ساز گل‌دار",
      description:
        "کارت تبریک با گل‌های خشک طبیعی و کاغذ کرم. داخل کارت جای نوشتن پیام است. برای تولد، نوروز و روز مادر عالی است.",
      type: "PHYSICAL",
      status: "APPROVED",
      price: 35000,
      tags: ["کارت", "دست‌ساز", "هدیه"],
      stock: 20,
      featured: false,
      views: 154,
      categoryId: categories.handicraft.id,
      sellerId: sara.id,
      createdAt: daysAgo(14),
    },
    {
      title: "بازی حدس کلمه (فایل چاپی)",
      description:
        "بازی گروهی حدس کلمه با ۱۲۰ کارت چاپی و قوانین ساده. مناسب دورهمی خانوادگی و کلاس درس. فایل PDF آمادهٔ چاپ در قطع A4.",
      type: "DIGITAL",
      status: "APPROVED",
      price: 29000,
      tags: ["بازی", "چاپی", "خانوادگی"],
      featured: false,
      views: 221,
      categoryId: categories.games.id,
      sellerId: nika.id,
      createdAt: daysAgo(21),
    },
    {
      title: "آموزش طراحی چهرهٔ کارتونی",
      description:
        "یک جلسهٔ آنلاین ۶۰ دقیقه‌ای برای یادگیری طراحی چهرهٔ کارتونی با نسبت‌های ساده. همراه با تمرین عملی و فیدبک تصویری. زمان جلسه با هماهنگی شما تعیین می‌شود.",
      type: "SERVICE",
      status: "APPROVED",
      price: 180000,
      tags: ["آموزش آنلاین", "طراحی", "کارتونی"],
      featured: false,
      views: 176,
      categoryId: categories.education.id,
      sellerId: nika.id,
      createdAt: daysAgo(11),
    },
    {
      title: "ماکت هواپیمای مقوایی",
      description:
        "کیت ساخت هواپیمای مقوایی با برش‌های آماده و چسب بی‌خطر. پس از ساخت یک اسباب‌بازی پروازی واقعی دارید. مناسب ۸ سال به بالا با کمک بزرگ‌تر.",
      type: "PHYSICAL",
      status: "APPROVED",
      price: 95000,
      tags: ["مقوا", "ماکت", "دست‌ساز"],
      stock: 8,
      featured: false,
      views: 198,
      categoryId: categories.games.id,
      sellerId: sara.id,
      createdAt: daysAgo(7),
    },
    {
      title: "شعرهای کوچک برای خواب",
      description:
        "مجموعهٔ ۱۵ شعر کوتاه و آرام برای لحظهٔ خواب، همراه با تصویرسازی‌های ساده. فایل PDF با طراحی رنگی و قابل چاپ.",
      type: "DIGITAL",
      status: "APPROVED",
      price: 25000,
      tags: ["شعر", "کودک", "خواب"],
      featured: false,
      views: 311,
      categoryId: categories.books.id,
      sellerId: nika.id,
      createdAt: daysAgo(5),
    },
    {
      title: "طراحی لوگوی کودکانه",
      description:
        "طراحی لوگوی اختصاصی برای کسب‌وکارهای کودکانه؛ سه پیشنهاد اولیه، دو بازنگری و فایل‌های برداری. مناسب کارگاه‌ها و فروشگاه‌های کوچک.",
      type: "SERVICE",
      status: "APPROVED",
      price: 450000,
      tags: ["لوگو", "برند", "طراحی"],
      featured: false,
      views: 92,
      categoryId: categories.digital.id,
      sellerId: nika.id,
      createdAt: daysAgo(3),
    },
    {
      title: "ست سنگ‌های نقاشی‌شده",
      description:
        "پنج سنگ صاف و طبیعی که با رنگ اکریلیک نقاشی شده‌اند؛ هر کدام طرحی از دریا و آسمان. برای تزیین میز مطالعه یا هدیه.",
      type: "PHYSICAL",
      status: "APPROVED",
      price: 60000,
      tags: ["سنگ", "نقاشی", "تزیینی"],
      stock: 5,
      featured: false,
      views: 143,
      categoryId: categories.art.id,
      sellerId: sara.id,
      createdAt: daysAgo(6),
    },
    {
      title: "پازل چوبی حیوانات",
      description:
        "پازل چوبی دست‌ساز با طرح حیوانات جنگل و رنگ‌های طبیعی. لبه‌های گرد و بی‌خطر برای دست‌های کوچک. مناسب ۳ سال به بالا.",
      type: "PHYSICAL",
      status: "APPROVED",
      price: 110000,
      tags: ["پازل", "چوبی", "حیوانات"],
      stock: 6,
      featured: false,
      views: 267,
      categoryId: categories.games.id,
      sellerId: sara.id,
      createdAt: daysAgo(2),
    },
    {
      title: "کیت علمی آتشفشان خانگی",
      description:
        "کیت ساخت آتشفشان با مواد بی‌خطر و راهنمای تصویری. آزمایشی هیجان‌انگیز برای یادگیری واکنش‌های شیمیایی ساده در خانه.",
      type: "PHYSICAL",
      status: "PENDING",
      price: 130000,
      tags: ["علوم", "آزمایش", "کیت"],
      stock: 4,
      featured: false,
      views: 0,
      categoryId: categories.education.id,
      sellerId: amir.id,
      createdAt: daysAgo(1),
    },
    {
      title: "کامیک «ماجرای ربات»",
      description:
        "کامیک ۱۶ صفحه‌ای دربارهٔ رباتی که دوست پیدا می‌کند. فایل PDF با کیفیت چاپ.",
      type: "DIGITAL",
      status: "PENDING",
      price: 20000,
      tags: ["کامیک", "ربات", "PDF"],
      featured: false,
      views: 0,
      categoryId: categories.books.id,
      sellerId: amir.id,
      createdAt: daysAgo(0),
    },
    {
      title: "بازی موبایلی شب‌های ترسناک",
      description: "یک بازی با تصاویر ترسناک برای گروه سنی بزرگسال.",
      type: "DIGITAL",
      status: "REJECTED",
      price: 0,
      tags: ["بازی"],
      featured: false,
      views: 0,
      rejectionReason: "محتوای بازی با سیاست سنی بازارچه سازگار نیست و برای مخاطب کودک مناسب تشخیص داده نشد.",
      categoryId: categories.games.id,
      sellerId: amir.id,
      createdAt: daysAgo(2),
    },
  ];

  const products = [];
  for (const data of productData) {
    products.push(await db.product.create({ data }));
  }

  console.log("⭐ ساخت نظرها…");
  await db.review.createMany({
    data: [
      { productId: products[0].id, authorId: reza.id, rating: 5, comment: "خیلی قشنگه! رنگ‌هاش دقیقاً مثل عکسه.", status: "APPROVED", createdAt: daysAgo(5) },
      { productId: products[0].id, authorId: nika.id, rating: 4, comment: "بافتش تمیزه و اندازه‌ش هم خوبه.", status: "APPROVED", createdAt: daysAgo(3) },
      { productId: products[1].id, authorId: sara.id, rating: 5, comment: "جغدهای توی نقاشی خیلی بامزه‌ان.", status: "APPROVED", createdAt: daysAgo(8) },
      { productId: products[3].id, authorId: reza.id, rating: 5, comment: "هر شب قبل خواب گوش می‌دم. صدای راوی عالیه.", status: "APPROVED", createdAt: daysAgo(4) },
      { productId: products[3].id, authorId: sara.id, rating: 4, comment: "قصه‌ش قشنگه، کاش یک قسمت دوم هم داشته باشه.", status: "APPROVED", createdAt: daysAgo(2) },
      { productId: products[2].id, authorId: reza.id, rating: 4, comment: "راهنماش ساده بود و خودم تونستم جغد بسازم.", status: "APPROVED", createdAt: daysAgo(6) },
    ],
  });

  console.log("💳 ساخت اشتراک‌ها…");
  await db.subscription.createMany({
    data: [
      { userId: sara.id, plan: "STARTER", status: "ACTIVE", price: 99000, startedAt: daysAgo(12), renewsAt: daysAhead(18) },
      { userId: nika.id, plan: "PRO", status: "ACTIVE", price: 249000, startedAt: daysAgo(25), renewsAt: daysAhead(5) },
    ],
  });

  console.log("📦 ساخت سفارش‌ها…");
  const orderSeeds = [
    {
      code: "JB-1405-1024",
      buyerId: reza.id,
      status: "DELIVERED",
      createdAt: daysAgo(15),
      items: [
        { product: products[0], quantity: 1 },
        { product: products[4], quantity: 2 },
      ],
    },
    {
      code: "JB-1405-1041",
      buyerId: sara.id,
      status: "PAID",
      createdAt: daysAgo(6),
      items: [{ product: products[3], quantity: 1 }],
    },
    {
      code: "JB-1405-1052",
      buyerId: reza.id,
      status: "PREPARING",
      createdAt: daysAgo(2),
      items: [{ product: products[11], quantity: 1 }],
    },
  ];

  for (const seed of orderSeeds) {
    const total = seed.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const fee = Math.round(total * 0.07);
    await db.order.create({
      data: {
        code: seed.code,
        buyerId: seed.buyerId,
        total,
        fee,
        sellerEarning: total - fee,
        status: seed.status,
        createdAt: seed.createdAt,
        address: "تهران، خیابان بهار، کوچهٔ ۷، پلاک ۱۲",
        items: {
          create: seed.items.map((item) => ({
            productId: item.product.id,
            sellerId: item.product.sellerId,
            title: item.product.title,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
    });
  }

  await db.cartItem.create({ data: { userId: reza.id, productId: products[5].id, quantity: 1 } });

  console.log("💬 ساخت پیام‌های نمونه…");
  const rezaMessage = await db.message.create({
    data: {
      senderId: reza.id,
      recipientId: nika.id,
      productId: products[3].id,
      channel: "CALLBACK",
      body: "سلام! داستان صوتی جغد کوچک را خیلی دوست دارم. می‌شود دربارهٔ قسمت بعدی‌اش صحبت کنیم؟",
      contactEmail: parent.email,
      contactPhone: parent.phone,
      parentCopies: [parent.email],
      createdAt: daysAgo(2),
    },
  });

  const nikaMessage = await db.message.create({
    data: {
      senderId: nika.id,
      recipientId: sara.id,
      productId: products[0].id,
      channel: "IN_APP",
      body: "سلام سارا! دستبندت را دیدم، خیلی قشنگ بافته‌ای. برای نمایشگاه مدرسه می‌خواهم چند تا سفارش بدهم.",
      contactEmail: nika.email,
      parentCopies: [],
      createdAt: daysAgo(1),
    },
  });

  await db.message.create({
    data: {
      senderId: sara.id,
      recipientId: nika.id,
      productId: products[0].id,
      replyToId: nikaMessage.id,
      channel: "IN_APP",
      body: "سلام نیکا جان! خوشحال می‌شوم. رنگ دلخواهت را بگو تا برایت ببافم.",
      contactEmail: parent.email,
      contactPhone: parent.phone,
      viaGuardian: true,
      parentCopies: [parent.email],
      createdAt: daysAgo(1),
    },
  });

  await db.message.create({
    data: {
      senderId: nika.id,
      recipientId: reza.id,
      productId: products[3].id,
      replyToId: rezaMessage.id,
      channel: "IN_APP",
      body: "سلام رضا! ممنون که پیام دادی. قسمت بعدی تا دو هفتهٔ دیگر آماده می‌شود؛ با والدینت هماهنگ کن.",
      contactEmail: nika.email,
      parentCopies: [],
      createdAt: daysAgo(1),
    },
  });

  console.log("🔔 ساخت اعلان‌ها…");
  await db.notification.createMany({
    data: [
      { userId: amir.id, title: "محصولت در صف بررسی است", body: "کیت علمی آتشفشان خانگی ثبت شد و به‌زودی بررسی می‌شود.", href: "/dashboard/products", createdAt: daysAgo(1) },
      { userId: sara.id, title: "یک فروش جدید! 🎉", body: "سفارش JB-1405-1041 شامل داستان صوتی جغد کوچک پرداخت شد.", href: "/dashboard/orders", createdAt: daysAgo(6) },
      { userId: admin.id, title: "۲ محصول در انتظار تأیید", body: "صف بازبینی امروز آماده است.", href: "/admin/moderation", createdAt: daysAgo(0) },
      { userId: parent.id, title: "رضایت امیر در انتظار تأیید", body: "برای فعال‌شدن فروش امیر، رضایت والدین را تأیید کنید.", href: "/parent", createdAt: daysAgo(0) },
      { userId: nika.id, title: "پیام جدید از یک عضو زیر ۱۳ سال", body: "رضا کریمی دربارهٔ «داستان صوتی جغد کوچک و کتاب جادو» پیام فرستاد.", href: "/dashboard/messages", createdAt: daysAgo(2) },
      { userId: parent.id, title: "پیام کودک تحت نظارت شما", body: "رضا کریمی دربارهٔ «داستان صوتی جغد کوچک و کتاب جادو» به نیکا احمدی پیام داد.", href: "/parent", createdAt: daysAgo(2) },
      { userId: parent.id, title: "درخواست اجازهٔ رضا 🛡️", body: "رضا می‌خواهد «پاسخ به پیام» برایش روشن شود. از پنل والدین تأیید یا رد کن.", href: "/parent", createdAt: daysAgo(0) },
    ],
  });

  const moduleDefaults = [
    ["marketplace", true],
    ["productUpload", true],
    ["moderation", true],
    ["parentalConsent", true],
    ["parentPanel", true],
    ["subscriptions", true],
    ["analytics", true],
    ["reviews", true],
    ["notifications", true],
    ["sellerContact", true],
    ["messageReply", true],
    ["messageContact", true],
    ["cart", true],
    ["checkout", true],
    ["orders", true],
    ["payouts", true],
  ];
  for (const [key, enabled] of moduleDefaults) {
    await db.moduleSetting.create({ data: { key, enabled } });
  }

  /** برای سارا، والدین از قبل «پاسخ به پیام» را تأیید کرده‌اند؛ برای امیر خاموش می‌ماند. */
  await db.userModulePreference.createMany({
    data: [
      { userId: sara.id, moduleKey: "messageReply", enabled: true },
      { userId: sara.id, moduleKey: "messageContact", enabled: true },
      { userId: reza.id, moduleKey: "messageReply", enabled: false },
      { userId: reza.id, moduleKey: "messageContact", enabled: false },
    ],
  });

  console.log("🙋 ساخت درخواست‌های اجازه…");
  await db.approvalRequest.createMany({
    data: [
      {
        childId: reza.id,
        guardianId: parent.id,
        moduleKey: "messageReply",
        note: "می‌خواهم به پیام نیکا دربارهٔ داستان صوتی جواب بدهم.",
        status: "PENDING",
        createdAt: daysAgo(0),
      },
      {
        childId: reza.id,
        guardianId: parent.id,
        moduleKey: "messageContact",
        note: "شمارهٔ تماس را می‌خواهم ببینم تا سفارش مدرسه را هماهنگ کنیم.",
        status: "DENIED",
        createdAt: daysAgo(6),
        respondedAt: daysAgo(5),
      },
      {
        childId: sara.id,
        guardianId: parent.id,
        moduleKey: "messageReply",
        note: "برای جواب‌دادن به سفارش‌های مدرسه لازمش دارم.",
        status: "APPROVED",
        createdAt: daysAgo(20),
        respondedAt: daysAgo(19),
      },
      {
        childId: sara.id,
        guardianId: parent.id,
        moduleKey: "messageContact",
        note: "برای هماهنگی تحویل دستبند، راه تماس را می‌خواهم.",
        status: "APPROVED",
        createdAt: daysAgo(18),
        respondedAt: daysAgo(17),
      },
    ],
  });

  await db.auditLog.createMany({
    data: [
      { actorId: admin.id, action: "product.approve", entity: "Product", entityId: products[0].id, detail: "تأیید محصول نمونه", createdAt: daysAgo(23) },
      { actorId: admin.id, action: "product.reject", entity: "Product", entityId: products[14].id, detail: "رد به دلیل تناسب سنی", createdAt: daysAgo(1) },
      { actorId: parent.id, action: "consent.approve", entity: "Consent", entityId: sara.id, detail: "رضایت والدین تأیید شد", createdAt: daysAgo(40) },
      { actorId: reza.id, action: "approval.request", entity: "ApprovalRequest", detail: "messageReply", createdAt: daysAgo(0) },
    ],
  });

  console.log("✅ داده‌های نمونه آماده شد.");
  console.log("   ادمین:  admin@javaneh.ir / Admin@1405");
  console.log("   والد:   mahsa@example.com / Parent@1405");
  console.log("   فروشنده: sara@example.com / Child@1405");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
