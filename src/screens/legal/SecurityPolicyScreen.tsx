import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function SecurityPolicyScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="security" onBack={onBack} />;
}
