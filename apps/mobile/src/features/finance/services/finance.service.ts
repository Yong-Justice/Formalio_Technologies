import { request } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { enqueueRequest } from '@/services/offline/queue';
import { useNetworkStore } from '@/services/offline/network';
import { Transaction, Report, CreditScore } from '@/types/domain';

export const financeService = {
  listTransactions(businessId: string) {
    return request<Transaction[]>({ method: 'GET', url: endpoints.businesses.transactions(businessId) });
  },
  async createTransaction(transaction: Transaction) {
    const isOnline = useNetworkStore.getState().isOnline;
    const url = endpoints.businesses.transactions(transaction.businessId);
    if (!isOnline) {
      enqueueRequest({ id: transaction.id, method: 'POST', url, body: transaction });
      return { ...transaction, syncStatus: 'pending' as const };
    }
    return request<Transaction>({ method: 'POST', url, data: transaction });
  },
  generateReport(businessId: string, payload: { type: string; periodStart: string; periodEnd: string }) {
    return request<Report>({ method: 'POST', url: endpoints.businesses.generateReport(businessId), data: payload });
  },
  getCreditScore(businessId: string) {
    return request<CreditScore>({ method: 'GET', url: endpoints.businesses.creditScore(businessId) });
  }
};