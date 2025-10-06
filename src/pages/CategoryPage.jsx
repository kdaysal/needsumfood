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
    const [isSaving, setIsSaving] = useState(false)

    const { hasUnsavedChanges, dirtyItems } = useMemo(() => {
        const baselineMap = new Map(baselineItems.map((item) => [item._id, item]))
        const pendingUpdates = []

        for (const item of items) {
            const baseline = baselineMap.get(item._id)
            if (!baseline) continue

            const changes = {}

            for (const field of ["notes", "location"]) {
                const currentValue = sanitizeOnBlur(item[field] ?? "")
                const baselineValue = sanitizeOnBlur(baseline[field] ?? "")

                if (currentValue !== baselineValue) {
                    changes[field] = currentValue
                }
            }

            if (Object.keys(changes).length > 0) {
                pendingUpdates.push({ itemId: item._id, changes })
            }
        }

        const trimmedNewItem = sanitizeOnBlur(newItem)

        return {
            hasUnsavedChanges:
                pendingUpdates.length > 0 || trimmedNewItem.length > 0 || items.length !== baselineItems.length,
            dirtyItems: pendingUpdates,
        }
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

    const handleFieldBlur = (itemId, field, value) => {
        const trimmedValue = sanitizeOnBlur(value)
        const currentItem = items.find((it) => it._id === itemId)
        if (!currentItem) return

        setItems((prev) =>
            prev.map((it) => (it._id === itemId ? { ...it, [field]: trimmedValue } : it)),
        )
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

    const handleSaveChanges = async () => {
        if (isSaving || dirtyItems.length === 0) return

        setIsSaving(true)
        const successfullyUpdated = []

        for (const { itemId, changes } of dirtyItems) {
            try {
                const updated = toEditableItem(await updateItem(itemId, changes))
                successfullyUpdated.push(updated)
            } catch (e) {
                console.error("Error saving item changes:", e)
            }
        }

        if (successfullyUpdated.length > 0) {
            const updatedMap = new Map(successfullyUpdated.map((item) => [item._id, item]))
            setItems((prev) => prev.map((it) => updatedMap.get(it._id) ?? it))
            setBaselineItems((prev) =>
                prev.map((it) => {
                    const updated = updatedMap.get(it._id)
                    return updated ? { ...updated } : it
                }),
            )
        }

        setIsSaving(false)
    }

    const filteredItems = items.filter((item) => {
        if (itemView === "all") return true
        if (itemView === "hidden") return item.hidden
        if (itemView === "need") return !item.need
        if (itemView === "have") return Boolean(item.need)
        return !item.hidden
    })

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <Link to="/" className={styles.backLink}>
                        ← Back
                    </Link>
                    <button
                        className={styles.saveButton}
                        onClick={handleSaveChanges}
                        disabled={dirtyItems.length === 0 || isSaving}
                    >
                        {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
                <h1 className={styles.title}>{categoryName || "Category Items"}</h1>
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
                    <button
                        className={`${styles.segmentBtn} ${itemView === "need" ? styles.active : ""}`}
                        onClick={() => setItemView("need")}
                    >
                        Need
                    </button>
                    <button
                        className={`${styles.segmentBtn} ${itemView === "have" ? styles.active : ""}`}
                        onClick={() => setItemView("have")}
                    >
                        Have
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
                                {item.hidden ? "" : "🙈"}
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
