import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  coverImage: string | null;
  isFree: boolean;
  price: number;
  salePrice: number | null;
  avgRating: number;
  reviewCount: number;
  category?: { name: string } | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/shop/products/${product.slug}`}>
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-accent/40">
        <div className="aspect-video w-full overflow-hidden bg-surface-elevated">
          {product.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.coverImage}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">بدون تصویر</div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">{product.title}</CardTitle>
            {product.isFree ? (
              <Badge variant="success">رایگان</Badge>
            ) : (
              <Badge variant="default">ویژه</Badge>
            )}
          </div>
          {product.category && <p className="text-xs text-muted">{product.category.name}</p>}
          {product.shortDescription && (
            <p className="line-clamp-2 text-sm text-muted">{product.shortDescription}</p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="text-sm">
              {product.isFree ? (
                <span className="text-emerald-400">رایگان</span>
              ) : product.salePrice ? (
                <span className="flex items-center gap-2">
                  <span className="text-accent">{formatToman(product.salePrice)}</span>
                  <span className="text-xs text-muted line-through">{formatToman(product.price)}</span>
                </span>
              ) : (
                <span className="text-accent">{formatToman(product.price)}</span>
              )}
            </div>
            {product.reviewCount > 0 && (
              <span className="text-xs text-muted">
                ★ {product.avgRating.toFixed(1)} ({product.reviewCount})
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
