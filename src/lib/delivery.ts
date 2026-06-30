import {
  type Province as ProvinceType,
  type District as DistrictType,
  type ServiceLevel as ServiceLevelType,
  type DistrictDeliveryRule as NewDistrictDeliveryRule,
  type ProvinceDeliveryDefault,
  type Municipality as MunicipalityType,
  type DistrictInfo as DistrictInfoType,
  PROVINCES,
  DISTRICTS,
  DISTRICTS_BY_PROVINCE,
  DISTRICT_DELIVERY_RULES as NEW_DISTRICT_DELIVERY_RULES,
  ALL_DISTRICTS,
  MUNICIPALITIES_BY_DISTRICT,
  getDistrictsForProvince as _getDistrictsForProvince,
  getMunicipalitiesForDistrict as _getMunicipalitiesForDistrict,
  getDeliveryRule as _getDeliveryRule,
  calculateDeliveryFee as _calculateDeliveryFee,
  isValidProvinceDistrictCombo,
  isCodAvailable,
} from "./nepal-locations";

export type Province = ProvinceType;
export type District = DistrictType;
export type ServiceLevel = ServiceLevelType;
export type Municipality = MunicipalityType;
export type DistrictInfo = DistrictInfoType;
export { PROVINCES, DISTRICTS, DISTRICTS_BY_PROVINCE, ALL_DISTRICTS, MUNICIPALITIES_BY_DISTRICT };
export { _getMunicipalitiesForDistrict as getMunicipalitiesForDistrict, isValidProvinceDistrictCombo, isCodAvailable };

/**
 * Cash on Delivery handling fee as a percentage of the cart subtotal.
 * 3% applies globally; no district-based surcharge.
 */
export const COD_FEE_PERCENT = 0.03;

export function calculateCodFee(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return Math.round(subtotal * COD_FEE_PERCENT);
}

export interface DistrictDeliveryRule {
  district: string;
  province: Province;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimate: string;
  fee: number;
  serviceLevel: ServiceLevel | "pending";
  ownerNote: string;
}

function adaptRule(rule: NewDistrictDeliveryRule | ProvinceDeliveryDefault): DistrictDeliveryRule {
  return {
    district: "district" in rule ? rule.district : "Other",
    province: rule.province,
    codAvailable: rule.codAvailable,
    prepaidAvailable: true,
    estimate: rule.estimatedDays,
    fee: rule.fee,
    serviceLevel: rule.serviceLevel,
    ownerNote: "",
  };
}

export const DISTRICT_DELIVERY_RULES: DistrictDeliveryRule[] = NEW_DISTRICT_DELIVERY_RULES.map(adaptRule);

function normalizeProvince(province: string): Province {
  return (PROVINCES.includes(province as Province) ? province : "Bagmati") as Province;
}

function normalizeDistrict(district: string): District {
  return (DISTRICTS.includes(district as District) ? district : "Kathmandu") as District;
}

export function getDistrictsForProvince(province: string): string[] {
  return _getDistrictsForProvince(normalizeProvince(province));
}

export function getDeliveryRule(district: string, province: string = "Bagmati"): DistrictDeliveryRule {
  return adaptRule(_getDeliveryRule(normalizeDistrict(district), normalizeProvince(province)));
}

export function calculateDeliveryFee(subtotal: number, district: string, province = "Bagmati"): number {
  // Do not normalize the district here: the underlying calculator is
  // case-insensitive and falls back to the province default for unknown
  // districts, which matches backend/src/utils/delivery.ts exactly.
  return _calculateDeliveryFee(subtotal, district as District, normalizeProvince(province));
}