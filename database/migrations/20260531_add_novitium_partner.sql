-- ============================================================
-- ADD NOVITIUM ENERGY AS VENDOR/EPC PARTNER LEAD
-- Supabase project: fvmpmozybmtzjvikrctq
-- Run in Supabase SQL Editor
-- ============================================================

INSERT INTO smb_leads (
  name,
  vertical,
  industry,
  source,
  address,
  website,
  contact_email,
  contacts,
  google_rating,
  google_reviews,
  lat,
  lng
)
VALUES (
  'Novitium Energy',
  'energy_project',
  'Commercial Solar EPC / Developer',
  'manual_partner',
  '701 Cooper Road Ste 9, Voorhees, NJ 08043',
  'https://novitiumenergy.com',
  'info@novitiumenergy.com',
  '[{"firstName":"Team","lastName":"","title":"Business Development","email":"info@novitiumenergy.com","phone":"8562735761"}]',
  null,
  null,
  39.8513,
  -74.9613
)
ON CONFLICT (place_id) DO NOTHING;

-- VERIFY
SELECT id, name, vertical, source, website, contact_email
FROM smb_leads
WHERE name = 'Novitium Energy';
