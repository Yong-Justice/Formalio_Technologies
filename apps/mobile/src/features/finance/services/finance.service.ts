import { financialRequest } from '@/services/api/client';
  import { endpoints } from '@/services/api/endpoints';
  import { enqueueRequest } from '@/services/offline/queue';
  import { useNetworkStore } from '@/services/offline/network';
  import { Transaction, Report, CreditScore } from '@/types/domain';

  /**
   * All methods use the SSL-pinned client via financialRequest.
   * This prevents MITM attacks on African telco networks for all
   * routes that touch money, credit scores, or financial reports.
   */
  export const financeService = {
    listTransactions(businessId: string) {
      return financialRequest<Transaction[]>({
        method: 'GET',
        url: endpoints.businesses.transactions(businessId),
      });
    },

    async createTransaction(transaction: Transaction) {
      const isOnline = useNetworkStore.getState().isOnline;
      const url = endpoints.businesses.transactions(transaction.businessId);

      if (!isOnline) {
        enqueueRequest({ id: transaction.id, method: 'POST', url, body: transaction });
        return { ...transaction, syncStatus: 'pending' as const };
      }

      return financialRequest<Transaction>({
        method: 'POST',
        url,
        data: transaction as unknown as Record<string, unknown>,
      });
    },

    generateReport(
      businessId: string,
      payload: { type: string; periodStart: string; periodEnd: string }
    ) {
      return financialRequest<Report>({
        method: 'POST',
        url: endpoints.businesses.generateReport(businessId),
        data: payload,
      });
    },

    getCreditScore(businessId: string) {
      return financialRequest<CreditScore>({
        method: 'GET',
        url: endpoints.businesses.creditScore(businessId),
      });
    },
  };
  