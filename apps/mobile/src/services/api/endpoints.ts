export const endpoints = {
    auth: { register: '/auth/register', verifyOtp: '/auth/verify-otp', login: '/auth/login', refresh: '/auth/refresh', logout: '/auth/logout', me: '/users/me' },
    businesses: { list: '/businesses', detail: (b: string) => `/businesses/${b}`, transactions: (b: string) => `/businesses/${b}/transactions`, reports: (b: string) => `/businesses/${b}/reports`, generateReport: (b: string) => `/businesses/${b}/reports/generate`, creditScore: (b: string) => `/businesses/${b}/credit-score` },
    wallet: { balance: (b: string) => `/businesses/${b}/wallet/balance` },
    exchange: { rates: '/exchange-rates' },
    ai: { categorize: '/ai/categorize', chat: '/ai/chat', insights: '/ai/insights', document: '/ai/document' },
    payments: { checkout: '/payments/notchpay/checkout', subscription: '/subscriptions/me', invoices: '/subscriptions/invoices' },
    integrations: { momoCsvImport: (b: string) => `/businesses/${b}/integrations/momo/csv-import`, whatsappBot: '/integrations/whatsapp/messages' },
    security: { deviceIntegrity: '/security/device-integrity' },
  } as const;
  