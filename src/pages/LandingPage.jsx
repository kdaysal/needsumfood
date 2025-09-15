import React, { useState } from "react";
import styles from "./LandingPage.module.css";

function LandingPage() {
  const [categories, setCategories] = useState([
    "Groceries", "Toys", "Tools", "Bills", "Chores"
  ]);
  const [newCategory, setNewCategory] = useState("");

  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddCategory();
  };

  const handleRemoveCategory = (category) => {
    setCategories(categories.filter((cat) => cat !== category));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>NeedSumFood</h1>
      <h2 className={styles.subtitle}>Welcome, User!</h2>

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
      </div>

      {categories.map((cat) => (
        <div key={cat} className={styles.card} style={{ position: "relative" }}>
          {cat}
          <button
            onClick={() => handleRemoveCategory(cat)}
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
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default LandingPage;
