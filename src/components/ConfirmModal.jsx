// src/components/ConfirmModal.jsx
import React from "react"

function ConfirmModal({
    open,
    styles,
    message,
    confirmLabel = "Yes",
    cancelLabel = "No",
    onConfirm,
    onCancel,
}) {
    if (!open) return null

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <p>{message}</p>
                <div className={styles.modalActions}>
                    <button className={styles.confirm} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                    <button className={styles.cancel} onClick={onCancel}>
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal