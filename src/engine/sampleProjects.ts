export interface SampleProject {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  width: number;
  height: number;
  imageSrc: string;
  description: string;
  suggestedTools: string[];
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'driving-licence-verification',
    title: 'International Driving Licence (Document Verification)',
    subtitle: 'Official Identity & Hologram Document',
    category: 'Document & Identity Design',
    width: 1012,
    height: 638,
    imageSrc: '', // generated canvas document with Front/Back layers
    description: 'High-security identification document card with Front & Back folders, photo masks, micropoint security pattern, signatures, barcode layers, and scanned effect overlays as seen in the official verification template.',
    suggestedTools: ['move', 'text', 'crop', 'heal', 'pen'],
  },
  {
    id: 'fashion-editorial',
    title: 'High-Fashion Editorial Retouch',
    subtitle: 'Vogue Studio Session #04',
    category: 'Portrait & Retouching',
    width: 1024,
    height: 768,
    imageSrc: '/src/assets/images/starter_fashion_portrait_1790856949748.jpg',
    description: 'Master studio portrait with intricate skin textures, natural light falloff, and neutral studio gradient. Perfect for testing Poisson healing, dodge & burn, Curves tone mapping, and AI Generative Fill.',
    suggestedTools: ['heal', 'spot', 'curves', 'levels', 'brush'],
  },
  {
    id: 'cyberpunk-city',
    title: 'Neo-Tokyo Sci-Fi Matte Painting',
    subtitle: 'Cinematic Concept Art',
    category: 'VFX & Matte Painting',
    width: 1280,
    height: 720,
    imageSrc: '/src/assets/images/starter_cyberpunk_city_1790856971097.jpg',
    description: 'Dusk urban landscape with volumetric atmosphere, wet street reflections, and neon signage. Ideal for experimenting with color balance, gradient overlays, mask blending, and AI inpainting.',
    suggestedTools: ['gradient', 'curves', 'lasso', 'clone', 'patch'],
  },
  {
    id: 'studio-product',
    title: 'Minimalist Ceramic Commercial',
    subtitle: 'Luxury E-Commerce Campaign',
    category: 'Commercial & Product',
    width: 1024,
    height: 768,
    imageSrc: '/src/assets/images/starter_studio_product_1790856982172.jpg',
    description: 'Minimalist travertine pedestal with sculpted ceramic vase and warm ambient shadows. Great for testing content-aware object removal, background isolation, and 32-bit linear-light grading.',
    suggestedTools: ['remove', 'magic-wand', 'crop', 'exposure', 'levels'],
  },
];
