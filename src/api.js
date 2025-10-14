// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:5001"

let authToken = null
let unauthorizedHandler = null

export const setAuthToken = (token) => {
    authToken = token || null
}

export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = typeof handler === "function" ? handler : null
}

const buildHeaders = (headers = {}, skipAuth = false) => {
    const normalized = { ...headers }
    if (!skipAuth && authToken) {
        normalized.Authorization = `Bearer ${authToken}`
    }
    return normalized
}

const request = async (path, { method = "GET", body, headers, skipAuth = false } = {}) => {
    const options = {
        method,
        headers: buildHeaders(headers, skipAuth),
    }

    if (body !== undefined) {
        options.body = JSON.stringify(body)
        options.headers["Content-Type"] = "application/json"
    }

    const response = await fetch(`${BASE_URL}${path}`, options)

    if (response.status === 401 || response.status === 403) {
        let message = "unauthorized"
        try {
            const payload = await response.json()
            if (payload?.error) {
                message = payload.error
            }
        } catch (err) {
            // Ignore JSON parse errors for non-JSON responses
        }

        if (!skipAuth && unauthorizedHandler) {
            unauthorizedHandler()
        }

        throw new Error(message)
    }

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`
        try {
            const payload = await response.json()
            if (payload?.error) {
                message = payload.error
            }
        } catch (err) {
            // Ignore JSON parse errors for non-JSON responses
        }
        throw new Error(message)
    }

    if (response.status === 204) {
        return null
    }

    return response.json()
}

// ===== Auth =====
export const login = (username, password) =>
    request("/auth/login", {
        method: "POST",
        body: { username, password },
        skipAuth: true,
    })

export const register = (username, password) =>
    request("/auth/register", {
        method: "POST",
        body: { username, password },
        skipAuth: true,
    })

export const guestLogin = () =>
    request("/auth/guest", {
        method: "POST",
        skipAuth: true,
    })

// ===== Categories =====
export const fetchCategories = (view = "visible") => request(`/categories?view=${view}`)

export const createCategory = (name) =>
    request("/categories", {
        method: "POST",
        body: { name },
    })

export const updateCategory = (id, payload) =>
    request(`/categories/${id}`, {
        method: "PATCH",
        body: payload,
    })

export const deleteCategory = (id) =>
    request(`/categories/${id}`, {
        method: "DELETE",
    })

// ===== Items =====
export const fetchItems = (categoryId) => request(`/items/${categoryId}`)

export const createItem = (categoryId, name) =>
    request(`/items/${categoryId}`, {
        method: "POST",
        body: { name },
    })

export const updateItem = (id, payload) =>
    request(`/items/${id}`, {
        method: "PATCH",
        body: payload,
    })

export const deleteItem = (id) =>
    request(`/items/${id}`, {
        method: "DELETE",
    })
