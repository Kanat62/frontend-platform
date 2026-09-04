// Реэкспорт держателя access-токена — источник в shared/api/token.ts (см. коммент
// там же: shared/api/client.ts не может зависеть от entities/session по FSD).
export { getAccessToken, setAccessToken, clearAccessToken } from "@/shared/api/token";
