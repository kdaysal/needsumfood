// src/main.jsx
// Configure the data router so useBlocker-based prompts work under the /needsumfood basename.
import "./index.css"
import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App.jsx"
import LandingPage from "./pages/LandingPage.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import CategoryPage from "./pages/CategoryPage.jsx"
import ProtectedLayout from "./components/ProtectedLayout.jsx"
import { SortProvider } from "./context/SortContext.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"

const router = createBrowserRouter(
    [
        {
            element: <App />,
            children: [
                { path: "/", element: <LoginPage /> },
                { path: "/login", element: <LoginPage /> },
                {
                    element: <ProtectedLayout />,
                    children: [
                        { path: "/landing", element: <LandingPage /> },
                        { path: "/category/:id", element: <CategoryPage /> },
                    ],
                },
            ],
        },
    ],
    { basename: "/needsumfood" },
)

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <SortProvider>
                <RouterProvider router={router} />
            </SortProvider>
        </AuthProvider>
    </React.StrictMode>,
)
