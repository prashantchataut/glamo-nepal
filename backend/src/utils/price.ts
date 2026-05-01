export function toStoredPrice(npr: number): number {
  return Math.round(npr * 100)
}

export function toDisplayPrice(stored: number): number {
  return stored / 100
}

export function formatNPR(stored: number): string {
  const display = toDisplayPrice(stored)
  const formatted = display.toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return `NPR ${formatted}`
}