export const endpoints = {
  auth: {
    register: '/auth/register',
    verifyOtp: '/auth/verify-otp',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/users/me'
  },
  businesses: {
    list: '/businesses',
    detail: (businessId: string) => `/businesses/${businessId}`,
    transactions: (businessId: string) => `/businesses/${businessId}/transactions`,
    reports: (businessId: string) => `/businesses/${businessId}/reports`,
    generateReport: (businessId: string) => `/businesses/${businessId}/reports/generate`,
    creditScore: (businessId: string) => `/businesses/${businessId}/credit-score`
  },
  ai: {
    categorize: '/ai/categorize',
    chat: '/ai/chat',
    insights: '/ai/insights',
    document: '/ai/document'
  },
  payments: {
    checkout: '/payments/notchpay/checkout',
    subscription: '/subscriptions/me',
    invoices: '/subscriptions/invoices'
  },
  integrations: {
    momoCsvImport: (businessId: string) => `/businesses/${businessId}/integrations/momo/csv-import`,
    whatsappBot: '/integrations/whatsapp/messages'
  }
} as const;