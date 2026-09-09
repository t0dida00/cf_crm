"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PencilSimple } from "@phosphor-icons/react";
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
import { DataTable } from "@/components/data-table";
import { apiFetch } from "@/lib/api";
import { formatStamp } from "@/lib/range";
import type { StaffAccount } from "@/lib/types";

interface ApiStaffAccount {
  id: string;
  userId: string;
  email: string | null;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

const mapStaff = (s: ApiStaffAccount): StaffAccount => ({
  id: s.id,
  userId: s.userId,
  email: s.email,
  fullName: s.fullName,
  isActive: s.isActive,
  createdAt: new Date(s.createdAt).getTime(),
});

const helper = createColumnHelper<StaffAccount>();

const emptyForm = { fullName: "", email: "", password: "" };

export function StaffPanel({ createSignal }: { createSignal: number }) {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await apiFetch<{ staff: ApiStaffAccount[] }>("/staff");
    setStaff(res.staff.map(mapStaff));
  };

  useEffect(() => {
    refresh().finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (createSignal > 0) {
      setEditing(null);
      setForm(emptyForm);
      setError(null);
      setOpen(true);
    }
  }, [createSignal]);

  const startEdit = (account: StaffAccount) => {
    setEditing(account);
    setForm({ fullName: account.fullName, email: account.email ?? "", password: "" });
    setError(null);
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
                aria-label="Edit staff account"
              >
                <PencilSimple size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => toggleActive(row.original)}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
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
    if (!form.fullName.trim() || !form.email.trim()) return;
    if (!editing && form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (editing && form.password && form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const updated = await apiFetch<{ staff: ApiStaffAccount }>(`/staff/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
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
            password: form.password,
          }),
        });
        setStaff((prev) => [...prev, mapStaff(created.staff)]);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save staff account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="px-0">
          <DataTable
            table={table}
            emptyMessage={loaded ? "No staff accounts yet." : "Loading…"}
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
              <Label htmlFor="staff-name">Full name</Label>
              <Input
                id="staff-name"
                value={form.fullName}
                placeholder="e.g. Jamie Rivera"
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                placeholder="e.g. jamie@example.com"
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-password">
                {editing ? "New password (leave blank to keep current)" : "Password"}
              </Label>
              <Input
                id="staff-password"
                type="password"
                value={form.password}
                placeholder="At least 8 characters"
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
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
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
