import React, { useEffect, useRef, useState } from "react"

function SortMenu({ styles, sortMode, onChange }) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!menuRef.current || menuRef.current.contains(event.target)) {
                return
            }
            setOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false)
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    const handleOptionSelect = (mode) => {
        onChange(mode)
        setOpen(false)
    }

    return (
        <div className={styles.sortMenu} ref={menuRef}>
            <button
                type="button"
                className={`${styles.hamburgerButton} ${open ? styles.hamburgerButtonActive : ""}`}
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Open sort options"
            >
                <span className={styles.srOnly}>Toggle sort options</span>
                <span className={styles.hamburgerLine} aria-hidden="true" />
                <span className={styles.hamburgerLine} aria-hidden="true" />
                <span className={styles.hamburgerLine} aria-hidden="true" />
            </button>

            <div
                className={`${styles.sortDropdown} ${open ? styles.sortDropdownOpen : ""}`}
                role="menu"
            >
                <p className={styles.sortHeading}>Sort cards</p>
                <button
                    type="button"
                    className={`${styles.sortOption} ${
                        sortMode === "alphabetical" ? styles.sortOptionActive : ""
                    }`}
                    onClick={() => handleOptionSelect("alphabetical")}
                    role="menuitemradio"
                    aria-checked={sortMode === "alphabetical"}
                >
                    <span>Alphabetical</span>
                    {sortMode === "alphabetical" && (
                        <span className={styles.sortOptionCheck} aria-hidden="true">
                            ✓
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles.sortOption} ${sortMode === "custom" ? styles.sortOptionActive : ""}`}
                    onClick={() => handleOptionSelect("custom")}
                    role="menuitemradio"
                    aria-checked={sortMode === "custom"}
                >
                    <span>Custom</span>
                    {sortMode === "custom" && (
                        <span className={styles.sortOptionCheck} aria-hidden="true">
                            ✓
                        </span>
                    )}
                </button>
            </div>
        </div>
    )
}

export default SortMenu
