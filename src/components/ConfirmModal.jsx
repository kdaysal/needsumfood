// src/components/ConfirmModal.jsx
import React from "react"
import ReactDOM from "react-dom"
import useLockBodyScroll from "../hooks/useLockBodyScroll"

function ConfirmModal({
    open,
    styles,
    message,
    confirmLabel = "Yes",
    cancelLabel = "No",
    onConfirm,
    onCancel,
}) {
    useLockBodyScroll(open)

    if (!open) return null

    const modalContent = (
        <div className={styles.modalBackdrop}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <p>{message}</p>
                <div className={styles.modalActions}>
                    <button type="button" className={styles.confirm} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                    <button type="button" className={styles.cancel} onClick={onCancel}>
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    )

    if (typeof document === "undefined") {
        return modalContent
    }

    return ReactDOM.createPortal(modalContent, document.body)
}

export default ConfirmModal
