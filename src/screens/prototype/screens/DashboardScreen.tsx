import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Award,
  BrainCircuit,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';

import { styles } from '../styles';
import { c } from '../theme';
import { formatCompactFCFA, formatFCFA } from '../domain/formatters';
import { formatFicheReminderAge, shouldShowFicheReminder } from '../domain/ficheDocuments';
import type { DemoNotification, Transaction } from '../demoData';
import type { CloudFinancialMetrics } from '@/services/api/formalioBackend';
import type { Screen, ShellProps } from '../contracts';
import {
  AnimatedMascot,
  BuiltInAvatar,
  Card,
  HeaderUtilityActions,
  Icon,
  LogoMark,
  Row,
  ScreenWrapper,
  Tap,
  TransactionRow,
  Txt,
} from '../shared';

export function DashboardScreen({
  shellProps,
  businessName,
  avatarId,
  showBalance,
  setShowBalance,
  notifications,
  offlineMode,
  setOfflineMode,
  transactions,
  metrics,
  navigate,
  lastFicheCompletedAt,
  onStartFiche,
}: {
  shellProps: ShellProps;
  businessName: string;
  avatarId?: string;
  showBalance: boolean;
  setShowBalance: (v: boolean) => void;
  notifications: DemoNotification[];
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  transactions: Transaction[];
  metrics: CloudFinancialMetrics;
  navigate: (s: Screen) => void;
  lastFicheCompletedAt: number | null;
  onStartFiche: () => void;
}) {
  const { width } = useWindowDimensions();
  const recentTransactions = transactions.slice(0, 4);
  const emptyState = metrics.emptyState || metrics.transactionCount === 0;
  const displayName = businessName || 'Formalio';
  const balanceLabel = showBalance ? formatFCFA(metrics.balance) : '********';
  const growthLabel = `${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate.toFixed(1)}%`;
  const eligibleRatio = Math.max(0, Math.min(1, metrics.mosikaScore / 1000));
  const hasInstitutionalLoanSignal = !emptyState && metrics.mosikaScore >= 520 && metrics.scoreConfidence >= 45 && metrics.riskAssessmentLevel !== 'high';
  const estimatedLoan = hasInstitutionalLoanSignal ? Math.round((100000 + Math.pow(eligibleRatio, 2) * 1900000) / 50000) * 50000 : 0;
  const showFicheReminder = shouldShowFicheReminder(lastFicheCompletedAt);
  const compactQuick = width < 390;
  const ultraCompactQuick = width < 350;
  const dashboardTip = emptyState
    ? 'Ajoutez vos premieres donnees, puis construisez plusieurs mois de regularite pour activer un Score Mosika credible.'
    : metrics.profit >= 0
      ? `Votre marge nette est de ${metrics.profitMargin.toFixed(1)}%. Continuez à suivre les dépenses récurrentes pour renforcer le cash flow.`
      : `Vos dépenses dépassent les revenus de ${formatFCFA(Math.abs(metrics.profit))}. Priorisez les encaissements et les charges fixes.`;
  return (
    <ScreenWrapper {...shellProps} noPadding>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <Row style={{ gap: 12 }}>
            <Tap onPress={() => navigate('profile')} style={styles.avatar}>
              <BuiltInAvatar avatarId={avatarId} size={42} />
            </Tap>
            <View>
              <Txt style={{ color: c.surface400, fontSize: 12 }}>Bonjour 👋</Txt>
              <Txt weight="semibold" style={{ fontSize: 14 }}>{displayName}</Txt>
            </View>
          </Row>
          <HeaderUtilityActions offlineMode={offlineMode} setOfflineMode={setOfflineMode} notifications={notifications} navigate={navigate} />
        </Row>
        <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.balanceCard}>
          <View style={[styles.softOrb, { right: -70, top: -70, backgroundColor: 'rgba(255,255,255,.06)' }]} />
          <View style={[styles.softOrb, { left: -52, bottom: -56, backgroundColor: 'rgba(255,255,255,.05)', width: 110, height: 110 }]} />
          <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <Row style={{ gap: 8 }}>
              <LogoMark size={20} />
              <Txt weight="medium" style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }}>Solde Total</Txt>
            </Row>
            <Tap onPress={() => setShowBalance(!showBalance)}>
              <Icon icon={showBalance ? EyeOff : Eye} size={17} color="rgba(255,255,255,.65)" />
            </Tap>
          </Row>
          <Txt weight="bold" style={{ color: c.white, fontSize: 30, marginBottom: 13 }}>{balanceLabel}</Txt>
          <Row style={{ gap: 12 }}>
            <View style={styles.balancePill}>
              <Icon icon={TrendingUp} size={14} color={c.formalio300} />
              <Txt weight="medium" style={{ color: c.formalio300, fontSize: 12 }}>{growthLabel}</Txt>
            </View>
            <Tap onPress={() => navigate('cashflow')} style={styles.balanceDetail}>
              <Txt style={{ color: c.white, fontSize: 12 }}>Détails</Txt>
              <Icon icon={ChevronRight} size={13} color={c.white} />
            </Tap>
          </Row>
        </LinearGradient>
        <View style={styles.dashboardQuickRow}>
          {[
            { label: 'Revenus', icon: TrendingUp, bg: c.formalio50, color: c.formalio700, value: formatCompactFCFA(metrics.revenue), screen: 'cashflow' as Screen },
            { label: 'Dépenses', icon: TrendingDown, bg: c.danger50, color: c.danger600, value: formatCompactFCFA(metrics.expenses), screen: 'cashflow' as Screen },
            { label: 'Score', icon: Award, bg: c.gold50, color: c.gold600, value: String(metrics.mosikaScore), screen: 'credit-score' as Screen },
            { label: 'Rapports', icon: FileText, bg: c.info50, color: c.info600, value: String(metrics.reportCount), screen: 'reports' as Screen },
          ].map((item, index) => (
            <Animated.View key={item.label} entering={FadeIn.delay(index * 55).duration(220)} style={[styles.dashboardQuickCell, index < 3 && styles.dashboardQuickCellGap]}>
              <Tap onPress={() => navigate(item.screen)} style={[styles.quickAction, compactQuick && styles.quickActionCompact, ultraCompactQuick && styles.quickActionUltraCompact]}>
                <View style={[styles.quickIcon, compactQuick && styles.quickIconCompact, { backgroundColor: item.bg }]}>
                  <Icon icon={item.icon} size={compactQuick ? 14 : 17} color={item.color} />
                </View>
                <Txt weight="black" numberOfLines={1} style={[styles.quickValue, compactQuick && styles.quickValueCompact]}>{item.value}</Txt>
                <Txt numberOfLines={1} style={[styles.quickLabel, compactQuick && styles.quickLabelCompact]}>{item.label}</Txt>
              </Tap>
            </Animated.View>
          ))}
        </View>
        <Tap onPress={() => navigate('accounting')} style={{ marginTop: 14 }}>
          <LinearGradient colors={[c.formalio800, c.formalio700, c.info600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiAccounting}>
            <View style={[styles.softOrb, { right: -32, top: -36, width: 120, height: 120, backgroundColor: 'rgba(255,255,255,.1)' }]} />
            <Row style={{ gap: 12 }}>
              <View style={styles.aiIconBox}><Icon icon={BrainCircuit} size={24} color={c.white} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Row style={{ gap: 6 }}>
                  <Txt weight="black" style={{ color: c.white, fontSize: 14 }}>Comptabilité IA Mosika</Txt>
                  <View style={styles.newBadge}><Txt weight="black" style={{ color: c.white, fontSize: 8 }}>NEW</Txt></View>
                </Row>
                <Txt style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 3 }}>P&L, cash flow, fiscalité, rapports IA</Txt>
              </View>
              <Icon icon={ChevronRight} size={20} color="rgba(255,255,255,.72)" />
            </Row>
          </LinearGradient>
        </Tap>
        <View style={styles.mosikaTip}>
          <AnimatedMascot state="thinking" size={48} />
          <View style={{ flex: 1 }}>
            <Row style={{ gap: 4, marginBottom: 3 }}>
              <Icon icon={Sparkles} size={13} color={c.formalio700} />
              <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Conseil de Mosika</Txt>
            </Row>
            <Txt style={{ color: c.surface700, fontSize: 13, lineHeight: 19 }}>{dashboardTip}</Txt>
            <Tap onPress={() => navigate('ai-insights')} style={{ marginTop: 8 }}>
              <Row style={{ gap: 3 }}>
                <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Voir tous les insights</Txt>
                <Icon icon={ChevronRight} size={13} color={c.formalio700} />
              </Row>
            </Tap>
          </View>
        </View>
        {showFicheReminder ? (
          <Tap onPress={onStartFiche} style={styles.ficheReminderCard}>
            <Row style={{ gap: 12, alignItems: 'flex-start' }}>
              <View style={styles.ficheReminderIcon}><Icon icon={FileText} size={22} color={c.amber700} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="black" style={{ color: c.amber700, fontSize: 14 }}>📋 Fiche non complétée</Txt>
                <Txt style={{ color: c.amber700, fontSize: 11, marginTop: 3 }}>Dernière fiche: {formatFicheReminderAge(lastFicheCompletedAt)}</Txt>
                <Txt style={{ color: c.surface700, fontSize: 12, lineHeight: 17, marginTop: 6 }}>Réconciliez votre caisse maintenant</Txt>
                <Row style={styles.ficheReminderButton}>
                  <Txt weight="black" style={{ color: c.amber700, fontSize: 12 }}>Commencer</Txt>
                  <Icon icon={ChevronRight} size={14} color={c.amber700} />
                </Row>
              </View>
            </Row>
          </Tap>
        ) : null}
        <Card style={{ marginTop: 16, marginBottom: 16 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Txt weight="semibold" style={{ fontSize: 14 }}>Transactions Récentes</Txt>
            <Tap onPress={() => navigate('transactions')}>
              <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12 }}>Voir tout</Txt>
            </Tap>
          </Row>
          {recentTransactions.length === 0 ? (
            <View style={styles.noResultsState}>
              <Icon icon={Receipt} size={24} color={c.surface400} />
              <Txt weight="semibold" style={{ marginTop: 10, color: c.surface700 }}>0 transaction</Txt>
              <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 4, textAlign: 'center' }}>Ajoutez un revenu ou une depense pour activer vos KPI.</Txt>
            </View>
          ) : recentTransactions.map((t) => <TransactionRow key={t.id} transaction={t} compact />)}
        </Card>
        <View style={styles.loanCard}>
          <View style={styles.loanIcon}><Icon icon={Award} size={21} color={c.gold600} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold" style={{ fontSize: 14 }}>{emptyState ? 'Score en construction' : 'Éligibilité Mosika dynamique'}</Txt>
            <Txt style={{ color: c.surface600, fontSize: 12, lineHeight: 17, marginTop: 4 }}>
              {emptyState
                ? 'Votre score demarre a 0. Plusieurs mois de donnees verifiees sont necessaires avant toute eligibilite.'
                : hasInstitutionalLoanSignal
                  ? `Score ${metrics.mosikaScore}. Limite indicative stricte: ${formatFCFA(estimatedLoan)} selon vos donnees verifiees.`
                  : `Score ${metrics.mosikaScore}. Historique encore insuffisant pour une pre-approbation institutionnelle.`}
            </Txt>
            <Tap onPress={() => navigate('credit-score')} style={styles.loanButton}>
              <Txt weight="medium" style={{ color: c.white, fontSize: 12 }}>{emptyState ? 'Construire le score' : "Voir l'offre"}</Txt>
            </Tap>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}
