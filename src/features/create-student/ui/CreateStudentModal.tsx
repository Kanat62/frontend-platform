import { useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { TODAY } from "@/shared/config";
import { ApiError, generateLogin, generatePassword } from "@/shared/lib";
import { Select } from "@/shared/ui";
import { useGroupsQuery } from "@/entities/group";
import type { CourseType, CreateStudentResponse, LanguageCode } from "@/entities/student";
import { useCreateStudentMutation } from "../model/useCreateStudentMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

/**
 * Порт CreateStudentModal из curator.students.index.tsx. Отличия от референса,
 * продиктованные реальным (не localStorage) бэкендом:
 * - пароль (как в референсе) генерируется на клиенте один раз — после того как
 *   появился логин, показывается read-only полем рядом с логином и отправляется
 *   вместе с формой; сервер хранит только bcrypt-хеш и возвращает пароль в
 *   ответе, чтобы экран успеха мог его показать/скопировать;
 * - для GROUP-ученика сразу подставляется реально подобранная группа (тот же
 *   отбор, что делает сервер) — куратор видит её имя и может сменить вручную;
 * - логин по-прежнему генерируется на клиенте как предпросмотр (FRONTEND.md §6),
 *   но без проверки на занятость (список логинов не грузится целиком на
 *   пагинированный клиент) — финальную уникальность всё равно проверяет сервер,
 *   а «Сгенерировать заново» просто меняет 2 случайные цифры при отказе.
 */
export function CreateStudentModal({ onClose }: { onClose: () => void }) {
  const create = useCreateStudentMutation();
  const [created, setCreated] = useState<CreateStudentResponse | null>(null);

  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    age: "",
    city: "",
    phone: "",
    login: "",
    language: "en" as LanguageCode,
    type: "GROUP" as CourseType,
    startDate: TODAY,
    time: "20:00",
    total: "",
    paid: "",
    manager: "",
    groupChoice: "", // "" = авто-подбор на сервере
  });
  const [loginTouched, setLoginTouched] = useState(false);
  const [groupTouched, setGroupTouched] = useState(false);
  // Пароль генерируется один раз — после того как появился логин; куратор его не
  // меняет (референс). Отправляется вместе с формой; уникальность/хеш — на сервере.
  const [password, setPassword] = useState("");

  const groups = useGroupsQuery("all", f.language);
  const languageGroups = useMemo(() => groups.data?.items ?? [], [groups.data]);

  useEffect(() => {
    if (loginTouched) return;
    setF((prev) => ({ ...prev, login: generateLogin(prev.firstName, prev.phone, new Set()) }));
  }, [f.firstName, f.phone, loginTouched]);

  useEffect(() => {
    setPassword((prev) => (prev || !f.login.trim() ? prev : generatePassword(new Set())));
  }, [f.login]);

  // Группа, которую подберёт сервер при `groupId: null` (тот же отбор, что в
  // shared/api/mock/domain/groups.ts → findMatchingGroup): язык + набор открыт +
  // старт не раньше даты + совпал вечерний слот + есть места, ближайшая по старту.
  const autoGroup = useMemo(() => {
    if (f.type !== "GROUP") return null;
    return (
      [...languageGroups]
        .filter((g) => g.status === "recruiting")
        .filter((g) => g.startDate >= f.startDate)
        .filter((g) => g.practiceStart === f.time)
        .filter((g) => g.studentCount < g.maxStudents)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null
    );
  }, [languageGroups, f.type, f.startDate, f.time]);

  // Пока куратор не выбрал группу вручную — держим в форме реально подобранную.
  useEffect(() => {
    if (groupTouched || f.type !== "GROUP") return;
    setF((prev) => ({ ...prev, groupChoice: autoGroup?.id ?? "" }));
  }, [autoGroup, groupTouched, f.type]);

  const regenerateLogin = () => {
    setLoginTouched(false);
    setF((prev) => ({ ...prev, login: generateLogin(prev.firstName, prev.phone, new Set()) }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.firstName.trim()) {
      toast.error("Укажите имя ученика");
      return;
    }
    if (!f.login.trim()) {
      toast.error("Укажите логин");
      return;
    }
    // Пароль появляется вслед за логином; на случай мгновенного сабмита — добираем здесь.
    const pwd = password || generatePassword(new Set());
    create.mutate(
      {
        firstName: f.firstName,
        lastName: f.lastName,
        age: f.age ? Number(f.age) : null,
        city: f.city,
        phone: f.phone,
        login: f.login,
        password: pwd,
        language: f.language,
        type: f.type,
        startDate: f.startDate,
        practiceStart: f.time,
        groupId: f.type === "GROUP" ? f.groupChoice || null : null,
        manager: f.manager,
        total: f.total ? Number(f.total) : null,
        paid: f.paid ? Number(f.paid) : null,
      },
      {
        onSuccess: (res) => {
          setCreated(res);
          toast.success(res.groupName ? `Ученик создан и назначен в группу «${res.groupName}»` : "Ученик создан");
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Не удалось создать ученика");
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default backdrop-blur-sm"
      />
      {created ? (
        <CreatedPanel created={created} onClose={onClose} />
      ) : (
        <form
          onSubmit={submit}
          className="relative mx-auto my-4 w-full max-w-lg rounded-3xl border border-border bg-surface p-5 shadow-lift sm:my-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Новый ученик</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground">
              <X className="size-5" />
            </button>
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Личные данные</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Имя" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
            <input className={field} placeholder="Фамилия" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
            <input className={field} placeholder="Возраст" inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
            <input className={field} placeholder="Город" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
            <input className={field} placeholder="Телефон" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input className={field} placeholder="Менеджер" value={f.manager} onChange={(e) => setF({ ...f, manager: e.target.value })} />
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Доступ ученика</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <input
                  className={field}
                  placeholder="Логин"
                  value={f.login}
                  onChange={(e) => {
                    setLoginTouched(true);
                    setF({ ...f, login: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") });
                  }}
                />
                <button
                  type="button"
                  onClick={regenerateLogin}
                  aria-label="Сгенерировать логин заново"
                  className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Предпросмотр из имени и телефона · можно изменить, уникальность проверит сервер
              </p>
            </div>
            <div>
              <input
                className={`${field} font-mono`}
                value={password}
                readOnly
                placeholder="Пароль"
                aria-label="Пароль"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {password
                  ? "Пароль из 5 букв · сгенерирован · куратор не меняет · сохраните после создания"
                  : "Сгенерируется автоматически, как только появится логин"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Обучение</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Select
              ariaLabel="Язык"
              value={f.language}
              onChange={(v) => {
                setGroupTouched(false);
                setF({ ...f, language: v as LanguageCode, groupChoice: "" });
              }}
              options={[
                { value: "en", label: "English" },
                { value: "ru", label: "Русский" },
              ]}
            />
            <Select
              ariaLabel="Формат"
              value={f.type}
              onChange={(v) => {
                setGroupTouched(false);
                setF({ ...f, type: v as CourseType, groupChoice: "" });
              }}
              options={[
                { value: "GROUP", label: "Group" },
                { value: "INDIVIDUAL", label: "Individual" },
              ]}
            />
            <label className="text-xs font-semibold text-muted-foreground">
              Дата начала
              <input type="date" className={`${field} mt-1`} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
            </label>
            {f.type === "GROUP" && (
              <label className="text-xs font-semibold text-muted-foreground">
                Вечерний слот
                <Select
                  className="mt-1"
                  ariaLabel="Вечерний слот"
                  value={f.time}
                  onChange={(v) => setF({ ...f, time: v })}
                  options={[
                    { value: "20:00", label: "20:00–21:00" },
                    { value: "21:00", label: "21:00–22:00" },
                  ]}
                />
              </label>
            )}
          </div>

          {f.type === "GROUP" && (
            <label className="mt-3 block text-xs font-semibold text-muted-foreground">
              Группа
              <Select
                className="mt-1"
                ariaLabel="Группа"
                value={f.groupChoice}
                onChange={(v) => {
                  setGroupTouched(true);
                  setF({ ...f, groupChoice: v });
                }}
                placeholder="Нет подходящей группы — выберите вручную"
                options={languageGroups.map((g) => ({ value: g.id, label: g.name }))}
              />
              <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                {f.groupChoice && !groupTouched
                  ? "Подобрана автоматически по языку, дате и вечернему слоту — можно сменить."
                  : "Ближайшая группа с открытым набором и свободными местами."}
              </span>
            </label>
          )}

          <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Оплата (со слов отдела продаж)
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Общая сумма" inputMode="numeric" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />
            <input className={field} placeholder="Первоначальный платёж" inputMode="numeric" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} />
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground">
              Отмена
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              Создать
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CreatedPanel({ created, onClose }: { created: CreateStudentResponse; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(`Логин: ${created.login}\nПароль: ${created.password}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative mx-auto my-4 w-full max-w-lg rounded-3xl border border-border bg-surface p-5 text-center shadow-lift sm:my-8">
      <h2 className="text-lg font-extrabold">Ученик создан</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Сохраните пароль — сервер отдаёт его только один раз и больше не покажет.
      </p>
      <div className="mt-4 space-y-2 rounded-xl bg-muted/70 p-4 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Логин</span>
          <span className="font-bold">{created.login}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Пароль</span>
          <span className="font-mono font-bold">{created.password}</span>
        </div>
      </div>
      <button
        onClick={copy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Скопировано" : "Скопировать логин и пароль"}
      </button>
      <button onClick={onClose} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow">
        Готово
      </button>
    </div>
  );
}
