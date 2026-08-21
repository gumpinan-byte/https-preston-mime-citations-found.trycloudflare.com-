// EMI & On-Road Price Breakdown Calculator
const EMICalculator = {
  selectedCar: null,
  loanAmount: 1000000,
  interestRate: 8.5,
  tenureYears: 5,
  downPaymentPercent: 20,

  init(car) {
    this.selectedCar = car;
    const basePrice = car ? car.min_price : 1200000;
    this.loanAmount = basePrice * (1 - this.downPaymentPercent / 100);
    this.render();
  },

  calculate() {
    const p = this.loanAmount;
    const r = (this.interestRate / 12) / 100;
    const n = this.tenureYears * 12;

    if (r === 0) return { emi: p / n, totalInterest: 0, totalPayment: p };

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;

    return {
      monthlyEMI: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      principal: Math.round(p)
    };
  },

  render() {
    const container = document.getElementById('emi-calculator-container');
    if (!container) return;

    const res = this.calculate();

    container.innerHTML = `
      <div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div class="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h4 class="text-lg font-bold text-white flex items-center gap-2">
              <i data-lucide="calculator" class="w-5 h-5 text-sky-400"></i> Car Loan EMI Calculator
            </h4>
            <p class="text-xs text-slate-400 mt-0.5">Calculate monthly installments & interest in Indian Rupees</p>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-400">Monthly EMI</span>
            <div class="text-2xl font-black text-emerald-400">? ${res.monthlyEMI.toLocaleString('en-IN')}/mo</div>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Loan Amount Slider -->
          <div>
            <div class="flex justify-between text-xs font-semibold mb-1.5">
              <span class="text-slate-300">Loan Amount</span>
              <span class="text-sky-400 font-bold">? ${(this.loanAmount / 100000).toFixed(2)} Lakh (? ${this.loanAmount.toLocaleString('en-IN')})</span>
            </div>
            <input type="range" min="100000" max="6000000" step="25000" value="${this.loanAmount}"
              oninput="EMICalculator.updateLoan(this.value)" class="w-full">
            <div class="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>? 1.0 Lakh</span>
              <span>? 60.0 Lakh</span>
            </div>
          </div>

          <!-- Interest Rate Slider -->
          <div>
            <div class="flex justify-between text-xs font-semibold mb-1.5">
              <span class="text-slate-300">Interest Rate (% p.a.)</span>
              <span class="text-amber-400 font-bold">${this.interestRate}%</span>
            </div>
            <input type="range" min="6.5" max="15.0" step="0.25" value="${this.interestRate}"
              oninput="EMICalculator.updateRate(this.value)" class="w-full">
            <div class="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>6.5% (Special EV Rate)</span>
              <span>15.0%</span>
            </div>
          </div>

          <!-- Tenure Selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2">Loan Tenure (Years)</label>
            <div class="grid grid-cols-5 gap-2">
              ${[1, 3, 5, 7, 8].map(yr => `
                <button type="button" onclick="EMICalculator.updateTenure(${yr})"
                  class="py-2 text-xs font-bold rounded-xl border transition-all ${this.tenureYears === yr ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-600/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}">
                  ${yr} Yrs
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Summary Grid -->
        <div class="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
          <div>
            <div class="text-[11px] text-slate-400">Principal</div>
            <div class="text-xs font-bold text-white mt-0.5">? ${(res.principal / 100000).toFixed(2)}L</div>
          </div>
          <div>
            <div class="text-[11px] text-slate-400">Total Interest</div>
            <div class="text-xs font-bold text-amber-400 mt-0.5">? ${(res.totalInterest / 100000).toFixed(2)}L</div>
          </div>
          <div>
            <div class="text-[11px] text-slate-400">Total Amount</div>
            <div class="text-xs font-bold text-emerald-400 mt-0.5">? ${(res.totalPayment / 100000).toFixed(2)}L</div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  updateLoan(val) {
    this.loanAmount = parseInt(val);
    this.render();
  },

  updateRate(val) {
    this.interestRate = parseFloat(val);
    this.render();
  },

  updateTenure(val) {
    this.tenureYears = parseInt(val);
    this.render();
  }
};
