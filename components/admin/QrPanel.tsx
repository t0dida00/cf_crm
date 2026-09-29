"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DownloadSimple, QrCode } from "@phosphor-icons/react";
import { TableTentCard } from "./TableTentCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { apiFetch } from "@/lib/api";
import { fetchJson } from "@/lib/http";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ErrorState, LoadingState } from "@/components/common/RequestState";
import { errorMessage, toRequestStatus } from "@/lib/requestStatus";
import { hasZone } from "@/lib/zone";
import { downloadFile } from "@/lib/downloadFile";

function buildClientUrl(origin: string, token: string): string | null {
  try {
    const url = new URL("/client", origin);
    url.searchParams.set("t", token);
    return url.toString();
  } catch {
    return null;
  }
}

interface TableQrToken {
  tableId: string;
  tableName: string;
  token: string;
}

export function QrPanel() {
  const { t } = useTranslation();
  const { workspace, hydrated } = useWorkspace();
  const [origin, setOrigin] = useState("");

  const originQuery = useQuery({
    queryKey: ["qr-origin"],
    queryFn: async ({ signal }) =>
      (await fetchJson<{ origin: string }>("/api/qr-origin", { signal })).origin,
    staleTime: Infinity,
    retry: false,
  });
  const detected = originQuery.isSuccess ? !!originQuery.data : originQuery.isError ? false : null;

  // Seed the editable address once detection settles; the user's edits win after that.
  useEffect(() => {
    if (originQuery.isPending) return;
    setOrigin((current) => current || originQuery.data || window.location.origin);
  }, [originQuery.isPending, originQuery.data]);

  const tableIds = workspace.tables.map((t) => t.id).join(",");
  const tokensQuery = useQuery({
    queryKey: ["tables", "qr-tokens", tableIds],
    queryFn: async ({ signal }) => {
      const res = await apiFetch<{ tokens: TableQrToken[] }>("/tables/qr-tokens", { signal });
      return Object.fromEntries(res.tokens.map((tok) => [tok.tableId, tok.token])) as Record<string, string>;
    },
    enabled: hydrated,
  });
  const tokensByTableId = tokensQuery.data ?? {};
  const tokensStatus = toRequestStatus(tokensQuery);

  // Saves one of the page's SVGs as a file. By table id: two tables can share
  // a name, and each must download its own code.
  const downloadSvg = (elementId: string, fileName: string) => {
    const svg = document.getElementById(elementId);
    if (!(svg instanceof SVGSVGElement)) return;
    // Declared UTF-8, so a Vietnamese restaurant or table name prints as written.
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
    downloadFile(xml, fileName, "image/svg+xml;charset=utf-8");
  };
  const fileBase = (tableName: string) => tableName.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="qr-origin">{t("admin.qr.address")}</Label>
            <Input
              id="qr-origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="http://192.168.1.5:3001"
            />
            <p className="text-xs text-muted-foreground">
              {detected === false
                ? t("admin.qr.noDetect")
                : t("admin.qr.detected")}
            </p>
          </div>
        </CardContent>
      </Card>

      {!hydrated || tokensStatus === "loading" || tokensStatus === "idle" ? (
        <Card>
          <CardContent className="p-0">
            <LoadingState label={t("admin.qr.loading")} />
          </CardContent>
        </Card>
      ) : tokensStatus === "error" ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState
              message={errorMessage(tokensQuery.error, t("admin.qr.loadFailed"))}
              onRetry={() => void tokensQuery.refetch()}
            />
          </CardContent>
        </Card>
      ) : workspace.tables.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("admin.qr.noTables")}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspace.tables.map((table) => {
            const token = tokensByTableId[table.id];
            const url = origin && token ? buildClientUrl(origin, token) : null;
            const zone = hasZone(table.zone) ? table.zone : null;
            return (
              <li key={table.id} className="flex flex-col items-center gap-3">
                {url ? (
                  <TableTentCard id={`tent-${table.id}`} qrId={`qr-${table.id}`} restaurant={workspace.name} table={table.name} url={url} />
                ) : (
                  <div
                    className="flex aspect-[3/4] w-full max-w-[240px] items-center justify-center rounded-[14px] border bg-white p-4 text-center text-sm text-muted-foreground"
                  >
                    {t("admin.qr.needAddress")}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {t("admin.qr.seats", { n: table.seats })}{zone ? `, ${zone}` : ""}
                </p>
                <div className="flex w-full max-w-[240px] gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!url}
                    onClick={() => downloadSvg(`tent-${table.id}`, `${fileBase(table.name)}-card.svg`)}
                    aria-label={t("admin.qr.downloadCard", { name: table.name })}
                  >
                    <DownloadSimple size={14} weight="bold" aria-hidden />
                    {t("admin.qr.card")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!url}
                    onClick={() => downloadSvg(`qr-${table.id}`, `${fileBase(table.name)}-qr.svg`)}
                    aria-label={t("admin.qr.downloadCode", { name: table.name })}
                  >
                    <QrCode size={14} weight="bold" aria-hidden />
                    {t("admin.qr.codeOnly")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
