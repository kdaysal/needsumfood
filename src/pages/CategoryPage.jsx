// src/pages/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchItems, createItem, updateItem, deleteItem } from "../api"
import ConfirmModal from "../components/ConfirmModal"
import useConfirmingBlocker from "../hooks/useConfirmingBlocker"

const buildDrafts = (list) =>
    list.reduce((acc, item) => {
        acc[item._id] = {
            notes: item.notes ?? "",
            location: item.location ?? "",
        }
        return acc
    }, {})

function CategoryPage() {
    const { id } = useParams()
    const [categoryName, setCategoryName] = useState("")
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState("")
    const [modalItemId, setModalItemId] = useState(null)
    const [itemView, setItemView] = useState("visible")
    const [loading, setLoading] = useState(false)
    const [draftItems, setDraftItems] = useState({})
    const [dirtyItemIds, setDirtyItemIds] = useState(new Set())
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const hasUnsavedChanges = useMemo(() => dirtyItemIds.size > 0, [dirtyItemIds])
    useConfirmingBlocker(hasUnsavedChanges)

    useEffect(() => {
        if (!saveSuccess) return undefined

        const timer = setTimeout(() => setSaveSuccess(false), 2500)
        return () => clearTimeout(timer)
    }, [saveSuccess])

    // Load items + category name
    useEffect(() => {
        ;(async () => {
            setLoading(true)
            try {
                const { category, items } = await fetchItems(id)
                setCategoryName(category.name)
                setItems(items)
                setDraftItems(buildDrafts(items))
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
            setDraftItems((prev) => ({
                ...prev,
                [created._id]: {
                    notes: created.notes ?? "",
                    location: created.location ?? "",
                },
            }))
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
    const handleFieldChange = (itemId, field, value) => {
        setSaveSuccess(false)
        setSaveError(null)

        setDraftItems((prev) => {
            const existingDraft = prev[itemId] ?? {
                notes: items.find((it) => it._id === itemId)?.notes ?? "",
                location: items.find((it) => it._id === itemId)?.location ?? "",
            }

       	    return {
                ...prev,
                [itemId]: {
                    ...existingDraft,
                    [field]: value,
                },
            }
        })

        setDirtyItemIds((prev) => {
            const next = new Set(prev)
            next.add(itemId)
            return next
        })
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
                if (!prev.has(itemId)) return prev
                const next = new Set(prev)
                next.delete(itemId)
                return next
            })
        } catch (e) {
            console.error("Error deleting item:", e)
        }
    }
    const cancelDelete = () => setModalItemId(null)

    const handleSave = async () => {
        if (dirtyItemIds.size === 0 || saving) return

        setSaving(true)
        setSaveError(null)
        setSaveSuccess(false)

        const ids = Array.from(dirtyItemIds)
        const failedIds = new Set()
        const updatedMap = new Map()

        for (const itemId of ids) {
            const draft = draftItems[itemId]
            const current = items.find((it) => it._id === itemId)

            if (!draft || !current) {
                continue
            }

            const payload = {}
            const normalizedNotes = draft.notes ?? ""
            const normalizedLocation = draft.location ?? ""

            if ((current.notes ?? "") !== normalizedNotes) {
                payload.notes = normalizedNotes
            }

            if ((current.location ?? "") !== normalizedLocation) {
                payload.location = normalizedLocation
            }

            if (Object.keys(payload).length === 0) {
                updatedMap.set(itemId, {
                    ...current,
                    notes: normalizedNotes,
                    location: normalizedLocation,
                })
                continue
            }

            try {
                const updated = await updateItem(itemId, payload)
                updatedMap.set(itemId, updated)
            } catch (error) {
                console.error("Error saving item", itemId, error)
                failedIds.add(itemId)
            }
        }

        if (updatedMap.size > 0) {
            setItems((prev) =>
                prev.map((item) => {
                    const updated = updatedMap.get(item._id)
                    return updated ? { ...item, ...updated } : item
                }),
            )

            setDraftItems((prev) => {
                const next = { ...prev }
                updatedMap.forEach((updated, itemId) => {
                    next[itemId] = {
                        notes: updated.notes ?? "",
                        location: updated.location ?? "",
                    }
                })
                return next
            })
        }

        if (failedIds.size > 0) {
            setDirtyItemIds(new Set(failedIds))
            setSaveError("Some changes could not be saved. Please try again.")
        } else {
            setDirtyItemIds(new Set())
            setSaveSuccess(true)
        }

        setSaving(false)
    }

    const filteredItems = items.filter((item) => {
        if (itemView === "all") return true
        if (itemView === "hidden") return item.hidden
        return !item.hidden
    })

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerRow}>
                    <h1 className={styles.title}>{categoryName || "Category Items"}</h1>
                    <div className={styles.headerActions}>
                        <Link to="/" className={styles.backLink}>
                            ← Back
                        </Link>
                        <button
                            type="button"
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || saving}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
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
                {saveSuccess && (
                    <div className={styles.statusMessage}>Changes saved.</div>
                )}
                {saveError && (
                    <div className={`${styles.statusMessage} ${styles.statusMessageError}`}>
                        {saveError}
                    </div>
                )}
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
                        dirtyCount: dirtyItemIds.size,
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
                                value={draftItems[item._id]?.notes ?? ""}
                                onChange={(e) => handleFieldChange(item._id, "notes", e.target.value)}
                            />
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Location"
                                value={draftItems[item._id]?.location ?? ""}
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
