import { useParams } from 'react-router-dom';
import { PageStub } from '@/components/common';

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PageStub title="User Detail" description={`Detail and moderation view for user ${id}.`} />;
}
