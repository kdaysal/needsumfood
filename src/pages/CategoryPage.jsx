// src/pages/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchItems, createItem, updateItem, deleteItem } from "../api"
import ConfirmModal from "../components/ConfirmModal"
import EditItemModal from "../components/EditItemModal"
import useConfirmingBlocker from "../hooks/useConfirmingBlocker"
import { sanitizeOnBlur, sanitizeOnChange } from "../utils/sanitizeInput"

const toEditableItem = (item) => ({
    ...item,
    need: item.need !== false,
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
    const [statusFilter, setStatusFilter] = useState("all")
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [isEditingSaving, setIsEditingSaving] = useState(false)

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

    const openEditModal = (item) => {
        setEditingItem({
            _id: item._id,
            name: item.name,
            notes: sanitizeOnBlur(item.notes ?? ""),
            location: sanitizeOnBlur(item.location ?? ""),
        })
    }

    const handleEditFieldChange = (field, value) => {
        const sanitized = sanitizeOnChange(value)
        setEditingItem((prev) => (prev ? { ...prev, [field]: sanitized } : prev))
    }

    const handleEditFieldBlur = (field, value) => {
        const trimmedValue = sanitizeOnBlur(value)
        setEditingItem((prev) => (prev ? { ...prev, [field]: trimmedValue } : prev))
    }

    const handleCancelEdit = () => setEditingItem(null)

    const handleSaveEdit = async () => {
        if (!editingItem || isEditingSaving) return

        setIsEditingSaving(true)
        const payload = {
            notes: sanitizeOnBlur(editingItem.notes ?? ""),
            location: sanitizeOnBlur(editingItem.location ?? ""),
        }

        try {
            const updated = toEditableItem(await updateItem(editingItem._id, payload))
            setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)))
            setBaselineItems((prev) =>
                prev.map((it) => (it._id === updated._id ? { ...updated } : it)),
            )
            setEditingItem(null)
        } catch (e) {
            console.error("Error updating item:", e)
        } finally {
            setIsEditingSaving(false)
        }
    }

    const getDetailValue = (value) => {
        const sanitized = sanitizeOnBlur(value ?? "")
        return {
            text: sanitized.length > 0 ? sanitized : "—",
            isEmpty: sanitized.length === 0,
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

    const handleShowAll = () => {
        setItemView("all")
        setStatusFilter("all")
    }

    const filteredItems = items.filter((item) => {
        const matchesVisibility =
            itemView === "all" ? true : itemView === "hidden" ? item.hidden : !item.hidden

        if (!matchesVisibility) return false

        if (statusFilter === "need") return item.need !== false
        if (statusFilter === "have") return item.need === false

        return true
    })

    const isAllFilterActive = itemView === "all" && statusFilter === "all"

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
                        className={`${styles.segmentBtn} ${isAllFilterActive ? styles.active : ""}`}
                        onClick={handleShowAll}
                    >
                        All
                    </button>
                </div>
                <div className={styles.segment}>
                    <button
                        className={`${styles.segmentBtn} ${statusFilter === "need" ? styles.active : ""}`}
                        onClick={() =>
                            setStatusFilter((prev) => (prev === "need" ? "all" : "need"))
                        }
                    >
                        Need
                    </button>
                    <button
                        className={`${styles.segmentBtn} ${statusFilter === "have" ? styles.active : ""}`}
                        onClick={() =>
                            setStatusFilter((prev) => (prev === "have" ? "all" : "have"))
                        }
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
                        statusFilter,
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

                {filteredItems.map((item) => {
                    const notes = getDetailValue(item.notes)
                    const location = getDetailValue(item.location)

                    return (
                        <div key={item._id} className={styles.card}>
                            <div className={styles.cardInfo}>
                                <span className={styles.cardTitle}>{item.name}</span>
                                <div className={styles.cardDetails}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Location:</span>
                                        <span
                                            className={`${styles.detailValue} ${
                                                location.isEmpty ? styles.detailPlaceholder : ""
                                            }`}
                                        >
                                            {location.text}
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Notes:</span>
                                        <span
                                            className={`${styles.detailValue} ${
                                                notes.isEmpty ? styles.detailPlaceholder : ""
                                            }`}
                                        >
                                            {notes.text}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button
                                    className={styles.iconBtn}
                                    title="Edit details"
                                    onClick={() => openEditModal(item)}
                                >
                                    ✏️
                                </button>
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
                    )
                })}
            </main>

            <ConfirmModal
                open={Boolean(modalItemId)}
                styles={styles}
                message="Are you sure you want to permanently delete this item?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <EditItemModal
                open={Boolean(editingItem)}
                styles={styles}
                item={editingItem}
                onFieldChange={handleEditFieldChange}
                onFieldBlur={handleEditFieldBlur}
                onCancel={handleCancelEdit}
                onSave={handleSaveEdit}
                saving={isEditingSaving}
            />
        </div>
    )
}

export default CategoryPage
