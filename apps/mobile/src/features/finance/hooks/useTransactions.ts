import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createUuid } from "@/utils/uuid";
  import { financeService } from "@/features/finance/services/finance.service";
  import { useFinanceStore } from "@/features/finance/state/finance.store";
  import { analytics } from "@/services/analytics/analytics.service";
  import { TTL, queryKeys } from "@/services/cache/ttl";
  import type { Transaction } from "@/types/domain";

  function amountBucket(amount: number) {
    if (amount < 10_000) return "lt_10k";
    if (amount < 50_000) return "10k_50k";
    if (amount < 250_000) return "50k_250k";
    if (amount < 1_000_000) return "250k_1m";
    return "gte_1m";
  }

  /**
   * Transaction list — 5 min TTL, background refetch on window focus.
   * Optimistic create: shows "pending" immediately, rolls back to "failed"
   * if the server rejects after MAX_RETRIES. On settle, invalidates both
   * the transaction list and the wallet balance.
   */
  export function useTransactions(businessId: string) {
    const queryClient = useQueryClient();
    const upsertTransaction = useFinanceStore(s => s.upsertTransaction);
    const rollbackTransaction = useFinanceStore(s => s.rollbackTransaction);

    const { data: transactions = [], isLoading, isFetching, isError, error } = useQuery<Transaction[]>({
      queryKey: queryKeys.transactions(businessId),
      queryFn: async () => {
        const fresh = await financeService.listTransactions(businessId);
        fresh.forEach(t => upsertTransaction(t));
        return fresh;
      },
      staleTime: TTL.TRANSACTIONS,
      refetchOnWindowFocus: true,
      placeholderData: keepPreviousData,
    });

    const createMutation = useMutation<Transaction, Error, Omit<Transaction, "id"|"syncStatus">, { previous?: Transaction[]; optimisticId: string }>({
      mutationFn: payload =>
        financeService.createTransaction({ ...payload, id: createUuid(), syncStatus: "pending" }),

      onMutate: async payload => {
        await queryClient.cancelQueries({ queryKey: queryKeys.transactions(businessId) });
        const previous = queryClient.getQueryData<Transaction[]>(queryKeys.transactions(businessId));
        const optimisticId = createUuid();
        const optimistic: Transaction = { ...payload, id: optimisticId, syncStatus: "pending" };
        queryClient.setQueryData<Transaction[]>(queryKeys.transactions(businessId), old => [optimistic, ...(old ?? [])]);
        upsertTransaction(optimistic);
        analytics.track("transaction_initiated", {
          businessId,
          type: payload.type,
          amountBucket: amountBucket(payload.amount),
        });
        return { previous, optimisticId };
      },

      onError: (_e, _v, ctx) => {
        if (ctx?.previous) queryClient.setQueryData(queryKeys.transactions(businessId), ctx.previous);
        if (ctx?.optimisticId) rollbackTransaction(ctx.optimisticId);
        analytics.track("transaction_failed", { businessId });
      },

      onSuccess: (confirmed, _v, ctx) => {
        queryClient.setQueryData<Transaction[]>(queryKeys.transactions(businessId),
          old => (old ?? []).map(t => t.id === ctx?.optimisticId ? confirmed : t));
        upsertTransaction(confirmed);
        analytics.track("transaction_completed", {
          businessId,
          type: confirmed.type,
          amountBucket: amountBucket(confirmed.amount),
          syncStatus: confirmed.syncStatus,
        });
      },

      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.transactions(businessId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance(businessId) });
      },
    });

    return {
      transactions, isLoading, isFetching, isError, error,
      createTransaction: createMutation.mutate,
      createTransactionAsync: createMutation.mutateAsync,
      isCreating: createMutation.isPending,
      createError: createMutation.error,
    };
  }
  
