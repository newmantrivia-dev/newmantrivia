import { headers } from "next/headers";
import { cache } from "react";
import type { User } from "@/lib/auth";

/**
 * Get the authenticated user from request headers (injected by middleware)
 * Only works in Server Components and Server Actions
 * Cached per request to prevent duplicate header reads
 * Returns null if headers are missing (shouldn't happen if middleware is working)
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const headersList = await headers();

  const userId = headersList.get("x-user-id");
  const userEmail = headersList.get("x-user-email");
  const userName = headersList.get("x-user-name");
  const userRole = headersList.get("x-user-role");

  // If any required header is missing, return null
  if (!userId || !userEmail || !userName) {
    return null;
  }

  // Construct user object matching Better Auth's User type
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

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "SESSION_EXPIRED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require an authenticated user, throw if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getAuthUser();

  if (!user) {
    throw new AuthError("You must be signed in to perform this action", "UNAUTHORIZED");
  }

  return user;
}

/**
 * Require an admin user, throw if not authenticated or not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new AuthError("You must be an administrator to perform this action", "FORBIDDEN");
  }

  return user;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === "admin";
}