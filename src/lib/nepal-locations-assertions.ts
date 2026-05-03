function assertCondition(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

import { DISTRICTS, ALL_DISTRICTS, PROVINCES } from "./nepal-locations";

if (process.env.NODE_ENV === "development") {
  const totalDistricts = DISTRICTS.length;
  assertCondition(totalDistricts === 77, `Expected 77 districts, got ${totalDistricts}`);

  assertCondition(!DISTRICTS.includes("Dhangadhi" as never), "Dhangadhi is a city in Kailali district, not a district");
  assertCondition(!DISTRICTS.includes("Biratnagar" as never), "Biratnagar is a city in Morang district, not a district");
  assertCondition(!DISTRICTS.includes("Dharan" as never), "Dharan is a city in Sunsari/Morang, not a district");
  assertCondition(!DISTRICTS.includes("Birgunj" as never), "Birgunj is a city in Parsa district, not a district");
  assertCondition(!DISTRICTS.includes("Janakpur" as never), "Janakpur is a city in Dhanusha district, not a district");
  assertCondition(!DISTRICTS.includes("Pokhara" as never), "Pokhara is a city in Kaski district, not a district");
  assertCondition(!DISTRICTS.includes("Butwal" as never), "Butwal is a city in Rupandehi district, not a district");
  assertCondition(!DISTRICTS.includes("Nepalgunj" as never), "Nepalgunj is a city in Banke district, not a district");

  const districtProvinceMap = new Map<string, string>();
  for (const info of ALL_DISTRICTS) {
    const existing = districtProvinceMap.get(info.name);
    if (existing && existing !== info.province) {
      assertCondition(false, `District ${info.name} mapped to multiple provinces: ${existing} and ${info.province}`);
    }
    districtProvinceMap.set(info.name, info.province);
  }

  assertCondition(PROVINCES.length === 7, `Expected 7 provinces, got ${PROVINCES.length}`);

  let totalMunicipalities = 0;
  for (const info of ALL_DISTRICTS) {
    totalMunicipalities += info.municipalities.length;
  }
  assertCondition(totalMunicipalities >= 290, `Expected at least 290 municipalities, got ${totalMunicipalities}`);
}