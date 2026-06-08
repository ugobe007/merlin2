import express from 'express';
import { createWorkflowProject } from './partner-api.js';

const router = express.Router();

function deriveGoals(input) {
  const goals = Array.isArray(input.goals) ? input.goals : [];
  const selectedAddOns = input.selectedAddOns || {};

  if (selectedAddOns.solar) goals.push('solar');
  if (selectedAddOns.storage) goals.push('battery-storage');
  if (selectedAddOns.generator) goals.push('backup-power');
  if (selectedAddOns.evCharging) goals.push('ev-charging');

  return [...new Set(goals.filter(Boolean))].slice(0, 8);
}

router.post('/workflow-project', async (req, res) => {
  try {
    const input = req.body || {};
    const { project, storage, warning } = await createWorkflowProject(
      {
        source: 'merlin-wizard-v8',
        industry: input.industry,
        facility: input.facility,
        contact: input.contact,
        goals: deriveGoals(input),
        quoteId: input.quoteId || null,
      },
      { partnerId: 'merlin-wizard-v8' }
    );

    res.status(201).json({
      projectId: project.projectId,
      status: project.status,
      storage,
      warning,
      workflowSummary: project.workflowSummary,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || 'Workflow project creation failed',
      details: error.details,
    });
  }
});

export default router;
