import { useParams } from "react-router";
import { Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { LessonEditor } from "@/widgets/lesson-editor";

// Порт curator.course.$order.tsx (composition + чтение params).
export function LessonEditorPage() {
  const { productId, order } = useParams<{ productId: string; order: string }>();
  const num = Number(order);

  if (!productId || !order || Number.isNaN(num)) {
    return <EmptyState icon={Lock} title="Урок не найден" description="Проверьте ссылку или вернитесь к списку." />;
  }

  return <LessonEditor productId={productId} order={num} />;
}
