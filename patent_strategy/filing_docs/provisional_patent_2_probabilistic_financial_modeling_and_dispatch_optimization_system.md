# PROVISIONAL PATENT #2

## PROBABILISTIC FINANCIAL MODELING AND DISPATCH OPTIMIZATION SYSTEM FOR ENERGY INFRASTRUCTURE

**Included disclosure themes:** Patent 5 — 8760 Dispatch Simulator; Patent 6 — Monte Carlo Financial Engine; Patent 4 — Margin Policy Engine

## 1. Field of the Invention

This invention relates to financial modeling and operational optimization of infrastructure systems, and more specifically to computer-implemented systems and methods for simulating energy storage dispatch, calculating financial performance metrics, and performing probabilistic financial analysis for infrastructure projects including battery energy storage systems, solar generation systems, generators, electric vehicle charging infrastructure, and microgrids.

## 2. Background of the Invention

Financial evaluation of infrastructure projects such as battery energy storage systems and solar power systems typically relies on spreadsheet-based models that use simplified assumptions, annual averages, and deterministic inputs. These models often fail to capture time-of-use electricity pricing, demand charges, equipment degradation, equipment dispatch constraints, and uncertainty in future electricity prices and incentives.

Traditional financial models also fail to simulate interval-based dispatch behavior of battery systems and often do not incorporate probabilistic risk modeling for key variables such as electricity-rate escalation, equipment-cost changes, tax incentive qualification, and demand-charge variation. As a result, many customer-facing proposals present a single payback or return figure without disclosing the range of possible outcomes.

There exists a need for a system that integrates operational simulation, layered pricing policy, and probabilistic financial modeling into a unified platform for evaluating infrastructure investments.

## 3. Summary of the Invention

The present invention is a computer-implemented system that performs operational simulation and probabilistic financial modeling for infrastructure systems.

In various embodiments, the system:

- simulates system operation over a defined time interval;
- calculates cost savings and revenue streams;
- calculates financial performance metrics;
- performs probabilistic analysis using variable distributions;
- produces financial outcome distributions;
- applies pricing and margin policies to generate project pricing; and
- generates output reports suitable for quoting, internal underwriting, financing review, or bankability presentations.

The system may be used for battery energy storage systems, solar systems, generators, microgrids, electric vehicle charging infrastructure, and other infrastructure systems.

## 4. System Overview

The system may include one or more of the following components:

- Dispatch Simulation Engine
- Load Profile Engine
- Utility Rate Engine
- Financial Calculation Engine
- Probabilistic Simulation Engine
- Pricing and Margin Engine
- Reporting and Presentation Layer

These components operate together so that operational simulation outputs are used directly as inputs to financial calculations and pricing logic.

## 5. Dispatch Simulation Engine

The dispatch simulation engine simulates operation of an energy storage system over a time period.

In some embodiments, the system simulates operation over 8,760 hours representing one full year. In other embodiments, the system may use sub-hourly, daily, seasonal, or event-driven intervals.

For each time interval, the system may:

- determine facility load;
- determine solar generation;
- determine electricity price;
- determine demand-charge periods;
- determine one or more battery charge or discharge actions;
- update battery state of charge;
- record energy charged and discharged;
- record demand reduction;
- record energy arbitrage revenue; and
- record backup power value or outage-avoidance value.

The system may evaluate multiple dispatch strategies including:

- peak shaving;
- time-of-use arbitrage;
- solar self-consumption;
- demand response; and
- backup power.

In some embodiments, the dispatch engine selects a strategy based on tariff features, project goals, battery constraints, or combinations thereof.

## 6. Load Profile Engine

The system may include a library of load profiles corresponding to facility types including but not limited to:

- car wash;
- hotel;
- hospital;
- warehouse;
- manufacturing;
- data center;
- electric vehicle charging;
- retail; and
- office.

These load profiles may include hourly load values for a full year. In some embodiments, the system may also accept measured interval data, imported utility data, or a blended profile derived from both standard templates and site-specific inputs.

## 7. Utility Rate Engine

The system may model utility rate structures including:

- time-of-use energy pricing;
- demand charges;
- seasonal rate schedules;
- fixed charges;
- net metering policies;
- export compensation rules;
- demand-response program payments; and
- incentives.

The system calculates cost savings and revenue impacts based on simulated system operation and utility rate structures. In some embodiments, the same dispatch result is priced differently under different rate structures to compare project bankability across utilities, tariffs, or scenarios.

## 8. Financial Calculation Engine

The system calculates financial metrics including:

- total project cost;
- annual operating cost savings;
- annual revenue;
- payback period;
- net present value (NPV);
- internal rate of return (IRR);
- return on investment (ROI);
- debt service coverage or financeability metrics; and
- cash flow over time.

The system may calculate these values based on simulated operational performance rather than simplified annual averages. In some embodiments, dispatch-derived savings are segmented into demand-charge savings, arbitrage savings, self-consumption savings, grid-services revenue, and resiliency value.

## 9. Probabilistic Simulation Engine

The system performs probabilistic financial analysis using variable ranges and probability distributions.

Variables may include:

- electricity price escalation;
- equipment cost variation;
- battery degradation;
- system utilization;
- demand-charge changes;
- incentive qualification;
- interest rates; and
- inflation.

The system may perform Monte Carlo simulations using multiple iterations to generate distributions of financial outcomes. In some embodiments, Latin hypercube sampling or correlated-variable sampling is used to improve efficiency and represent realistic interdependencies among variables.

The system may produce:

- P10 financial outcome;
- P50 financial outcome; and
- P90 financial outcome.

This provides a range of possible financial results rather than a single deterministic value. In some embodiments, the output further includes downside-risk metrics, sensitivity rankings, or probability of achieving a threshold return.

## 10. Pricing and Margin Engine

The system may include a pricing engine that determines project pricing.

The pricing engine may:

- separate base cost from sell price;
- apply margin rules;
- apply deal-size discounts;
- apply product-specific margins;
- apply risk adjustments;
- enforce price floors and ceilings; and
- trigger review events.

In some embodiments, the pricing engine maintains at least three conceptual layers comprising a market or benchmark cost layer, an obtainable or risk-adjusted commercial layer, and a final sell-price layer. This layered architecture preserves traceability between financial modeling and customer-visible pricing.

## 11. Integrated Operational and Financial Modeling

A key aspect of the invention is that operational simulation, financial modeling, and pricing policy are integrated into a single system.

Operational simulation outputs are used directly as inputs to financial calculations, enabling accurate financial modeling based on simulated system behavior. Probabilistic simulation then acts upon these modeled financial outputs to generate outcome distributions. Pricing and margin logic may then be applied to selected scenarios or confidence bands to support quoting, underwriting, financing discussions, or internal approval workflows.

## 12. Example Workflow

An example workflow may include:

1. determining a facility load profile;
2. determining a utility rate structure;
3. simulating battery dispatch over a full year;
4. calculating energy savings and demand-charge reduction;
5. calculating annual savings and long-term cash flows;
6. performing Monte Carlo simulation;
7. generating financial outcome distributions;
8. applying a pricing engine; and
9. generating a project financial report.

## 13. Scope of the Invention

The system may be used for financial evaluation of infrastructure including:

- battery energy storage systems;
- solar systems;
- wind systems;
- generators;
- microgrids;
- electric vehicle charging infrastructure;
- industrial infrastructure; and
- building energy systems.

## 14. Conclusion

The present invention provides a system that integrates operational simulation and probabilistic financial modeling, enabling improved evaluation of infrastructure investments. By combining interval-based dispatch simulation, probabilistic outcome modeling, and layered pricing policy, the system supports more accurate, more auditable, and more bankable infrastructure evaluation than deterministic spreadsheet-based approaches.

## 15. Brief Description of the Drawings

- **FIG. 1** is a financial-model architecture diagram showing the relationship among load profiles, tariff inputs, dispatch simulation, financial calculations, probabilistic simulation, pricing policy, and report generation.
- **FIG. 2** is a dispatch-simulation flowchart showing interval-based input evaluation, battery charge-discharge decisions, state-of-charge updates, and savings calculation.
- **FIG. 3** is a Monte Carlo simulation flowchart showing uncertain input definition, repeated sampling, recalculation of financial metrics, and percentile output generation.
- **FIG. 4** is a pricing-engine layers diagram showing separation of market cost, obtainable commercial reality, and final sell price, together with review-event and floor-ceiling enforcement.
- **FIG. 5** is an example hourly dispatch graph showing load, solar production, and battery dispatch over a representative day.
- **FIG. 6** is an example cash-flow chart showing initial project cost and subsequent modeled annual cash flows across downside, median, and upside scenarios.

## 16. Figure Notes and Attorney Drafting Guidance

### FIG. 1 — Financial Model Architecture

This figure should emphasize that the system is not merely a calculator. It ingests operational inputs, performs dispatch simulation, converts simulation outputs into savings categories, performs probabilistic analysis, and then applies margin policy and reporting logic. The key message is integrated operational-to-financial coupling.

### FIG. 2 — Dispatch Simulation Flowchart

This figure should show a repeated interval loop. For each hour or other time step, the engine determines load, solar, tariff conditions, and battery availability; selects an action; updates state of charge; and records savings or revenue. The key message is interval-level dispatch rather than annual-average approximation.

### FIG. 3 — Monte Carlo Simulation Flowchart

This figure should show uncertain-variable definitions, repeated sampling iterations, recalculation of NPV, IRR, and payback, storage of outputs, and percentile generation. The key message is probability-distribution output rather than a single deterministic answer.

### FIG. 4 — Pricing Engine Layers Diagram

This figure should show at least three vertically stacked layers: market or benchmark cost, obtainable commercial reality, and customer-facing sell price. Side controls should include product-specific margins, deal-size logic, risk adjustments, floor-ceiling guards, and review events. The key message is separation of modeling from commercialization.

### FIG. 5 — Example Hourly Dispatch Graph

This figure should present a representative 24-hour interval with load, solar, and battery dispatch traces. The graph visually reinforces how charging and discharging decisions correspond to tariff windows and onsite generation.

### FIG. 6 — Example Cash Flow Chart

This figure should show an upfront capital outlay followed by annual modeled benefits. Preferably, three paths or bands are shown for downside, median, and upside cases to reinforce the probabilistic aspect of the invention.

## 17. Optional Abstract

A computer-implemented system for evaluating infrastructure projects performs interval-based operational simulation, dispatch optimization, utility-tariff modeling, financial metric calculation, probabilistic scenario analysis, and layered pricing-policy application. The system simulates operation of energy infrastructure such as battery energy storage, solar generation, microgrids, generators, and electric vehicle charging systems; converts simulated operational behavior into savings and revenue streams; calculates financial metrics including payback, net present value, and internal rate of return; generates P10, P50, and P90 outcome distributions using probabilistic simulation; and applies margin and pricing rules while preserving separation between base cost and sell price. The integrated architecture supports bankability analysis, underwriting, quoting, and project evaluation using modeled operational behavior rather than deterministic annual averages.
