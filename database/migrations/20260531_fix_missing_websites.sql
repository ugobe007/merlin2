-- ============================================================
-- FIX MISSING WEBSITES FOR 3 LEADS
-- Supabase project: fvmpmozybmtzjvikrctq
-- Run in Supabase SQL Editor
-- ============================================================


-- ── 1. EV CONNECT ────────────────────────────────────────────────────────────
-- id: d74c5638-81a4-43af-b379-adcdf6ea6bd8
-- website already set from prior run. This is a safe no-op confirm.
UPDATE smb_leads
SET website = 'https://www.evconnect.com/'
WHERE id = 'd74c5638-81a4-43af-b379-adcdf6ea6bd8'
  AND website IS NULL;


-- ── 2. LAS VEGAS HAND CAR WASH ───────────────────────────────────────────────
-- Independent owner-operator. No website, no verified email.
-- NULL out the guessed contact_email so this lead is skipped by
-- resolveOutreachEmails() and excluded from all automated sends.
-- Flag for manual phone outreach instead.
UPDATE smb_leads
SET contact_email = NULL
WHERE id = 'ffdf6487-2aff-43e4-ab03-e807247e901b';


-- ── 3. FLAMINGO HAND CAR WASH ────────────────────────────────────────────────
-- Same as above — NULL the guessed email, exclude from automated sends.
UPDATE smb_leads
SET contact_email = NULL
WHERE id = 'e22dd99b-347f-484f-b41d-de6e48c1b5fc';


-- ── VERIFY ───────────────────────────────────────────────────────────────────
SELECT
  id,
  name,
  vertical,
  website,
  contact_email
FROM smb_leads
WHERE name ILIKE '%EV Connect%'
   OR name ILIKE '%Las Vegas Hand%'
   OR name ILIKE '%Flamingo Hand%'
ORDER BY name;
