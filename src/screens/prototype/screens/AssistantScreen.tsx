import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TextInput, View } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  Calculator,
  Check,
  ChevronRight,
  Download,
  MessageCircle,
  Mic,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  TrendingDown,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { formalioBackend, type CloudFinancialMetrics } from '@/services/api/formalioBackend';
import { translate, type SupportedLanguage } from '@/i18n';
import { styles } from '../styles';
import { c, inputTextMaxScale } from '../theme';
import { formatFCFA } from '../domain/formatters';
import type { Transaction } from '../demoData';
import type { LoanRequestRecord, ParsedTransaction } from '../contracts';
import {
  AnimatedMascot,
  Card,
  Icon,
  InfoLine,
  ModalShell,
  PrimaryButton,
  Row,
  Tap,
  Txt,
  useAppLanguage,
  useToast,
} from '../shared';

export function CapabilityCard({ icon, t, d, tone }: { icon: LucideIcon; t: string; d: string; tone: string }) {
  const palette = tone === 'green' ? [c.formalio50, c.formalio700] : tone === 'amber' ? [c.gold50, c.gold600] : [c.info50, c.info600];
  return (
    <Card style={{ padding: 12 }}>
      <View style={[styles.metricIcon, { backgroundColor: palette[0], marginBottom: 8 }]}><Icon icon={icon} size={16} color={palette[1]} /></View>
      <Txt weight="bold" style={{ fontSize: 11, lineHeight: 15 }}>{t}</Txt>
      <Txt style={{ color: c.surface500, fontSize: 10, marginTop: 3 }}>{d}</Txt>
    </Card>
  );
}

export function ThinkingCard() {
  return (
    <Card>
      <Row style={{ gap: 12, marginBottom: 10 }}>
        <AnimatedMascot state="thinking" size={48} />
        <View><Txt weight="bold" style={{ fontSize: 12 }}>Mosika analyse vos données</Txt><Txt style={{ color: c.surface500, fontSize: 10 }}>Transactions, tendances, anomalies...</Txt></View>
      </Row>
      {['Lecture des transactions', 'Calcul des tendances', "Détection d'anomalies", "Génération d'insights"].map((step, i) => (
        <Animated.View key={step} entering={FadeIn.delay(i * 300)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <View style={styles.tinyDot} />
          <Txt style={{ color: c.surface600, fontSize: 11 }}>{step}</Txt>
        </Animated.View>
      ))}
    </Card>
  );
}

type AssistantVoiceMode = 'idle' | 'recording' | 'preview' | 'playing';

function formatAssistantVoiceDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function RecordingPulse({ active }: { active: boolean }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = active ? withRepeat(withSequence(withTiming(1.12, { duration: 760 }), withTiming(1, { duration: 760 })), -1, false) : withTiming(1, { duration: 180 });
  }, [active, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: active ? interpolate(pulse.value, [1, 1.12], [0.18, 0.06], Extrapolation.CLAMP) : 0,
    transform: [{ scale: pulse.value }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.voicePulseRing, pulseStyle]} />;
}

function AssistantVoiceNotePanel({
  mode,
  duration,
  error,
  onStop,
  onCancel,
  onReplay,
  onSend,
}: {
  mode: AssistantVoiceMode;
  duration: number;
  error: string;
  onStop: () => void;
  onCancel: () => void;
  onReplay: () => void;
  onSend: () => void;
}) {
  if (mode === 'idle' && !error) return null;
  const recording = mode === 'recording';
  const preview = mode === 'preview' || mode === 'playing';
  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.voiceNotePanel}>
      {error ? (
        <Row style={{ gap: 8, alignItems: 'flex-start' }}>
          <Icon icon={AlertTriangle} size={16} color={c.danger600} />
          <Txt style={{ color: c.danger600, fontSize: 12, lineHeight: 17, flex: 1 }}>{error}</Txt>
          <Tap onPress={onCancel}><Icon icon={X} size={16} color={c.surface500} /></Tap>
        </Row>
      ) : null}
      {recording ? (
        <View style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <Row style={{ gap: 10 }}>
              <View style={styles.recordingMicWrap}>
                <RecordingPulse active />
                <View style={styles.recordingMic}><Icon icon={Mic} size={18} color={c.white} /></View>
              </View>
              <View>
                <Txt weight="black" style={{ color: c.surface900, fontSize: 13 }}>Recording voice note</Txt>
                <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>Tap stop when you are finished.</Txt>
              </View>
            </Row>
            <Txt weight="black" style={{ color: c.formalio700, fontSize: 16 }}>{formatAssistantVoiceDuration(duration)}</Txt>
          </Row>
          <Waveform active />
          <Row style={{ gap: 8 }}>
            <Tap onPress={onCancel} style={styles.voiceControlButton}>
              <Icon icon={Trash2} size={15} color={c.surface600} />
              <Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>Cancel</Txt>
            </Tap>
            <Tap onPress={onStop} style={[styles.voiceControlButton, styles.voiceStopButton]}>
              <Icon icon={Square} size={14} color={c.white} />
              <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>Stop</Txt>
            </Tap>
          </Row>
        </View>
      ) : null}
      {preview ? (
        <View style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between', gap: 10 }}>
            <View>
              <Txt weight="black" style={{ color: c.surface900, fontSize: 13 }}>Voice note ready</Txt>
              <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>Preview before sending. Transcription will run after upload.</Txt>
            </View>
            <Txt weight="black" style={{ color: c.formalio700, fontSize: 16 }}>{formatAssistantVoiceDuration(duration)}</Txt>
          </Row>
          <Waveform active={mode === 'playing'} />
          <Row style={{ gap: 8 }}>
            <Tap onPress={onReplay} disabled={mode === 'playing'} style={styles.voiceControlButton}>
              <Icon icon={Play} size={15} color={c.surface600} />
              <Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>{mode === 'playing' ? 'Playing' : 'Listen'}</Txt>
            </Tap>
            <Tap onPress={onCancel} style={styles.voiceControlButton}>
              <Icon icon={Trash2} size={15} color={c.danger600} />
              <Txt weight="bold" style={{ color: c.danger600, fontSize: 11 }}>Delete</Txt>
            </Tap>
            <Tap onPress={onSend} style={[styles.voiceControlButton, styles.voiceSendButton]}>
              <Icon icon={Send} size={15} color={c.white} />
              <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>Send</Txt>
            </Tap>
          </Row>
        </View>
      ) : null}
    </Animated.View>
  );
}

export function AIAssistant({ isOpen, onClose, transactions, loanRequests, metrics, companyId, language }: { isOpen: boolean; onClose: () => void; transactions: Transaction[]; loanRequests: LoanRequestRecord[]; metrics: CloudFinancialMetrics; companyId: string | null; language: SupportedLanguage }) {
  type Message = { id: number; type: 'user' | 'ai'; content: string; timestamp: Date; suggestions?: string[]; action?: 'categorize' | 'insight' | 'alert' | 'report' };
  const t = useCallback((key: string, fallback?: string) => translate(language, key, fallback), [language]);
  const totalIncome = metrics.revenue;
  const totalExpense = metrics.expenses;
  const profit = metrics.profit;
  const healthScore = metrics.financialHealth;
  const dailyTransactions = transactions.slice(0, 5);
  const expenseCategoryItems = metrics.categoryBreakdown.filter((item) => item.type === 'expense' && item.share > 0);
  const incomeCategoryItems = metrics.categoryBreakdown.filter((item) => item.type === 'income' && item.share > 0);
  const topExpense = expenseCategoryItems[0];
  const topIncome = incomeCategoryItems[0];
  const currentExpenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'ai', content: metrics.emptyState ? t('ai.helloEmpty') : `${t('ai.helloWithData')} Revenus: ${formatFCFA(metrics.revenue)}, dépenses: ${formatFCFA(metrics.expenses)}, Score Mosika ${metrics.mosikaScore}.`, timestamp: new Date(), suggestions: ['Voir mes dépenses', 'Quel profit ai-je réalisé ?', 'Analyser mon activité', 'Vérifier mon éligibilité'] },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState<AssistantVoiceMode>('idle');
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const clearVoiceTimers = useCallback(() => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);
  const resetVoiceNote = useCallback(() => {
    clearVoiceTimers();
    setVoiceMode('idle');
    setVoiceDuration(0);
    setVoiceError('');
  }, [clearVoiceTimers]);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, isTyping, voiceMode]);
  useEffect(() => () => clearVoiceTimers(), [clearVoiceTimers]);
  useEffect(() => {
    if (!isOpen) resetVoiceNote();
  }, [isOpen, resetVoiceNote]);
  const getAIResponse = (userMessage: string): Pick<Message, 'content' | 'suggestions' | 'action'> => {
    const lower = userMessage.toLowerCase();
    if (lower.includes('download') || lower.includes('rapport') || lower.includes('report') || lower.includes('export')) return { content: metrics.emptyState ? "Aucun rapport financier fiable n'est encore disponible pour ce compte. Ajoutez des transactions réelles pour générer un bilan, un compte de résultat, un flux de trésorerie ou une TVA exportable." : `Je peux préparer un export avec vos données actuelles: ${metrics.transactionCount} transaction(s), ${formatFCFA(metrics.revenue)} de revenus et ${formatFCFA(metrics.expenses)} de dépenses.`, suggestions: ['Télécharger le rapport mensuel', 'Résumer les rapports', 'Retrouver le rapport TVA'], action: 'report' };
    if (lower.includes('invoice') || lower.includes('facture') || lower.includes('unpaid')) return { content: "Je n'ai pas trouvé de factures impayées connectées à votre base pour ce compte. Quand le module factures sera alimenté, je pourrai lister les échéances, retards et montants réels sans estimation fictive.", suggestions: ['Voir le risque de trésorerie', 'Exporter les créances', 'Analyser mon activité'], action: 'alert' };
    if (lower.includes('profit') || lower.includes('bénéf') || lower.includes('benef') || lower.includes('make')) return { content: `Votre profit net calculé depuis vos transactions est de ${formatFCFA(profit)}.\n\nRevenus analysés: ${formatFCFA(totalIncome)}\nDépenses analysées: ${formatFCFA(totalExpense)}\nMarge nette: ${totalIncome ? Math.round((profit / totalIncome) * 100) : 0}%\n\nLecture Mosika: ${metrics.emptyState ? "l'historique est vide, donc je ne peux pas conclure sur la rentabilité." : profit >= 0 ? "la rentabilité est positive sur les données enregistrées." : "les dépenses dépassent les revenus enregistrés."}`, suggestions: ['Analyser mon activité', 'Voir mes dépenses', 'Télécharger le rapport mensuel'], action: 'insight' };
    if (lower.includes('catégoris') || lower.includes('transaction') || lower.includes('today') || lower.includes('summarize')) return { content: dailyTransactions.length === 0 ? 'Aucune transaction récente. Votre historique est vide pour ce compte.' : `Résumé des transactions récentes:\n\n${dailyTransactions.map((t) => `• ${t.description}: ${t.type === 'income' ? '+' : '-'}${formatFCFA(t.amount)} (${t.category})`).join('\n')}\n\nCes lignes viennent de votre historique connecté.`, suggestions: ['Rechercher dans l’historique', 'Voir mes dépenses', 'Expliquer les métriques comptables'], action: 'categorize' };
    if (lower.includes('insight') || lower.includes('conseil') || lower.includes('analyze') || lower.includes('analyse') || lower.includes('business') || lower.includes('activit')) return { content: metrics.emptyState ? `Analyse business Mosika:\n\n• Santé financière: ${healthScore}%\n• Aucune transaction réelle pour le moment.\n• Revenus: ${formatFCFA(0)}\n• Dépenses: ${formatFCFA(0)}\n\nMa recommandation: ajoutez une première transaction et complétez le profil pour activer les tendances.` : `Analyse business Mosika:\n\n• Santé financière: ${healthScore}%\n• Revenus: ${formatFCFA(metrics.revenue)}\n• Dépenses: ${formatFCFA(metrics.expenses)}\n• Profit net: ${formatFCFA(metrics.profit)}\n• Croissance: ${metrics.growthRate.toFixed(1)}%\n\nMa recommandation: ${metrics.profit >= 0 ? 'documentez vos revenus récurrents et gardez les charges sous contrôle.' : 'réduisez les charges prioritaires et sécurisez de nouveaux encaissements.'}`, suggestions: ['Vérifier mon éligibilité', 'Voir le risque de trésorerie', 'Télécharger le rapport mensuel'], action: 'insight' };
    if (lower.includes('dépens') || lower.includes('depens') || lower.includes('expense')) return { content: metrics.emptyState ? "Aucune dépense réelle n'est enregistrée pour ce compte." : `Dépenses analysées: ${formatFCFA(totalExpense)}.\n\nRatio dépenses/revenus: ${currentExpenseRatio}%.\nPoste dominant: ${topExpense ? `${topExpense.name} (${Math.round(topExpense.share)}%)` : 'non déterminé'}.\n\nRecommandation: ${currentExpenseRatio > 85 ? 'réduisez les charges variables avant toute demande de financement.' : 'continuez à surveiller les charges récurrentes et les justificatifs.'}`, suggestions: ['Créer une alerte dépenses', 'Voir la tendance des dépenses', 'Summarize today’s transactions'], action: 'alert' };
    if (lower.includes('tva') || lower.includes('déclar') || lower.includes('tax')) return { content: `TVA estimée depuis les transactions: ${formatFCFA(metrics.taxDue)}.\nTVA collectée: ${formatFCFA(metrics.taxCollected)}.\nTVA déductible: ${formatFCFA(metrics.taxDeductible)}.\n\n${metrics.emptyState ? 'Ajoutez des transactions taxables pour préparer une déclaration exploitable.' : 'Ces montants viennent des mouvements enregistrés et restent à valider avec votre comptable.'}`, suggestions: ['Expliquer la TVA', 'Retrouver les rapports', 'Télécharger le rapport mensuel'], action: 'alert' };
    if (lower.includes('loan') || lower.includes('prêt') || lower.includes('score') || lower.includes('crédit') || lower.includes('eligibility') || lower.includes('éligibil')) {
      const loanReady = !metrics.emptyState && metrics.mosikaScore >= 520 && metrics.scoreConfidence >= 45 && !['high', 'insufficient_data'].includes(metrics.riskAssessmentLevel);
      const strictLimit = loanReady ? Math.round((100000 + Math.pow(Math.max(0, Math.min(1, metrics.mosikaScore / 1000)), 2) * 1900000) / 50000) * 50000 : 0;
      return {
        content: metrics.emptyState
          ? `Votre Score Mosika est au niveau initial: ${metrics.mosikaScore}.\n\nAucune eligibilite credit n'est active sans historique financier. Le score commence a 0 et demande plusieurs mois de donnees verifiees.`
          : loanReady
            ? `Votre Score Mosika actuel est ${metrics.mosikaScore} avec ${metrics.scoreConfidence}% de confiance modele.\n\nLimite indicative stricte: ${formatFCFA(strictLimit)}\nProbabilite estimee: ${metrics.loanApprovalProbability}%\nDemandes actives: ${loanRequests.length}\n\nConseil: maintenez une tresorerie positive, des justificatifs propres et une regularite sur plusieurs mois.`
            : `Votre Score Mosika actuel est ${metrics.mosikaScore} avec ${metrics.scoreConfidence}% de confiance modele.\n\nLe dossier n'est pas encore pre-approuve. Les banques regardent surtout la maturite temporelle, la stabilite des revenus, les anomalies et la conformite, pas seulement le nombre de transactions.`,
        suggestions: ['Ouvrir le suivi du prêt', 'Améliorer mon score', 'Analyser le risque de remboursement'],
        action: 'insight',
      };
    }
    return { content: metrics.emptyState ? "Votre espace financier est encore vide. Je peux vous aider à créer vos premières transactions, comprendre les rapports, préparer le suivi TVA ou expliquer comment construire votre Score Mosika." : `Je peux analyser vos transactions réelles, expliquer vos rapports, résumer la journée, estimer le profit, analyser les dépenses ou suivre une demande de prêt. Revenu dominant actuel: ${topIncome ? topIncome.name : 'non déterminé'}.`, suggestions: ['Voir mes dépenses', 'Télécharger le rapport mensuel', 'Quel profit ai-je réalisé ?', 'Vérifier mon éligibilité'] };
  };
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const value = inputValue;
    const userMessage: Message = { id: Date.now(), type: 'user', content: value, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    if (companyId && formalioBackend.isConfigured) {
      void formalioBackend.chat(companyId, value, conversationId, language)
        .then((response) => {
          if (!response) throw new Error('No AI response.');
          setConversationId(response.conversationId);
          setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'ai', content: response.reply, timestamp: new Date(), suggestions: response.quickActions }]);
        })
        .catch(() => {
          const response = getAIResponse(value);
          setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'ai', timestamp: new Date(), ...response }]);
        })
        .finally(() => setIsTyping(false));
      return;
    }
    setTimeout(() => {
      const response = getAIResponse(value);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'ai', timestamp: new Date(), ...response }]);
      setIsTyping(false);
    }, 1500);
  };
  const startVoiceRecording = async () => {
    clearVoiceTimers();
    setVoiceError('');
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setVoiceError('Microphone permission is required to record a voice note.');
        setVoiceMode('idle');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      setVoiceDuration(0);
      setVoiceMode('recording');
      voiceTimerRef.current = setInterval(() => setVoiceDuration((current) => current + 1), 1000);
    } catch {
      setVoiceError('Unable to start the microphone. You can still type your message.');
      setVoiceMode('idle');
    }
  };
  const stopVoiceRecording = () => {
    if (voiceMode !== 'recording') return;
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    setVoiceDuration((current) => Math.max(current, 1));
    setVoiceMode('preview');
  };
  const replayVoiceNote = () => {
    if (voiceMode !== 'preview') return;
    setVoiceMode('playing');
    playbackTimerRef.current = setTimeout(() => {
      playbackTimerRef.current = null;
      setVoiceMode('preview');
    }, Math.min(2400, Math.max(900, voiceDuration * 260)));
  };
  const sendVoiceNote = () => {
    if (voiceMode !== 'preview' && voiceMode !== 'playing') return;
    const duration = Math.max(voiceDuration, 1);
    clearVoiceTimers();
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: `Voice note · ${formatAssistantVoiceDuration(duration)}\nTranscription pending for future AI audio processing.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    resetVoiceNote();
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          timestamp: new Date(),
          content: 'Voice note received. In this prototype, audio is queued for transcription. Once the backend audio service is connected, I will transcribe it, summarize the request, and answer with the same accounting context.',
          suggestions: ['Summarize today’s transactions', 'Voir mes dépenses', 'Télécharger le rapport mensuel'],
          action: 'insight',
        },
      ]);
      setIsTyping(false);
    }, 1100);
  };
  const latestMessageId = messages[messages.length - 1]?.id;
  const assistantCoreActions = [
    { icon: Download, label: 'Télécharger', onPress: () => setInputValue('Télécharger le rapport mensuel') },
    { icon: TrendingDown, label: 'Dépenses', onPress: () => setInputValue('Voir mes dépenses') },
    { icon: Calculator, label: 'Profit', onPress: () => setInputValue('Quel profit ai-je réalisé ?') },
  ];
  const voiceComposerDisabled = voiceMode === 'preview' || voiceMode === 'playing';
  return (
    <ModalShell visible={isOpen} onClose={onClose}>
      <View style={styles.assistantModal}>
        <View style={styles.assistantHeader}>
          <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ gap: 10 }}><View style={styles.assistantHeaderIcon}><Icon icon={MessageCircle} size={18} color={c.formalio700} /></View><View><Txt weight="black" style={{ color: c.surface900, fontSize: 15 }}>Mosika</Txt><Txt style={{ color: c.surface500, fontSize: 12 }}>{t('ai.assistant')}</Txt></View></Row>
            <Tap onPress={onClose} style={styles.closeButton}><Icon icon={X} size={17} color={c.surface600} /></Tap>
          </Row>
        </View>
        <ScrollView ref={scrollRef} style={styles.assistantScroll} contentContainerStyle={{ padding: 14, gap: 12 }}>
          {messages.map((message) => (
            <View key={message.id} style={[styles.messageRow, message.type === 'user' && { justifyContent: 'flex-end' }]}>
              <View style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.aiBubble]}>
                {message.type === 'ai' ? <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12, marginBottom: 6 }}>Mosika</Txt> : null}
                <Txt style={{ color: message.type === 'user' ? c.white : c.surface700, fontSize: 13, lineHeight: 19 }}>{message.content}</Txt>
                {message.suggestions && message.id === latestMessageId ? (
                  <View style={styles.suggestions}>
                    {message.suggestions.map((suggestion) => (
                      <Tap key={suggestion} onPress={() => setInputValue(suggestion)} style={styles.suggestionChip}>
                        <Txt weight="medium" style={{ color: c.formalio700, fontSize: 11 }}>{suggestion}</Txt>
                        <Icon icon={ChevronRight} size={12} color={c.formalio700} />
                      </Tap>
                    ))}
                  </View>
                ) : null}
                <Txt style={{ color: message.type === 'user' ? 'rgba(255,255,255,.62)' : c.surface400, fontSize: 10, marginTop: 8 }}>
                  {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Txt>
              </View>
            </View>
          ))}
          {isTyping ? <View style={[styles.messageBubble, styles.aiBubble, { alignSelf: 'flex-start' }]}><Row style={{ gap: 8 }}><ActivityIndicator color={c.formalio600} /><Txt style={{ color: c.surface500, fontSize: 13 }}>{t('ai.thinking')}</Txt></Row></View> : null}
        </ScrollView>
        <AssistantVoiceNotePanel
          mode={voiceMode}
          duration={voiceDuration}
          error={voiceError}
          onStop={stopVoiceRecording}
          onCancel={resetVoiceNote}
          onReplay={replayVoiceNote}
          onSend={sendVoiceNote}
        />
        <View style={styles.assistantActionBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {assistantCoreActions.map((action) => (
              <Tap key={action.label} onPress={action.onPress} style={styles.assistantActionPill}>
                <Icon icon={action.icon} size={14} color={c.surface600} />
                <Txt weight="medium" style={{ color: c.surface600, fontSize: 12 }}>{action.label}</Txt>
              </Tap>
            ))}
          </ScrollView>
        </View>
        <View style={styles.assistantInputArea}>
          <Tap
            onPress={voiceMode === 'recording' ? stopVoiceRecording : startVoiceRecording}
            disabled={voiceComposerDisabled}
            accessibilityLabel={voiceMode === 'recording' ? 'Stop voice recording' : 'Record voice note'}
            style={[styles.assistantMicButton, voiceMode === 'recording' && styles.assistantMicButtonRecording, voiceComposerDisabled && { opacity: 0.55 }]}
          >
            <RecordingPulse active={voiceMode === 'recording'} />
            <Icon icon={voiceMode === 'recording' ? Square : Mic} size={18} color={voiceMode === 'recording' ? c.white : c.formalio700} />
          </Tap>
          <View style={styles.assistantInput}>
            <TextInput value={inputValue} onChangeText={setInputValue} placeholder={t('ai.placeholder')} placeholderTextColor={c.surface400} maxFontSizeMultiplier={inputTextMaxScale} style={styles.textInput} onSubmitEditing={handleSend} />
          </View>
          <Tap onPress={handleSend} disabled={!inputValue.trim()} style={styles.sendButton}>
            <Icon icon={Send} size={17} color={c.white} />
          </Tap>
        </View>
      </View>
    </ModalShell>
  );
}

export function VoiceRecorder({ isOpen, onClose, onComplete, companyId }: { isOpen: boolean; onClose: () => void; onComplete: (transaction: ParsedTransaction) => void; companyId: string | null }) {
  type Phase = 'idle' | 'recording' | 'processing' | 'transcribed' | 'categorized';
  const language = useAppLanguage();
  const phrases = useMemo(() => [
    { transcript: "J'ai vendu 50,000 francs de tissus à un client ce matin", parsed: { type: 'income' as const, amount: 50000, description: 'Vente de tissus', category: 'Ventes', method: 'Espèces' } },
    { transcript: "J'ai dépensé 15,000 francs pour le transport de marchandises", parsed: { type: 'expense' as const, amount: 15000, description: 'Transport de marchandises', category: 'Transport', method: 'Espèces' } },
    { transcript: 'Reçu 125,000 francs sur MTN Mobile Money pour vente en gros', parsed: { type: 'income' as const, amount: 125000, description: 'Vente en gros', category: 'Ventes', method: 'MTN MoMo' } },
  ], []);
  void phrases;
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast } = useToast();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const reset = useCallback(() => {
    setPhase('idle');
    setTranscript('');
    setParsedData(null);
    setRecordingTime(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showToast({ type: 'error', title: 'Micro requis', message: 'Autorisez le micro pour utiliser la saisie vocale.' });
        return;
      }
      if (!companyId) {
        showToast({ type: 'error', title: 'Cloud requis', message: 'Connectez-vous pour transcrire et enregistrer une transaction vocale.' });
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setPhase('recording');
      setTranscript('');
      setParsedData(null);
      setRecordingTime(0);
      intervalRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (error) {
      showToast({ type: 'error', title: 'Enregistrement impossible', message: error instanceof Error ? error.message : 'Reessayez.' });
    }
  };
  const stopRecording = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('processing');
    try {
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (!recording) throw new Error('Aucun enregistrement actif.');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri || !companyId) throw new Error('Audio introuvable.');
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const result = await formalioBackend.transcribeVoiceTransaction(companyId, {
        audioBase64,
        mimeType: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a',
        fileName: Platform.OS === 'web' ? 'formalio-voice.webm' : 'formalio-voice.m4a',
        language,
      });
      if (!result) throw new Error('Transcription indisponible.');
      setTranscript(result.transcript);
      setPhase('transcribed');
      setTimeout(() => {
        if (result.parsed.type === 'income' || result.parsed.type === 'expense') {
          setParsedData({
            type: result.parsed.type,
            amount: result.parsed.amount,
            description: result.parsed.description,
            category: result.parsed.category,
            method: result.parsed.method,
          });
        }
        setPhase('categorized');
      }, 500);
    } catch (error) {
      setPhase('idle');
      showToast({ type: 'error', title: 'Transcription impossible', message: error instanceof Error ? error.message : 'Configurez le fournisseur speech-to-text.' });
    }
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  return (
    <ModalShell visible={isOpen} onClose={onClose} align="center">
      <View>
        <Row style={styles.voiceHeader}>
          <Row style={{ gap: 7 }}><Icon icon={Sparkles} size={16} color={c.formalio600} /><Txt weight="semibold" style={{ fontSize: 14 }}>Mosika Voice AI</Txt></Row>
          <Tap onPress={onClose} style={styles.smallRound}><Icon icon={X} size={16} color={c.surface500} /></Tap>
        </Row>
        <View style={styles.voiceBody}>
          <AnimatedMascot state={phase === 'recording' ? 'listening' : phase === 'processing' ? 'thinking' : phase === 'categorized' ? 'success' : 'idle'} size={100} />
          <View style={{ minHeight: 62, alignItems: 'center', marginTop: 14 }}>
            <Txt weight="semibold" style={{ color: phase === 'recording' || phase === 'categorized' ? c.formalio700 : c.surface900, fontSize: 18 }}>{phase === 'idle' ? 'Appuyez pour parler' : phase === 'recording' ? 'Écoute en cours...' : phase === 'processing' ? 'Mosika analyse...' : phase === 'transcribed' ? 'Transcription' : 'Transaction reconnue !'}</Txt>
            <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 5 }}>{phase === 'idle' ? 'Décrivez votre transaction en français' : phase === 'recording' ? formatTime(recordingTime) : phase === 'processing' ? 'Transcription en cours' : phase === 'transcribed' ? 'Identification de la catégorie...' : 'Vérifiez et confirmez'}</Txt>
          </View>
          <View style={styles.waveformBox}>
            {phase === 'recording' ? <Waveform active /> : null}
            {phase === 'processing' ? <Row style={{ gap: 8 }}><ActivityIndicator color={c.formalio600} /><WaveDots /></Row> : null}
            {(phase === 'transcribed' || phase === 'categorized') && transcript ? <View style={styles.transcriptBox}><Row style={{ gap: 4, marginBottom: 4 }}><Icon icon={Sparkles} size={12} color={c.surface400} /><Txt style={{ color: c.surface400, fontSize: 11 }}>Transcription</Txt></Row><Txt style={{ color: c.surface900, fontSize: 13, fontStyle: 'italic' }}>"{transcript}"{phase === 'transcribed' ? ' |' : ''}</Txt></View> : null}
            {phase === 'idle' ? <Waveform /> : null}
          </View>
          {phase === 'categorized' && parsedData ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.parsedCard}>
              <Row style={{ gap: 5, marginBottom: 10 }}><Icon icon={Sparkles} size={13} color={c.formalio700} /><Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Catégorisé automatiquement</Txt></Row>
              <InfoLine label="Type" value={parsedData.type === 'income' ? '↑ Revenu' : '↓ Dépense'} valueColor={parsedData.type === 'income' ? c.formalio700 : c.danger600} />
              <InfoLine label="Montant" value={`${parsedData.amount.toLocaleString('fr-FR')} FCFA`} bold />
              <InfoLine label="Description" value={parsedData.description} />
              <InfoLine label="Catégorie" value={parsedData.category} valueColor={c.formalio700} />
              <InfoLine label="Méthode" value={parsedData.method} />
            </Animated.View>
          ) : null}
          <Row style={{ gap: 8, width: '100%' }}>
            {phase === 'idle' ? <PrimaryButton label="Commencer" icon={Mic} onPress={startRecording} style={{ flex: 1 }} /> : null}
            {phase === 'recording' ? <PrimaryButton label={`Arrêter (${formatTime(recordingTime)})`} tone="danger" onPress={stopRecording} style={{ flex: 1 }} /> : null}
            {phase === 'categorized' ? (
              <>
                <Tap onPress={reset} style={styles.refreshButton}><Icon icon={RefreshCw} size={17} color={c.surface700} /></Tap>
                <PrimaryButton label="Confirmer" icon={Check} onPress={() => { if (parsedData) onComplete(parsedData); reset(); onClose(); }} style={{ flex: 1 }} />
              </>
            ) : null}
          </Row>
        </View>
      </View>
    </ModalShell>
  );
}

function Waveform({ active = false }: { active?: boolean }) {
  const heights = [8, 10, 14, 20, 32, 44, 36, 22, 16, 30, 46, 34, 18, 12, 8, 14, 26, 40, 28, 18, 12, 8, 10, 14];
  return (
    <Row style={{ justifyContent: 'center', gap: 4 }}>
      {heights.map((h, i) => (
        <Animated.View key={i} style={{ width: 6, height: active ? h : 8, borderRadius: 6, backgroundColor: active ? c.formalio500 : c.surface200 }} />
      ))}
    </Row>
  );
}

function WaveDots() {
  return <Row style={{ gap: 4 }}>{[0, 1, 2].map((i) => <View key={i} style={[styles.tinyDot, { backgroundColor: c.formalio600 }]} />)}</Row>;
}
