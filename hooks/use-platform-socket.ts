"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type SocketAuth = { token: string } | { platformId: string };

const authKey = (auth: SocketAuth | null) =>
  auth === null ? null : "token" in auth ? auth.token : auth.platformId;

/**
 * One live connection to the backend, scoped server-side to a platform's
 * room. Staff pass their session JWT (same token used for REST auth);
 * guests pass only their platformId (no auth, matching the public REST
 * endpoints). Returns the connected socket (or null before/between
 * connections) so callers can register `.on(...)` listeners in an effect
 * keyed off this value.
 */
export function usePlatformSocket(auth: SocketAuth | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const key = authKey(auth);

  useEffect(() => {
    if (!auth) {
      setSocket(null);
      return;
    }

    const instance = io(API_URL, { auth, transports: ["websocket"] });
    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return socket;
}
