import type {
  BusinessFicheType,
  ExpenseCategory,
  PeriodType,
  ServiceEntry,
  StockEntry,
} from '../types/fiche.types';

export interface FicheTemplate {
  type: BusinessFicheType;
  label: string;
  emoji: string;
  description: string;
  hasStock: boolean;
  hasServices: boolean;
  defaultStockItems: Partial<StockEntry>[];
  defaultServiceItems: Partial<ServiceEntry>[];
  defaultExpenseCategories: ExpenseCategory[];
  hint: string;
}

export const FICHE_TEMPLATES: FicheTemplate[] = [
  {
    type: 'bar_buvette',
    label: 'Bar / Buvette',
    emoji: '🍺',
    description: 'Comptage de bouteilles et reconciliation de caisse',
    hasStock: true,
    hasServices: false,
    defaultStockItems: [
      { productName: 'Primus 65cl', unit: 'bouteille', prixUnitaire: 600 },
      { productName: '33 Export', unit: 'bouteille', prixUnitaire: 600 },
      { productName: 'Castel Biere', unit: 'bouteille', prixUnitaire: 500 },
      { productName: 'Coca Cola', unit: 'bouteille', prixUnitaire: 400 },
      { productName: 'Eau Minerale', unit: 'bouteille', prixUnitaire: 250 },
      { productName: 'Whisky (verre)', unit: 'verre', prixUnitaire: 1000 },
    ],
    defaultServiceItems: [],
    defaultExpenseCategories: ['glace', 'transport', 'electricite_eau', 'salaire_journalier'],
    hint: 'Comptez les bouteilles restantes ce soir et entrez le nombre.',
  },
  {
    type: 'restaurant',
    label: 'Restaurant / Snack',
    emoji: '🍽️',
    description: 'Suivi des portions preparees et vendues',
    hasStock: true,
    hasServices: false,
    defaultStockItems: [
      { productName: 'Poulet DG (portion)', unit: 'portion', prixUnitaire: 2500 },
      { productName: 'Kondre (portion)', unit: 'portion', prixUnitaire: 3000 },
      { productName: 'Spaghetti (assiette)', unit: 'assiette', prixUnitaire: 1000 },
      { productName: 'Eru (portion)', unit: 'portion', prixUnitaire: 1500 },
      { productName: 'Beignets haricot', unit: 'portion', prixUnitaire: 200 },
    ],
    defaultServiceItems: [],
    defaultExpenseCategories: ['gaz_charbon', 'transport', 'achat_fournitures', 'salaire_journalier'],
    hint: 'Pour chaque plat: combien avez-vous prepare? Combien reste-t-il?',
  },
  {
    type: 'boutique_generale',
    label: 'Boutique generale',
    emoji: '🏪',
    description: 'Suivi du stock et reconciliation journaliere',
    hasStock: true,
    hasServices: false,
    defaultStockItems: [
      { productName: 'Riz', unit: 'kg', prixUnitaire: 650 },
      { productName: 'Huile de palme', unit: 'litre', prixUnitaire: 3500 },
      { productName: 'Sucre', unit: 'kg', prixUnitaire: 1000 },
      { productName: 'Savon', unit: 'barre', prixUnitaire: 250 },
    ],
    defaultServiceItems: [],
    defaultExpenseCategories: ['transport', 'emballage', 'electricite_eau', 'loyer'],
    hint: 'Comptez ce qui reste sur les etageres et entrez la quantite.',
  },
  {
    type: 'epicerie',
    label: 'Epicerie',
    emoji: '🛒',
    description: 'Inventaire rapide des produits alimentaires',
    hasStock: true,
    hasServices: false,
    defaultStockItems: [
      { productName: 'Pain', unit: 'piece', prixUnitaire: 150 },
      { productName: 'Oeufs', unit: 'plateau', prixUnitaire: 3000 },
      { productName: 'Tomates', unit: 'panier', prixUnitaire: 2500 },
      { productName: 'Arachides', unit: 'kg', prixUnitaire: 1200 },
    ],
    defaultServiceItems: [],
    defaultExpenseCategories: ['transport', 'emballage', 'achat_fournitures', 'autre'],
    hint: 'Entrez les quantites restantes pour les produits du jour.',
  },
  {
    type: 'pharmacie',
    label: 'Pharmacie / Depot',
    emoji: '💊',
    description: 'Suivi rigoureux des medicaments',
    hasStock: true,
    hasServices: false,
    defaultStockItems: [
      { productName: 'Paracetamol 500mg', unit: 'comprime', prixUnitaire: 10 },
      { productName: 'Amoxicilline 500mg', unit: 'gelule', prixUnitaire: 50 },
      { productName: 'Coartem 6cp', unit: 'boite', prixUnitaire: 2500 },
    ],
    defaultServiceItems: [],
    defaultExpenseCategories: ['electricite_eau', 'transport', 'loyer'],
    hint: 'Comptez les boites et comprimes restants avec precision.',
  },
  {
    type: 'coiffure_barbier',
    label: 'Coiffure / Barbier',
    emoji: '✂️',
    description: 'Suivi des services rendus',
    hasStock: false,
    hasServices: true,
    defaultStockItems: [],
    defaultServiceItems: [
      { serviceName: 'Coupe homme', prixUnitaire: 500 },
      { serviceName: 'Coupe + barbe', prixUnitaire: 800 },
      { serviceName: 'Rasage', prixUnitaire: 300 },
      { serviceName: 'Tresses simples', prixUnitaire: 2500 },
      { serviceName: 'Tissage', prixUnitaire: 8000 },
      { serviceName: 'Coloration', prixUnitaire: 5000 },
    ],
    defaultExpenseCategories: ['electricite_eau', 'achat_fournitures', 'loyer', 'salaire_journalier'],
    hint: 'Pour chaque service: combien de clients avez-vous servis?',
  },
  {
    type: 'couturier',
    label: 'Couturier / Tailleur',
    emoji: '🪡',
    description: 'Suivi des commandes et livraisons',
    hasStock: false,
    hasServices: true,
    defaultStockItems: [],
    defaultServiceItems: [
      { serviceName: 'Robe simple', prixUnitaire: 15000 },
      { serviceName: 'Robe de soiree', prixUnitaire: 35000 },
      { serviceName: 'Costume 3 pieces', prixUnitaire: 50000 },
      { serviceName: 'Transformation pagne', prixUnitaire: 8000 },
      { serviceName: 'Retouche', prixUnitaire: 3000 },
    ],
    defaultExpenseCategories: ['electricite_eau', 'achat_fournitures', 'transport', 'loyer'],
    hint: 'Notez les commandes livrees et les acomptes recus.',
  },
  {
    type: 'garage',
    label: 'Garage / Mecanicien',
    emoji: '🔧',
    description: 'Reparations et vente de pieces',
    hasStock: true,
    hasServices: true,
    defaultStockItems: [
      { productName: 'Huile moteur (litre)', unit: 'litre', prixUnitaire: 3500 },
      { productName: 'Filtre a huile', unit: 'piece', prixUnitaire: 5000 },
      { productName: 'Batterie', unit: 'piece', prixUnitaire: 35000 },
    ],
    defaultServiceItems: [
      { serviceName: 'Vidange', prixUnitaire: 3000 },
      { serviceName: 'Diagnostic', prixUnitaire: 5000 },
      { serviceName: 'Reparation freins', prixUnitaire: 15000 },
    ],
    defaultExpenseCategories: ['transport', 'electricite_eau', 'achat_fournitures', 'salaire_journalier'],
    hint: 'Entrez les reparations effectuees et les pieces vendues.',
  },
  {
    type: 'taxi_transport',
    label: 'Taxi / Transport',
    emoji: '🚕',
    description: 'Recettes journalieres et depenses de route',
    hasStock: false,
    hasServices: true,
    defaultStockItems: [],
    defaultServiceItems: [{ serviceName: 'Courses (total journee)', prixUnitaire: 1 }],
    defaultExpenseCategories: ['transport', 'autre'],
    hint: 'Entrez vos recettes totales de la journee et vos depenses.',
  },
  {
    type: 'autre_stock',
    label: 'Autre (avec stock)',
    emoji: '📦',
    description: 'Commerce avec inventaire personnalise',
    hasStock: true,
    hasServices: false,
    defaultStockItems: [],
    defaultServiceItems: [],
    defaultExpenseCategories: ['transport', 'autre'],
    hint: 'Ajoutez vos produits et leurs quantites.',
  },
  {
    type: 'autre_service',
    label: 'Autre (services)',
    emoji: '🛠️',
    description: 'Prestation de services personnalisee',
    hasStock: false,
    hasServices: true,
    defaultStockItems: [],
    defaultServiceItems: [],
    defaultExpenseCategories: ['transport', 'autre'],
    hint: 'Ajoutez vos services et leur nombre.',
  },
];

export const PERIOD_OPTIONS: { value: PeriodType; label: string; days: number }[] = [
  { value: '1_jour', label: '1 jour', days: 1 },
  { value: '2_jours', label: '2 jours', days: 2 },
  { value: '3_jours', label: '3 jours', days: 3 },
  { value: '4_jours', label: '4 jours', days: 4 },
  { value: '1_semaine', label: '1 semaine', days: 7 },
  { value: 'personnalise', label: 'Personnalise', days: 0 },
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport: '🚗 Transport',
  electricite_eau: '💡 Electricite / Eau',
  gaz_charbon: '🔥 Gaz / Charbon',
  glace: '🧊 Glace',
  emballage: '📦 Emballage',
  salaire_journalier: '👷 Salaire journalier',
  loyer: '🏠 Loyer',
  achat_fournitures: '🛒 Achats / Fournitures',
  autre: '📝 Autre',
};
