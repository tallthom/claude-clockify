export declare class ClockifyApiClient {
    private api;
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    get<T = any>(endpoint: string, params?: any): Promise<T>;
    post<T = any>(endpoint: string, data?: any): Promise<T>;
    put<T = any>(endpoint: string, data?: any): Promise<T>;
    patch<T = any>(endpoint: string, data?: any): Promise<T>;
    delete<T = any>(endpoint: string): Promise<T>;
}
//# sourceMappingURL=client.d.ts.map