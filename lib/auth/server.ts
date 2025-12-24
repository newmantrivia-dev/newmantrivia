import { headers } from "next/headers";
import { cache } from "react";
import type { User } from "@/lib/auth";

export const getAuthUser = cache(async (): Promise<User | null> => {
  const headersList = await headers();

  const userId = headersList.get("x-user-id");
  const userEmail = headersList.get("x-user-email");
  const userName = headersList.get("x-user-name");
  const userRole = headersList.get("x-user-role");

  if (!userId || !userEmail || !userName) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole || "user",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  } as User;
});

export class AuthError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "SESSION_EXPIRED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getAuthUser();

  if (!user) {
    throw new AuthError("You must be signed in to perform this action", "UNAUTHORIZED");
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new AuthError("You must be an administrator to perform this action", "FORBIDDEN");
  }

  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === "admin";
}