import { useParams } from 'react-router-dom';
import { PageStub } from '@/components/common';

export function TransactionEditPage() {
  const { id } = useParams<{ id: string }>();
  return <PageStub title="Edit Transaction" description={`Edit form for transaction ${id}.`} />;
}
