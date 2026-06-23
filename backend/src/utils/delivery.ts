const DISTRICT_DELIVERY_FEES: Record<string, number> = {
  Kathmandu: 0,
  Lalitpur: 0,
  Bhaktapur: 50,
  Kavrepalanchok: 100,
  Dhading: 120,
  Chitwan: 100,
  Makwanpur: 120,
  Sindhupalchok: 150,
  Nuwakot: 150,
  Rasuwa: 200,
  Ramechhap: 200,
  Sindhuli: 200,
  Dolakha: 250,
  Kaski: 100,
  Tanahu: 120,
  Syangja: 150,
  Gorkha: 150,
  Lamjung: 150,
  Nawalpur: 120,
  Parbat: 150,
  Baglung: 150,
  Myagdi: 200,
  Mustang: 300,
  Manang: 300,
  Rupandehi: 100,
  Kapilvastu: 120,
  Palpa: 150,
  Arghakhanchi: 150,
  Gulmi: 150,
  Pyuthan: 200,
  Rolpa: 200,
  Dang: 150,
  Banke: 150,
  Bardiya: 150,
  Parasi: 120,
  Jhapa: 150,
  Morang: 150,
  Sunsari: 150,
  Ilam: 200,
  Panchthar: 200,
  Taplejung: 250,
  Bhojpur: 250,
  Dhankuta: 250,
  Terhathum: 250,
  Sankhuwasabha: 300,
  Solukhumbu: 300,
  Okhaldhunga: 250,
  Khotang: 250,
  Udayapur: 200,
  Saptari: 150,
  Siraha: 150,
  Dhanusha: 150,
  Mahottari: 150,
  Sarlahi: 150,
  Rautahat: 150,
  Bara: 150,
  Parsa: 150,
  Surkhet: 200,
  Kalikot: 300,
  Jumla: 300,
  Mugu: 350,
  Humla: 350,
  Dolpa: 350,
  Dailekh: 250,
  Jajarkot: 250,
  Rukum_West: 250,
  Salyan: 250,
  Rukum_East: 250,
  Bajura: 300,
  Bajhang: 300,
  Darchula: 300,
  Kailali: 200,
  Kanchanpur: 200,
  Achham: 250,
  Doti: 250,
  Dadeldhura: 300,
  Baitadi: 250,
}

const PROVINCE_DEFAULTS: Record<string, number> = {
  Koshi: 200,
  Madhesh: 150,
  Bagmati: 100,
  Gandaki: 150,
  Lumbini: 120,
  Karnali: 300,
  Sudurpashchim: 250,
}

const FREE_DELIVERY_THRESHOLD = 2500

const DISTRICT_COD_AVAILABLE: Set<string> = new Set([
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kavrepalanchok', 'Chitwan',
  'Dhading', 'Makwanpur', 'Rupandehi', 'Banke', 'Dang', 'Kaski',
  'Jhapa', 'Morang', 'Sunsari', 'Saptari', 'Siraha', 'Dhanusha',
  'Mahottari', 'Sarlahi', 'Rautahat', 'Bara', 'Parsa',
  'Kapilvastu', 'Palpa', 'Syangja', 'Tanahu', 'Nawalpur', 'Parasi',
])

export function calculateDeliveryFee(subtotal: number, district: string, province: string): number {
  const normalizedDistrict = Object.keys(DISTRICT_DELIVERY_FEES).find(
    (d) => d.toLowerCase() === district.toLowerCase()
  )
  const fee = normalizedDistrict ? DISTRICT_DELIVERY_FEES[normalizedDistrict] : PROVINCE_DEFAULTS[province] ?? 150
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : fee
}

export function isCodAvailable(district: string): boolean {
  const normalizedDistrict = Object.keys(DISTRICT_DELIVERY_FEES).find(
    (d) => d.toLowerCase() === district.toLowerCase()
  )
  return normalizedDistrict ? DISTRICT_COD_AVAILABLE.has(normalizedDistrict) : false
}

export { FREE_DELIVERY_THRESHOLD }