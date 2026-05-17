// Curated remote editorial imagery. Replace with owned supplier/campaign assets before launch.
const unsplashHost = "https://images." + "unsplash.com";
const pexelsHost = "https://images." + "pexels.com";
const u = (path: string) => `${unsplashHost}${path}`;
const p = (path: string) => `${pexelsHost}${path}`;

export const IMAGES = {
  heroProducts: {
    cosrx: u("/photo-1620916566398-39f1143ab7be?w=680&q=86&fit=crop&auto=format"),
    cetaphil: u("/photo-1556228720-195a672e8a03?w=680&q=86&fit=crop&auto=format"),
    boj: u("/photo-1556228578-8c89e6adf883?w=680&q=86&fit=crop&auto=format"),
    maybelline: u("/photo-1512496015851-a90fb38ba796?w=680&q=86&fit=crop&auto=format"),
  },
  hero: {
    primary: u("/photo-1522335789203-aabd1fc54bc9?w=1600&q=90&fit=crop&auto=format"),
    secondary: u("/photo-1596462502278-27bfdc403348?w=1600&q=90&fit=crop&auto=format"),
    mobile: u("/photo-1487412947147-5cebf100ffc2?w=900&q=90&fit=crop&auto=format"),
    flatlay: u("/photo-1556228578-8c89e6adf883?w=1400&q=90&fit=crop&auto=format"),
  },
  categories: {
    skincare: u("/photo-1556228578-8c89e6adf883?w=900&q=86&fit=crop&auto=format"),
    makeup: u("/photo-1512496015851-a90fb38ba796?w=900&q=86&fit=crop&auto=format"),
    haircare: u("/photo-1522337360788-8b13dee7a37e?w=900&q=86&fit=crop&auto=format"),
    body: u("/photo-1608248543803-ba4f8c70ae0b?w=900&q=86&fit=crop&auto=format"),
    fragrance: u("/photo-1588405748880-12d1d2a59f75?w=900&q=86&fit=crop&auto=format"),
  },
  editorial: {
    brandMission: u("/photo-1570172619644-dfd03ed5d881?w=1400&q=86&fit=crop&auto=format"),
    about: u("/photo-1516975080664-ed2fc6a32937?w=1400&q=86&fit=crop&auto=format"),
    ritual: u("/photo-1616394584738-fc6e612e71b9?w=1400&q=86&fit=crop&auto=format"),
    shelf: u("/photo-1608248597279-f99d160bfcbc?w=1400&q=86&fit=crop&auto=format"),
    texture: u("/photo-1596755094514-f87e34085b2c?w=1400&q=86&fit=crop&auto=format"),
    lookbook1: p("/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=900"),
    lookbook2: u("/photo-1583241475880-083f84372725?w=900&q=86&fit=crop&auto=format"),
    lookbook3: u("/photo-1503236823255-94609f598e71?w=900&q=86&fit=crop&auto=format"),
  },
  auth: {
    loginSplit: u("/photo-1522337360788-8b13dee7a37e?w=1000&q=86&fit=crop&auto=format"),
  },
  og: {
    default: u("/photo-1596462502278-27bfdc403348?w=1200&h=630&fit=crop&q=86&auto=format"),
  },
} as const;
