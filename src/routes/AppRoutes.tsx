import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { PUBLIC_ROUTES, STUDENT_ROUTES, ADMIN_ROUTES } from '@/constants/routes';
import {
  AboutPage,
  ContactPage,
  FeaturesPage,
  HomePage,
  NotFoundPage,
} from '@/pages/public';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from '@/pages/auth';
import {
  BookmarksPage,
  BudgetsPage,
  CategoriesPage,
  DashboardPage,
  ImportPage,
  InsightsPage,
  MonthlyReportPage,
  NotificationsPage,
  ProfilePage,
  ReportsPage,
  SavingTipsPage,
  SettingsPage,
  TransactionDetailPage,
  TransactionEditPage,
  TransactionNewPage,
  TransactionsListPage,
} from '@/pages/student';
import {
  AdminAnnouncementsPage,
  AdminCategoriesPage,
  AdminDashboardPage,
  AdminStatisticsPage,
  AdminUserDetailPage,
  AdminUsersPage,
} from '@/pages/admin';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing + informational pages */}
      <Route element={<PublicLayout />}>
        <Route path={PUBLIC_ROUTES.home} element={<HomePage />} />
        <Route path={PUBLIC_ROUTES.about} element={<AboutPage />} />
        <Route path={PUBLIC_ROUTES.features} element={<FeaturesPage />} />
        <Route path={PUBLIC_ROUTES.contact} element={<ContactPage />} />
      </Route>

      {/* Auth flows */}
      <Route element={<AuthLayout />}>
        <Route path={PUBLIC_ROUTES.login} element={<LoginPage />} />
        <Route path={PUBLIC_ROUTES.register} element={<RegisterPage />} />
        <Route path={PUBLIC_ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={PUBLIC_ROUTES.resetPassword} element={<ResetPasswordPage />} />
      </Route>

      {/* Student application (requires authentication) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StudentLayout />}>
          <Route path={STUDENT_ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={STUDENT_ROUTES.transactions} element={<TransactionsListPage />} />
          <Route path={STUDENT_ROUTES.newTransaction} element={<TransactionNewPage />} />
          <Route path={STUDENT_ROUTES.transactionDetail} element={<TransactionDetailPage />} />
          <Route path={STUDENT_ROUTES.editTransaction} element={<TransactionEditPage />} />
          <Route path={STUDENT_ROUTES.categories} element={<CategoriesPage />} />
          <Route path={STUDENT_ROUTES.budgets} element={<BudgetsPage />} />
          <Route path={STUDENT_ROUTES.reports} element={<ReportsPage />} />
          <Route path={STUDENT_ROUTES.monthlyReport} element={<MonthlyReportPage />} />
          <Route path={STUDENT_ROUTES.insights} element={<InsightsPage />} />
          <Route path={STUDENT_ROUTES.savingTips} element={<SavingTipsPage />} />
          <Route path={STUDENT_ROUTES.bookmarks} element={<BookmarksPage />} />
          <Route path={STUDENT_ROUTES.import} element={<ImportPage />} />
          <Route path={STUDENT_ROUTES.profile} element={<ProfilePage />} />
          <Route path={STUDENT_ROUTES.settings} element={<SettingsPage />} />
          <Route path={STUDENT_ROUTES.notifications} element={<NotificationsPage />} />
        </Route>

        {/* Admin console (requires authentication + admin role) */}
        <Route element={<RoleRoute allow={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path={ADMIN_ROUTES.dashboard} element={<AdminDashboardPage />} />
            <Route path={ADMIN_ROUTES.users} element={<AdminUsersPage />} />
            <Route path={ADMIN_ROUTES.userDetail} element={<AdminUserDetailPage />} />
            <Route path={ADMIN_ROUTES.categories} element={<AdminCategoriesPage />} />
            <Route path={ADMIN_ROUTES.announcements} element={<AdminAnnouncementsPage />} />
            <Route path={ADMIN_ROUTES.statistics} element={<AdminStatisticsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
