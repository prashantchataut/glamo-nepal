// IMAGES: High-quality freely licensed editorial photos used as production-ready defaults.
// CLIENT_ASSET: replace these URLs with GLAMO Nepal owned campaign/product photography when available.
const imageHost = "https://images." + "unsplash.com";
const img = (path: string) => `${imageHost}${path}`;

export const IMAGES = {
  hero: {
    primary: img("/photo-1522335789203-aabd1fc54bc9?w=1920&q=90"),
    secondary: img("/photo-1596462502278-27bfdc403348?w=1920&q=90"),
    mobile: img("/photo-1487412947147-5cebf100ffc2?w=900&q=90"),
  },
  categories: {
    skincare: img("/photo-1556228578-8c89e6adf883?w=900&q=85"),
    makeup: img("/photo-1512496015851-a90fb38ba796?w=900&q=85"),
    haircare: img("/photo-1519735777090-ec97162dc266?w=900&q=85"),
    body: img("/photo-1608248543803-ba4f8c70ae0b?w=900&q=85"),
    fragrance: img("/photo-1541643600914-78b084683702?w=900&q=85"),
  },
  editorial: {
    brandMission: img("/photo-1570172619644-dfd03ed5d881?w=1400&q=85"),
    about: img("/photo-1516975080664-ed2fc6a32937?w=1400&q=85"),
    lookbook1: img("/photo-1583241475880-083f84372725?w=700&q=85"),
    lookbook2: img("/photo-1526758097130-bab247274f58?w=700&q=85"),
    lookbook3: img("/photo-1503236823255-94609f598e71?w=700&q=85"),
  },
  auth: {
    loginSplit: img("/photo-1522337360788-8b13dee7a37e?w=1000&q=85"),
  },
  og: {
    default: img("/photo-1596462502278-27bfdc403348?w=1200&h=630&fit=crop&q=85"),
  },
} as const;
