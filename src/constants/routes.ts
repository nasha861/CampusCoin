export const PUBLIC_ROUTES = {
  home: '/',
  about: '/about',
  features: '/features',
  contact: '/contact',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password/:token',
} as const;

export const STUDENT_ROUTES = {
  dashboard: '/dashboard',
  transactions: '/transactions',
  newTransaction: '/transactions/new',
  transactionDetail: '/transactions/:id',
  editTransaction: '/transactions/:id/edit',
  categories: '/categories',
  budgets: '/budgets',
  reports: '/reports',
  monthlyReport: '/reports/monthly',
  insights: '/insights',
  savingTips: '/saving-tips',
  bookmarks: '/bookmarks',
  import: '/import',
  profile: '/profile',
  settings: '/settings',
  notifications: '/notifications',
} as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin/dashboard',
  users: '/admin/users',
  userDetail: '/admin/users/:id',
  categories: '/admin/categories',
  announcements: '/admin/announcements',
  statistics: '/admin/statistics',
} as const;

export function buildPath(pattern: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    pattern,
  );
}
