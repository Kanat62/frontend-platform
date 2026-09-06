import { Link, useParams } from "react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { paths } from "@/shared/config";
import { EmptyState, LangPill } from "@/shared/ui";
import { useCourseProductsQuery } from "@/entities/course-product";
import { LessonCatalog } from "@/widgets/lesson-catalog";

// Экран одной категории курса: заголовок продукта + её собственный каталог уроков
// (§4.1/§4.2 TЗ — у каждой категории свой контент, доступ выдаётся на экране группы).
export function CourseProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const products = useCourseProductsQuery();
  const product = products.data?.find((p) => p.id === productId);

  return (
    <div className="space-y-5 rise-in">
      <Link
        to={paths.curator.course}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К курсам
      </Link>

      {products.isPending ? (
        <div className="h-24 animate-pulse rounded-3xl bg-muted/40" />
      ) : !product || !productId ? (
        <EmptyState icon={Lock} title="Продукт не найден" description="Проверьте ссылку или вернитесь к списку." />
      ) : (
        <>
          <header className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{product.title}</h1>
              <LangPill code={product.language} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.format === "GROUP" ? "Групповой" : "Индивидуальный"} · {product.durationMonths} мес
            </p>
          </header>
          <LessonCatalog productId={productId} />
        </>
      )}
    </div>
  );
}
