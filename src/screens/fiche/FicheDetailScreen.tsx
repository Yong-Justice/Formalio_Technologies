import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { ArrowLeft, Download, Send } from 'lucide-react-native';
import { FICHE_TEMPLATES } from '@/constants/ficheTemplates';
import { repositories } from '@/database/repositories';
import { generateFichePDF, shareFicheViaWhatsApp } from '@/services/reports/ficheReportGenerator';
import { useAuthStore } from '@/store/authStore';
import type { FicheData, FicheRecord } from '@/types/fiche.types';
import { calculateFiche, calculateStockRow, formatFCFA } from '@/utils/ficheCalculator';

type Props = {
  ficheId?: string;
  fiche?: Partial<FicheData>;
  businessName?: string;
  onBack?: () => void;
};

function notify(message: string) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function fromRecord(record: FicheRecord): Partial<FicheData> {
  return {
    id: record.id,
    userId: record.user_id,
    ficheType: record.fiche_type,
    periodType: record.period_type,
    dateDebut: record.date_debut,
    dateFin: record.date_fin,
    stockItems: parseJson(record.stock_items_json, []),
    serviceItems: parseJson(record.service_items_json, []),
    expenses: parseJson(record.expenses_json, []),
    caisseAttendue: record.caisse_attendue,
    caisseReelle: record.caisse_reelle,
    ecart: record.ecart,
    ecartPercentage: record.ecart_percentage,
    ecartJustification: record.ecart_justification ?? undefined,
    ecartCategory: record.ecart_category ?? undefined,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    isSynced: record.is_synced,
  };
}

function businessLabel(fiche: Partial<FicheData>) {
  const template = FICHE_TEMPLATES.find((item) => item.type === fiche.ficheType);
  return template ? `${template.emoji} ${template.label}` : '📋 Fiche';
}

export default function FicheDetailScreen({ ficheId, fiche, businessName = 'Entreprise', onBack }: Props) {
  const userId = useAuthStore((state) => state.user?.id);
  const [loadedFiche, setLoadedFiche] = useState<Partial<FicheData> | null>(fiche ?? null);
  const [loading, setLoading] = useState(Boolean(ficheId && !fiche));
  const [pdfLoading, setPdfLoading] = useState(false);
  const data = loadedFiche ?? {};
  const result = useMemo(() => calculateFiche(data), [data]);

  useEffect(() => {
    if (!ficheId || fiche) return;
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const records = await repositories.fiches.getRecords(userId || data.userId || '', { limit: 100 });
        const record = (records as unknown as FicheRecord[]).find((item) => item.id === ficheId);
        if (active && record) setLoadedFiche(fromRecord(record));
      } catch (error) {
        if (active) Alert.alert('Fiche', error instanceof Error ? error.message : 'Impossible de charger la fiche.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [data.userId, fiche, ficheId, userId]);

  const generate = async (shareWhatsApp = false) => {
    setPdfLoading(true);
    try {
      const filePath = await generateFichePDF(data, businessName);
      if (shareWhatsApp) {
        await shareFicheViaWhatsApp(filePath, data);
        notify('Fiche partagée via WhatsApp');
      } else {
        notify('PDF généré dans Documents');
      }
    } catch (error) {
      Alert.alert('PDF fiche', error instanceof Error ? error.message : 'Impossible de générer le PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1B5E37" />
        <Text style={styles.muted}>Chargement de la fiche...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={17} color="#1B5E37" />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{businessLabel(data)}</Text>
        <Text style={styles.headerSub}>{data.dateDebut || 'début'} → {data.dateFin || 'fin'}</Text>
        <Text style={styles.headerMeta}>Validée le {new Date(data.updatedAt || Date.now()).toLocaleString('fr-FR')}</Text>
      </View>

      <Section title="Articles / Produits">
        {(data.stockItems || []).map((item) => {
          const calc = calculateStockRow(item);
          return (
            <View key={item.id} style={styles.rowCard}>
              <Text style={styles.rowTitle}>{item.productName}</Text>
              <Info label="Début" value={`${item.quantiteOuverture || 0} ${item.unit || ''}`} />
              <Info label="Fin" value={`${item.quantiteFermeture || 0} ${item.unit || ''}`} />
              <Info label="Vendus" value={`${calc.venduTheorique} ${item.unit || ''}`} />
              <Info label="Montant" value={`${formatFCFA(calc.montantTheorique)} FCFA`} strong />
            </View>
          );
        })}
        {(data.serviceItems || []).map((item) => (
          <View key={item.id} style={styles.rowCard}>
            <Text style={styles.rowTitle}>{item.serviceName}</Text>
            <Info label="Nombre réalisé" value={`${item.nombreRealise || 0}`} />
            <Info label="Prix" value={`${formatFCFA(item.prixUnitaire || 0)} FCFA`} />
            <Info label="Montant" value={`${formatFCFA((item.nombreRealise || 0) * (item.prixUnitaire || 0))} FCFA`} strong />
          </View>
        ))}
        {(data.stockItems || []).length === 0 && (data.serviceItems || []).length === 0 ? <Text style={styles.muted}>Aucun article dans cette fiche.</Text> : null}
      </Section>

      <Section title="Dépenses">
        {(data.expenses || []).map((expense) => (
          <Info key={expense.id} label={expense.description || expense.category} value={`-${formatFCFA(expense.montant || 0)} FCFA`} danger />
        ))}
        {(data.expenses || []).length === 0 ? <Text style={styles.muted}>Aucune dépense.</Text> : null}
      </Section>

      <Section title="Récapitulatif">
        <Info label="Revenus théoriques" value={`${formatFCFA(result.totalRevenusTheoriques)} FCFA`} />
        <Info label="Dépenses" value={`-${formatFCFA(result.totalDepenses)} FCFA`} danger />
        <Info label="Caisse attendue" value={`${formatFCFA(result.caisseAttendue)} FCFA`} strong />
        <Info label="Caisse réelle" value={`${formatFCFA(result.caisseReelle)} FCFA`} strong />
        <Info label={result.ecart >= 0 ? 'Surplus / Écart' : 'Déficit'} value={`${result.ecart >= 0 ? '+' : '-'}${formatFCFA(Math.abs(result.ecart))} FCFA`} danger={result.ecart < 0} success={result.ecart >= 0} strong />
        {data.ecartJustification ? <Info label="Justification" value={data.ecartJustification} /> : null}
      </Section>

      <View style={styles.actions}>
        <Pressable disabled={pdfLoading} onPress={() => generate(false)} style={styles.outlineButton}>
          <Download size={17} color="#1B5E37" />
          <Text style={styles.outlineText}>{pdfLoading ? 'Génération...' : 'Télécharger PDF'}</Text>
        </Pressable>
        <Pressable disabled={pdfLoading} onPress={() => generate(true)} style={styles.outlineButton}>
          <Send size={17} color="#1B5E37" />
          <Text style={styles.outlineText}>Partager via WhatsApp</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Info({
  label,
  value,
  danger,
  success,
  strong,
}: {
  label: string;
  value: string;
  danger?: boolean;
  success?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, strong && styles.strong, danger && styles.danger, success && styles.success]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: '#F8FAFC', gap: 14, padding: 16, paddingBottom: 36 },
  center: { alignItems: 'center', backgroundColor: '#F8FAFC', flex: 1, justifyContent: 'center', gap: 10 },
  muted: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, paddingVertical: 4 },
  backText: { color: '#1B5E37', fontSize: 13, fontWeight: '800' },
  header: { backgroundColor: '#1B5E37', borderRadius: 18, padding: 18 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  headerSub: { color: '#DCFCE7', fontSize: 13, fontWeight: '800', marginTop: 6 },
  headerMeta: { color: 'rgba(255,255,255,.72)', fontSize: 11, fontWeight: '700', marginTop: 8 },
  section: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 16, borderWidth: 1, gap: 9, padding: 14 },
  sectionTitle: { color: '#0F172A', fontSize: 15, fontWeight: '900' },
  rowCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 13, borderWidth: 1, gap: 6, padding: 12 },
  rowTitle: { color: '#0F172A', fontSize: 13, fontWeight: '900' },
  infoLine: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#64748B', flex: 1, fontSize: 12, fontWeight: '700' },
  infoValue: { color: '#0F172A', flexShrink: 1, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  strong: { fontSize: 14, fontWeight: '900' },
  danger: { color: '#DC2626' },
  success: { color: '#16A34A' },
  actions: { gap: 10 },
  outlineButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#1B5E37', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50 },
  outlineText: { color: '#1B5E37', fontSize: 13, fontWeight: '900' },
});
