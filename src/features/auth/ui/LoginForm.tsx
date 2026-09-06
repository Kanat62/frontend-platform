import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, User2 } from "lucide-react";
import { toast } from "sonner";
import { paths } from "@/shared/config";
import { ApiError } from "@/shared/lib";
import { loginSchema, type LoginInput } from "../model/login.schema";
import { useLoginMutation } from "../model/useLoginMutation";

// Порт формы входа из english-flow/src/routes/index.tsx — с реальной мутацией
// (features/auth) вместо стора. Блок «Тестовые аккаунты» убран: демо-данных нет.
export function LoginForm() {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { user } = await login.mutateAsync(values);
      navigate(
        user.role === "curator" ? paths.curator.root : paths.student.root,
        {
          replace: true,
        },
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Неверный логин или пароль";
      toast.error(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-3" noValidate>
      <div className="relative">
        <User2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          {...register("login")}
          placeholder="Логин"
          autoComplete="username"
          aria-invalid={!!errors.login}
          className="w-full rounded-xl border border-input bg-surface py-3 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          {...register("password")}
          type={show ? "text" : "password"}
          placeholder="Пароль"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          className="w-full rounded-xl border border-input bg-surface py-3 pl-10 pr-11 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label="Показать пароль"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      <button
        type="submit"
        disabled={login.isPending}
        className="flex w-full items-center mt-5 cursor-pointer justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
      >
        Войти <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
