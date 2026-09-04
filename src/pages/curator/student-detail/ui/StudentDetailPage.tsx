import { useParams } from "react-router";
import { Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { StudentCard } from "@/widgets/student-card";

// Порт curator.students.$id.tsx (composition + чтение params).
export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <EmptyState icon={Lock} title="Ученик не найден" description="Проверьте ссылку или вернитесь к списку." />;
  }

  return <StudentCard studentId={id} />;
}
