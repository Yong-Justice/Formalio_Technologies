import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function TermsAndConditionsScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="terms" onBack={onBack} />;
}
