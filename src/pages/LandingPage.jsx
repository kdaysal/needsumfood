// src/pages/LandingPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { Link, unstable_useBlocker } from "react-router-dom"
import styles from "./LandingPage.module.css"
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api"
import ConfirmModal from "../components/ConfirmModal"

function LandingPage() {
    const [view, setView] = useState("visible") // "visible" | "hidden" | "all"
    const [categories, setCategories] = useState([])
    const [draftCategories, setDraftCategories] = useState({})
    const [dirtyCategoryIds, setDirtyCategoryIds] = useState(() => new Set())
    const [newCategory, setNewCategory] = useState("")
    const [modalCategoryId, setModalCategoryId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)

    const hasUnsavedChanges = useMemo(() => dirtyCategoryIds.size > 0, [dirtyCategoryIds])
    const blocker = unstable_useBlocker(hasUnsavedChanges)

    const toDraftMap = (list) =>
        list.reduce((acc, item) => {
            acc[item._id] = { ...item }
            return acc
        }, {})

    // Load categories whenever view changes
    useEffect(() => {
        ;(async () => {
            setLoading(true)
            try {
                const data = await fetchCategories(view)
                setCategories(data)
                setDraftCategories((prev) => ({ ...prev, ...toDraftMap(data) }))
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
            setDraftCategories((prev) => ({ ...prev, [created._id]: { ...created } }))
            setNewCategory("")
        } catch (e) {
            console.error("Error adding category:", e)
        }
    }

    // Hide a category
    const handleHide = async (id) => {
        try {
            const updated = await updateCategory(id, { hidden: true })
            setCategories((prev) =>
                prev
                    .map((cat) => (cat._id === id ? updated : cat))
                    .filter((cat) => {
                        if (view === "visible") return !cat.hidden
                        if (view === "hidden") return cat.hidden
                        return true
                    })
            )
            setDraftCategories((prev) => {
                const existing = prev[id] ?? updated
                return {
                    ...prev,
                    [id]: { ...updated, ...existing, hidden: updated.hidden },
                }
            })
        } catch (err) {
            console.error("Error hiding category:", err)
        }
    }

    // Show category
    const handleShow = async (id) => {
        try {
            const updated = await updateCategory(id, { hidden: false })
            setCategories((prev) =>
                prev
                    .map((cat) => (cat._id === id ? updated : cat))
                    .filter((cat) => {
                        if (view === "visible") return !cat.hidden
                        if (view === "hidden") return cat.hidden
                        return true
                    })
            )
            setDraftCategories((prev) => {
                const existing = prev[id] ?? updated
                return {
                    ...prev,
                    [id]: { ...updated, ...existing, hidden: updated.hidden },
                }
            })
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
            setCategories((prev) => prev.filter((cat) => cat._id !== id))
            setDraftCategories((prev) => {
                const next = { ...prev }
                delete next[id]
                return next
            })
            setDirtyCategoryIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        } catch (e) {
            console.error("Error deleting category:", e)
        }
    }
    const cancelDelete = () => setModalCategoryId(null)

    const handleSave = async () => {
        const dirtyIds = Array.from(dirtyCategoryIds)
        if (dirtyIds.length === 0) return

        setSaving(true)
        setSaveError(null)

        const results = await Promise.allSettled(
            dirtyIds.map(async (categoryId) => {
                const draft = draftCategories[categoryId]
                const original = categories.find((cat) => cat._id === categoryId)
                if (!draft || !original) throw new Error("Category not found")

                const payload = Object.keys(draft).reduce((acc, key) => {
                    if (key === "_id") return acc
                    if (draft[key] !== original[key]) acc[key] = draft[key]
                    return acc
                }, {})

                if (Object.keys(payload).length === 0) {
                    return { ...original, ...draft }
                }

                return updateCategory(categoryId, payload)
            })
        )

        const updatedMap = {}
        const failedIds = []

        results.forEach((result, index) => {
            const categoryId = dirtyIds[index]
            if (result.status === "fulfilled") {
                updatedMap[categoryId] = result.value
            } else {
                failedIds.push(categoryId)
            }
        })

        if (Object.keys(updatedMap).length > 0) {
            setCategories((prev) => prev.map((cat) => (updatedMap[cat._id] ? updatedMap[cat._id] : cat)))
            setDraftCategories((prev) => {
                const next = { ...prev }
                Object.entries(updatedMap).forEach(([categoryId, value]) => {
                    next[categoryId] = { ...value }
                })
                return next
            })
            setDirtyCategoryIds((prev) => {
                const next = new Set(prev)
                Object.keys(updatedMap).forEach((categoryId) => next.delete(categoryId))
                return next
            })
        }

        if (failedIds.length > 0) {
            setSaveError("Some categories failed to save. Please try again.")
        } else {
            setSaveError(null)
        }

        if (blocker.state === "blocked") {
            blocker.reset()
        }

        setSaving(false)
    }

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
                <div>
                    <h1 className={styles.title}>NeedSumFood</h1>
                    <p className={styles.subtitle}>Welcome, User!</p>
                </div>

                {/* Actions */}
                <div className={styles.headerRow}>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={!hasUnsavedChanges || saving}>
                        {saving ? "Saving…" : "Save"}
                    </button>
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
                </div>
                {saveError && <div className={styles.errorText}>{saveError}</div>}
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
