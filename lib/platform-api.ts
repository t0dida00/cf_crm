import type { Domain } from "@/lib/types";

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
  };
}
