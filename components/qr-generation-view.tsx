"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DownloadSimple, SquaresFour } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useWorkspace } from "@/components/workspace-provider";

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

export function QrGenerationView({
  platformName,
  defaultOrigin,
}: {
  platformName: string;
  defaultOrigin: string;
}) {
  const { workspace, hydrated } = useWorkspace();
  const [origin, setOrigin] = useState(defaultOrigin);
  const [tokensByTableId, setTokensByTableId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!defaultOrigin) setOrigin(window.location.origin);
  }, [defaultOrigin]);

  useEffect(() => {
    if (!hydrated) return;
    apiFetch<{ tokens: TableQrToken[] }>("/tables/qr-tokens").then((res) => {
      setTokensByTableId(Object.fromEntries(res.tokens.map((t) => [t.tableId, t.token])));
    });
  }, [hydrated]);

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
    <div className="min-h-screen bg-secondary/20 p-6 sm:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <SquaresFour size={15} weight="bold" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            {platformName}
          </span>
        </div>

        <h1 className="text-2xl font-bold">Table QR codes</h1>
        <p className="mt-2 mb-5 text-sm text-muted-foreground text-pretty">
          Print one of these per table. Scanning opens the menu for that exact table —
          no app or login needed.
        </p>

        <div className="mb-8 max-w-md space-y-1.5">
          <Label htmlFor="qr-origin">Address phones on this network can reach</Label>
          <Input
            id="qr-origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="http://192.168.1.5:3001"
          />
          <p className="text-xs text-muted-foreground">
            {defaultOrigin
              ? "Auto-detected from this server. Edit if your phone can't reach this address."
              : "Couldn't auto-detect a LAN address — enter one your phone can reach."}
          </p>
        </div>

        {!hydrated ? null : workspace.tables.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No tables yet. Add tables from the admin Tables panel first.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {workspace.tables.map((table) => {
              const token = tokensByTableId[table.id];
              const url = origin && token ? buildClientUrl(origin, token) : null;
              return (
                <Card key={table.id}>
                  <CardContent className="flex flex-col items-center gap-3.5 text-center">
                    <span className="text-base font-bold">{table.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {table.seats} seats · {table.zone}
                    </span>
                    <div className="rounded-xl border bg-white p-3">
                      {url && (
                        <QRCodeSVG id={`qr-${table.name}`} value={url} size={160} level="M" />
                      )}
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
    </div>
  );
}
