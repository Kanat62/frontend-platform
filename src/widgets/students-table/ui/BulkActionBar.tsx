import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/shared/ui";
import { useGroupsQuery } from "@/entities/group";
import { useTeacherOptionsQuery } from "@/entities/teacher";
import type { StudentListItem } from "@/entities/student";
import { useBulkUpdateStudentsMutation } from "@/features/bulk-update-students";
import { exportStudentsCsv } from "@/features/export-students-csv";

/**
 * Порт BulkBar из curator.students.index.tsx. Отличие от референса: выбор
 * ограничен строками ТЕКУЩЕЙ страницы (пагинация теперь серверная, а не вся
 * таблица в памяти клиента) — поэтому CSV-экспорт и bulk-патч тоже берут
 * только видимые в `rows` строки, без отдельного запроса к бэкенду.
 */
export function BulkActionBar({
  ids,
  rows,
  onClear,
}: {
  ids: string[];
  rows: StudentListItem[];
  onClear: () => void;
}) {
  const groups = useGroupsQuery("all", "all");
  const teachers = useTeacherOptionsQuery();
  const bulkUpdate = useBulkUpdateStudentsMutation();

  return (
    <div className="surface-card sticky top-16 z-10 flex flex-wrap items-center gap-2 p-3">
      <span className="text-sm font-bold">Выбрано: {ids.length}</span>
      <Select
        className="w-48"
        value=""
        placeholder="Изменить группу…"
        onChange={(v) => {
          bulkUpdate.mutate(
            { ids, patch: { groupId: v } },
            { onSuccess: () => toast.success(`${ids.length} учеников назначены в группу`) },
          );
        }}
        options={(groups.data?.items ?? []).map((g) => ({ value: g.id, label: g.name }))}
      />
      <Select
        className="w-52"
        value=""
        placeholder="Изменить преподавателя…"
        onChange={(v) => {
          bulkUpdate.mutate({ ids, patch: { teacherId: v } }, { onSuccess: () => toast.success("Преподаватель изменён") });
        }}
        options={(teachers.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
      />
      <Select
        className="w-44"
        value=""
        placeholder="Изменить статус…"
        onChange={(v) => {
          bulkUpdate.mutate(
            { ids, patch: { status: v as never } },
            { onSuccess: () => toast.success("Статус изменён") },
          );
        }}
        options={[
          { value: "active", label: "Active" },
          { value: "expired", label: "Expired" },
          { value: "disabled", label: "Disabled" },
        ]}
      />
      <button
        onClick={() => exportStudentsCsv(rows.filter((s) => ids.includes(s.id)))}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-bold"
      >
        <Download className="size-3.5" /> Экспорт CSV
      </button>
      <button onClick={onClear} className="ml-auto text-muted-foreground" aria-label="Снять выделение">
        <X className="size-4" />
      </button>
    </div>
  );
}
