"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { apiFetch } from "@/lib/api";
import { fetchJson } from "@/lib/http";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ErrorState, LoadingState } from "@/components/common/RequestState";
import { errorMessage, toRequestStatus } from "@/lib/requestStatus";

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
      return Object.fromEntries(res.tokens.map((t) => [t.tableId, t.token])) as Record<string, string>;
    },
    enabled: hydrated,
  });
  const tokensByTableId = tokensQuery.data ?? {};
  const tokensStatus = toRequestStatus(tokensQuery);

  const downloadQr = (tableName: string) => {
    const svg = document.getElementById(`qr-${tableName}`);
    if (!(svg instanceof SVGSVGElement)) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName.replace(/\s+/g, "-").toLowerCase()}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="qr-origin">Address phones on this network can reach</Label>
            <Input
              id="qr-origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="http://192.168.1.5:3001"
            />
            <p className="text-xs text-muted-foreground">
              {detected === false
                ? "Couldn't auto-detect a LAN address — enter one your phone can reach."
                : "Auto-detected from this server. Edit if your phone can't reach this address."}
            </p>
          </div>
        </CardContent>
      </Card>

      {!hydrated || tokensStatus === "loading" || tokensStatus === "idle" ? (
        <Card>
          <CardContent className="p-0">
            <LoadingState label="Loading QR codes…" />
          </CardContent>
        </Card>
      ) : tokensStatus === "error" ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState
              message={errorMessage(tokensQuery.error, "Couldn't load table QR codes.")}
              onRetry={() => void tokensQuery.refetch()}
            />
          </CardContent>
        </Card>
      ) : workspace.tables.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No tables yet. Add tables from the Tables tab first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspace.tables.map((table) => {
            const token = tokensByTableId[table.id];
            const url = origin && token ? buildClientUrl(origin, token) : null;
            const zone = table.zone && table.zone !== "—" ? table.zone : null;
            return (
              <Card key={table.id}>
                <CardContent className="flex flex-col items-center gap-3.5 text-center">
                  <div>
                    <p className="text-base font-bold">{table.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {table.seats} seats{zone ? ` · ${zone}` : ""}
                    </p>
                  </div>
                  <div className="flex size-[186px] items-center justify-center rounded-xl border bg-white p-3">
                    {url && <QRCodeSVG id={`qr-${table.name}`} value={url} size={160} level="M" title={`QR code for ${table.name}`} />}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!url}
                    onClick={() => downloadQr(table.name)}
                  >
                    <DownloadSimple size={14} weight="bold" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
