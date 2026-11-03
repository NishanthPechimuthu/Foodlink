import api from './api';

export const impactService = {
  /**
   * Fetch platform impact metrics and statistics
   */
  async getImpact() {
    const response = await api.get('/impact');
    return response.data?.impact || null;
  },
};

export default impactService;
