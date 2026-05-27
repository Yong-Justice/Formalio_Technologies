import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function RegulatoryComplianceScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="regulatoryCompliance" onBack={onBack} />;
}
