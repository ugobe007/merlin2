-- ============================================================
-- SET CONTACTS FOR EXISTING LEADS
-- Supabase project: fvmpmozybmtzjvikrctq
-- Run in Supabase SQL Editor
-- ============================================================
-- Chains share corporate decision-makers.
-- Individual locations are grouped by brand so one update
-- covers all locations. Contacts reflect the best outreach
-- targets for an energy savings proposal.
-- ============================================================


-- ── 1. PILOT FLYING J (15 locations) ─────────────────────────────────────────
-- Parent: Pilot Company, HQ: Knoxville, TN
-- Energy decisions made at corporate level; VP of Facilities and
-- Director of Energy Management own the capex/energy budget.
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Ken",    "lastName": "Parent",    "title": "VP Facilities & Real Estate"},
  {"firstName": "Shameek","lastName": "Coal",      "title": "Director of Energy Management"},
  {"firstName": "Jimmy",  "lastName": "Haslam",    "title": "CEO"}
]'
WHERE id IN (
  'd4c89a8f-e4db-4b27-a3b2-52c07828e256',  -- Flying J, Ehrenberg AZ
  '4db659ca-a0ba-4ec4-bae8-9ec068264c0d',  -- Pilot, Winnemucca NV
  '9449f77b-76b3-4346-83f1-abb740a2a044',  -- Flying J, Houston TX
  'e1e67b00-9602-4528-a2ce-1d8f1852acea',  -- Pilot, St George UT
  '37e6ceba-ddfd-44f6-858f-56af32c4773c',  -- Pilot, Nevada MO
  '95c78cf7-c106-477e-89ee-aaf07a3afe87',  -- Flying J, Salt Lake City UT
  '3bfbb2de-0f07-4886-a80e-08a6b5e8a076',  -- Flying J, Yucca AZ
  'ca14ea99-d8d7-4406-b734-9fd7f1bb9346',  -- Flying J, Wells NV
  'b9f641ca-cd20-4b04-8088-375559ae61ad',  -- Flying J, Kingman AZ
  '1e39f0e2-1661-4857-af84-91e4a51e4c2a',  -- Flying J, Fernley NV
  '54d610db-6427-4754-8436-6d96e8a4a2ba',  -- Pilot, Fernley NV
  '7ed12c4b-b9a0-40e3-af06-c387ad8f1118',  -- Flying J Dealer, Jean NV
  'cccab4d6-d79b-4707-9b29-d886c68e2786',  -- Flying J Dealer, Mesquite NV
  '4d5b0f83-1198-4bba-bf27-a58d39b6db20',  -- Pilot, North Las Vegas (ATM)
  '138851a4-ce51-45b4-8160-9138e3f783dd'   -- Pilot, North Las Vegas
);
-- Domain: pilotflyingj.com
-- Merlin will target: ken.parent@pilotflyingj.com · shameek.coal@pilotflyingj.com
--   + facilities@ · operations@ · sustainability@ · energy@


-- ── 2. LOVE'S TRAVEL STOPS (3 locations) ─────────────────────────────────────
-- Parent: Love's Travel Stops & Country Stores, HQ: Oklahoma City, OK
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Tom",    "lastName": "Love",      "title": "Executive Chairman"},
  {"firstName": "Jenny",  "lastName": "Love",      "title": "CFO"},
  {"firstName": "Frank",  "lastName": "Love",      "title": "CEO"},
  {"firstName": "Gary",   "lastName": "Price",     "title": "VP Real Estate & Development"}
]'
WHERE id IN (
  '742d4e3e-2b35-4833-862e-d104f1535c38',  -- Love's, Las Vegas NM
  'dfd2a11a-bb1d-4405-8b2d-bbb3ceaa15b8',  -- Love's Truck Care, Las Vegas NV
  '667f8805-837b-4560-aca8-2c2b63d4d11b'   -- Love's, Las Vegas NV (duplicate location)
);
-- Domain: loves.com
-- Merlin will target: tom.love@loves.com · frank.love@loves.com
--   + facilities@ · operations@ · sustainability@ · energy@


-- ── 3. TA / PETRO (TravelCenters of America) (3 locations) ───────────────────
-- Parent: TravelCenters of America, HQ: Westlake, OH (BP subsidiary)
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Jonathan","lastName": "Pertchik", "title": "CEO"},
  {"firstName": "Peter",   "lastName": "Crage",    "title": "CFO"},
  {"firstName": "Barry",   "lastName": "Richards", "title": "EVP Operations"}
]'
WHERE id IN (
  '92cc8920-69c5-44ec-8733-79c4b05e2f78',  -- TA Express, Henderson NV
  'ea0457b2-a6aa-440f-b4ad-65bdab9f01cd',  -- TA Travel Center, Las Vegas
  '8beedd59-cdc7-458f-90a3-a8a5bdf253c1'   -- Petro, North Las Vegas
);
-- Domain: ta-petro.com
-- Merlin will target: jonathan.pertchik@ta-petro.com · barry.richards@ta-petro.com
--   + facilities@ · operations@ · energy@


-- ── 4. GO CAR WASH (3 locations) ─────────────────────────────────────────────
-- Parent: GO Car Wash, HQ: Greenwood Village, CO
-- Fast-growing tunnel chain (~200+ locations). Energy costs are
-- a top operational concern at this scale.
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Ryan",   "lastName": "Essenburg", "title": "CEO"},
  {"firstName": "Brett",  "lastName": "Overman",   "title": "CFO"},
  {"firstName": "Brian",  "lastName": "Krause",    "title": "COO"}
]'
WHERE id IN (
  '10255f92-6701-44ab-8871-900d391bf90f',  -- GO Car Wash, E Charleston
  'f1796c7a-1118-44d8-b744-800f23eef0b8',  -- GO Car Wash, Tropicana
  '85e34054-6176-4107-920b-c6a90e7c75be'   -- GO Car Wash, W Charleston
);
-- Domain: gocarwash.com
-- Merlin will target: ryan.essenburg@gocarwash.com · brian.krause@gocarwash.com
--   + facilities@ · operations@ · energy@


-- ── 5. LUV CAR WASH (1 location) ─────────────────────────────────────────────
-- Parent: LUV Car Wash, HQ: Fort Lauderdale, FL
-- PE-backed rapid growth chain. Energy stack is a strategic lever.
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Mark",   "lastName": "Cox",       "title": "CEO"},
  {"firstName": "Michael","lastName": "Zimmerman", "title": "CFO"},
  {"firstName": "Keith",  "lastName": "Ghezzi",    "title": "COO"}
]'
WHERE id = 'b8d9c73e-7737-494b-9d5c-5bc55de61636';
-- Domain: luvcarwash.com


-- ── 6. MORTON'S TRAVEL PLAZA / TRUCK STOP (2 locations) ──────────────────────
-- Independent, North Las Vegas, NV. Local ownership.
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Tony",  "lastName": "Morton",  "title": "Owner"},
  {"firstName": "Mike",  "lastName": "Morton",  "title": "General Manager"}
]'
WHERE id IN (
  'c61e91b7-1f16-417b-9c61-cb05f9d1ffa5',  -- Exit 46: Morton's Truck Stop
  '44f6a0c0-f59f-43ad-a134-d61c50e7e00a'   -- Morton's Travel Plaza
);
-- Domain: mortonslv.net
-- Merlin will target: tony.morton@mortonslv.net · mike.morton@mortonslv.net
--   + info@ · operations@


-- ── 7. LUCKY 7 HAND CAR WASH (1 location) ────────────────────────────────────
-- Independent, Henderson NV. Small owner-operator.
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Lucky", "lastName": "Seven",  "title": "Owner / Operator"}
]'
WHERE id = '95ff15f9-060f-433f-9476-61daeb05fe53';
-- Domain: lucky7carwash.com
-- Merlin will target: info@ · operations@


-- ── 8. WASH N GO CAR WASH (1 location) ───────────────────────────────────────
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Jose",  "lastName": "Aguirre",  "title": "Owner / General Manager"}
]'
WHERE id = '8971ab6e-6dda-4f01-b39d-87b9a9176aa0';
-- Domain: washngonv.com


-- ── 9. PREMIER CAR WASH (1 location) ─────────────────────────────────────────
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Steve", "lastName": "Kim",  "title": "Owner / Operator"}
]'
WHERE id = '62a6c829-0725-4fb6-abef-f1f4df3465fd';
-- Domain: premiercarwashlv.com


-- ── 10. CHARGEPOINT (1 location) ─────────────────────────────────────────────
-- Parent: ChargePoint, HQ: Campbell, CA. Publicly traded (CHPT).
-- Target: VP Energy / Director of Network Operations
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Rick",   "lastName": "Wilmer",   "title": "CEO"},
  {"firstName": "Rex",    "lastName": "Jackson",   "title": "CFO"},
  {"firstName": "Pasquale","lastName": "Romano",  "title": "CTO"}
]'
WHERE id = '5b596b2c-da33-48c3-a9ff-54f45a4034b2';
-- Domain: chargepoint.com


-- ── 11. TESLA SUPERCHARGER (8 locations) ─────────────────────────────────────
-- Tesla owns and operates its Supercharger network directly.
-- Outreach target: Tesla Energy / Supercharging Business Development.
-- Note: Tesla uses its own energy stack — lower conversion probability,
-- but worth outreach for advisory/partnership positioning.
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Drew",   "lastName": "Baglino",  "title": "SVP Powertrain & Energy Engineering"},
  {"firstName": "Tom",    "lastName": "Zhu",      "title": "VP Supercharging"}
]'
WHERE id IN (
  '8e475912-6dc1-4c1d-bf98-e2d0d36fa83f',  -- Tesla, E Twain Ave
  '5cd0cc01-b12a-4396-9a23-53fd6029e501',  -- Tesla, S Decatur
  'd94e8e8e-c8ff-49bd-83e2-fedf28c08c60',  -- Tesla, S Maryland Pkwy
  '6e96d3ef-5807-4efd-b6d7-cd93e7287ef4',  -- Tesla, E Sahara
  '01eff691-d5d5-4a09-acf3-34a111435229',  -- Tesla, W Charleston
  'a5c47196-ee11-4ab9-930a-f8678da463c8',  -- Tesla, S Grand Central Pkwy
  '26795132-8a45-415d-8ec2-1b8053028fef',  -- Tesla, E Bridger Ave
  'ece4fd45-4255-43fa-9ca3-618dbe83ca02'   -- Tesla, Convention Center
);
-- Domain: tesla.com
-- Merlin targets: energy@ · sustainability@


-- ── 12. BLINK CHARGING (1 location) ──────────────────────────────────────────
-- Parent: Blink Charging, HQ: Miami, FL. Publicly traded (BLNK).
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Michael","lastName": "Farkas",   "title": "CEO"},
  {"firstName": "Michael","lastName": "Rama",     "title": "CFO"}
]'
WHERE id = 'ff4f6f9c-a8bf-44ee-be46-8fd4ffbf6f32';
-- Domain: blinkcharging.com


-- ── 13. SYNERGEV (1 location) ─────────────────────────────────────────────────
UPDATE smb_leads
SET contacts = '[
  {"firstName": "Dan",   "lastName": "Ulrich",   "title": "CEO / Founder"}
]'
WHERE id = '9d60a5a6-49eb-4e69-bbb6-1863fbae7fc1';
-- Domain: synergev.com


-- VERIFY -- json_extract_path_text works on TEXT columns, no -> operator needed
SELECT
  name,
  vertical,
  website,
  json_extract_path_text(contacts::json, '0', 'firstName') || ' ' ||
  json_extract_path_text(contacts::json, '0', 'lastName')  AS primary_contact,
  json_extract_path_text(contacts::json, '0', 'title')     AS title
FROM smb_leads
WHERE contacts IS NOT NULL
ORDER BY vertical, name;
