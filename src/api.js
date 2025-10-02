// src/api.js
const BASE_URL =
    import.meta.env.VITE_API_BASE || "http://localhost:5001";

// ===== Categories =====
export async function fetchCategories(view = "visible") {
    const res = await fetch(`${BASE_URL}/categories?view=${view}`);
    if (!res.ok) throw new Error("Failed to load categories");
    return res.json();
}

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

export async function deleteCategory(id) {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete category");
    return res.json();
}

// ===== Items =====
export async function fetchItems(categoryId) {
    const res = await fetch(`${BASE_URL}/items/${categoryId}`);
    if (!res.ok) throw new Error("Failed to load items");
    return res.json(); // returns { category, items }
}

export async function createItem(categoryId, name) {
    const res = await fetch(`${BASE_URL}/items/${categoryId}`, {
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

export async function updateItem(id, payload) {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
}

export async function deleteItem(id) {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete item");
    return res.json();
}