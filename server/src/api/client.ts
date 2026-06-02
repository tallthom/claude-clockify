import axios, { AxiosInstance, AxiosError } from 'axios';

export class ClockifyApiClient {
  private api: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.clockify.me/api/v1') {
    if (!apiKey) {
      throw new Error('Clockify API key is required');
    }
    if (!baseUrl.startsWith('https://')) {
      throw new Error('Clockify API URL must use HTTPS');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          let errorMessage = `Clockify API error (${status})`;

          if (status === 401) {
            errorMessage = 'Invalid API key or unauthorized access';
          } else if (status === 403) {
            errorMessage = "Forbidden: You don't have permission to perform this action";
          } else if (status === 404) {
            errorMessage = 'Resource not found';
          } else if (status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later';
          } else if (data && typeof data === 'object' && 'message' in data) {
            errorMessage = `${errorMessage}: ${(data as any).message}`;
          }

          throw new Error(errorMessage);
        } else if (error.request) {
          throw new Error('No response from Clockify API. Please check your connection');
        } else {
          throw new Error(`Request failed: ${error.message}`);
        }
      }
    );
  }

  async get<T = any>(endpoint: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(endpoint, { params });
    return response.data;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(endpoint, data);
    return response.data;
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(endpoint, data);
    return response.data;
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(endpoint, data);
    return response.data;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.api.delete<T>(endpoint);
    return response.data;
  }
}
