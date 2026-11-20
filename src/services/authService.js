import api from './api';

/**
 * Authentication & User Profile API Service
 * Interacts with Django REST Framework SimpleJWT & Custom User endpoints.
 */
export const authService = {
  /**
   * Obtain JWT access & refresh tokens with custom user profile claims.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ access: string, refresh: string, user: object }>}
   */
  async login(username, password) {
    const response = await api.post('auth/login/', {
      username: username.trim(),
      password: password.trim(),
    });
    return response.data;
  },

  /**
   * Public registration for Farmers, Buyers, and Transporters.
   * Accepts core user credentials plus role-specific profile fields.
   * @param {object} payload
   * @returns {Promise<object>} Created user record
   */
  async register(payload) {
    const response = await api.post('auth/register/', payload);
    return response.data;
  },

  /**
   * Explicitly refresh an access token using a refresh token.
   * @param {string} refresh
   * @returns {Promise<{ access: string, refresh?: string }>}
   */
  async refreshToken(refresh) {
    const response = await api.post('auth/token/refresh/', { refresh });
    return response.data;
  },

  /**
   * Retrieve the current authenticated user's complete profile and role metadata.
   * @returns {Promise<object>}
   */
  async getProfile() {
    const response = await api.get('auth/profile/');
    return response.data;
  },

  /**
   * Update the current authenticated user's base and UserProfile fields.
   * @param {object} profileData
   * @returns {Promise<object>}
   */
  async updateProfile(profileData) {
    const response = await api.patch('auth/profile/', profileData);
    return response.data;
  },

  /**
   * Update role-specific profile (FarmerProfile, BuyerProfile, TransporterProfile).
   * @param {object} roleData
   * @returns {Promise<object>}
   */
  async updateRoleProfile(roleData) {
    const response = await api.put('auth/profile/role/', roleData);
    return response.data;
  },

  /**
   * Check backend API connectivity and MySQL status.
   * @returns {Promise<{ status: string, service: string, database: string }>}
   */
  async checkHealth() {
    const response = await api.get('health/');
    return response.data;
  },
};

export default authService;
