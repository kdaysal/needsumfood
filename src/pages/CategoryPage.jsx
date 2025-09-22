// src/pages/CategoryPage.jsx
import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchItems, createItem, updateItem, deleteItem } from "../api"

function CategoryPage() {
    const { id } = useParams()
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState("")
    const [loading, setLoading] = useState(false)

    // Load items
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
            const created = await createItem(id, name)
            setItems((prev) => [...prev, created])
            setNewItem("")
        } catch (e) {
            console.error("Error adding item:", e)
        }
    }

    // Toggle hide/show
    const handleToggleHidden = async (itemId, hidden) => {
        try {
            const updated = await updateItem(itemId, { hidden: !hidden })
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
        } catch (e) {
            console.error("Error toggling item:", e)
        }
    }

    // Toggle need/have
    const handleToggleNeed = async (itemId, need) => {
        try {
            const updated = await updateItem(itemId, { need: !need })
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
        } catch (e) {
            console.error("Error toggling need:", e)
        }
    }

    // Update notes or location inline
    const handleFieldChange = async (itemId, field, value) => {
        try {
            const updated = await updateItem(itemId, { [field]: value })
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
        } catch (e) {
            console.error(`Error updating ${field}:`, e)
        }
    }

    // Delete
    const handleDelete = async (itemId) => {
        try {
            await deleteItem(itemId)
            setItems((prev) => prev.filter((it) => it._id !== itemId))
        } catch (e) {
            console.error("Error deleting item:", e)
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Category Items</h1>
                <Link to="/" className={styles.backLink}>
                    ← Back
                </Link>
            </header>

            {/* Add item */}
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

            {/* List */}
            <main className={styles.list}>
                {loading && <div className={styles.loading}>Loading…</div>}
                {!loading && items.length === 0 && (
                    <div className={styles.empty}>No items yet — add some to get started!</div>
                )}

                {items.map((item) => (
                    <div key={item._id} className={styles.card}>
                        <span className={styles.cardTitle}>{item.name}</span>

                        <div className={styles.cardFields}>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Notes"
                                value={item.notes || ""}
                                onChange={(e) => handleFieldChange(item._id, "notes", e.target.value)}
                            />
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Location"
                                value={item.location || ""}
                                onChange={(e) => handleFieldChange(item._id, "location", e.target.value)}
                            />
                        </div>

                        <div className={styles.actions}>
                            <button
                                className={styles.iconBtn}
                                title={item.hidden ? "Show" : "Hide"}
                                onClick={() => handleToggleHidden(item._id, item.hidden)}
                            >
                                {item.hidden ? "👀" : "🙈"}
                            </button>
                            <button
                                className={styles.iconBtn}
                                title={item.need ? "Mark as Have" : "Mark as Need"}
                                onClick={() => handleToggleNeed(item._id, item.need)}
                            >
                                {item.need ? "🛒" : "✅"}
                            </button>
                            <button
                                className={`${styles.iconBtn} ${styles.danger}`}
                                title="Delete"
                                onClick={() => handleDelete(item._id)}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    )
}

export default CategoryPage
