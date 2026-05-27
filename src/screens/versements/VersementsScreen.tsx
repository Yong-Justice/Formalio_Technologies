import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Banknote, Calendar, Home, Package, User, WalletCards } from 'lucide-react-native';
import type { VersementDestination, VersementItem } from '@/types/versement.types';
import { formatFCFA } from '@/utils/ficheCalculator';
import { styles } from '@/screens/prototype/styles';
import { c } from '@/screens/prototype/theme';
import type { ShellProps } from '@/screens/prototype/contracts';
import { Card, Icon, Row, ScreenWrapper, Tap, Txt } from '@/screens/prototype/shared';

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function iconFor(destination: VersementDestination) {
  if (destination === 'domicile') return Home;
  if (destination === 'stock') return Package;
  if (destination === 'personnel') return User;
  if (destination === 'banque' || destination === 'momo') return WalletCards;
  return Banknote;
}

export function VersementsScreen({ shellProps, versements = [] }: { shellProps?: ShellProps; versements?: VersementItem[] }) {
  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(versements.map((versement) => monthKey(versement.versementDate)).filter(Boolean)));
    return ['all', ...keys];
  }, [versements]);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState('all');
  const filtered = monthFilter === 'all' ? versements : versements.filter((versement) => monthKey(versement.versementDate) === monthFilter);
  const monthVersements = versements.filter((versement) => monthKey(versement.versementDate) === currentMonth);
  const monthTotal = monthVersements.reduce((sum, versement) => sum + versement.montant, 0);

  if (!shellProps) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
        <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>L'historique des retraits est disponible depuis l'onglet Profil.</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper {...shellProps} title="Historique des retraits">
      <View style={{ gap: 14 }}>
        <Card style={styles.versementSummaryCard}>
          <Row style={{ gap: 10 }}>
            <View style={styles.versementSummaryIcon}><Icon icon={Calendar} size={19} color={c.formalio700} /></View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" style={{ color: c.surface700, fontSize: 12 }}>Total retiré ce mois</Txt>
              <Txt weight="black" style={{ color: c.danger600, fontSize: 22, marginTop: 2 }}>-{formatFCFA(monthTotal)} FCFA</Txt>
              <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>{monthVersements.length} retrait(s) en {monthLabel(currentMonth)}</Txt>
            </View>
          </Row>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {monthOptions.map((option) => {
            const active = monthFilter === option;
            return (
              <Tap key={option} onPress={() => setMonthFilter(option)} style={[styles.filterChip, active && styles.filterChipActive]}>
                <Txt weight="bold" style={{ color: active ? c.formalio700 : c.surface600, fontSize: 11 }}>{option === 'all' ? 'Tous' : monthLabel(option)}</Txt>
              </Tap>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.ficheDocsEmpty}>
            <Icon icon={Banknote} size={25} color={c.surface400} />
            <Txt weight="bold" style={{ color: c.surface700, fontSize: 13, marginTop: 8 }}>Aucun retrait enregistré.</Txt>
            <Txt style={{ color: c.surface500, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 4 }}>Utilisez 💸 Retrait pour noter quand vous prenez de l'argent de la caisse.</Txt>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((versement) => {
              const DestinationIcon = iconFor(versement.destination);
              return (
                <Card key={versement.id} style={styles.versementRowCard}>
                  <Row style={{ gap: 12, alignItems: 'flex-start' }}>
                    <View style={styles.versementRowIcon}><Icon icon={DestinationIcon} size={18} color={c.danger600} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt weight="black" numberOfLines={1} style={{ color: c.surface800, fontSize: 13 }}>{versement.destinationLabel}</Txt>
                      <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>
                        {new Date(`${versement.versementDate}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} · {versement.versementTime}
                      </Txt>
                      {versement.description ? <Txt numberOfLines={2} style={{ color: c.surface500, fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>“{versement.description}”</Txt> : null}
                    </View>
                    <Txt weight="black" style={{ color: c.danger600, fontSize: 13 }}>-{formatFCFA(versement.montant)}</Txt>
                  </Row>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

export default VersementsScreen;
