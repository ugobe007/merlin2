# Merlin Energy OS API

## Purpose

Merlin should treat the wizard as one customer-facing client, not the core product boundary. The durable product is an external API and workflow layer that can power:

- Public guided wizards.
- Partner embeds and referral flows.
- Internal operator dashboards.
- Customer project workspaces.
- Agent-driven energy project operations.

## Product Boundaries

| Layer          | Role                                    | Examples                                                      |
| -------------- | --------------------------------------- | ------------------------------------------------------------- |
| Wizard         | Guided intake UI                        | Car wash assessment, quick quote, document prompts            |
| Merlin API     | Reusable intelligence engine            | Site lookup, quote generation, lead capture, project creation |
| Workflow layer | Long-running project orchestration      | Tasks, approvals, document status, agent handoffs             |
| Workspace      | Customer/operator collaboration surface | Project brief, blockers, next actions, upload status          |

## Outside-Wizard API Shape

Base path: `/api/partner/v1`

### Existing API surfaces

- `GET /health` — partner/API readiness.
- `GET /industries` — supported verticals and lead values.
- `POST /quotes` — preliminary energy quote from industry, ZIP, peak demand, and bill inputs.
- `POST /leads` — lightweight lead capture.
- `POST /webhooks` — partner webhook registration.

### New workflow surfaces

#### `POST /api/wizard/workflow-project`

Creates a Merlin Energy OS project from the public Merlin wizard after lead capture. This endpoint is server-side and same-origin so the browser never needs a partner API token.

#### `POST /projects`

Creates a customer/project workspace outside the wizard.

Required fields:

```json
{
  "industry": "car-wash",
  "facility": {
    "name": "Demo Car Wash",
    "zipCode": "89052"
  },
  "contact": {
    "email": "owner@example.com"
  }
}
```

Optional fields:

- `source` — `wizard`, `partner-api`, `ops-console`, or campaign/source label.
- `facility.address`
- `facility.utilityAccount`
- `contact.name`
- `contact.phone`
- `goals[]`
- `quoteId`
- `webhookUrl`

Response includes:

- `projectId`
- facility/contact metadata
- `workflowSummary`
- initialized workflow stages and tasks
- `storage` — `supabase` when persisted, `memory` in local/dev fallback

#### `GET /projects/:projectId/workflow`

Returns current workflow state for customer portal, partner dashboard, or internal ops.

#### `PATCH /projects/:projectId/tasks/:taskId`

Updates task status.

Allowed statuses:

- `open`
- `blocked`
- `done`

## Default Workflow

1. Customer intake
2. Site intelligence
3. Preliminary quote
4. Document collection
5. Engineering review

This separates high-conversion intake from the longer project lifecycle. A customer can enter through the wizard, a partner API call, an internal sales workflow, or a future energy-infrastructure integration without duplicating business logic.

## Persistence

Workflow state is stored in Supabase when server-side Supabase credentials are configured:

- `merlin_projects` stores project metadata, contact/facility JSON, goals, quote linkage, workflow state, and workflow summary.
- `merlin_project_events` stores lifecycle events for project creation and task updates.

If Supabase env vars are missing in local development, the API falls back to an in-memory store so endpoint smoke tests and demos still work.

## Workflow Events

The API records lifecycle events and can fire project-level webhooks when `webhookUrl` is supplied on project creation.

Supported events:

- `project.created`
- `task.updated`
- `project.ready_for_engineering`

## Recommended Next Milestones

1. Apply the Supabase migration in production.
2. Add a customer portal/workspace view backed by `GET /projects/:projectId/workflow`.
3. Add customer document upload state to workflow tasks.
4. Add API-key scoped partner ownership checks before production use.
5. Add workflow project lookup from saved quotes and operator dashboards.
