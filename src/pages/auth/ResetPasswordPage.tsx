import { useParams } from 'react-router-dom';
import { PageStub } from '@/components/common';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  return (
    <PageStub
      title="Reset Password"
      description={`Form wired to authService.resetPassword goes here (token: ${token ?? 'missing'}).`}
    />
  );
}
