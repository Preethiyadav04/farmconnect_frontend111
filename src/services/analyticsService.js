import api from './api';

/**
 * FarmConnect Analytics Service
 * Interacts with Django REST Analytics endpoints.
 */
export const analyticsService = {
  /**
   * Universal dashboard metrics dispatcher based on authenticated role.
   * @returns {Promise<object>}
   */
  async getDashboardAnalytics() {
    const response = await api.get('analytics/dashboard/');
    return response.data;
  },

  /**
   * Detailed farmer metrics (crops, orders, revenue, top crops, ratings).
   * @returns {Promise<object>}
   */
  async getFarmerAnalytics() {
    const response = await api.get('analytics/farmer/');
    return response.data;
  },

  /**
   * Detailed buyer metrics (orders, spend, favorite categories).
   * @returns {Promise<object>}
   */
  async getBuyerAnalytics() {
    const response = await api.get('analytics/buyer/');
    return response.data;
  },

  /**
   * Detailed transporter metrics (assigned, in-transit, completed, payload).
   * @returns {Promise<object>}
   */
  async getTransporterAnalytics() {
    const response = await api.get('analytics/transporter/');
    return response.data;
  },

  /**
   * Detailed admin platform-wide metrics (users, GMV, orders, logistics).
   * @returns {Promise<object>}
   */
  async getAdminAnalytics() {
    const response = await api.get('analytics/admin/');
    return response.data;
  },
};

export default analyticsService;
