/**
 * Yiphthachl HTTP Client
 * HTTP requests and API integration
 */

class YiphthachlHttp {
    constructor() {
        this.baseUrl = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        this.interceptors = {
            request: [],
            response: []
        };
    }

    /**
     * Set base URL for all requests
     */
    setBaseUrl(url) {
        this.baseUrl = url;
    }

    /**
     * Set default headers
     */
    setHeaders(headers) {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }

    /**
     * Add request interceptor
     */
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    }

    /**
     * Make HTTP request
     */
    async request(method, url, data = null, options = {}) {
        let fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

        let config = {
            method,
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            config.body = JSON.stringify(data);
        }

        // Apply request interceptors
        for (const interceptor of this.interceptors.request) {
            config = await interceptor(config) || config;
        }

        try {
            const response = await fetch(fullUrl, config);

            let result = {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: null
            };

            // Parse response body
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                result.data = await response.json();
            } else {
                result.data = await response.text();
            }

            // Apply response interceptors
            for (const interceptor of this.interceptors.response) {
                result = await interceptor(result) || result;
            }

            if (!response.ok) {
                throw {
                    type: 'HttpError',
                    status: response.status,
                    message: result.data?.message || response.statusText,
                    data: result.data
                };
            }

            return result;

        } catch (error) {
            if (error.type === 'HttpError') {
                throw error;
            }

            throw {
                type: 'NetworkError',
                message: error.message || 'Network error occurred'
            };
        }
    }

    /**
     * GET request
     */
    async get(url, options = {}) {
        return this.request('GET', url, null, options);
    }

    /**
     * POST request
     */
    async post(url, data, options = {}) {
        return this.request('POST', url, data, options);
    }

    /**
     * PUT request
     */
    async put(url, data, options = {}) {
        return this.request('PUT', url, data, options);
    }

    /**
     * PATCH request
     */
    async patch(url, data, options = {}) {
        return this.request('PATCH', url, data, options);
    }

    /**
     * DELETE request
     */
    async delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }
}

// Create global HTTP client instance
export const http = new YiphthachlHttp();

// Convenience functions
export async function fetchData(url, options = {}) {
    try {
        const response = await http.get(url, options);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error };
    }
}

export async function sendData(url, data, options = {}) {
    try {
        const response = await http.post(url, data, options);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error };
    }
}

export async function updateData(url, data, options = {}) {
    try {
        const response = await http.put(url, data, options);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error };
    }
}

export async function deleteData(url, options = {}) {
    try {
        const response = await http.delete(url, options);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * API Resource helper for RESTful APIs
 */
export class ApiResource {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async list(params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${this.baseUrl}?${query}` : this.baseUrl;
        return fetchData(url);
    }

    async get(id) {
        return fetchData(`${this.baseUrl}/${id}`);
    }

    async create(data) {
        return sendData(this.baseUrl, data);
    }

    async update(id, data) {
        return updateData(`${this.baseUrl}/${id}`, data);
    }

    async delete(id) {
        return deleteData(`${this.baseUrl}/${id}`);
    }
}

export function createResource(baseUrl) {
    return new ApiResource(baseUrl);
}
