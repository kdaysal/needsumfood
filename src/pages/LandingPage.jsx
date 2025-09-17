import React, { useState, useEffect } from "react"
import styles from "./LandingPage.module.css"

function LandingPage() {
    const [categories, setCategories] = useState([])
    const [newCategory, setNewCategory] = useState("")
    const [hiddenCategories, setHiddenCategories] = useState([])
    const [modalCategory, setModalCategory] = useState(null)

    // Load categories from backend
    useEffect(() => {
        fetch("http://localhost:5001/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error("Error fetching categories:", err))
    }, [])

    // Add category
    const handleAddCategory = () => {
        if (newCategory.trim() === "") return
        fetch("http://localhost:5001/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newCategory }),
        })
            .then((res) => res.json())
            .then((cat) => {
                setCategories([...categories, cat])
                setNewCategory("")
            })
    }

    // Hide category (local only for now)
    const handleHideCategory = (id) => {
        setHiddenCategories([...hiddenCategories, id])
    }

    // Delete category (with backend call)
    const handleDeleteCategory = (id) => {
        setModalCategory(id)
    }

    const confirmDelete = () => {
        fetch(`http://localhost:5001/categories/${modalCategory}`, {
            method: "DELETE",
        }).then(() => {
            setCategories(categories.filter((cat) => cat._id !== modalCategory))
            setHiddenCategories(hiddenCategories.filter((id) => id !== modalCategory))
            setModalCategory(null)
        })
    }

    const cancelDelete = () => setModalCategory(null)

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>NeedSumFood</h1>
            <h2 className={styles.subtitle}>Welcome, User!</h2>

            {/* Input */}
            <div style={{ marginBottom: "1rem" }}>
                <input
                    type="text"
                    placeholder="New category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                    style={{ padding: "0.5rem", marginRight: "0.5rem", width: "200px" }}
                />
                <button onClick={handleAddCategory} style={{ padding: "0.5rem 1rem" }}>
                    Add
                </button>
            </div>

            {/* Categories */}
            {categories
                .filter((cat) => !hiddenCategories.includes(cat._id))
                .map((cat) => (
                    <div key={cat._id} className={styles.card} style={{ position: "relative" }}>
                        {cat.name}
                        <button
                            onClick={() => handleHideCategory(cat._id)}
                            style={{ position: "absolute", top: "5px", right: "35px" }}
                        >
                            👁
                        </button>
                        <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            style={{ position: "absolute", top: "5px", right: "10px", color: "red" }}
                        >
                            ×
                        </button>
                    </div>
                ))}

            {/* Delete confirmation modal */}
            {modalCategory && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div style={{ background: "white", padding: "2rem", borderRadius: "0.5rem" }}>
                        <p>Are you sure you want to delete this category?</p>
                        <button onClick={confirmDelete} style={{ marginRight: "1rem" }}>
                            Yes
                        </button>
                        <button onClick={cancelDelete}>No</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LandingPage
