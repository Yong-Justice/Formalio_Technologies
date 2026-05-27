import type { FicheData, FicheResult, ServiceEntry, StockEntry } from '../types/fiche.types';

export function calculateFiche(data: Partial<FicheData>): FicheResult {
  const revenusStock = (data.stockItems || []).reduce((total, item) => {
    const totalEntrees = (item.entrees || []).reduce((sum, e) => sum + e.quantite, 0);
    const venduTheorique =
      (item.quantiteOuverture || 0) +
      totalEntrees -
      (item.quantiteFermeture || 0);
    const montant = Math.max(0, venduTheorique) * (item.prixUnitaire || 0);
    return total + montant;
  }, 0);

  const revenusServices = (data.serviceItems || []).reduce((total, item) => {
    return total + (item.nombreRealise || 0) * (item.prixUnitaire || 0);
  }, 0);

  const totalRevenusTheoriques = revenusStock + revenusServices;
  const totalDepenses = (data.expenses || []).reduce((total, expense) => {
    return total + (expense.montant || 0);
  }, 0);
  const caisseAttendue = totalRevenusTheoriques - totalDepenses;
  const caisseReelle = data.caisseReelle || 0;
  const ecart = caisseReelle - caisseAttendue;
  const ecartPercentage = caisseAttendue > 0
    ? Math.abs(ecart / caisseAttendue) * 100
    : 0;

  let ecartLevel: FicheResult['ecartLevel'];
  let message: string;
  let recommendation: string;

  if (ecart === 0) {
    ecartLevel = 'ok';
    message = '✅ Caisse parfaite! Aucun ecart detecte.';
    recommendation = 'Excellent travail. Continuez ce rythme.';
  } else if (ecart > 0) {
    ecartLevel = 'ok';
    message = `✅ Surplus de ${formatFCFA(ecart)} FCFA`;
    recommendation =
      "Vous avez plus d'argent qu'attendu. Verifiez si un paiement a ete enregistre deux fois ou si un article a ete vendu a un prix plus eleve.";
  } else if (ecartPercentage <= 2) {
    ecartLevel = 'warning';
    message = `⚠️ Leger deficit de ${formatFCFA(Math.abs(ecart))} FCFA`;
    recommendation =
      'Ecart mineur (moins de 2%). Probablement une petite erreur de comptage. Recomptez votre caisse.';
  } else if (ecartPercentage <= 5) {
    ecartLevel = 'danger';
    message = `⚠️ Deficit de ${formatFCFA(Math.abs(ecart))} FCFA`;
    recommendation =
      'Ecart significatif. Causes possibles: articles offerts, erreur de prix, credit client non note. Ajoutez une justification.';
  } else {
    ecartLevel = 'critical';
    message = `🚨 Deficit critique: ${formatFCFA(Math.abs(ecart))} FCFA`;
    recommendation =
      'Ecart superieur a 5%. Verification urgente necessaire. Comparez avec les jours precedents.';
  }

  return {
    totalRevenusTheoriques,
    totalDepenses,
    caisseAttendue,
    caisseReelle,
    ecart,
    ecartPercentage,
    ecartLevel,
    message,
    recommendation,
  };
}

export function calculateStockRow(item: Partial<StockEntry>): {
  totalEntrees: number;
  venduTheorique: number;
  montantTheorique: number;
} {
  const totalEntrees = (item.entrees || []).reduce((sum, e) => sum + (e.quantite || 0), 0);
  const venduTheorique = Math.max(
    0,
    (item.quantiteOuverture || 0) +
      totalEntrees -
      (item.quantiteFermeture || 0),
  );
  const montantTheorique = venduTheorique * (item.prixUnitaire || 0);
  return { totalEntrees, venduTheorique, montantTheorique };
}

export function calculateServiceRow(item: Partial<ServiceEntry>) {
  return (item.nombreRealise || 0) * (item.prixUnitaire || 0);
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount));
}
