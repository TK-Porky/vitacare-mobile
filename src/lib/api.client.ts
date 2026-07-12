/**
 * Client API Handler
 *
 * This class handles all API requests with automatic token management and retry logic.
 * Optimized for Expo SDK 56+ with modern fetch API and FormData for file uploads.
 */
import { fetch } from "expo/fetch";
import { File as ExpoFile } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "@/types/api-endpoints";
import { ApiResponse } from "@/types/api-responses";

// ─── Types ──────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export enum AppErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  API_ERROR = "API_ERROR",
  UNKNOWN = "UNKNOWN",
}

export interface MappedError {
  type: AppErrorType;
  message: string;
  technicalLog: string;
  statusCode?: number;
}

export class AppError extends Error {
  type: AppErrorType;
  statusCode?: number;
  originalError?: unknown;

  constructor(
    message: string,
    type: AppErrorType,
    statusCode?: number,
    originalError?: unknown,
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface RequestConfig extends Omit<RequestInit, "method"> {
  method: HttpMethod;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  ACCESS_TOKEN: "vitacare_access_token",
  REFRESH_TOKEN: "vitacare_refresh_token",
} as const;

// ─── Service ────────────────────────────────────────────────────────────────

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private onLogout?: () => void;
  private abortControllers = new Map<string, AbortController>();
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000;
  private readonly TOKEN_REFRESH_ENDPOINT = "/auth/refresh-token";

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // ─── Configuration ──────────────────────────────────────────────────────

  setLogoutHandler(fn: () => void) {
    this.onLogout = fn;
  }

  // ─── Token Management ──────────────────────────────────────────────────

  private async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("[API] Failed to get token:", error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("[API] Failed to get refresh token:", error);
      return null;
    }
  }

  private async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  private async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  // ─── Request Management ────────────────────────────────────────────────

  private getRequestId(endpoint: string, method: string): string {
    return `${method}:${endpoint}`;
  }

  cancelRequest(endpoint: string, method: HttpMethod = "GET") {
    const id = this.getRequestId(endpoint, method);
    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
      console.log(`[API] Cancelled request: ${id}`);
    }
  }

  cancelAllRequests() {
    this.abortControllers.forEach((controller, id) => {
      controller.abort();
      console.log(`[API] Cancelled request: ${id}`);
    });
    this.abortControllers.clear();
  }

  // ─── Logging ────────────────────────────────────────────────────────────

  private logRequest(method: string, url: string, data?: any) {
    if (__DEV__) {
      console.log(`[API] ${method} ${url}`);
      if (data && !(data instanceof FormData)) {
        console.log("[API] Body:", data);
      }
      if (data instanceof FormData) {
        console.log("[API] FormData upload");
      }
    }
  }

  private logResponse(url: string, status: number, data: any) {
    if (__DEV__) {
      console.log(`[API] ${status} ${url}`);
      if (status >= 400) {
        console.warn("[API] Error Response:", data);
      }
    }
  }

  // ─── Retry Logic ───────────────────────────────────────────────────────

  private getRetryDelay(attempt: number): number {
    return Math.min(this.BASE_RETRY_DELAY * Math.pow(2, attempt), 10000);
  }

  private shouldRetry(statusCode: number): boolean {
    return statusCode >= 500 || statusCode === 0 || statusCode === 408;
  }

  // ─── Main Request ──────────────────────────────────────────────────────

  private async requestWithRetry<T = any>(
    endpoint: string,
    options: RequestConfig = { method: "GET" },
  ): Promise<ApiResponse<T>> {
    const retries = options.retries ?? this.MAX_RETRIES;
    let lastError: ApiResponse<T> | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await this.request<T>(endpoint, options);

        // Succès ou erreur non récupérable
        if (result.success || !this.shouldRetry(result.statusCode || 0)) {
          return result;
        }

        lastError = result;

        if (attempt < retries - 1) {
          const delay = this.getRetryDelay(attempt);
          console.log(`[API] Retry ${attempt + 1}/${retries} in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = {
          success: false,
          error: error instanceof Error ? error.message : "Request failed",
          statusCode: 0,
        };

        if (attempt < retries - 1) {
          const delay = this.getRetryDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return lastError!;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestConfig = { method: "GET" },
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;
    const requestId = this.getRequestId(endpoint, options.method);

    // ── Headers ──────────────────────────────────────────────────────────

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!options.skipAuth) {
      const token = await this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    // ── Body ──────────────────────────────────────────────────────────────

    let body = options.body;
    if (body && !(body instanceof FormData) && typeof body === "object") {
      body = JSON.stringify(body);
    }

    // ── AbortController ──────────────────────────────────────────────────

    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
      this.abortControllers.delete(requestId);
    }, API_CONFIG.TIMEOUT || 30000);

    // ── Request ──────────────────────────────────────────────────────────

    try {
      this.logRequest(options.method, url, options.body);

      const response = await fetch(url, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      // ── Auth Error ─────────────────────────────────────────────────────

      if (response.status === 401 && !options.skipAuth) {
        return this.handleAuthError<T>(endpoint, options, response);
      }

      // ── Response ──────────────────────────────────────────────────────

      const text = await response.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.warn("[API] Response is not valid JSON:", text);
      }

      this.logResponse(url, response.status, data);

      return {
        success: response.ok,
        data: data?.data ?? data,
        message: data?.message,
        error: !response.ok
          ? data?.error || data?.message || `HTTP Error ${response.status}`
          : undefined,
        statusCode: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      console.error("[API] Request error:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            error: "La requête a expiré ou a été annulée",
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
        error: "Une erreur inattendue est survenue",
        statusCode: 500,
      };
    }
  }

  // ─── Auth Error Handler ──────────────────────────────────────────────

  private async handleAuthError<T = any>(
    endpoint: string,
    options: RequestConfig,
    originalResponse: Response,
  ): Promise<ApiResponse<T>> {
    // Si le rafraîchissement est en cours, mettre en file d'attente
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.addRefreshSubscriber((newToken) => {
          const newHeaders = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          };
          resolve(
            this.request<T>(endpoint, { ...options, headers: newHeaders }),
          );
        });
      });
    }

    // Démarrer le rafraîchissement
    this.isRefreshing = true;

    try {
      const newToken = await this.refreshToken();
      this.isRefreshing = false;
      this.onTokenRefreshed(newToken);

      // Retenter la requête
      const newHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      };
      return this.request<T>(endpoint, { ...options, headers: newHeaders });
    } catch (error) {
      this.isRefreshing = false;
      await this.clearTokens();
      this.onLogout?.();
      return {
        success: false,
        error: "Session expirée. Veuillez vous reconnecter.",
        statusCode: 401,
      };
    }
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch(
        `${this.baseURL}${this.TOKEN_REFRESH_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        },
      );

      const text = await response.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.warn("[API] Refresh response is not valid JSON:", text);
      }

      const accessToken = data?.data?.accessToken || data?.accessToken;

      if (response.ok && accessToken) {
        await this.setToken(accessToken);
        return accessToken;
      }

      throw new Error("Token refresh failed");
    } catch (error) {
      console.error("[API] Token refresh error:", error);
      throw new Error("Failed to refresh token");
    }
  }

  // ─── HTTP Methods ──────────────────────────────────────────────────────

  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options: Omit<RequestConfig, "method" | "body"> = {},
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
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    return this.requestWithRetry<T>(url, { ...options, method: "GET" });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, "method" | "body"> = {},
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "POST",
      body: data,
    });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, "method" | "body"> = {},
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data,
    });
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, "method" | "body"> = {},
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data,
    });
  }

  async delete<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestConfig, "method" | "body"> = {},
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "DELETE",
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
    fieldName: string = "file",
    additionalData?: Record<string, any>,
    options: Omit<RequestConfig, "method" | "body"> = {},
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;
    const requestId = this.getRequestId(endpoint, "UPLOAD");

    try {
      // Get token for authentication
      const token = await this.getToken();

      // Prepare headers
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
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

      this.logRequest("UPLOAD", url, { file: fileName, size: file.size });

      // Use fetch from expo/fetch (not global fetch)
      const response = await fetch(url, {
        method: "POST",
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
        console.warn("[API] Upload response is not valid JSON:", text);
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
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
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
              method: "POST",
              headers: retryHeaders,
              body: retryFormData,
            });

            const retryText = await retryResponse.text();
            let retryData: any = {};
            try {
              retryData = retryText ? JSON.parse(retryText) : {};
            } catch (err) {
              console.warn(
                "[API] Retry upload response is not valid JSON:",
                retryText,
              );
            }

            const retryBody = retryResponse.ok ? retryData : undefined;
            return {
              success: retryResponse.ok,
              data: retryBody?.data ?? retryBody,
              message: retryBody?.message ?? retryData.message,
              error: !retryResponse.ok
                ? retryData.error ||
                  retryData.message ||
                  `Upload HTTP Error ${retryResponse.status}`
                : undefined,
              statusCode: retryResponse.status,
            };
          } catch (error) {
            this.isRefreshing = false;
            this.onLogout?.();
            return {
              success: false,
              error: "Session expirée. Veuillez vous reconnecter.",
              statusCode: 401,
            };
          }
        }

        // If refresh is already in progress
        return new Promise((resolve) => {
          this.addRefreshSubscriber(async (newToken) => {
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
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
              method: "POST",
              headers: retryHeaders,
              body: retryFormData,
            });

            const retryText = await retryResponse.text();
            let retryData: any = {};
            try {
              retryData = retryText ? JSON.parse(retryText) : {};
            } catch (err) {
              console.warn(
                "[API] Retry upload response is not valid JSON:",
                retryText,
              );
            }

            const retryBody2 = retryResponse.ok ? retryData : undefined;
            resolve({
              success: retryResponse.ok,
              data: retryBody2?.data ?? retryBody2,
              message: retryBody2?.message ?? retryData.message,
              error: !retryResponse.ok
                ? retryData.error ||
                  retryData.message ||
                  `Upload HTTP Error ${retryResponse.status}`
                : undefined,
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
        error: !response.ok
          ? data.error || data.message || `Upload HTTP Error ${response.status}`
          : undefined,
        statusCode: response.status,
      };
    } catch (error) {
      this.abortControllers.delete(requestId);

      console.error("[API] Upload error:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
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
    files: Array<{
      uri: string;
      name: string;
      type: string;
      fieldName?: string;
    }>,
    additionalData?: Record<string, any>,
    options: Omit<RequestConfig, "method" | "body"> = {},
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;
    const requestId = this.getRequestId(endpoint, "UPLOAD_MULTIPLE");

    try {
      const token = await this.getToken();

      const headers: Record<string, string> = {
        Accept: "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
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

      this.logRequest("UPLOAD_MULTIPLE", url, {
        files: files.map((f) => f.name),
      });

      const response = await fetch(url, {
        method: "POST",
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
        console.warn("[API] Upload response is not valid JSON:", text);
      }

      this.logResponse(url, response.status, data);

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        message: data.message,
        error: !response.ok
          ? data.error || data.message || `Upload HTTP Error ${response.status}`
          : undefined,
        statusCode: response.status,
      };
    } catch (error) {
      this.abortControllers.delete(requestId);

      console.error("[API] Upload error:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
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
