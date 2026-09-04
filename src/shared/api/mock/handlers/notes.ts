import { http, HttpResponse, type HttpHandler } from "msw";
import { TODAY } from "@/shared/config";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { badRequest, notFound, requireCurator } from "../context";

/** `notes` (роль C) — BACKEND.md §12. Внутренние заметки куратора об ученике. */

function noteDto(note: (typeof db.notes)[number]): Dto<"NoteDto"> {
  return { id: note.id, author: note.author, content: note.content, createdAt: note.createdAt };
}

export const notesHandlers: HttpHandler[] = [
  http.get("*/students/:id/notes", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    if (!db.students.some((s) => s.id === params.id)) return notFound("Ученик не найден");

    const notes = db.notes.filter((n) => n.studentId === params.id);
    const response: Dto<"NoteDto">[] = notes.map(noteDto);
    return HttpResponse.json(response);
  }),

  http.post("*/students/:id/notes", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const student = db.students.find((s) => s.id === params.id);
    if (!student) return notFound("Ученик не найден");

    const body = (await request.json()) as Dto<"AddNoteRequestDto">;
    if (!body.content?.trim()) return badRequest("Заметка не может быть пустой");

    const note = {
      id: `n-${Date.now()}`,
      studentId: student.id,
      author: db.curator.name,
      content: body.content.trim(),
      createdAt: TODAY,
    };
    db.notes.unshift(note);
    return HttpResponse.json(noteDto(note), { status: 201 });
  }),

  http.delete("*/notes/:id([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const index = db.notes.findIndex((n) => n.id === params.id);
    if (index === -1) return notFound("Заметка не найдена");
    db.notes.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
