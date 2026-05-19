const SECOND = 1_000;
  const MINUTE = 60 * SECOND;
  const HOUR   = 60 * MINUTE;

  /** TTL constants — single source of truth for all React Query staleTime values */
  export const TTL = {
    WALLET_BALANCE:    30 * SECOND,   // stale-while-revalidate + poll
    TRANSACTIONS:       5 * MINUTE,   // background refetch on tab focus
    CREDIT_SCORE:      24 * HOUR,     // expensive ML compute, intraday stable
    EXCHANGE_RATES:     1 * HOUR,     // MTN MoMo + Orange Money
    BUSINESS_PROFILE:   1 * HOUR,
    AI_INSIGHTS:        6 * HOUR,
    SYSCOHADA_REPORTS:  Infinity,     // pinned until user regenerates
  } as const;

  /** Centralised query keys — prevents string drift across hooks */
  export const queryKeys = {
    walletBalance:   (businessId: string) => ["wallet", "balance", businessId] as const,
    transactions:    (businessId: string) => ["transactions", businessId]       as const,
    creditScore:     (businessId: string) => ["creditScore", businessId]        as const,
    exchangeRates:   ()                   => ["exchangeRates"]                  as const,
    businessProfile: (businessId: string) => ["business", businessId]           as const,
    aiInsights:      (businessId: string) => ["aiInsights", businessId]         as const,
    reports:         (businessId: string) => ["reports", businessId]            as const,
  } as const;
  