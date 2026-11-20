import api from './api';

/**
 * FarmConnect Price Negotiation Service
 * Interacts with Django REST PriceNegotiationViewSet.
 */
export const negotiationService = {
  /**
   * Fetch paginated negotiations (buyer see submitted, farmer sees received).
   * @param {object} params
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getNegotiations(params = {}) {
    const response = await api.get('negotiations/', { params });
    return response.data;
  },

  /**
   * Fetch single negotiation details.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async getNegotiationById(id) {
    const response = await api.get(`negotiations/${id}/`);
    return response.data;
  },

  /**
   * Submit a new price negotiation offer (Buyer only).
   * @param {object} offerData - { listing, offered_price_per_unit, requested_quantity, delivery_address, delivery_city, delivery_state, buyer_notes }
   * @returns {Promise<object>}
   */
  async createNegotiation(offerData) {
    const response = await api.post('negotiations/', offerData);
    return response.data;
  },

  /**
   * Farmer proposes a counter-offer price.
   * @param {number|string} id
   * @param {number|string} counterPrice
   * @param {string} farmerNotes
   * @returns {Promise<object>}
   */
  async counterOffer(id, counterPrice, farmerNotes = '') {
    const response = await api.post(`negotiations/${id}/counter/`, {
      counter_price_per_unit: counterPrice,
      farmer_notes: farmerNotes,
    });
    return response.data;
  },

  /**
   * Farmer accepts the buyer's offer.
   * @param {number|string} id
   * @param {string} farmerNotes
   * @returns {Promise<object>}
   */
  async acceptOffer(id, farmerNotes = '') {
    const response = await api.post(`negotiations/${id}/accept/`, {
      farmer_notes: farmerNotes,
    });
    return response.data;
  },

  /**
   * Farmer or Buyer rejects the offer.
   * @param {number|string} id
   * @param {string} notes
   * @returns {Promise<object>}
   */
  async rejectOffer(id, notes = '') {
    const response = await api.post(`negotiations/${id}/reject/`, {
      farmer_notes: notes,
    });
    return response.data;
  },

  /**
   * Buyer accepts farmer's counter-offer.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async acceptCounter(id) {
    const response = await api.post(`negotiations/${id}/accept_counter/`);
    return response.data;
  },

  /**
   * Convert accepted offer into a confirmed order.
   * @param {number|string} id
   * @param {object} deliveryData - { delivery_address, delivery_city, delivery_state, delivery_pincode, contact_phone, payment_method, notes }
   * @returns {Promise<object>}
   */
  async convertToOrder(id, deliveryData = {}) {
    const response = await api.post(`negotiations/${id}/convert_to_order/`, deliveryData);
    return response.data;
  },
};

export default negotiationService;
