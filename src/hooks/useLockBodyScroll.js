import { useEffect } from "react"

const useLockBodyScroll = (locked) => {
    useEffect(() => {
        if (typeof document === "undefined") return undefined
        if (!locked) return undefined

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [locked])
}

export default useLockBodyScroll
