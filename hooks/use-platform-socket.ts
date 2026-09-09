"use client";

import { useEffect, useState } from "react";
import Pusher, { type Channel } from "pusher-js";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "";

let pusherClient: Pusher | null = null;
function getPusherClient(): Pusher | null {
  if (!PUSHER_KEY || !PUSHER_CLUSTER) return null;
  if (!pusherClient) {
    pusherClient = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
  }
  return pusherClient;
}

/**
 * Subscribes to a platform's public Pusher channel — the JWT param is kept
 * only so callers don't need to change (staff already prove auth via REST;
 * this channel carries nothing a guest with the platformId can't already
 * see through the public REST endpoints). Returns the channel (or null
 * before/between subscriptions) so callers can `.bind(...)` in an effect
 * keyed off this value, mirroring the old socket.io-based hook's shape.
 */
export function usePlatformSocket(platformId: string | null) {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!platformId) {
      setChannel(null);
      return;
    }

    const client = getPusherClient();
    if (!client) {
      setChannel(null);
      return;
    }

    const instance = client.subscribe(`platform-${platformId}`);
    setChannel(instance);

    return () => {
      client.unsubscribe(`platform-${platformId}`);
      setChannel(null);
    };
  }, [platformId]);

  return channel;
}
