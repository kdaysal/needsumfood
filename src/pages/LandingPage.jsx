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
        <div key={cat} className={styles.card}>
          {cat}
        </div>
      ))}
    </div>
  );
}

export default LandingPage;
