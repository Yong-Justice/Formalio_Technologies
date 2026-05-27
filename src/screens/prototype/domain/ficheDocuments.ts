import type { FicheCompletionPayload, FicheDraftPayload } from '@/screens/fiche/FicheScreen';
import type { FicheData } from '@/types/fiche.types';
import { normalizeSearchText } from './transactions';

export const FICHE_LAST_COMPLETED_AT_KEY = 'formalio.fiche.lastCompletedAt';
export const FICHE_PENDING_DRAFT_KEY = 'formalio.fiche.pendingDraft';
export const FICHE_DOCUMENTS_KEY = 'formalio.fiche.documents';

export type FicheDocumentStatus = 'draft' | 'awaiting_final_stock' | 'completed';
export type FicheStatusFilter = 'all' | 'awaiting_final_stock' | 'completed';
export type FichePeriodFilter = 'all' | 'week' | 'month' | 'year';

export type FicheDocumentRecord = {
  id: string;
  createdAt: number;
  updatedAt: number;
  dateDebut: string;
  dateFin: string;
  status: FicheDocumentStatus;
  caisseReelle?: number;
  ecart?: number;
  data: Partial<FicheData>;
};

function getFicheDocumentId(data: Partial<FicheData>) {
  return data.id || `fiche-${data.createdAt || Date.now()}`;
}

export function upsertFicheDocument(documents: FicheDocumentRecord[], next: FicheDocumentRecord) {
  return [next, ...documents.filter((document) => document.id !== next.id)]
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createFicheDocumentFromDraft(payload: FicheDraftPayload): FicheDocumentRecord {
  const data = payload.data;
  return {
    id: getFicheDocumentId(data),
    createdAt: data.createdAt || payload.savedAt,
    updatedAt: payload.savedAt,
    dateDebut: data.dateDebut || '',
    dateFin: data.dateFin || '',
    status: payload.status,
    data,
  };
}

export function createFicheDocumentFromCompletion(payload: FicheCompletionPayload, completedAt: number): FicheDocumentRecord {
  const data = payload.data;
  return {
    id: getFicheDocumentId(data),
    createdAt: data.createdAt || completedAt,
    updatedAt: completedAt,
    dateDebut: data.dateDebut || '',
    dateFin: data.dateFin || '',
    status: 'completed',
    caisseReelle: payload.result.caisseReelle,
    ecart: payload.result.ecart,
    data: { ...data, status: 'completed' },
  };
}

export function shouldShowFicheReminder(lastCompletedAt: number | null) {
  if (!lastCompletedAt) return true;
  return Date.now() - lastCompletedAt > 24 * 60 * 60 * 1000;
}

export function formatFicheReminderAge(lastCompletedAt: number | null) {
  if (!lastCompletedAt) return 'Aucune fiche enregistrée';
  const diffMs = Date.now() - lastCompletedAt;
  const diffHours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)));
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

export function filterFicheDocuments(
  documents: FicheDocumentRecord[],
  search: string,
  status: FicheStatusFilter,
  period: FichePeriodFilter,
) {
  const query = normalizeSearchText(search);
  const now = Date.now();
  const periodLimit = period === 'week'
    ? 7 * 24 * 60 * 60 * 1000
    : period === 'month'
      ? 31 * 24 * 60 * 60 * 1000
      : period === 'year'
        ? 366 * 24 * 60 * 60 * 1000
        : 0;

  return documents.filter((document) => {
    if (status !== 'all' && document.status !== status) return false;
    if (periodLimit > 0 && now - document.createdAt > periodLimit) return false;
    if (!query) return true;
    return normalizeSearchText(`${document.dateDebut} ${document.dateFin} ${document.status}`).includes(query);
  });
}

export function ficheStatusLabel(status: FicheDocumentStatus) {
  if (status === 'completed') return 'Completed';
  if (status === 'awaiting_final_stock') return 'Awaiting Final Stock';
  return 'Draft';
}

export function ficheStatusTone(status: FicheDocumentStatus): 'green' | 'gold' | 'surface' {
  if (status === 'completed') return 'green';
  if (status === 'awaiting_final_stock') return 'gold';
  return 'surface';
}
