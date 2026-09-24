import { useParams } from 'react-router-dom';
import { PageStub } from '@/components/common';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PageStub title="Transaction Detail" description={`Detail view for transaction ${id}.`} />;
}
