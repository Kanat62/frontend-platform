import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui";
import { NoteItem, useNotesQuery } from "@/entities/note";
import { useAddNoteMutation, useDeleteNoteMutation } from "@/features/manage-notes";

// Порт вкладки «Заметки» из curator.students.$id.tsx.
export function NotesTab({ studentId }: { studentId: string }) {
  const notes = useNotesQuery(studentId);
  const addNote = useAddNoteMutation(studentId);
  const deleteNote = useDeleteNoteMutation(studentId);
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-3">
      <div className="surface-card p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Внутренняя заметка куратора… (ученик её не видит)"
          className="w-full resize-none rounded-xl border border-input bg-surface p-3 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => {
            if (!draft.trim()) return;
            addNote.mutate(
              { content: draft.trim() },
              {
                onSuccess: () => {
                  setDraft("");
                  toast.success("Заметка добавлена");
                },
              },
            );
          }}
          disabled={addNote.isPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60 sm:w-auto sm:px-6"
        >
          <Plus className="size-4" /> Добавить заметку
        </button>
      </div>

      {notes.isPending ? (
        <div className="h-32 animate-pulse rounded-3xl bg-muted/40" />
      ) : notes.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить заметки.{" "}
          <button onClick={() => notes.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : notes.data.length === 0 ? (
        <EmptyState icon={StickyNote} title="Заметок пока нет" />
      ) : (
        notes.data.map((n) => <NoteItem key={n.id} note={n} onDelete={() => deleteNote.mutate(n.id)} />)
      )}
    </div>
  );
}
