// src/pages/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useParams, Link, useBlocker } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchItems, createItem, updateItem, deleteItem } from "../api"
import ConfirmModal from "../components/ConfirmModal"

function CategoryPage() {
    const { id } = useParams()
    const [categoryName, setCategoryName] = useState("")
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState("")
    const [modalItemId, setModalItemId] = useState(null)
    const [itemView, setItemView] = useState("visible")
    const [loading, setLoading] = useState(false)

    const hasUnsavedChanges = useMemo(() => newItem.trim().length > 0, [newItem])
<<<<<<< ours
<<<<<<< ours
=======
>>>>>>> theirs
    const { state: blockerState, proceed, reset } = useBlocker(hasUnsavedChanges)

    useEffect(() => {
        if (blockerState !== "blocked") return

<<<<<<< ours
        const shouldLeave = window.confirm("You have unsaved changes. Are you sure you want to leave this page?")
=======
        const shouldLeave = window.confirm(
            "You have unsaved changes. Are you sure you want to leave this page?",
        )
>>>>>>> theirs

        if (shouldLeave) {
            proceed?.()
        } else {
            reset?.()
        }
    }, [blockerState, proceed, reset])

    useEffect(() => {
        if (!hasUnsavedChanges && blockerState === "blocked") {
            reset?.()
        }
    }, [hasUnsavedChanges, blockerState, reset])
<<<<<<< ours
=======
    const blocker = useBlocker(hasUnsavedChanges)

    useEffect(() => {
        if (blocker.state !== "blocked") return

        const shouldLeave = window.confirm(
            "You have unsaved changes. Are you sure you want to leave this page?",
        )

        if (shouldLeave) {
            blocker.proceed?.()
        } else {
            blocker.reset?.()
        }
    }, [blocker])

    useEffect(() => {
        if (!hasUnsavedChanges && blocker.state === "blocked") {
            blocker.reset?.()
        }
    }, [hasUnsavedChanges, blocker])
>>>>>>> theirs
=======
>>>>>>> theirs

    // Load items + category name
    useEffect(() => {
        ;(async () => {
            setLoading(true)
            try {
                const { category, items } = await fetchItems(id)
                setCategoryName(category.name)
                setItems(items)
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

    // Update notes/location inline
    const handleFieldChange = async (itemId, field, value) => {
        try {
            const updated = await updateItem(itemId, { [field]: value })
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
        } catch (e) {
            console.error(`Error updating ${field}:`, e)
        }
    }

    // Delete with confirm
    const handleDelete = (itemId) => setModalItemId(itemId)
    const confirmDelete = async () => {
        const itemId = modalItemId
        setModalItemId(null)
        try {
            await deleteItem(itemId)
            setItems((prev) => prev.filter((it) => it._id !== itemId))
        } catch (e) {
            console.error("Error deleting item:", e)
        }
    }
    const cancelDelete = () => setModalItemId(null)

    const filteredItems = items.filter((item) => {
        if (itemView === "all") return true
        if (itemView === "hidden") return item.hidden
        return !item.hidden
    })

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{categoryName || "Category Items"}</h1>
                <Link to="/" className={styles.backLink}>
                    ← Back
                </Link>

                <div className={styles.segment}>
                    <button
                        className={`${styles.segmentBtn} ${itemView === "visible" ? styles.active : ""}`}
                        onClick={() => setItemView("visible")}
                    >
                        Visible
                    </button>
                    <button
                        className={`${styles.segmentBtn} ${itemView === "hidden" ? styles.active : ""}`}
                        onClick={() => setItemView("hidden")}
                    >
                        Hidden
                    </button>
                    <button
                        className={`${styles.segmentBtn} ${itemView === "all" ? styles.active : ""}`}
                        onClick={() => setItemView("all")}
                    >
                        All
                    </button>
                </div>
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

            {/* Debug info */}
            <pre style={{ background: "#f6f6f6", padding: "0.5rem" }}>
                {JSON.stringify(
                    {
                        id,
                        categoryName,
                        view: itemView,
                        totalItems: items.length,
                        filteredCount: filteredItems.length,
                    },
                    null,
                    2
                )}
            </pre>

            {/* List */}
            <main className={styles.list}>
                {loading && <div className={styles.loading}>Loading…</div>}
                {!loading && items.length === 0 && (
                    <div className={styles.empty}>No items yet — add some to get started!</div>
                )}
                {!loading && items.length > 0 && filteredItems.length === 0 && (
                    <div className={styles.empty}>No items in this view.</div>
                )}

                {filteredItems.map((item) => (
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

            <ConfirmModal
                open={Boolean(modalItemId)}
                styles={styles}
                message="Are you sure you want to permanently delete this item?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    )
}

export default CategoryPage
