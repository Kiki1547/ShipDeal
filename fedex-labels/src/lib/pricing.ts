export const PRICING_TIERS = [
  { label: 'Up to 250g', maxKg: 0.25, price: 2.40 },
  { label: '251g – 1 kg', maxKg: 1.0,  price: 3.00 },
  { label: '1 kg – 3 kg', maxKg: 3.0,  price: 3.60 },
  { label: '3 kg – 7 kg', maxKg: 7.0,  price: 4.20 },
  { label: '7 kg – 30 kg', maxKg: 30.0, price: 5.00 },
] as const

export function getPriceForWeight(weightKg: number): number {
  for (const tier of PRICING_TIERS) {
    if (weightKg <= tier.maxKg) return tier.price
  }
  return PRICING_TIERS[PRICING_TIERS.length - 1].price
}

export function getTierForWeight(weightKg: number) {
  return PRICING_TIERS.find(t => weightKg <= t.maxKg) ?? PRICING_TIERS[PRICING_TIERS.length - 1]
}
