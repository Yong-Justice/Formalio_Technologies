export type Transaction = {
  id: number | string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  method: string;
  status: string;
};

export const transactions: Transaction[] = [
  { id: 1, date: '2025-01-15', description: 'Vente marchandise', category: 'Revenus', type: 'income', amount: 125000, method: 'MTN MoMo', status: 'completed' },
  { id: 2, date: '2025-01-14', description: 'Achat stock textile', category: 'Achats', type: 'expense', amount: 45000, method: 'Espèces', status: 'completed' },
  { id: 3, date: '2025-01-14', description: 'Transport marchandise', category: 'Transport', type: 'expense', amount: 15000, method: 'Orange Money', status: 'completed' },
  { id: 4, date: '2025-01-13', description: 'Vente boutique', category: 'Revenus', type: 'income', amount: 89000, method: 'Espèces', status: 'completed' },
  { id: 5, date: '2025-01-12', description: 'Frais téléphonique', category: 'Services', type: 'expense', amount: 5000, method: 'MTN MoMo', status: 'completed' },
  { id: 6, date: '2025-01-11', description: 'Vente en gros', category: 'Revenus', type: 'income', amount: 210000, method: 'Virement', status: 'completed' },
  { id: 7, date: '2025-01-10', description: 'Loyer boutique', category: 'Loyer', type: 'expense', amount: 75000, method: 'Espèces', status: 'completed' },
  { id: 8, date: '2025-01-09', description: 'Vente client régulier', category: 'Revenus', type: 'income', amount: 67000, method: 'Orange Money', status: 'completed' },
];

export const cashFlowData = [
  { name: 'Lun', income: 125000, expense: 45000 },
  { name: 'Mar', income: 89000, expense: 60000 },
  { name: 'Mer', income: 210000, expense: 75000 },
  { name: 'Jeu', income: 67000, expense: 15000 },
  { name: 'Ven', income: 145000, expense: 35000 },
  { name: 'Sam', income: 98000, expense: 22000 },
  { name: 'Dim', income: 56000, expense: 8000 },
];

export const creditScoreHistory = [
  { month: 'Juil', score: 620 },
  { month: 'Août', score: 645 },
  { month: 'Sept', score: 670 },
  { month: 'Oct', score: 695 },
  { month: 'Nov', score: 710 },
  { month: 'Déc', score: 735 },
  { month: 'Jan', score: 760 },
];

export const categoryBreakdown = [
  { name: 'Revenus ventes', value: 65, color: '#059669' },
  { name: 'Services', value: 15, color: '#10b981' },
  { name: 'Locations', value: 12, color: '#34d399' },
  { name: 'Autres', value: 8, color: '#6ee7b7' },
];

export const expenseBreakdown = [
  { name: 'Achats stock', value: 40, color: '#ef4444' },
  { name: 'Loyer', value: 25, color: '#f97316' },
  { name: 'Transport', value: 15, color: '#f59e0b' },
  { name: 'Services', value: 12, color: '#eab308' },
  { name: 'Autres', value: 8, color: '#ca8a04' },
];

export type DemoNotification = {
  id: number | string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export const notifications: DemoNotification[] = [
  { id: 1, type: 'success' as const, title: 'Sync Mobile Money', message: '45 transactions importées depuis MTN MoMo', time: '2 min', read: false },
  { id: 2, type: 'warning' as const, title: 'Rappel Fiscal', message: 'Déclaration TVA due dans 5 jours', time: '1h', read: false },
  { id: 3, type: 'info' as const, title: 'Score Mosika', message: 'Votre score a augmenté de +15 points !', time: '3h', read: true },
  { id: 4, type: 'success' as const, title: 'Objectif atteint', message: 'Vous avez dépassé votre objectif de revenus mensuel', time: '1j', read: true },
];

export const aiInsights = [
  { id: 1, type: 'tip' as const, title: 'Optimisation des stocks', message: 'Vos achats de stock ont augmenté de 23% ce mois. Envisagez de négocier des remises avec votre fournisseur principal.', impact: 'Économie potentielle: 45,000 FCFA/mois' },
  { id: 2, type: 'alert' as const, title: 'Trésorerie', message: 'Votre trésorerie est basse pour la fin du mois. 3 factures clients sont en retard de paiement.', impact: 'Risque: Pénurie de liquidités' },
  { id: 3, type: 'opportunity' as const, title: 'Prêt éligible', message: "Avec votre Score Mosika actuel de 760, vous êtes éligible pour un prêt de 2,000,000 FCFA à 8% d'intérêt.", impact: 'Opportunité: Expansion possible' },
];

export const pricingPlans = [
  { name: 'Débutant', price: '0', period: '/mois', description: 'Pour les petites entreprises qui démarrent', popular: false },
  { name: 'Croissance', price: '4,900', period: 'FCFA/mois', description: 'Pour les entreprises en expansion', popular: true },
  { name: 'Pro', price: '12,900', period: 'FCFA/mois', description: 'Pour les entreprises établies', popular: false },
];
