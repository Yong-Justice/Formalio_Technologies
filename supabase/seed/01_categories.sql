-- Document categories seed data
INSERT INTO document_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Invoices', 'invoices', 'Customer and vendor invoices'),
  (gen_random_uuid(), 'Receipts', 'receipts', 'Payment receipts and confirmations'),
  (gen_random_uuid(), 'Contracts', 'contracts', 'Legal agreements and contracts'),
  (gen_random_uuid(), 'Tax Returns', 'tax-returns', 'Annual and quarterly tax filings'),
  (gen_random_uuid(), 'Financial Statements', 'financial-statements', 'Balance sheets, P&L, cash flow'),
  (gen_random_uuid(), 'Other', 'other', 'Miscellaneous documents')
ON CONFLICT (slug) DO NOTHING;
