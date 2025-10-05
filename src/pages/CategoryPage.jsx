// src/pages/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchItems, createItem, updateItem, deleteItem } from "../api"
import ConfirmModal from "../components/ConfirmModal"
import useConfirmingBlocker from "../hooks/useConfirmingBlocker"
import { sanitizeOnBlur, sanitizeOnChange } from "../utils/sanitizeInput"

const toEditableItem = (item) => ({
    ...item,
    notes:
        typeof item.notes === "string"
            ? sanitizeOnBlur(item.notes)
            : "",
    location:
        typeof item.location === "string"
            ? sanitizeOnBlur(item.location)
            : "",
})

function CategoryPage() {
    const { id } = useParams()
    const [categoryName, setCategoryName] = useState("")
    const [items, setItems] = useState([])
    const [baselineItems, setBaselineItems] = useState([])
    const [newItem, setNewItem] = useState("")
    const [modalItemId, setModalItemId] = useState(null)
    const [itemView, setItemView] = useState("visible")
    const [loading, setLoading] = useState(false)

    const hasUnsavedChanges = useMemo(() => {
        if (newItem.trim().length > 0) return true

        if (items.length !== baselineItems.length) return true

        const baselineMap = new Map(baselineItems.map((item) => [item._id, item]))

        return items.some((item) => {
            const baseline = baselineMap.get(item._id)
            if (!baseline) return true

            return ["notes", "location"].some((field) => {
                const currentValue = item[field] ?? ""
                const baselineValue = baseline[field] ?? ""
                return currentValue !== baselineValue
            })
        })
    }, [items, baselineItems, newItem])
    useConfirmingBlocker(hasUnsavedChanges)

    // Load items + category name
    useEffect(() => {
        ;(async () => {
            setLoading(true)
            try {
                const { category, items } = await fetchItems(id)
                const normalizedItems = items.map((item) => toEditableItem(item))
                setCategoryName(category.name)
                setItems(normalizedItems)
                setBaselineItems(normalizedItems.map((item) => ({ ...item })))
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
            const created = toEditableItem(await createItem(id, name))
            setItems((prev) => [...prev, created])
            setBaselineItems((prev) => [...prev, { ...created }])
            setNewItem("")
        } catch (e) {
            console.error("Error adding item:", e)
        }
    }

    // Toggle hide/show
    const handleToggleHidden = async (itemId, hidden) => {
        try {
            const updated = toEditableItem(await updateItem(itemId, { hidden: !hidden }))
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
            setBaselineItems((prev) => prev.map((it) => (it._id === itemId ? { ...updated } : it)))
        } catch (e) {
            console.error("Error toggling item:", e)
        }
    }

    // Toggle need/have
    const handleToggleNeed = async (itemId, need) => {
        try {
            const updated = toEditableItem(await updateItem(itemId, { need: !need }))
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
            setBaselineItems((prev) => prev.map((it) => (it._id === itemId ? { ...updated } : it)))
        } catch (e) {
            console.error("Error toggling need:", e)
        }
    }

    // Update notes/location inline
    const handleFieldChange = (itemId, field, value) => {
        const sanitized = sanitizeOnChange(value)
        setItems((prev) =>
            prev.map((it) => (it._id === itemId ? { ...it, [field]: sanitized } : it)),
        )
    }

    const handleFieldBlur = async (itemId, field, value) => {
        const trimmedValue = sanitizeOnBlur(value)
        const currentItem = items.find((it) => it._id === itemId)
        if (!currentItem) return

        setItems((prev) =>
            prev.map((it) => (it._id === itemId ? { ...it, [field]: trimmedValue } : it)),
        )

        const baselineItem = baselineItems.find((it) => it._id === itemId)
        const baselineValue = sanitizeOnBlur(baselineItem?.[field] ?? "")
        if (baselineValue === trimmedValue) {
            return
        }

        try {
            const updated = toEditableItem(await updateItem(itemId, { [field]: trimmedValue }))
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
            setBaselineItems((prev) =>
                prev.map((it) => (it._id === itemId ? { ...updated } : it)),
            )
        } catch (e) {
            console.error(`Error updating ${field}:`, e)
            if (baselineItem) {
                setItems((prev) =>
                    prev.map((it) =>
                        it._id === itemId
                            ? { ...it, [field]: baselineItem[field] ?? "" }
                            : it,
                    ),
                )
            }
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
            setBaselineItems((prev) => prev.filter((it) => it._id !== itemId))
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
                    onChange={(e) => setNewItem(sanitizeOnChange(e.target.value))}
                    onBlur={() => setNewItem((prev) => sanitizeOnBlur(prev))}
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
                    2,
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
                                onBlur={(e) => handleFieldBlur(item._id, "notes", e.target.value)}
                            />
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Location"
                                value={item.location || ""}
                                onChange={(e) => handleFieldChange(item._id, "location", e.target.value)}
                                onBlur={(e) => handleFieldBlur(item._id, "location", e.target.value)}
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
