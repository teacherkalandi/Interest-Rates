import React, { useState, useMemo, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

// Complete POSB Scheme Parameters matching ACFROG~1_2.PDF (w.e.f 01.04.2026 to 30.06.2026)
const INITIAL_SCHEME_DATA = [
  {
    id: 'SCSS',
    name: 'Senior Citizen Savings Scheme',
    hindiName: 'वरिष्ठ नागरिक बचत योजना',
    rate: 8.2,
    tenure: '5 Years',
    minDeposit: 1000,
    maxDeposit: 3000000,
    compounding: 'Quarterly Payout',
    taxSaving: 'Yes (Section 80C)',
    suitability: 'Senior Citizens seeking safe quarterly passive income with sovereign security.',
    eligibility: 'Individuals aged 60+ (or 55+ for retired/VRS employees under specific conditions).',
    color: 'from-red-600 to-rose-700',
    type: 'Lump Sum'
  },
  {
    id: 'SSA',
    name: 'Sukanya Samriddhi Yojana Account',
    hindiName: 'सुकन्या समृद्धि खाता',
    rate: 8.2,
    tenure: '21 Years (Deposits for 15 Years)',
    minDeposit: 250,
    maxDeposit: 150000,
    compounding: 'Annually Compounded',
    taxSaving: 'Yes (EEE - Exempt under Sec 80C)',
    suitability: 'Parents saving for a girl child\'s future education and wedding needs with zero tax liabilities.',
    eligibility: 'Parents or legal guardians of a girl child below 10 years of age.',
    color: 'from-amber-500 to-orange-600',
    type: 'Flexible'
  },
  {
    id: 'NSC',
    name: 'National Savings Certificate',
    hindiName: 'राष्ट्रीय बचत पत्र',
    rate: 7.7,
    tenure: '5 Years',
    minDeposit: 1000,
    maxDeposit: Infinity,
    compounding: 'Annually Compounded',
    taxSaving: 'Yes (Section 80C)',
    suitability: 'Tax-savers seeking risk-free fixed income compounding with guaranteed returns.',
    eligibility: 'All resident adult individuals (singly, jointly, or on behalf of minors).',
    color: 'from-blue-600 to-indigo-700',
    type: 'Lump Sum'
  },
  {
    id: 'KVP',
    name: 'Kisan Vikas Patra',
    hindiName: 'किसान विकास पत्र',
    rate: 7.5,
    tenure: '9 Years 7 Months (115 Months)',
    minDeposit: 1000,
    maxDeposit: Infinity,
    compounding: 'Annually Compounded (Doubles Capital)',
    taxSaving: 'No',
    suitability: 'Investors wanting to double their principal capital with complete sovereign backing.',
    eligibility: 'All resident individuals.',
    color: 'from-emerald-600 to-teal-700',
    type: 'Lump Sum'
  },
  {
    id: 'TD5',
    name: '5 Year Time Deposit',
    hindiName: '5 वर्षीय सावधि जमा',
    rate: 7.5,
    tenure: '5 Years',
    minDeposit: 1000,
    maxDeposit: Infinity,
    compounding: 'Quarterly Compounded, Paid Annually',
    taxSaving: 'Yes (Section 80C)',
    suitability: 'Fixed return seeker wanting annual payouts while availing Income Tax rebates.',
    eligibility: 'All individual categories including guardians of minors.',
    color: 'from-red-700 to-red-900',
    type: 'Lump Sum'
  },
  {
    id: 'MIS',
    name: 'Monthly Income Scheme',
    hindiName: 'मासिक आय योजना',
    rate: 7.4,
    tenure: '5 Years',
    minDeposit: 1000,
    maxDeposit: 900000, // Up to 15 Lakhs for Joint
    compounding: 'Monthly Payout',
    taxSaving: 'No',
    suitability: 'Retirees or passive income seeking individuals who want guaranteed monthly payouts.',
    eligibility: 'Singly up to ₹9 Lakhs, Jointly up to ₹15 Lakhs.',
    color: 'from-purple-600 to-violet-700',
    type: 'Lump Sum'
  },
  {
    id: 'PPF',
    name: 'Public Provident Fund',
    hindiName: 'लोक भविष्य निधि',
    rate: 7.1,
    tenure: '15 Years',
    minDeposit: 500,
    maxDeposit: 150000,
    compounding: 'Annually Compounded',
    taxSaving: 'Yes (EEE - Exempt under Sec 80C)',
    suitability: 'Long-term secure retirement corpus builder with best tax saving parameters.',
    eligibility: 'All resident Indian citizens (one account per citizen).',
    color: 'from-sky-600 to-blue-700',
    type: 'Flexible'
  },
  {
    id: 'TD3',
    name: '3 Year Time Deposit',
    hindiName: '3 वर्षीय सावधि जमा',
    rate: 7.1,
    tenure: '3 Years',
    minDeposit: 1000,
    maxDeposit: Infinity,
    compounding: 'Quarterly Compounded, Paid Annually',
    taxSaving: 'No',
    suitability: 'Medium-term secure locking of capital with guaranteed annual income yield.',
    eligibility: 'All individual categories.',
    color: 'from-amber-600 to-yellow-700',
    type: 'Lump Sum'
  },
  {
    id: 'TD2',
    name: '2 Year Time Deposit',
    hindiName: '2 वर्षीय सावधि जमा',
    rate: 7.0,
    tenure: '2 Years',
    minDeposit: 1000,
    maxDeposit: Infinity,
    compounding: 'Quarterly Compounded, Paid Annually',
    taxSaving: 'No',
    suitability: 'Safe short-to-medium term fixed capital growth.',
    eligibility: 'All individual categories.',
    color: 'from-amber-700 to-orange-700',
    type: 'Lump Sum'
  },
  {
    id: 'TD1',
    name: '1 Year Time Deposit',
    hindiName: '1 वर्षीय सावधि जमा',
    rate: 6.9,
    tenure: '1 Year',
    minDeposit: 1000,
    maxDeposit: Infinity,
    compounding: 'Quarterly Compounded, Paid Annually',
    taxSaving: 'No',
    suitability: 'Extremely safe alternative to short-term commercial bank fixed deposits.',
    eligibility: 'All individual categories.',
    color: 'from-amber-800 to-amber-900',
    type: 'Lump Sum'
  },
  {
    id: 'RD',
    name: 'Recurring Deposit',
    hindiName: 'आवर्ती जमा खाता',
    rate: 6.7,
    tenure: '5 Years',
    minDeposit: 100,
    maxDeposit: Infinity,
    compounding: 'Quarterly Compounded',
    taxSaving: 'No',
    suitability: 'Small-ticket monthly savers looking to accumulate capital systematically.',
    eligibility: 'All individuals, jointly, or guardians.',
    color: 'from-fuchsia-600 to-pink-700',
    type: 'Monthly'
  },
  {
    id: 'SB',
    name: 'Savings Account',
    hindiName: 'बचत खाता',
    rate: 4.0,
    tenure: 'Flexible',
    minDeposit: 500,
    maxDeposit: Infinity,
    compounding: 'Annually Credited',
    taxSaving: 'Yes (Sec 80TTA up to ₹10,000)',
    suitability: 'Everyday cash liquidity with dynamic safe deposit capability.',
    eligibility: 'All individual citizens.',
    color: 'from-gray-600 to-slate-700',
    type: 'Flexible'
  }
];

// Detailed scheme rules extracted from official documents
const SCHEME_DETAILS_DATA: Record<string, Record<string, string[]>> = {
  SCSS: {
    "Who Can Open": [
      "An individual above 60 years of age.",
      "Retired Civilian Employees above 55 years and below 60 years of age, subject to condition that investment to be made within 3 month of receipt of retirement benefits.",
      "Retired Defense Employees above 50 years and below 60 years of age, subject to condition that investment to be made within 3 month of receipt of retirement benefits.",
      "Account can be opened as individual capacity or jointly with spouse only."
    ],
    "Deposit Rules": [
      "Minimum deposit shall be Rs. 1000 and in multiple of 1000, subject to maximum limit up to Rs. 30 lakh in all SCSS accounts.",
      "Investment under this scheme qualifies for the benefit of section 80C of Income Tax Act, 1961."
    ],
    "Interest": [
      "Interest Rate for Senior Citizen Savings Scheme (SCSS) is 8.2% per annum.",
      "Interest shall be payable on quarterly basis and applicable from the date of deposit to 31st March/ 30th June/ 30th September/ 31st December.",
      "Interest is taxable if total interest in all SCSS accounts exceeds Rs.50,000/- in a financial year and TDS at the prescribed rate shall be deducted."
    ],
    "Premature Closure": [
      "Account can be prematurely closed any time after date of opening.",
      "If closed before 1 year, no interest will be payable and if any interest paid in account shall be recovered from principle.",
      "If closed after 1 year but before 2 year, an amount equal to 1.5 % will be deducted from principal amount.",
      "If closed after 2 year but before 5 year, an amount equal to 1 % will be deducted from principal amount."
    ],
    "Account Closure on Maturity & Extension": [
      "Account may be closed after 5 year from the date of opening by submitting prescribed application form.",
      "Account holder may extend the account for block period for 3 years from the date of maturity."
    ]
  },
  SSA: {
    "Who Can Open": [
      "By the guardian in the name of girl child below the age of 10 years.",
      "Only one account can be opened in India either in Post Office or in any bank in the name of a girl child.",
      "This account can be opened for maximum of two girls in a family (Provided in case of twins/triplets girls birth more than two accounts can be opened)."
    ],
    "Deposit Rules": [
      "Account can be opened with minimum initial deposit Rs. 250.",
      "Minimum deposit in a FY is Rs. 250 and maximum deposit can be made up to Rs. 1.50 lakh in a FY.",
      "Deposits qualify for deduction under section 80C of Income Tax Act."
    ],
    "Interest": [
      "Rate of interest 8.2% Per Annum, calculated on yearly basis, Yearly compounded.",
      "Interest shall be calculated for the calendar month on the lowest balance in the account between the close of the fifth day and the end of the month.",
      "Interest earned is tax free under Income Tax Act."
    ],
    "Withdrawal": [
      "Withdrawal may be taken from account after girl child attains age of 18 or passed 10th standard.",
      "withdrawal may be taken up to 50% of balance available at the end of preceding F.Y."
    ],
    "Premature Closure & Maturity": [
      "May be prematurely closed after 5 years of account opening on extreme compassionate grounds (life threatening disease, death of guardian).",
      "Closure on maturity: After 21 years from the date of account opening.",
      "Or at the time of marriage of girl child after attaining age of 18years (1 month before or 3 month after date of marriage)."
    ]
  },
  NSC: {
    "Who Can Open": [
      "A single adult",
      "Joint Account (up to 3 adults)",
      "A guardian on behalf of minor or on behalf of person of unsound mind",
      "A minor above 10 years in his own name."
    ],
    "Deposit Rules": [
      "Minimum Rs. 1000 and in multiple of Rs. 100. No maximum limit.",
      "Any number of accounts can be opened under the scheme.",
      "Deposits qualify for deduction under section 80C of Income Tax Act."
    ],
    "Interest & Maturity": [
      "Interest rate:- 7.7 % compounded annually but payable at maturity.",
      "The deposit shall mature on completion of five years from the date of the deposit."
    ],
    "Pledging & Premature Closure": [
      "NSC may be pledged or transferred as security to the President of India/Governor of the State, RBI/Scheduled Bank, Corporation, Housing finance company.",
      "NSC may not be prematurely closed before 5 years except following conditions: on the death of a single account, on forfeiture by a pledgee, or on order by court."
    ]
  },
  KVP: {
    "Who Can Open": [
      "A single adult",
      "Joint Account (up to 3 adults)",
      "A guardian on behalf of minor or on behalf of person of unsound mind",
      "A minor above 10 years in his own name."
    ],
    "Deposit Rules": [
      "Minimum Rs. 1000 and in multiple of Rs. 100. No maximum limit.",
      "Any number of accounts can be opened under the scheme."
    ],
    "Interest & Maturity": [
      "7.5 % compounded annually.",
      "Amount Invested doubles in 115 months (9 years & 7 months).",
      "The deposit shall mature on the maturity period prescribed by the Ministry of Finance from time to time as applicable on the date of deposit."
    ],
    "Premature Closure & Pledging": [
      "KVP may be pledged or transferred as security to RBI/Scheduled Bank, Housing finance company, etc.",
      "KVP may be prematurely closed any time before maturity subject to conditions: on death of account holder, forfeiture by pledgee, order by court, or after 2 years and 6 months from the date of deposit."
    ]
  },
  MIS: {
    "Who Can Open": [
      "A single adult",
      "Joint Account (up to 3 adults) (Joint A or Joint B)",
      "A guardian on behalf of minor/ person of unsound mind",
      "A minor above 10 years in his own name."
    ],
    "Deposit Rules": [
      "Account can be opened with minimum of Rs. 1000 and in multiple of Rs. 1000.",
      "A maximum of Rs. 9 lakh can be deposited in a single account and 15 lakh in Joint account."
    ],
    "Interest": [
      "Interest rate is 7.4 % per annum payable monthly.",
      "Interest can be drawn through auto credit into savings account standing at same post office, or ECS.",
      "Interest is taxable in the hand of depositor."
    ],
    "Premature Closure": [
      "No deposit shall be withdrawn before the expiry of 1 year from the date of deposit.",
      "If account is closed after 1 year and before 3 year from the date of account opening, a deduction equal to 2% from the principal will be deducted.",
      "If account closed after 3 year and before 5 year from the date of account opening, a deduction equal to 1% from the principal will be deducted."
    ],
    "Maturity": [
      "Account may be closed on expiry of 5 years from the date of opening."
    ]
  },
  PPF: {
    "Who Can Open": [
      "A single adult by a resident Indian.",
      "A guardian on behalf of minor/ person of unsound mind.",
      "Only one account can be opened all across the country either in Post Office or any Bank."
    ],
    "Deposit Rules": [
      "Minimum deposit Rs. 500 in a Financial Year and Maximum deposit is Rs. 1.50 lakh in a FY.",
      "Amount can be deposited in any number of instalments in a FY in multiple of Rs. 50.",
      "Deposits qualify for deduction under section 80C of Income Tax Act."
    ],
    "Interest": [
      "Interest rate for PPF is 7.1 % per annum (compounded yearly).",
      "The interest shall be calculated for the calendar month on the lowest balance in the account between the close of the fifth day and the end of the month.",
      "Interest earned is tax free under Income Tax Act."
    ],
    "Withdrawal & Loan": [
      "Loan can be taken after the expiry of one year from the end of the FY in which the initial subscription was made.",
      "A subscriber can take 1 withdrawal during a financial year after five years excluding year of account opening."
    ],
    "Maturity & Extension": [
      "Account will be maturity after 15 F.Y. years excluding FY of account opening.",
      "Can retain maturity value in his/her account further without deposit, the PPF interest rate will be applicable.",
      "Can extend his/her account for further block of 5 years and so on with deposits."
    ]
  },
  RD: {
    "Who Can Open": [
      "A single adult",
      "Joint Account (up to 3 adults) (Joint A or Joint B)",
      "A guardian on behalf of minor",
      "A minor above 10 years in his own name."
    ],
    "Deposits & Default": [
      "Minimum Amount for monthly deposit is Rs. 100 and above minimum in multiple of Rs. 10. No maximum limit.",
      "If subsequent deposit is not made up to the prescribed day for a month, a default @ 1 rupee shall be charged for 100 rupee denomination.",
      "Rebate on advance deposit of at least 6 instalments (inclusive of month of deposit)."
    ],
    "Interest": [
      "6.7 % per annum (quarterly compounded)."
    ],
    "Loan": [
      "After 12 instalments deposited and account is continued for 1 year not discontinued depositor may avail loan facility up to 50% of the balance credit in the account."
    ],
    "Premature Closure & Maturity": [
      "RD Account can be closed prematurely after 3 years from the date of account opening.",
      "Maturity: 5 years (60 monthly deposits) from the date of opening.",
      "Account can be extended for further 5 years by giving application."
    ]
  },
  SB: {
    "Who Can Open": [
      "A single adult",
      "three adults only (Joint A or Joint B)",
      "A guardian on behalf of minor",
      "A minor above 10 years in his own name."
    ],
    "Deposit & Withdrawal": [
      "Minimum deposit amount: - Rs. 500",
      "Minimum withdrawal amount: - Rs. 50",
      "In case account balance not raised to Rs. 500 at the end of financial year Rs. 50 will be deducted as Account Maintenance Fee."
    ],
    "Interest": [
      "4% per annum.",
      "Interest will be calculated on the basis of minimum balance between 10th of the month and end of the month and allowed in whole rupees only.",
      "Interest up to Rs. 10,000 earned in a Financial Year is exempted from taxable Income."
    ],
    "Additional Facilities & Dormancy": [
      "To avail below facilities on your PO Savings Account: Cheque book, ATM Card, ebanking/mobile banking, Aadhaar Seeding.",
      "If no deposit/withdrawal takes place in an account during continuous three financial years, the account shall be treated as silent/dormant."
    ]
  }
};

SCHEME_DETAILS_DATA.TD5 = SCHEME_DETAILS_DATA.TD3 = SCHEME_DETAILS_DATA.TD2 = SCHEME_DETAILS_DATA.TD1 = {
  "Who Can Open": [
    "A single adult",
    "Joint Account (up to 3 adults) (Joint A or Joint B)",
    "A guardian on behalf of minor",
    "A minor above 10 years in his own name."
  ],
  "Deposit Rules": [
    "Account can be opened with minimum of Rs. 1000 and in multiple of Rs. 100. No maximum limit for investment.",
    "The investment under 5 year TD qualifies for the benefit of section 80C of Income Tax Act, 1961."
  ],
  "Interest Rate & Payment": [
    "1 year TD: 6.9 %, 2 year TD: 7.0 %, 3 year TD: 7.1 %, 5 Year TD: 7.5 %.",
    "Interest shall be payable annually, No additional interest shall be payable on the amount of interest that has become due for payment."
  ],
  "Premature Closure": [
    "No deposit shall be withdrawn before the expiry of six months from the date of deposit.",
    "If TD account closed after 6 month but before 1 year, PO Savings Account Interest rate will be applicable.",
    "If TD account prematurely closed after 1 year, interest shall be calculated 2 % less than of TD interest rate (i.e. 1/2/3 years) for completed years."
  ],
  "Maturity & Extension": [
    "Deposit amount shall be repayable after expiry of 1 year, 2 year, 3 year, 5 year from the date of opening.",
    "TD account can be extended from date of maturity within the following prescribed period. 1 year TD = within 6 months. 2 year TD = within 12 months. 3/5 year TD = within 18 months."
  ]
};

export default function App() {
  const [schemes, setSchemes] = useState(INITIAL_SCHEME_DATA);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });

    const unsubscribeRates = onSnapshot(doc(db, 'settings', 'rates'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.schemes) {
          setSchemes(data.schemes);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRates();
    };
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTax, setFilterTax] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Input states for custom calculations
  const [selectedSchemeId, setSelectedSchemeId] = useState('RD');
  const [selectedRuleScheme, setSelectedRuleScheme] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [rdTenureYears, setRdTenureYears] = useState(5); // Supports standard (5) or extended (6 to 10)
  const [ppfSsaMode, setPpfSsaMode] = useState('monthly'); // 'monthly' or 'yearly'
  const [reinvestmentCombo, setReinvestmentCombo] = useState('none'); // 'none', 'MIS_RD', 'SCSS_RD'

  // Advisor tool states
  const [advisorProfile, setAdvisorProfile] = useState('General');
  const [advisorGoal, setAdvisorGoal] = useState('Wealth');

  // Localized Currency Formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const computations = useMemo(() => {
    // 1. RD Compounding & Extensions
    const calculateRD = (monthlyInstallment: number, years: number, ratePct: number) => {
      const r = ratePct / 100;
      const q = r / 4; // Quarterly compounding
      const w = Math.pow(1 + q, 1 / 3); // Equivalent monthly rate factor
      const totalMonths = years * 12;
      
      const maturityValueFor100 = 100 * w * (Math.pow(w, totalMonths) - 1) / (w - 1);
      const total = maturityValueFor100 * (monthlyInstallment / 100);
      const invested = monthlyInstallment * 12 * years;
      
      return { invested, interest: total - invested, total };
    };

    // 2. Time Deposits
    const calculateTD = (principal: number, typeCode: string, ratePct: number) => {
      const r = ratePct / 100;
      const annualInterestFactor = Math.pow(1 + (r / 4), 4) - 1;
      
      let years = 1;
      if (typeCode === 'TD2') years = 2;
      else if (typeCode === 'TD3') years = 3;
      else if (typeCode === 'TD5') years = 5;

      const annualPayout = principal * annualInterestFactor;
      const totalInterest = annualPayout * years;
      return {
        invested: principal,
        interest: totalInterest,
        total: principal + totalInterest,
        annualPayout
      };
    };

    // 3. MIS
    const calculateMIS = (principal: number, ratePct: number) => {
      const monthlyPayout = principal * (ratePct / 100) / 12;
      const interest = monthlyPayout * 60; // 5 years
      return {
        invested: principal,
        interest,
        total: principal + interest,
        monthlyPayout
      };
    };

    // 4. SCSS
    const calculateSCSS = (principal: number, ratePct: number) => {
      const quarterlyPayout = principal * (ratePct / 100) / 4;
      const interest = quarterlyPayout * 20; // 5 years = 20 quarters
      return {
        invested: principal,
        interest,
        total: principal + interest,
        quarterlyPayout
      };
    };

    // 5. MIS + RD Reinvestment Combo
    const calculateMISRDCombo = (principal: number, misRatePct: number, rdRatePct: number) => {
      const monthlySweptAmount = principal * (misRatePct / 100) / 12;
      const rdCalc = calculateRD(monthlySweptAmount, 5, rdRatePct);
      return {
        invested: principal,
        interest: rdCalc.total,
        total: principal + rdCalc.total,
        monthlySweptAmount
      };
    };

    // 6. SCSS + RD Reinvestment Combo
    const calculateSCSSRDCombo = (principal: number, scssRatePct: number, rdRatePct: number) => {
      const quarterlySweptAmount = principal * (scssRatePct / 100) / 4;
      const monthlyEquivSweptAmount = quarterlySweptAmount / 3;
      const rdCalc = calculateRD(monthlyEquivSweptAmount, 5, rdRatePct);
      return {
        invested: principal,
        interest: rdCalc.total,
        total: principal + rdCalc.total,
        monthlyEquivSweptAmount
      };
    };

    // 7. NSC
    const calculateNSC = (principal: number, ratePct: number) => {
      const total = principal * Math.pow(1 + (ratePct / 100), 5);
      return {
        invested: principal,
        interest: total - principal,
        total
      };
    };

    // 8. KVP
    const calculateKVP = (principal: number, ratePct: number) => {
      return {
        invested: principal,
        interest: principal, // Doubles
        total: principal * 2
      };
    };

    // 9. PPF & SSA Compounding simulation
    const calculateLongTerm = (monthlyInstallment: number, yearlyLump: number, isSSA: boolean, ratePct: number) => {
      const activeMonthly = ppfSsaMode === 'monthly' ? monthlyInstallment : 0;
      const activeYearly = ppfSsaMode === 'yearly' ? yearlyLump : 0;
      
      const yearsCount = isSSA ? 21 : 15;
      const timeline = [];
      let tempBalance = 0;
      let tempInvested = 0;
      const rate = ratePct / 100;

      for (let y = 1; y <= yearsCount; y++) {
        let depositThisYear = 0;
        if (y <= 15) { // Both PPF and SSA deposits are capped at 15 years
          depositThisYear = ppfSsaMode === 'monthly' ? activeMonthly * 12 : activeYearly;
        }

        tempInvested += depositThisYear;
        
        let interestThisYear = 0;
        if (depositThisYear > 0) {
          if (ppfSsaMode === 'monthly') {
            let runningInterest = 0;
            for (let m = 1; m <= 12; m++) {
              runningInterest += (tempBalance + (activeMonthly * m)) * (rate / 12);
            }
            interestThisYear = runningInterest;
          } else {
            interestThisYear = (tempBalance + depositThisYear) * rate;
          }
        } else {
          interestThisYear = tempBalance * rate; // Earning on corpus without deposits
        }
        
        tempBalance += depositThisYear + interestThisYear;

        timeline.push({
          year: y,
          cumulativeInvested: tempInvested,
          closingBalance: tempBalance,
          interestThisYear: interestThisYear
        });
      }

      return {
        invested: tempInvested,
        interest: tempBalance - tempInvested,
        total: tempBalance,
        schedule: timeline
      };
    };

    const scheme = schemes.find((s: any) => s.id === selectedSchemeId) || schemes[0];
    let results: any = { invested: 0, interest: 0, total: 0, schedule: null, payoutDetails: null };

    const getRate = (id: string) => schemes.find((s: any) => s.id === id)?.rate || 0;

    if (reinvestmentCombo === 'MIS_RD' && selectedSchemeId === 'MIS') {
      const calc = calculateMISRDCombo(depositAmount, getRate('MIS'), getRate('RD'));
      results = {
        invested: calc.invested,
        interest: calc.interest,
        total: calc.total,
        payoutDetails: `Automatic monthly sweep of ${formatCurrency(calc.monthlySweptAmount)} into 5-Year RD`
      };
    } else if (reinvestmentCombo === 'SCSS_RD' && selectedSchemeId === 'SCSS') {
      const calc = calculateSCSSRDCombo(depositAmount, getRate('SCSS'), getRate('RD'));
      results = {
        invested: calc.invested,
        interest: calc.interest,
        total: calc.total,
        payoutDetails: `Monthly split sweep of ${formatCurrency(calc.monthlyEquivSweptAmount)} equivalent into 5-Year RD`
      };
    } else {
      switch (selectedSchemeId) {
        case 'SB':
          results = { invested: depositAmount, interest: depositAmount * (getRate('SB') / 100), total: depositAmount * (1 + getRate('SB') / 100) };
          break;
        case 'RD':
          results = calculateRD(monthlyContribution, rdTenureYears, getRate('RD'));
          break;
        case 'TD1':
        case 'TD2':
        case 'TD3':
        case 'TD5': {
          const calc = calculateTD(depositAmount, selectedSchemeId, getRate(selectedSchemeId));
          results = {
            invested: calc.invested,
            interest: calc.interest,
            total: calc.total,
            payoutDetails: `Annual interest credit of ${formatCurrency(calc.annualPayout)}`
          };
          break;
        }
        case 'MIS': {
          const calc = calculateMIS(depositAmount, getRate('MIS'));
          results = {
            invested: calc.invested,
            interest: calc.interest,
            total: calc.total,
            payoutDetails: `Guaranteed monthly payout of ${formatCurrency(calc.monthlyPayout)}`
          };
          break;
        }
        case 'SCSS': {
          const calc = calculateSCSS(depositAmount, getRate('SCSS'));
          results = {
            invested: calc.invested,
            interest: calc.interest,
            total: calc.total,
            payoutDetails: `Quarterly passive payout of ${formatCurrency(calc.quarterlyPayout)} (equivalent to ${formatCurrency(calc.quarterlyPayout / 3)} monthly)`
          };
          break;
        }
        case 'NSC':
          results = calculateNSC(depositAmount, getRate('NSC'));
          break;
        case 'KVP':
          results = calculateKVP(depositAmount, getRate('KVP'));
          break;
        case 'PPF': {
          const calc = calculateLongTerm(monthlyContribution, depositAmount, false, getRate('PPF'));
          results = { invested: calc.invested, interest: calc.interest, total: calc.total, schedule: calc.schedule };
          break;
        }
        case 'SSA': {
          const calc = calculateLongTerm(monthlyContribution, depositAmount, true, getRate('SSA'));
          results = { invested: calc.invested, interest: calc.interest, total: calc.total, schedule: calc.schedule };
          break;
        }
        default:
          break;
      }
    }

    return {
      ...results,
      scheme
    };
  }, [selectedSchemeId, depositAmount, monthlyContribution, rdTenureYears, ppfSsaMode, reinvestmentCombo, schemes]);

  const handleSaveRates = async () => {
    if (!adminUser) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'rates'), { schemes });
      alert('Rates saved to cloud successfully!');
    } catch (error: any) {
      alert('Failed to save rates: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s: any) => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTax = filterTax === 'All' || 
                       (filterTax === 'Tax Saving' && s.taxSaving.includes('Yes')) ||
                       (filterTax === 'Regular' && s.taxSaving === 'No');
      const matchType = filterType === 'All' || s.type === filterType;
      return matchSearch && matchTax && matchType;
    });
  }, [searchTerm, filterTax, filterType]);

  // Advisor matching logic
  const advisorRecommendations = useMemo(() => {
    let recommendations = [...schemes];
    if (advisorProfile === 'Senior') {
      recommendations = recommendations.filter(s => s.id === 'SCSS' || s.id.startsWith('TD') || s.id === 'MIS');
    } else if (advisorProfile === 'GirlChild') {
      recommendations = recommendations.filter(s => s.id === 'SSA' || s.id === 'PPF' || s.id === 'RD');
    }

    if (advisorGoal === 'MonthlyIncome') {
      recommendations = recommendations.filter(s => s.id === 'MIS' || s.id === 'SCSS' || s.id === 'SB');
    } else if (advisorGoal === 'TaxSaving') {
      recommendations = recommendations.filter(s => s.taxSaving.includes('Yes'));
    } else if (advisorGoal === 'ShortTerm') {
      recommendations = recommendations.filter(s => s.id === 'TD1' || s.id === 'TD2' || s.id === 'SB');
    } else if (advisorGoal === 'DoubleMoney') {
      recommendations = recommendations.filter(s => s.id === 'KVP' || s.id === 'NSC');
    }

    return recommendations.slice(0, 3);
  }, [advisorProfile, advisorGoal]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Header Banner - Mobile optimized with responsive padding */}
      <header className="bg-gradient-to-r from-red-700 via-red-800 to-rose-900 border-b-4 border-yellow-500 shadow-lg text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-red-900 text-xl border-2 border-white shadow-inner flex-shrink-0">
              ✉
            </div>
            <div>
              <span className="text-yellow-400 font-bold block text-[10px] tracking-widest font-mono">भारतीय डाक | INDIA POST</span>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5">
                POSB Financial Suite <span className="text-[9px] bg-red-600 px-2 py-0.5 rounded-full border border-red-500">2026 Q1</span>
              </h1>
            </div>
          </div>

          {/* Navigation with horizontal touch sliding on mobile screens */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none flex-shrink-0">
            <nav className="flex gap-1.5 bg-red-950/40 p-1.5 rounded-xl border border-red-500/10 min-w-max">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 sm:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-yellow-500 text-red-950 shadow-md' : 'hover:bg-red-800 text-slate-200'
                }`}
              >
                📊 Schemes
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-3 sm:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'calculator' ? 'bg-yellow-500 text-red-950 shadow-md' : 'hover:bg-red-800 text-slate-200'
                }`}
              >
                🧮 Calculator
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`px-3 sm:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'compare' ? 'bg-yellow-500 text-red-950 shadow-md' : 'hover:bg-red-800 text-slate-200'
                }`}
              >
                ⚖ Matrix
              </button>
              <button
                onClick={() => setActiveTab('advisor')}
                className={`px-3 sm:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'advisor' ? 'bg-yellow-500 text-red-950 shadow-md' : 'hover:bg-red-800 text-slate-200'
                }`}
              >
                💡 Advisor
              </button>
              <button
                onClick={() => {
                  setActiveTab('rules');
                  setSelectedRuleScheme(null);
                }}
                className={`px-3 sm:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'rules' ? 'bg-yellow-500 text-red-950 shadow-md' : 'hover:bg-red-800 text-slate-200'
                }`}
              >
                📖 Details
              </button>
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setSelectedRuleScheme(null);
                }}
                className={`px-3 sm:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'admin' ? 'bg-yellow-500 text-red-950 shadow-md' : 'hover:bg-red-800 text-slate-200'
                }`}
              >
                ⚙️ Admin
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Interactive Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {/* Internet Banking Alert Banner */}
        <div className="mb-4 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-xl md:text-2xl mt-0.5">🌐</span>
            <div>
              <p className="font-bold text-blue-900 text-sm">Internet &amp; Mobile Banking Support</p>
              <p className="text-xs text-blue-700">Link your Post Office Savings Account at your nearest branch. Official POSB IFSC: <span className="font-mono bg-blue-100 px-1 py-0.5 rounded font-bold">IPOS0000DOP</span></p>
            </div>
          </div>
          <a
            href="https://ebanking.indiapost.gov.in"
            target="_blank"
            rel="noreferrer"
            className="w-full md:w-auto text-center bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded shadow hover:bg-blue-700 transition"
          >
            Launch Portal &rarr;
          </a>
        </div>

        {/* ==================== TAB 1: SCHEMES DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Filtering Control Bar */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-slate-200 flex flex-col md:flex-row items-stretch justify-between gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search scheme name or code (e.g. SSA, NSC)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <span className="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
              </div>

              <div className="grid grid-cols-2 gap-2 md:flex">
                <select
                  value={filterTax}
                  onChange={(e) => setFilterTax(e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="All">All Tax Classes</option>
                  <option value="Tax Saving">Section 80C Compliant</option>
                  <option value="Regular">Regular (Non-Rebate)</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="All">All Durations</option>
                  <option value="Lump Sum">Lump Sum (One-time)</option>
                  <option value="Monthly">Monthly SIP</option>
                  <option value="Flexible">Flexible/Yearly</option>
                </select>
              </div>
            </div>

            {/* Scheme Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredSchemes.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className={`bg-gradient-to-r ${s.color} p-4 text-white relative`}>
                      <span className="absolute right-4 top-4 text-2xl font-mono opacity-20 font-black tracking-widest">{s.id}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-yellow-300 block mb-1">{s.hindiName}</span>
                      <h3 className="font-black text-base leading-tight pr-12">{s.name}</h3>
                    </div>

                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-500 block">Annual Interest</span>
                        <span className="text-2xl font-extrabold text-red-700 tracking-tight">{s.rate}% <span className="text-xs font-normal text-slate-500">p.a.</span></span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Locking/Tenure</span>
                        <span className="text-xs font-bold text-slate-700">{s.tenure}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 text-xs text-slate-600">
                      <p className="italic text-slate-500 leading-relaxed">"{s.suitability}"</p>
                      
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Min Deposit</span>
                          <span className="font-bold text-slate-800">{formatCurrency(s.minDeposit)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Deposit</span>
                          <span className="font-bold text-slate-800">{s.maxDeposit === Infinity ? 'Unlimited' : formatCurrency(s.maxDeposit)}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Compounding Interval</span>
                        <span className="font-semibold text-slate-700">{s.compounding}</span>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Benefits (80C)</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.taxSaving.startsWith('Yes') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {s.taxSaving}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedSchemeId(s.id);
                        if (s.id === 'RD') setReinvestmentCombo('none');
                        setActiveTab('calculator');
                      }}
                      className="w-full bg-slate-800 text-white hover:bg-red-700 transition font-bold py-3 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      Calculate returns for {s.id} &rarr;
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRuleScheme(s);
                        setActiveTab('rules');
                      }}
                      className="w-full mt-2 bg-slate-200 text-slate-700 hover:bg-slate-300 transition font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5"
                    >
                      📖 View Scheme Rules
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: DETAILED RETURNING CALCULATOR ==================== */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            
            {/* Configuration side panel */}
            <div className="lg:col-span-5 space-y-4 md:space-y-6">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6">
                <h3 className="text-sm font-black text-slate-800 border-b pb-3 mb-4 uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                  🔧 Configuration Panel
                </h3>

                {/* Scheme dropdown selector */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Target Scheme</label>
                  <select
                    value={selectedSchemeId}
                    onChange={(e) => {
                      setSelectedSchemeId(e.target.value);
                      setReinvestmentCombo('none'); 
                    }}
                    className="w-full px-3 py-3 border border-slate-300 rounded-lg text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    {schemes.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.id} - {s.name} ({s.rate}%)</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic deposit bounds slider & input fields */}
                {computations.scheme.type === 'Monthly' ? (
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Monthly Installment Amount</label>
                    <span className="text-[10px] text-slate-400 block mb-2">Minimum value: {formatCurrency(computations.scheme.minDeposit)}</span>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={monthlyContribution || ''}
                        onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Lump Sum Deposit Amount</label>
                    <span className="text-[10px] text-slate-400 block mb-2">Bounds: {formatCurrency(computations.scheme.minDeposit)} to {computations.scheme.maxDeposit === Infinity ? 'Unlimited' : formatCurrency(computations.scheme.maxDeposit)}</span>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={depositAmount || ''}
                        onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                )}

                {/* RD tenure extension panel */}
                {selectedSchemeId === 'RD' && (
                  <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Tenure Extension Configuration</label>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>Standard 5 Years</span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono">{rdTenureYears} Years</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="10"
                      step="1"
                      value={rdTenureYears}
                      onChange={(e) => setRdTenureYears(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-700 my-4"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">India Post allows extension of matured RD accounts up to an additional 5 years compounding quarterly.</p>
                  </div>
                )}

                {/* PPF & Sukanya Contribution Mode Selector */}
                {(selectedSchemeId === 'PPF' || selectedSchemeId === 'SSA') && (
                  <div className="mb-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Deposit Frequency Mode</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={() => {
                          setPpfSsaMode('monthly');
                          setMonthlyContribution(1000);
                        }}
                        className={`py-2.5 md:py-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${ppfSsaMode === 'monthly' ? 'bg-red-700 text-white shadow-sm' : 'bg-white hover:bg-slate-200 text-slate-600 border'}`}
                      >
                        Monthly SIP
                      </button>
                      <button
                        onClick={() => {
                          setPpfSsaMode('yearly');
                          setDepositAmount(15000);
                        }}
                        className={`py-2.5 md:py-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${ppfSsaMode === 'yearly' ? 'bg-red-700 text-white shadow-sm' : 'bg-white hover:bg-slate-200 text-slate-600 border'}`}
                      >
                        Annual Lump Sum
                      </button>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      {ppfSsaMode === 'monthly' ? (
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1.5">Monthly Contribution Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-3.5 sm:top-2.5 text-slate-400 font-bold text-sm">₹</span>
                            <input
                              type="number"
                              pattern="[0-9]*"
                              inputMode="numeric"
                              value={monthlyContribution || ''}
                              onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)}
                              className="w-full pl-7 pr-3 py-3 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-red-600 font-bold"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1.5">Yearly Contribution Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-3.5 sm:top-2.5 text-slate-400 font-bold text-sm">₹</span>
                            <input
                              type="number"
                              pattern="[0-9]*"
                              inputMode="numeric"
                              value={depositAmount || ''}
                              onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                              className="w-full pl-7 pr-3 py-3 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-red-600 font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reinvestment Combination Selector */}
                {(selectedSchemeId === 'MIS' || selectedSchemeId === 'SCSS') && (
                  <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                    <h4 className="text-xs font-extrabold text-amber-900 uppercase block mb-1">💡 Supercharge Your Returns: Reinvestment Combo</h4>
                    <p className="text-[10px] text-amber-800 leading-relaxed mb-3">Sweep payouts automatically into a 5-Year Recurring Deposit (RD) at 6.7% for maximum wealth compounding.</p>
                    
                    {selectedSchemeId === 'MIS' && (
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={() => setReinvestmentCombo('none')}
                          className={`w-full py-3 sm:py-2.5 rounded-lg text-xs font-bold border transition ${reinvestmentCombo === 'none' ? 'bg-amber-600 text-white border-amber-600 shadow' : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'}`}
                        >
                          Standard MIS Payout
                        </button>
                        <button
                          onClick={() => setReinvestmentCombo('MIS_RD')}
                          className={`w-full py-3 sm:py-2.5 rounded-lg text-xs font-bold border transition ${reinvestmentCombo === 'MIS_RD' ? 'bg-amber-600 text-white border-amber-600 shadow' : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'}`}
                        >
                          MIS + RD Reinvestment
                        </button>
                      </div>
                    )}

                    {selectedSchemeId === 'SCSS' && (
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={() => setReinvestmentCombo('none')}
                          className={`w-full py-3 sm:py-2.5 rounded-lg text-xs font-bold border transition ${reinvestmentCombo === 'none' ? 'bg-amber-600 text-white border-amber-600 shadow' : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'}`}
                        >
                          Standard SCSS Payout
                        </button>
                        <button
                          onClick={() => setReinvestmentCombo('SCSS_RD')}
                          className={`w-full py-3 sm:py-2.5 rounded-lg text-xs font-bold border transition ${reinvestmentCombo === 'SCSS_RD' ? 'bg-amber-600 text-white border-amber-600 shadow' : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'}`}
                        >
                          SCSS + RD Sweep
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Analytical Performance Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className={`bg-gradient-to-r ${computations.scheme.color} p-4 text-white flex justify-between items-center`}>
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base leading-tight">Maturity Projections</h3>
                    <p className="text-[10px] opacity-80 uppercase tracking-widest">{computations.scheme.name} - {computations.scheme.rate}% p.a.</p>
                  </div>
                  {reinvestmentCombo !== 'none' && (
                    <span className="bg-yellow-400 text-red-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-yellow-300 shadow">
                      Combo
                    </span>
                  )}
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">Principal Invested</span>
                    <span className="text-base md:text-lg font-extrabold text-slate-800">{formatCurrency(computations.invested)}</span>
                  </div>
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                    <span className="text-[10px] text-red-400 uppercase font-black block mb-1">Accrued Interest</span>
                    <span className="text-base md:text-lg font-extrabold text-red-700">+{formatCurrency(computations.interest)}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-500 uppercase font-black block mb-1">Total Maturity</span>
                    <span className="text-lg md:text-xl font-black text-emerald-700">{formatCurrency(computations.total)}</span>
                  </div>
                </div>

                {computations.payoutDetails && (
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold">Accrued Plan / Payouts:</span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-black text-xs md:text-sm">{computations.payoutDetails}</span>
                  </div>
                )}

                <div className="p-4 md:p-6">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">Yield Proportions</span>
                  
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden flex relative border">
                    <div 
                      style={{ width: `${(computations.invested / computations.total) * 100}%` }}
                      className="bg-slate-400 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-500 truncate px-1"
                    >
                      {((computations.invested / computations.total) * 100).toFixed(0)}% Principal
                    </div>
                    <div 
                      style={{ width: `${(computations.interest / computations.total) * 100}%` }}
                      className="bg-red-600 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-500 truncate px-1"
                    >
                      {((computations.interest / computations.total) * 100).toFixed(0)}% Interest
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Schedule Matrix with swipe bounds for mobile */}
              {(selectedSchemeId === 'PPF' || selectedSchemeId === 'SSA') && computations.schedule && (
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2.5 mb-2 flex items-center justify-between">
                    <span>📅 Compounding Progression</span>
                    <span className="text-[9px] text-red-600 font-bold normal-case animate-pulse sm:hidden">Swipe Left to view →</span>
                  </h4>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto border rounded-xl">
                    <table className="w-full text-xs text-left min-w-[500px]">
                      <thead className="bg-slate-100 sticky top-0 border-b">
                        <tr>
                          <th className="p-3 text-slate-600 font-bold">Year No.</th>
                          <th className="p-3 text-slate-600 font-bold">Cumulative Deposit</th>
                          <th className="p-3 text-slate-600 font-bold">Interest Earned This Year</th>
                          <th className="p-3 text-slate-600 font-bold">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {computations.schedule.map((row) => (
                          <tr key={row.year} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-500">Year {row.year}</td>
                            <td className="p-3 font-medium text-slate-700">{formatCurrency(row.cumulativeInvested)}</td>
                            <td className="p-3 font-bold text-red-600 font-mono">+{formatCurrency(row.interestThisYear)}</td>
                            <td className="p-3 font-bold text-slate-800">{formatCurrency(row.closingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-3 leading-relaxed">* PPF &amp; SSA calculations assume deposits are credited prior to the 5th of each calendar month for optimal monthly ledger accruals.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: SCHEME COMPARISON MATRIX ==================== */}
        {activeTab === 'compare' && (
          <div className="space-y-4 md:space-y-6">
            
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-red-800 mb-1">
                  ⚖ Comparative Return Engine
                </h3>
                <p className="text-xs text-slate-500">Simulate final values across all 12 Indian Post Office schemes simultaneously.</p>
              </div>

              <div className="w-full md:w-1/3">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Target Deposit Principal</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-6">Visual Return Yield comparison for {formatCurrency(depositAmount)}</h4>
              
              <div className="space-y-4">
                {schemes.map((s: any) => {
                  // Dynamic comparative return profiles mapping
                  const p = depositAmount;
                  const r = s.rate / 100;
                  
                  let finalMaturity = depositAmount;
                  if (s.id === 'KVP') finalMaturity = depositAmount * 2;
                  else if (s.id === 'NSC') finalMaturity = p * Math.pow(1 + r, 5);
                  else if (s.id === 'SCSS') finalMaturity = p + (p * r * 5);
                  else if (s.id === 'MIS') finalMaturity = p + (p * r * 5);
                  else if (s.id === 'TD5') finalMaturity = p + p * (Math.pow(1 + r/4, 4) - 1) * 5;
                  else if (s.id === 'TD3') finalMaturity = p + p * (Math.pow(1 + r/4, 4) - 1) * 3;
                  else if (s.id === 'TD2') finalMaturity = p + p * (Math.pow(1 + r/4, 4) - 1) * 2;
                  else if (s.id === 'TD1') finalMaturity = p + p * (Math.pow(1 + r/4, 4) - 1) * 1;
                  else if (s.id === 'RD') {
                    // Approximate relative RD yield for comparison (Lump sum vs SIP isn't 1:1, but scale the equivalent factor by rate)
                    const rdQ = (r)/4;
                    const rdW = Math.pow(1 + rdQ, 1/3);
                    const rdMaturityMultiplier = (rdW * (Math.pow(rdW, 60) - 1) / (rdW - 1)) / 60;
                    finalMaturity = p * rdMaturityMultiplier;
                  }
                  else if (s.id === 'PPF') finalMaturity = p * Math.pow(1 + r, 15) * 0.55; // visual approximation factor
                  else if (s.id === 'SSA') finalMaturity = p * Math.pow(1 + r, 21) * 0.45; // visual approximation factor
                  else if (s.id === 'SB') finalMaturity = p * (1 + r);

                  const maxMaturity = p * 3.5;
                  const barWidth = Math.min(100, (finalMaturity / maxMaturity) * 100);

                  return (
                    <div key={s.id} className="group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-1.5 gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-black text-[10px]">{s.id}</span>
                          <span className="font-bold text-slate-700">{s.name}</span>
                          <span className="text-slate-400 font-mono">({s.rate}%)</span>
                        </div>
                        <div className="text-right font-black text-slate-800">
                          {formatCurrency(finalMaturity)}
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-6 rounded-md overflow-hidden relative border border-slate-200/50 flex items-center">
                        <div
                          style={{ width: `${barWidth}%` }}
                          className={`bg-gradient-to-r ${s.color} h-full transition-all duration-700 flex items-center justify-between px-3`}
                        >
                          <span className="text-[9px] text-white font-extrabold truncate">
                            +{formatCurrency(finalMaturity - depositAmount)}
                          </span>
                        </div>
                        {s.taxSaving.startsWith('Yes') && (
                          <span className="absolute right-2 text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase scale-90 sm:scale-100">
                            80C
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 4: SMART SAVINGS PLANNER / ADVISOR ==================== */}
        {activeTab === 'advisor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-red-800 border-b pb-3 mb-4">
                🧙 Advisor Settings
              </h3>

              <div className="mb-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-3">1. Primary Investor Profile</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="advisorProfile"
                      checked={advisorProfile === 'General'}
                      onChange={() => setAdvisorProfile('General')}
                      className="accent-red-700 h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">General Public</span>
                      <span className="text-[10px] text-slate-500">Below 60 years of age</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="advisorProfile"
                      checked={advisorProfile === 'Senior'}
                      onChange={() => setAdvisorProfile('Senior')}
                      className="accent-red-700 h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Senior Citizen</span>
                      <span className="text-[10px] text-slate-500">Age 60+ (or 55+ with retirement specs)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="advisorProfile"
                      checked={advisorProfile === 'GirlChild'}
                      onChange={() => setAdvisorProfile('GirlChild')}
                      className="accent-red-700 h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Girl Child Parent</span>
                      <span className="text-[10px] text-slate-500">Daughter is below 10 years of age</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">2. Primary Investment Goal</label>
                <select
                  value={advisorGoal}
                  onChange={(e) => setAdvisorGoal(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="Wealth">Long-term Guaranteed Capital Appreciation</option>
                  <option value="MonthlyIncome">Steady Monthly/Quarterly Passive Income</option>
                  <option value="TaxSaving">Maximize Tax Rebates (Under Sec 80C)</option>
                  <option value="ShortTerm">Short-term Safety &amp; Liquidity (1 to 3 yrs)</option>
                  <option value="DoubleMoney">Double my principal amount safely</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-emerald-800 border-b pb-3 mb-4">
                  ✨ Matches &amp; Recommendations
                </h3>

                <div className="space-y-4">
                  {advisorRecommendations.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 relative flex flex-col md:flex-row gap-4 items-start justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded font-mono">{s.id}</span>
                          <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic">"{s.suitability}"</p>
                        <p className="text-[10.5px] text-slate-500"><strong className="text-slate-600 font-semibold">Eligibility:</strong> {s.eligibility}</p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border text-center min-w-[110px] w-full md:w-auto shadow-sm flex-shrink-0">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Annual Yield</span>
                        <span className="text-lg font-black text-emerald-700 font-mono block my-0.5">{s.rate}%</span>
                        <span className="text-[9px] text-slate-500">{s.compounding}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 text-white border border-slate-700 shadow-xl relative overflow-hidden">
                <h4 className="font-black text-sm text-yellow-400 mb-2">💡 Advisory Planning Tip</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The **Sukanya Samriddhi Yojana (SSA)** for girls and **Senior Citizen Savings Scheme (SCSS)** for elderly offer the absolute highest interest rate yields (8.2%) in completely safe sovereign domains w.e.f 2026.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: SCHEME DETAILS (RULES & INFO) ==================== */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {!selectedRuleScheme ? (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="text-2xl">📚</span> Post Office Saving Schemes Reference
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Select a scheme below to view its detailed rules, conditions, and official features.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {schemes.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedRuleScheme(s)}
                      className={`text-left group rounded-xl p-4 border border-transparent hover:shadow-xl flex flex-col justify-between h-40 bg-gradient-to-br ${s.color} hover:scale-[1.02] transition-all`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase shadow-sm">{s.id}</span>
                          <span className="bg-white/10 text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-sm">{s.rate}%</span>
                        </div>
                        <h4 className="font-black text-white text-base leading-tight mb-1 group-hover:text-yellow-300 transition-colors drop-shadow-sm">{s.name}</h4>
                        <span className="text-white/80 text-[9px] uppercase tracking-widest font-bold block mb-4">{s.hindiName}</span>
                      </div>
                      <div className="text-xs text-white border-t border-white/20 pt-2 font-black tracking-wider flex items-center justify-between">
                        DETAILS <span className="text-yellow-400 group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className={`bg-gradient-to-tr ${selectedRuleScheme.color} p-5 md:p-8 text-white relative flex flex-col`}>
                  <button 
                    onClick={() => setSelectedRuleScheme(null)}
                    className="self-start mb-6 md:absolute md:top-6 md:left-6 bg-black/20 hover:bg-black/40 text-white text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur-md transition-colors flex items-center gap-2"
                  >
                    &larr; Back to Reference
                  </button>
                  
                  <div className="md:mt-10">
                    <span className="bg-white/20 px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase mb-3 inline-block shadow-sm">
                      {selectedRuleScheme.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight drop-shadow-sm leading-tight">{selectedRuleScheme.name}</h2>
                    <p className="text-sm md:text-base text-yellow-300 font-extrabold uppercase tracking-widest drop-shadow-sm mb-6 opacity-90">{selectedRuleScheme.hindiName}</p>
                    
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6">
                      <div className="bg-black/25 backdrop-blur-md rounded-xl p-3 md:px-4 md:py-3 border border-white/10 flex flex-col items-center text-center justify-center">
                        <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/70 font-black block mb-1">Yield</span>
                        <span className="text-sm sm:text-lg md:text-xl font-black leading-none">{selectedRuleScheme.rate}%<span className="text-[10px] font-medium hidden sm:inline ml-1">p.a.</span></span>
                      </div>
                      <div className="bg-black/25 backdrop-blur-md rounded-xl p-3 md:px-4 md:py-3 border border-white/10 flex flex-col items-center text-center justify-center">
                        <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/70 font-black block mb-1">Locking</span>
                        <span className="text-sm sm:text-lg md:text-xl font-black leading-none">{selectedRuleScheme.tenure.split(' ')[0]} <span className="text-[10px] font-medium sm:inline ml-0.5">{selectedRuleScheme.tenure.split(' ').slice(1).join(' ')}</span></span>
                      </div>
                      <div className="bg-black/25 backdrop-blur-md rounded-xl p-3 md:px-4 md:py-3 border border-white/10 flex flex-col items-center text-center justify-center">
                        <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/70 font-black block mb-1">Tax (80C)</span>
                        <span className="text-sm sm:text-lg md:text-xl font-black leading-none">{selectedRuleScheme.taxSaving.includes('Yes') ? 'Rebate' : 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-8 space-y-8 bg-slate-50">
                  {Object.entries(SCHEME_DETAILS_DATA[selectedRuleScheme.id] || {}).map(([sectionTitle, bulletPoints], index) => (
                    <div key={index} className="bg-white p-5 md:p-7 rounded-2xl border border-slate-200 shadow-sm relative pt-8 md:pt-10">
                      <div className="absolute -top-3.5 left-4 md:left-6 bg-slate-800 text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                        {sectionTitle}
                      </div>
                      <ul className="space-y-4">
                        {bulletPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-3 md:gap-4">
                            <span className="text-red-600 mt-1 flex-shrink-0 bg-red-100 rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs">
                              {i + 1}
                            </span>
                            <span className="text-sm text-slate-700 leading-relaxed font-medium mt-0.5">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  
                  {(!SCHEME_DETAILS_DATA[selectedRuleScheme.id]) && (
                    <div className="text-center p-8 md:p-12 text-slate-500 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                      <div className="text-4xl mb-3">📄</div>
                      <p className="font-bold text-base text-slate-700">Detailed rule specification not digitally formulated for {selectedRuleScheme.id}.</p>
                      <p className="text-sm mt-2">Please refer to the physical official notification gazette or visit a branch.</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
                  <button 
                    onClick={() => {
                      setSelectedSchemeId(selectedRuleScheme.id);
                      if (selectedRuleScheme.id === 'RD') setReinvestmentCombo('none');
                      setActiveTab('calculator');
                    }}
                    className="bg-slate-800 text-white rounded-lg px-6 py-3 text-sm font-bold shadow hover:bg-red-700 transition flex items-center gap-2"
                  >
                    Open in Calculator →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 6: ADMIN RATES CONFIGURATION ==================== */}
        {activeTab === 'admin' && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 md:p-6 mb-6">
            <div className="mb-6 border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="text-2xl">⚙️</span> Rates Administrator
                </h3>
                <p className="text-sm text-slate-500 mt-1">Update scheme interest rates globally. All calculators and projections will adapt dynamically to the localized rates specified below.</p>
              </div>
              
              {!adminUser ? (
                <button
                  onClick={() => signInWithPopup(auth, googleProvider)}
                  className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs md:text-sm font-bold rounded-lg shadow-sm transition-colors flex-shrink-0"
                >
                  Admin Sign In
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500 hidden md:block">
                    Logged in as <b>{adminUser.email}</b>
                  </div>
                  <button
                    onClick={() => signOut(auth)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-bold rounded-lg transition-colors flex-shrink-0"
                  >
                    Current Sign Out
                  </button>
                  <button
                    onClick={handleSaveRates}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs md:text-sm font-bold rounded-lg shadow-md transition-colors flex-shrink-0 flex items-center gap-2"
                  >
                    {isSaving ? 'Saving...' : '☁️ Save Rates to Cloud'}
                  </button>
                </div>
              )}
            </div>

            {!adminUser ? (
              <div className="text-center py-16 justify-center flex flex-col items-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-4">🔐</div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Admin Access Required</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">Please sign in with authorized administrator credentials to update global interest rates.</p>
              </div>
            ) : adminUser.email !== 'teacherkalandi@gmail.com' ? (
              <div className="text-center py-16 justify-center flex flex-col items-center bg-red-50 rounded-xl border-2 border-dashed border-red-200">
                <div className="text-4xl mb-4">⛔</div>
                <h4 className="text-lg font-bold text-red-800 mb-2">Access Denied</h4>
                <p className="text-sm text-red-600 max-w-sm mx-auto">You are logged in as <b>{adminUser.email}</b>. You do not have permission to view or modify the admin portal.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {schemes.map((s: any, index: number) => (
                    <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white bg-gradient-to-r ${s.color} shadow-sm`}>
                            {s.id}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">{s.hindiName}</p>
                      </div>
                      <div className="mt-auto">
                        <label className="text-xs font-bold text-slate-600 block mb-2 px-1">Interest Rate (% p.a.)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="20"
                            value={s.rate}
                            onChange={(e) => {
                              const newRate = parseFloat(e.target.value) || 0;
                              const newSchemes = [...schemes];
                              newSchemes[index] = { ...newSchemes[index], rate: newRate };
                              setSchemes(newSchemes);
                            }}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg font-black focus:outline-none focus:ring-2 focus:ring-red-600 text-slate-800"
                          />
                          <span className="absolute right-4 top-3 text-slate-400 font-black text-lg">%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Static Footer with the requested compilation agent details */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div>
            <span className="text-yellow-400 font-black tracking-widest block text-[10px] uppercase font-mono mb-2">Official Desk Support</span>
            <p className="mb-2 leading-relaxed text-[11px]">For exact ledger validations, please reach your nearest India Post Office branch.</p>
            <p className="text-[11px]"><strong>Customer Care:</strong> 1800-266-6868 <span className="text-[10px] text-slate-500">(9 AM to 6 PM IST)</span></p>
          </div>

          <div>
            <span className="text-yellow-400 font-black tracking-widest block text-[10px] uppercase font-mono mb-2">Official Resources</span>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li>&bull; <a href="https://www.indiapost.gov.in" target="_blank" rel="noreferrer" className="hover:text-white underline">indiapost.gov.in</a></li>
              <li>&bull; <a href="https://ebanking.indiapost.gov.in" target="_blank" rel="noreferrer" className="hover:text-white underline">ebanking.indiapost.gov.in</a></li>
              <li>&bull; <span className="text-slate-500">IFSC Code:</span> IPOS0000DOP</li>
            </ul>
          </div>

          <div className="border-t border-slate-800 pt-4 md:border-0 md:pt-0">
            <span className="text-yellow-400 font-black tracking-widest block text-[10px] uppercase font-mono mb-2">Compilation Details</span>
            <p className="font-bold text-slate-200">Kalandi Charan Sahoo</p>
            <p className="text-[11px] text-slate-400">Postal Assistant</p>
            <p className="text-[11px] text-slate-400">Dhenkanal RS SO</p>
            <p className="mt-1"><strong>Phone:</strong> +91 9178535303</p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto text-center border-t border-slate-800 pt-6 mt-6 text-[10px] text-slate-600">
          &copy; 2026 India Post Savings Bank Support Suite. All computation calculations are subject to regulatory updates as per Government of India Gazette announcements. Refer to file "ACFROG~1_2.PDF" for standard baseline values.
        </div>
      </footer>

    </div>
  );
}
