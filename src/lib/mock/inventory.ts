import { PRODUCTS } from "@/lib/mock/products";

export type InventoryRisk = "healthy" | "watch" | "low" | "out";

export interface InventorySnapshot {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  stockCount: number;
  reorderPoint: number;
  restockTarget: number;
  risk: InventoryRisk;
  estimatedDaysCover: number;
}

export function getInventoryRisk(stockCount: number, reorderPoint = 20): InventoryRisk {
  if (stockCount <= 0) return "out";
  if (stockCount <= Math.floor(reorderPoint / 2)) return "low";
  if (stockCount <= reorderPoint) return "watch";
  return "healthy";
}

export const INVENTORY_SNAPSHOT: InventorySnapshot[] = PRODUCTS.map((product, index) => {
  const reorderPoint = product.isBestSeller ? 30 : product.isFeatured ? 24 : 18;
  const estimatedDailySales = product.isBestSeller ? 3 : product.isFeatured ? 2 : 1;

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    stockCount: product.stockCount,
    reorderPoint,
    restockTarget: reorderPoint * 3,
    risk: getInventoryRisk(product.stockCount, reorderPoint),
    estimatedDaysCover: Math.max(0, Math.round(product.stockCount / estimatedDailySales + (index % 3))),
  };
});

export const LOW_STOCK_SNAPSHOT = INVENTORY_SNAPSHOT.filter((item) =>
  item.risk === "low" || item.risk === "watch" || item.risk === "out",
).sort((a, b) => a.stockCount - b.stockCount);

export const INVENTORY_SUMMARY = {
  totalUnits: INVENTORY_SNAPSHOT.reduce((sum, item) => sum + item.stockCount, 0),
  lowStockCount: LOW_STOCK_SNAPSHOT.length,
  outOfStockCount: INVENTORY_SNAPSHOT.filter((item) => item.risk === "out").length,
  healthyCount: INVENTORY_SNAPSHOT.filter((item) => item.risk === "healthy").length,
};
