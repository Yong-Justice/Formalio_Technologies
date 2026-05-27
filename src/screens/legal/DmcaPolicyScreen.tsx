import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function DmcaPolicyScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="dmca" onBack={onBack} />;
}
