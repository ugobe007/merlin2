import React, { useMemo } from "react";
import type { Step3Template, WizardState } from "@/wizard/v7/hooks/useWizardV7";

type Step3Answers = Record<string, unknown>;

type Props = {
  state: WizardState;
  actions: {
    goBack: () => void;
    setStep3Answer: (id: string, value: unknown) => void;
    setStep3Answers: (answers: Step3Answers) => void;
    submitStep3: (answersOverride?: Step3Answers) => Promise<void>;
  };
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "white",
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{children}</div>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number | undefined;
  onChange: (v: string | number | undefined) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <input
      value={value ?? ""}
      type={type}
      onChange={(e) => {
        if (type === "number") {
          const raw = e.target.value;
          if (raw.trim() === "") return onChange(undefined);
          const n = Number(raw);
          return onChange(Number.isFinite(n) ? n : undefined);
        }
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      style={{
        width: "100%",
        height: 42,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.14)",
        padding: "0 12px",
        fontSize: 14,
        outline: "none",
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: 42,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.14)",
        padding: "0 10px",
        fontSize: 14,
        outline: "none",
      }}
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function Step3ProfileV7({ state, actions }: Props) {
  const template: Step3Template | null = state.step3Template;

  const questions = useMemo(() => template?.questions ?? [], [template]);
  const answers: Step3Answers = state.step3Answers as Step3Answers;

  const completionStatus = useMemo(() => {
    if (!template) return { complete: false, missing: [] as string[] };

    const missing: string[] = [];
    for (const q of template.questions) {
      if (!q.required) continue;

      const v = answers[q.id];
      const empty =
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0);

      if (empty) missing.push(q.label);
    }

    return { complete: missing.length === 0, missing };
  }, [template, answers]);

  if (!template) {
    return (
      <Card>
        <div style={{ fontSize: 14, fontWeight: 800 }}>Loading profile template…</div>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
          If this hangs, SSOT didn't load a Step 3 template.
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.2px" }}>
              Step 3 — Business profile
            </div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              Industry: <b>{template.industry}</b> • Template: {template.version}
            </div>
          </div>

          <button
            onClick={actions.goBack}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(0,0,0,0.05)",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ← Back
          </button>
        </div>
      </Card>

      <Card>
        <div style={{ display: "grid", gap: 14 }}>
          {questions.length === 0 && (
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              ⚠️ This template has no questions. Wire loadStep3Template() to your real templates.
            </div>
          )}

          {questions.map((q) => {
            const value = answers[q.id];

            return (
              <div key={q.id} style={{ display: "grid", gap: 6 }}>
                <Label>
                  {q.label}
                  {q.required ? " *" : ""}
                </Label>

                {q.type === "number" && (
                  <Input
                    type="number"
                    value={typeof value === "number" ? value : undefined}
                    onChange={(v) => actions.setStep3Answer(q.id, v)}
                    placeholder={q.unit ? `(${q.unit})` : undefined}
                  />
                )}

                {q.type === "text" && (
                  <Input
                    type="text"
                    value={typeof value === "string" ? value : undefined}
                    onChange={(v) => actions.setStep3Answer(q.id, v)}
                  />
                )}

                {q.type === "select" && q.options && (
                  <Select
                    value={typeof value === "string" ? value : undefined}
                    onChange={(v) => actions.setStep3Answer(q.id, v)}
                    options={q.options}
                  />
                )}

                {q.type === "boolean" && (
                  <Checkbox
                    checked={value === true}
                    onChange={(v) => actions.setStep3Answer(q.id, v)}
                    label="Yes"
                  />
                )}

                {q.type === "multiselect" && q.options && (
                  <div style={{ display: "grid", gap: 6 }}>
                    {q.options.map((opt) => {
                      const arr = Array.isArray(value) ? value : [];
                      const checked = arr.includes(opt);

                      return (
                        <Checkbox
                          key={opt}
                          checked={checked}
                          onChange={(v) => {
                            const next = v ? [...arr, opt] : arr.filter((x) => x !== opt);
                            actions.setStep3Answer(q.id, next);
                          }}
                          label={opt}
                        />
                      );
                    })}
                  </div>
                )}

                {q.hint && <div style={{ fontSize: 12, opacity: 0.6 }}>{q.hint}</div>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            {completionStatus.complete ? (
              <div style={{ fontSize: 13, fontWeight: 800, color: "green" }}>
                ✅ All required questions answered
              </div>
            ) : (
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                Missing required:
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {completionStatus.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={() => actions.submitStep3()}
            disabled={!completionStatus.complete || state.isBusy}
            style={{
              height: 44,
              padding: "0 16px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              background:
                !completionStatus.complete || state.isBusy
                  ? "rgba(0,0,0,0.04)"
                  : "rgba(0,0,0,0.08)",
              cursor: !completionStatus.complete || state.isBusy ? "not-allowed" : "pointer",
              fontWeight: 900,
            }}
          >
            {state.isBusy ? "Running QuoteEngine…" : "Generate Quote"}
          </button>
        </div>
      </Card>

      <div style={{ fontSize: 12, opacity: 0.6 }}>
        SSOT owns validation, pricing freeze, and transitions. This step is intentionally dumb.
      </div>
    </div>
  );
}
