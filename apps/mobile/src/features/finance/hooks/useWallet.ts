import { useQuery } from "@tanstack/react-query";
  import { financeService } from "@/features/finance/services/finance.service";
  import { useFinanceStore } from "@/features/finance/state/finance.store";
  import { TTL, queryKeys } from "@/services/cache/ttl";
  import { queryStorage, getJson, storageKeys } from "@/services/storage/mmkv";
  import type { WalletBalance } from "@/types/domain";

  function formatAgo(iso: string | undefined): string {
    if (!iso) return "Unknown";
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1_000);
    if (s < 60)  return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }

  /**
   * Wallet balance — 30s stale-while-revalidate.
   * Shows cached balance from encrypted MMKV immediately while fresh fetch runs.
   * Exposes lastUpdatedLabel ("32s ago") for offline display.
   * Balance is server-authoritative: local values are never used in calculations.
   */
  export function useWallet(businessId: string) {
    const cached = useFinanceStore(s => s.walletBalance);
    const setWalletBalance = useFinanceStore(s => s.setWalletBalance);

    const { data, isLoading, isFetching, isError, error } = useQuery<WalletBalance>({
      queryKey: queryKeys.walletBalance(businessId),
      queryFn: async () => {
        const fresh = await financeService.getWalletBalance(businessId);
        setWalletBalance(fresh);
        return fresh;
      },
      staleTime: TTL.WALLET_BALANCE,
      refetchInterval: TTL.WALLET_BALANCE,
      placeholderData: cached ?? undefined,
    });

    const serverTs = data?.lastUpdated;
    const mmkvTs   = getJson<string|undefined>(queryStorage, storageKeys.query.walletLastUpdated, undefined);
    const lastUpdatedLabel = formatAgo(serverTs ?? mmkvTs);

    return { balance: data ?? cached, lastUpdatedLabel, isLoading, isFetching, isError, error };
  }
  
