import React, { useState } from "react";
import styles from "./LandingPage.module.css";

function LandingPage() {
  const [categories, setCategories] = useState([
    "Groceries", "Toys", "Tools", "Bills", "Chores"
  ]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>NeedSumFood</h1>
      <h2 className={styles.subtitle}>Welcome, User!</h2>

      {categories.map((cat) => (
        <div key={cat} className={styles.card}>
          {cat}
        </div>
      ))}
    </div>
  );
}

export default LandingPage;
