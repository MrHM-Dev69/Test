import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { FreeDownloadButton } from "@/components/shop/free-download-button";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { ReviewForm } from "@/components/shop/review-form";
import { QuestionForm } from "@/components/shop/question-form";
import { formatToman } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true, tags: { include: { tag: true } } },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "محصول یافت نشد" };

  const description = (product.shortDescription ?? product.description).slice(0, 160);
  return {
    title: product.title,
    description,
    alternates: { canonical: `/shop/products/${product.slug}` },
    openGraph: {
      title: product.title,
      description,
      images: product.coverImage ? [product.coverImage] : undefined,
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.isPublished) notFound();

  const user = await getCurrentUser();

  const [relatedProducts, reviews, ownPendingReview, questions, wishlistItem, download, completedOrderItem] =
    await Promise.all([
      prisma.product.findMany({
        where: { categoryId: product.categoryId, id: { not: product.id }, isPublished: true },
        take: 4,
        include: { category: true },
      }),
      prisma.review.findMany({
        where: { productId: product.id, isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      user
        ? prisma.review.findFirst({ where: { productId: product.id, userId: user.id, isApproved: false } })
        : Promise.resolve(null),
      prisma.question.findMany({
        where: { productId: product.id, isPublic: true, answeredAt: { not: null } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      user
        ? prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } })
        : Promise.resolve(null),
      user
        ? prisma.download.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } })
        : Promise.resolve(null),
      user
        ? prisma.orderItem.findFirst({ where: { productId: product.id, order: { userId: user.id, status: "COMPLETED" } } })
        : Promise.resolve(null),
    ]);

  const reviewEligible = Boolean(user && !ownPendingReview && (download || completedOrderItem) && !reviews.some((r) => r.userId === user?.id));
  const hasReviewed = Boolean(user && (reviews.some((r) => r.userId === user.id) || ownPendingReview));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <ProductJsonLd
        name={product.title}
        description={product.shortDescription ?? product.description}
        image={product.coverImage ?? undefined}
        priceToman={Number(product.salePrice ?? product.price)}
        slug={product.slug}
        avgRating={product.avgRating}
        reviewCount={product.reviewCount}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", url: "/" },
          { name: "فروشگاه", url: "/shop" },
          { name: product.category.name, url: `/shop/categories/${product.category.slug}` },
          { name: product.title, url: `/shop/products/${product.slug}` },
        ]}
      />

      <nav className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-accent">فروشگاه</Link> /{" "}
        <Link href={`/shop/categories/${product.category.slug}`} className="hover:text-accent">
          {product.category.name}
        </Link>{" "}
        / {product.title}
      </nav>

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-surface-elevated">
            {product.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.coverImage} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">بدون تصویر</div>
            )}
          </div>
          {product.gallery.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.gallery.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`${product.title} ${i + 1}`} className="aspect-video rounded-lg object-cover" />
              ))}
            </div>
          )}

          <div className="mt-10">
            <h2 className="mb-3 text-xl font-bold">توضیحات</h2>
            <p className="whitespace-pre-line leading-8 text-muted">{product.description}</p>
          </div>

          {product.requirements && (
            <div className="mt-8">
              <h3 className="mb-2 text-lg font-semibold">پیش‌نیازها</h3>
              <p className="whitespace-pre-line text-sm text-muted">{product.requirements}</p>
            </div>
          )}
          {product.compatibility && (
            <div className="mt-6">
              <h3 className="mb-2 text-lg font-semibold">سازگاری</h3>
              <p className="whitespace-pre-line text-sm text-muted">{product.compatibility}</p>
            </div>
          )}
          {product.changelog && (
            <div className="mt-6">
              <h3 className="mb-2 text-lg font-semibold">تغییرات نسخه {product.version}</h3>
              <p className="whitespace-pre-line text-sm text-muted">{product.changelog}</p>
            </div>
          )}

          <div className="mt-12">
            <h3 className="mb-4 text-lg font-semibold">نظرات کاربران ({reviews.length})</h3>
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{review.user.name ?? "کاربر"}</span>
                    <span className="text-xs text-amber-400">{"★".repeat(review.rating)}</span>
                  </div>
                  {review.title && <p className="mt-2 text-sm font-medium">{review.title}</p>}
                  {review.content && <p className="mt-1 text-sm text-muted">{review.content}</p>}
                </Card>
              ))}
              {reviews.length === 0 && <p className="text-sm text-muted">هنوز نظری ثبت نشده است.</p>}
            </div>
            <div className="mt-6">
              {hasReviewed && !reviewEligible ? (
                <p className="text-sm text-muted">شما قبلاً برای این محصول نظر ثبت کرده‌اید.</p>
              ) : (
                <ReviewForm productId={product.id} eligible={reviewEligible} />
              )}
            </div>
          </div>

          <div className="mt-12">
            <h3 className="mb-4 text-lg font-semibold">پرسش و پاسخ ({questions.length})</h3>
            <div className="flex flex-col gap-4">
              {questions.map((q) => (
                <Card key={q.id}>
                  <p className="text-sm font-medium">{q.user.name ?? "کاربر"}: {q.question}</p>
                  {q.answer && <p className="mt-2 text-sm text-accent">پاسخ: {q.answer}</p>}
                </Card>
              ))}
              {questions.length === 0 && <p className="text-sm text-muted">پرسشی ثبت نشده است.</p>}
            </div>
            <div className="mt-6">
              <QuestionForm productId={product.id} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{product.title}</h1>
              {product.isFree ? <Badge variant="success">رایگان</Badge> : <Badge>ویژه</Badge>}
            </div>
            {product.version && <p className="mt-1 text-xs text-muted">نسخه {product.version}</p>}
            {product.reviewCount > 0 && (
              <p className="mt-2 text-sm text-amber-400">
                ★ {product.avgRating.toFixed(1)} ({product.reviewCount} نظر)
              </p>
            )}

            <div className="mt-4">
              {product.isFree ? (
                <p className="text-2xl font-bold text-emerald-400">رایگان</p>
              ) : product.salePrice ? (
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold text-accent">{formatToman(product.salePrice.toString())}</p>
                  <p className="text-sm text-muted line-through">{formatToman(product.price.toString())}</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-accent">{formatToman(product.price.toString())}</p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {product.isFree ? (
                <FreeDownloadButton productId={product.id} />
              ) : (
                <AddToCartButton productId={product.id} />
              )}
              <WishlistButton productId={product.id} initialWishlisted={Boolean(wishlistItem)} />
            </div>

            {product.documentationUrl && (
              <a
                href={product.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block text-sm text-accent hover:underline"
              >
                مشاهده مستندات
              </a>
            )}

            {product.license && (
              <p className="mt-4 text-xs text-muted">مجوز: {product.license}</p>
            )}

            {product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-bold">محصولات مرتبط</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  title: p.title,
                  shortDescription: p.shortDescription,
                  coverImage: p.coverImage,
                  isFree: p.isFree,
                  price: Number(p.price),
                  salePrice: p.salePrice ? Number(p.salePrice) : null,
                  avgRating: p.avgRating,
                  reviewCount: p.reviewCount,
                  category: p.category,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
