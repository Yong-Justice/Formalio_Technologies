import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function DataRetentionPolicyScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="dataRetention" onBack={onBack} />;
}
