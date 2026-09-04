import { useParams } from "react-router";
import { Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { GroupDetail } from "@/widgets/group-detail";

// Порт curator.groups.$id.tsx (composition + чтение params).
export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <EmptyState icon={Lock} title="Группа не найдена" description="Проверьте ссылку или вернитесь к списку." />;
  }

  return <GroupDetail groupId={id} />;
}
