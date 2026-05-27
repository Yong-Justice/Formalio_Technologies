import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FicheProgressBar from './components/FicheProgressBar';
import FicheStep1Period from './FicheStep1Period';
import FicheStep2Stock from './FicheStep2Stock';
import FicheStep3Expenses from './FicheStep3Expenses';
import FicheStep4Treasury from './FicheStep4Treasury';
import FicheStep5Result from './FicheStep5Result';
import type { FicheData, FicheResult } from '../../types/fiche.types';

export type FicheCompletionPayload = {
  data: Partial<FicheData>;
  result: FicheResult;
};

export type FicheDraftPayload = {
  data: Partial<FicheData>;
  status: 'draft' | 'awaiting_final_stock';
  savedAt: number;
};

type Props = {
  userId?: string;
  companyId?: string | null;
  initialData?: Partial<FicheData> | null;
  initialStep?: number;
  onBackToHome?: () => void;
  onDraftSaved?: (payload: FicheDraftPayload) => void;
  onComplete?: (payload: FicheCompletionPayload) => void;
};

export default function FicheScreen({ userId, companyId, initialData, initialStep = 1, onBackToHome, onDraftSaved, onComplete }: Props = {}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [ficheData, setFicheData] = useState<Partial<FicheData>>(initialData || {});

  useEffect(() => {
    setFicheData(initialData || {});
    setCurrentStep(initialData ? initialStep : 1);
  }, [initialData, initialStep]);

  const updateFiche = (updates: Partial<FicheData>) => {
    setFicheData((prev) => ({ ...prev, ...updates }));
  };

  const goNext = () => setCurrentStep((step) => Math.min(step + 1, 5));
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1));
  const saveDraft = () => {
    const now = Date.now();
    const draftData: Partial<FicheData> = {
      ...ficheData,
      status: 'awaiting_final_stock',
      updatedAt: now,
      createdAt: ficheData.createdAt || now,
      isSynced: false,
    };
    setFicheData(draftData);
    onDraftSaved?.({ data: draftData, status: 'awaiting_final_stock', savedAt: now });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FicheProgressBar
        currentStep={currentStep}
        totalSteps={5}
        labels={['Periode', 'Articles', 'Depenses', 'Caisse', 'Resultat']}
      />
      {currentStep === 1 && (
        <FicheStep1Period
          data={ficheData}
          onUpdate={updateFiche}
          onNext={goNext}
          onCancel={onBackToHome}
        />
      )}
      {currentStep === 2 && (
        <FicheStep2Stock
          data={ficheData}
          onUpdate={updateFiche}
          onNext={goNext}
          onBack={goBack}
          onSaveDraft={saveDraft}
        />
      )}
      {currentStep === 3 && (
        <FicheStep3Expenses
          data={ficheData}
          onUpdate={updateFiche}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {currentStep === 4 && (
        <FicheStep4Treasury
          data={ficheData}
          onUpdate={updateFiche}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {currentStep === 5 && (
        <FicheStep5Result
          data={ficheData}
          userId={userId}
          companyId={companyId}
          onBack={goBack}
          onComplete={onComplete}
          onBackToHome={onBackToHome}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
});
