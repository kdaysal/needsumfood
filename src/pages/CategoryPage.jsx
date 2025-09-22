// src/pages/CategoryPage.jsx
import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchItems, createItem } from "../api"
import styles from "./LandingPage.module.css" // reuse existing styles for now

function CategoryPage() {
    const { id } = useParams()
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState("")
    const [loading, setLoading] = useState(false)

    // Fetch items when category ID changes
    useEffect(() => {
        ;(async () => {
            setLoading(true)
            try {
                const data = await fetchItems(id)
                setItems(data)
            } catch (e) {
                console.error("Error fetching items:", e)
            } finally {
                setLoading(false)
            }
        })()
    }, [id])

    // Add new item
    const handleAddItem = async () => {
        const name = newItem.trim()
        if (!name) return

        try {
            const created = await createItem(id, { name })
            setItems((prev) => [...prev, created])
            setNewItem("")
        } catch (e) {
            console.error("Error creating item:", e)
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link to="/" className={styles.backLink}>
                    ← Back
                </Link>
                <h2 className={styles.title}>Items</h2>
            </header>

            <div className={styles.addBar}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="New item"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                />
                <button className={styles.addBtn} onClick={handleAddItem}>
                    Add
                </button>
            </div>

            <main className={styles.list}>
                {loading && <div className={styles.loading}>Loading…</div>}
                {!loading && items.length === 0 && (
                    <div className={styles.empty}>No items yet — add some to get started.</div>
                )}

                {items.map((item) => (
                    <div key={item._id} className={styles.card}>
                        <span className={styles.cardTitle}>{item.name}</span>
                    </div>
                ))}
            </main>
        </div>
    )
}

export default CategoryPage
