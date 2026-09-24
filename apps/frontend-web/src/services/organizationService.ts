import axios from 'axios';
import { OrganizationProfile, CreateOrganizationProfileDto, UpdateOrganizationProfileDto } from '@salary-mgmt/shared-types';

const API_URL = '/api/organization';

const getAuthHeaders = () => {
  const sessionData = sessionStorage.getItem('auth_session');
  if (sessionData) {
    try {
      const parsed = JSON.parse(sessionData);
      if (parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` };
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return {};
};

export const organizationService = {
  async getOrganizationProfile(): Promise<OrganizationProfile> {
    const response = await axios.get<OrganizationProfile>(API_URL, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async saveOrganizationProfile(data: CreateOrganizationProfileDto | UpdateOrganizationProfileDto): Promise<OrganizationProfile> {
    const response = await axios.put<OrganizationProfile>(API_URL, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }
};
