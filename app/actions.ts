"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { createPlatform } from "@/lib/platform-api";
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
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) throw new Error("Not authenticated");

  await createPlatform(accessToken, input);
  revalidatePath("/", "layout");
}
