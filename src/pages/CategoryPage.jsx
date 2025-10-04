// src/pages/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useParams, Link, unstable_useBlocker } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchItems, createItem, updateItem, deleteItem } from "../api"
import ConfirmModal from "../components/ConfirmModal"

function CategoryPage() {
    const { id } = useParams()
    const [categoryName, setCategoryName] = useState("")
    const [items, setItems] = useState([])
    const [draftItems, setDraftItems] = useState({})
    const [dirtyItemIds, setDirtyItemIds] = useState(() => new Set())
    const [newItem, setNewItem] = useState("")
    const [modalItemId, setModalItemId] = useState(null)
    const [itemView, setItemView] = useState("visible")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)

    const hasUnsavedChanges = useMemo(() => dirtyItemIds.size > 0, [dirtyItemIds])
    const blocker = unstable_useBlocker(hasUnsavedChanges)

    const toDraftMap = (list) =>
        list.reduce((acc, item) => {
            acc[item._id] = { ...item }
            return acc
        }, {})

    // Load items + category name
    useEffect(() => {
        ;(async () => {
            setLoading(true)
            try {
                const { category, items } = await fetchItems(id)
                setCategoryName(category.name)
                setItems(items)
                setDraftItems(toDraftMap(items))
                setDirtyItemIds(new Set())
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
            setDraftItems((prev) => ({ ...prev, [created._id]: { ...created } }))
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
            setDraftItems((prev) => {
                const existing = prev[itemId] ?? updated
                return {
                    ...prev,
                    [itemId]: { ...updated, ...existing, hidden: updated.hidden },
                }
            })
        } catch (e) {
            console.error("Error toggling item:", e)
        }
    }

    // Toggle need/have
    const handleToggleNeed = async (itemId, need) => {
        try {
            const updated = await updateItem(itemId, { need: !need })
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
            setDraftItems((prev) => {
                const existing = prev[itemId] ?? updated
                return {
                    ...prev,
                    [itemId]: { ...updated, ...existing, need: updated.need },
                }
            })
        } catch (e) {
            console.error("Error toggling need:", e)
        }
    }

    // Update notes/location inline
    const handleFieldChange = (itemId, field, value) => {
        setDraftItems((prev) => {
            const existing = prev[itemId] ?? items.find((it) => it._id === itemId) ?? {}
            return {
                ...prev,
                [itemId]: { ...existing, [field]: value },
            }
        })
        setDirtyItemIds((prev) => {
            const next = new Set(prev)
            next.add(itemId)
            return next
        })
        setSaveError(null)
    }

    const handleSave = async () => {
        const dirtyIds = Array.from(dirtyItemIds)
        if (dirtyIds.length === 0) return

        setSaving(true)
        setSaveError(null)

        const results = await Promise.allSettled(
            dirtyIds.map(async (itemId) => {
                const draft = draftItems[itemId]
                const original = items.find((it) => it._id === itemId)
                if (!draft || !original) {
                    throw new Error("Item not found")
                }

                const payload = Object.keys(draft).reduce((acc, key) => {
                    if (key === "_id") return acc
                    if (draft[key] !== original[key]) acc[key] = draft[key]
                    return acc
                }, {})

                if (Object.keys(payload).length === 0) {
                    return { ...original, ...draft }
                }

                return updateItem(itemId, payload)
            })
        )

        const updatedMap = {}
        const failedIds = []

        results.forEach((result, index) => {
            const itemId = dirtyIds[index]
            if (result.status === "fulfilled") {
                updatedMap[itemId] = result.value
            } else {
                failedIds.push(itemId)
            }
        })

        if (Object.keys(updatedMap).length > 0) {
            setItems((prev) => prev.map((item) => (updatedMap[item._id] ? updatedMap[item._id] : item)))
            setDraftItems((prev) => {
                const next = { ...prev }
                Object.entries(updatedMap).forEach(([itemId, value]) => {
                    next[itemId] = { ...value }
                })
                return next
            })
            setDirtyItemIds((prev) => {
                const next = new Set(prev)
                Object.keys(updatedMap).forEach((itemId) => next.delete(itemId))
                return next
            })
        }

        if (failedIds.length > 0) {
            setSaveError("Some items failed to save. Please try again.")
        } else {
            setSaveError(null)
        }

        if (blocker.state === "blocked") {
            blocker.reset()
        }

        setSaving(false)
    }

    // Delete with confirm
    const handleDelete = (itemId) => setModalItemId(itemId)
    const confirmDelete = async () => {
        const itemId = modalItemId
        setModalItemId(null)
        try {
            await deleteItem(itemId)
            setItems((prev) => prev.filter((it) => it._id !== itemId))
            setDraftItems((prev) => {
                const next = { ...prev }
                delete next[itemId]
                return next
            })
            setDirtyItemIds((prev) => {
                const next = new Set(prev)
                next.delete(itemId)
                return next
            })
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

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!hasUnsavedChanges) return
            event.preventDefault()
            event.returnValue = ""
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [hasUnsavedChanges])

    useEffect(() => {
        if (blocker.state === "blocked") {
            const confirmNavigation = window.confirm(
                "You have unsaved changes. Are you sure you want to leave this page?"
            )
            if (confirmNavigation) {
                blocker.proceed()
            } else {
                blocker.reset()
            }
        }
    }, [blocker])

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{categoryName || "Category Items"}</h1>
                <div className={styles.headerRow}>
                    <Link to="/" className={styles.backLink}>
                        ← Back
                    </Link>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={!hasUnsavedChanges || saving}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
                {saveError && <div className={styles.errorText}>{saveError}</div>}
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
                                value={draftItems[item._id]?.notes || ""}
                                onChange={(e) => handleFieldChange(item._id, "notes", e.target.value)}
                            />
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Location"
                                value={draftItems[item._id]?.location || ""}
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
