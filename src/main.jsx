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
import { SortProvider } from "./context/SortContext.jsx"

const router = createBrowserRouter(
    [
        {
            element: <App />,
            children: [
                { path: "/", element: <LandingPage /> },
                { path: "/login", element: <LoginPage /> },
                { path: "/category/:id", element: <CategoryPage /> },
            ],
        },
    ],
    { basename: "/needsumfood" },
)

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <SortProvider>
            <RouterProvider router={router} />
        </SortProvider>
    </React.StrictMode>,
)
