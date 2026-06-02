import axios from 'axios';
export class ClockifyApiClient {
    api;
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl = 'https://api.clockify.me/api/v1') {
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
        this.api.interceptors.response.use(response => response, (error) => {
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                let errorMessage = `Clockify API error (${status})`;
                if (status === 401) {
                    errorMessage = 'Invalid API key or unauthorized access';
                }
                else if (status === 403) {
                    errorMessage = "Forbidden: You don't have permission to perform this action";
                }
                else if (status === 404) {
                    errorMessage = 'Resource not found';
                }
                else if (status === 429) {
                    errorMessage = 'Rate limit exceeded. Please try again later';
                }
                else if (data && typeof data === 'object' && 'message' in data) {
                    errorMessage = `${errorMessage}: ${data.message}`;
                }
                throw new Error(errorMessage);
            }
            else if (error.request) {
                throw new Error('No response from Clockify API. Please check your connection');
            }
            else {
                throw new Error(`Request failed: ${error.message}`);
            }
        });
    }
    async get(endpoint, params) {
        const response = await this.api.get(endpoint, { params });
        return response.data;
    }
    async post(endpoint, data) {
        const response = await this.api.post(endpoint, data);
        return response.data;
    }
    async put(endpoint, data) {
        const response = await this.api.put(endpoint, data);
        return response.data;
    }
    async patch(endpoint, data) {
        const response = await this.api.patch(endpoint, data);
        return response.data;
    }
    async delete(endpoint) {
        const response = await this.api.delete(endpoint);
        return response.data;
    }
}
//# sourceMappingURL=client.js.map