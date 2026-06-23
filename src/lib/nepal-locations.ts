export type Province = "Koshi" | "Madhesh" | "Bagmati" | "Gandaki" | "Lumbini" | "Karnali" | "Sudurpashchim";

export type District =
  | "Taplejung" | "Panchthar" | "Ilam" | "Jhapa" | "Morang" | "Sunsari"
  | "Bhojpur" | "Dhankuta" | "Terhathum" | "Sankhuwasabha"
  | "Solukhumbu" | "Okhaldhunga" | "Khotang" | "Udayapur"
  | "Saptari" | "Siraha" | "Dhanusha" | "Mahottari" | "Sarlahi" | "Rautahat" | "Bara" | "Parsa"
  | "Sindhuli" | "Ramechhap" | "Dolakha" | "Sindhupalchok" | "Kavrepalanchok"
  | "Nuwakot" | "Rasuwa" | "Dhading" | "Chitwan" | "Makwanpur"
  | "Kathmandu" | "Lalitpur" | "Bhaktapur"
  | "Gorkha" | "Lamjung" | "Tanahu" | "Kaski" | "Syangja" | "Nawalpur"
  | "Manang" | "Mustang" | "Parbat" | "Myagdi" | "Baglung"
  | "Parasi" | "Rupandehi" | "Kapilvastu" | "Palpa" | "Arghakhanchi"
  | "Gulmi" | "Pyuthan" | "Rolpa" | "Dang" | "Banke" | "Bardiya" | "Rukum East"
  | "Mugu" | "Humla" | "Jumla" | "Kalikot" | "Dolpa" | "Surkhet"
  | "Dailekh" | "Jajarkot" | "Rukum West" | "Salyan"
  | "Bajura" | "Bajhang" | "Darchula" | "Kailali" | "Kanchanpur"
  | "Achham" | "Doti" | "Dadeldhura" | "Baitadi";

export type ServiceLevel = "valley" | "metro" | "standard" | "remote" | "pending";

export interface Municipality {
  name: string;
  type: "Metropolitan" | "Sub-Metropolitan" | "Municipality" | "Rural Municipality";
}

export interface DistrictInfo {
  name: District;
  province: Province;
  municipalities: Municipality[];
}

export interface DistrictDeliveryRule {
  district: District;
  province: Province;
  codAvailable: boolean;
  fee: number;
  freeDeliveryThreshold: number;
  serviceLevel: ServiceLevel;
  estimatedDays: string;
}

export interface ProvinceDeliveryDefault {
  province: Province;
  codAvailable: boolean;
  fee: number;
  freeDeliveryThreshold: number;
  serviceLevel: ServiceLevel;
  estimatedDays: string;
}

export const PROVINCES: Province[] = [
  "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim",
];

export const DISTRICTS: District[] = [
  "Taplejung", "Panchthar", "Ilam", "Jhapa", "Morang", "Sunsari",
  "Bhojpur", "Dhankuta", "Terhathum", "Sankhuwasabha",
  "Solukhumbu", "Okhaldhunga", "Khotang", "Udayapur",
  "Saptari", "Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa",
  "Sindhuli", "Ramechhap", "Dolakha", "Sindhupalchok", "Kavrepalanchok",
  "Nuwakot", "Rasuwa", "Dhading", "Chitwan", "Makwanpur",
  "Kathmandu", "Lalitpur", "Bhaktapur",
  "Gorkha", "Lamjung", "Tanahu", "Kaski", "Syangja", "Nawalpur",
  "Manang", "Mustang", "Parbat", "Myagdi", "Baglung",
  "Parasi", "Rupandehi", "Kapilvastu", "Palpa", "Arghakhanchi",
  "Gulmi", "Pyuthan", "Rolpa", "Dang", "Banke", "Bardiya", "Rukum East",
  "Mugu", "Humla", "Jumla", "Kalikot", "Dolpa", "Surkhet",
  "Dailekh", "Jajarkot", "Rukum West", "Salyan",
  "Bajura", "Bajhang", "Darchula", "Kailali", "Kanchanpur",
  "Achham", "Doti", "Dadeldhura", "Baitadi",
];

export const DISTRICTS_BY_PROVINCE: Record<Province, District[]> = {
  Koshi: ["Taplejung", "Panchthar", "Ilam", "Jhapa", "Morang", "Sunsari", "Bhojpur", "Dhankuta", "Terhathum", "Sankhuwasabha", "Solukhumbu", "Okhaldhunga", "Khotang", "Udayapur"],
  Madhesh: ["Saptari", "Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa"],
  Bagmati: ["Sindhuli", "Ramechhap", "Dolakha", "Sindhupalchok", "Kavrepalanchok", "Nuwakot", "Rasuwa", "Dhading", "Chitwan", "Makwanpur", "Kathmandu", "Lalitpur", "Bhaktapur"],
  Gandaki: ["Gorkha", "Lamjung", "Tanahu", "Kaski", "Syangja", "Nawalpur", "Manang", "Mustang", "Parbat", "Myagdi", "Baglung"],
  Lumbini: ["Parasi", "Rupandehi", "Kapilvastu", "Palpa", "Arghakhanchi", "Gulmi", "Pyuthan", "Rolpa", "Dang", "Banke", "Bardiya", "Rukum East"],
  Karnali: ["Mugu", "Humla", "Jumla", "Kalikot", "Dolpa", "Surkhet", "Dailekh", "Jajarkot", "Rukum West", "Salyan"],
  Sudurpashchim: ["Bajura", "Bajhang", "Darchula", "Kailali", "Kanchanpur", "Achham", "Doti", "Dadeldhura", "Baitadi"],
};

export const MUNICIPALITIES_BY_DISTRICT: Record<District, Municipality[]> = {
  Taplejung: [
    { name: "Taplejung", type: "Municipality" },
    { name: "Phungling", type: "Municipality" },
    { name: "Sirijangha", type: "Rural Municipality" },
    { name: "Mikwakhola", type: "Rural Municipality" },
    { name: "Yangwarak", type: "Rural Municipality" },
    { name: "Thumbedin", type: "Rural Municipality" },
    { name: "Sidingba", type: "Rural Municipality" },
    { name: "Mewakhola", type: "Rural Municipality" },
  ],
  Panchthar: [
    { name: "Phidim", type: "Municipality" },
    { name: "Panchthar", type: "Municipality" },
    { name: "Phalelung", type: "Rural Municipality" },
    { name: "Yasok", type: "Rural Municipality" },
    { name: "Kuriva", type: "Rural Municipality" },
    { name: "Yangnam", type: "Rural Municipality" },
    { name: "Hilihang", type: "Rural Municipality" },
    { name: "Falelung", type: "Municipality" },
  ],
  Ilam: [
    { name: "Ilam", type: "Municipality" },
    { name: "Deumai", type: "Municipality" },
    { name: "Suryodaya", type: "Municipality" },
    { name: "Mai", type: "Rural Municipality" },
    { name: "Maijogmai", type: "Rural Municipality" },
    { name: "Rong", type: "Rural Municipality" },
    { name: "Sandakpur", type: "Rural Municipality" },
    { name: "Mangsebung", type: "Rural Municipality" },
    { name: "Chulachuli", type: "Rural Municipality" },
  ],
  Jhapa: [
    { name: "Bhadrapur", type: "Municipality" },
    { name: "Mechinagar", type: "Municipality" },
    { name: "Damak", type: "Municipality" },
    { name: "Itabhatta", type: "Municipality" },
    { name: "Birtamod", type: "Municipality" },
    { name: "Kankai", type: "Municipality" },
    { name: "Shivaganj", type: "Municipality" },
    { name: "Gauradaha", type: "Municipality" },
    { name: "Budhabare", type: "Rural Municipality" },
    { name: "Kachankawal", type: "Rural Municipality" },
    { name: "Barijuwa", type: "Rural Municipality" },
    { name: "Arjundhara", type: "Rural Municipality" },
    { name: "Haldibari", type: "Rural Municipality" },
    { name: "Kamal", type: "Rural Municipality" },
    { name: "Gauriganj", type: "Rural Municipality" },
  ],
  Morang: [
    { name: "Biratnagar", type: "Metropolitan" },
    { name: "Itahari", type: "Sub-Metropolitan" },
    { name: "Sundarharaincha", type: "Municipality" },
    { name: "Dharan", type: "Sub-Metropolitan" },
    { name: "Belbari", type: "Municipality" },
    { name: "Koshi Haraicha", type: "Municipality" },
    { name: "Rangeli", type: "Municipality" },
    { name: "Letang", type: "Municipality" },
    { name: "Urlabari", type: "Municipality" },
    { name: "Sundarpur", type: "Rural Municipality" },
    { name: "Kerabari", type: "Rural Municipality" },
    { name: "Budhiganga", type: "Rural Municipality" },
    { name: "Kanepokhari", type: "Rural Municipality" },
    { name: "Miklajung", type: "Rural Municipality" },
    { name: "Ratuwamai", type: "Rural Municipality" },
  ],
  Sunsari: [
    { name: "Itahari", type: "Sub-Metropolitan" },
    { name: "Dharan", type: "Sub-Metropolitan" },
    { name: "Inaruwa", type: "Municipality" },
    { name: "Sunsari", type: "Municipality" },
    { name: "Ramdhuni", type: "Municipality" },
    { name: "Duhabi", type: "Municipality" },
    { name: "Barju", type: "Rural Municipality" },
    { name: "Harinagara", type: "Rural Municipality" },
    { name: "Bhokraha", type: "Rural Municipality" },
    { name: "Koshi", type: "Rural Municipality" },
  ],
  Bhojpur: [
    { name: "Bhojpur", type: "Municipality" },
    { name: "Taksar", type: "Municipality" },
    { name: "Bhojpur", type: "Rural Municipality" },
    { name: "Ramprasadpur", type: "Rural Municipality" },
    { name: "Shyamtal", type: "Rural Municipality" },
    { name: "Dingla", type: "Rural Municipality" },
    { name: "Aamtek", type: "Rural Municipality" },
    { name: "Pauwa", type: "Rural Municipality" },
    { name: "Salpasilichho", type: "Rural Municipality" },
  ],
  Dhankuta: [
    { name: "Dhankuta", type: "Municipality" },
    { name: "Hile", type: "Municipality" },
    { name: "Pakhribas", type: "Municipality" },
    { name: "Mulgaj", type: "Rural Municipality" },
    { name: "Rajarani", type: "Rural Municipality" },
    { name: "Chhathar", type: "Rural Municipality" },
    { name: "Sangurigadhi", type: "Rural Municipality" },
  ],
  Terhathum: [
    { name: "Myanglung", type: "Municipality" },
    { name: "Terhathum", type: "Municipality" },
    { name: "Aathrai", type: "Rural Municipality" },
    { name: "Jaljale", type: "Rural Municipality" },
    { name: "Chhathar", type: "Rural Municipality" },
  ],
  Sankhuwasabha: [
    { name: "Khandbari", type: "Municipality" },
    { name: "Sankhuwasabha", type: "Municipality" },
    { name: "Madi", type: "Rural Municipality" },
    { name: "Sabhapokhari", type: "Rural Municipality" },
    { name: "Bhotkhola", type: "Rural Municipality" },
    { name: "Kimathanka", type: "Rural Municipality" },
    { name: "Chichila", type: "Rural Municipality" },
    { name: "Wana", type: "Rural Municipality" },
    { name: "Silichong", type: "Rural Municipality" },
  ],
  Solukhumbu: [
    { name: "Salleri", type: "Municipality" },
    { name: "Solukhumbu", type: "Municipality" },
    { name: "Necha Salyan", type: "Rural Municipality" },
    { name: "Likhupike", type: "Rural Municipality" },
    { name: "Jubing", type: "Rural Municipality" },
    { name: "Khumbu Pasang Lhamu", type: "Rural Municipality" },
    { name: "Mapya Dudh Koshi", type: "Rural Municipality" },
    { name: "Dudhkausika", type: "Rural Municipality" },
  ],
  Okhaldhunga: [
    { name: "Okhaldhunga", type: "Municipality" },
    { name: "Siddhicharan", type: "Municipality" },
    { name: "Khijidemba", type: "Rural Municipality" },
    { name: "Sunkoshi", type: "Rural Municipality" },
    { name: "Chisankhu", type: "Rural Municipality" },
    { name: "Mane Bhanjyang", type: "Rural Municipality" },
    { name: "Baruneshwor", type: "Rural Municipality" },
    { name: "Mamkhu", type: "Rural Municipality" },
  ],
  Khotang: [
    { name: "Diktel Rupakot Majhuwagadhi", type: "Municipality" },
    { name: "Khotang", type: "Municipality" },
    { name: "Halesi Tuwachung", type: "Municipality" },
    { name: "Ainselukhark", type: "Rural Municipality" },
    { name: "Barahpokhari", type: "Rural Municipality" },
    { name: "Buipa", type: "Rural Municipality" },
    { name: "Dipsung", type: "Rural Municipality" },
    { name: "Jantedhunga", type: "Rural Municipality" },
    { name: "Khotehang", type: "Rural Municipality" },
    { name: "Lamidanda", type: "Rural Municipality" },
    { name: "Matsyapokhari", type: "Rural Municipality" },
    { name: "Rakhwala", type: "Rural Municipality" },
    { name: "Basishthakhark", type: "Rural Municipality" },
  ],
  Udayapur: [
    { name: "Triyuga", type: "Municipality" },
    { name: "Katari", type: "Municipality" },
    { name: "Gaighat", type: "Municipality" },
    { name: "Beltar", type: "Municipality" },
    { name: "Basaha", type: "Municipality" },
    { name: "Chaudandigadhi", type: "Municipality" },
    { name: "Sunkoshi", type: "Rural Municipality" },
    { name: "Tapeshwor", type: "Rural Municipality" },
    { name: "Rautamai", type: "Rural Municipality" },
    { name: "Baraha", type: "Rural Municipality" },
    { name: "Limchung", type: "Rural Municipality" },
    { name: "Chisapanigadhi", type: "Rural Municipality" },
  ],
  Saptari: [
    { name: "Rajbiraj", type: "Municipality" },
    { name: "Kanchanpur", type: "Municipality" },
    { name: "Saptari", type: "Municipality" },
    { name: "Bishnupur", type: "Rural Municipality" },
    { name: "Rajgadh", type: "Rural Municipality" },
    { name: "Hanumannagar", type: "Rural Municipality" },
    { name: "Bodebarsain", type: "Rural Municipality" },
    { name: "Mahadeva", type: "Rural Municipality" },
    { name: "Portaha", type: "Rural Municipality" },
    { name: "Tirhut", type: "Rural Municipality" },
    { name: "Shambhunath", type: "Rural Municipality" },
    { name: "Surunga", type: "Rural Municipality" },
    { name: "Kalyanpur", type: "Rural Municipality" },
    { name: "Bakari", type: "Rural Municipality" },
    { name: "Fattepur", type: "Rural Municipality" },
  ],
  Siraha: [
    { name: "Siraha", type: "Municipality" },
    { name: "Lahan", type: "Municipality" },
    { name: "Mirchaiya", type: "Municipality" },
    { name: "Golbazar", type: "Municipality" },
    { name: "Sukhipur", type: "Municipality" },
    { name: "Kalyanpur", type: "Municipality" },
    { name: "Bariyarpur", type: "Rural Municipality" },
    { name: "Lakshminiya", type: "Rural Municipality" },
    { name: "Arnama", type: "Rural Municipality" },
    { name: "Nawarajpur", type: "Rural Municipality" },
    { name: "Bhagawanpur", type: "Rural Municipality" },
    { name: "Aurahi", type: "Rural Municipality" },
  ],
  Dhanusha: [
    { name: "Janakpur", type: "Sub-Metropolitan" },
    { name: "Dhanushadham", type: "Municipality" },
    { name: "Bideha", type: "Municipality" },
    { name: "Mithila", type: "Municipality" },
    { name: "Nagarain", type: "Municipality" },
    { name: "Hansapur", type: "Municipality" },
    { name: "Ganeshwan Chaur", type: "Municipality" },
    { name: "Chhireshwornath", type: "Municipality" },
    { name: "Mithila Bihari", type: "Rural Municipality" },
    { name: "Dhanauji", type: "Rural Municipality" },
    { name: "Shambhunath", type: "Rural Municipality" },
  ],
  Mahottari: [
    { name: "Jaleshwar", type: "Municipality" },
    { name: "Mahottari", type: "Municipality" },
    { name: "Bardibas", type: "Municipality" },
    { name: "Gaushala", type: "Municipality" },
    { name: "Loharpatti", type: "Municipality" },
    { name: "Pipara", type: "Rural Municipality" },
    { name: "Balawa", type: "Rural Municipality" },
    { name: "Bahiudar", type: "Rural Municipality" },
    { name: "Sahodawa", type: "Rural Municipality" },
    { name: "Ramgopalpur", type: "Rural Municipality" },
    { name: "Manara", type: "Rural Municipality" },
    { name: "Ekdara", type: "Rural Municipality" },
  ],
  Sarlahi: [
    { name: "Malangwa", type: "Municipality" },
    { name: "Haripurwa", type: "Municipality" },
    { name: "Barahathawa", type: "Municipality" },
    { name: "Ishworpur", type: "Municipality" },
    { name: "Lalbandi", type: "Municipality" },
    { name: "Bagmati", type: "Municipality" },
    { name: "Kaudena", type: "Municipality" },
    { name: "Chandrauta", type: "Rural Municipality" },
    { name: "Dhankaul", type: "Rural Municipality" },
    { name: "Ramnagar", type: "Rural Municipality" },
    { name: "Bishnu", type: "Rural Municipality" },
    { name: "Parsa", type: "Rural Municipality" },
    { name: "Bairgania", type: "Rural Municipality" },
  ],
  Rautahat: [
    { name: "Gaur", type: "Municipality" },
    { name: "Chandranigahapur", type: "Municipality" },
    { name: "Garuda", type: "Municipality" },
    { name: "Pipra", type: "Municipality" },
    { name: "Rajpur", type: "Municipality" },
    { name: "Paroha", type: "Municipality" },
    { name: "Yemunamai", type: "Municipality" },
    { name: "Katahariya", type: "Municipality" },
    { name: "Brindaban", type: "Rural Municipality" },
    { name: "Rajdevi", type: "Rural Municipality" },
    { name: "Gauri", type: "Rural Municipality" },
    { name: "Dewahi", type: "Rural Municipality" },
    { name: "Fatuwa", type: "Rural Municipality" },
  ],
  Bara: [
    { name: "Kalaiya", type: "Municipality" },
    { name: "Nijgadh", type: "Municipality" },
    { name: "Simaraungadh", type: "Municipality" },
    { name: "Jeetpur", type: "Municipality" },
    { name: "Pipara", type: "Municipality" },
    { name: "Kolhabi", type: "Municipality" },
    { name: "Suwarna", type: "Municipality" },
    { name: "Jitpur", type: "Municipality" },
    { name: "Pheta", type: "Rural Municipality" },
    { name: "Subarna", type: "Rural Municipality" },
    { name: "Bodhgan", type: "Rural Municipality" },
    { name: "Maharajganj", type: "Rural Municipality" },
    { name: "Bishrampur", type: "Rural Municipality" },
  ],
  Parsa: [
    { name: "Birgunj", type: "Metropolitan" },
    { name: "Pokhariya", type: "Municipality" },
    { name: "Jirbhawani", type: "Municipality" },
    { name: "Paterwa", type: "Municipality" },
    { name: "Sakhuwanankarkatti", type: "Municipality" },
    { name: "Bindabasini", type: "Municipality" },
    { name: "Thori", type: "Rural Municipality" },
    { name: "Amlekhgunj", type: "Rural Municipality" },
    { name: "Biruwaguthi", type: "Rural Municipality" },
    { name: "Chhipaharmai", type: "Rural Municipality" },
    { name: "Jeetpur", type: "Rural Municipality" },
    { name: "Pakahamainpur", type: "Rural Municipality" },
    { name: "Bahudaramai", type: "Rural Municipality" },
  ],
  Sindhuli: [
    { name: "Kamalamai", type: "Municipality" },
    { name: "Sindhuligadhi", type: "Municipality" },
    { name: "Dudhkunda", type: "Municipality" },
    { name: "Hariharpurgadhi", type: "Rural Municipality" },
    { name: "Golanjor", type: "Rural Municipality" },
    { name: "Bhimeshthang", type: "Rural Municipality" },
    { name: "Phikkal", type: "Rural Municipality" },
    { name: "Tinpatan", type: "Rural Municipality" },
  ],
  Ramechhap: [
    { name: "Manthali", type: "Municipality" },
    { name: "Ramechhap", type: "Municipality" },
    { name: "Khadadevi", type: "Rural Municipality" },
    { name: "Sunapati", type: "Rural Municipality" },
    { name: "Gokulgandaki", type: "Rural Municipality" },
    { name: "Lalitpur", type: "Rural Municipality" },
    { name: "Umakunda", type: "Rural Municipality" },
  ],
  Dolakha: [
    { name: "Bhimeshwar", type: "Municipality" },
    { name: "Charikot", type: "Municipality" },
    { name: "Jiri", type: "Municipality" },
    { name: "Shailung", type: "Rural Municipality" },
    { name: "Gaurishankar", type: "Rural Municipality" },
    { name: "Kalinchok", type: "Rural Municipality" },
    { name: "Bigu", type: "Rural Municipality" },
    { name: "Tamakoshi", type: "Rural Municipality" },
  ],
  Sindhupalchok: [
    { name: "Chautara", type: "Municipality" },
    { name: "Barhabise", type: "Municipality" },
    { name: "Balephi", type: "Rural Municipality" },
    { name: "Gumba", type: "Rural Municipality" },
    { name: "Helambu", type: "Rural Municipality" },
    { name: "Jugal", type: "Rural Municipality" },
    { name: "Lisankhu", type: "Rural Municipality" },
    { name: "Melamchi", type: "Rural Municipality" },
    { name: "Panchpokhari", type: "Rural Municipality" },
    { name: "Tripurasundari", type: "Rural Municipality" },
  ],
  Kavrepalanchok: [
    { name: "Dhulikhel", type: "Municipality" },
    { name: "Banepa", type: "Municipality" },
    { name: "Panauti", type: "Municipality" },
    { name: "Panchkhal", type: "Municipality" },
    { name: "Namobuddha", type: "Municipality" },
    { name: "Mandandeupur", type: "Municipality" },
    { name: "Khanikhola", type: "Rural Municipality" },
    { name: "Chaurideurali", type: "Rural Municipality" },
    { name: "Bhumlu", type: "Rural Municipality" },
    { name: "Roshi", type: "Rural Municipality" },
    { name: "Bethanchok", type: "Rural Municipality" },
    { name: "Mahabharat", type: "Rural Municipality" },
  ],
  Nuwakot: [
    { name: "Bidur", type: "Municipality" },
    { name: "Nuwakot", type: "Municipality" },
    { name: "Kakani", type: "Rural Municipality" },
    { name: "Likhu", type: "Rural Municipality" },
    { name: "Panchakanya", type: "Rural Municipality" },
    { name: "Shivapuri", type: "Rural Municipality" },
    { name: "Tadi", type: "Rural Municipality" },
    { name: "Tupche", type: "Rural Municipality" },
    { name: "Ghyangphedi", type: "Rural Municipality" },
  ],
  Rasuwa: [
    { name: "Dhunche", type: "Municipality" },
    { name: "Uttargaya", type: "Rural Municipality" },
    { name: "Aamachhodingmo", type: "Rural Municipality" },
    { name: "Gosaikunda", type: "Rural Municipality" },
    { name: "Kalika", type: "Rural Municipality" },
  ],
  Dhading: [
    { name: "Dhading Besi", type: "Municipality" },
    { name: "Nilakantha", type: "Municipality" },
    { name: "Gajuri", type: "Municipality" },
    { name: "Galchhi", type: "Rural Municipality" },
    { name: "Thakre", type: "Rural Municipality" },
    { name: "Gangajamuna", type: "Rural Municipality" },
    { name: "Jyamruk", type: "Rural Municipality" },
    { name: "Khwolakar", type: "Rural Municipality" },
    { name: "Benighat", type: "Rural Municipality" },
    { name: "Rubi Valley", type: "Rural Municipality" },
    { name: "Salyantar", type: "Rural Municipality" },
    { name: "Tripurasundari", type: "Rural Municipality" },
  ],
  Chitwan: [
    { name: "Bharatpur", type: "Metropolitan" },
    { name: "Ratnanagar", type: "Municipality" },
    { name: "Khairahani", type: "Municipality" },
    { name: "Kalika", type: "Municipality" },
    { name: "Rapti", type: "Municipality" },
    { name: "Ichchhyakamana", type: "Rural Municipality" },
    { name: "Madi", type: "Municipality" },
  ],
  Makwanpur: [
    { name: "Hetauda", type: "Sub-Metropolitan" },
    { name: "Thaha", type: "Municipality" },
    { name: "Makwanpurgadhi", type: "Municipality" },
    { name: "Bakaiya", type: "Rural Municipality" },
    { name: "Kailash", type: "Rural Municipality" },
    { name: "Raksirang", type: "Rural Municipality" },
    { name: "Manahari", type: "Rural Municipality" },
    { name: "Indrasarowar", type: "Rural Municipality" },
    { name: "Bhimphedi", type: "Rural Municipality" },
  ],
  Kathmandu: [
    { name: "Kathmandu", type: "Metropolitan" },
    { name: "Kirtipur", type: "Municipality" },
    { name: "Gokarneshwor", type: "Municipality" },
    { name: "Shankharapur", type: "Municipality" },
    { name: "Budhanilkantha", type: "Municipality" },
    { name: "Chandragiri", type: "Municipality" },
    { name: "Tokha", type: "Municipality" },
    { name: "Tarakeshwar", type: "Municipality" },
    { name: "Nagarjun", type: "Municipality" },
    { name: "Dakshinkali", type: "Municipality" },
    { name: "Kageshwori Manohara", type: "Municipality" },
  ],
  Lalitpur: [
    { name: "Lalitpur", type: "Metropolitan" },
    { name: "Godawari", type: "Municipality" },
    { name: "Mahalaxmi", type: "Municipality" },
    { name: "Konjyosom", type: "Rural Municipality" },
    { name: "Bagmati", type: "Rural Municipality" },
    { name: "Chandragiri", type: "Rural Municipality" },
  ],
  Bhaktapur: [
    { name: "Bhaktapur", type: "Municipality" },
    { name: "Madhyapur Thimi", type: "Municipality" },
    { name: "Suryabinayak", type: "Municipality" },
    { name: "Changunarayan", type: "Municipality" },
  ],
  Gorkha: [
    { name: "Gorkha", type: "Municipality" },
    { name: "Pokharithok", type: "Municipality" },
    { name: "Arughat", type: "Municipality" },
    { name: "Palungtar", type: "Municipality" },
    { name: "Ajirkot", type: "Rural Municipality" },
    { name: "Bhimsen", type: "Rural Municipality" },
    { name: "Chum Nubri", type: "Rural Municipality" },
    { name: "Dhawa", type: "Rural Municipality" },
    { name: "Gandaki", type: "Rural Municipality" },
    { name: "Larpak", type: "Rural Municipality" },
    { name: "Sahid Lakhan", type: "Rural Municipality" },
    { name: "Sirdibas", type: "Rural Municipality" },
  ],
  Lamjung: [
    { name: "Besisahar", type: "Municipality" },
    { name: "Sundi Bazar", type: "Municipality" },
    { name: "Rainas", type: "Municipality" },
    { name: "Dudhpokhari", type: "Rural Municipality" },
    { name: "Marsyangdi", type: "Rural Municipality" },
    { name: "Kwholasothar", type: "Rural Municipality" },
    { name: "Madhyanepal", type: "Rural Municipality" },
  ],
  Tanahu: [
    { name: "Byas", type: "Municipality" },
    { name: "Shuklagandaki", type: "Municipality" },
    { name: "Vyangju", type: "Rural Municipality" },
    { name: "Bhanu", type: "Municipality" },
    { name: "Anbukhaireni", type: "Municipality" },
    { name: "Devghat", type: "Rural Municipality" },
    { name: "Bandipur", type: "Rural Municipality" },
    { name: "Ghiring", type: "Rural Municipality" },
    { name: "Myagde", type: "Rural Municipality" },
    { name: "Rishing", type: "Rural Municipality" },
  ],
  Kaski: [
    { name: "Pokhara", type: "Metropolitan" },
    { name: "Lekhnath", type: "Municipality" },
    { name: "Rupa", type: "Rural Municipality" },
    { name: "Machhapuchchhre", type: "Rural Municipality" },
    { name: "Annapurna", type: "Rural Municipality" },
    { name: "Sardikhola", type: "Rural Municipality" },
  ],
  Syangja: [
    { name: "Syangja", type: "Municipality" },
    { name: "Putalibazar", type: "Municipality" },
    { name: "Waling", type: "Municipality" },
    { name: "Chapakot", type: "Rural Municipality" },
    { name: "Kaligandaki", type: "Rural Municipality" },
    { name: "Biruwa", type: "Rural Municipality" },
    { name: "Bhirkot", type: "Rural Municipality" },
    { name: "Galyang", type: "Municipality" },
    { name: "Arjun", type: "Rural Municipality" },
    { name: "Phedikhola", type: "Rural Municipality" },
  ],
  Nawalpur: [
    { name: "Gaindakot", type: "Municipality" },
    { name: "Nawalparasi", type: "Municipality" },
    { name: "Kawasoti", type: "Municipality" },
    { name: "Bardaghat", type: "Municipality" },
    { name: "Susta", type: "Rural Municipality" },
    { name: "Bulingtar", type: "Rural Municipality" },
    { name: "Hupsekot", type: "Rural Municipality" },
    { name: "Madhyabindu", type: "Municipality" },
  ],
  Manang: [
    { name: "Chame", type: "Municipality" },
    { name: "Nashong", type: "Rural Municipality" },
    { name: "Narphu", type: "Rural Municipality" },
    { name: "Pisang", type: "Rural Municipality" },
  ],
  Mustang: [
    { name: "Jomsom", type: "Municipality" },
    { name: "Lomanthang", type: "Municipality" },
    { name: "Gharapjhong", type: "Rural Municipality" },
    { name: "Dalami", type: "Rural Municipality" },
    { name: "Chhoser", type: "Rural Municipality" },
  ],
  Parbat: [
    { name: "Kushma", type: "Municipality" },
    { name: "Modi", type: "Municipality" },
    { name: "Phalebas", type: "Municipality" },
    { name: "Huwas", type: "Municipality" },
    { name: "Balewa", type: "Municipality" },
    { name: "Bihadi", type: "Rural Municipality" },
    { name: "Deupur", type: "Rural Municipality" },
    { name: "Mahashila", type: "Rural Municipality" },
    { name: "Paiyun", type: "Rural Municipality" },
    { name: "Jaljala", type: "Rural Municipality" },
  ],
  Myagdi: [
    { name: "Beni", type: "Municipality" },
    { name: "Myagdi", type: "Municipality" },
    { name: "Raghuganga", type: "Municipality" },
    { name: "Annapurna", type: "Rural Municipality" },
    { name: "Dhaulagiri", type: "Rural Municipality" },
    { name: "Mangala", type: "Rural Municipality" },
    { name: "Malika", type: "Rural Municipality" },
  ],
  Baglung: [
    { name: "Baglung", type: "Municipality" },
    { name: "Dhorpatan", type: "Municipality" },
    { name: "Galkot", type: "Municipality" },
    { name: "Jaimini", type: "Municipality" },
    { name: "Kathekhola", type: "Municipality" },
    { name: "Badigad", type: "Rural Municipality" },
    { name: "Nisikhola", type: "Rural Municipality" },
    { name: "Tara Khola", type: "Rural Municipality" },
    { name: "Balewa", type: "Rural Municipality" },
    { name: "Bohoragaun", type: "Rural Municipality" },
  ],
  Parasi: [
    { name: "Ramgram", type: "Municipality" },
    { name: "Sunawal", type: "Municipality" },
    { name: "Pratappur", type: "Municipality" },
    { name: "Susta", type: "Rural Municipality" },
    { name: "Bardinath", type: "Rural Municipality" },
    { name: "Sarawal", type: "Rural Municipality" },
  ],
  Rupandehi: [
    { name: "Siddharthanagar", type: "Municipality" },
    { name: "Butwal", type: "Sub-Metropolitan" },
    { name: "Lumbini Sanskritik", type: "Municipality" },
    { name: "Tilottama", type: "Municipality" },
    { name: "Devdaha", type: "Municipality" },
    { name: "Sainamaina", type: "Municipality" },
    { name: "Marchawari", type: "Rural Municipality" },
    { name: "Kotahimai", type: "Rural Municipality" },
    { name: "Mayadevi", type: "Rural Municipality" },
    { name: "Omsatiya", type: "Rural Municipality" },
    { name: "Rohini", type: "Rural Municipality" },
  ],
  Kapilvastu: [
    { name: "Kapilvastu", type: "Municipality" },
    { name: "Taulihawa", type: "Municipality" },
    { name: "Lumbini", type: "Municipality" },
    { name: "Banganga", type: "Municipality" },
    { name: "Krishnanagar", type: "Municipality" },
    { name: "Maharajganj", type: "Municipality" },
    { name: "Shivaraj", type: "Municipality" },
    { name: "Bijaynagar", type: "Rural Municipality" },
    { name: "Dobhan", type: "Rural Municipality" },
    { name: "Buddhabhumi", type: "Municipality" },
  ],
  Palpa: [
    { name: "Tansen", type: "Municipality" },
    { name: "Rampur", type: "Municipality" },
    { name: "Rishing", type: "Municipality" },
    { name: "Tinau", type: "Rural Municipality" },
    { name: "Purba", type: "Rural Municipality" },
    { name: "Ribdikot", type: "Rural Municipality" },
    { name: "Nisdi", type: "Rural Municipality" },
    { name: "Mathagadhi", type: "Rural Municipality" },
  ],
  Arghakhanchi: [
    { name: "Sandhikharka", type: "Municipality" },
    { name: "Sitganga", type: "Municipality" },
    { name: "Panini", type: "Rural Municipality" },
    { name: "Chhatraganj", type: "Rural Municipality" },
    { name: "Malarani", type: "Rural Municipality" },
    { name: "Argha", type: "Rural Municipality" },
  ],
  Gulmi: [
    { name: "Tamghas", type: "Municipality" },
    { name: "Resunga", type: "Municipality" },
    { name: "Gulmi", type: "Municipality" },
    { name: "Ruru", type: "Municipality" },
    { name: "Chatrakot", type: "Rural Municipality" },
    { name: "Dhurkot", type: "Rural Municipality" },
    { name: "Isma", type: "Rural Municipality" },
    { name: "Malika", type: "Rural Municipality" },
    { name: "Musikot", type: "Rural Municipality" },
  ],
  Pyuthan: [
    { name: "Pyuthan", type: "Municipality" },
    { name: "Bijuwar", type: "Municipality" },
    { name: "Sworgadwari", type: "Municipality" },
    { name: "Machchhe", type: "Rural Municipality" },
    { name: "Naya Gaun", type: "Rural Municipality" },
    { name: "Arkha", type: "Rural Municipality" },
    { name: "Hansapur", type: "Rural Municipality" },
    { name: "Khaira", type: "Rural Municipality" },
  ],
  Rolpa: [
    { name: "Liwang", type: "Municipality" },
    { name: "Rolpa", type: "Municipality" },
    { name: "Thawang", type: "Municipality" },
    { name: "Sriam", type: "Municipality" },
    { name: "Jaimakasala", type: "Rural Municipality" },
    { name: "Runtigadi", type: "Rural Municipality" },
    { name: "Madi", type: "Rural Municipality" },
    { name: "Sukidang", type: "Rural Municipality" },
    { name: "Sunchal", type: "Rural Municipality" },
  ],
  Dang: [
    { name: "Ghorahi", type: "Sub-Metropolitan" },
    { name: "Tulsipur", type: "Sub-Metropolitan" },
    { name: "Narayanpur", type: "Municipality" },
    { name: "Lamahi", type: "Municipality" },
    { name: "Rajpur", type: "Municipality" },
    { name: "Rapti", type: "Municipality" },
    { name: "Shantinagar", type: "Municipality" },
    { name: "Gadhawa", type: "Rural Municipality" },
    { name: "Bangalachuli", type: "Rural Municipality" },
    { name: "Dangisharan", type: "Rural Municipality" },
  ],
  Banke: [
    { name: "Nepalgunj", type: "Sub-Metropolitan" },
    { name: "Kohalpur", type: "Municipality" },
    { name: "Gulariya", type: "Municipality" },
    { name: "Khaskusma", type: "Municipality" },
    { name: "Rapti Sonari", type: "Rural Municipality" },
    { name: "Duduwa", type: "Rural Municipality" },
    { name: "Baijanath", type: "Rural Municipality" },
    { name: "Janki", type: "Rural Municipality" },
  ],
  Bardiya: [
    { name: "Gulariya", type: "Municipality" },
    { name: "Rajapur", type: "Municipality" },
    { name: "Thakurdwara", type: "Municipality" },
    { name: "Basgadhi", type: "Municipality" },
    { name: "Bansgadhi", type: "Municipality" },
    { name: "Madhuvan", type: "Municipality" },
    { name: "Baradhiya", type: "Rural Municipality" },
    { name: "Geruwa", type: "Rural Municipality" },
    { name: "Suryapatuwa", type: "Rural Municipality" },
  ],
  "Rukum East": [
    { name: "Rukumkot", type: "Municipality" },
    { name: "Putha Uttarganga", type: "Municipality" },
    { name: "Sisne", type: "Rural Municipality" },
    { name: "Bhagawati", type: "Rural Municipality" },
    { name: "Jhulam", type: "Rural Municipality" },
  ],
  Mugu: [
    { name: "Gamgadhi", type: "Municipality" },
    { name: "Rara", type: "Rural Municipality" },
    { name: "Chhayanath", type: "Rural Municipality" },
    { name: "Mugum Karmarong", type: "Rural Municipality" },
  ],
  Humla: [
    { name: "Simikot", type: "Municipality" },
    { name: "Kharpunath", type: "Rural Municipality" },
    { name: "Chankheli", type: "Rural Municipality" },
    { name: "Sarkegad", type: "Rural Municipality" },
    { name: "Namkha", type: "Rural Municipality" },
  ],
  Jumla: [
    { name: "Chandannath", type: "Municipality" },
    { name: "Jumla", type: "Municipality" },
    { name: "Guthichaur", type: "Rural Municipality" },
    { name: "Kanakasundari", type: "Rural Municipality" },
    { name: "Sinja", type: "Rural Municipality" },
    { name: "Tatopani", type: "Rural Municipality" },
    { name: "Dilachaur", type: "Rural Municipality" },
    { name: "Patarasi", type: "Rural Municipality" },
  ],
  Kalikot: [
    { name: "Manma", type: "Municipality" },
    { name: "Kalika", type: "Municipality" },
    { name: "Khandachakra", type: "Rural Municipality" },
    { name: "Tilagufa", type: "Rural Municipality" },
    { name: "Raskot", type: "Rural Municipality" },
    { name: "Pachaljalna", type: "Rural Municipality" },
    { name: "Sanni", type: "Rural Municipality" },
  ],
  Dolpa: [
    { name: "Dunai", type: "Municipality" },
    { name: "Tripurasundari", type: "Municipality" },
    { name: "Shey Phoksando", type: "Rural Municipality" },
    { name: "Chharka", type: "Rural Municipality" },
    { name: "Dolpo Buddha", type: "Rural Municipality" },
    { name: "Mudkechula", type: "Rural Municipality" },
  ],
  Surkhet: [
    { name: "Birendranagar", type: "Municipality" },
    { name: "Chinchu", type: "Municipality" },
    { name: "Babiyachaur", type: "Municipality" },
    { name: "Gurbhakot", type: "Municipality" },
    { name: "Panchapuri", type: "Municipality" },
    { name: "Lekbeshi", type: "Municipality" },
    { name: "Simta", type: "Rural Municipality" },
    { name: "Barahatal", type: "Rural Municipality" },
    { name: "Bheriganga", type: "Rural Municipality" },
  ],
  Dailekh: [
    { name: "Narayan", type: "Municipality" },
    { name: "Dailekh", type: "Municipality" },
    { name: "Dullu", type: "Municipality" },
    { name: "Bhagwatimai", type: "Rural Municipality" },
    { name: "Aathbis", type: "Rural Municipality" },
    { name: "Chamunda", type: "Rural Municipality" },
    { name: "Gurans", type: "Rural Municipality" },
    { name: "Dungeshwor", type: "Rural Municipality" },
    { name: "Naumule", type: "Rural Municipality" },
    { name: "Toli", type: "Rural Municipality" },
  ],
  Jajarkot: [
    { name: "Khalanga", type: "Municipality" },
    { name: "Barekot", type: "Rural Municipality" },
    { name: "Junichande", type: "Rural Municipality" },
    { name: "Kushe", type: "Rural Municipality" },
    { name: "Sinja", type: "Rural Municipality" },
    { name: "Dhawalagiri", type: "Rural Municipality" },
  ],
  "Rukum West": [
    { name: "Musikot", type: "Municipality" },
    { name: "Rukumkot", type: "Municipality" },
    { name: "Aathbis", type: "Municipality" },
    { name: "Banfikot", type: "Rural Municipality" },
    { name: "Chaurjahari", type: "Municipality" },
    { name: "Tribeni", type: "Rural Municipality" },
    { name: "Sani Bheri", type: "Rural Municipality" },
  ],
  Salyan: [
    { name: "Salyan", type: "Municipality" },
    { name: "Sharada", type: "Municipality" },
    { name: "Bagchaur", type: "Municipality" },
    { name: "Kapurchaur", type: "Municipality" },
    { name: "Balechha", type: "Rural Municipality" },
    { name: "Chhatreshwori", type: "Rural Municipality" },
    { name: "Dhanawang", type: "Rural Municipality" },
    { name: "Kalimati", type: "Rural Municipality" },
    { name: "Kotmai", type: "Rural Municipality" },
  ],
  Bajura: [
    { name: "Martadi", type: "Municipality" },
    { name: "Bajura", type: "Municipality" },
    { name: "Triveni", type: "Municipality" },
    { name: "Badimalika", type: "Municipality" },
    { name: "Buddhiganga", type: "Rural Municipality" },
    { name: "Gaumul", type: "Rural Municipality" },
    { name: "Himali", type: "Rural Municipality" },
    { name: "Jagannath", type: "Rural Municipality" },
    { name: "Kanda", type: "Rural Municipality" },
  ],
  Bajhang: [
    { name: "Chainpur", type: "Municipality" },
    { name: "Bajhang", type: "Municipality" },
    { name: "Jayaprithvi", type: "Municipality" },
    { name: "Khaptad", type: "Rural Municipality" },
    { name: "Bitthadchir", type: "Rural Municipality" },
    { name: "Durgathali", type: "Rural Municipality" },
    { name: "Masta", type: "Rural Municipality" },
    { name: "Ranishikhar", type: "Rural Municipality" },
    { name: "Shivath", type: "Rural Municipality" },
  ],
  Darchula: [
    { name: "Darchula", type: "Municipality" },
    { name: "Mahakali", type: "Municipality" },
    { name: "Lekam", type: "Municipality" },
    { name: "Malikarjun", type: "Rural Municipality" },
    { name: "Naugad", type: "Rural Municipality" },
    { name: "Shailyashikhar", type: "Rural Municipality" },
    { name: "Apihimal", type: "Rural Municipality" },
  ],
  Kailali: [
    { name: "Dhangadhi", type: "Sub-Metropolitan" },
    { name: "Tikapur", type: "Municipality" },
    { name: "Attariya", type: "Municipality" },
    { name: "Godawari", type: "Municipality" },
    { name: "Bhajani", type: "Municipality" },
    { name: "Lamki Chuha", type: "Municipality" },
    { name: "Gauriganga", type: "Municipality" },
    { name: "Janaki", type: "Rural Municipality" },
    { name: "Chure", type: "Rural Municipality" },
    { name: "Basanta", type: "Rural Municipality" },
    { name: "Mohanyal", type: "Rural Municipality" },
  ],
  Kanchanpur: [
    { name: "Bhimdatta", type: "Municipality" },
    { name: "Mahendranagar", type: "Municipality" },
    { name: "Beldandi", type: "Municipality" },
    { name: "Patan", type: "Municipality" },
    { name: "Shuklaphanta", type: "Municipality" },
    { name: "Belauri", type: "Municipality" },
    { name: "Daijee", type: "Rural Municipality" },
    { name: "Baisi Bichawa", type: "Rural Municipality" },
    { name: "Krishnapur", type: "Rural Municipality" },
    { name: "Laljhadi", type: "Rural Municipality" },
    { name: "Shivaraj", type: "Rural Municipality" },
  ],
  Achham: [
    { name: "Mangalsen", type: "Municipality" },
    { name: "Achham", type: "Municipality" },
    { name: "Kamalbazar", type: "Municipality" },
    { name: "Bannigadhi", type: "Rural Municipality" },
    { name: "Chaurpati", type: "Rural Municipality" },
    { name: "Dhakari", type: "Rural Municipality" },
    { name: "Janakikunda", type: "Rural Municipality" },
    { name: "Mellekh", type: "Rural Municipality" },
    { name: "Panchadewal", type: "Rural Municipality" },
    { name: "Ramrosan", type: "Rural Municipality" },
  ],
  Doti: [
    { name: "Dipayal Silgadhi", type: "Municipality" },
    { name: "Shikhar", type: "Municipality" },
    { name: "Bogtan", type: "Rural Municipality" },
    { name: "Chaupati", type: "Rural Municipality" },
    { name: "K.I.Singh", type: "Rural Municipality" },
    { name: "Purbichauki", type: "Rural Municipality" },
    { name: "Sayal", type: "Rural Municipality" },
    { name: "Badikedar", type: "Rural Municipality" },
    { name: "Jorayal", type: "Rural Municipality" },
  ],
  Dadeldhura: [
    { name: "Dadeldhura", type: "Municipality" },
    { name: "Amargadhi", type: "Municipality" },
    { name: "Ganeshpur", type: "Municipality" },
    { name: "Parashuram", type: "Rural Municipality" },
    { name: "Bhageshwar", type: "Rural Municipality" },
    { name: "Ajaymeru", type: "Rural Municipality" },
    { name: "Navadurga", type: "Rural Municipality" },
  ],
  Baitadi: [
    { name: "Baitadi", type: "Municipality" },
    { name: "Dasharathchanda", type: "Municipality" },
    { name: "Patan", type: "Municipality" },
    { name: "Melauli", type: "Municipality" },
    { name: "Siddheswor", type: "Rural Municipality" },
    { name: "Dilasaini", type: "Rural Municipality" },
    { name: "Shivaswor", type: "Rural Municipality" },
    { name: "Purchaudi", type: "Rural Municipality" },
    { name: "Dogdakedar", type: "Rural Municipality" },
    { name: "Srijana", type: "Rural Municipality" },
  ],
};

export const ALL_DISTRICTS: DistrictInfo[] = Object.entries(DISTRICTS_BY_PROVINCE).flatMap(
  ([province, districts]) =>
    districts.map((district) => ({
      name: district,
      province: province as Province,
      municipalities: MUNICIPALITIES_BY_DISTRICT[district],
    }))
);

export const DISTRICT_DELIVERY_RULES: DistrictDeliveryRule[] = [
  { district: "Kathmandu", province: "Bagmati", codAvailable: true, fee: 100, freeDeliveryThreshold: 0, serviceLevel: "valley", estimatedDays: "1-2 business days" },
  { district: "Lalitpur", province: "Bagmati", codAvailable: true, fee: 100, freeDeliveryThreshold: 0, serviceLevel: "valley", estimatedDays: "1-2 business days" },
  { district: "Bhaktapur", province: "Bagmati", codAvailable: true, fee: 120, freeDeliveryThreshold: 0, serviceLevel: "valley", estimatedDays: "1-2 business days" },
];

export const PROVINCE_DELIVERY_DEFAULTS: ProvinceDeliveryDefault[] = [
  { province: "Bagmati", codAvailable: true, fee: 150, freeDeliveryThreshold: 0, serviceLevel: "valley", estimatedDays: "1-2 business days" },
  { province: "Gandaki", codAvailable: false, fee: 0, freeDeliveryThreshold: 0, serviceLevel: "pending", estimatedDays: "Outside delivery area" },
  { province: "Lumbini", codAvailable: false, fee: 0, freeDeliveryThreshold: 0, serviceLevel: "pending", estimatedDays: "Outside delivery area" },
  { province: "Koshi", codAvailable: false, fee: 0, freeDeliveryThreshold: 0, serviceLevel: "pending", estimatedDays: "Outside delivery area" },
  { province: "Madhesh", codAvailable: false, fee: 0, freeDeliveryThreshold: 0, serviceLevel: "pending", estimatedDays: "Outside delivery area" },
  { province: "Karnali", codAvailable: false, fee: 0, freeDeliveryThreshold: 0, serviceLevel: "pending", estimatedDays: "Outside delivery area" },
  { province: "Sudurpashchim", codAvailable: false, fee: 0, freeDeliveryThreshold: 0, serviceLevel: "pending", estimatedDays: "Outside delivery area" },
];

export function getDistrictsForProvince(province: Province): District[] {
  return DISTRICTS_BY_PROVINCE[province] ?? DISTRICTS_BY_PROVINCE.Bagmati;
}

export function getMunicipalitiesForDistrict(district: District): Municipality[] {
  return MUNICIPALITIES_BY_DISTRICT[district] ?? [];
}

export function getDeliveryRule(district: District, province: Province): DistrictDeliveryRule | ProvinceDeliveryDefault {
  const exact = DISTRICT_DELIVERY_RULES.find((rule) => rule.district === district && rule.province === province);
  if (exact) return exact;
  return PROVINCE_DELIVERY_DEFAULTS.find((rule) => rule.province === province) ?? PROVINCE_DELIVERY_DEFAULTS.find((rule) => rule.province === "Bagmati")!;
}

// ─── Delivery fee (mirrors backend/src/utils/delivery.ts EXACTLY) ───────────────
// The backend recomputes the fee server-side on order placement and rejects the
// order ("Delivery fee mismatch — please refresh and try again") if the client's
// value differs by more than NPR 5. Keep these tables in sync with the backend.
//
// The backend stores fees as a flat Record<districtName, fee> keyed by the
// human-readable district name (e.g. "Kathmandu", "Rukum West"). The lookup is
// case-INSENSITIVE on the district, and the province is looked up case-SENSITIVELY
// (falling back to 150 on a miss). We mirror that exact behaviour to stay within
// tolerance, so the frontend MUST use the same flat structure.
export const DELIVERY_FREE_THRESHOLD = 2500;

// IMPORTANT: keep these values identical to DISTRICT_DELIVERY_FEES /
// PROVINCE_DEFAULTS in backend/src/utils/delivery.ts. The keys are the canonical
// district / province names and are compared case-insensitively.
const DISTRICT_DELIVERY_FEES_CLIENT: Record<string, number> = {
  // Bagmati (valley + near)
  "Kathmandu": 0, "Lalitpur": 0, "Bhaktapur": 50,
  "Kavrepalanchok": 100, "Dhading": 120, "Chitwan": 100,
  "Makwanpur": 120, "Sindhupalchok": 150, "Nuwakot": 150,
  "Rasuwa": 200, "Ramechhap": 200, "Sindhuli": 200,
  "Dolakha": 250,
  // Gandaki
  "Kaski": 100, "Tanahu": 120, "Syangja": 150,
  "Gorkha": 150, "Lamjung": 150, "Nawalpur": 120,
  "Parbat": 150, "Baglung": 150, "Myagdi": 200,
  "Mustang": 300, "Manang": 300,
  // Lumbini
  "Rupandehi": 100, "Kapilvastu": 120, "Palpa": 150,
  "Arghakhanchi": 150, "Gulmi": 150, "Pyuthan": 200,
  "Rolpa": 200, "Dang": 150, "Banke": 150,
  "Bardiya": 150, "Parasi": 120,
  // Koshi
  "Jhapa": 150, "Morang": 150, "Sunsari": 150,
  "Ilam": 200, "Panchthar": 200, "Taplejung": 250,
  "Bhojpur": 250, "Dhankuta": 250, "Terhathum": 250,
  "Sankhuwasabha": 300, "Solukhumbu": 300, "Okhaldhunga": 250,
  "Khotang": 250, "Udayapur": 200,
  // Madhesh
  "Saptari": 150, "Siraha": 150, "Dhanusha": 150,
  "Mahottari": 150, "Sarlahi": 150, "Rautahat": 150,
  "Bara": 150, "Parsa": 150,
  // Karnali
  "Surkhet": 200, "Kalikot": 300, "Jumla": 300,
  "Mugu": 350, "Humla": 350, "Dolpa": 350,
  "Dailekh": 250, "Jajarkot": 250, "Rukum West": 250,
  "Salyan": 250, "Rukum East": 250, "Bajura": 300,
  "Bajhang": 300, "Darchula": 300,
  // Sudurpashchim
  "Kailali": 200, "Kanchanpur": 200,
  "Achham": 250, "Doti": 250,
  "Dadeldhura": 300, "Baitadi": 250,
};

const PROVINCE_DEFAULTS_CLIENT: Record<string, number> = {
  "Koshi": 200, "Madhesh": 150, "Bagmati": 100, "Gandaki": 150,
  "Lumbini": 120, "Karnali": 300, "Sudurpashchim": 250,
};

export function calculateDeliveryFee(subtotal: number, district: District, province: Province): number {
  // IMPORTANT: This MUST mirror backend/src/utils/delivery.ts `calculateDeliveryFee`
  // exactly. The backend recomputes the fee server-side on order placement and
  // rejects the order ("Delivery fee mismatch") if the client value differs by
  // more than NPR 5. Any change here must be reflected in the backend too.
  //
  // Parity quirk to preserve: the backend matches the DISTRICT case-insensitively
  // but looks the PROVINCE up case-SENSITIVELY (falling back to 150 on a miss).
  // We mirror that exact behaviour to stay within tolerance.
  if (subtotal >= DELIVERY_FREE_THRESHOLD) return 0;
  const districtKey = Object.keys(DISTRICT_DELIVERY_FEES_CLIENT).find(
    (d) => d.toLowerCase() === String(district).toLowerCase(),
  );
  if (districtKey !== undefined) return DISTRICT_DELIVERY_FEES_CLIENT[districtKey];
  return PROVINCE_DEFAULTS_CLIENT[province] ?? 150;
}

export function getFreeDeliveryProgress(subtotal: number, district: District, province: Province): { threshold: number; remaining: number; percent: number } {
  const threshold = DELIVERY_FREE_THRESHOLD;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;
  return { threshold, remaining, percent };
}

export function isValidProvinceDistrictCombo(province: Province, district: District): boolean {
  return DISTRICTS_BY_PROVINCE[province]?.includes(district) ?? false;
}

export function isCodAvailable(district: District, province: Province): boolean {
  return getDeliveryRule(district, province).codAvailable;
}

