import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Zap,
} from "lucide-react";

const workflowStages = [
  {
    id: "intake",
    title: "Customer Intake",
    owner: "Customer Success",
    description:
      "Capture the facility, utility context, goals, decision timeline, and owner contact in one durable project record.",
    icon: ClipboardList,
  },
  {
    id: "site-intelligence",
    title: "Site Intelligence",
    owner: "Merlin Agent",
    description:
      "Resolve utility, rate class, solar resource, grid risk, roof/canopy constraints, and resilience exposure.",
    icon: Zap,
  },
  {
    id: "quote",
    title: "Preliminary Quote",
    owner: "Quote Engine",
    description:
      "Generate first-pass solar, storage, generator, EV, savings, payback, confidence, and next-best-action outputs.",
    icon: FileText,
  },
  {
    id: "documents",
    title: "Document Collection",
    owner: "Customer + Ops",
    description:
      "Track bills, interval data, site photos, single-line diagrams, approvals, and blockers before engineering review.",
    icon: CheckCircle2,
  },
  {
    id: "engineering-review",
    title: "Engineering Review",
    owner: "Engineering",
    description:
      "Validate constructability, interconnection path, equipment fit, vendor package, financing, and final human approvals.",
    icon: ShieldCheck,
  },
];

const apiSurfaces = [
  "POST /api/wizard/workflow-project",
  "POST /api/partner/v1/projects",
  "GET /api/partner/v1/projects/:projectId/workflow",
  "PATCH /api/partner/v1/projects/:projectId/tasks/:taskId",
  "Events: project.created, task.updated, project.ready_for_engineering",
];

export default function WorkflowOSPage() {
  return (
    <main className="min-h-screen bg-[#050608] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 xl:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(37,99,235,0.2),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-screen-2xl">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              <Bot className="h-4 w-4" /> Merlin Energy OS
            </div>
            <h1
              className="text-5xl font-black tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              The operating system for commercial energy projects.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-400 sm:text-xl">
              The wizard is only one front door. Merlin now has a durable workflow API for project
              intake, site intelligence, quoting, document collection, agent handoffs, and
              engineering review.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="/wizard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-500"
              >
                Start a Project <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/partner"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 font-bold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                Partner Dashboard
              </a>
            </div>
          </div>

          <div className="mt-16 grid gap-4 lg:grid-cols-5">
            {workflowStages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <article
                  key={stage.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-400/25 bg-blue-500/10 text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-black text-slate-600">0{index + 1}</span>
                  </div>
                  <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-white">
                    {stage.title}
                  </h2>
                  <div className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                    {stage.owner}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{stage.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080F22] px-4 py-20 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto grid max-w-screen-2xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-blue-300">
              API Contract
            </div>
            <h2 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              One workflow, many entry points.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              A project can start from the Merlin wizard, an internal operator screen, a partner
              integration, or a future energy-infrastructure workflow. The same workflow state is
              persisted in Supabase.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Live Surfaces
            </div>
            <div className="space-y-3">
              {apiSurfaces.map((surface) => (
                <div
                  key={surface}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm text-slate-300"
                >
                  {surface}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
