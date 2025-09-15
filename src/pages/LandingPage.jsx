import React, { useState } from "react";
import styles from "./LandingPage.module.css";

function LandingPage() {
  const [categories, setCategories] = useState([
    "Groceries", "Toys", "Tools", "Bills", "Chores"
  ]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [modalCategory, setModalCategory] = useState(null);

  // Add category
  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddCategory();
  };

  // Hide category
  const handleHideCategory = (category) => {
    setHiddenCategories([...hiddenCategories, category]);
  };

  // Show all hidden categories
  const handleShowAll = () => {
    setHiddenCategories([]);
  };

  // Delete category
  const handleDeleteCategory = (category) => {
    setModalCategory(category);
  };

  const confirmDelete = () => {
    setCategories(categories.filter((cat) => cat !== modalCategory));
    setHiddenCategories(hiddenCategories.filter((cat) => cat !== modalCategory));
    setModalCategory(null);
  };

  const cancelDelete = () => {
    setModalCategory(null);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>NeedSumFood</h1>
      <h2 className={styles.subtitle}>Welcome, User!</h2>

      {/* Input for new category */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="New category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ padding: "0.5rem", marginRight: "0.5rem", width: "200px" }}
        />
        <button onClick={handleAddCategory} style={{ padding: "0.5rem 1rem" }}>
          Add
        </button>
        {hiddenCategories.length > 0 && (
          <button
            onClick={handleShowAll}
            style={{ padding: "0.5rem 1rem", marginLeft: "1rem" }}
          >
            Show All Categories
          </button>
        )}
      </div>

      {/* Category cards */}
      {categories
        .filter((cat) => !hiddenCategories.includes(cat))
        .map((cat) => (
          <div key={cat} className={styles.card} style={{ position: "relative" }}>
            {cat}
            {/* Hide button */}
            <button
              onClick={() => handleHideCategory(cat)}
              style={{
                position: "absolute",
                top: "5px",
                right: "35px",
                background: "transparent",
                border: "none",
                color: "gray",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              title="Hide"
            >
              👁
            </button>

            {/* Delete button */}
            <button
              onClick={() => handleDeleteCategory(cat)}
              style={{
                position: "absolute",
                top: "5px",
                right: "10px",
                background: "transparent",
                border: "none",
                color: "red",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              title="Delete"
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
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "0.5rem",
              textAlign: "center",
              minWidth: "300px",
            }}
          >
            <p>Are you sure you want to permanently delete "{modalCategory}"?</p>
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={confirmDelete}
                style={{ marginRight: "1rem", padding: "0.5rem 1rem" }}
              >
                Yes
              </button>
              <button onClick={cancelDelete} style={{ padding: "0.5rem 1rem" }}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
