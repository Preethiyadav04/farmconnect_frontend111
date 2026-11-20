import api from './api';

/**
 * Crops & Agricultural Catalog API Service
 * Interacts with Django REST Framework Crop & Category ViewSets.
 */
export const cropService = {
  /**
   * Fetch all active crop categories.
   * @returns {Promise<Array<object>>} List of active categories
   */
  async getCategories() {
    const response = await api.get('categories/');
    return response.data;
  },

  /**
   * Fetch paginated crop listings with filtering, search, and sorting.
   * @param {object} params - { search, category, location, city, state, min_price, max_price, sort_by, page, page_size }
   * @returns {Promise<{ count: number, next: string|null, previous: string|null, results: Array<object> }>}
   */
  async getCrops(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        cleanParams[key] = val;
      }
    });
    const response = await api.get('crops/', { params: cleanParams });
    return response.data;
  },

  /**
   * Fetch complete detail for a single crop listing.
   * @param {number|string} id - Crop ID
   * @returns {Promise<object>} Complete crop record with farmer_info and mandi_benchmark
   */
  async getCropById(id) {
    const response = await api.get(`crops/${id}/`);
    return response.data;
  },

  /**
   * Fetch authenticated farmer's own crop inventory.
   * @param {object} params
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getMyCrops(params = {}) {
    const response = await api.get('crops/my_crops/', { params });
    return response.data;
  },

  /**
   * Create a new crop listing (Farmer only).
   * @param {object|FormData} cropData
   * @returns {Promise<object>}
   */
  async createCrop(cropData) {
    const response = await api.post('crops/', cropData);
    return response.data;
  },

  /**
   * Update an existing crop listing (Farmer owner only).
   * @param {number|string} id
   * @param {object|FormData} cropData
   * @returns {Promise<object>}
   */
  async updateCrop(id, cropData) {
    const response = await api.patch(`crops/${id}/`, cropData);
    return response.data;
  },

  /**
   * Delete own crop listing (Farmer owner only).
   * @param {number|string} id
   * @returns {Promise<void>}
   */
  async deleteCrop(id) {
    await api.delete(`crops/${id}/`);
  },

  /**
   * Toggle crop active / unavailable status.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async toggleAvailability(id) {
    const response = await api.post(`crops/${id}/toggle_availability/`);
    return response.data;
  },
};

export default cropService;
