import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Package,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import type { CloudFinancialMetrics } from '@/services/api/formalioBackend';
import { styles } from '../styles';
import { c, inputTextMaxScale } from '../theme';
import {
  ficheStatusLabel,
  ficheStatusTone,
  filterFicheDocuments,
  type FicheDocumentRecord,
  type FichePeriodFilter,
  type FicheStatusFilter,
} from '../domain/ficheDocuments';
import { formatCompactFCFA, formatFCFA } from '../domain/formatters';
import type { Transaction } from '../demoData';
import type { BackendReportType, LoanRequestRecord, LoanStatusStage, ReportType, ShellProps } from '../contracts';
import {
  Card,
  Grid,
  Icon,
  InfoLine,
  LogoMark,
  Pill,
  PrimaryButton,
  Row,
  ScreenWrapper,
  Segment,
  Tap,
  ToneIcon,
  Txt,
  ValueBar,
  useToast,
} from '../shared';

const backendReportTypeFor = (type: ReportType): BackendReportType => {
  if (type === 'compte-resultat') return 'resultat';
  if (type === 'tresorerie') return 'cashflow';
  return type;
};

export function ReportsScreen({
  shellProps,
  openDownload,
  loanRequests,
  metrics,
  transactions,
  ficheDocuments,
  onResumeFiche,
  onOpenFicheDetail,
  onDownloadFiche,
}: {
  shellProps: ShellProps;
  openDownload: (title: string, period: string, type?: BackendReportType) => void;
  loanRequests: LoanRequestRecord[];
  metrics: CloudFinancialMetrics;
  transactions: Transaction[];
  ficheDocuments: FicheDocumentRecord[];
  onResumeFiche: () => void;
  onOpenFicheDetail?: (document: FicheDocumentRecord) => void;
  onDownloadFiche?: (document: FicheDocumentRecord) => void;
}) {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequestRecord | null>(null);
  const [selectedFiche, setSelectedFiche] = useState<FicheDocumentRecord | null>(null);
  const [ficheSearch, setFicheSearch] = useState('');
  const [ficheStatusFilter, setFicheStatusFilter] = useState<FicheStatusFilter>('all');
  const [fichePeriodFilter, setFichePeriodFilter] = useState<FichePeriodFilter>('all');
  const { showToast } = useToast();
  const hasFinancialData = transactions.length > 0;
  const filteredFiches = useMemo(() => filterFicheDocuments(ficheDocuments, ficheSearch, ficheStatusFilter, fichePeriodFilter), [ficheDocuments, fichePeriodFilter, ficheSearch, ficheStatusFilter]);
  const titleMap = {
    bilan: 'Bilan Comptable',
    'compte-resultat': 'Compte de Résultat',
    tresorerie: 'Flux de Trésorerie',
    tva: 'Déclaration TVA',
  } as const;
  if (selectedReport) {
    return (
      <ScreenWrapper {...shellProps} title={titleMap[selectedReport]}>
        <Tap onPress={() => setSelectedReport(null)} style={{ marginBottom: 12 }}>
          <Row style={{ gap: 4 }}>
            <Icon icon={ArrowLeft} size={13} color={c.formalio700} />
            <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12 }}>Retour aux rapports</Txt>
          </Row>
        </Tap>
        <ReportIntelligenceDeck type={selectedReport} metrics={metrics} />
        <SYSCOHADAReport type={selectedReport} period={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} metrics={metrics} />
        <ReportExportPanel
          title={titleMap[selectedReport]}
          period={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          type={backendReportTypeFor(selectedReport)}
          canExport={!metrics.emptyState && metrics.transactionCount > 0}
          requirements={metrics.minimumDataRequired}
          onExport={openDownload}
        />
      </ScreenWrapper>
    );
  }
  if (selectedLoan) {
    return (
      <ScreenWrapper {...shellProps} title="Loan request">
        <Tap onPress={() => setSelectedLoan(null)} style={{ marginBottom: 12 }}>
          <Row style={{ gap: 4 }}>
            <Icon icon={ArrowLeft} size={13} color={c.formalio700} />
            <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12 }}>Back to reports</Txt>
          </Row>
        </Tap>
        <LoanRequestDetail request={selectedLoan} />
      </ScreenWrapper>
    );
  }
  if (selectedFiche) {
    return (
      <ScreenWrapper {...shellProps} title="Fiche de reconciliation">
        <Tap onPress={() => setSelectedFiche(null)} style={{ marginBottom: 12 }}>
          <Row style={{ gap: 4 }}>
            <Icon icon={ArrowLeft} size={13} color={c.formalio700} />
            <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12 }}>Retour aux fiches</Txt>
          </Row>
        </Tap>
        <FicheDocumentPreview
          document={selectedFiche}
          onResume={onResumeFiche}
          onDownload={() => onDownloadFiche ? onDownloadFiche(selectedFiche) : openDownload('Fiche de reconciliation', `${selectedFiche.dateDebut} - ${selectedFiche.dateFin}`)}
          onPrint={() => showToast({ type: 'info', title: 'Impression', message: 'Apercu pret pour impression.' })}
        />
      </ScreenWrapper>
    );
  }
  return (
    <ScreenWrapper {...shellProps} title="Rapports">
      <LinearGradient colors={[c.formalio800, c.formalio900]} style={styles.reportHero}>
        <Row style={{ gap: 12, marginBottom: 8 }}>
          <View style={styles.glassIconSmall}><Icon icon={FileText} size={20} color={c.formalio300} /></View>
          <View>
            <Txt weight="semibold" style={{ color: c.white, fontSize: 14 }}>Rapports OHADA</Txt>
            <Txt style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Conforme SYSCOHADA 2017</Txt>
          </View>
        </Row>
        <Txt style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 17 }}>Générez des rapports comptables officiels en un clic, prêts pour l'audit.</Txt>
      </LinearGradient>
      <LoanTrackingSection requests={loanRequests} onSelect={setSelectedLoan} />
      <ReportPortfolioSummary metrics={metrics} />
      <FicheDocumentsSection
        documents={filteredFiches}
        totalCount={ficheDocuments.length}
        search={ficheSearch}
        onSearch={setFicheSearch}
        statusFilter={ficheStatusFilter}
        onStatusFilter={setFicheStatusFilter}
        periodFilter={fichePeriodFilter}
        onPeriodFilter={setFichePeriodFilter}
        onPreview={(document) => onOpenFicheDetail ? onOpenFicheDetail(document) : setSelectedFiche(document)}
        onResume={onResumeFiche}
        onDownload={(document) => onDownloadFiche ? onDownloadFiche(document) : openDownload('Fiche de reconciliation', `${document.dateDebut} - ${document.dateFin}`)}
        onBatchDownload={() => {
          if (filteredFiches.length === 0) {
            showToast({ type: 'info', title: 'Aucune fiche', message: 'Aucun document ne correspond aux filtres.' });
            return;
          }
          openDownload('Fiches de reconciliation', `${filteredFiches.length} document(s)`);
        }}
        onPrint={(document) => showToast({ type: 'info', title: 'Impression', message: `Fiche ${document.dateDebut || ''} prete pour impression.` })}
      />
      <Txt weight="bold" style={{ fontSize: 14, marginBottom: 10 }}>Documents intelligents</Txt>
      <View style={{ gap: 12 }}>
        {[
          { title: 'Bilan Comptable', type: 'bilan' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: FileSpreadsheet, tone: 'blue', desc: 'Actif, passif et capitaux propres' },
          { title: 'Compte de Résultat', type: 'compte-resultat' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: Calculator, tone: 'green', desc: 'Revenus, charges et marge nette' },
          { title: 'Flux de Trésorerie', type: 'tresorerie' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: Wallet, tone: 'green', desc: 'Cash opérationnel et variation nette' },
          { title: 'Déclaration TVA', type: 'tva' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: Receipt, tone: 'amber', desc: 'TVA collectée, déductible et solde' },
        ].map((report) => (
          <Tap key={report.title} onPress={() => setSelectedReport(report.type)} style={styles.reportTap}>
            <View style={styles.reportRow}>
            <ToneIcon icon={report.icon} tone={report.tone as any} />
            <View style={styles.reportRowBody}>
              <Txt weight="medium" numberOfLines={1} style={{ fontSize: 13 }}>{report.title}</Txt>
              <Txt numberOfLines={1} style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>{report.desc}</Txt>
              <Txt style={{ color: c.surface400, fontSize: 10, marginTop: 4 }}>{report.date}</Txt>
            </View>
            <Row style={styles.reportRowAction}>
              {report.status === 'ready' ? <Pill style={styles.reportBadge}>Prêt</Pill> : <Pill tone="gold" style={styles.reportBadge}>Vide</Pill>}
              <Icon icon={ChevronRight} size={16} color={c.surface400} />
            </Row>
            </View>
          </Tap>
        ))}
      </View>
    </ScreenWrapper>
  );
}

function FicheDocumentsSection({
  documents,
  totalCount,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  periodFilter,
  onPeriodFilter,
  onPreview,
  onResume,
  onDownload,
  onBatchDownload,
  onPrint,
}: {
  documents: FicheDocumentRecord[];
  totalCount: number;
  search: string;
  onSearch: (value: string) => void;
  statusFilter: FicheStatusFilter;
  onStatusFilter: (value: FicheStatusFilter) => void;
  periodFilter: FichePeriodFilter;
  onPeriodFilter: (value: FichePeriodFilter) => void;
  onPreview: (document: FicheDocumentRecord) => void;
  onResume: () => void;
  onDownload: (document: FicheDocumentRecord) => void;
  onBatchDownload: () => void;
  onPrint: (document: FicheDocumentRecord) => void;
}) {
  return (
    <View style={styles.ficheDocsSection}>
      <Row style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Txt weight="black" style={{ color: c.surface900, fontSize: 14 }}>Fiches de reconciliation</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>{totalCount} document(s) cree(s)</Txt>
        </View>
        <Tap onPress={onBatchDownload} style={styles.ficheBatchButton}>
          <Icon icon={Download} size={14} color={c.formalio700} />
          <Txt weight="black" style={{ color: c.formalio700, fontSize: 10 }}>Multi</Txt>
        </Tap>
      </Row>

      <View style={styles.inputBox}>
        <Icon icon={Search} size={16} color={c.surface400} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Rechercher par date ou statut..."
          placeholderTextColor={c.surface400}
          style={styles.textInput}
          maxFontSizeMultiplier={inputTextMaxScale}
        />
      </View>

      <Segment
        value={statusFilter}
        onChange={onStatusFilter}
        options={[
          { key: 'all', label: 'Toutes' },
          { key: 'awaiting_final_stock', label: 'En cours' },
          { key: 'completed', label: 'Completed' },
        ]}
      />
      <Segment
        value={periodFilter}
        onChange={onPeriodFilter}
        options={[
          { key: 'all', label: 'Tout' },
          { key: 'week', label: 'Semaine' },
          { key: 'month', label: 'Mois' },
          { key: 'year', label: 'Annee' },
        ]}
      />

      {documents.length === 0 ? (
        <View style={styles.ficheDocsEmpty}>
          <Icon icon={FileText} size={24} color={c.surface400} />
          <Txt weight="bold" style={{ color: c.surface700, fontSize: 12, marginTop: 8 }}>Aucune fiche trouvee</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, textAlign: 'center', marginTop: 4 }}>Les fiches en cours et terminees apparaitront ici.</Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {documents.map((document) => (
            <Card key={document.id} style={styles.ficheDocCard}>
              <Row style={{ justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt weight="black" numberOfLines={1} style={{ fontSize: 13 }}>Fiche du {document.dateDebut || 'debut'} au {document.dateFin || 'fin'}</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>Creee le {new Date(document.createdAt).toLocaleDateString('fr-FR')}</Txt>
                </View>
                <Pill tone={ficheStatusTone(document.status)}>{ficheStatusLabel(document.status)}</Pill>
              </Row>
              {document.status === 'completed' ? (
                <Row style={{ justifyContent: 'space-between', gap: 10 }}>
                  <Txt weight="bold" style={{ color: c.surface700, fontSize: 12 }}>Caisse: {formatFCFA(document.caisseReelle || 0)}</Txt>
                  <Pill tone={(document.ecart || 0) < 0 ? 'red' : 'green'}>
                    {(document.ecart || 0) === 0 ? '✅ Équilibré' : `${(document.ecart || 0) > 0 ? '↑ +' : '⚠️ -'}${formatFCFA(Math.abs(document.ecart || 0)).replace(' FCFA', '')}`}
                  </Pill>
                </Row>
              ) : null}
              <Grid columns={3} gap={8}>
                <Tap onPress={() => onPreview(document)} style={styles.ficheDocAction}>
                  <Icon icon={Eye} size={14} color={c.info700} />
                  <Txt weight="bold" style={{ color: c.info700, fontSize: 10 }}>Preview</Txt>
                </Tap>
                <Tap onPress={() => onDownload(document)} style={styles.ficheDocAction}>
                  <Icon icon={Download} size={14} color={c.formalio700} />
                  <Txt weight="bold" style={{ color: c.formalio700, fontSize: 10 }}>Download</Txt>
                </Tap>
                <Tap onPress={() => onPrint(document)} style={styles.ficheDocAction}>
                  <Icon icon={Printer} size={14} color={c.surface600} />
                  <Txt weight="bold" style={{ color: c.surface600, fontSize: 10 }}>Print</Txt>
                </Tap>
              </Grid>
              {document.status !== 'completed' ? (
                <Tap onPress={onResume} style={styles.ficheContinueButton}>
                  <Txt weight="black" style={{ color: c.amber700, fontSize: 11 }}>Continuer la fiche</Txt>
                  <Icon icon={ChevronRight} size={14} color={c.amber700} />
                </Tap>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

function FicheDocumentPreview({
  document,
  onResume,
  onDownload,
  onPrint,
}: {
  document: FicheDocumentRecord;
  onResume: () => void;
  onDownload: () => void;
  onPrint: () => void;
}) {
  const stockCount = document.data.stockItems?.length || 0;
  const expenseTotal = (document.data.expenses || []).reduce((sum, expense) => sum + (Number(expense.montant) || 0), 0);
  return (
    <View style={{ gap: 12 }}>
      <LinearGradient colors={[c.formalio800, c.formalio900]} style={styles.fichePreviewHero}>
        <Txt weight="black" style={{ color: c.white, fontSize: 18 }}>Fiche de reconciliation</Txt>
        <Txt style={{ color: c.formalio100, fontSize: 12, marginTop: 4 }}>{document.dateDebut || 'debut'} - {document.dateFin || 'fin'}</Txt>
        <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
          <Pill tone={ficheStatusTone(document.status)}>{ficheStatusLabel(document.status)}</Pill>
        </View>
      </LinearGradient>
      <Grid columns={2} gap={10}>
        <ReportMetricCard label="Articles" value={String(stockCount)} detail="stock suivi" icon={Package} tone="green" />
        <ReportMetricCard label="Depenses" value={formatCompactFCFA(expenseTotal)} detail="periode" icon={Receipt} tone="red" />
        <ReportMetricCard label="Caisse reelle" value={formatCompactFCFA(document.caisseReelle || 0)} detail="validation" icon={Wallet} tone="blue" />
        <ReportMetricCard label="Ecart" value={formatCompactFCFA(document.ecart || 0)} detail="controle" icon={AlertTriangle} tone={(document.ecart || 0) < 0 ? 'red' : 'green'} />
      </Grid>
      <Card style={{ padding: 14 }}>
        <Txt weight="black" style={{ fontSize: 13, marginBottom: 8 }}>Apercu document</Txt>
        {(document.data.stockItems || []).slice(0, 4).map((item) => (
          <InfoLine key={item.id} label={item.productName} value={`${item.quantiteOuverture} -> ${item.finalStockCounted ? item.quantiteFermeture : '...'} ${item.unit}`} />
        ))}
        {stockCount === 0 ? <Txt style={{ color: c.surface500, fontSize: 12 }}>Aucun article stock dans cette fiche.</Txt> : null}
      </Card>
      <Grid columns={document.status === 'completed' ? 2 : 3} gap={8}>
        {document.status !== 'completed' ? <PrimaryButton label="Continuer" icon={ChevronRight} tone="surface" onPress={onResume} style={{ minHeight: 44 }} /> : null}
        <PrimaryButton label="Download" icon={Download} tone="green" onPress={onDownload} style={{ minHeight: 44 }} />
        <PrimaryButton label="Print" icon={Printer} tone="surface" onPress={onPrint} style={{ minHeight: 44 }} />
      </Grid>
    </View>
  );
}

const loanStatusStages: { key: LoanStatusStage; label: string; icon: LucideIcon }[] = [
  { key: 'submitted', label: 'Soumise', icon: Send },
  { key: 'under-review', label: 'En revue', icon: Eye },
  { key: 'risk-assessment', label: 'Risk Assessment', icon: Shield },
  { key: 'pending-documents', label: 'Documents requis', icon: FileText },
  { key: 'approved', label: 'Approuvée', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', icon: AlertTriangle },
  { key: 'disbursed', label: 'Disbursed', icon: Wallet },
];

function LoanTrackingSection({ requests, onSelect }: { requests: LoanRequestRecord[]; onSelect: (request: LoanRequestRecord) => void }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Txt weight="black" style={{ fontSize: 14 }}>Loan request tracking</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>Follow lending partner review progress.</Txt>
        </View>
        {requests.length ? <Pill tone="blue">{requests.length} active</Pill> : null}
      </Row>
      {requests.length === 0 ? (
        <View style={styles.loanEmptyState}>
          <View style={[styles.metricIcon, { backgroundColor: c.gold50 }]}><Icon icon={CreditCard} size={16} color={c.gold700} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" style={{ fontSize: 12 }}>No submitted loan requests yet</Txt>
            <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, marginTop: 3 }}>Once you submit a Score Mosika loan request, its progress timeline appears here automatically.</Txt>
          </View>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {requests.map((request) => <LoanRequestCard key={request.id} request={request} onPress={() => onSelect(request)} />)}
        </View>
      )}
    </View>
  );
}

function LoanRequestCard({ request, onPress }: { request: LoanRequestRecord; onPress: () => void }) {
  const meta = getLoanStatusMeta(request.status);
  const progress = loanProgressForStatus(request.status);
  return (
    <Tap onPress={onPress} style={styles.loanTrackingCard}>
      <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="black" style={{ fontSize: 13 }}>{request.id}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>{formatFCFA(request.amount)} · {request.duration} months · {request.purpose}</Txt>
        </View>
        <LoanStatusBadge status={request.status} />
      </Row>
      <ValueBar value={progress} color={meta.color} />
      <Row style={{ justifyContent: 'space-between', marginTop: 9 }}>
        <Txt style={{ color: c.surface500, fontSize: 10 }}>{new Date(request.requestedAt).toLocaleDateString('fr-FR')}</Txt>
        <Txt weight="bold" style={{ color: meta.color, fontSize: 10 }}>Revue {request.expectedReviewDuration}</Txt>
      </Row>
      <Row style={{ gap: 7, marginTop: 10 }}>
        <Icon icon={Bell} size={13} color={request.notificationCount ? c.gold700 : c.surface400} />
        <Txt numberOfLines={1} style={{ color: c.surface600, fontSize: 11, flex: 1 }}>{request.nextAction}</Txt>
        <Icon icon={ChevronRight} size={15} color={c.surface400} />
      </Row>
    </Tap>
  );
}

function LoanRequestDetail({ request }: { request: LoanRequestRecord }) {
  const currentIndex = loanStatusStages.findIndex((stage) => stage.key === request.status);
  return (
    <View style={{ gap: 12 }}>
      <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.loanDetailHero}>
        <Row style={{ justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt style={{ color: c.formalio200, fontSize: 11 }}>Loan request</Txt>
            <Txt weight="black" style={{ color: c.white, fontSize: 24, marginTop: 3 }}>{formatFCFA(request.amount)}</Txt>
            <Txt style={{ color: c.formalio200, fontSize: 11, marginTop: 4 }}>{request.id} · Soumise {new Date(request.requestedAt).toLocaleDateString('fr-FR')}</Txt>
          </View>
          <LoanStatusBadge status={request.status} />
        </Row>
        <View style={{ marginTop: 14 }}><ValueBar value={loanProgressForStatus(request.status)} color={getLoanStatusMeta(request.status).color} track="rgba(255,255,255,.16)" /></View>
      </LinearGradient>
      <Grid columns={2} gap={10}>
        <ReportMetricCard label="Approval signal" value={`${request.approvalProbability}%`} detail="AI probability" icon={Sparkles} tone="blue" />
        <ReportMetricCard label="Strength index" value={`${request.borrowingStrengthIndex}%`} detail="cash behavior" icon={Award} tone="green" />
        <ReportMetricCard label="Total repayment" value={`${Math.round(request.totalRepayment / 1000)}K`} detail="FCFA estimate" icon={Wallet} tone="green" />
        <ReportMetricCard label="Temps de revue" value={request.expectedReviewDuration} detail="estimé" icon={RefreshCw} tone="amber" />
      </Grid>
      <Card style={{ padding: 14 }}>
        <Txt weight="black" style={{ fontSize: 13, marginBottom: 10 }}>Approval timeline</Txt>
        {loanStatusStages.map((stage, index) => {
          const active = index <= currentIndex;
          const rejected = request.status === 'rejected' && stage.key === 'rejected';
          const color = active ? getLoanStatusMeta(rejected ? 'rejected' : stage.key).color : c.surface300;
          return (
            <Row key={stage.key} style={styles.loanTimelineRow}>
              <View style={[styles.loanTimelineNode, { backgroundColor: active ? color : c.surface100 }]}>
                <Icon icon={stage.icon} size={13} color={active ? c.white : c.surface400} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" style={{ color: active ? c.surface900 : c.surface400, fontSize: 12 }}>{stage.label}</Txt>
                <Txt style={{ color: c.surface500, fontSize: 10, marginTop: 2 }}>{active ? (index === currentIndex ? 'Current stage' : 'Completed') : 'Upcoming'}</Txt>
              </View>
            </Row>
          );
        })}
      </Card>
    </View>
  );
}

function LoanStatusBadge({ status }: { status: LoanStatusStage }) {
  const meta = getLoanStatusMeta(status);
  return (
    <View style={[styles.loanStatusBadge, { backgroundColor: meta.bg }]}>
      <View style={[styles.tinyDot, { backgroundColor: meta.color }]} />
      <Txt weight="black" style={{ color: meta.color, fontSize: 10 }}>{meta.label}</Txt>
    </View>
  );
}

function getLoanStatusMeta(status: LoanStatusStage) {
  const map = {
    submitted: { label: 'Soumise', color: c.info700, bg: c.info50 },
    'under-review': { label: 'En revue', color: c.info700, bg: c.info50 },
    'risk-assessment': { label: 'Risk Check', color: c.gold700, bg: c.gold50 },
    'pending-documents': { label: 'Docs Needed', color: c.gold700, bg: c.gold50 },
    approved: { label: 'Approuvée', color: c.formalio700, bg: c.formalio50 },
    rejected: { label: 'Rejected', color: c.danger600, bg: c.danger50 },
    disbursed: { label: 'Disbursed', color: c.formalio700, bg: c.formalio50 },
  } satisfies Record<LoanStatusStage, { label: string; color: string; bg: string }>;
  return map[status];
}

function loanProgressForStatus(status: LoanStatusStage) {
  const index = loanStatusStages.findIndex((stage) => stage.key === status);
  return Math.max(8, Math.round(((index + 1) / loanStatusStages.length) * 100));
}

export function ReportPortfolioSummary({ metrics }: { metrics: CloudFinancialMetrics }) {
  const empty = metrics.emptyState || metrics.transactionCount === 0;
  return (
    <View style={{ gap: 12, marginBottom: 16 }}>
      <Grid columns={2} gap={10}>
        <ReportMetricCard label="Rapports prêts" value={`${metrics.reportCount}/4`} detail={empty ? 'Aucune génération' : 'Données réelles'} icon={FileText} tone="green" />
        <ReportMetricCard label="Conformité" value={`${metrics.complianceScore}%`} detail="KYC + documents" icon={Shield} tone="blue" />
        <ReportMetricCard label="Cash net" value={formatCompactFCFA(metrics.cashFlow)} detail={`${metrics.growthRate.toFixed(1)}% ce mois`} icon={Wallet} tone={metrics.cashFlow >= 0 ? 'green' : 'red'} />
        <ReportMetricCard label="TVA nette" value={formatCompactFCFA(metrics.taxDue)} detail={metrics.taxDue > 0 ? 'à payer' : 'aucun solde'} icon={Receipt} tone="amber" />
      </Grid>
      <View style={styles.reportInsightCallout}>
        <Icon icon={BrainCircuit} size={17} color={c.formalio700} />
        <View style={{ flex: 1 }}>
          <Txt weight="bold" style={{ color: c.formalio800, fontSize: 12 }}>Synthèse comptable Mosika</Txt>
          <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{empty ? 'Aucun rapport financier n’est généré tant que vos transactions sont vides.' : 'Les documents sont calculés avec vos transactions, ratios, TVA et contrôles de cohérence.'}</Txt>
        </View>
      </View>
    </View>
  );
}

const reportAnalytics: Record<ReportType, {
  headline: string;
  sub: string;
  tone: 'green' | 'amber' | 'blue' | 'red';
  score: number;
  kpis: { label: string; value: string; detail: string; icon: LucideIcon; tone: 'green' | 'amber' | 'blue' | 'red' }[];
  insights: string[];
}> = {
  bilan: {
    headline: 'Structure financière saine',
    sub: 'Liquidité 3.2x, capitaux propres solides, dette court terme maîtrisée.',
    tone: 'blue',
    score: 82,
    kpis: [
      { label: 'Actifs', value: '4.25M', detail: '+9% mois', icon: FileSpreadsheet, tone: 'blue' },
      { label: 'Passifs', value: '1.32M', detail: '31% actifs', icon: TrendingDown, tone: 'amber' },
      { label: 'Capitaux', value: '2.93M', detail: 'équilibre fort', icon: Shield, tone: 'green' },
      { label: 'Liquidité', value: '3.2x', detail: 'très confortable', icon: Wallet, tone: 'green' },
    ],
    insights: ['Les actifs courants couvrent largement les obligations court terme.', 'Le niveau de fonds propres renforce la crédibilité bancaire.', 'Aucune rupture de liquidité détectée sur le mois.'],
  },
  'compte-resultat': {
    headline: 'Rentabilité nette élevée',
    sub: 'Résultat positif porté par les ventes marchandises et des charges stables.',
    tone: 'green',
    score: 88,
    kpis: [
      { label: 'CA', value: '1.24M', detail: '+23% mois', icon: TrendingUp, tone: 'green' },
      { label: 'Charges', value: '420K', detail: '-8% mois', icon: Receipt, tone: 'red' },
      { label: 'Résultat', value: '825K', detail: 'net positif', icon: Calculator, tone: 'green' },
      { label: 'Marge', value: '66%', detail: '+6 pts', icon: BarChart3, tone: 'blue' },
    ],
    insights: ['Les ventes progressent plus vite que les charges opérationnelles.', 'Transport reste le poste à surveiller cette semaine.', 'Le seuil de rentabilité est atteint dès la troisième semaine du mois.'],
  },
  tresorerie: {
    headline: 'Cash flow opérationnel robuste',
    sub: 'Les encaissements couvrent les investissements et renforcent le cash net.',
    tone: 'green',
    score: 79,
    kpis: [
      { label: 'Opérationnel', value: '+845K', detail: 'encaissements', icon: Wallet, tone: 'green' },
      { label: 'Invest.', value: '-125K', detail: 'stock outil', icon: ArrowDownRight, tone: 'red' },
      { label: 'Cash net', value: '+720K', detail: 'variation', icon: TrendingUp, tone: 'green' },
      { label: 'Couverture', value: '18j', detail: 'charges fixes', icon: Shield, tone: 'blue' },
    ],
    insights: ['Le cash opérationnel reste positif malgré l’investissement stock.', 'Les sorties sont concentrées sur trois catégories récurrentes.', 'La réserve disponible couvre presque trois semaines de charges fixes.'],
  },
  tva: {
    headline: 'TVA à payer sous contrôle',
    sub: 'Solde net identifié avec séparation claire collectée / déductible.',
    tone: 'amber',
    score: 74,
    kpis: [
      { label: 'Collectée', value: '239K', detail: 'ventes', icon: TrendingUp, tone: 'green' },
      { label: 'Déductible', value: '80K', detail: 'achats', icon: Receipt, tone: 'blue' },
      { label: 'Net TVA', value: '158K', detail: 'à payer', icon: Calculator, tone: 'amber' },
      { label: 'Échéance', value: '15 Fév', detail: '5 jours', icon: AlertTriangle, tone: 'red' },
    ],
    insights: ['Le solde net est prêt pour revue avant déclaration.', 'Trois justificatifs achats doivent être vérifiés avant export final.', 'Prévoir la trésorerie TVA avant paiement fournisseur principal.'],
  },
};

function ReportIntelligenceDeck({ type, metrics }: { type: ReportType; metrics: CloudFinancialMetrics }) {
  void reportAnalytics[type];
  const empty = metrics.emptyState || metrics.transactionCount === 0;
  const report = {
    bilan: {
      headline: empty ? 'Bilan encore vide' : 'Structure financière calculée',
      sub: empty ? 'Ajoutez des transactions et documents pour produire le bilan.' : `Actifs nets estimés: ${formatFCFA(Math.max(metrics.balance, 0))}, obligations courantes basées sur les charges.`,
      tone: 'blue' as const,
      score: metrics.financialHealth,
      kpis: [
        { label: 'Actifs', value: formatCompactFCFA(Math.max(metrics.balance, 0)), detail: 'cash net estimé', icon: FileSpreadsheet, tone: 'blue' as const },
        { label: 'Passifs', value: formatCompactFCFA(metrics.expenses), detail: 'charges de la période', icon: TrendingDown, tone: 'amber' as const },
        { label: 'Capitaux', value: formatCompactFCFA(metrics.profit), detail: metrics.profit >= 0 ? 'positif' : 'deficit', icon: Shield, tone: metrics.profit >= 0 ? 'green' as const : 'red' as const },
        { label: 'Sante', value: `${metrics.financialHealth}%`, detail: 'score financier', icon: Wallet, tone: 'green' as const },
      ],
      insights: empty ? ['Aucun actif/passif calculé sans transactions.', 'Complétez votre profil et ajoutez vos documents.', 'Le bilan restera à zéro pour un nouvel utilisateur.'] : [`Cash net: ${formatFCFA(metrics.cashFlow)}.`, `Conformité: ${metrics.complianceScore}%.`, `Score Mosika: ${metrics.mosikaScore}.`],
    },
    'compte-resultat': {
      headline: empty ? 'Compte de résultat vide' : metrics.profit >= 0 ? 'Résultat net positif' : 'Résultat net à surveiller',
      sub: empty ? 'Les revenus et charges démarrent à zéro.' : `Revenus ${formatFCFA(metrics.revenue)}, charges ${formatFCFA(metrics.expenses)}, marge ${metrics.profitMargin.toFixed(1)}%.`,
      tone: metrics.profit >= 0 ? 'green' as const : 'red' as const,
      score: metrics.financialHealth,
      kpis: [
        { label: 'CA', value: formatCompactFCFA(metrics.revenue), detail: `${metrics.revenueCount} revenus`, icon: TrendingUp, tone: 'green' as const },
        { label: 'Charges', value: formatCompactFCFA(metrics.expenses), detail: `${metrics.expenseCount} dépenses`, icon: Receipt, tone: 'red' as const },
        { label: 'Résultat', value: formatCompactFCFA(metrics.profit), detail: metrics.profit >= 0 ? 'net positif' : 'net négatif', icon: Calculator, tone: metrics.profit >= 0 ? 'green' as const : 'red' as const },
        { label: 'Marge', value: `${metrics.profitMargin.toFixed(1)}%`, detail: 'période', icon: BarChart3, tone: 'blue' as const },
      ],
      insights: empty ? ['Aucun revenu enregistré.', 'Aucune charge enregistrée.', 'Le résultat net reste à zéro.'] : [`Variation revenus: ${metrics.growthRate.toFixed(1)}%.`, `Ratio charges/revenus: ${metrics.revenue ? Math.round((metrics.expenses / metrics.revenue) * 100) : 0}%.`, 'Les rapports se recalculent après chaque transaction.'],
    },
    tresorerie: {
      headline: empty ? 'Flux de trésorerie vide' : metrics.cashFlow >= 0 ? 'Cash flow opérationnel positif' : 'Cash flow opérationnel négatif',
      sub: empty ? 'Aucun encaissement ou décaissement pour le moment.' : `Variation nette: ${formatFCFA(metrics.cashFlow)} sur la période.`,
      tone: metrics.cashFlow >= 0 ? 'green' as const : 'red' as const,
      score: metrics.financialHealth,
      kpis: [
        { label: 'Encaissements', value: formatCompactFCFA(metrics.revenue), detail: 'revenus', icon: Wallet, tone: 'green' as const },
        { label: 'Décaissements', value: formatCompactFCFA(metrics.expenses), detail: 'sorties', icon: ArrowDownRight, tone: 'red' as const },
        { label: 'Cash net', value: formatCompactFCFA(metrics.cashFlow), detail: 'variation', icon: TrendingUp, tone: metrics.cashFlow >= 0 ? 'green' as const : 'red' as const },
        { label: 'Transactions', value: String(metrics.transactionCount), detail: 'période', icon: Shield, tone: 'blue' as const },
      ],
      insights: empty ? ['Aucun flux détecté.', 'Ajoutez revenus et dépenses pour visualiser la trésorerie.', 'Les graphiques resteront neutres jusque-là.'] : [`Cash flow: ${formatFCFA(metrics.cashFlow)}.`, `Dépenses: ${formatFCFA(metrics.expenses)}.`, `Revenus: ${formatFCFA(metrics.revenue)}.`],
    },
    tva: {
      headline: empty ? 'TVA non calculée' : 'TVA calculée depuis les transactions',
      sub: empty ? 'Aucune TVA sans revenus ou charges.' : `Collectée ${formatFCFA(metrics.taxCollected)}, déductible ${formatFCFA(metrics.taxDeductible)}.`,
      tone: 'amber' as const,
      score: metrics.taxDue > 0 ? Math.min(100, Math.max(30, metrics.financialHealth)) : 0,
      kpis: [
        { label: 'Collectée', value: formatCompactFCFA(metrics.taxCollected), detail: 'ventes', icon: TrendingUp, tone: 'green' as const },
        { label: 'Déductible', value: formatCompactFCFA(metrics.taxDeductible), detail: 'achats', icon: Receipt, tone: 'blue' as const },
        { label: 'Net TVA', value: formatCompactFCFA(metrics.taxDue), detail: metrics.taxDue > 0 ? 'à payer' : 'zéro', icon: Calculator, tone: 'amber' as const },
        { label: 'Docs', value: String(metrics.documentCount), detail: 'justificatifs', icon: AlertTriangle, tone: metrics.documentCount ? 'blue' as const : 'red' as const },
      ],
      insights: empty ? ['Aucun solde TVA pour un nouveau compte.', 'Les justificatifs augmenteront la précision.', 'La déclaration se préparera avec les transactions réelles.'] : [`TVA nette: ${formatFCFA(metrics.taxDue)}.`, `TVA collectée: ${formatFCFA(metrics.taxCollected)}.`, `TVA déductible: ${formatFCFA(metrics.taxDeductible)}.`],
    },
  }[type];
  const palette = report.tone === 'amber' ? [c.gold50, c.gold600] : report.tone === 'blue' ? [c.info50, c.info600] : [c.formalio50, c.formalio700];
  return (
    <View style={{ gap: 12, marginBottom: 14 }}>
      <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.reportDetailHero}>
        <Row style={{ justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="black" style={{ color: c.white, fontSize: 20 }}>{report.headline}</Txt>
            <Txt style={{ color: c.formalio200, fontSize: 11, lineHeight: 16, marginTop: 6 }}>{report.sub}</Txt>
          </View>
          <View style={styles.reportScoreRing}>
            <Txt weight="black" style={{ color: c.white, fontSize: 18 }}>{report.score}</Txt>
            <Txt style={{ color: c.formalio200, fontSize: 9 }}>score</Txt>
          </View>
        </Row>
        <View style={{ marginTop: 14 }}>
          <ValueBar value={report.score} color={palette[1]} track="rgba(255,255,255,.16)" />
        </View>
      </LinearGradient>
      <Grid columns={2} gap={10}>
        {report.kpis.map((kpi) => <ReportMetricCard key={kpi.label} {...kpi} />)}
      </Grid>
      <Card style={{ padding: 14 }}>
        <Row style={{ gap: 7, marginBottom: 10 }}>
          <Icon icon={Sparkles} size={16} color={c.formalio700} />
          <Txt weight="bold" style={{ fontSize: 12 }}>Insights avant export</Txt>
        </Row>
        {report.insights.map((insight) => (
          <Row key={insight} style={{ alignItems: 'flex-start', gap: 8, marginTop: 7 }}>
            <View style={[styles.tinyDot, { backgroundColor: palette[1], marginTop: 5 }]} />
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, flex: 1 }}>{insight}</Txt>
          </Row>
        ))}
      </Card>
    </View>
  );
}

function ReportMetricCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: 'green' | 'amber' | 'blue' | 'red' }) {
  const palette = tone === 'green' ? [c.formalio50, c.formalio700] : tone === 'amber' ? [c.gold50, c.gold600] : tone === 'red' ? [c.danger50, c.danger600] : [c.info50, c.info600];
  return (
    <Card style={styles.reportMetricCard}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={[styles.metricIcon, { backgroundColor: palette[0] }]}><Icon icon={icon} size={15} color={palette[1]} /></View>
        <View style={[styles.reportMetricAccent, { backgroundColor: palette[1] }]} />
      </Row>
      <Txt style={{ color: c.surface500, fontSize: 10 }}>{label}</Txt>
      <Txt weight="black" style={{ color: tone === 'red' ? c.danger600 : c.surface900, fontSize: 18, marginTop: 2 }}>{value}</Txt>
      <Txt numberOfLines={1} style={{ color: c.surface400, fontSize: 10, marginTop: 2 }}>{detail}</Txt>
    </Card>
  );
}

function ReportExportPanel({
  title,
  period,
  type,
  canExport,
  requirements,
  onExport,
}: {
  title: string;
  period: string;
  type: BackendReportType;
  canExport: boolean;
  requirements: string[];
  onExport: (title: string, period: string, type?: BackendReportType) => void;
}) {
  return (
    <Card style={styles.reportExportPanel}>
      <Row style={{ justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="bold" style={{ fontSize: 14 }}>Export sécurisé</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, marginTop: 3 }}>PDF signé ou Excel structuré avec période, contrôles et annexes de calcul.</Txt>
        </View>
        <View style={styles.exportBadge}><Icon icon={Download} size={16} color={c.formalio700} /></View>
      </Row>
      <Grid columns={2} gap={10}>
        <View style={styles.exportFormatMini}><Icon icon={FileText} size={16} color={c.danger600} /><Txt weight="bold" style={{ fontSize: 11 }}>PDF audit</Txt></View>
        <View style={styles.exportFormatMini}><Icon icon={FileSpreadsheet} size={16} color={c.formalio700} /><Txt weight="bold" style={{ fontSize: 11 }}>Excel data</Txt></View>
      </Grid>
      {!canExport ? (
        <View style={[styles.infoCallout, { marginTop: 12 }]}>
          <Icon icon={AlertTriangle} size={16} color={c.amber700} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" style={{ color: c.amber700, fontSize: 12 }}>Données insuffisantes</Txt>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>
              {(requirements.length ? requirements : ['Ajoutez des transactions terminées avant de générer un rapport officiel.']).join(' · ')}
            </Txt>
          </View>
        </View>
      ) : null}
      <PrimaryButton disabled={!canExport} label={canExport ? "Préparer l'export" : 'Export indisponible'} icon={Download} onPress={() => onExport(title, period, type)} style={{ marginTop: 12, minHeight: 46, borderRadius: 14 }} />
    </Card>
  );
}

function SYSCOHADAReport({ type, period, metrics }: { type: ReportType; period: string; metrics: CloudFinancialMetrics }) {
  const title = {
    bilan: 'Bilan Comptable',
    'compte-resultat': 'Compte de Résultat',
    tresorerie: 'Flux de Trésorerie',
    tva: 'Déclaration TVA',
  }[type];
  const rows = type === 'bilan'
    ? [['Actifs courants', Math.max(metrics.balance, 0)], ['Passifs courants', metrics.expenses], ['Capitaux propres', metrics.profit]]
    : type === 'compte-resultat'
      ? [["Chiffre d'affaires", metrics.revenue], ['Charges operationnelles', metrics.expenses], ['Resultat net', metrics.profit]]
      : type === 'tresorerie'
        ? [['Flux operationnel', metrics.cashFlow], ['Encaissements', metrics.revenue], ['Decaissements', -metrics.expenses]]
        : [['TVA collectée', metrics.taxCollected], ['TVA déductible', metrics.taxDeductible], ['Net à payer', metrics.taxDue]];
  return (
    <Card style={styles.reportDocumentCard}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <View>
          <Txt style={{ color: c.surface400, fontSize: 11 }}>FORMALIO</Txt>
          <Txt weight="black" style={{ fontSize: 18, marginTop: 2 }}>{title}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 2 }}>{period} · SYSCOHADA</Txt>
        </View>
        <LogoMark size={42} />
      </Row>
      {rows.map(([label, value], i) => {
        const amount = Number(value);
        const outgoing = amount < 0 || String(label).includes('Charges') || String(label).includes('payer') || String(label).includes('Passifs') || String(label).includes('Decaissements');
        const emphasisColor = outgoing ? c.danger600 : i === rows.length - 1 ? c.formalio700 : c.surface900;
        return (
          <Row key={String(label)} style={[styles.reportLine, i === rows.length - 1 && { borderTopWidth: 1, borderTopColor: c.surface200, paddingTop: 12 }]}>
            <Txt weight={i === rows.length - 1 ? 'bold' : 'medium'} style={{ color: c.surface700, fontSize: 13 }}>{label}</Txt>
            <Txt weight="black" style={{ color: emphasisColor, fontSize: 14 }}>{formatFCFA(amount)}</Txt>
          </Row>
        );
      })}
      <View style={styles.reportStamp}>
        <Icon icon={CheckCircle2} size={15} color={c.formalio700} />
        <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Validé pour revue comptable</Txt>
      </View>
    </Card>
  );
}
