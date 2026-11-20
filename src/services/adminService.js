import api from './api';

/**
 * FarmConnect Admin Management Service
 * Interacts with Admin endpoints for users, categories, crops, and platform oversight.
 */
export const adminService = {
  /**
   * Fetch registered users (filterable by role, search, is_verified).
   * @param {object} params
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getUsers(params = {}) {
    const response = await api.get('users/', { params });
    return response.data;
  },

  /**
   * Fetch single user details.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async getUserById(id) {
    const response = await api.get(`users/${id}/`);
    return response.data;
  },

  /**
   * Toggle user verification status (Admin only).
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async toggleVerifyUser(id) {
    const response = await api.post(`users/${id}/toggle_verify/`);
    return response.data;
  },

  /**
   * Update user details (Admin only).
   * @param {number|string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateUser(id, data) {
    const response = await api.patch(`users/${id}/`, data);
    return response.data;
  },

  /**
   * Fetch all categories including inactive ones.
   * @returns {Promise<Array<object>>}
   */
  async getCategories() {
    const response = await api.get('categories/');
    return response.data;
  },

  /**
   * Create a new category (Admin only).
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createCategory(data) {
    const response = await api.post('categories/', data);
    return response.data;
  },

  /**
   * Update a category (Admin only).
   * @param {string} slug
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateCategory(slug, data) {
    const response = await api.patch(`categories/${slug}/`, data);
    return response.data;
  },

  /**
   * Delete a category (Admin only).
   * @param {string} slug
   * @returns {Promise<void>}
   */
  async deleteCategory(slug) {
    await api.delete(`categories/${slug}/`);
  },

  /**
   * Fetch all crops for administrative oversight (including unavailable/sold_out).
   * @param {object} params
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getAllCrops(params = {}) {
    const response = await api.get('crops/', { params: { ...params, show_all: 'true' } });
    return response.data;
  },

  /**
   * Delete an infringing or inappropriate crop listing (Admin only).
   * @param {number|string} id
   * @returns {Promise<void>}
   */
  async deleteCrop(id) {
    await api.delete(`crops/${id}/`);
  },
};

export default adminService;
