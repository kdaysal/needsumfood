// src/pages/CategoryPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchItems, createItem, updateItem, deleteItem } from "../api"
import ConfirmModal from "../components/ConfirmModal"
import EditItemModal from "../components/EditItemModal"
import useConfirmingBlocker from "../hooks/useConfirmingBlocker"
import { sanitizeOnBlur, sanitizeOnChange } from "../utils/sanitizeInput"
import AppMenu from "../components/AppMenu"
import { useAuth } from "../context/AuthContext.jsx"
import { mergeOrder, reorderWithinList } from "../utils/orderUtils"

const toEditableItem = (item) => ({
    ...item,
    name:
        typeof item.name === "string"
            ? sanitizeOnBlur(item.name)
            : "",
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
    const navigate = useNavigate()
    const { user, logout } = useAuth()
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
    const [sortMode, setSortMode] = useState("alphabetical")
    const [itemCustomOrder, setItemCustomOrder] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const searchInputRef = useRef(null)

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
                setItemCustomOrder(normalizedItems.map((item) => item._id))
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
            setItems((prev) => {
                const updated = [...prev, created]
                setItemCustomOrder((prevOrder) => {
                    const allIds = updated.map((item) => item._id)
                    const normalized = mergeOrder(prevOrder, allIds).filter((itemId) => itemId !== created._id)
                    if (sortMode === "custom") {
                        return [created._id, ...normalized]
                    }
                    return [...normalized, created._id]
                })
                return updated
            })
            setBaselineItems((prev) => [...prev, { ...created }])
            setNewItem("")
            openEditModal(created)
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
        const nextNeed = !need

        // Optimistically update the UI so the change is reflected immediately
        setItems((prev) => prev.map((it) => (it._id === itemId ? { ...it, need: nextNeed } : it)))

        try {
            const updated = toEditableItem(await updateItem(itemId, { need: nextNeed }))
            setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)))
            setBaselineItems((prev) => prev.map((it) => (it._id === itemId ? { ...updated } : it)))
        } catch (e) {
            // Revert the optimistic update if the request fails
            setItems((prev) => prev.map((it) => (it._id === itemId ? { ...it, need } : it)))
            console.error("Error toggling need:", e)
        }
    }

    const openEditModal = (item) => {
        setEditingItem({
            _id: item._id,
            name: sanitizeOnBlur(item.name ?? ""),
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
        const sanitizedName = sanitizeOnBlur(editingItem.name ?? "")
        const payload = {
            name: sanitizedName,
            notes: sanitizeOnBlur(editingItem.notes ?? ""),
            location: sanitizeOnBlur(editingItem.location ?? ""),
        }

        if (!payload.name) {
            setIsEditingSaving(false)
            return
        }

        try {
            const updated = toEditableItem(await updateItem(editingItem._id, payload))
            setItems((prev) =>
                prev.map((it) =>
                    it._id === updated._id
                        ? { ...updated, name: sanitizedName }
                        : it,
                ),
            )
            setBaselineItems((prev) =>
                prev.map((it) => {
                    const updatedItem = it._id === updated._id ? { ...updated } : it
                    return updatedItem
                }),
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
            setItemCustomOrder((prev) => prev.filter((orderId) => orderId !== itemId))
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

    const normalizedSearch = searchTerm.trim().toLowerCase()

    const filteredItems = items.filter((item) => {
        const matchesVisibility =
            itemView === "all" ? true : itemView === "hidden" ? item.hidden : !item.hidden

        if (!matchesVisibility) return false

        if (statusFilter === "need") return item.need !== false
        if (statusFilter === "have") return item.need === false

        if (normalizedSearch.length > 0) {
            return (item.name ?? "").toLowerCase().includes(normalizedSearch)
        }

        return true
    })

    const sortedItems = useMemo(() => {
        if (sortMode === "alphabetical") {
            return [...items].sort((a, b) =>
                (a.name ?? "").localeCompare(b.name ?? "", undefined, {
                    sensitivity: "base",
                }),
            )
        }

        const itemMap = new Map(items.map((item) => [item._id, item]))
        const order = itemCustomOrder.length > 0 ? itemCustomOrder : items.map((item) => item._id)
        return order
            .map((itemId) => itemMap.get(itemId))
            .filter((item) => Boolean(item))
    }, [itemCustomOrder, items, sortMode])

    const filteredSortedItems = useMemo(() => {
        const filteredSet = new Set(filteredItems.map((item) => item._id))
        return sortedItems.filter((item) => filteredSet.has(item._id))
    }, [filteredItems, sortedItems])

    const isAllFilterActive = itemView === "all" && statusFilter === "all"

    const handleSortModeChange = useCallback(
        (mode) => {
            setSortMode(mode)
            if (mode === "custom") {
                setItemCustomOrder((prev) => mergeOrder(prev, items.map((item) => item._id)))
            }
        },
        [items],
    )

    const handleLogout = useCallback(() => {
        logout()
        navigate("/", { replace: true })
    }, [logout, navigate])

    const displayName = user?.username ?? "Guest User"

    const moveItem = (itemId, direction) => {
        if (sortMode !== "custom") return

        const displayedIds = filteredSortedItems.map((item) => item._id)
        setItemCustomOrder((prev) =>
            reorderWithinList(
                prev,
                items.map((item) => item._id),
                displayedIds,
                itemId,
                direction,
            ),
        )
    }

    const activeSortLabel = sortMode === "alphabetical" ? "Alpha" : "Custom"

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isSearchOpen])

    const toggleSearch = () => {
        setIsSearchOpen((prev) => !prev)
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.topBar}>
                    <h1 className={styles.brand}>NeedSumFood</h1>
                    <div className={styles.topBarControls}>
                        <p className={styles.sortLabel}>{activeSortLabel}</p>
                        <AppMenu
                            styles={styles}
                            sortMode={sortMode}
                            onSortChange={handleSortModeChange}
                            onLogout={handleLogout}
                        />
                        <div
                            className={`${styles.searchToggle} ${
                                isSearchOpen ? styles.searchToggleOpen : ""
                            }`}
                        >
                            <button
                                type="button"
                                className={styles.searchButton}
                                aria-expanded={isSearchOpen}
                                aria-controls="item-search"
                                onClick={toggleSearch}
                            >
                                <span className={styles.srOnly}>
                                    {isSearchOpen ? "Hide search" : "Show search"}
                                </span>
                                <span aria-hidden="true" className={styles.searchIcon}>
                                    🔍
                                </span>
                            </button>
                            <div className={styles.searchField}>
                                <label className={styles.srOnly} htmlFor="item-search">
                                    Search items
                                </label>
                                <input
                                    id="item-search"
                                    type="search"
                                    ref={searchInputRef}
                                    className={styles.searchInput}
                                    placeholder="Search items"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.secondaryRow}>
                    <Link to="/landing" className={styles.backLink}>
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
                <p className={styles.subtitle}>Welcome, {displayName}!</p>
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

            {/* List */}
            <main className={styles.list}>
                {loading && <div className={styles.loading}>Loading…</div>}
                {!loading && items.length === 0 && (
                    <div className={styles.empty}>No items yet — add some to get started!</div>
                )}
                {!loading && items.length > 0 && filteredSortedItems.length === 0 && (
                    <div className={styles.empty}>No items match your current filters.</div>
                )}

                {filteredSortedItems.map((item, index) => {
                    const notes = getDetailValue(item.notes)
                    const location = getDetailValue(item.location)

                    return (
                        <div key={item._id} className={styles.card}>
                            {sortMode === "custom" && (
                                <div className={styles.reorderControls}>
                                    <button
                                        type="button"
                                        className={styles.reorderBtn}
                                        onClick={() => moveItem(item._id, "up")}
                                        disabled={index === 0}
                                        aria-label={`Move ${item.name || "item"} up`}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.reorderBtn}
                                        onClick={() => moveItem(item._id, "down")}
                                        disabled={index === filteredSortedItems.length - 1}
                                        aria-label={`Move ${item.name || "item"} down`}
                                    >
                                        ↓
                                    </button>
                                </div>
                            )}
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
                                    {item.hidden ? "🙈" : "👀"}
                                </button>
                                <button
                                    className={styles.iconBtn}
                                    title={item.need !== false ? "Mark as Have" : "Mark as Need"}
                                    onClick={() => handleToggleNeed(item._id, item.need !== false)}
                                >
                                    {item.need !== false ? "🛒" : "✅"}
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
