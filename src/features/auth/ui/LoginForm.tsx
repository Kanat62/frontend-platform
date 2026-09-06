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

// Порт формы + блока «Тестовые аккаунты» из english-flow/src/routes/index.tsx —
// теперь с реальной мутацией (features/auth) вместо стора.
export function LoginForm() {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { user } = await login.mutateAsync(values);
      navigate(user.role === "curator" ? paths.curator.root : paths.student.root, {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Неверный логин или пароль";
      toast.error(message);
    }
  });

  const fill = (l: string) => {
    setValue("login", l);
    setValue("password", "test123");
  };

  return (
    <>
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

      <div className="mt-8 rounded-2xl border border-dashed border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Тестовые аккаунты
        </p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => fill("kanat")}
            className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-left text-xs font-semibold transition hover:bg-primary-soft"
          >
            <span>Ученик: kanat</span>
            <span className="text-muted-foreground">Пароль: test123</span>
          </button>
          <button
            type="button"
            onClick={() => fill("curator")}
            className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-left text-xs font-semibold transition hover:bg-primary-soft"
          >
            <span>Куратор: curator</span>
            <span className="text-muted-foreground">Пароль: test123</span>
          </button>
        </div>
      </div>
    </>
  );
}
