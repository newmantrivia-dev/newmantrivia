import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

    emailAndPassword: {
        enabled: true,
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                input: false,
                defaultValue: "user",
                required: true,
            },
        }
    },

    socialProviders: {
        google: {
            enabled: true,
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },

    advanced: {
        useSecureCookies: env.NODE_ENV === 'production',
        crossSubDomainCookies: {
          enabled: false,
        },
      },

      rateLimit: {
        enabled: true,
        window: 60,
        max: 10,
      },

      session: {
        expiresIn: 60 * 60 * 24 * 10,
        updateAge: 60 * 60 * 24,
      },
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;