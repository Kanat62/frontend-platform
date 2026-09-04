import { CourseProductsPanel } from "@/widgets/course-products-panel";
import { LessonCatalog } from "@/widgets/lesson-catalog";

// Порт CuratorCourse из curator.course.index.tsx.
export function CoursePage() {
  return (
    <div className="space-y-5 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Курсы и контент</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Один теоретический контент — несколько форматов. Практика отличается, теория общая.
        </p>
      </header>
      <CourseProductsPanel />
      <LessonCatalog />
    </div>
  );
}
