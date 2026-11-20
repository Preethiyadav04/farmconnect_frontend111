import api from './api';

/**
 * FarmConnect Reviews & Favorites Service
 * Interacts with Django REST ReviewViewSet & FavoriteViewSet.
 */
export const reviewService = {
  /**
   * Fetch reviews (filterable by farmer_id, crop_id, rating).
   * @param {object} params
   * @returns {Promise<Array<object>>}
   */
  async getReviews(params = {}) {
    const response = await api.get('reviews/', { params });
    return response.data;
  },

  /**
   * Submit a review for a delivered order (Buyer only).
   * @param {object} reviewData - { order, rating, comment }
   * @returns {Promise<object>}
   */
  async createReview(reviewData) {
    const response = await api.post('reviews/', reviewData);
    return response.data;
  },

  /**
   * Delete a review (Author or Admin only).
   * @param {number|string} id
   * @returns {Promise<void>}
   */
  async deleteReview(id) {
    await api.delete(`reviews/${id}/`);
  },

  /**
   * Fetch aggregated farmer rating and star summary.
   * @param {number|string} farmerId
   * @returns {Promise<object>}
   */
  async getFarmerSummary(farmerId) {
    const response = await api.get('reviews/farmer_summary/', {
      params: farmerId ? { farmer_id: farmerId } : {},
    });
    return response.data;
  },

  /**
   * Fetch buyer's bookmarked crops.
   * @returns {Promise<Array<object>>}
   */
  async getFavorites() {
    const response = await api.get('favorites/');
    return response.data;
  },

  /**
   * Toggle crop bookmark for the authenticated buyer.
   * @param {number|string} cropId
   * @returns {Promise<object>} - { favorited: boolean }
   */
  async toggleFavorite(cropId) {
    const response = await api.post('favorites/toggle/', { crop_id: cropId });
    return response.data;
  },
};

export default reviewService;
