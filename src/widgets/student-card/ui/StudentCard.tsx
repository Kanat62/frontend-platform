import { Link } from "react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { paths } from "@/shared/config";
import { EmptyState } from "@/shared/ui";
import { useStudentHeaderQuery } from "@/entities/student";
import { useActiveTab, TABS } from "../model/useActiveTab";
import { StudentCardHeader } from "./StudentCardHeader";
import { OverviewTab } from "./OverviewTab";
import { LearningTab } from "./LearningTab";
import { PracticeTab } from "./PracticeTab";
import { ProgressTab } from "./ProgressTab";
import { NotesTab } from "./NotesTab";
import { PaymentTab } from "./PaymentTab";

// Порт StudentCard из curator.students.$id.tsx.
export function StudentCard({ studentId }: { studentId: string }) {
  const header = useStudentHeaderQuery(studentId);
  const [tab, setTab] = useActiveTab();

  return (
    <div className="space-y-5 overflow-x-hidden rise-in">
      <Link
        to={paths.curator.students}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К списку
      </Link>

      {header.isPending ? (
        <div className="h-56 animate-pulse rounded-3xl bg-muted/40" />
      ) : header.isError ? (
        <EmptyState icon={Lock} title="Ученик не найден" />
      ) : (
        <>
          <StudentCardHeader student={header.data} />

          <div className="flex gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  tab === t
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "border border-border bg-surface text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Обзор" && (
            <OverviewTab studentId={studentId} language={header.data.language} type={header.data.type} />
          )}
          {tab === "Обучение" && <LearningTab studentId={studentId} />}
          {tab === "Практика" && <PracticeTab studentId={studentId} />}
          {tab === "Прогресс" && <ProgressTab studentId={studentId} />}
          {tab === "Заметки" && <NotesTab studentId={studentId} />}
          {tab === "Оплата" && <PaymentTab studentId={studentId} language={header.data.language} />}
        </>
      )}
    </div>
  );
}
