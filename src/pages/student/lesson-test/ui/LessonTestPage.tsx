import { useParams } from "react-router";
import { Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { TestRunner } from "@/widgets/test-runner";

// Порт english-flow/src/routes/lesson.$order_.test.tsx (composition + чтение params).
export function LessonTestPage() {
  const { order } = useParams<{ order: string }>();
  const num = Number(order);

  if (!order || !Number.isInteger(num) || num < 1) {
    return <EmptyState icon={Lock} title="Тест не найден" description="Проверьте ссылку или вернитесь к уроку." />;
  }

  return <TestRunner order={num} />;
}
