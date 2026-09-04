import { useParams } from "react-router";
import { Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { TeacherCard } from "@/widgets/teacher-card";

// Порт curator.teachers.$id.tsx (composition + чтение params).
export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <EmptyState icon={Lock} title="Преподаватель не найден" description="Проверьте ссылку или вернитесь к списку." />;
  }

  return <TeacherCard teacherId={id} />;
}
