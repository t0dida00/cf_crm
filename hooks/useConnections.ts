"use client";

import { t } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { errorMessage, toRequestStatus } from "@/lib/requestStatus";

/** What the backend shows the owner about their connections (never secrets). */
export interface Connections {
  database: { label: string; verifiedAt: string | null } | null;
  pusher: { appId: string; key: string; cluster: string; verifiedAt: string | null } | null;
  /** Where dish photos and logos go; `label` names the store or bucket, never its keys. */
  storage: { provider: StorageProvider; label: string; verifiedAt: string | null } | null;
  /** Whether the business may keep using the shared database, Pusher and storage. */
  sharedInfraAllowed: boolean;
  /** False when the server has no CREDENTIALS_KEY, so nothing can be saved. */
  canStoreCredentials: boolean;
}

export interface PusherInput {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
}

export type StorageProvider = "vercel_blob" | "s3";

/** The business's own image storage: a Vercel Blob store, or any S3-compatible bucket. */
export type StorageInput =
  | { provider: "vercel_blob"; token: string }
  | {
      provider: "s3";
      endpoint: string;
      /** Empty means "auto" (Cloudflare R2 and most S3-compatible services). */
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
      /** Where guests' browsers load the images from. */
      publicUrl: string;
    };

/** Everything one "Test & save" sends. */
export interface ConnectionsInput {
  databaseUrl: string;
  pusher: PusherInput;
  storage: StorageInput;
}

export const CONNECTIONS_KEY = ["connections"] as const;

/** The owner's database, Pusher and storage connections (`/platforms/me/connections`). */
export function useConnections() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: CONNECTIONS_KEY,
    queryFn: ({ signal }) => apiFetch<Connections>("/platforms/me/connections", { signal }),
  });
  const onSaved = (data: Connections) => queryClient.setQueryData(CONNECTIONS_KEY, data);

  // All three are checked by the backend before any is saved.
  const saveConnections = useMutation({
    mutationFn: (input: ConnectionsInput) =>
      apiFetch<Connections>("/platforms/me/connections", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: onSaved,
  });

  // The same checks without saving: onboarding step 1, before the business exists.
  const checkConnections = useMutation({
    mutationFn: (input: ConnectionsInput) =>
      apiFetch<{ ok: true }>("/platforms/me/connections/check", { method: "POST", body: JSON.stringify(input) }),
  });

  return {
    connections: query.data ?? null,
    status: toRequestStatus(query),
    error: query.isError ? errorMessage(query.error, t("errors.connections")) : null,
    retry: () => void query.refetch(),
    saveConnections,
    checkConnections,
  };
}
