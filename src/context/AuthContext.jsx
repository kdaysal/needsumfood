// src/context/AuthContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
    login as loginRequest,
    register as registerRequest,
    guestLogin as guestLoginRequest,
    setAuthToken,
    setUnauthorizedHandler,
} from "../api"

const TOKEN_STORAGE_KEY = "needsumfood.auth.token"
const USER_STORAGE_KEY = "needsumfood.auth.user"

const AuthContext = createContext(null)

const readStoredAuth = () => {
    if (typeof window === "undefined") {
        return { token: null, user: null }
    }

    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUserRaw = window.localStorage.getItem(USER_STORAGE_KEY)

    if (!storedToken || !storedUserRaw) {
        return { token: null, user: null }
    }

    try {
        const parsedUser = JSON.parse(storedUserRaw)
        return { token: storedToken, user: parsedUser }
    } catch (err) {
        console.warn("Failed to parse stored auth user:", err)
        return { token: null, user: null }
    }
}

export function AuthProvider({ children }) {
    const [authState, setAuthState] = useState(() => readStoredAuth())

    useEffect(() => {
        setAuthToken(authState.token)
    }, [authState.token])

    const persistAuth = useCallback((token, user) => {
        setAuthState({ token, user })

        if (typeof window !== "undefined") {
            if (token && user) {
                window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
                window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
            } else {
                window.localStorage.removeItem(TOKEN_STORAGE_KEY)
                window.localStorage.removeItem(USER_STORAGE_KEY)
            }
        }

        setAuthToken(token)
    }, [])

    const logout = useCallback(() => {
        persistAuth(null, null)
    }, [persistAuth])

    useEffect(() => {
        setUnauthorizedHandler(() => logout())
        return () => setUnauthorizedHandler(null)
    }, [logout])

    const login = useCallback(
        async (username, password) => {
            const response = await loginRequest(username, password)
            persistAuth(response.token, response.user)
            return response
        },
        [persistAuth],
    )

    const register = useCallback(
        async (username, password) => {
            const response = await registerRequest(username, password)
            persistAuth(response.token, response.user)
            return response
        },
        [persistAuth],
    )

    const continueAsGuest = useCallback(async () => {
        const response = await guestLoginRequest()
        persistAuth(response.token, response.user)
        return response
    }, [persistAuth])

    const value = useMemo(
        () => ({
            user: authState.user,
            token: authState.token,
            isAuthenticated: Boolean(authState.token),
            isGuest: authState.user?.role === "guest",
            login,
            register,
            continueAsGuest,
            logout,
        }),
        [authState, login, register, continueAsGuest, logout],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
