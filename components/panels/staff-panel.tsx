"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PencilSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/required-label";
import { DataTable } from "@/components/data-table";
import { SAVED_MESSAGE, useAsyncAction } from "@/hooks/use-async-action";
import { apiFetch } from "@/lib/api";
import { formatStamp } from "@/lib/range";
import { errorMessage, toRequestStatus } from "@/lib/request-status";
import type { StaffAccount } from "@/lib/types";
import { FieldError, fieldErrorProps } from "@/components/field-error";
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

const emptyForm = { fullName: "", email: "", phone: "", password: "" };

const DEFAULT_STAFF_LIMIT = 5;
const STAFF_KEY = ["staff"] as const;

interface StaffList {
  staff: StaffAccount[];
  limit: number;
}

export function StaffPanel({ createSignal }: { createSignal: number }) {
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
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors<"fullName" | "email" | "phone" | "password">>({});

  const atCapacity = staff.length >= limit;

  useEffect(() => {
    if (createSignal > 0) {
      if (atCapacity) {
        toast.error(`Maximum of ${limit} staff accounts reached. Remove an existing account to add a new one.`);
        return;
      }
      setEditing(null);
      setForm(emptyForm);
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
          header: "Name",
          cell: (c) => <span className="font-semibold">{c.getValue()}</span>,
        }),
        helper.accessor("email", {
          header: "Email",
          cell: (c) => <span className="text-muted-foreground">{c.getValue()}</span>,
        }),
        helper.accessor("phone", {
          header: "Phone",
          cell: (c) => <span className="text-muted-foreground">{c.getValue() || "—"}</span>,
          size: 140,
        }),
        helper.accessor("createdAt", {
          header: "Added",
          cell: (c) => <span className="text-muted-foreground">{formatStamp(c.getValue())}</span>,
          size: 160,
        }),
        helper.accessor("isActive", {
          header: "Status",
          cell: (c) => (
            <Badge
              className={
                c.getValue() ? "bg-green-50 text-green-700" : "bg-secondary text-muted-foreground"
              }
            >
              {c.getValue() ? "Active" : "Disabled"}
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
                aria-label={`Edit staff account ${row.original.fullName}`}
              >
                <PencilSimple size={15} weight="bold" />
              </button>
              <button
                type="button"
                disabled={isPending(`toggle-${row.original.id}`)}
                onClick={() =>
                  run(`toggle-${row.original.id}`, () => toggleActive(row.original), "Failed to update staff account.")
                }
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {row.original.isActive ? "Disable" : "Enable"}
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
      toast.success(SAVED_MESSAGE);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save staff account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {loaded && (
        <p className="mb-3.5 text-xs text-muted-foreground">
          {staff.length} / {limit} staff accounts used
          {atCapacity && " — maximum reached. Remove an account to add a new one."}
        </p>
      )}
      <Card className="overflow-hidden">
        <CardContent className="px-0">
          <DataTable
            table={table}
            emptyMessage="No staff accounts yet."
            status={staffStatus}
            error={
              staffQuery.isError ? errorMessage(staffQuery.error, "Couldn't load staff accounts.") : null
            }
            onRetry={() => void staffQuery.refetch()}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit staff account" : "New staff account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="staff-name">Full name</RequiredLabel>
              <Input
                id="staff-name"
                required
                value={form.fullName}
                placeholder="e.g. Jamie Rivera"
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                {...fieldErrorProps("staff-name", errors.fullName)}
                onBlur={() => setErrors((e) => withFieldError(e, "fullName", validateStaff(form, { editing: !!editing }).fullName))}
              />
              <FieldError id="staff-name" message={errors.fullName} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="staff-email">Email</RequiredLabel>
              <Input
                id="staff-email"
                type="email"
                required
                value={form.email}
                placeholder="e.g. jamie@example.com"
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                {...fieldErrorProps("staff-email", errors.email)}
                onBlur={() => setErrors((e) => withFieldError(e, "email", validateStaff(form, { editing: !!editing }).email))}
              />
              <FieldError id="staff-email" message={errors.email} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="staff-phone">Phone</RequiredLabel>
              <Input
                id="staff-phone"
                type="tel"
                inputMode="tel"
                required
                value={form.phone}
                placeholder="e.g. +34 600 000 000"
                onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhone(e.target.value) }))}
                {...fieldErrorProps("staff-phone", errors.phone)}
                onBlur={() => setErrors((e) => withFieldError(e, "phone", validateStaff(form, { editing: !!editing }).phone))}
              />
              <FieldError id="staff-phone" message={errors.phone} />
            </div>
            <div className="space-y-1.5">
              {editing ? (
                <Label htmlFor="staff-password">New password (leave blank to keep current)</Label>
              ) : (
                <RequiredLabel htmlFor="staff-password">Password</RequiredLabel>
              )}
              <Input
                id="staff-password"
                type="password"
                required={!editing}
                value={form.password}
                placeholder="At least 8 characters"
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
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
