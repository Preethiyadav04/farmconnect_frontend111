import api from './api';

/**
 * APMC Mandi Market Price Benchmark API Service
 * Interacts with Django REST Framework MandiPriceViewSet.
 */
export const mandiService = {
  /**
   * Fetch paginated Mandi benchmark price records.
   * @param {object} params - { search, crop, state, market, date, page, page_size }
   * @returns {Promise<{ count: number, next: string|null, previous: string|null, results: Array<object> }>}
   */
  async getMandiPrices(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });
    const response = await api.get('mandi-prices/', { params: cleanParams });
    return response.data;
  },

  /**
   * Compare benchmark prices for a commodity across regional APMC Mandis.
   * @param {string} cropName - e.g. "Wheat", "Onion", "Tomato"
   * @returns {Promise<{ commodity: string, total_records: number, benchmarks: Array<object> }>}
   */
  async compareMandiPrices(cropName) {
    const response = await api.get('mandi-prices/compare/', {
      params: { crop: cropName },
    });
    return response.data;
  },
};

export default mandiService;
