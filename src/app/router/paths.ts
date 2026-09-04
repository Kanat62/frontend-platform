// Реэкспорт единого источника путей из shared/config (FRONTEND.md §3).
// shared не может зависеть от app, поэтому исходное определение живёт в
// shared/config/paths.ts; здесь — удобный алиас для кода внутри app/*.
export { paths } from "@/shared/config";
