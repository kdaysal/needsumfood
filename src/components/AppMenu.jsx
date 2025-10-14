// src/components/AppMenu.jsx
import React, { useEffect, useRef, useState } from "react"

function AppMenu({ styles, sortMode, onSortChange, onLogout }) {
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

    const handleSortOption = (mode) => {
        if (typeof onSortChange === "function") {
            onSortChange(mode)
        }
        setOpen(false)
    }

    const handleLogout = () => {
        if (typeof onLogout === "function") {
            onLogout()
        }
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
                aria-label="Open application menu"
            >
                <span className={styles.srOnly}>Toggle menu</span>
                <span className={styles.hamburgerLine} aria-hidden="true" />
                <span className={styles.hamburgerLine} aria-hidden="true" />
                <span className={styles.hamburgerLine} aria-hidden="true" />
            </button>

            <div className={`${styles.sortDropdown} ${open ? styles.sortDropdownOpen : ""}`} role="menu">
                <p className={styles.sortHeading}>Menu</p>
                <div className={styles.menuSection} role="group" aria-label="Sort cards">
                    <p className={styles.menuSectionTitle}>Sort cards</p>
                    <button
                        type="button"
                        className={`${styles.sortOption} ${
                            sortMode === "alphabetical" ? styles.sortOptionActive : ""
                        }`}
                        onClick={() => handleSortOption("alphabetical")}
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
                        onClick={() => handleSortOption("custom")}
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

                <div className={styles.menuDivider} role="separator" />

                <button type="button" className={styles.logoutButton} onClick={handleLogout} role="menuitem">
                    Log out
                </button>
            </div>
        </div>
    )
}

AppMenu.defaultProps = {
    sortMode: "alphabetical",
    onSortChange: undefined,
    onLogout: undefined,
}

export default AppMenu
