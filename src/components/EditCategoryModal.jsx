// src/components/EditCategoryModal.jsx
import React from "react"

const EditCategoryModal = ({
    open,
    styles,
    category,
    onNameChange,
    onNameBlur,
    onSave,
    onCancel,
    saving,
}) => {
    if (!open || !category) return null

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.editModal}`} role="dialog" aria-modal="true">
                <h2 className={styles.modalTitle}>Edit Category</h2>
                <div className={styles.modalContent}>
                    <label className={styles.modalLabel} htmlFor="edit-category-name">
                        Name
                    </label>
                    <input
                        id="edit-category-name"
                        className={`${styles.input} ${styles.modalInput}`}
                        type="text"
                        placeholder="Category name"
                        value={category.name ?? ""}
                        onChange={(e) => onNameChange(e.target.value)}
                        onBlur={(e) => onNameBlur(e.target.value)}
                    />
                </div>
                <div className={styles.modalActionsEnd}>
                    <button type="button" className={styles.cancel} onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                    <button type="button" className={styles.saveButton} onClick={onSave} disabled={saving}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditCategoryModal
