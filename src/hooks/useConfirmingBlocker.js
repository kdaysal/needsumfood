import { useEffect } from "react"
import { useBlocker } from "react-router-dom"

export default function useConfirmingBlocker(
    when,
    message = "You have unsaved changes. Are you sure you want to leave this page?",
) {
    const blocker = useBlocker(when)
    const { state, proceed, reset } = blocker

    useEffect(() => {
        if (state !== "blocked") return

        const shouldLeave = window.confirm(message)

        if (shouldLeave) {
            proceed?.()
        } else {
            reset?.()
        }
    }, [state, proceed, reset, message])

    useEffect(() => {
        if (!when && state === "blocked") {
            reset?.()
        }
    }, [when, state, reset])

    return blocker
}
