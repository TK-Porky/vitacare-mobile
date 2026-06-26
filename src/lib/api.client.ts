/**
 * Client API Handler
 * 
 * This class handles all API requests with automatic token management and retry logic.
 * Optimized for Expo SDK 56+ with modern fetch API and FormData for file uploads.
 */
import { fetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../types/api-endpoints';
import { ApiResponse } from '../types/api-responses';

// Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig extends Omit<RequestInit, 'method'> {
  method: HttpMethod;
  retries?: number;
  retryDelay?: number;
}

interface RequestOptions {
  endpoint: string;
  method: HttpMethod;
  data?: any;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private onLogout?: () => void;
  private abortControllers = new Map<string, AbortController>();
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000;

  constructor() {
    this.baseURL = `${API_CONFIG.BASE_URL}`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Set the logout handler
   * @param fn The function to call when the user is logged out
   */
  setLogoutHandler(fn: () => void) {
    this.onLogout = fn;
  }

  /**
   * Get the access token from secure storage
   * @returns The access token or null if not found
   */
  private async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('vitacare_access_token');
    } catch (error) {
      console.error('[API] Failed to get token:', error);
      return null;
    }
  }

  /**
   * Get the refresh token from secure storage
   * @returns The refresh token or null if not found
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('vitacare_refresh_token');
    } catch (error) {
      console.error('[API] Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Notify all subscribers that the token has been refreshed
   * @param token The new access token
   */
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Add a subscriber to be notified when the token is refreshed
   * @param callback The function to call when the token is refreshed
   */
  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Generate a unique request ID for cancellation
   */
  private getRequestId(endpoint: string, method: string): string {
    return `${method}:${endpoint}`;
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(endpoint: string, method: HttpMethod = 'GET') {
    const id = this.getRequestId(endpoint, method);
    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
      console.log(`[API] Cancelled request: ${id}`);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller, id) => {
      controller.abort();
      console.log(`[API] Cancelled request: ${id}`);
    });
    this.abortControllers.clear();
  }

  /**
   * Log request details in development
   */
  private logRequest(method: string, url: string, data?: any) {
    if (__DEV__) {
      console.log(`[API] ${method} ${url}`);
      if (data && !(data instanceof FormData)) {
        console.log('[API] Body:', data);
      }
      if (data instanceof FormData) {
        console.log('[API] FormData upload');
      }
    }
  }

  /**
   * Log response details in development
   */
  private logResponse(url: string, status: number, data: any) {
    if (__DEV__) {
      console.log(`[API] ${status} ${url}`);
      if (status >= 400) {
        console.warn('[API] Error Response:', data);
      }
    }
  }

  /**
   * Calculate delay with exponential backoff
   */
  private getRetryDelay(attempt: number, baseDelay: number): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 10000);
  }

  /**
   * Make a request to the API with retry logic
   */
  private async requestWithRetry<T = any>(
    endpoint: string,
    options: RequestConfig = { method: 'GET' }
  ): Promise<ApiResponse<T>> {
    const retries = options.retries ?? this.MAX_RETRIES;
    const retryDelay = options.retryDelay ?? this.BASE_RETRY_DELAY;
    let lastError: ApiResponse<T> | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await this.request<T>(endpoint, options);
        
        // Si succès ou erreur non récupérable, retourner immédiatement
        if (result.success || (result.statusCode && result.statusCode < 500)) {
          return result;
        }
        
        // Erreur 5xx, on retente
        lastError = result;
        
        if (attempt < retries - 1) {
          const delay = this.getRetryDelay(attempt, retryDelay);
          console.log(`[API] Retry ${attempt + 1}/${retries} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = {
          success: false,
          error: error instanceof Error ? error.message : 'Request failed',
          statusCode: 0,
        };
        
        if (attempt < retries - 1) {
          const delay = this.getRetryDelay(attempt, retryDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return lastError!;
  }

  /**
   * Make a request to the API
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestConfig = { method: 'GET' }
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const requestId = this.getRequestId(endpoint, options.method);
    
    // Get the auth state
    const token = await this.getToken();
    
    // Set the headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers as Record<string, string> || {}),
    };

    // Ne pas ajouter Content-Type pour FormData (le navigateur gère la boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create AbortController for timeout and cancellation
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);
    
    // Setup timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.abortControllers.delete(requestId);
    }, API_CONFIG.TIMEOUT || 30000);

    const config: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    // Convert body to JSON if needed
    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      this.logRequest(options.method, url, options.body);
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);
      
      // Handle authentication errors (401 or 403)
      if (response.status === 401 || response.status === 403) {
        return this.handleAuthError<T>(endpoint, options, response);
      }

      // Process response
      const text = await response.text();
      let data: any = {};
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn('[API] Response is not valid JSON:', text);
      }

      this.logResponse(url, response.status, data);

      const body = response.ok ? data : undefined;
      return {
        success: response.ok,
        data: body?.data ?? body,
        message: body?.message,
        error: !response.ok ? data.error || data.message || `HTTP Error ${response.status}` : undefined,
        statusCode: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);
      
      console.error('[API] Request error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'La requête a expiré ou a été annulée',
            statusCode: 408,
          };
        }
        return {
          success: false,
          error: error.message,
          statusCode: 0,
        };
      }

      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
        statusCode: 500,
      };
    }
  }

  /**
   * Handle authentication errors with token refresh
   */
  private async handleAuthError<T = any>(
    endpoint: string,
    options: RequestConfig,
    originalResponse: Response
  ): Promise<ApiResponse<T>> {
    // Si ce n'est pas une erreur 401, retourner l'erreur directement
    if (originalResponse.status !== 401) {
      const text = await originalResponse.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn('[API] Response is not valid JSON:', text);
      }
      return {
        success: false,
        error: data.error || data.message || `HTTP Error ${originalResponse.status}`,
        statusCode: originalResponse.status,
      };
    }

    // Si un rafraîchissement est déjà en cours, mettre en file d'attente
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.addRefreshSubscriber((newToken) => {
          const newHeaders = { ...options.headers, 'Authorization': `Bearer ${newToken}` };
          resolve(this.request<T>(endpoint, { ...options, headers: newHeaders }));
        });
      });
    }

    // Démarrer le rafraîchissement du token
    this.isRefreshing = true;

    try {
      const newToken = await this.refreshToken();
      this.isRefreshing = false;
      
      // Notifier tous les subscribers
      this.onTokenRefreshed(newToken);
      
      // Retenter la requête originale
      const newHeaders = { ...options.headers, 'Authorization': `Bearer ${newToken}` };
      return this.request<T>(endpoint, { ...options, headers: newHeaders });
    } catch (error) {
      this.isRefreshing = false;
      // Token refresh failed - logout user
      this.onLogout?.();
      return {
        success: false,
        error: 'Session expirée. Veuillez vous reconnecter.',
        statusCode: 401,
      };
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshToken(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const text = await response.text();
      let data: any = {};
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn('[API] Refresh response is not valid JSON:', text);
      }

      // Backend wraps in ApiResponse: { success, data: { accessToken, expiresIn } }
      const accessToken = data.data?.accessToken || data.accessToken;
      
      if (response.ok && accessToken) {
        await SecureStore.setItemAsync('vitacare_access_token', accessToken);
        return accessToken;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('[API] Token refresh error:', error);
      throw new Error('Failed to refresh token');
    }
  }

  // ================================================================================== //
  // HTTP Methods
  // ================================================================================== //

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return this.requestWithRetry<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: data,
    });
  }

  // ================================================================================== //
  // File Upload with Expo SDK 56+
  // ================================================================================== //

  /**
   * Upload a file using Expo's modern fetch API with FormData
   * Compatible with Expo SDK 56+
   */
  async upload<T = any>(
    endpoint: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    options: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const requestId = this.getRequestId(endpoint, 'UPLOAD');
    
    try {
      // Get token for authentication
      const token = await this.getToken();
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Create FormData
      const formData = new FormData();
      
      // Create file object using Expo's File API (SDK 56+)
      const file = new ExpoFile(fileUri);
      formData.append(fieldName, file, fileName);

      // Add additional data
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      this.abortControllers.set(requestId, controller);
      
      const timeoutId = setTimeout(() => {
        controller.abort();
        this.abortControllers.delete(requestId);
      }, API_CONFIG.TIMEOUT || 60000); // Longer timeout for uploads

      this.logRequest('UPLOAD', url, { file: fileName, size: file.size });

      // Use fetch from expo/fetch (not global fetch)
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      // Process response
      const text = await response.text();
      let data: any = {};
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn('[API] Upload response is not valid JSON:', text);
      }

      this.logResponse(url, response.status, data);

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        // Try to refresh token and retry upload
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const newToken = await this.refreshToken();
            this.isRefreshing = false;
            this.onTokenRefreshed(newToken);
            
            // Retry upload with new token
            const retryHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
            const retryFormData = new FormData();
            const retryFile = new ExpoFile(fileUri);
            retryFormData.append(fieldName, retryFile, fileName);
            
            if (additionalData) {
              Object.entries(additionalData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  retryFormData.append(key, String(value));
                }
              });
            }

            const retryResponse = await fetch(url, {
              method: 'POST',
              headers: retryHeaders,
              body: retryFormData,
            });

            const retryText = await retryResponse.text();
            let retryData: any = {};
            try {
              retryData = retryText ? JSON.parse(retryText) : {};
            } catch (err) {
              console.warn('[API] Retry upload response is not valid JSON:', retryText);
            }

            const retryBody = retryResponse.ok ? retryData : undefined;
            return {
              success: retryResponse.ok,
              data: retryBody?.data ?? retryBody,
              message: retryBody?.message ?? retryData.message,
              error: !retryResponse.ok ? retryData.error || retryData.message || `Upload HTTP Error ${retryResponse.status}` : undefined,
              statusCode: retryResponse.status,
            };
          } catch (error) {
            this.isRefreshing = false;
            this.onLogout?.();
            return {
              success: false,
              error: 'Session expirée. Veuillez vous reconnecter.',
              statusCode: 401,
            };
          }
        }

        // If refresh is already in progress
        return new Promise((resolve) => {
          this.addRefreshSubscriber(async (newToken) => {
            const retryHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
            const retryFormData = new FormData();
            const retryFile = new ExpoFile(fileUri);
            retryFormData.append(fieldName, retryFile, fileName);
            
            if (additionalData) {
              Object.entries(additionalData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  retryFormData.append(key, String(value));
                }
              });
            }

            const retryResponse = await fetch(url, {
              method: 'POST',
              headers: retryHeaders,
              body: retryFormData,
            });

            const retryText = await retryResponse.text();
            let retryData: any = {};
            try {
              retryData = retryText ? JSON.parse(retryText) : {};
            } catch (err) {
              console.warn('[API] Retry upload response is not valid JSON:', retryText);
            }

            const retryBody2 = retryResponse.ok ? retryData : undefined;
            resolve({
              success: retryResponse.ok,
              data: retryBody2?.data ?? retryBody2,
              message: retryBody2?.message ?? retryData.message,
              error: !retryResponse.ok ? retryData.error || retryData.message || `Upload HTTP Error ${retryResponse.status}` : undefined,
              statusCode: retryResponse.status,
            });
          });
        });
      }

      const body = response.ok ? data : undefined;
      return {
        success: response.ok,
        data: body?.data ?? body,
        message: body?.message ?? data.message,
        error: !response.ok ? data.error || data.message || `Upload HTTP Error ${response.status}` : undefined,
        statusCode: response.status,
      };
    } catch (error) {
      this.abortControllers.delete(requestId);
      
      console.error('[API] Upload error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: "L'upload a expiré ou a été annulé",
            statusCode: 408,
          };
        }
        return {
          success: false,
          error: error.message,
          statusCode: 0,
        };
      }

      return {
        success: false,
        error: "Échec de l'upload",
        statusCode: 0,
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple<T = any>(
    endpoint: string,
    files: Array<{ uri: string; name: string; type: string; fieldName?: string }>,
    additionalData?: Record<string, any>,
    options: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const requestId = this.getRequestId(endpoint, 'UPLOAD_MULTIPLE');
    
    try {
      const token = await this.getToken();
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const formData = new FormData();
      
      // Add all files
      files.forEach((file, index) => {
        const fieldName = file.fieldName || `file${index + 1}`;
        const expoFile = new ExpoFile(file.uri);
        formData.append(fieldName, expoFile, file.name);
      });

      // Add additional data
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      this.abortControllers.set(requestId, controller);
      
      const timeoutId = setTimeout(() => {
        controller.abort();
        this.abortControllers.delete(requestId);
      }, API_CONFIG.TIMEOUT || 90000); // Longer timeout for multiple files

      this.logRequest('UPLOAD_MULTIPLE', url, { files: files.map(f => f.name) });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      const text = await response.text();
      let data: any = {};
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn('[API] Upload response is not valid JSON:', text);
      }

      this.logResponse(url, response.status, data);

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: data.message,
        error: !response.ok ? data.error || data.message || `Upload HTTP Error ${response.status}` : undefined,
        statusCode: response.status,
      };
    } catch (error) {
      this.abortControllers.delete(requestId);
      
      console.error('[API] Upload error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: "L'upload multiple a expiré ou a été annulé",
            statusCode: 408,
          };
        }
        return {
          success: false,
          error: error.message,
          statusCode: 0,
        };
      }

      return {
        success: false,
        error: "Échec de l'upload multiple",
        statusCode: 0,
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;