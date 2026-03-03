export interface LoanInput {
  label: string;
  balance: number;   
  interestRate: number;  
  minimumPayment: number;
}

export interface MonthSnapshot {
  month: number;
  label: string;
  totalDebt: number;
  loans: { label: string; balance: number }[];
  interestPaid: number;
  principalPaid: number;
}

export interface RepaymentResult {
  strategy: "avalanche" | "snowball";
  monthlyPayment: number;
  totalInterestPaid: number;
  totalPaid: number;
  monthsToPayoff: number;
  payoffDate: string;  
  schedule: MonthSnapshot[];
  explanation: string;
}

const MAX_MONTHS = 600;

function formatMonthLabel(startDate: Date, offset: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * @param loans
 * @param monthlyBudget
 * @param strategy     
 */
export function calculateRepayment(
  loans: LoanInput[],
  monthlyBudget: number,
  strategy: "avalanche" | "snowball"
): RepaymentResult {
  let remaining = loans.map((l) => ({
    label: l.label,
    balance: l.balance,
    monthlyRate: l.interestRate / 100 / 12,
    minimumPayment: l.minimumPayment,
  }));

  const totalMinimums = remaining.reduce((s, l) => s + l.minimumPayment, 0);
  const extraBudget = Math.max(monthlyBudget - totalMinimums, 0);

  const schedule: MonthSnapshot[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const startDate = new Date();

  for (let month = 1; month <= MAX_MONTHS; month++) {
    remaining = remaining.filter((l) => l.balance > 0.01);
    if (remaining.length === 0) break;

    let monthInterest = 0;
    for (const loan of remaining) {
      const interest = loan.balance * loan.monthlyRate;
      loan.balance += interest;
      monthInterest += interest;
    }
    totalInterestPaid += monthInterest;

    let monthPrincipal = 0;
    for (const loan of remaining) {
      const payment = Math.min(loan.minimumPayment, loan.balance);
      loan.balance -= payment;
      monthPrincipal += payment;
    }
    totalPaid += monthPrincipal + monthInterest;

    let extra = extraBudget;

    const sorted = [...remaining].filter((l) => l.balance > 0.01);
    if (strategy === "avalanche") {
      sorted.sort((a, b) => b.monthlyRate - a.monthlyRate); // highest APR first
    } else {
      sorted.sort((a, b) => a.balance - b.balance); // smallest balance first
    }

    for (const target of sorted) {
      if (extra <= 0) break;
      const loan = remaining.find((l) => l.label === target.label);
      if (!loan || loan.balance <= 0.01) continue;
      const payment = Math.min(extra, loan.balance);
      loan.balance -= payment;
      extra -= payment;
      totalPaid += payment;
    }

    const totalDebt = remaining.reduce((s, l) => s + Math.max(l.balance, 0), 0);
    schedule.push({
      month,
      label: formatMonthLabel(startDate, month - 1),
      totalDebt: Math.round(totalDebt),
      loans: remaining.map((l) => ({
        label: l.label,
        balance: Math.round(Math.max(l.balance, 0)),
      })),
      interestPaid: Math.round(monthInterest),
      principalPaid: Math.round(monthPrincipal),
    });
  }

  const monthsToPayoff = schedule.length;
  const payoffDate = formatMonthLabel(startDate, monthsToPayoff);

  const explanation = buildExplanation(
    strategy,
    loans,
    monthlyBudget,
    totalMinimums,
    extraBudget,
    Math.round(totalInterestPaid),
    monthsToPayoff,
    payoffDate
  );

  return {
    strategy,
    monthlyPayment: monthlyBudget,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalPaid: Math.round(totalPaid),
    monthsToPayoff,
    payoffDate,
    schedule,
    explanation,
  };
}

export function compareStrategies(
  loans: LoanInput[],
  monthlyBudget: number
): { avalanche: RepaymentResult; snowball: RepaymentResult } {
  return {
    avalanche: calculateRepayment(loans, monthlyBudget, "avalanche"),
    snowball: calculateRepayment(loans, monthlyBudget, "snowball"),
  };
}

function buildExplanation(
  strategy: "avalanche" | "snowball",
  loans: LoanInput[],
  monthlyBudget: number,
  totalMinimums: number,
  extraBudget: number,
  totalInterest: number,
  months: number,
  payoffDate: string
): string {
  if (strategy === "avalanche") {
    const highestRate = [...loans].sort((a, b) => b.interestRate - a.interestRate)[0];
    return (
      `The Avalanche strategy directs your extra LKR ${extraBudget.toLocaleString()} ` +
      `each month to the loan with the highest interest rate — currently "${highestRate.label}" ` +
      `at ${highestRate.interestRate}% APR. Once that is eliminated, the freed-up payment ` +
      `cascades to the next highest-rate loan. This minimises the total interest you pay ` +
      `over the life of your debt. With a monthly budget of LKR ${monthlyBudget.toLocaleString()} ` +
      `(LKR ${totalMinimums.toLocaleString()} in minimums + LKR ${extraBudget.toLocaleString()} extra), ` +
      `you will be debt-free by ${payoffDate} — ${months} months from now — ` +
      `having paid LKR ${totalInterest.toLocaleString()} in total interest.`
    );
  } else {
    const smallest = [...loans].sort((a, b) => a.balance - b.balance)[0];
    return (
      `The Snowball strategy targets the loan with the smallest balance first — ` +
      `"${smallest.label}" at LKR ${smallest.balance.toLocaleString()}. ` +
      `Paying it off quickly gives you a psychological win and frees up its minimum ` +
      `payment to roll into the next debt. This approach may cost slightly more in ` +
      `interest than the Avalanche method, but many people find it easier to stay ` +
      `motivated. With a monthly budget of LKR ${monthlyBudget.toLocaleString()}, ` +
      `you will be debt-free by ${payoffDate} — ${months} months from now — ` +
      `having paid LKR ${totalInterest.toLocaleString()} in total interest.`
    );
  }
}