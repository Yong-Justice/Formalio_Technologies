import type { SyncableRecord } from './database.types';

export type BusinessFicheType =
  | 'bar_buvette'
  | 'restaurant'
  | 'boutique_generale'
  | 'epicerie'
  | 'pharmacie'
  | 'coiffure_barbier'
  | 'couturier'
  | 'garage'
  | 'taxi_transport'
  | 'autre_stock'
  | 'autre_service';

export type PeriodType =
  | '1_jour'
  | '2_jours'
  | '3_jours'
  | '4_jours'
  | '1_semaine'
  | 'personnalise';

export interface StockEntry {
  id: string;
  productName: string;
  unit: string;
  quantiteOuverture: number;
  entrees: EntreeItem[];
  quantiteFermeture: number;
  finalStockCounted?: boolean;
  prixUnitaire: number;
  quantiteVendueTheorique: number;
  montantTheorique: number;
}

export interface EntreeItem {
  id: string;
  date: string;
  quantite: number;
  prixAchat?: number;
  fournisseur?: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  montant: number;
  date: string;
  category: ExpenseCategory;
}

export type ExpenseCategory =
  | 'transport'
  | 'electricite_eau'
  | 'gaz_charbon'
  | 'glace'
  | 'emballage'
  | 'salaire_journalier'
  | 'loyer'
  | 'achat_fournitures'
  | 'autre';

export interface ServiceEntry {
  id: string;
  serviceName: string;
  nombreRealise: number;
  prixUnitaire: number;
  montantTotal: number;
}

export interface FicheData {
  id: string;
  userId: string;
  ficheType: BusinessFicheType;
  periodType: PeriodType;
  dateDebut: string;
  dateFin: string;
  stockItems: StockEntry[];
  serviceItems: ServiceEntry[];
  expenses: ExpenseItem[];
  caisseAttendue: number;
  caisseReelle: number;
  ecart: number;
  ecartPercentage: number;
  ecartJustification?: string;
  ecartCategory?: EcartCategory;
  status: 'draft' | 'in_progress' | 'awaiting_final_stock' | 'completed' | 'validated';
  createdAt: number;
  updatedAt: number;
  isSynced: boolean;
}

export type EcartCategory =
  | 'offerts_cadeaux'
  | 'casse_perimes'
  | 'erreur_comptage'
  | 'remboursement_client'
  | 'credit_client'
  | 'autre';

export interface FicheResult {
  totalRevenusTheoriques: number;
  totalDepenses: number;
  caisseAttendue: number;
  caisseReelle: number;
  ecart: number;
  ecartPercentage: number;
  ecartLevel: 'ok' | 'warning' | 'danger' | 'critical';
  message: string;
  recommendation: string;
}

export interface FicheRecord extends SyncableRecord {
  fiche_type: BusinessFicheType;
  period_type: PeriodType;
  date_debut: string;
  date_fin: string;
  stock_items_json: string;
  service_items_json: string;
  expenses_json: string;
  revenus_theoriques: number;
  total_depenses: number;
  caisse_attendue: number;
  caisse_reelle: number;
  ecart: number;
  ecart_percentage: number;
  ecart_level: FicheResult['ecartLevel'];
  ecart_justification?: string | null;
  ecart_category?: EcartCategory | null;
  status: 'draft' | 'in_progress' | 'awaiting_final_stock' | 'completed' | 'validated';
}
