import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function PrivacyPolicyScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="privacy" onBack={onBack} />;
}
