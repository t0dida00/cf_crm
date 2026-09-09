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

// Multiple hook instances (e.g. useNewOrderNotifications and
// useTableRequestNotifications, both mounted in the same staff shell) often
// subscribe to the exact same channel name at once. Pusher tracks one real
// channel object per name — if each consumer unsubscribed independently on
// its own effect cleanup, whichever unmounted/re-ran first would tear down
// the channel out from under the others (or under itself, on React 18
// StrictMode's synchronous mount->cleanup->mount dev cycle), leaving a
// subscription that looked alive locally but wasn't actually receiving
// events until something forced a fresh client (a full page reload). This
// map reference-counts subscribers per channel name so the real
// unsubscribe only happens once nothing is using it anymore.
const refCounts = new Map<string, number>();

function acquireChannel(client: Pusher, name: string): Channel {
  const count = refCounts.get(name) ?? 0;
  refCounts.set(name, count + 1);
  return client.channel(name) ?? client.subscribe(name);
}

function releaseChannel(client: Pusher, name: string) {
  const count = refCounts.get(name) ?? 0;
  if (count <= 1) {
    refCounts.delete(name);
    client.unsubscribe(name);
  } else {
    refCounts.set(name, count - 1);
  }
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

    const name = `platform-${platformId}`;
    const instance = acquireChannel(client, name);
    setChannel(instance);

    return () => {
      releaseChannel(client, name);
      setChannel(null);
    };
  }, [platformId]);

  return channel;
}
