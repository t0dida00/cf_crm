"use client";

import { useEffect, useState } from "react";
import Pusher, { type Channel } from "pusher-js";
import type { PusherConfig } from "@/lib/types";

/** The shared Pusher app, used by businesses that haven't connected their own. */
const SHARED: PusherConfig | null =
  process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ? { key: process.env.NEXT_PUBLIC_PUSHER_KEY, cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER }
    : null;

// One client (one websocket) per Pusher app.
const clients = new Map<string, Pusher>();
export function getPusherClient(config: PusherConfig | null | undefined): Pusher | null {
  const app = config ?? SHARED;
  if (!app) return null;
  const id = `${app.key}:${app.cluster}`;
  let client = clients.get(id);
  if (!client) {
    client = new Pusher(app.key, { cluster: app.cluster });
    clients.set(id, client);
  }
  return client;
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
// Counts are per client, since two Pusher apps can have the same channel name.
const refCounts = new WeakMap<Pusher, Map<string, number>>();
const countsFor = (client: Pusher) => {
  let counts = refCounts.get(client);
  if (!counts) refCounts.set(client, (counts = new Map()));
  return counts;
};

function acquireChannel(client: Pusher, name: string): Channel {
  const counts = countsFor(client);
  counts.set(name, (counts.get(name) ?? 0) + 1);
  return client.channel(name) ?? client.subscribe(name);
}

function releaseChannel(client: Pusher, name: string) {
  const counts = countsFor(client);
  const count = counts.get(name) ?? 0;
  if (count <= 1) {
    counts.delete(name);
    client.unsubscribe(name);
  } else {
    counts.set(name, count - 1);
  }
}

/**
 * Subscribes to a platform's public Pusher channel — the JWT param is kept
 * only so callers don't need to change (staff already prove auth via REST;
 * this channel carries nothing a guest with the platformId can't already
 * see through the public REST endpoints). Returns the channel (or null
 * before/between subscriptions) so callers can `.bind(...)` in an effect
 * keyed off this value, mirroring the old socket.io-based hook's shape.
 * `pusher` is the business's own Pusher app; without one it uses the shared
 * app from NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER.
 */
export function usePlatformSocket(platformId: string | null, pusher?: PusherConfig | null) {
  const key = pusher?.key;
  const cluster = pusher?.cluster;
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!platformId) {
      setChannel(null);
      return;
    }

    const client = getPusherClient(key && cluster ? { key, cluster } : null);
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
  }, [platformId, key, cluster]);

  return channel;
}
