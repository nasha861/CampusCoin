import { transactionsApi } from '@/api/transactions.api';

export const csvImportService = {
  previewCsvImport: transactionsApi.previewCsvImport,
  confirmCsvImport: transactionsApi.confirmCsvImport,
};
