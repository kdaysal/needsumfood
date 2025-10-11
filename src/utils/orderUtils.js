export function mergeOrder(prevOrder = [], allIds = []) {
    const seen = new Set()
    const merged = []

    for (const id of prevOrder) {
        if (!seen.has(id) && allIds.includes(id)) {
            merged.push(id)
            seen.add(id)
        }
    }

    for (const id of allIds) {
        if (!seen.has(id)) {
            merged.push(id)
            seen.add(id)
        }
    }

    return merged
}

export function reorderWithinList(prevOrder = [], allIds = [], displayedIds = [], targetId, direction) {
    if (!targetId || !allIds.includes(targetId)) {
        return mergeOrder(prevOrder, allIds)
    }

    const normalizedOrder = mergeOrder(prevOrder, allIds)
    const displaySet = new Set(displayedIds)
    const visibleOrder = normalizedOrder.filter((id) => displaySet.has(id))

    for (const id of displayedIds) {
        if (!visibleOrder.includes(id)) {
            visibleOrder.push(id)
        }
    }

    const currentIndex = visibleOrder.indexOf(targetId)
    if (currentIndex === -1) {
        return normalizedOrder
    }

    const step = direction === "up" ? -1 : 1
    const swapIndex = currentIndex + step
    if (swapIndex < 0 || swapIndex >= visibleOrder.length) {
        return normalizedOrder
    }

    const updatedVisible = [...visibleOrder]
    ;[updatedVisible[currentIndex], updatedVisible[swapIndex]] = [
        updatedVisible[swapIndex],
        updatedVisible[currentIndex],
    ]

    const updatedVisibleSet = new Set(updatedVisible)
    const mergedOrder = []
    let pointer = 0

    for (const id of normalizedOrder) {
        if (updatedVisibleSet.has(id)) {
            mergedOrder.push(updatedVisible[pointer])
            pointer += 1
        } else {
            mergedOrder.push(id)
        }
    }

    while (pointer < updatedVisible.length) {
        mergedOrder.push(updatedVisible[pointer])
        pointer += 1
    }

    return mergedOrder
}
