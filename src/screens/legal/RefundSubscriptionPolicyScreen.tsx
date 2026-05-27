import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function RefundSubscriptionPolicyScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="refundSubscription" onBack={onBack} />;
}
