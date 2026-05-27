import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function AcceptableUsePolicyScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="acceptableUse" onBack={onBack} />;
}
