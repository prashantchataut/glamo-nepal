// GLAMO Nepal — Curated Image Library
// All images: Unsplash free license. Replace CLIENT_ASSET entries with owned campaign photography before launch.
const unsplashHost = "https://images." + "unsplash.com";
const u = (path: string) => `${unsplashHost}${path}`;

export const GLAMO_IMAGES = {
  hero: {
    // CLIENT_ASSET: Replace with client's hero banner
    primary: u('/photo-1531746020798-e6953c6e8e04?w=1920&q=90&fit=crop&auto=format'),
    secondary: u('/photo-1616394584738-fc6e612e71b9?w=1920&q=90&fit=crop&auto=format'),
    mobile: u('/photo-1616683693504-3ea7e9ad6fec?w=800&q=90&fit=crop&auto=format'),
  },
  categories: {
    // CLIENT_ASSET: Replace each with category photography
    skincare: u('/photo-1620916566398-39f1143ab7be?w=800&q=90&fit=crop&auto=format'),
    makeup: u('/photo-1522335789203-aabd1fc54bc9?w=800&q=90&fit=crop&auto=format'),
    haircare: u('/photo-1526758097130-bab247274f58?w=800&q=90&fit=crop&auto=format'),
    body: u('/photo-1608248543803-ba4f8c70ae0b?w=800&q=90&fit=crop&auto=format'),
    fragrance: u('/photo-1541643600914-78b084683702?w=800&q=90&fit=crop&auto=format'),
  },
  editorial: {
    mission: u('/photo-1570172619644-dfd03ed5d881?w=1200&q=90&fit=crop&auto=format'),
    about: u('/photo-1487412947147-5cebf100ffc2?w=1200&q=90&fit=crop&auto=format'),
    lookbook: [
      u('/photo-1503236823255-94609f598e71?w=600&q=90&fit=crop&auto=format'),
      u('/photo-1583241475880-083f84372725?w=600&q=90&fit=crop&auto=format'),
      u('/photo-1512496015851-a90fb38ba796?w=600&q=90&fit=crop&auto=format'),
    ],
  },
  auth: {
    login: u('/photo-1522337360788-8b13dee7a37e?w=900&q=90&fit=crop&auto=format'),
    register: u('/photo-1487412947147-5cebf100ffc2?w=900&q=90&fit=crop&auto=format'),
  },
} as const;

export const IMAGES = {
  heroProducts: {
    cosrx: GLAMO_IMAGES.categories.skincare,
    cetaphil: u('/photo-1556228720-195a672e8a03?w=680&q=86&fit=crop&auto=format'),
    boj: u('/photo-1556228578-8c89e6adf883?w=680&q=86&fit=crop&auto=format'),
    maybelline: GLAMO_IMAGES.categories.makeup,
  },
  hero: {
    primary: GLAMO_IMAGES.hero.primary,
    secondary: GLAMO_IMAGES.hero.secondary,
    mobile: GLAMO_IMAGES.hero.mobile,
    flatlay: GLAMO_IMAGES.categories.skincare,
  },
  categories: GLAMO_IMAGES.categories,
  editorial: {
    brandMission: GLAMO_IMAGES.editorial.mission,
    about: GLAMO_IMAGES.editorial.about,
    ritual: GLAMO_IMAGES.hero.secondary,
    shelf: GLAMO_IMAGES.categories.body,
    texture: u('/photo-1596755094514-f87e34085b2c?w=1400&q=86&fit=crop&auto=format'),
    lookbook1: GLAMO_IMAGES.editorial.lookbook[0],
    lookbook2: GLAMO_IMAGES.editorial.lookbook[1],
    lookbook3: GLAMO_IMAGES.editorial.lookbook[2],
  },
  auth: {
    loginSplit: GLAMO_IMAGES.auth.login,
    registerSplit: GLAMO_IMAGES.auth.register,
  },
  og: {
    default: GLAMO_IMAGES.hero.primary,
  },
} as const;
