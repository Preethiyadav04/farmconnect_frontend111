import api from './api';

/**
 * FarmConnect Orders Service
 * Interacts with Django REST OrderViewSet.
 */
export const orderService = {
  /**
   * Fetch paginated orders list (filtered by role by backend).
   * @param {object} params
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getOrders(params = {}) {
    const response = await api.get('orders/', { params });
    return response.data;
  },

  /**
   * Fetch single order details with line items and payment snapshot.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async getOrderById(id) {
    const response = await api.get(`orders/${id}/`);
    return response.data;
  },

  /**
   * Place a new purchase order (Buyer only).
   * @param {object} orderData
   * @returns {Promise<object>}
   */
  async createOrder(orderData) {
    const response = await api.post('orders/', orderData);
    return response.data;
  },

  /**
   * Farmer confirms an incoming order.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async acceptOrder(id) {
    const response = await api.post(`orders/${id}/accept_order/`);
    return response.data;
  },

  /**
   * Farmer rejects an order with an optional reason, restoring inventory atomically.
   * @param {number|string} id
   * @param {string} reason
   * @returns {Promise<object>}
   */
  async rejectOrder(id, reason = '') {
    const response = await api.post(`orders/${id}/reject_order/`, { reason });
    return response.data;
  },

  /**
   * Buyer cancels a pending order before dispatch, restoring inventory atomically.
   * @param {number|string} id
   * @param {string} reason
   * @returns {Promise<object>}
   */
  async cancelOrder(id, reason = '') {
    const response = await api.post(`orders/${id}/cancel_order/`, { reason });
    return response.data;
  },

  /**
   * Farmer or Admin marks offline payment as completed.
   * @param {number|string} id
   * @param {string} paymentStatus
   * @param {string} transactionReference
   * @returns {Promise<object>}
   */
  async updatePaymentStatus(id, paymentStatus = 'completed', transactionReference = '') {
    const response = await api.post(`orders/${id}/update_payment_status/`, {
      payment_status: paymentStatus,
      transaction_reference: transactionReference,
    });
    return response.data;
  },
};

export default orderService;
