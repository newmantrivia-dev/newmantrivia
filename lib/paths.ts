/**
 * Centralized route paths for the application
 * Update paths here to maintain consistency across the entire app
 */

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

export const publicPaths = {
  home: '/',
} as const;

// =============================================================================
// ADMIN ROUTES
// =============================================================================

export const adminPaths = {
  // Base
  root: '/admin',

  // Authentication
  signIn: '/admin/sign-in',
  signUp: '/admin/sign-up',
  unauthorized: '/admin/unauthorized',

  // Events
  events: {
    root: '/admin',
    new: '/admin/events/new',
    byId: (id: string) => `/admin/events/${id}`,
    edit: (id: string) => `/admin/events/${id}/edit`,
    view: (id: string) => `/admin/events/${id}/view`,
  },

  // History
  history: '/admin/history',

  // Audit Logs
  auditLogs: '/admin/audit-logs',
} as const;

// =============================================================================
// API ROUTES
// =============================================================================

export const apiPaths = {
  auth: '/api/auth',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a path is an admin route
 */
export function isAdminPath(path: string): boolean {
  return path.startsWith('/admin');
}

/**
 * Check if a path is a public route
 */
export function isPublicPath(path: string): boolean {
  return !isAdminPath(path) && !path.startsWith('/api');
}

/**
 * Check if an admin path requires authentication but not admin role
 */
export function isAdminAuthOnlyPath(path: string): boolean {
  const authOnlyPaths: string[] = [
    adminPaths.signIn,
    adminPaths.signUp,
    adminPaths.unauthorized,
  ];
  return authOnlyPaths.includes(path);
}
