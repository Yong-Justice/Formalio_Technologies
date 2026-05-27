import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FICHE_TEMPLATES } from '@/constants/ficheTemplates';
import type { FicheData, StockEntry } from '@/types/fiche.types';
import { calculateFiche, calculateStockRow, formatFCFA } from '@/utils/ficheCalculator';

type PDFOptions = {
  html: string;
  fileName?: string;
  width?: number;
  height?: number;
  directory?: string;
};

type PDFResult = {
  filePath: string;
};

type NativeShareModule = {
  default: {
    shareSingle: (options: {
      title: string;
      message: string;
      url: string;
      type: string;
      social: string;
    }) => Promise<unknown>;
  };
  Social: {
    Whatsapp: string;
  };
};

function dynamicRequire(moduleName: string): unknown {
  const loader = (globalThis as { require?: (name: string) => unknown }).require
    ?? ((0, eval)('require') as (name: string) => unknown);
  return loader(moduleName);
}

function getPdfGenerator() {
  try {
    return dynamicRequire(['react-native', 'html-to-pdf'].join('-')) as { generatePDF: (options: PDFOptions) => Promise<PDFResult> };
  } catch {
    throw new Error('Le module PDF est installé, mais l’application Android doit être rebuildée pour l’activer.');
  }
}

function getShareModule() {
  try {
    return dynamicRequire(['react-native', 'share'].join('-')) as NativeShareModule;
  } catch {
    throw new Error('Le partage WhatsApp nécessite un rebuild Android avec react-native-share.');
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilePart(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'fiche';
}

function businessLabel(fiche: Partial<FicheData>) {
  return FICHE_TEMPLATES.find((template) => template.type === fiche.ficheType)?.label ?? 'Commerce';
}

function entreeTotal(item: StockEntry) {
  return (item.entrees || []).reduce((sum, entree) => sum + (Number(entree.quantite) || 0), 0);
}

function tableRows(fiche: Partial<FicheData>) {
  const stockRows = (fiche.stockItems || []).map((item) => {
    const calculated = calculateStockRow(item);
    return `
      <tr>
        <td>${escapeHtml(item.productName)}</td>
        <td>${formatFCFA(item.quantiteOuverture || 0)}</td>
        <td>${formatFCFA(entreeTotal(item as StockEntry))}</td>
        <td>${formatFCFA(item.quantiteFermeture || 0)}</td>
        <td>${formatFCFA(calculated.venduTheorique)}</td>
        <td class="num">${formatFCFA(calculated.montantTheorique)}</td>
      </tr>
    `;
  });

  const serviceRows = (fiche.serviceItems || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.serviceName)}</td>
      <td>0</td>
      <td>${formatFCFA(item.nombreRealise || 0)}</td>
      <td>0</td>
      <td>${formatFCFA(item.nombreRealise || 0)}</td>
      <td class="num">${formatFCFA((item.nombreRealise || 0) * (item.prixUnitaire || 0))}</td>
    </tr>
  `);

  return [...stockRows, ...serviceRows].join('');
}

function buildFicheHTML(fiche: Partial<FicheData>, businessName: string) {
  const result = calculateFiche(fiche);
  const deficit = result.ecart < 0;
  const surplus = result.ecart > 0;
  const ecartClass = deficit ? 'deficit' : 'surplus';
  const ecartLabel = result.ecart === 0 ? 'Equilibre' : surplus ? 'Surplus' : 'Deficit';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const expenses = (fiche.expenses || []).map((expense) => `
    <tr>
      <td>${escapeHtml(expense.description || expense.category)}</td>
      <td>${escapeHtml(expense.date)}</td>
      <td class="num deficit">-${formatFCFA(expense.montant || 0)}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 24px; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0F172A; }
          .header { background: #1B5E37; color: #fff; border-radius: 12px; padding: 18px; }
          .brand { display: flex; justify-content: space-between; font-size: 12px; opacity: .88; }
          h1 { margin: 10px 0 6px; font-size: 24px; letter-spacing: 0; }
          h2 { margin: 24px 0 10px; font-size: 15px; color: #1B5E37; }
          .muted { color: #64748B; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #F1F5F9; color: #334155; font-size: 11px; text-align: left; padding: 9px; border-bottom: 1px solid #CBD5E1; }
          td { font-size: 11px; padding: 9px; border-bottom: 1px solid #E2E8F0; }
          tr:nth-child(even) td { background: #F8FAF9; }
          .num { text-align: right; font-weight: 700; }
          .summary { margin-top: 18px; border: 1px solid #D9E5DD; border-radius: 12px; overflow: hidden; }
          .line { display: flex; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; }
          .line:last-child { border-bottom: 0; }
          .strong { font-weight: 800; font-size: 14px; }
          .deficit { color: #DC2626; }
          .surplus { color: #16A34A; }
          .footer { margin-top: 24px; color: #64748B; font-size: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <section class="header">
          <div class="brand"><strong>FORMALIO</strong><span>${escapeHtml(fiche.dateDebut)} au ${escapeHtml(fiche.dateFin)}</span></div>
          <h1>FICHE DE RECONCILIATION</h1>
          <div>${escapeHtml(businessLabel(fiche))} - ${escapeHtml(businessName || 'Entreprise')}</div>
          <div>Periode: ${escapeHtml(fiche.dateDebut)} au ${escapeHtml(fiche.dateFin)}</div>
        </section>

        <h2>ARTICLES / PRODUITS</h2>
        <table>
          <thead>
            <tr><th>Produit</th><th>Debut</th><th>Entrees</th><th>Fin</th><th>Vendus</th><th>Montant</th></tr>
          </thead>
          <tbody>${tableRows(fiche) || '<tr><td colspan="6" class="muted">Aucun article.</td></tr>'}</tbody>
        </table>

        <h2>DEPENSES</h2>
        <table>
          <thead><tr><th>Description</th><th>Date</th><th>Montant</th></tr></thead>
          <tbody>${expenses || '<tr><td colspan="3" class="muted">Aucune depense.</td></tr>'}</tbody>
        </table>

        <h2>RECAPITULATIF</h2>
        <section class="summary">
          <div class="line"><span>Revenus theoriques</span><strong>${formatFCFA(result.totalRevenusTheoriques)} FCFA</strong></div>
          <div class="line"><span>Total depenses</span><strong class="deficit">- ${formatFCFA(result.totalDepenses)} FCFA</strong></div>
          <div class="line strong"><span>Caisse attendue</span><span>${formatFCFA(result.caisseAttendue)} FCFA</span></div>
          <div class="line strong"><span>Caisse reelle</span><span>${formatFCFA(result.caisseReelle)} FCFA</span></div>
          <div class="line strong"><span>ECART - ${ecartLabel}</span><span class="${ecartClass}">${surplus ? '+' : deficit ? '-' : ''}${formatFCFA(Math.abs(result.ecart))} FCFA</span></div>
          ${fiche.ecartJustification ? `<div class="line"><span>Justification</span><strong>${escapeHtml(fiche.ecartJustification)}</strong></div>` : ''}
        </section>

        <div class="footer">Valide le ${new Date(fiche.updatedAt || Date.now()).toLocaleString('fr-FR')} - Formalio v${escapeHtml(appVersion)}<br/>Document genere automatiquement</div>
      </body>
    </html>
  `;
}

export async function generateFichePDF(fiche: Partial<FicheData>, businessName: string): Promise<string> {
  const html = buildFicheHTML(fiche, businessName);
  const fileName = `fiche_${sanitizeFilePart(fiche.dateDebut || 'debut')}_${sanitizeFilePart(fiche.dateFin || 'fin')}`;

  const file = await getPdfGenerator().generatePDF({
    html,
    fileName,
    directory: 'Documents',
    height: 842,
    width: 595,
  });

  if (!file.filePath) {
    throw new Error('PDF generation failed: no file path returned.');
  }

  return file.filePath;
}

export async function shareFicheViaWhatsApp(filePath: string, fiche: Partial<FicheData>): Promise<void> {
  const url = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
  const ShareModule = getShareModule();
  await ShareModule.default.shareSingle({
    title: 'Fiche de Reconciliation - Formalio',
    message:
      `Fiche Formalio\n` +
      `Periode: ${fiche.dateDebut || ''} au ${fiche.dateFin || ''}\n` +
      `Caisse: ${formatFCFA(fiche.caisseReelle || 0)} FCFA\n` +
      `Ecart: ${formatFCFA(fiche.ecart || 0)} FCFA`,
    url,
    type: 'application/pdf',
    social: ShareModule.Social.Whatsapp,
  });
}

export async function shareFichePDF(filePath: string) {
  const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Fiche Formalio' });
    return;
  }

  const target = `${FileSystem.documentDirectory ?? ''}${filePath.split('/').pop() ?? 'fiche.pdf'}`;
  if (target && target !== uri) {
    await FileSystem.copyAsync({ from: uri, to: target }).catch(() => undefined);
  }
}

export { buildFicheHTML };
