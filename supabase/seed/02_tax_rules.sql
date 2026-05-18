-- Cameroon tax rules seed data
INSERT INTO tax_rules (id, name, rate, description, is_active) VALUES
  (gen_random_uuid(), 'TVA Standard', 19.25, 'Taxe sur la valeur ajoutée - taux standard (Cameroun)', true),
  (gen_random_uuid(), 'TVA Réduit', 9.0, 'TVA taux réduit pour certains biens de première nécessité', true),
  (gen_random_uuid(), 'Exonéré', 0.0, 'Opérations exonérées de TVA', true),
  (gen_random_uuid(), 'IS - Impôt sur les Sociétés', 30.0, 'Taux standard IS Cameroun', true),
  (gen_random_uuid(), 'IRPP', 38.5, 'Impôt sur le Revenu des Personnes Physiques - tranche haute', true)
ON CONFLICT DO NOTHING;
