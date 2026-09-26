"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { errorMessage, toRequestStatus } from "@/lib/request-status";

/** What the backend shows the owner about their connections (never secrets). */
export interface Connections {
  database: { label: string; verifiedAt: string | null } | null;
  pusher: { appId: string; key: string; cluster: string; verifiedAt: string | null } | null;
  /** Whether the business may keep using the shared database and Pusher. */
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

export const CONNECTIONS_KEY = ["connections"] as const;

/** The owner's database and Pusher connections (`/platforms/me/connections`). */
export function useConnections() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: CONNECTIONS_KEY,
    queryFn: ({ signal }) => apiFetch<Connections>("/platforms/me/connections", { signal }),
  });
  const onSaved = (data: Connections) => queryClient.setQueryData(CONNECTIONS_KEY, data);

  const saveDatabase = useMutation({
    mutationFn: (url: string) =>
      apiFetch<Connections>("/platforms/me/connections/database", { method: "PUT", body: JSON.stringify({ url }) }),
    onSuccess: onSaved,
  });
  const savePusher = useMutation({
    mutationFn: (input: PusherInput) =>
      apiFetch<Connections>("/platforms/me/connections/pusher", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: onSaved,
  });

  return {
    connections: query.data ?? null,
    status: toRequestStatus(query),
    error: query.isError ? errorMessage(query.error, "Couldn't load connections.") : null,
    retry: () => void query.refetch(),
    saveDatabase,
    savePusher,
  };
}
