import { createAuthClient } from "better-auth/react"

export const { signIn, signUp, useSession, signOut, getSession } = createAuthClient({
    baseURL: typeof window === 'undefined' ? '' : window.location.origin
})