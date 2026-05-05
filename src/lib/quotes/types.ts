export type QuoteStatus =
  | "draft" | "sent" | "viewed" | "approved"
  | "rejected" | "expired" | "converted" | "archived";

export type TaxMode = "qc" | "eu" | "us" | "none" | "custom";

export interface TaxLine {
  label: string;
  rate: number; // ex: 5 pour 5%
}

export const TAX_PRESETS: Record<TaxMode, TaxLine[]> = {
  qc:   [{ label: "TPS", rate: 5 }, { label: "TVQ", rate: 9.975 }],
  eu:   [{ label: "TVA", rate: 20 }],
  us:   [{ label: "Sales Tax", rate: 8.5 }],
  none: [],
  custom: [],
};

/** Taux combiné pour un mode de taxe */
export function combinedTaxRate(mode: TaxMode, customRate = 0): number {
  if (mode === "custom") return customRate;
  return TAX_PRESETS[mode].reduce((sum, t) => sum + t.rate, 0);
}

export interface Quote {
  id: string;
  company_id: string;
  client_id: string;
  property_id: string | null;
  created_by: string | null;
  number: string;
  status: QuoteStatus;
  issued_at: string | null;
  valid_until: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  signed_at: string | null;
  signed_name: string | null;
  signed_ip: string | null;
  title: string | null;
  intro_message: string | null;
  internal_notes: string | null;
  terms: string | null;
  currency: string;
  tax_mode: TaxMode;
  subtotal: number;
  discount_type: "percent" | "fixed" | null;
  discount_value: number | null;
  discount_amount: number;
  tax_total: number;
  total: number;
  deposit_required: boolean;
  deposit_type: "percent" | "fixed" | null;
  deposit_value: number | null;
  deposit_amount: number;
  pdf_url: string | null;
  public_token: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  position: number;
  description: string;
  long_description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate_pct: number;
  is_optional: boolean;
  is_selected: boolean;
  line_total: number;
  created_at: string;
}

export interface QuoteTemplate {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  items: Omit<QuoteItem, "id" | "quote_id" | "created_at">[];
  created_at: string;
}

/** Représentation locale d'un item pendant l'édition */
export interface QuoteItemDraft {
  id: string; // uuid local (crypto.randomUUID) ou id BD
  position: number;
  description: string;
  long_description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate_pct: number;
  is_optional: boolean;
  is_selected: boolean;
}

/** Calcul client-side des totaux */
export function computeTotals(
  items: QuoteItemDraft[],
  discountType: "percent" | "fixed" | null,
  discountValue: number,
  taxMode: TaxMode,
  customTaxRate = 0,
  depositRequired: boolean,
  depositType: "percent" | "fixed" | null,
  depositValue: number
) {
  const activeItems = items.filter(
    (it) => !it.is_optional || it.is_selected
  );

  const subtotal = activeItems.reduce(
    (sum, it) => sum + it.quantity * it.unit_price,
    0
  );

  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === "fixed") {
    discountAmount = Math.min(discountValue, subtotal);
  }

  const taxBase = subtotal - discountAmount;
  const taxRate = combinedTaxRate(taxMode, customTaxRate) / 100;
  const taxTotal = taxBase * taxRate;
  const total = taxBase + taxTotal;

  let depositAmount = 0;
  if (depositRequired) {
    if (depositType === "percent") {
      depositAmount = total * (depositValue / 100);
    } else if (depositType === "fixed") {
      depositAmount = Math.min(depositValue, total);
    }
  }

  return { subtotal, discountAmount, taxTotal, total, depositAmount };
}
