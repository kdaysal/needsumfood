// src/pages/LandingPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api"
import ConfirmModal from "../components/ConfirmModal"
import EditCategoryModal from "../components/EditCategoryModal"
import useConfirmingBlocker from "../hooks/useConfirmingBlocker"
import { sanitizeOnBlur, sanitizeOnChange } from "../utils/sanitizeInput"

function LandingPage() {
    const [view, setView] = useState("visible") // "visible" | "hidden" | "all"
    const [categories, setCategories] = useState([])
    const [newCategory, setNewCategory] = useState("")
    const [modalCategoryId, setModalCategoryId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [isEditingSaving, setIsEditingSaving] = useState(false)

    const hasUnsavedChanges = useMemo(() => newCategory.trim().length > 0, [newCategory])
    useConfirmingBlocker(hasUnsavedChanges)

    // Load categories whenever view changes
    useEffect(() => {
        ;(async () => {
            setLoading(true)
            try {
                const data = await fetchCategories(view)
                setCategories(data)
            } catch (e) {
                console.error("Error fetching categories:", e)
            } finally {
                setLoading(false)
            }
        })()
    }, [view])

    // Add new category
    const handleAddCategory = async () => {
        const name = newCategory.trim()
        if (!name) return

        if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
            setNewCategory("")
            return
        }

        try {
            const created = await createCategory(name)
            if (view !== "hidden") setCategories((prev) => [...prev, created])
            setNewCategory("")
        } catch (e) {
            console.error("Error adding category:", e)
        }
    }

    // Hide a category
    const handleHide = async (id) => {
        try {
            await updateCategory(id, { hidden: true })
            const data = await fetchCategories(view)
            setCategories(data)
        } catch (err) {
            console.error("Error hiding category:", err)
        }
    }

    // Show category
    const handleShow = async (id) => {
        try {
            await updateCategory(id, { hidden: false })
            const data = await fetchCategories(view)
            setCategories(data)
        } catch (e) {
            console.error("Error showing category:", e)
        }
    }

    // Delete with confirm
    const handleDelete = (id) => setModalCategoryId(id)
    const confirmDelete = async () => {
        const id = modalCategoryId
        setModalCategoryId(null)
        try {
            await deleteCategory(id)
            const data = await fetchCategories(view)
            setCategories(data)
        } catch (e) {
            console.error("Error deleting category:", e)
        }
    }
    const cancelDelete = () => setModalCategoryId(null)

    const openEditCategory = (category) => {
        setEditingCategory({
            _id: category._id,
            name: sanitizeOnBlur(category.name ?? ""),
        })
    }

    const handleEditCategoryChange = (value) => {
        const sanitized = sanitizeOnChange(value)
        setEditingCategory((prev) => (prev ? { ...prev, name: sanitized } : prev))
    }

    const handleEditCategoryBlur = (value) => {
        const trimmed = sanitizeOnBlur(value)
        setEditingCategory((prev) => (prev ? { ...prev, name: trimmed } : prev))
    }

    const handleCancelEditCategory = () => setEditingCategory(null)

    const handleSaveEditCategory = async () => {
        if (!editingCategory || isEditingSaving) return

        const trimmedName = sanitizeOnBlur(editingCategory.name ?? "")
        if (!trimmedName) return

        const duplicate = categories.some(
            (cat) => cat._id !== editingCategory._id && cat.name.toLowerCase() === trimmedName.toLowerCase(),
        )
        if (duplicate) return

        setIsEditingSaving(true)
        try {
            const updated = await updateCategory(editingCategory._id, { name: trimmedName })
            setCategories((prev) =>
                prev.map((cat) =>
                    cat._id === updated._id
                        ? { ...cat, ...updated, name: trimmedName }
                        : cat,
                ),
            )
            setEditingCategory(null)
        } catch (e) {
            console.error("Error updating category:", e)
        } finally {
            setIsEditingSaving(false)
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>NeedSumFood</h1>
                    <p className={styles.subtitle}>Welcome, User!</p>
                </div>

                {/* View toggle */}
                <div className={styles.segment}>
                    <button
                        className={`${styles.segmentBtn} ${view === "visible" ? styles.active : ""}`}
                        onClick={() => setView("visible")}
                    >
                        Visible
                    </button>
                    <button
                        className={`${styles.segmentBtn} ${view === "hidden" ? styles.active : ""}`}
                        onClick={() => setView("hidden")}
                    >
                        Hidden
                    </button>
                    <button
                        className={`${styles.segmentBtn} ${view === "all" ? styles.active : ""}`}
                        onClick={() => setView("all")}
                    >
                        All
                    </button>
                </div>
            </header>

            {/* Add input */}
            <div className={styles.addBar}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="New category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(sanitizeOnChange(e.target.value))}
                    onBlur={() => setNewCategory((prev) => sanitizeOnBlur(prev))}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <button className={styles.addBtn} onClick={handleAddCategory}>
                    Add
                </button>
            </div>

            {/* List */}
            <main className={styles.list}>
                {loading && <div className={styles.loading}>Loading…</div>}
                {!loading && categories.length === 0 && <div className={styles.empty}>No categories in this view.</div>}

                {categories.map((cat) => {
                    const titleId = `category-${cat._id}-title`

                    return (
                        <div key={cat._id} className={styles.card}>
                            <Link
                                to={`/category/${cat._id}`}
                                aria-labelledby={titleId}
                                className={styles.cardBody}
                            >
                                <span id={titleId} className={styles.cardTitle}>
                                    {cat.name}
                                </span>
                            </Link>
                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    title="Edit"
                                    onClick={() => openEditCategory(cat)}
                                >
                                    ✏️
                                </button>
                                {cat.hidden ? (
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        title="Show"
                                        onClick={() => handleShow(cat._id)}
                                    >
                                        👀
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        title="Hide"
                                        onClick={() => handleHide(cat._id)}
                                    >
                                        🙈
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={`${styles.iconBtn} ${styles.danger}`}
                                    title="Delete"
                                    onClick={() => handleDelete(cat._id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    )
                })}
            </main>

            <ConfirmModal
                open={Boolean(modalCategoryId)}
                styles={styles}
                message="Are you sure you want to permanently delete this category?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <EditCategoryModal
                open={Boolean(editingCategory)}
                styles={styles}
                category={editingCategory}
                onNameChange={handleEditCategoryChange}
                onNameBlur={handleEditCategoryBlur}
                onCancel={handleCancelEditCategory}
                onSave={handleSaveEditCategory}
                saving={isEditingSaving}
            />
        </div>
    )
}

export default LandingPage
