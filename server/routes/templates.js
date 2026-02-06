/**
 * TEMPLATE ENDPOINT — 410 GONE (Client-Canonical)
 * ================================================
 *
 * As of Feb 6, 2026, templates are CLIENT-CANONICAL:
 *   src/wizard/v7/templates/*.json   (the one true registry)
 *   src/wizard/v7/templates/template-manifest.ts  (the one true manifest)
 *
 * This server endpoint previously contained its own inline TEMPLATE_REGISTRY
 * with a DIFFERENT schema (options as {value,label} objects vs flat strings
 * in client JSON). That competing registry was deleted to eliminate drift.
 *
 * If you need server-served templates in the future:
 *   1. Generate them FROM the client JSON (single source)
 *   2. Version and sign them
 *   3. Add a cache layer
 *   4. Keep the manifest as the contract enforcement point
 *
 * DO NOT recreate an inline template registry here.
 */

import express from "express";

const router = express.Router();

// All template endpoints return 410 Gone
router.all("*", (_req, res) => {
  res.status(410).json({
    ok: false,
    reason: "gone",
    message: "Templates are client-canonical. Use local JSON templates from src/wizard/v7/templates/.",
    migration: "Server template registry removed Feb 6, 2026 to eliminate drift. See docs/WIZARD_V7_FILE_MAP.md §3.",
  });
});

export default router;
