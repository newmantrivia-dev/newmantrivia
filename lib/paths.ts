export const publicPaths = {
  home: '/',
} as const;

export const adminPaths = {
  root: '/admin',
  signIn: '/admin/sign-in',
  signUp: '/admin/sign-up',
  unauthorized: '/admin/unauthorized',

  events: {
    root: '/admin',
    new: '/admin/events/new',
    byId: (id: string) => `/admin/events/${id}`,
    edit: (id: string) => `/admin/events/${id}/edit`,
    view: (id: string) => `/admin/events/${id}/view`,
  },

  history: '/admin/history',

  auditLogs: '/admin/audit-logs',
} as const;

export const apiPaths = {
  auth: '/api/auth',
} as const;

export function isAdminPath(path: string): boolean {
  return path.startsWith('/admin');
}

export function isPublicPath(path: string): boolean {
  return !isAdminPath(path) && !path.startsWith('/api');
}

export function isAdminAuthOnlyPath(path: string): boolean {
  const authOnlyPaths: string[] = [
    adminPaths.signIn,
    adminPaths.signUp,
    adminPaths.unauthorized,
  ];
  return authOnlyPaths.includes(path);
}
