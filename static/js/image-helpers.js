// Image fallback helper functions
// Used in Pug templates to handle missing or invalid image paths

/**
 * Get a fallback placeholder image URL
 * @param {string} type - Type of image (service, partner, customer, category)
 * @param {string} name - Name/identifier of the item
 * @returns {string} Placeholder image URL
 */
function getFallbackImage(type, name = '') {
  const fallbacks = {
    service: 'https://via.placeholder.com/400x300?text=Service',
    partner: 'https://via.placeholder.com/400x300?text=Professional',
    customer: 'https://via.placeholder.com/150x150?text=Profile',
    category: 'https://via.placeholder.com/200x200?text=Category',
    work: 'https://via.placeholder.com/400x300?text=Portfolio'
  };
  
  return fallbacks[type] || fallbacks.service;
}

/**
 * Validate image URL and return fallback if invalid
 * @param {string} imageUrl - Image URL from database
 * @param {string} type - Type of image
 * @returns {string} Valid image URL or fallback
 */
function getImageUrl(imageUrl, type = 'service') {
  // If no URL provided, return fallback
  if (!imageUrl || imageUrl.trim() === '') {
    return getFallbackImage(type);
  }

  // If URL starts with /, it's a local path - keep it as is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // If URL starts with http, it's external - keep it as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Otherwise treat as local path and prepend /
  return '/' + imageUrl;
}

/**
 * Parse comma-separated work images
 * @param {string} workImages - Comma-separated image URLs
 * @returns {array} Array of image URLs
 */
function parseWorkImages(workImages) {
  if (!workImages) return [];
  
  return workImages
    .split(',')
    .map(img => img.trim())
    .filter(img => img.length > 0)
    .map(img => getImageUrl(img, 'work'));
}

// Export for use in Express/Node context if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFallbackImage,
    getImageUrl,
    parseWorkImages
  };
}
