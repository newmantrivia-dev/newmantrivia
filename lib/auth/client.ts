import { createAuthClient } from "better-auth/react"

// Use empty string for client - Better Auth will default to same origin
export const { signIn, signUp, useSession, signOut, getSession } = createAuthClient({
    baseURL: typeof window === 'undefined' ? '' : window.location.origin
})