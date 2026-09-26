import type { Domain, PusherConfig } from "@/lib/types";

const API_URL = process.env.API_URL || "http://localhost:3000";

export interface PlatformRecord {
  id: string;
  name: string;
  domain: Domain;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  role: string;
  pusher: PusherConfig | null;
  databaseName: string | null;
}

export interface PlatformApiResponse {
  platform: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    logo_url: string | null;
    platform_types: { code: string };
  };
  role: string;
  pusher?: PusherConfig | null;
  databaseName?: string | null;
}

function toDomain(code: string): Domain {
  return code.toLowerCase() === "cafe" ? "cafe" : "restaurant";
}

export function mapPlatformResponse(data: PlatformApiResponse): PlatformRecord {
  return {
    id: data.platform.id,
    name: data.platform.name,
    domain: toDomain(data.platform.platform_types.code),
    phone: data.platform.phone,
    email: data.platform.email,
    address: data.platform.address,
    logoUrl: data.platform.logo_url,
    role: data.role,
    pusher: data.pusher ?? null,
    databaseName: data.databaseName ?? null,
  };
}

export async function fetchMyPlatform(accessToken: string): Promise<PlatformRecord | null> {
  const res = await fetch(`${API_URL}/platforms/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch platform: ${res.status}`);

  const data = (await res.json()) as PlatformApiResponse;
  return mapPlatformResponse(data);
}

export async function createPlatform(
  accessToken: string,
  input: {
    name: string;
    domain: Domain;
    phone?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
  },
): Promise<PlatformRecord> {
  const res = await fetch(`${API_URL}/platforms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: input.name,
      platformTypeCode: input.domain,
      phone: input.phone || undefined,
      email: input.email || undefined,
      address: input.address || undefined,
      logoUrl: input.logoUrl || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to create platform: ${res.status}`);
  }

  const data = (await res.json()) as { platform: { id: string; name: string; phone: string | null; email: string | null; address: string | null; logo_url: string | null }; role: string };
  return {
    id: data.platform.id,
    name: data.platform.name,
    domain: input.domain,
    phone: data.platform.phone,
    email: data.platform.email,
    address: data.platform.address,
    logoUrl: data.platform.logo_url,
    role: data.role,
    // A brand-new business hasn't connected its own Pusher app or database yet.
    pusher: null,
    databaseName: null,
  };
}

/** Updates the caller's business with the setup form's fields (used when going
 * back to setup step 1 after the business was created). Server-side only. */
export async function updatePlatform(
  accessToken: string,
  input: { name: string; domain: Domain; phone?: string; email?: string; address?: string; logoUrl?: string },
): Promise<void> {
  const res = await fetch(`${API_URL}/platforms/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      name: input.name,
      platformTypeCode: input.domain,
      phone: input.phone ?? "",
      // Setup no longer asks for an email (it's the owner's signup email):
      // leave the stored one alone unless one is given.
      ...(input.email !== undefined ? { email: input.email } : {}),
      address: input.address ?? "",
      logoUrl: input.logoUrl ?? "",
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to update platform: ${res.status}`);
  }
}
