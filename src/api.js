// src/api.js
const BASE_URL =
    import.meta.env.VITE_API_BASE || "http://localhost:5001";

/* ----------------- Category APIs ----------------- */

// Fetch categories with optional view filter: "visible", "hidden", "all"
export async function fetchCategories(view = "visible") {
    const res = await fetch(`${BASE_URL}/categories?view=${view}`);
    if (!res.ok) throw new Error("Failed to load categories");
    return res.json();
}

// Create a new category
export async function createCategory(name) {
    const res = await fetch(`${BASE_URL}/categories`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name
        }),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
}

// Update an existing category (e.g., hide/show or rename)
export async function updateCategory(id, payload) {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
}

// Delete a category
export async function deleteCategory(id) {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete category");
    return res.json();
}

/* ----------------- Item APIs ----------------- */

// Fetch items for a category
export async function fetchItems(categoryId, view = "visible") {
    const res = await fetch(`${BASE_URL}/categories/${categoryId}/items?view=${view}`);
    if (!res.ok) throw new Error("Failed to load items");
    return res.json();
}

// Create a new item in a category
export async function createItem(categoryId, name) {
    const res = await fetch(`${BASE_URL}/categories/${categoryId}/items`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name
        }),
    });
    if (!res.ok) throw new Error("Failed to create item");
    return res.json();
}

// Update an item (e.g., hide/show, notes, location, need toggle)
export async function updateItem(itemId, payload) {
    const res = await fetch(`${BASE_URL}/items/${itemId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
}

// Delete an item
export async function deleteItem(itemId) {
    const res = await fetch(`${BASE_URL}/items/${itemId}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete item");
    return res.json();
}