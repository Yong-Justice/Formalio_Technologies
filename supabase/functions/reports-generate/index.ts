import { createRequestContext, errorResponse, handleOptions, jsonResponse, readJson, requireCompanyAccess, HttpError } from '../_shared/http.ts';

type ReportFormat = 'pdf' | 'xlsx' | 'csv' | 'json';

type ReportRequest = {
  companyId: string;
  type: 'bilan' | 'resultat' | 'cashflow' | 'tva' | 'loan_readiness' | 'dashboard_summary';
  periodStart: string;
  periodEnd: string;
  format?: ReportFormat;
};

type ReportRow = {
  id: string;
  title: string;
  type: string;
  period_start: string;
  period_end: string;
  payload: Record<string, unknown>;
};

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'formalio-report';
}

function escapeCsv(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function money(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0;
}

function flattenReportRows(report: ReportRow, transactions: any[]) {
  const rows: Array<Record<string, unknown>> = [];
  const sections = Array.isArray(report.payload?.sections) ? report.payload.sections as any[] : [];

  for (const section of sections) {
    const lines = Array.isArray(section?.lines) ? section.lines : [];
    for (const line of lines) {
      rows.push({
        section: section?.name ?? 'Section',
        label: line?.label ?? line?.date ?? line?.description ?? 'Line',
        amount: money(line?.amount ?? line?.net ?? 0),
        income: money(line?.income),
        expense: money(line?.expense),
        date: line?.date ?? '',
      });
    }
  }

  for (const transaction of transactions) {
    rows.push({
      section: 'Transactions source',
      label: transaction.description,
      amount: transaction.type === 'income' ? money(transaction.amount) : -money(transaction.amount),
      income: transaction.type === 'income' ? money(transaction.amount) : 0,
      expense: transaction.type === 'expense' ? money(transaction.amount) : 0,
      date: transaction.transaction_date,
      category: transaction.categories?.name ?? transaction.metadata?.category ?? 'Autres',
      reference: transaction.reference_number ?? '',
    });
  }

  return rows;
}

function buildCsv(report: ReportRow, rows: Array<Record<string, unknown>>) {
  const headers = ['section', 'label', 'date', 'category', 'reference', 'income', 'expense', 'amount'];
  return [
    `Formalio,${escapeCsv(report.title)},${escapeCsv(report.period_start)},${escapeCsv(report.period_end)}`,
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ].join('\n');
}

function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function worksheetXml(rows: Array<Record<string, unknown>>) {
  const headers = ['section', 'label', 'date', 'category', 'reference', 'income', 'expense', 'amount'];
  const sheetRows = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, index) => {
      const col = String.fromCharCode(65 + index);
      const numeric = typeof cell === 'number' && Number.isFinite(cell);
      return `<c r="${col}${rowIndex + 1}" t="${numeric ? 'n' : 'inlineStr'}">${numeric ? `<v>${cell}</v>` : `<is><t>${xmlEscape(cell)}</t></is>`}</c>`;
    }).join('')}</row>`).join('\n')}
  </sheetData>
</worksheet>`;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pushU16(parts: number[], value: number) {
  parts.push(value & 0xff, (value >>> 8) & 0xff);
}

function pushU32(parts: number[], value: number) {
  parts.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function buildZip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const fileParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local: number[] = [];
    pushU32(local, 0x04034b50);
    pushU16(local, 20);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU32(local, crc);
    pushU32(local, data.length);
    pushU32(local, data.length);
    pushU16(local, nameBytes.length);
    pushU16(local, 0);
    fileParts.push(new Uint8Array(local), nameBytes, data);

    const central: number[] = [];
    pushU32(central, 0x02014b50);
    pushU16(central, 20);
    pushU16(central, 20);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU32(central, crc);
    pushU32(central, data.length);
    pushU32(central, data.length);
    pushU16(central, nameBytes.length);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU32(central, 0);
    pushU32(central, offset);
    centralParts.push(new Uint8Array(central), nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end: number[] = [];
  pushU32(end, 0x06054b50);
  pushU16(end, 0);
  pushU16(end, 0);
  pushU16(end, Object.keys(files).length);
  pushU16(end, Object.keys(files).length);
  pushU32(end, centralSize);
  pushU32(end, offset);
  pushU16(end, 0);

  return concatBytes([...fileParts, ...centralParts, new Uint8Array(end)]);
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function buildXlsx(report: ReportRow, rows: Array<Record<string, unknown>>) {
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(report.title).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': worksheetXml(rows),
  };
  return bytesToBase64(buildZip(files));
}

function buildPdf(report: ReportRow, rows: Array<Record<string, unknown>>) {
  const textRows = [
    'Formalio',
    report.title,
    `Periode: ${report.period_start} - ${report.period_end}`,
    '',
    ...rows.slice(0, 32).map((row) => `${row.section ?? ''} | ${row.label ?? ''} | ${money(row.amount)} XAF`),
  ];
  const streamText = textRows
    .map((line, index) => `BT /F1 9 Tf 40 ${780 - index * 18} Td (${String(line).replace(/[()\\]/g, '\\$&')}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return bytesToBase64(new TextEncoder().encode(pdf));
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    if (req.method !== 'POST') throw new Error('POST is required.');
    const { user, userClient, adminClient } = await createRequestContext(req);
    const body = await readJson<ReportRequest>(req);
    const format = body.format ?? 'pdf';

    if (!body.companyId || !body.type || !body.periodStart || !body.periodEnd) {
      throw new HttpError(400, 'companyId, type, periodStart, and periodEnd are required.');
    }

    await requireCompanyAccess(adminClient, user.id, body.companyId, ['owner', 'admin', 'accountant']);

    const { data: transactions, error: transactionError } = await userClient
      .from('transactions')
      .select('id,type,amount,description,transaction_date,reference_number,metadata,categories(name)')
      .eq('company_id', body.companyId)
      .is('deleted_at', null)
      .in('status', ['completed', 'reconciled'])
      .gte('transaction_date', body.periodStart)
      .lte('transaction_date', body.periodEnd)
      .order('transaction_date', { ascending: true });
    if (transactionError) throw transactionError;
    if (!transactions?.length) {
      throw new HttpError(422, 'Insufficient financial data to generate this report.', {
        required: ['At least one completed transaction in the selected period', 'Revenue/expense data for accounting sections'],
      });
    }

    const { data, error } = await userClient.rpc('generate_report', {
      p_company_id: body.companyId,
      p_report_type: body.type,
      p_period_start: body.periodStart,
      p_period_end: body.periodEnd,
    });
    if (error) throw error;

    const report = data as ReportRow;
    const rows = flattenReportRows(report, transactions ?? []);
    const baseName = `${sanitizeFileName(report.title)}-${report.period_start}-${report.period_end}`;
    let fileName = `${baseName}.pdf`;
    let mimeType = 'application/pdf';
    let encoding: 'base64' | 'utf-8' = 'base64';
    let content = buildPdf(report, rows);

    if (format === 'csv') {
      fileName = `${baseName}.csv`;
      mimeType = 'text/csv;charset=utf-8';
      encoding = 'utf-8';
      content = buildCsv(report, rows);
    } else if (format === 'xlsx') {
      fileName = `${baseName}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      content = buildXlsx(report, rows);
    } else if (format === 'json') {
      fileName = `${baseName}.json`;
      mimeType = 'application/json;charset=utf-8';
      encoding = 'utf-8';
      content = JSON.stringify({ report, rows }, null, 2);
    }

    return jsonResponse({
      report,
      export: {
        reportId: report.id,
        title: report.title,
        type: report.type,
        format,
        fileName,
        mimeType,
        encoding,
        content,
        size: encoding === 'base64' ? Math.round((content.length * 3) / 4) : content.length,
      },
    }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
