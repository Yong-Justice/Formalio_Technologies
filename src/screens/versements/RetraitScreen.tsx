import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Banknote, Check, ChevronRight, Home, Package, User, WalletCards } from 'lucide-react-native';
import { createUuid } from '@/utils/uuid';
import type { VersementDestination, VersementItem } from '@/types/versement.types';
import { VERSEMENT_DESTINATION_LABELS } from '@/types/versement.types';
import { formatFCFA } from '@/utils/ficheCalculator';
import { styles } from '@/screens/prototype/styles';
import { c, inputTextMaxScale } from '@/screens/prototype/theme';
import type { ShellProps } from '@/screens/prototype/contracts';
import { Card, Field, Grid, Icon, PrimaryButton, Row, ScreenWrapper, Tap, Txt } from '@/screens/prototype/shared';
import { parseNumberInput } from '@/screens/prototype/domain/transactions';

type DestinationOption = {
  key: VersementDestination;
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
};

const DESTINATIONS: DestinationOption[] = [
  { key: 'domicile', icon: Home, title: 'Mise en sécurité', subtitle: 'chez moi' },
  { key: 'banque', icon: WalletCards, title: 'Dépôt banque', subtitle: 'ou MoMo' },
  { key: 'personnel', icon: User, title: 'Usage', subtitle: 'personnel' },
  { key: 'stock', icon: Package, title: 'Achat de', subtitle: 'stock' },
  { key: 'fournisseur', icon: Banknote, title: 'Paiement', subtitle: 'fournisseur' },
  { key: 'autre', icon: Check, title: 'Autre', subtitle: 'raison' },
];

export function RetraitScreen({
  shellProps,
  currentBalance,
  userId,
  companyId,
  onConfirm,
}: {
  shellProps?: ShellProps;
  currentBalance?: number;
  userId?: string;
  companyId?: string | null;
  onConfirm?: (versement: VersementItem, nextBalance: number) => void;
}) {
  const [destination, setDestination] = useState<VersementDestination | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [versementDate, setVersementDate] = useState(new Date().toISOString().slice(0, 10));
  const amountValue = parseNumberInput(amount);
  const safeCurrentBalance = Number(currentBalance) || 0;
  const nextBalance = Math.max(0, safeCurrentBalance - amountValue);
  const canSubmit = Boolean(destination && amountValue > 0 && amountValue <= safeCurrentBalance && onConfirm);
  const selectedLabel = destination ? VERSEMENT_DESTINATION_LABELS[destination] : '';

  const versement = useMemo<VersementItem | null>(() => {
    if (!destination) return null;
    const now = new Date();
    return {
      id: createUuid(),
      userId: userId || '',
      companyId: companyId ?? null,
      montant: amountValue,
      destination,
      destinationLabel: selectedLabel,
      description: description.trim() || undefined,
      versementDate,
      versementTime: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isSynced: false,
      createdAt: now.getTime(),
    };
  }, [amountValue, companyId, description, destination, selectedLabel, userId, versementDate]);

  if (!shellProps) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
        <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>Ouvrez le retrait depuis le bouton + de Formalio.</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper {...shellProps} title="Retrait de caisse">
      <View style={{ gap: 16 }}>
        <Txt weight="black" style={{ color: c.surface900, fontSize: 22, lineHeight: 28 }}>Que faites-vous avec cet argent?</Txt>
        <Grid columns={2} gap={10}>
          {DESTINATIONS.map((option) => {
            const selected = destination === option.key;
            return (
              <Tap key={option.key} onPress={() => setDestination(option.key)} style={[styles.retraitDestinationCard, selected && styles.retraitDestinationCardSelected]}>
                <Icon icon={option.icon as any} size={24} color={selected ? c.formalio700 : c.surface500} />
                <Txt weight="black" style={{ color: selected ? c.formalio700 : c.surface800, fontSize: 12, textAlign: 'center' }}>{option.title}</Txt>
                <Txt style={{ color: selected ? c.formalio700 : c.surface500, fontSize: 11, textAlign: 'center' }}>{option.subtitle}</Txt>
              </Tap>
            );
          })}
        </Grid>

        {destination ? (
          <View style={{ gap: 14 }}>
            <View>
              <Txt weight="bold" style={styles.fieldLabel}>Montant retiré</Txt>
              <View style={styles.retraitAmountBox}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={c.surface300}
                  maxFontSizeMultiplier={inputTextMaxScale}
                  style={styles.retraitAmountInput}
                />
                <Txt weight="black" style={{ color: c.surface500, fontSize: 16 }}>FCFA</Txt>
              </View>
            </View>
            <Field label="Description (optionnelle)" value={description} onChangeText={setDescription} placeholder="Ex: Fin de journée - sécurité" />
            <Field label="Date" value={versementDate} onChangeText={setVersementDate} placeholder="YYYY-MM-DD" />
            <Card style={styles.retraitSummaryCard}>
              <Info label="Solde actuel" value={`${formatFCFA(safeCurrentBalance)} FCFA`} />
              <Info label="Après ce retrait" value={`${formatFCFA(nextBalance)} FCFA`} strong />
              {amountValue > safeCurrentBalance ? <Txt style={{ color: c.danger600, fontSize: 11, marginTop: 4 }}>Le montant dépasse le solde actuel.</Txt> : null}
            </Card>
            <PrimaryButton
              label="Confirmer le retrait"
              icon={ChevronRight}
              disabled={!canSubmit || !versement}
              onPress={() => versement && onConfirm?.(versement, nextBalance)}
              style={{ minHeight: 54, borderRadius: 16 }}
            />
          </View>
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between', gap: 10 }}>
      <Txt style={{ color: c.surface500, fontSize: 12 }}>{label}</Txt>
      <Txt weight={strong ? 'black' : 'bold'} style={{ color: strong ? c.formalio700 : c.surface800, fontSize: strong ? 16 : 13 }}>{value}</Txt>
    </Row>
  );
}

export default RetraitScreen;
