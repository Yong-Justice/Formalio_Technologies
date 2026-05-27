import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, View } from 'react-native';
import { ArrowLeft, Bell, Check, Download, Home, Save, Send } from 'lucide-react-native';
import EcartBadge from './components/EcartBadge';
import { repositories } from '../../database/repositories';
import { generateFichePDF, shareFicheViaWhatsApp } from '../../services/reports/ficheReportGenerator';
import { syncFicheAfterValidation } from '../../services/sync/ficheSyncService';
import { getCurrentSyncUserId } from '../../services/sync/syncIdentity';
import { updateTreasuryBalanceFromFiche } from '../../services/treasury/treasuryBalanceService';
import { useAuthStore } from '../../store/authStore';
import type { EcartCategory, FicheData, FicheResult } from '../../types/fiche.types';
import { calculateFiche, formatFCFA } from '../../utils/ficheCalculator';

type Props = {
  data: Partial<FicheData>;
  userId?: string;
  companyId?: string | null;
  onBack: () => void;
  onBackToHome?: () => void;
  onComplete?: (payload: { data: Partial<FicheData>; result: FicheResult }) => void;
};

const FALLBACK_USER_ID = '00000000-0000-4000-8000-000000000001';

const ECART_CATEGORIES: { value: EcartCategory; label: string }[] = [
  { value: 'offerts_cadeaux', label: 'Articles offerts / Cadeaux' },
  { value: 'casse_perimes', label: 'Casse / Articles perimes' },
  { value: 'erreur_comptage', label: 'Erreur de comptage' },
  { value: 'remboursement_client', label: 'Remboursement client' },
  { value: 'credit_client', label: 'Credit accorde a un client' },
  { value: 'autre', label: 'Autre' },
];

function notify(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

export default function FicheStep5Result({ data, userId, companyId, onBack, onBackToHome, onComplete }: Props) {
  const authUserId = useAuthStore((state) => state.user?.id);
  const [ecartCategory, setEcartCategory] = useState<EcartCategory | undefined>(data.ecartCategory);
  const [justification, setJustification] = useState(data.ecartJustification || '');
  const [saving, setSaving] = useState(false);
  const [savedPayload, setSavedPayload] = useState<{ data: Partial<FicheData>; result: FicheResult } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const result = useMemo(() => calculateFiche(data), [data]);
  const isDeficit = result.ecart < 0;
  const isSurplus = result.ecart > 0;
  const isCritical = result.ecartLevel === 'critical';
  const criticalBlocked = isCritical && !justification.trim();

  const saveFiche = async () => {
    if (criticalBlocked || saving) return;
    setSaving(true);

    const now = Date.now();
    const ownerId = (await getCurrentSyncUserId(userId || authUserId)) || userId || authUserId || FALLBACK_USER_ID;
    const finalData: Partial<FicheData> = {
      ...data,
      userId: ownerId,
      caisseAttendue: result.caisseAttendue,
      caisseReelle: result.caisseReelle,
      ecart: result.ecart,
      ecartPercentage: result.ecartPercentage,
      ecartCategory,
      ecartJustification: justification.trim() || undefined,
      status: 'validated',
      updatedAt: now,
      createdAt: data.createdAt || now,
      isSynced: false,
    };

    try {
      if (Platform.OS !== 'web') {
        const savedFiche = await repositories.fiches.createRecord({
          id: data.id,
          user_id: ownerId,
          company_id: companyId ?? null,
          fiche_type: data.ficheType,
          period_type: data.periodType,
          date_debut: data.dateDebut,
          date_fin: data.dateFin,
          stock_items_json: JSON.stringify(data.stockItems || []),
          service_items_json: JSON.stringify(data.serviceItems || []),
          expenses_json: JSON.stringify(data.expenses || []),
          revenus_theoriques: result.totalRevenusTheoriques,
          total_depenses: result.totalDepenses,
          caisse_attendue: result.caisseAttendue,
          caisse_reelle: result.caisseReelle,
          ecart: result.ecart,
          ecart_percentage: result.ecartPercentage,
          ecart_level: result.ecartLevel,
          ecart_justification: justification.trim() || null,
          ecart_category: ecartCategory || null,
          status: 'validated',
          created_at: now,
          updated_at: now,
        });
        finalData.id = String(savedFiche.id);

        await repositories.transactions.createRecord({
          user_id: ownerId,
          company_id: companyId ?? null,
          type: 'fiche_reconciliation',
          amount: result.caisseReelle,
          category: 'Fiche de Reconciliation',
          description: `Fiche du ${data.dateDebut || ''} au ${data.dateFin || ''}`.trim(),
          payment_method: 'Fiche',
          entry_method: 'fiche_reconciliation',
          recorded_at: now,
          created_at: now,
          updated_at: now,
        });

        for (const expense of data.expenses || []) {
          const recordedAt = Date.parse(`${expense.date}T00:00:00`);
          await repositories.transactions.createRecord({
            id: `fiche-expense-${expense.id}`,
            user_id: ownerId,
            company_id: companyId ?? null,
            type: 'expense',
            amount: expense.montant,
            category: expense.category,
            description: expense.description || 'Depense fiche',
            payment_method: 'Fiche',
            entry_method: 'fiche_reconciliation',
            recorded_at: Number.isNaN(recordedAt) ? now : recordedAt,
            created_at: now,
            updated_at: now,
          });
        }

        await updateTreasuryBalanceFromFiche(finalData, result, companyId);
        void syncFicheAfterValidation(finalData);
      }

      notify('Fiche enregistree ✅');
      onComplete?.({ data: finalData, result });
      setSavedPayload({ data: finalData, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d enregistrer la fiche.';
      Alert.alert('Enregistrement fiche', message);
    } finally {
      setSaving(false);
    }
  };

  const handlePdfAction = async (shareWhatsApp = false) => {
    if (!savedPayload || pdfLoading) return;
    setPdfLoading(true);
    try {
      const filePath = await generateFichePDF(savedPayload.data, 'Formalio');
      if (shareWhatsApp) {
        await shareFicheViaWhatsApp(filePath, savedPayload.data);
        notify('Fiche partagee via WhatsApp');
      } else {
        notify('PDF genere dans Documents');
      }
    } catch (error) {
      Alert.alert('PDF fiche', error instanceof Error ? error.message : 'Impossible de generer le PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (savedPayload) {
    const savedResult = savedPayload.result;
    return (
      <ScrollView contentContainerStyle={styles.successContent}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Fiche enregistrée avec succès!</Text>
        <Text style={styles.successSubtitle}>{savedPayload.data.ficheType || 'Fiche'} · {savedPayload.data.dateDebut || ''}-{savedPayload.data.dateFin || ''}</Text>

        <View style={styles.successCard}>
          <Text style={styles.successCardLabel}>Caisse enregistrée</Text>
          <Text style={styles.successAmount}>{formatFCFA(savedResult.caisseReelle)} FCFA</Text>
          <Text style={[styles.successEcart, savedResult.ecart < 0 ? styles.dangerText : styles.successText]}>
            Écart: {savedResult.ecart >= 0 ? '+' : '-'}{formatFCFA(Math.abs(savedResult.ecart))} FCFA · {savedResult.ecartLevel}
          </Text>
        </View>

        <View style={styles.successDivider} />

        <Pressable onPress={() => handlePdfAction(false)} disabled={pdfLoading} style={styles.successOutlineButton}>
          {pdfLoading ? <ActivityIndicator color="#1B5E37" /> : <Download size={18} color="#1B5E37" />}
          <Text style={styles.successOutlineText}>Télécharger PDF</Text>
        </Pressable>
        <Pressable onPress={() => handlePdfAction(true)} disabled={pdfLoading} style={styles.successOutlineButton}>
          <Send size={18} color="#1B5E37" />
          <Text style={styles.successOutlineText}>Partager via WhatsApp</Text>
        </Pressable>
        <Pressable onPress={onBackToHome} style={styles.successHomeButton}>
          <Home size={18} color="#FFFFFF" />
          <Text style={styles.successHomeText}>Retour à l'accueil</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[styles.hero, heroStyle(result)]}>
        <Text style={[styles.heroTitle, heroTextStyle(result)]}>{heroTitle(result)}</Text>
        <Text style={[styles.heroSubtitle, heroTextStyle(result)]}>{result.message}</Text>
      </View>

      <View style={styles.card}>
        <Line label="Revenus theoriques" value={`${formatFCFA(result.totalRevenusTheoriques)} FCFA`} />
        <Line label="Depenses" value={`- ${formatFCFA(result.totalDepenses)} FCFA`} danger />
        <Line label="Caisse attendue" value={`${formatFCFA(result.caisseAttendue)} FCFA`} />
        <Line label="Caisse reelle" value={`${formatFCFA(result.caisseReelle)} FCFA`} />
        <View style={styles.divider} />
        <Line
          label={isSurplus ? 'SURPLUS' : isDeficit ? 'DEFICIT' : 'Ecart'}
          value={`${isSurplus ? '+' : isDeficit ? '-' : ''}${formatFCFA(Math.abs(result.ecart))} FCFA`}
          strong
          danger={isDeficit}
          success={!isDeficit}
        />
      </View>

      <EcartBadge result={result} />

      {isCritical ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Que faire maintenant?</Text>
          <Text style={styles.recommendation}>1. Recomptez votre caisse calmement</Text>
          <Text style={styles.recommendation}>2. Verifiez si des ventes ont ete faites sans encaisser</Text>
          <Text style={styles.recommendation}>3. Verifiez si un employe a rendu la monnaie en exces</Text>
          <Text style={styles.recommendation}>4. Comparez avec les fiches precedentes</Text>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Justification OBLIGATOIRE</Text>
          <TextInput
            value={justification}
            onChangeText={setJustification}
            placeholder="Expliquez la cause probable..."
            placeholderTextColor="#94A3B8"
            multiline
            style={styles.justificationInput}
          />
        </View>
      ) : null}

      {isDeficit && !isCritical ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Justification recommandee</Text>
          <View style={styles.choiceList}>
            {ECART_CATEGORIES.map((category) => (
              <Pressable
                key={category.value}
                onPress={() => setEcartCategory(category.value)}
                style={[styles.choiceRow, ecartCategory === category.value && styles.choiceRowActive]}
              >
                <View style={[styles.radio, ecartCategory === category.value && styles.radioActive]} />
                <Text style={[styles.choiceText, ecartCategory === category.value && styles.choiceTextActive]}>
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={justification}
            onChangeText={setJustification}
            placeholder="Details optionnels"
            placeholderTextColor="#94A3B8"
            style={styles.justificationInput}
          />
        </View>
      ) : null}

      {isSurplus ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Un surplus peut indiquer</Text>
          <Text style={styles.recommendation}>• Prix de vente legerement superieur</Text>
          <Text style={styles.recommendation}>• Erreur de comptage du stock</Text>
          <Text style={styles.recommendation}>• Ancien stock vendu non comptabilise</Text>
        </View>
      ) : null}

      <View style={styles.recommendationCard}>
        <Text style={styles.sectionTitle}>Recommandation</Text>
        <Text style={styles.recommendation}>{result.recommendation}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onBack} style={styles.secondaryButton}>
          <ArrowLeft size={17} color="#475569" />
          <Text style={styles.secondaryText}>{isDeficit ? 'Recompter' : 'Corriger'}</Text>
        </Pressable>
        <Pressable
          onPress={saveFiche}
          disabled={criticalBlocked || saving}
          style={[styles.primaryButton, criticalBlocked && styles.primaryButtonDisabled]}
        >
          {isCritical ? <Bell size={17} color="#FFFFFF" /> : saving ? <Save size={17} color="#FFFFFF" /> : <Check size={17} color="#FFFFFF" />}
          <Text style={styles.primaryText}>
            {saving ? 'Enregistrement...' : isCritical ? 'Valider + alerter' : isDeficit ? 'Valider quand meme' : 'Valider la fiche'}
          </Text>
        </Pressable>
      </View>

      {criticalBlocked ? (
        <Text style={styles.errorText}>Une justification est obligatoire pour un deficit critique.</Text>
      ) : null}
    </ScrollView>
  );
}

function heroTitle(result: FicheResult) {
  if (result.ecart === 0) return '✅ Caisse parfaite!';
  if (result.ecart > 0) return '✅ Surplus detecte';
  if (result.ecartLevel === 'critical') return '🚨 DEFICIT CRITIQUE';
  if (result.ecartLevel === 'warning') return '⚠️ Leger deficit detecte';
  return '⚠️ Deficit detecte';
}

function heroStyle(result: FicheResult) {
  if (result.ecartLevel === 'critical') return { backgroundColor: '#FEF2F2', borderColor: '#EF4444' };
  if (result.ecartLevel === 'danger') return { backgroundColor: '#FFF7ED', borderColor: '#F97316' };
  if (result.ecartLevel === 'warning') return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
  return { backgroundColor: '#ECFDF5', borderColor: '#10B981' };
}

function heroTextStyle(result: FicheResult) {
  if (result.ecartLevel === 'critical') return { color: '#B91C1C' };
  if (result.ecartLevel === 'danger') return { color: '#C2410C' };
  if (result.ecartLevel === 'warning') return { color: '#92400E' };
  return { color: '#047857' };
}

function Line({
  label,
  value,
  strong,
  danger,
  success,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
  success?: boolean;
}) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.lineStrong]}>{label}</Text>
      <Text
        style={[
          styles.lineValue,
          strong && styles.lineStrong,
          danger && styles.dangerText,
          success && styles.successText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 34,
  },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineLabel: {
    color: '#64748B',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  lineValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  lineStrong: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  dangerText: {
    color: '#DC2626',
  },
  successText: {
    color: '#047857',
  },
  divider: {
    backgroundColor: '#CBD5E1',
    height: 1,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  recommendation: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  recommendationCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  choiceList: {
    gap: 7,
  },
  choiceRow: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  choiceRowActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  radio: {
    borderColor: '#CBD5E1',
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  radioActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  choiceText: {
    color: '#475569',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  choiceTextActive: {
    color: '#047857',
  },
  justificationInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    minHeight: 52,
    padding: 12,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    flex: 1.35,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  successContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  successIconText: {
    color: '#16A34A',
    fontSize: 54,
    fontWeight: '900',
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    width: '100%',
  },
  successCardLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  successAmount: {
    color: '#1B5E37',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  successEcart: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },
  successDivider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    width: '100%',
  },
  successOutlineButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#1B5E37',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    width: '100%',
  },
  successOutlineText: {
    color: '#1B5E37',
    fontSize: 14,
    fontWeight: '900',
  },
  successHomeButton: {
    alignItems: 'center',
    backgroundColor: '#1B5E37',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    width: '100%',
  },
  successHomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
