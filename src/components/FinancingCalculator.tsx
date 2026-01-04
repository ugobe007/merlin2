import React, { useState, useMemo } from "react";

interface FinancingCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: {
    quoteName: string;
    totalCapEx: number;
    annualSavings: number;
    powerMW: number;
    durationHours: number;
  };
}

type FinancingType = "loan" | "lease" | "ppa";

interface LoanDetails {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  paymentSchedule: { year: number; principal: number; interest: number; balance: number }[];
}

interface LeaseDetails {
  monthlyPayment: number;
  totalPayments: number;
  buyoutOption: number;
}

interface PPADetails {
  ratePerKWh: number;
  annualPayment: number;
  totalPayments: number;
  escalationRate: number;
}

const FinancingCalculator: React.FC<FinancingCalculatorProps> = ({
  isOpen,
  onClose,
  projectData,
}) => {
  const [financingType, setFinancingType] = useState<FinancingType>("loan");

  // Loan parameters
  const [downPayment, setDownPayment] = useState(20); // 20% down
  const [loanTerm, setLoanTerm] = useState(10); // 10 years
  const [interestRate, setInterestRate] = useState(5.5); // 5.5% APR

  // Lease parameters
  const [leaseTerm, setLeaseTerm] = useState(7); // 7 years
  const [leaseRate, setLeaseRate] = useState(3.5); // 3.5% of asset value per year
  const [buyoutPercent, setBuyoutPercent] = useState(15); // 15% buyout

  // PPA parameters
  const [ppaTerm, setPpaTerm] = useState(15); // 15 years
  const [ppaRate, setPpaRate] = useState(0.12); // $0.12 per kWh
  const [escalationRate, setEscalationRate] = useState(2.5); // 2.5% annual escalation

  // Calculate loan details
  const loanDetails = useMemo((): LoanDetails => {
    const principal = projectData.totalCapEx * (1 - downPayment / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalPayment =
      monthlyPayment * numPayments + (projectData.totalCapEx * downPayment) / 100;
    const totalInterest = totalPayment - projectData.totalCapEx;

    // Generate payment schedule
    let balance = principal;
    const paymentSchedule = [];

    for (let year = 1; year <= loanTerm; year++) {
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let month = 1; month <= 12; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;

        yearInterest += interestPayment;
        yearPrincipal += principalPayment;
        balance -= principalPayment;
      }

      paymentSchedule.push({
        year,
        principal: yearPrincipal,
        interest: yearInterest,
        balance: Math.max(0, balance),
      });
    }

    return {
      monthlyPayment,
      totalInterest,
      totalPayment,
      paymentSchedule,
    };
  }, [projectData.totalCapEx, downPayment, loanTerm, interestRate]);

  // Calculate lease details
  const leaseDetails = useMemo((): LeaseDetails => {
    const annualPayment = projectData.totalCapEx * (leaseRate / 100);
    const monthlyPayment = annualPayment / 12;
    const totalPayments = annualPayment * leaseTerm;
    const buyoutOption = projectData.totalCapEx * (buyoutPercent / 100);

    return {
      monthlyPayment,
      totalPayments,
      buyoutOption,
    };
  }, [projectData.totalCapEx, leaseRate, leaseTerm, buyoutPercent]);

  // Calculate PPA details
  const ppaDetails = useMemo((): PPADetails => {
    const annualEnergy = projectData.powerMW * projectData.durationHours * 365; // MWh per year
    const annualEnergyKWh = annualEnergy * 1000; // Convert to kWh

    let totalPayments = 0;
    let currentRate = ppaRate;

    for (let year = 1; year <= ppaTerm; year++) {
      const yearPayment = annualEnergyKWh * currentRate;
      totalPayments += yearPayment;
      currentRate *= 1 + escalationRate / 100;
    }

    const annualPayment = annualEnergyKWh * ppaRate;

    return {
      ratePerKWh: ppaRate,
      annualPayment,
      totalPayments,
      escalationRate: escalationRate / 100,
    };
  }, [projectData.powerMW, projectData.durationHours, ppaRate, ppaTerm, escalationRate]);

  // Calculate net savings for each option
  const netSavings = useMemo(() => {
    const { annualSavings } = projectData;

    // Loan: Savings - monthly payments (annualized) - down payment (amortized)
    const loanAnnualPayment = loanDetails.monthlyPayment * 12;
    const loanDownPaymentAnnual = (projectData.totalCapEx * downPayment) / 100 / loanTerm;
    const loanNetAnnual = annualSavings - loanAnnualPayment - loanDownPaymentAnnual;
    const loanNetLifetime = annualSavings * loanTerm - loanDetails.totalPayment;

    // Lease: Savings - lease payments
    const leaseAnnualPayment = leaseDetails.monthlyPayment * 12;
    const leaseNetAnnual = annualSavings - leaseAnnualPayment;
    const leaseNetLifetime =
      annualSavings * leaseTerm - leaseDetails.totalPayments - leaseDetails.buyoutOption;

    // PPA: Savings - PPA payments
    const ppaNetAnnual = annualSavings - ppaDetails.annualPayment;
    const ppaNetLifetime = annualSavings * ppaTerm - ppaDetails.totalPayments;

    return {
      loan: { annual: loanNetAnnual, lifetime: loanNetLifetime },
      lease: { annual: leaseNetAnnual, lifetime: leaseNetLifetime },
      ppa: { annual: ppaNetAnnual, lifetime: ppaNetLifetime },
    };
  }, [
    projectData,
    loanDetails,
    leaseDetails,
    ppaDetails,
    downPayment,
    loanTerm,
    leaseTerm,
    ppaTerm,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-400/60 ring-4 ring-purple-500/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 text-white p-6 rounded-t-xl z-10 border-b-4 border-purple-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <span>💰</span>
                Financing Calculator
              </h2>
              <p className="text-purple-200 mt-1">
                {projectData.quoteName} - ${(projectData.totalCapEx / 1000000).toFixed(2)}M Total
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg px-4 py-2 transition-all text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Financing Type Selector */}
          <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 p-6 rounded-xl border-2 border-purple-400/40 shadow-lg backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Select Financing Option</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setFinancingType("loan")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  financingType === "loan"
                    ? "bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border-blue-400/60 shadow-lg shadow-blue-500/20"
                    : "bg-slate-700/50 border-slate-500/50 hover:border-blue-400/50 hover:bg-blue-500/10"
                }`}
              >
                <div className="text-4xl mb-2">🏦</div>
                <div
                  className={`font-bold text-lg ${financingType === "loan" ? "text-white" : "text-gray-300"}`}
                >
                  Term Loan
                </div>
                <div
                  className={`text-sm ${financingType === "loan" ? "text-blue-200" : "text-gray-400"}`}
                >
                  Traditional financing
                </div>
              </button>

              <button
                onClick={() => setFinancingType("lease")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  financingType === "lease"
                    ? "bg-gradient-to-br from-purple-500/30 to-violet-500/30 border-purple-400/60 shadow-lg shadow-purple-500/20"
                    : "bg-slate-700/50 border-slate-500/50 hover:border-purple-400/50 hover:bg-purple-500/10"
                }`}
              >
                <div className="text-4xl mb-2">📋</div>
                <div
                  className={`font-bold text-lg ${financingType === "lease" ? "text-white" : "text-gray-300"}`}
                >
                  Capital Lease
                </div>
                <div
                  className={`text-sm ${financingType === "lease" ? "text-purple-200" : "text-gray-400"}`}
                >
                  Lease-to-own option
                </div>
              </button>

              <button
                onClick={() => setFinancingType("ppa")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  financingType === "ppa"
                    ? "bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border-emerald-400/60 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-700/50 border-slate-500/50 hover:border-emerald-400/50 hover:bg-emerald-500/10"
                }`}
              >
                <div className="text-4xl mb-2">⚡</div>
                <div
                  className={`font-bold text-lg ${financingType === "ppa" ? "text-white" : "text-gray-300"}`}
                >
                  Power Purchase Agreement
                </div>
                <div
                  className={`text-sm ${financingType === "ppa" ? "text-emerald-200" : "text-gray-400"}`}
                >
                  Pay per kWh
                </div>
              </button>
            </div>
          </div>

          {/* LOAN FINANCING */}
          {financingType === "loan" && (
            <>
              {/* Loan Parameters */}
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-6 rounded-xl border-2 border-blue-400/50 shadow-lg backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-4">🏦 Loan Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Down Payment (%)
                    </label>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-blue-400/50 rounded-lg text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-blue-200 mt-1">
                      ${((projectData.totalCapEx * downPayment) / 100 / 1000000).toFixed(2)}M
                      upfront
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Loan Term (years)
                    </label>
                    <input
                      type="number"
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(parseFloat(e.target.value) || 1)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-blue-400/50 rounded-lg text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Interest Rate (% APR)
                    </label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-blue-400/50 rounded-lg text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      step="0.1"
                      min="0"
                      max="20"
                    />
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-6 rounded-xl border-2 border-blue-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Monthly Payment</p>
                  <p className="text-3xl font-bold text-blue-300">
                    $
                    {loanDetails.monthlyPayment.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">x {loanTerm * 12} months</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6 rounded-xl border-2 border-amber-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Total Interest</p>
                  <p className="text-3xl font-bold text-amber-300">
                    ${(loanDetails.totalInterest / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-amber-200 mt-1">Over loan term</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 p-6 rounded-xl border-2 border-purple-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Total Cost</p>
                  <p className="text-3xl font-bold text-purple-300">
                    ${(loanDetails.totalPayment / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-purple-200 mt-1">Incl. down payment</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 p-6 rounded-xl border-2 border-emerald-400/60 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Net Annual Savings</p>
                  <p
                    className={`text-3xl font-bold ${netSavings.loan.annual > 0 ? "text-emerald-300" : "text-red-400"}`}
                  >
                    ${(netSavings.loan.annual / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-emerald-200 mt-1">After loan payments</p>
                </div>
              </div>

              {/* Amortization Schedule */}
              <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 p-6 rounded-xl border-2 border-purple-400/40 shadow-lg backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-4">📅 Amortization Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-600/30 border-b-2 border-purple-400/50">
                        <th className="px-4 py-3 text-left font-bold text-white">Year</th>
                        <th className="px-4 py-3 text-right font-bold text-white">Principal</th>
                        <th className="px-4 py-3 text-right font-bold text-white">Interest</th>
                        <th className="px-4 py-3 text-right font-bold text-white">
                          Remaining Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanDetails.paymentSchedule.map((row) => (
                        <tr
                          key={row.year}
                          className="border-b border-purple-400/20 hover:bg-purple-500/10"
                        >
                          <td className="px-4 py-3 font-semibold text-white">{row.year}</td>
                          <td className="px-4 py-3 text-right text-blue-300">
                            ${row.principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-300">
                            ${row.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-white">
                            ${row.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* LEASE FINANCING */}
          {financingType === "lease" && (
            <>
              {/* Lease Parameters */}
              <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 p-6 rounded-xl border-2 border-purple-400/50 shadow-lg backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-4">📋 Lease Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Lease Term (years)
                    </label>
                    <input
                      type="number"
                      value={leaseTerm}
                      onChange={(e) => setLeaseTerm(parseFloat(e.target.value) || 1)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-purple-400/50 rounded-lg text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Annual Lease Rate (% of value)
                    </label>
                    <input
                      type="number"
                      value={leaseRate}
                      onChange={(e) => setLeaseRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-purple-400/50 rounded-lg text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      step="0.1"
                      min="0"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Buyout Option (% of value)
                    </label>
                    <input
                      type="number"
                      value={buyoutPercent}
                      onChange={(e) => setBuyoutPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-purple-400/50 rounded-lg text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Lease Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 p-6 rounded-xl border-2 border-purple-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Monthly Payment</p>
                  <p className="text-3xl font-bold text-purple-300">
                    $
                    {leaseDetails.monthlyPayment.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-purple-200 mt-1">Fixed for term</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-6 rounded-xl border-2 border-blue-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Total Lease Payments</p>
                  <p className="text-3xl font-bold text-blue-300">
                    ${(leaseDetails.totalPayments / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-blue-200 mt-1">Over {leaseTerm} years</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6 rounded-xl border-2 border-amber-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Buyout Option</p>
                  <p className="text-3xl font-bold text-amber-300">
                    ${(leaseDetails.buyoutOption / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-amber-200 mt-1">End of term</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 p-6 rounded-xl border-2 border-emerald-400/60 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Net Annual Savings</p>
                  <p
                    className={`text-3xl font-bold ${netSavings.lease.annual > 0 ? "text-emerald-300" : "text-red-400"}`}
                  >
                    ${(netSavings.lease.annual / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-emerald-200 mt-1">After lease payments</p>
                </div>
              </div>
            </>
          )}

          {/* PPA FINANCING */}
          {financingType === "ppa" && (
            <>
              {/* PPA Parameters */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-6 rounded-xl border-2 border-emerald-400/50 shadow-lg backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-4">⚡ PPA Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      PPA Term (years)
                    </label>
                    <input
                      type="number"
                      value={ppaTerm}
                      onChange={(e) => setPpaTerm(parseFloat(e.target.value) || 1)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-emerald-400/50 rounded-lg text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Rate ($/kWh)
                    </label>
                    <input
                      type="number"
                      value={ppaRate}
                      onChange={(e) => setPpaRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-emerald-400/50 rounded-lg text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Annual Escalation (%)
                    </label>
                    <input
                      type="number"
                      value={escalationRate}
                      onChange={(e) => setEscalationRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-700/60 border-2 border-emerald-400/50 rounded-lg text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      step="0.1"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              {/* PPA Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-6 rounded-xl border-2 border-emerald-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Year 1 Payment</p>
                  <p className="text-3xl font-bold text-emerald-300">
                    ${(ppaDetails.annualPayment / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-emerald-200 mt-1">Escalates annually</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-6 rounded-xl border-2 border-blue-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Total PPA Payments</p>
                  <p className="text-3xl font-bold text-blue-300">
                    ${(ppaDetails.totalPayments / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-blue-200 mt-1">Over {ppaTerm} years</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 p-6 rounded-xl border-2 border-purple-400/50 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">No Upfront Cost</p>
                  <p className="text-3xl font-bold text-purple-300">$0</p>
                  <p className="text-xs text-purple-200 mt-1">Zero capital required</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 p-6 rounded-xl border-2 border-emerald-400/60 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80 mb-1">Net Annual Savings</p>
                  <p
                    className={`text-3xl font-bold ${netSavings.ppa.annual > 0 ? "text-emerald-300" : "text-red-400"}`}
                  >
                    ${(netSavings.ppa.annual / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-emerald-200 mt-1">Year 1 estimate</p>
                </div>
              </div>
            </>
          )}

          {/* Comparison Summary */}
          <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 p-6 rounded-xl border-2 border-purple-400/40 shadow-lg backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">📊 Financing Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-600/30 border-b-2 border-purple-400/50">
                    <th className="px-4 py-3 text-left font-bold text-white">Option</th>
                    <th className="px-4 py-3 text-right font-bold text-white">Upfront Cost</th>
                    <th className="px-4 py-3 text-right font-bold text-white">Monthly Payment</th>
                    <th className="px-4 py-3 text-right font-bold text-white">Total Cost</th>
                    <th className="px-4 py-3 text-right font-bold text-white">
                      Net Lifetime Savings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-purple-400/20 hover:bg-blue-500/10">
                    <td className="px-4 py-3 font-semibold text-white">🏦 Loan ({loanTerm}yr)</td>
                    <td className="px-4 py-3 text-right text-blue-300">
                      ${((projectData.totalCapEx * downPayment) / 100 / 1000000).toFixed(2)}M
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      $
                      {loanDetails.monthlyPayment.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-300">
                      ${(loanDetails.totalPayment / 1000000).toFixed(2)}M
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${netSavings.loan.lifetime > 0 ? "text-emerald-300" : "text-red-400"}`}
                    >
                      ${(netSavings.loan.lifetime / 1000000).toFixed(2)}M
                    </td>
                  </tr>
                  <tr className="border-b border-purple-400/20 hover:bg-purple-500/10">
                    <td className="px-4 py-3 font-semibold text-white">📋 Lease ({leaseTerm}yr)</td>
                    <td className="px-4 py-3 text-right text-purple-300">$0</td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      $
                      {leaseDetails.monthlyPayment.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-300">
                      $
                      {((leaseDetails.totalPayments + leaseDetails.buyoutOption) / 1000000).toFixed(
                        2
                      )}
                      M
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${netSavings.lease.lifetime > 0 ? "text-emerald-300" : "text-red-400"}`}
                    >
                      ${(netSavings.lease.lifetime / 1000000).toFixed(2)}M
                    </td>
                  </tr>
                  <tr className="border-b border-purple-400/20 hover:bg-emerald-500/10">
                    <td className="px-4 py-3 font-semibold text-white">⚡ PPA ({ppaTerm}yr)</td>
                    <td className="px-4 py-3 text-right text-emerald-300">$0</td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      ${(ppaDetails.annualPayment / 12 / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-300">
                      ${(ppaDetails.totalPayments / 1000000).toFixed(2)}M
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${netSavings.ppa.lifetime > 0 ? "text-emerald-300" : "text-red-400"}`}
                    >
                      ${(netSavings.ppa.lifetime / 1000000).toFixed(2)}M
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancingCalculator;
