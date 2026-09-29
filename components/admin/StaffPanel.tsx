"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PencilSimple, Prohibit } from "@phosphor-icons/react";
import { StaffSeats } from "./StaffSeats";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { DataTable } from "@/components/common/DataTable";
import { savedMessage, useAsyncAction } from "@/hooks/useAsyncAction";
import { apiFetch } from "@/lib/api";
import { formatStamp } from "@/lib/range";
import { errorMessage, toRequestStatus } from "@/lib/requestStatus";
import type { StaffAccount } from "@/lib/types";
import { FieldError, fieldErrorProps } from "@/components/common/FieldError";
import { sanitizePhone, validateStaff, type FieldErrors, withFieldError } from "@/lib/validation";

interface ApiStaffAccount {
  id: string;
  userId: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

const mapStaff = (s: ApiStaffAccount): StaffAccount => ({
  id: s.id,
  userId: s.userId,
  email: s.email,
  phone: s.phone,
  fullName: s.fullName,
  isActive: s.isActive,
  createdAt: new Date(s.createdAt).getTime(),
});

const helper = createColumnHelper<StaffAccount>();

const EMPTY_FORM = { fullName: "", email: "", phone: "", password: "" };

const DEFAULT_STAFF_LIMIT = 5;
const STAFF_KEY = ["staff"] as const;

interface StaffList {
  staff: StaffAccount[];
  limit: number;
}

export function StaffPanel({ createSignal }: { createSignal: number }) {
  const { t } = useTranslation();
  const { run, isPending } = useAsyncAction();
  const queryClient = useQueryClient();
  const staffQuery = useQuery({
    queryKey: STAFF_KEY,
    queryFn: async ({ signal }): Promise<StaffList> => {
      const res = await apiFetch<{ staff: ApiStaffAccount[]; limit?: number }>("/staff", { signal });
      return {
        staff: res.staff.map(mapStaff),
        limit: typeof res.limit === "number" ? res.limit : DEFAULT_STAFF_LIMIT,
      };
    },
  });
  const staff = useMemo(() => staffQuery.data?.staff ?? [], [staffQuery.data]);
  const limit = staffQuery.data?.limit ?? DEFAULT_STAFF_LIMIT;
  const loaded = staffQuery.isSuccess;
  const staffStatus = staffQuery.isFetching ? "loading" : toRequestStatus(staffQuery);
  // Writes the server's response for one account straight into the cache.
  const setStaff = (fn: (prev: StaffAccount[]) => StaffAccount[]) =>
    queryClient.setQueryData<StaffList>(STAFF_KEY, (prev) =>
      prev ? { ...prev, staff: fn(prev.staff) } : prev,
    );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors<"fullName" | "email" | "phone" | "password">>({});

  const atCapacity = staff.length >= limit;

  useEffect(() => {
    if (createSignal > 0) {
      if (atCapacity) {
        toast.error(t("admin.staff.maxReached", { limit }));
        return;
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      setError(null);
      setErrors({});
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal]);

  const startEdit = (account: StaffAccount) => {
    setEditing(account);
    setForm({
      fullName: account.fullName,
      email: account.email ?? "",
      phone: account.phone ?? "",
      password: "",
    });
    setError(null);
    setErrors({});
    setOpen(true);
  };

  const toggleActive = async (account: StaffAccount) => {
    const updated = await apiFetch<{ staff: ApiStaffAccount }>(`/staff/${account.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !account.isActive }),
    });
    setStaff((prev) => prev.map((s) => (s.id === account.id ? mapStaff(updated.staff) : s)));
  };

  const table = useReactTable({
    data: staff,
    columns: useMemo(
      () => [
        helper.accessor("fullName", {
          header: t("admin.staff.columns.name"),
          // A disabled account's row reads dimmer: it can't sign in.
          cell: (c) => (
            <span className={cn("font-semibold", !c.row.original.isActive && "text-muted-foreground")}>
              {c.getValue()}
            </span>
          ),
        }),
        helper.accessor("email", {
          header: t("admin.staff.columns.email"),
          cell: (c) => <span className="text-muted-foreground">{c.getValue()}</span>,
        }),
        helper.accessor("phone", {
          header: t("admin.staff.columns.phone"),
          cell: (c) => <span className="text-muted-foreground">{c.getValue() || "—"}</span>,
          size: 140,
        }),
        helper.accessor("createdAt", {
          header: t("admin.staff.columns.added"),
          cell: (c) => <span className="text-muted-foreground">{formatStamp(c.getValue())}</span>,
          size: 160,
        }),
        helper.accessor("isActive", {
          header: t("admin.staff.columns.status"),
          cell: (c) =>
            c.getValue() ? (
              <span className="text-sm text-muted-foreground">{t("admin.staff.active")}</span>
            ) : (
              <Badge className="gap-1 bg-secondary text-muted-foreground">
                <Prohibit size={12} weight="bold" aria-hidden />
                {t("admin.staff.disabled")}
              </Badge>
            ),
          size: 110,
        }),
        helper.display({
          id: "actions",
          header: "",
          size: 140,
          cell: ({ row }) => (
            <span className="flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => startEdit(row.original)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t("admin.staff.editName", { name: row.original.fullName })}
              >
                <PencilSimple size={15} weight="bold" />
              </button>
              <button
                type="button"
                disabled={isPending(`toggle-${row.original.id}`)}
                onClick={() =>
                  run(`toggle-${row.original.id}`, () => toggleActive(row.original), t("admin.staff.updateFailed"))
                }
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {row.original.isActive ? t("admin.staff.disable") : t("admin.staff.enable")}
              </button>
            </span>
          ),
        }),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    ),
    getCoreRowModel: getCoreRowModel(),
  });

  const submit = async () => {
    const found = validateStaff(form, { editing: !!editing });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const updated = await apiFetch<{ staff: ApiStaffAccount }>(`/staff/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            ...(form.password ? { password: form.password } : {}),
          }),
        });
        setStaff((prev) => prev.map((s) => (s.id === editing.id ? mapStaff(updated.staff) : s)));
      } else {
        const created = await apiFetch<{ staff: ApiStaffAccount }>("/staff", {
          method: "POST",
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password,
          }),
        });
        setStaff((prev) => [...prev, mapStaff(created.staff)]);
      }
      toast.success(savedMessage());
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.staff.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {loaded && (
        <StaffSeats used={staff.length} limit={limit} />
      )}
      <Card className="overflow-hidden">
        <CardContent className="px-0">
          <DataTable
            table={table}
            emptyMessage={t("admin.staff.empty")}
            status={staffStatus}
            error={
              staffQuery.isError ? errorMessage(staffQuery.error, t("admin.staff.loadFailed")) : null
            }
            onRetry={() => void staffQuery.refetch()}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.staff.edit") : t("admin.staff.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="staff-name">{t("admin.staff.fullName")}</RequiredLabel>
              <Input
                id="staff-name"
                required
                value={form.fullName}
                placeholder={t("admin.staff.fullNamePlaceholder")}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                {...fieldErrorProps("staff-name", errors.fullName)}
                onBlur={() => setErrors((e) => withFieldError(e, "fullName", validateStaff(form, { editing: !!editing }).fullName))}
              />
              <FieldError id="staff-name" message={errors.fullName} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="staff-email">{t("admin.staff.email")}</RequiredLabel>
              <Input
                id="staff-email"
                type="email"
                required
                value={form.email}
                placeholder={t("admin.staff.emailPlaceholder")}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                {...fieldErrorProps("staff-email", errors.email)}
                onBlur={() => setErrors((e) => withFieldError(e, "email", validateStaff(form, { editing: !!editing }).email))}
              />
              <FieldError id="staff-email" message={errors.email} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="staff-phone">{t("admin.staff.phone")}</RequiredLabel>
              <Input
                id="staff-phone"
                type="tel"
                inputMode="tel"
                required
                value={form.phone}
                placeholder={t("admin.staff.phonePlaceholder")}
                onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhone(e.target.value) }))}
                {...fieldErrorProps("staff-phone", errors.phone)}
                onBlur={() => setErrors((e) => withFieldError(e, "phone", validateStaff(form, { editing: !!editing }).phone))}
              />
              <FieldError id="staff-phone" message={errors.phone} />
            </div>
            <div className="space-y-1.5">
              {editing ? (
                <Label htmlFor="staff-password">{t("admin.staff.newPassword")}</Label>
              ) : (
                <RequiredLabel htmlFor="staff-password">{t("admin.staff.password")}</RequiredLabel>
              )}
              <Input
                id="staff-password"
                type="password"
                required={!editing}
                value={form.password}
                placeholder={t("admin.staff.passwordPlaceholder")}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                {...fieldErrorProps("staff-password", errors.password)}
                onBlur={() => setErrors((e) => withFieldError(e, "password", validateStaff(form, { editing: !!editing }).password))}
              />
              <FieldError id="staff-password" message={errors.password} />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("admin.staff.cancel")}
            </Button>
            <Button onClick={submit} loading={saving}>
              {saving ? t("admin.staff.saving") : editing ? t("admin.staff.saveChanges") : t("admin.staff.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
