import { query } from '../../config/db';
import { EstimatePriceInput } from './resources.schema';

const CONDITION_MULTIPLIERS: Record<EstimatePriceInput['condition'], number> = {
  'Like New': 0.65,
  'Annotated with Exam Notes': 0.60,
  'Gently Used': 0.45,
};

// Fallback campus reference retail baselines when no explicit original_price is supplied
const CATEGORY_RETAIL_BASELINES: Record<EstimatePriceInput['category'], number> = {
  Textbook: 1400,
  Electronics: 1500,
  'Lab Equipment': 1100,
  'Study Notes': 450,
  'Hostel Essentials': 900,
};

export interface FairPriceEstimate {
  recommended_price: number;
  min_fair_price: number;
  max_fair_price: number;
  historical_avg_price: number | null;
  sample_count: number;
  savings_percent?: number;
  basis: string;
}

/**
 * Computes an estimated Fair Price band by combining:
 * 1. Historical campus pricing from PostgreSQL (course_code first, then category fallback)
 * 2. Condition-based depreciation multipliers
 * 3. +10% value-add bonus for annotated Textbooks ("Has Annotations")
 */
export async function estimateFairPrice(input: EstimatePriceInput): Promise<FairPriceEstimate> {
  const effectiveCondition =
    input.category !== 'Textbook' && input.condition === 'Annotated with Exam Notes'
      ? 'Gently Used'
      : input.condition;
  const hasAnnotations = input.category === 'Textbook' && input.notes_included;

  const baseRatio = CONDITION_MULTIPLIERS[effectiveCondition] ?? 0.5;
  const referenceRetail = input.original_price || CATEGORY_RETAIL_BASELINES[input.category] || 1000;
  let baseline = referenceRetail * baseRatio;

  let historicalAvg: number | null = null;
  let sampleCount = 0;
  let basis = `Campus ${input.category} baseline (${Math.round(baseRatio * 100)}% condition factor)`;

  // 1. Check historical campus prices for the exact course_code
  if (input.course_code && input.course_code.toUpperCase() !== 'GENERAL') {
    const courseStats = await query<{ avg_price: string | null; count: string }>(
      `SELECT AVG(fair_price)::numeric(10,2) AS avg_price, COUNT(*)::text AS count
       FROM academic_resources
       WHERE UPPER(course_code) = UPPER($1) AND fair_price > 0`,
      [input.course_code]
    );
    const count = Number(courseStats.rows[0]?.count || 0);
    if (count > 0 && courseStats.rows[0]?.avg_price) {
      historicalAvg = Math.round(Number(courseStats.rows[0].avg_price));
      sampleCount = count;
      basis = `Blended with ${count} campus listing(s) for ${input.course_code.toUpperCase()}`;
    }
  }

  // 2. Fallback to category-level historical campus averages
  if (historicalAvg === null) {
    const catStats = await query<{ avg_price: string | null; count: string }>(
      `SELECT AVG(fair_price)::numeric(10,2) AS avg_price, COUNT(*)::text AS count
       FROM academic_resources
       WHERE category = $1 AND fair_price > 0`,
      [input.category]
    );
    const count = Number(catStats.rows[0]?.count || 0);
    if (count > 0 && catStats.rows[0]?.avg_price) {
      historicalAvg = Math.round(Number(catStats.rows[0].avg_price));
      sampleCount = count;
      basis = `Blended with ${count} campus ${input.category} listing(s)`;
    }
  }

  // 3. Blend condition baseline + historical campus average
  if (historicalAvg !== null) {
    // When no explicit retail price is provided, weight campus history slightly higher (55%)
    const histWeight = input.original_price ? 0.4 : 0.55;
    const boundedHistorical = input.original_price
      ? Math.min(historicalAvg, input.original_price * 0.85)
      : historicalAvg;
    baseline = (1 - histWeight) * baseline + histWeight * boundedHistorical;
  }

  // 4. Apply +10% annotation bonus exclusively for Textbooks with annotations
  if (hasAnnotations) {
    baseline *= 1.1;
    basis += ' + 10% textbook annotations bonus';
  }

  const maxCap = input.original_price ? Math.round(input.original_price * 0.8) : Math.round(baseline * 1.2);
  const recommended = Math.max(50, Math.min(Math.round(baseline), maxCap));
  const minFair = Math.max(50, Math.round(recommended * 0.85));
  const maxFair = Math.round(recommended * 1.15);

  const savingsPercent = input.original_price
    ? Math.max(0, Math.round(((input.original_price - recommended) / input.original_price) * 100))
    : undefined;

  return {
    recommended_price: recommended,
    min_fair_price: minFair,
    max_fair_price: maxFair,
    historical_avg_price: historicalAvg,
    sample_count: sampleCount,
    ...(savingsPercent !== undefined ? { savings_percent: savingsPercent } : {}),
    basis,
  };
}
