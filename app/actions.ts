"use server";

import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/server-token";
import { auth, signOut, unstable_update } from "@/auth";
import { createPlatform, updatePlatform } from "@/lib/platform-api";
import type { Domain } from "@/lib/types";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createPlatformAction(input: {
  name: string;
  domain: Domain;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}) {
  const session = await auth();
  const accessToken = session ? await getAccessToken() : null;
  if (!accessToken) throw new Error("Not authenticated");

  await createPlatform(accessToken, input);
  // The session was issued before this user owned a business: refresh its
  // role so the owner-only pages (/admin, /qr-generation) let them in.
  await unstable_update({});
  revalidatePath("/", "layout");
}

/** Saves changes made after going back to setup step 1 (the business already exists). */
export async function updatePlatformAction(input: {
  name: string;
  domain: Domain;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}) {
  const session = await auth();
  const accessToken = session ? await getAccessToken() : null;
  if (!accessToken) throw new Error("Not authenticated");

  await updatePlatform(accessToken, input);
  revalidatePath("/", "layout");
}
