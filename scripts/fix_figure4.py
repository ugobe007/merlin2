import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

OUT = "/Users/robertchristopher/merlin3/patent_assets"
PURPLE="#7C3AED"; INDIGO="#4F46E5"; TEAL="#0D9488"; GREEN="#059669"; WHITE="#FFFFFF"

fig, ax = plt.subplots(figsize=(20, 12))
ax.set_xlim(0, 20); ax.set_ylim(0, 12)
ax.set_facecolor("#0F0A2A"); fig.patch.set_facecolor("#0F0A2A"); ax.axis("off")

ax.text(10, 11.6, "MERLIN ENERGY — WIZARD USER INTERFACE",
        ha="center", fontsize=15, fontweight="bold", color=WHITE)
ax.text(10, 11.2, "Patent Application  |  Figure 4  |  Step-by-Step Configuration Flow",
        ha="center", fontsize=9, color="#94A3B8")

def screen(x, y, w, h, title, step_num, elements, color=PURPLE):
    r = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.12",
                       facecolor="#1E1B4B", edgecolor=color,
                       linewidth=2.5, alpha=0.98, zorder=3)
    ax.add_patch(r)
    bar = FancyBboxPatch((x, y+h-0.6), w, 0.58, boxstyle="round,pad=0.05",
                         facecolor=color, edgecolor="none", linewidth=0, alpha=0.95, zorder=4)
    ax.add_patch(bar)
    ax.text(x+w/2, y+h-0.32, title, ha="center", va="center",
            fontsize=8, fontweight="bold", color=WHITE, zorder=5)
    badge = plt.Circle((x+w-0.28, y+h-0.3), 0.22, color=WHITE, zorder=5)
    ax.add_patch(badge)
    ax.text(x+w-0.28, y+h-0.3, str(step_num), ha="center", va="center",
            fontsize=8, fontweight="bold", color=color, zorder=6)
    ey = y + h - 0.8
    for (etype, text) in elements:
        ey -= 0.38
        if ey < y + 0.08:
            break
        if etype == "label":
            ax.text(x+0.2, ey, text, fontsize=6.5, color="#94A3B8", zorder=4)
        elif etype == "input":
            r2 = FancyBboxPatch((x+0.15, ey-0.18), w-0.3, 0.28,
                               boxstyle="round,pad=0.04", facecolor="#0F172A",
                               edgecolor="#475569", linewidth=1, alpha=0.95, zorder=4)
            ax.add_patch(r2)
            ax.text(x+0.3, ey-0.04, text, fontsize=6.5, color="#64748B", zorder=5)
        elif etype == "card":
            r2 = FancyBboxPatch((x+0.15, ey-0.22), w-0.3, 0.32,
                               boxstyle="round,pad=0.04", facecolor="#1E293B",
                               edgecolor="#334155", linewidth=1, alpha=0.95, zorder=4)
            ax.add_patch(r2)
            ax.text(x+0.3, ey-0.06, text, fontsize=6.5, color="#CBD5E1", zorder=5)
        elif etype == "highlight":
            r2 = FancyBboxPatch((x+0.15, ey-0.22), w-0.3, 0.32,
                               boxstyle="round,pad=0.04", facecolor=color,
                               edgecolor="none", linewidth=0, alpha=0.35, zorder=4)
            ax.add_patch(r2)
            ax.text(x+0.3, ey-0.06, text, fontsize=6.8, fontweight="bold", color=WHITE, zorder=5)
        elif etype == "btn":
            r2 = FancyBboxPatch((x+0.4, ey-0.18), w-0.8, 0.28,
                               boxstyle="round,pad=0.06", facecolor=color,
                               edgecolor="none", linewidth=0, alpha=0.95, zorder=4)
            ax.add_patch(r2)
            ax.text(x+w/2, ey-0.04, text, ha="center", fontsize=7, fontweight="bold", color=WHITE, zorder=5)
        ey -= 0.05

def arr(x1, y1, x2, y2):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color="#7C3AED", lw=2.0), zorder=6)

sw=3.4; sh=10.2; gap=0.42
xs = [0.3 + i*(sw+gap) for i in range(5)]
sy = 0.6

screen(xs[0], sy, sw, sh, "Enter Business Name", 0, [
    ("label",     "What is the business name?"),
    ("input",     "e.g.  Marriott Downtown"),
    ("highlight", "[DETECTED] Hotel  (90% confidence)"),
    ("card",      "Hotel  |  225 kW solar cap"),
    ("card",      "Critical load: 45%"),
    ("label",     "Industry auto-populated"),
    ("card",      "Skipping Step 2 automatically"),
    ("label",     "Patent 11: Confidence gate"),
    ("card",      "getFacilityConstraints()"),
    ("label",     "Atomic constraint populate"),
    ("btn",       "CONFIRM  ->"),
], PURPLE)
arr(xs[0]+sw, sy+sh/2, xs[1], sy+sh/2)

screen(xs[1], sy, sw, sh, "ZIP Code & Location Intel", 1, [
    ("label",     "Project ZIP Code"),
    ("input",     "e.g.  90210"),
    ("label",     "350ms debounce  |  3-tier fallback"),
    ("highlight", "[SOLAR] Grade: A  (5.8 PSH)"),
    ("card",      "Utility Rate:  $0.24 / kWh"),
    ("card",      "Peak Demand Rate:  $18 / kW"),
    ("card",      "ITC Bonus:  10%  (California)"),
    ("highlight", "[GRID] Reliable"),
    ("card",      "SREC:  Available"),
    ("label",     "Patent 10: Progressive reveal"),
    ("btn",       "ANALYZE LOCATION  ->"),
], INDIGO)
arr(xs[1]+sw, sy+sh/2, xs[2], sy+sh/2)

screen(xs[2], sy, sw, sh, "Load Profile & Equipment", 3, [
    ("label",     "Hotel rooms"),
    ("input",     "150  rooms"),
    ("label",     "Square footage"),
    ("input",     "45,000  sqft"),
    ("highlight", "[LOAD] Peak Demand:  432 kW"),
    ("card",      "Base Load:  220 kW"),
    ("card",      "EV load pre-merged:  +18 kW"),
    ("label",     "Solar roof estimate:  30,000 sqft"),
    ("card",      "Solar Cap:  225 kW"),
    ("label",     "Patent 12: Selective memoize"),
    ("btn",       "CALCULATE LOAD  ->"),
], "#5B21B6")
arr(xs[2]+sw, sy+sh/2, xs[3], sy+sh/2)

screen(xs[3], sy, sw, sh, "Add-Ons & Configuration", 4, [
    ("highlight", "[ON] Solar PV  (225 kW)"),
    ("card",      "Grade A  |  5.8 PSH"),
    ("card",      "Est. generation:  310 MWh / yr"),
    ("highlight", "[ON] Backup Generator"),
    ("card",      "Auto-enabled: unreliable grid"),
    ("card",      "Patent 14: Reducer-level"),
    ("label",     "Goal:  Save the Most"),
    ("highlight", "[BESS] MagicFit Optimizing..."),
    ("card",      "Upsize matrix: Solar Only"),
    ("card",      "1.15x  /  1.25x  /  1.35x"),
    ("btn",       "VIEW QUOTES  ->"),
], TEAL)
arr(xs[3]+sw, sy+sh/2, xs[4], sy+sh/2)

screen(xs[4], sy, sw, sh, "Quote Results (Step 5)", 5, [
    ("label",     "TrueQuote(tm) Authenticated"),
    ("highlight", "[RECOMMENDED]"),
    ("card",      "BESS:  1.4 MW  /  5.6 MWh"),
    ("card",      "Solar:  225 kW"),
    ("card",      "Total:  $2,847,000"),
    ("highlight", "Annual Savings:  $312,000"),
    ("card",      "Payback:  9.1 years"),
    ("card",      "25-Yr NPV (Project):  $1.84M"),
    ("card",      "25-Yr ROI:  187%"),
    ("label",     "Export:  Word  /  Excel  /  PDF"),
    ("btn",       "DOWNLOAD QUOTE  ->"),
], GREEN)

ax.text(10, 0.28,
    "Figure 4 -- Merlin Energy Wizard Interface: 5-step guided configuration "
    "producing TrueQuote(tm)-authenticated BESS system quotes",
    ha="center", fontsize=8, color="#64748B", style="italic")

plt.tight_layout(pad=0.3)
plt.savefig(f"{OUT}/Figure_4_UI.png", dpi=180, bbox_inches="tight",
            facecolor=fig.get_facecolor())
plt.close()
print("Figure 4 regenerated — no emoji, no warnings.")
