import { transactionsApi } from '@/api/transactions.api';

// Thin re-export boundary: pages/components depend on this service, never on
// src/api directly, so the HTTP layer can change without touching UI code.
export const transactionService = transactionsApi;
