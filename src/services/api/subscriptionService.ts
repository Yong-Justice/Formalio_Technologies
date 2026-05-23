import { request } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export interface Invoice {
  id: string;
  amount: number;
  currency: 'XAF';
  status: 'paid' | 'pending' | 'failed';
  issuedAt: string;
}

export const subscriptionService = {
  current() {
    return request<{ plan: string; status: string; renewsAt?: string }>({ method: 'GET', url: endpoints.payments.subscription });
  },
  invoices() {
    return request<Invoice[]>({ method: 'GET', url: endpoints.payments.invoices });
  },
  createCheckout(planId: string) {
    return request<{ checkoutUrl: string }>({ method: 'POST', url: endpoints.payments.checkout, data: { planId } });
  }
};