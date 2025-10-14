// src/components/ProtectedLayout.jsx
import React from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

function ProtectedLayout() {
    const { isAuthenticated } = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/" replace state={{ from: location }} />
    }

    return <Outlet />
}

export default ProtectedLayout
