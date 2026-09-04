import { Avatar } from "@/shared/ui";

// Обёртка над shared/ui Avatar — избавляет виджеты от повторения
// `name={`${s.firstName} ${s.lastName}`}` на каждой строке ученика.
export function StudentAvatar({
  firstName,
  lastName,
  avatarTone,
  size,
}: {
  firstName: string;
  lastName: string;
  avatarTone: string;
  size?: "sm" | "md" | "lg";
}) {
  return <Avatar name={`${firstName} ${lastName}`} tone={avatarTone} size={size} />;
}
