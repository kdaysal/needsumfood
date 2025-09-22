// src/App.jsx
import { Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import CategoryPage from "./pages/CategoryPage" // new route

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
        </Routes>
    )
}

export default App
