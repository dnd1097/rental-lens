/**
 * YieldLens Financial Calculation Engine
 * All formulas match the spec exactly.
 */

// ─── Mortgage ─────────────────────────────────────────────────────────────────

export function calcMortgage(purchasePrice, downPaymentPct, interestRate, loanTermYears) {
  const downPaymentDollar = purchasePrice * (downPaymentPct / 100)
  const loanAmount = Math.max(0, purchasePrice - downPaymentDollar)
  const monthlyRate = interestRate / 100 / 12
  const n = loanTermYears * 12

  let monthlyPayment = 0
  if (loanAmount > 0 && monthlyRate > 0) {
    monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
      (Math.pow(1 + monthlyRate, n) - 1)
  } else if (loanAmount > 0 && monthlyRate === 0) {
    monthlyPayment = loanAmount / n
  }

  return {
    loanAmount,
    monthlyPayment,
    annualPayment: monthlyPayment * 12,
    downPaymentDollar,
  }
}

// ─── Amortization Schedule ────────────────────────────────────────────────────

export function buildAmortizationSchedule(loanAmount, interestRate, loanTermYears) {
  const monthlyRate = interestRate / 100 / 12
  const n = loanTermYears * 12
  let balance = loanAmount
  const schedule = [] // indexed 0..loanTermYears-1, each = { interest, principal, endBalance }

  let monthlyPayment = 0
  if (loanAmount > 0 && monthlyRate > 0) {
    monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
      (Math.pow(1 + monthlyRate, n) - 1)
  } else if (loanAmount > 0 && monthlyRate === 0) {
    monthlyPayment = loanAmount / n
  }

  for (let year = 1; year <= loanTermYears; year++) {
    let yearInterest = 0
    let yearPrincipal = 0
    for (let m = 1; m <= 12; m++) {
      const interestPmt = balance * monthlyRate
      const principalPmt = Math.min(monthlyPayment - interestPmt, balance)
      yearInterest += interestPmt
      yearPrincipal += Math.max(0, principalPmt)
      balance = Math.max(0, balance - Math.max(0, principalPmt))
    }
    schedule.push({
      year,
      interest: yearInterest,
      principal: yearPrincipal,
      endBalance: balance,
    })
  }
  return schedule
}

// ─── Cash to Purchase ─────────────────────────────────────────────────────────

export function calcCashToPurchase(purchasePrice, downPaymentPct, closingCostsBuyPct) {
  const downPaymentDollar = purchasePrice * (downPaymentPct / 100)
  const closingCostsDollar = purchasePrice * (closingCostsBuyPct / 100)
  const totalCashRequired = downPaymentDollar + closingCostsDollar
  return { downPaymentDollar, closingCostsDollar, totalCashRequired }
}

// ─── Year-by-Year Projection ──────────────────────────────────────────────────

export function calcYearProjection(year, state, amortSchedule) {
  const { purchase, mortgage, assumptions } = state
  const pp = purchase.purchasePrice

  // Income
  const grossRent =
    assumptions.monthlyRent * 12 * Math.pow(1 + assumptions.rentalIncreaseRatePct / 100, year - 1)
  const vacancyAllowance = grossRent * (assumptions.vacancyPct / 100)
  const totalOperatingIncome = grossRent - vacancyAllowance

  // Expenses
  const propertyTax =
    assumptions.monthlyPropertyTax * 12 * Math.pow(1 + assumptions.propertyTaxIncreaseRatePct / 100, year - 1)
  const insurance = assumptions.monthlyInsurance * 12
  const hoa = assumptions.monthlyHOA * 12
  const utilities =
    assumptions.monthlyUtilities * 12 * Math.pow(1 + assumptions.utilitiesIncreaseRatePct / 100, year - 1)
  const misc =
    assumptions.monthlyMisc * 12 * Math.pow(1 + assumptions.miscIncreaseRatePct / 100, year - 1)
  const maintenanceReserve = totalOperatingIncome * (assumptions.maintenanceReservePct / 100)
  const managementFee = totalOperatingIncome * (assumptions.managementFeePct / 100)
  const totalOpEx =
    propertyTax + insurance + hoa + utilities + misc + maintenanceReserve + managementFee

  // Cash Flow
  const noi = totalOperatingIncome - totalOpEx
  const { annualPayment } = calcMortgage(
    pp,
    mortgage.downPaymentPct,
    mortgage.interestRate,
    mortgage.loanTermYears
  )
  const mortgageExpense = annualPayment
  const annualCashFlow = noi - mortgageExpense
  const monthlyCashFlow = annualCashFlow / 12

  // Tax Benefits
  const depreciableBasis = pp * (assumptions.buildingToLandRatioPct / 100)
  const depreciation = depreciableBasis / 27.5
  const mortgageInterest = amortSchedule.length >= year ? amortSchedule[year - 1].interest : 0

  // Equity
  const propertyValue = pp * Math.pow(1 + assumptions.appreciationRatePct / 100, year)
  const mortgageBalance = amortSchedule.length >= year ? amortSchedule[year - 1].endBalance : 0
  const equity = propertyValue - mortgageBalance

  return {
    year,
    // Income
    grossRent,
    vacancyAllowance,
    totalOperatingIncome,
    // Expenses
    propertyTax,
    insurance,
    hoa,
    utilities,
    misc,
    maintenanceReserve,
    managementFee,
    totalOpEx,
    // Cash Flow
    noi,
    mortgageExpense,
    annualCashFlow,
    monthlyCashFlow,
    // Tax
    depreciation,
    mortgageInterest,
    // Equity
    propertyValue,
    mortgageBalance,
    equity,
  }
}

// ─── Full Projection Table ────────────────────────────────────────────────────

export function buildFullProjection(state) {
  const { purchase, mortgage, assumptions } = state
  const pp = purchase.purchasePrice
  const years = mortgage.downPaymentPct >= 100 ? 30 : mortgage.loanTermYears

  const { loanAmount } = calcMortgage(
    pp,
    mortgage.downPaymentPct,
    mortgage.interestRate,
    mortgage.loanTermYears
  )
  const amortSchedule = buildAmortizationSchedule(loanAmount, mortgage.interestRate, years)
  const { totalCashRequired, downPaymentDollar } = calcCashToPurchase(
    pp,
    mortgage.downPaymentPct,
    assumptions.closingCostsBuyPct
  )

  const rows = []
  let cumulativeCashFlow = 0

  for (let year = 1; year <= years; year++) {
    const y = calcYearProjection(year, state, amortSchedule)

    cumulativeCashFlow += y.annualCashFlow

    // Initial equity = down payment
    const initialEquity = downPaymentDollar
    const equityGain = y.equity - initialEquity

    // Financial Performance
    const capRate = pp > 0 ? y.noi / pp : 0
    const coc = totalCashRequired > 0 ? y.annualCashFlow / totalCashRequired : 0
    const roe = y.equity > 0 ? y.annualCashFlow / y.equity : 0

    const roi =
      totalCashRequired > 0 ? (cumulativeCashFlow + equityGain) / totalCashRequired : 0
    const apy = year > 0 ? Math.pow(1 + roi, 1 / year) - 1 : 0

    rows.push({
      ...y,
      cumulativeCashFlow,
      equityGain,
      capRate,
      coc,
      roe,
      roi,
      apy,
    })
  }

  // IRR for each year (as a running IRR up to that year, including equity exit)
  // Also compute the full IRR array
  const irrByYear = calcIRRByYear(rows, totalCashRequired, state)
  rows.forEach((r, i) => {
    r.irr = irrByYear[i]
  })

  return rows
}

// ─── IRR ──────────────────────────────────────────────────────────────────────

function calcIRR(cashflows, guess = 0.1) {
  // Newton-Raphson
  if (cashflows.length < 2) return 0
  let rate = guess
  for (let iter = 0; iter < 200; iter++) {
    let npv = 0
    let dnpv = 0
    for (let i = 0; i < cashflows.length; i++) {
      const pv = cashflows[i] / Math.pow(1 + rate, i)
      npv += pv
      dnpv -= i * cashflows[i] / Math.pow(1 + rate, i + 1)
    }
    if (Math.abs(npv) < 1e-6) break
    if (Math.abs(dnpv) < 1e-10) break
    rate = rate - npv / dnpv
    if (rate <= -1) rate = -0.9999
    if (!isFinite(rate) || isNaN(rate)) return null
  }
  if (!isFinite(rate) || isNaN(rate)) return null
  if (Math.abs(rate) > 10) return null
  return rate
}

function calcIRRByYear(rows, totalCashRequired, state) {
  const { purchase, assumptions } = state
  const pp = purchase.purchasePrice

  return rows.map((row, i) => {
    // cash flows: [-totalCash, CF1, CF2, ..., CFn + equityAtExit - sellCosts]
    const sellCosts = row.propertyValue * (assumptions.closingCostsSellPct / 100)
    const terminalValue = row.annualCashFlow + row.equity - sellCosts

    const cfs = [-totalCashRequired]
    for (let j = 0; j < i; j++) {
      cfs.push(rows[j].annualCashFlow)
    }
    cfs.push(terminalValue)

    // Try multiple starting points to find valid IRR
    const guesses = [0.05, 0.1, 0.15, 0.2, 0.25, 0.02, -0.05]
    for (const g of guesses) {
      const irr = calcIRR(cfs, g)
      if (irr !== null && isFinite(irr) && irr > -1 && irr < 10) {
        return irr
      }
    }
    return null
  })
}

// ─── KPI Summary ─────────────────────────────────────────────────────────────

export function calcKPISummary(state) {
  const { purchase, mortgage, assumptions } = state
  const pp = purchase.purchasePrice
  const { totalCashRequired } = calcCashToPurchase(
    pp,
    mortgage.downPaymentPct,
    assumptions.closingCostsBuyPct
  )

  const { loanAmount } = calcMortgage(
    pp,
    mortgage.downPaymentPct,
    mortgage.interestRate,
    mortgage.loanTermYears
  )
  const amortSchedule = buildAmortizationSchedule(loanAmount, mortgage.interestRate, 30)

  const year1 = calcYearProjection(1, state, amortSchedule)
  const year5 = calcYearProjection(5, state, amortSchedule)

  const capRate = pp > 0 ? year1.noi / pp : 0
  const coc = totalCashRequired > 0 ? year1.annualCashFlow / totalCashRequired : 0
  const equity5 = year5.equity

  return { capRate, coc, equity5, annualCashFlow1: year1.annualCashFlow, monthlyCashFlow1: year1.monthlyCashFlow }
}

// ─── Default State ────────────────────────────────────────────────────────────

export const DEFAULT_STATE = {
  meta: {
    id: null,
    simulationName: '',
    propertyAddress: '',
    propertyType: 'Single Family',
    notes: '',
    savedAt: null,
  },
  purchase: {
    propertyValueEst: 450000,
    purchasePrice: 450000,
  },
  mortgage: {
    interestRate: 7.5,
    downPaymentPct: 100,
    loanTermYears: 30,
  },
  assumptions: {
    monthlyRent: 3200,
    vacancyPct: 4,
    maintenanceReservePct: 4,
    managementFeePct: 0,
    monthlyPropertyTax: 585,
    monthlyInsurance: 50,
    monthlyHOA: 50,
    monthlyUtilities: 0,
    monthlyMisc: 0,
    rentalIncreaseRatePct: 3,
    propertyTaxIncreaseRatePct: 1,
    utilitiesIncreaseRatePct: 0,
    miscIncreaseRatePct: 3,
    buildingToLandRatioPct: 80,
    appreciationRatePct: 1,
    closingCostsBuyPct: 5,
    closingCostsSellPct: 0,
  },
}
