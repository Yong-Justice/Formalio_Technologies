import React from 'react';
import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';

export default function CommunityGuidelinesScreen({ onBack }: { onBack?: () => void }) {
  return <LegalDocumentScreen documentKey="communityGuidelines" onBack={onBack} />;
}
