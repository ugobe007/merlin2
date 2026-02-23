import React from "react";

export default function AdminUseCasesTab() {
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Use Case Manager</h2>
          </div>
          <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]">
            + Create New Use Case
          </button>
        </div>

        {/* Use Case List */}
        <div className="space-y-4">
          {[
            { name: "Car Wash", icon: "🚗", tier: "free", active: true, quotesGenerated: 89 },
            {
              name: "Indoor Farm",
              icon: "🌱",
              tier: "semi_premium",
              active: true,
              quotesGenerated: 34,
            },
            { name: "Hotel", icon: "🏨", tier: "free", active: true, quotesGenerated: 67 },
            { name: "Airport", icon: "✈️", tier: "premium", active: true, quotesGenerated: 12 },
            {
              name: "College/University",
              icon: "🎓",
              tier: "semi_premium",
              active: true,
              quotesGenerated: 45,
            },
          ].map((useCase, idx) => (
            <div
              key={idx}
              className="bg-white/[0.03] backdrop-blur-sm p-4 rounded-2xl border border-white/[0.08] hover:border-white/[0.12] hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{useCase.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-lg">{useCase.name}</p>
                    <div className="flex gap-3 mt-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded-lg ${
                          useCase.tier === "premium"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : useCase.tier === "semi_premium"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {useCase.tier === "semi_premium"
                          ? "Semi-Premium"
                          : useCase.tier.charAt(0).toUpperCase() + useCase.tier.slice(1)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-lg ${
                          useCase.active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {useCase.active ? "Active" : "Inactive"}
                      </span>
                      <span className="text-white/50">
                        {useCase.quotesGenerated} quotes generated
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]">
                    Edit
                  </button>
                  <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]">
                    Test
                  </button>
                  <button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02]">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Notice */}
        <div className="bg-emerald-500/5 border border-white/[0.08] p-4 rounded-2xl">
          <p className="text-emerald-400 text-sm">
            📚 <strong>Current Templates:</strong> These use cases are defined in{" "}
            <code className="bg-emerald-500/10 px-2 py-1 rounded">
              src/data/useCaseTemplates.ts
            </code>
            . After Supabase integration, you'll create and edit them directly in this interface!
          </p>
        </div>
      </div>
    </>
  );
}
