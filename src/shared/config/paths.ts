/**
 * Единый источник строк путей приложения. Дерево маршрутов — app/router (FRONTEND.md §9).
 */
export const paths = {
  login: "/login",

  student: {
    root: "/",
    dashboard: "/",
    learn: "/learn",
    lesson: (order: number | string) => `/lesson/${order}`,
    lessonTest: (order: number | string) => `/lesson/${order}/test`,
    schedule: "/schedule",
    profile: "/profile",
  },

  curator: {
    root: "/curator",
    overview: "/curator",
    students: "/curator/students",
    student: (id: string) => `/curator/students/${id}`,
    groups: "/curator/groups",
    group: (id: string) => `/curator/groups/${id}`,
    teachers: "/curator/teachers",
    teacher: (id: string) => `/curator/teachers/${id}`,
    schedule: "/curator/schedule",
    course: "/curator/course",
    courseProduct: (productId: string) => `/curator/course/${productId}`,
    lessonEditor: (productId: string, order: number | string) => `/curator/course/${productId}/${order}`,
  },
} as const;
