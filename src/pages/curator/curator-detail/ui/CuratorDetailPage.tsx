import { useParams } from "react-router";
import { Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui";
import { CuratorCard } from "@/widgets/curator-detail";

export function CuratorDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <EmptyState icon={Lock} title="Куратор не найден" description="Проверьте ссылку или вернитесь к списку." />;
  }

  return <CuratorCard curatorId={id} />;
}
