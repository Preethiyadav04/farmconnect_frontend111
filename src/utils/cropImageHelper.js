/**
 * FarmConnect Crop Image Helper
 * Resolves crop images with smart category/crop-name fallback mapping,
 * handles Django media URLs, and provides safe onError handlers.
 */

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// High-quality local agricultural images in /images/crops/
export const CROP_FALLBACKS = {
  tomatoes: '/images/crops/tomatoes.jpg',
  onions: '/images/crops/onions.jpg',
  wheat: '/images/crops/wheat.jpg',
  toor_dal: '/images/crops/toor_dal.jpg',
  rice: '/images/crops/rice.jpg',
  potatoes: '/images/crops/potatoes.jpg',
  cotton: '/images/crops/cotton.jpg',
  vegetables: '/images/crops/vegetables_default.jpg',
  pulses: '/images/crops/pulses_default.jpg',
  grains: '/images/crops/grains_default.jpg',
  fruits: '/images/crops/fruits_default.jpg',
  spices: '/images/crops/spices_default.jpg',
  oilseeds: '/images/crops/oilseeds_default.jpg',
  default: '/images/crops/default_crop.jpg',
};

/**
 * Determine the most suitable fallback image based on crop name, variety, and category.
 * @param {string} cropName
 * @param {string} categoryName
 * @param {string} variety
 * @returns {string} Image path
 */
export const getFallbackImage = (cropName = '', categoryName = '', variety = '') => {
  const text = `${cropName} ${variety} ${categoryName}`.toLowerCase();

  // Specific Commodity Matches
  if (text.includes('tomato') || text.includes('tamatar')) {
    return CROP_FALLBACKS.tomatoes;
  }
  if (text.includes('onion') || text.includes('pyaz') || text.includes('garwa') || text.includes('nashik red')) {
    return CROP_FALLBACKS.onions;
  }
  if (text.includes('wheat') || text.includes('sharbati') || text.includes('gehun') || text.includes('lokwan')) {
    return CROP_FALLBACKS.wheat;
  }
  if (
    text.includes('pigeon pea') ||
    text.includes('toor') ||
    text.includes('tur') ||
    text.includes('arhar') ||
    text.includes('dal') ||
    text.includes('lentil') ||
    text.includes('chana') ||
    text.includes('gram') ||
    text.includes('moong') ||
    text.includes('urad')
  ) {
    return CROP_FALLBACKS.toor_dal;
  }
  if (text.includes('rice') || text.includes('paddy') || text.includes('chawal') || text.includes('basmati')) {
    return CROP_FALLBACKS.rice;
  }
  if (text.includes('potato') || text.includes('aloo')) {
    return CROP_FALLBACKS.potatoes;
  }
  if (text.includes('cotton') || text.includes('kapas')) {
    return CROP_FALLBACKS.cotton;
  }

  // Broad Category Matches
  if (text.includes('vegetable') || text.includes('sabzi')) {
    return CROP_FALLBACKS.vegetables;
  }
  if (text.includes('pulse') || text.includes('legume')) {
    return CROP_FALLBACKS.pulses;
  }
  if (text.includes('grain') || text.includes('cereal')) {
    return CROP_FALLBACKS.grains;
  }
  if (text.includes('fruit')) {
    return CROP_FALLBACKS.fruits;
  }
  if (text.includes('spice') || text.includes('masala')) {
    return CROP_FALLBACKS.spices;
  }
  if (text.includes('oilseed') || text.includes('mustard') || text.includes('soybean') || text.includes('groundnut')) {
    return CROP_FALLBACKS.oilseeds;
  }

  return CROP_FALLBACKS.default;
};

/**
 * Resolve the image URL for a crop.
 * If the crop has an uploaded image in Django backend media, resolves full URL.
 * Otherwise returns the crop-specific high-resolution fallback image.
 * @param {object} crop
 * @returns {string} Valid image URL
 */
export const getCropImageUrl = (crop) => {
  if (!crop) return CROP_FALLBACKS.default;

  const rawImage = crop.image;
  if (rawImage && typeof rawImage === 'string' && rawImage.trim()) {
    const trimmed = rawImage.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    // Relative Django media path e.g. "/media/crops/img.jpg" or "crops/img.jpg"
    if (trimmed.startsWith('/media/')) {
      return `${BACKEND_BASE_URL}${trimmed}`;
    }
    if (trimmed.startsWith('media/')) {
      return `${BACKEND_BASE_URL}/${trimmed}`;
    }
    return `${BACKEND_BASE_URL}/media/${trimmed.replace(/^\/+/, '')}`;
  }

  const categoryName = crop.category_name || crop.category?.name || '';
  return getFallbackImage(crop.crop_name, categoryName, crop.variety);
};

/**
 * Image error handler to avoid infinite loops and gracefully switch to default image.
 * @param {Event} e
 * @param {object} crop
 */
export const handleCropImageError = (e, crop) => {
  e.target.onerror = null; // Prevent infinite fallback loops
  const categoryName = crop?.category_name || crop?.category?.name || '';
  const fallback = getFallbackImage(crop?.crop_name, categoryName, crop?.variety);
  if (e.target.src !== fallback && !e.target.src.endsWith(fallback)) {
    e.target.src = fallback;
  } else {
    e.target.src = CROP_FALLBACKS.default;
  }
};

/**
 * Checks whether this crop has an authentic farmer-uploaded image
 * @param {object} crop
 * @returns {boolean}
 */
export const hasFarmerUploadedImage = (crop) => {
  return Boolean(crop?.image && typeof crop.image === 'string' && crop.image.trim().length > 0);
};

export default {
  CROP_FALLBACKS,
  getCropImageUrl,
  getFallbackImage,
  handleCropImageError,
  hasFarmerUploadedImage,
};
