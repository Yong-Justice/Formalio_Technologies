import { en } from './en';
import { fr } from './fr';

export type SupportedLanguage = 'en' | 'fr';

export const translations = { en, fr } as const;

type TranslationTree = Record<string, unknown>;

const windows1252ReverseMap: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

const mojibakePattern = /[\u00c2\u00c3\u00c5\u00e2\u00f0][\u0080-\u00ff\u0152-\u0178\u017d-\u017e\u0192\u02c6\u02dc\u2018-\u201e\u2020-\u2026\u2030-\u203a\u20ac\u2122]+/g;

function encodeWindows1252(value: string) {
  const bytes: number[] = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint == null) return null;
    if (codePoint <= 0xff) bytes.push(codePoint);
    else if (windows1252ReverseMap[codePoint] != null) bytes.push(windows1252ReverseMap[codePoint]);
    else return null;
  }
  return bytes;
}

function decodeUtf8(bytes: number[]) {
  let output = '';
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index];
    if (first < 0x80) {
      output += String.fromCharCode(first);
      index += 1;
      continue;
    }

    let needed = 0;
    let codePoint = 0;
    let minimum = 0;
    if ((first & 0xe0) === 0xc0) {
      needed = 1;
      codePoint = first & 0x1f;
      minimum = 0x80;
    } else if ((first & 0xf0) === 0xe0) {
      needed = 2;
      codePoint = first & 0x0f;
      minimum = 0x800;
    } else if ((first & 0xf8) === 0xf0) {
      needed = 3;
      codePoint = first & 0x07;
      minimum = 0x10000;
    } else {
      return null;
    }

    if (index + needed >= bytes.length) return null;
    for (let offset = 1; offset <= needed; offset += 1) {
      const next = bytes[index + offset];
      if ((next & 0xc0) !== 0x80) return null;
      codePoint = (codePoint << 6) | (next & 0x3f);
    }
    if (codePoint < minimum || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return null;
    output += String.fromCodePoint(codePoint);
    index += needed + 1;
  }
  return output;
}

function repairMojibakeChunk(chunk: string) {
  const bytes = encodeWindows1252(chunk);
  if (!bytes) return chunk;
  return decodeUtf8(bytes) ?? chunk;
}

export function repairMojibakeText(value: string) {
  let output = value;
  for (let pass = 0; pass < 4; pass += 1) {
    const next = output.replace(mojibakePattern, repairMojibakeChunk);
    if (next === output) break;
    output = next;
  }
  return output.replace(/\u2022{4,}/g, (match) => '*'.repeat(match.length)).normalize('NFC');
}

const englishRuntimeText: Record<string, string> = {
  Accueil: 'Home',
  Activité: 'Activity',
  Rapports: 'Reports',
  Profil: 'Profile',
  Paramètres: 'Settings',
  Sécurité: 'Security',
  Abonnement: 'Subscription',
  'Aide & Support': 'Help & Support',
  Déconnexion: 'Log out',
  Notifications: 'Notifications',
  Revenus: 'Revenue',
  Dépenses: 'Expenses',
  Trésorerie: 'Cash Flow',
  'Flux de trésorerie': 'Cash Flow',
  'Compte de résultat': 'Income Statement',
  'Compte de Résultat': 'Income Statement',
  'Bilan Comptable': 'Balance Sheet',
  'Bilan comptable': 'Balance Sheet',
  'Déclaration TVA': 'VAT Declaration',
  'Santé financière': 'Financial health',
  'Marge nette': 'Net margin',
  'Catégorie': 'Category',
  'Méthode': 'Method',
  'Détails': 'Details',
  'Toutes': 'All',
  'Tous': 'All',
  'Aujourd’hui': 'Today',
  'Cette semaine': 'This week',
  'Ce mois': 'This month',
  'Année': 'Year',
  'Heure': 'Time',
  'Statut': 'Status',
  'Rechercher...': 'Search...',
  'Réinitialiser': 'Reset',
  'No results found': 'No results found',
  'Aucune transaction': 'No transactions',
  'Mise à jour instantanée': 'Instant update',
  'Essayez un autre mot-clé, une autre date ou une catégorie différente.': 'Try another keyword, date, or category.',
  'Ajoutez votre première transaction': 'Add your first transaction',
  'Clear search and filters': 'Clear search and filters',
  'Bon retour ! 👋': 'Welcome back! 👋',
  'Bonjour 👋': 'Hello 👋',
  'Connectez-vous à votre compte': 'Sign in to your account',
  'Créer un compte': 'Create account',
  'Créer mon compte': 'Create my account',
  'Créer votre compte': 'Create your account',
  'Mot de passe': 'Password',
  'Mot de passe oublié ?': 'Forgot password?',
  'Confirmer le mot de passe': 'Confirm password',
  'Email ou téléphone': 'Email or phone',
  'Numéro de téléphone': 'Phone number',
  'Nom de la boutique': 'Store name',
  'Nom complet du propriétaire': 'Owner full name',
  'Adresse email': 'Email address',
  'Localisation / adresse': 'Location / address',
  'Enregistrer': 'Save',
  'Annuler': 'Cancel',
  'Modifier': 'Edit',
  'Terminé': 'Done',
  'Réessayer': 'Retry',
  'Chargement...': 'Loading...',
  'Réessayer plus tard': 'Retry later',
  'Aucun résultat': 'No results found',
  'Effacer recherche et filtres': 'Clear search and filters',
  'Relancer le scan': 'Retry scan',
  'Saisie manuelle': 'Manual entry',
  'Demander un prêt': 'Request Loan',
  'Envoi de la demande...': 'Submitting request...',
  'Envoyer la demande de prêt': 'Submit loan request',
  'Révision et envoi': 'Review & Submit',
  'Vérifiez le dossier préparé avant de le soumettre.': 'Review the prepared dossier before submitting it.',
  'Envoi...': 'Sending...',
  'Soumettre la vérification': 'Submit verification',
  'Vérifié': 'Verified',
  'Email vérifié': 'Email verified',
  'Vos emails de récupération et de sécurité sont actifs.': 'Your recovery and security emails are active.',
  'Code envoyé': 'Code sent',
  'Email de vérification envoyé': 'Verification email sent',
  'Entrez le code reçu ou ouvrez le lien dans votre boîte mail.': 'Enter the code you received, or open the link in your inbox.',
  'En file': 'Queued',
  'Vérification en attente': 'Verification queued',
  'Le service email gratuit est occupé. Formalio vous laissera réessayer bientôt.': 'The free email sender is busy. Formalio will let you retry soon.',
  'Vérification différée': 'Verification deferred',
  'Vous pouvez continuer à utiliser Formalio. Réessayez l’envoi dans quelques instants.': 'You can continue using Formalio. Try sending the email again shortly.',
  'Non vérifié': 'Not verified',
  'Vérifiez votre email': 'Verify your email',
  'Vous pouvez utiliser Formalio maintenant. La vérification améliore la récupération et la confiance du compte.': 'You can use Formalio now. Verification improves recovery and account trust.',
  'Envoyer l’email': 'Send email',
  'Synchronisation cloud Formalio...': 'Syncing Formalio cloud...',
  'Sync cloud en attente': 'Cloud sync pending',
  'Sync cloud a verifier': 'Cloud sync needs review',
  'Sync cloud à vérifier': 'Cloud sync needs review',
  'Formalio reessaiera automatiquement.': 'Formalio will retry automatically.',
  'Formalio réessaiera automatiquement.': 'Formalio will retry automatically.',
  'Dernière sync': 'Last sync',
  'Transaction enregistrée !': 'Transaction saved!',
  'Ticket détecté': 'Ticket detected',
  'Ticket scanné': 'Ticket scanned',
  'Scanner ticket, document ou reçu': 'Scan ticket, document, or receipt',
  'Enregistrer la dépense': 'Save expense',
  'Enregistrer le revenu': 'Save revenue',
  'Sortie de trésorerie': 'Cash outflow',
  'Entrée de trésorerie': 'Cash inflow',
  'Appuyez pour parler': 'Tap to speak',
  'Écoute en cours...': 'Listening...',
  'Transcription': 'Transcript',
  'Transaction reconnue !': 'Transaction recognized!',
  'Vérifiez et confirmez': 'Review and confirm',
  'Arrêter': 'Stop',
  'Préparation du fichier...': 'Preparing file...',
  'Téléchargement...': 'Downloading...',
  'Téléchargé avec succès !': 'Downloaded successfully!',
  'Votre rapport est prêt à être consulté': 'Your report is ready to view',
  'Aperçu': 'Preview',
  'Partager': 'Share',
  'Nouveau format': 'New format',
  'Rapports prêts': 'Reports ready',
  'Conformité': 'Compliance',
  'Synthèse comptable Mosika': 'Mosika accounting summary',
  'Ajoutez des transactions réelles': 'Add real transactions',
  'Complétez la vérification du profil': 'Complete profile verification',
  'Ajoutez au moins 3 transactions réelles': 'Add at least 3 real transactions',
  'Ajoutez un revenu et une dépense': 'Add one revenue and one expense',
  'À surveiller': 'Needs attention',
  Rentable: 'Profitable',
  'Fichier réel généré depuis vos données': 'Real file generated from your data',
  'Ajoutez des transactions avant de générer le rapport.': 'Add transactions before generating the report.',
  'Vérification email': 'Email verification',
  'Vérification...': 'Verifying...',
  'Vérifier le code': 'Verify code',
  'Vérifier': 'Verify',
  'Vérification envoyée': 'Verification sent',
  'Vérification enregistrée': 'Verification saved',
  'Réessayez plus tard.': 'Try again later.',
  'Vérification KYC': 'KYC Verification',
  'Vérification d’identité': 'Identity Verification',
  'Confirmez le document officiel qui servira de référence au compte.': 'Confirm the official document type that will anchor this account.',
  'Vérification selfie': 'Selfie Verification',
  'Un aperçu selfie sera comparé au document d’identité.': 'A live selfie preview will be matched with the identity document.',
  'Vérification entreprise': 'Business Verification',
  'Ajoutez les références d’enregistrement pour les futurs contrôles de conformité.': 'Add registration references for future compliance checks.',
  'Vérification adresse': 'Address Verification',
  'Confirmez l’adresse professionnelle et joignez un justificatif.': 'Confirm business location and attach proof of address.',
  'En attente': 'Pending',
  'Démarrez ou continuez le parcours KYC pour soumettre votre profil.': 'Start or continue the KYC flow to submit your profile.',
  'Approuvé': 'Approved',
  'Compte vérifié': 'Verified account',
  'L’identité et les informations entreprise sont marquées comme approuvées.': 'Identity and business information are marked as approved.',
  'Voir mes dépenses': 'Show my expenses',
  'Quel profit ai-je réalisé ?': 'How much profit did I make?',
  'Analyser mon activité': 'Analyze my business',
  'Vérifier mon éligibilité': 'Check loan eligibility',
  'Télécharger le rapport mensuel': 'Download monthly report',
  'Résumer les rapports': 'Summarize reports',
  'Retrouver le rapport TVA': 'Retrieve tax report',
  'Créer un rappel facture': 'Create invoice reminder',
  'Voir le risque de trésorerie': 'Show cash flow risk',
  'Exporter les créances': 'Export receivables',
  'Rechercher dans l’historique': 'Search transaction history',
  'Expliquer les métriques comptables': 'Explain accounting metrics',
  'Ouvrir le suivi du prêt': 'Open loan tracker',
  'Améliorer mon score': 'Improve my score',
  'Analyser le risque de remboursement': 'Analyze repayment risk',
  'Créer une alerte dépenses': 'Set expense alert',
  'Voir la tendance des dépenses': 'Show spending trend',
  'Résumer les transactions du jour': 'Summarize today’s transactions',
  Télécharger: 'Download',
  Soumise: 'Submitted',
  'En revue': 'Under Review',
  'Documents requis': 'Pending Documents',
  Approuvée: 'Approved',
  Rejetée: 'Rejected',
  Décaissée: 'Disbursed',
  'Temps de revue': 'Review time',
  estimé: 'estimated',
  Identité: 'Identity',
  Personnel: 'Personal',
  'Carte ID': 'ID card',
  Entreprise: 'Business',
  Adresse: 'Address',
  Révision: 'Review',
  'En cours de revue': 'Under review',
  'La conformité Formalio examine le dossier préparé.': 'Formalio compliance is reviewing the prepared dossier.',
};

const englishRuntimePatterns: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^(\d+) résultat(s?)$/, (match) => `${match[1]} result${match[2] ? 's' : ''}`],
  [/^Derniere sync: (.+)\.$/, (match) => `Last sync: ${match[1]}.`],
  [/^Dernière sync: (.+)\.$/, (match) => `Last sync: ${match[1]}.`],
  [/^Réessayer (\d+)s$/, (match) => `Retry ${match[1]}s`],
  [/^Revue (.+)$/, (match) => `Review ${match[1]}`],
  [/^Soumise (.+)$/, (match) => `Submitted ${match[1]}`],
  [/^([+-]?\d+(?:[.,]\d+)?)% vs période précédente$/, (match) => `${match[1]}% vs previous period`],
  [/^Marge nette: (.+) · Profitable$/, (match) => `Net margin: ${match[1]} · Profitable`],
  [/^(.+) · SYSCOHADA$/, (match) => `${match[1]} · SYSCOHADA`],
];

export function localizeRuntimeText(language: SupportedLanguage | undefined, value: string) {
  const repaired = repairMojibakeText(value);
  if ((language ?? 'fr') !== 'en') return repaired;

  const leading = repaired.match(/^\s*/)?.[0] ?? '';
  const trailing = repaired.match(/\s*$/)?.[0] ?? '';
  const core = repaired.trim();
  const exact = englishRuntimeText[core];
  if (exact) return `${leading}${exact}${trailing}`;

  for (const [pattern, replacer] of englishRuntimePatterns) {
    const match = core.match(pattern);
    if (match) return `${leading}${replacer(match)}${trailing}`;
  }

  return repaired;
}

export function translate(language: SupportedLanguage | undefined, key: string, fallback?: string) {
  const locale = translations[language ?? 'fr'] ?? translations.fr;
  const fallbackLocale = translations.fr;
  const parts = key.split('.');
  const read = (tree: TranslationTree) => parts.reduce<unknown>((value, part) => {
    if (value && typeof value === 'object' && part in value) return (value as Record<string, unknown>)[part];
    return undefined;
  }, tree);
  const value = read(locale as unknown as TranslationTree) ?? read(fallbackLocale as unknown as TranslationTree);
  return repairMojibakeText(typeof value === 'string' ? value : fallback ?? key);
}
