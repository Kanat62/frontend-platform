import { Trash2 } from "lucide-react";
import { formatFull } from "@/shared/lib";
import type { Note } from "../model/types";

// Порт строки заметки из curator.students.$id.tsx (вкладка «Заметки»). Без
// запроса внутри — удаление доставляет виджет через features/manage-notes.
export function NoteItem({ note, onDelete }: { note: Note; onDelete: () => void }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold">{note.author}</p>
          <p className="text-[11px] text-muted-foreground">{formatFull(note.createdAt)}</p>
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground transition hover:text-destructive"
          aria-label="Удалить заметку"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{note.content}</p>
    </div>
  );
}
