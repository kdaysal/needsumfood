// src/main.jsx
import "./index.css"
import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App.jsx"
import LandingPage from "./pages/LandingPage.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import CategoryPage from "./pages/CategoryPage.jsx"

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
<<<<<<< ours
<<<<<<< ours
    { basename: "/needsumfood" }
=======
    { basename: "/needsumfood" },
>>>>>>> theirs
=======
    { basename: "/needsumfood" },
>>>>>>> theirs
)

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <RouterProvider router={router} />
<<<<<<< ours
<<<<<<< ours
    </React.StrictMode>
=======
    </React.StrictMode>,
>>>>>>> theirs
=======
    </React.StrictMode>,
>>>>>>> theirs
)
