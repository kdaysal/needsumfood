// src/api.js
const BASE_URL = "http://localhost:5001";

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