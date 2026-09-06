import { Prisma, ProductDomain } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 24;

export interface ProductListParams {
  category?: string; // category slug
  domain?: string;
  free?: "free" | "paid";
  priceMin?: string;
  priceMax?: string;
  sort?: string;
  page?: string;
  q?: string;
}

export function buildProductWhere(params: ProductListParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isPublished: true };

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.domain && (Object.values(ProductDomain) as string[]).includes(params.domain)) {
    where.domain = params.domain as ProductDomain;
  }

  if (params.free === "free") {
    where.isFree = true;
  } else if (params.free === "paid") {
    where.isFree = false;
  }

  const priceMin = params.priceMin ? Number(params.priceMin) : undefined;
  const priceMax = params.priceMax ? Number(params.priceMax) : undefined;
  if (Number.isFinite(priceMin) && priceMin !== undefined) {
    where.price = { ...(typeof where.price === "object" ? where.price : {}), gte: priceMin };
  }
  if (Number.isFinite(priceMax) && priceMax !== undefined) {
    where.price = { ...(typeof where.price === "object" ? where.price : {}), lte: priceMax };
  }

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { shortDescription: { contains: params.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function buildProductOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "popular":
      return { salesCount: "desc" };
    case "rating":
      return { avgRating: "desc" };
    case "oldest":
      return { createdAt: "asc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export async function listProducts(params: ProductListParams) {
  const where = buildProductWhere(params);
  const orderBy = buildProductOrderBy(params.sort);
  const page = Math.max(1, Number(params.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
