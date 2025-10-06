// src/utils/sanitizeInput.js
export const sanitizeOnChange = (value) => {
    if (typeof value !== "string") return value

    const withoutLeading = value.replace(/^\s+/, "")

    if (withoutLeading.trim().length === 0) {
        return ""
    }

    return withoutLeading
}

export const sanitizeOnBlur = (value) => {
    if (typeof value !== "string") return value

    return value.trim()
}
