import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function CookiePolicyScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="cookie" onBack={onBack} />;
}
