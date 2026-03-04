/**
 * Express API Client
 * 
 * This client handles communication with the Express.js backend API.
 * It includes:
 * - Fetch wrapper with authentication
 * - Token management (storage, refresh)
 * - Error handling
 * - Request/response interceptors
 */

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

class ExpressApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokensFromStorage();
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('express_access_token');
      this.refreshToken = localStorage.getItem('express_refresh_token');
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokensToStorage(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('express_access_token', accessToken);
      localStorage.setItem('express_refresh_token', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    }
  }

  /**
   * Clear tokens from storage
   */
  private clearTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('express_access_token');
      localStorage.removeItem('express_refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set tokens
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.saveTokensToStorage(accessToken, refreshToken);
  }

  /**
   * Clear tokens
   */
  clearTokens(): void {
    this.clearTokensFromStorage();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    if (this.isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.accessToken && data.refreshToken) {
        this.saveTokensToStorage(data.accessToken, data.refreshToken);
        
        // Notify all subscribers
        this.refreshSubscribers.forEach((callback) => callback(data.accessToken));
        this.refreshSubscribers = [];
        
        return data.accessToken;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokensFromStorage();
      
      // Notify subscribers of failure
      this.refreshSubscribers.forEach((callback) => callback(''));
      this.refreshSubscribers = [];
      
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Make an authenticated request
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, skipRefresh = false, ...fetchConfig } = config;

    // Build full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchConfig.headers as Record<string, string>),
    };

    // Add authorization header if not skipped and token exists
    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      // Make the request
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
      });

      // Handle 401 Unauthorized - token expired
      if (response.status === 401 && !skipRefresh && this.refreshToken) {
        console.log('Access token expired, attempting refresh...');
        
        const newToken = await this.refreshAccessToken();
        
        if (newToken) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...fetchConfig,
            headers,
          });
          
          return this.handleResponse<T>(retryResponse);
        } else {
          // Refresh failed, clear tokens and return error
          this.clearTokensFromStorage();
          return {
            error: {
              code: 'AUTH_TOKEN_EXPIRED',
              message: 'Session expired. Please log in again.',
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('Request error:', error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Handle response and parse JSON
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        // API returned an error
        return {
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred',
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Success response
      return data;
    } catch (error) {
      console.error('Response parsing error:', error);
      return {
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse response',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */

  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    console.log('📤 POST Request:', endpoint);
    console.log('📦 Request Body:', body);
    
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Upload file with multipart/form-data
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && this.refreshToken) {
        const newToken = await this.refreshAccessToken();
        
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
          });
          
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('File upload error:', error);
      return {
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'File upload failed',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

// Create singleton instance
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const expressClient = new ExpressApiClient(API_URL);

// Export class for testing
export { ExpressApiClient };
