import { toast } from "sonner";
import type { StudentListItem } from "@/entities/student";

/**
 * Порт `exportCsv` из curator.students.index.tsx (BulkBar) — экспорт строится из
 * уже загруженных строк таблицы (текущая страница/выбор), без отдельного
 * запроса к бэкенду: `Blob` + `URL.createObjectURL` целиком на клиенте, как в референсе.
 */
function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function exportStudentsCsv(rows: StudentListItem[]): void {
  const header = "Name,Login,Phone,Course,Type,Group,StartDate,EndDate,Status,Paid,Total,Payment";
  const body = rows
    .map((s) =>
      [
        `${s.firstName} ${s.lastName}`,
        s.login,
        s.phone,
        s.productTitle,
        s.type,
        s.groupName ?? "",
        s.startDate,
        s.endDate,
        s.accessStatus,
        s.payment.paid,
        s.payment.total,
        s.payment.status,
      ]
        .map(csvCell)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students-${rows.length}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Экспортировано: ${rows.length}`);
}
