import { CourseProductsPanel } from "@/widgets/course-products-panel";

// Порт CuratorCourse из curator.course.index.tsx.
export function CoursePage() {
  return (
    <div className="space-y-5 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Курсы и контент</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          У каждой категории курса — свой контент и свои уроки. Выберите категорию, чтобы посмотреть и
          отредактировать её уроки.
        </p>
      </header>
      <CourseProductsPanel />
    </div>
  );
}
