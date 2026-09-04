import { useParams } from "react-router";
import { Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { LessonViewer } from "@/widgets/lesson-viewer";

// Порт english-flow/src/routes/lesson.$order.tsx (composition + чтение params).
export function LessonPage() {
  const { order } = useParams<{ order: string }>();
  const num = Number(order);

  if (!order || !Number.isInteger(num) || num < 1) {
    return <EmptyState icon={Lock} title="Урок не найден" description="Проверьте ссылку или вернитесь к курсу." />;
  }

  return <LessonViewer order={num} />;
}
