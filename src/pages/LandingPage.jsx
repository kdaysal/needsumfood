// src/pages/LandingPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { Link, useBlocker } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api"
import ConfirmModal from "../components/ConfirmModal"

function LandingPage() {
    const [view, setView] = useState("visible") // "visible" | "hidden" | "all"
    const [categories, setCategories] = useState([])
    the[(newCategory, setNewCategory)] = useState("")
    const [modalCategoryId, setModalCategoryId] = useState(null)
    const [loading, setLoading] = useState(false)

    const hasUnsavedChanges = useMemo(() => newCategory.trim().length > 0, [newCategory])
    const { state: blockerState, proceed, reset } = useBlocker(hasUnsavedChanges)

    useEffect(() => {
        if (blockerState !== "blocked") return

        const shouldLeave = window.confirm("You have unsaved changes. Are you sure you want to leave this page?")

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
                    onChange={(e) => setNewCategory(e.target.value)}
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

                {categories.map((cat) => (
                    <Link key={cat._id} to={`/category/${cat._id}`} className={styles.card}>
                        <span className={styles.cardTitle}>{cat.name}</span>
                        <div className={styles.actions}>
                            {cat.hidden ? (
                                <button
                                    className={styles.iconBtn}
                                    title="Show"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleShow(cat._id)
                                    }}
                                >
                                    👀
                                </button>
                            ) : (
                                <button
                                    className={styles.iconBtn}
                                    title="Hide"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleHide(cat._id)
                                    }}
                                >
                                    🙈
                                </button>
                            )}
                            <button
                                className={`${styles.iconBtn} ${styles.danger}`}
                                title="Delete"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete(cat._id)
                                }}
                            >
                                🗑️
                            </button>
                        </div>
                    </Link>
                ))}
            </main>

            <ConfirmModal
                open={Boolean(modalCategoryId)}
                styles={styles}
                message="Are you sure you want to permanently delete this category?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    )
}

export default LandingPage
