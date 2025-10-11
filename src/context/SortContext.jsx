import React, { createContext, useContext, useMemo, useState } from "react"

const SortContext = createContext({
    sortMode: "alphabetical",
    setSortMode: () => {},
})

export function SortProvider({ children }) {
    const [sortMode, setSortMode] = useState("alphabetical")

    const value = useMemo(() => ({ sortMode, setSortMode }), [sortMode])

    return <SortContext.Provider value={value}>{children}</SortContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSort() {
    const context = useContext(SortContext)
    if (!context) {
        throw new Error("useSort must be used within a SortProvider")
    }
    return context
}
