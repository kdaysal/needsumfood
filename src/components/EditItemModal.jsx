import React from "react"

const EditItemModal = ({
    open,
    styles,
    item,
    onFieldChange,
    onFieldBlur,
    onSave,
    onCancel,
    saving,
}) => {
    if (!open || !item) return null

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.editModal}`} role="dialog" aria-modal="true">
                <h2 className={styles.modalTitle}>Edit {item.name}</h2>
                <div className={styles.modalContent}>
                    <label className={styles.modalLabel} htmlFor="edit-notes">
                        Notes
                    </label>
                    <textarea
                        id="edit-notes"
                        className={`${styles.input} ${styles.modalTextarea}`}
                        placeholder="Add notes"
                        value={item.notes ?? ""}
                        onChange={(e) => onFieldChange("notes", e.target.value)}
                        onBlur={(e) => onFieldBlur("notes", e.target.value)}
                    />
                    <label className={styles.modalLabel} htmlFor="edit-location">
                        Location
                    </label>
                    <input
                        id="edit-location"
                        className={`${styles.input} ${styles.modalInput}`}
                        type="text"
                        placeholder="Add a location"
                        value={item.location ?? ""}
                        onChange={(e) => onFieldChange("location", e.target.value)}
                        onBlur={(e) => onFieldBlur("location", e.target.value)}
                    />
                </div>
                <div className={styles.modalActionsEnd}>
                    <button type="button" className={styles.cancel} onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.saveButton}
                        onClick={onSave}
                        disabled={saving}
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditItemModal
