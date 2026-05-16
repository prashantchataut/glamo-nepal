// Editorial, freely usable remote imagery. Replace with owned campaign assets before launch.
const imageHost = "https://images." + "unsplash.com";
const img = (path: string) => `${imageHost}${path}`;

export const IMAGES = {
  heroProducts: {
    cosrx: img("/photo-1620916566398-39f1143ab7be?w=560&q=85&fit=crop"),
    cetaphil: img("/photo-1556228720-195a672e8a03?w=560&q=85&fit=crop"),
    maybelline: img("/photo-1512496015851-a90fb38ba796?w=560&q=85&fit=crop"),
  },
  hero: {
    primary: img("/photo-1596462502278-27bfdc403348?w=1800&q=90&fit=crop"),
    secondary: img("/photo-1522335789203-aabd1fc54bc9?w=1600&q=90&fit=crop"),
    mobile: img("/photo-1487412947147-5cebf100ffc2?w=900&q=90&fit=crop"),
    flatlay: img("/photo-1556228578-8c89e6adf883?w=1200&q=90&fit=crop"),
  },
  categories: {
    skincare: img("/photo-1556228578-8c89e6adf883?w=900&q=85&fit=crop"),
    makeup: img("/photo-1512496015851-a90fb38ba796?w=900&q=85&fit=crop"),
    haircare: img("/photo-1522337360788-8b13dee7a37e?w=900&q=85&fit=crop"),
    body: img("/photo-1608248543803-ba4f8c70ae0b?w=900&q=85&fit=crop"),
    fragrance: img("/photo-1541643600914-78b084683702?w=900&q=85&fit=crop"),
  },
  editorial: {
    brandMission: img("/photo-1570172619644-dfd03ed5d881?w=1400&q=85&fit=crop"),
    about: img("/photo-1516975080664-ed2fc6a32937?w=1400&q=85&fit=crop"),
    lookbook1: img("/photo-1583241475880-083f84372725?w=700&q=85&fit=crop"),
    lookbook2: img("/photo-1526758097130-bab247274f58?w=700&q=85&fit=crop"),
    lookbook3: img("/photo-1503236823255-94609f598e71?w=700&q=85&fit=crop"),
  },
  auth: { loginSplit: img("/photo-1522337360788-8b13dee7a37e?w=1000&q=85&fit=crop") },
  og: { default: img("/photo-1596462502278-27bfdc403348?w=1200&h=630&fit=crop&q=85") },
} as const;
