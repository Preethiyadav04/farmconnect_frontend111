import api from './api';

/**
 * FarmConnect Logistics & Shipment Service
 * Interacts with Django REST TransportRequestViewSet.
 */
export const logisticsService = {
  /**
   * Fetch paginated transport requests.
   * Transporters can pass mode='available' or mode='my_jobs'.
   * @param {object} params
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getTransportRequests(params = {}) {
    const response = await api.get('logistics/', { params });
    return response.data;
  },

  /**
   * Fetch open transport jobs awaiting a driver (Transporters only).
   * @param {object} params
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getAvailableJobs(params = {}) {
    const response = await api.get('logistics/available_jobs/', { params });
    return response.data;
  },

  /**
   * Fetch single transport request tracking details.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async getTransportRequestById(id) {
    const response = await api.get(`logistics/${id}/`);
    return response.data;
  },

  /**
   * Transporter accepts an available transport request.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async acceptJob(id) {
    const response = await api.post(`logistics/${id}/accept_job/`);
    return response.data;
  },

  /**
   * Assigned transporter or Admin updates shipment status.
   * Valid sequence: accepted -> picked_up -> in_transit -> delivered.
   * @param {number|string} id
   * @param {object} updateData - { status, tracking_notes, current_location, final_charge }
   * @returns {Promise<object>}
   */
  async updateStatus(id, updateData) {
    const response = await api.post(`logistics/${id}/update_status/`, updateData);
    return response.data;
  },

  /**
   * Create an ad-hoc transport request.
   * @param {object} requestData
   * @returns {Promise<object>}
   */
  async createTransportRequest(requestData) {
    const response = await api.post('logistics/', requestData);
    return response.data;
  },

  /**
   * Get transport cost estimate.
   * @param {object} params - { distance_km, weight_tons, vehicle_type }
   * @returns {Promise<object>}
   */
  async estimateCost(params) {
    const response = await api.post('logistics/estimate/', params);
    return response.data;
  },
};

export default logisticsService;
