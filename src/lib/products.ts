import { cacheJson, invalidateCache } from "./cache";
import { db } from "./db";
import type { Prisma, ProductType } from "@prisma/client";

export type ProductCard = {
  id: string;
  title: string;
  description: string;
  type: ProductType;
  price: number;
  images: string[];
  tags: string[];
  featured: boolean;
  createdAt: string;
  category: { slug: string; title: string; emoji: string; tint: string };
  seller: { id: string; name: string; avatarColor: string };
  rating: number;
  reviewCount: number;
};

export type ProductFilters = {
  q?: string;
  category?: string;
  type?: string;
  sort?: string;
};

type ProductRow = Prisma.ProductGetPayload<{
  include: {
    category: true;
    seller: { select: { id: true; name: true; avatarColor: true } };
    reviews: { select: { rating: true } };
  };
}>;

export function toProductCard(row: ProductRow): ProductCard {
  const reviewCount = row.reviews.length;
  const rating = reviewCount
    ? row.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    price: row.price,
    images: row.images,
    tags: row.tags,
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
    category: {
      slug: row.category.slug,
      title: row.category.title,
      emoji: row.category.emoji,
      tint: row.category.tint,
    },
    seller: { id: row.seller.id, name: row.seller.name, avatarColor: row.seller.avatarColor },
    rating: Math.round(rating * 10) / 10,
    reviewCount,
  };
}

export async function listApprovedProducts(filters: ProductFilters = {}): Promise<ProductCard[]> {
  const key = `products:${JSON.stringify(filters)}`;
  return cacheJson(key, 20, async () => {
    const where: Record<string, unknown> = { status: "APPROVED" };
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { tags: { has: filters.q } },
      ];
    }
    if (filters.category) where.category = { slug: filters.category };
    if (filters.type && ["PHYSICAL", "SERVICE", "DIGITAL"].includes(filters.type)) {
      where.type = filters.type;
    }

    const orderBy =
      filters.sort === "price-asc"
        ? { price: "asc" as const }
        : filters.sort === "price-desc"
          ? { price: "desc" as const }
          : filters.sort === "popular"
            ? { views: "desc" as const }
            : { createdAt: "desc" as const };

    const rows = await db.product.findMany({
      where,
      orderBy: [{ featured: "desc" }, orderBy],
      take: 60,
      include: {
        category: true,
        seller: { select: { id: true, name: true, avatarColor: true } },
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      },
    });

    return rows.map(toProductCard);
  });
}

export async function getSellerProfile(sellerId: string) {
  const seller = await db.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarColor: true,
      plan: true,
      createdAt: true,
      products: {
        where: { status: "APPROVED" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: {
          category: true,
          seller: { select: { id: true, name: true, avatarColor: true } },
          reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        },
      },
    },
  });
  if (!seller) return null;
  const cards = seller.products.map(toProductCard);
  const reviewCount = cards.reduce((sum, card) => sum + card.reviewCount, 0);
  const rating = reviewCount
    ? cards.reduce((sum, card) => sum + card.rating * card.reviewCount, 0) / reviewCount
    : 0;
  return {
    seller: {
      id: seller.id,
      name: seller.name,
      bio: seller.bio,
      avatarColor: seller.avatarColor,
      plan: seller.plan,
      createdAt: seller.createdAt,
    },
    products: cards,
    reviewCount,
    rating: Math.round(rating * 10) / 10,
  };
}

export async function getProductDetail(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { id: true, name: true, avatarColor: true, createdAt: true } },
      reviews: {
        where: { status: "APPROVED" },
        include: { author: { select: { name: true, avatarColor: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!product) return null;
  const approvedReviews = product.reviews;
  const rating = approvedReviews.length
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
    : 0;
  return { ...product, rating };
}

export async function getCategories() {
  return cacheJson("categories", 60, () => db.category.findMany({ orderBy: { sort: "asc" } }));
}

export async function getLandingStats() {
  return cacheJson("landing-stats", 30, async () => {
    const [products, sellers, categories] = await Promise.all([
      db.product.count({ where: { status: "APPROVED" } }),
      db.user.count({ where: { role: "CHILD" } }),
      db.category.count(),
    ]);
    return { products, sellers, categories };
  });
}

export async function invalidateProductCache() {
  await Promise.all([invalidateCache("products:"), invalidateCache("landing-stats")]);
}
