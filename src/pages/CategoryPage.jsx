// src/pages/CategoryPage.jsx
import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchCategories } from "../api"

function CategoryPage() {
    const { id } = useParams()
    const [category, setCategory] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ;(async () => {
            try {
                // For now we just fetch all categories and find the one we clicked
                const data = await fetchCategories("all")
                const found = data.find((c) => c._id === id)
                setCategory(found || null)
            } catch (e) {
                console.error("Error loading category:", e)
            } finally {
                setLoading(false)
            }
        })()
    }, [id])

    if (loading) return <div>Loading category…</div>

    if (!category) {
        return (
            <div>
                <h2>Category not found</h2>
                <Link to="/">← Back to categories</Link>
            </div>
        )
    }

    return (
        <div>
            <h2>{category.name}</h2>
            <p>Placeholder for items list in this category.</p>
            <Link to="/">← Back to categories</Link>
        </div>
    )
}

export default CategoryPage
