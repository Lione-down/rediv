export interface KeyedItem {
  id: string
}

export interface KeyedReconciliationPlan<T extends KeyedItem> {
  create: T[]
  remove: string[]
  update: T[]
}

export function planKeyedReconciliation<T extends KeyedItem>(
  existingIds: Iterable<string>,
  nextItems: readonly T[],
): KeyedReconciliationPlan<T> {
  const existing = new Set(existingIds)
  const nextIds = new Set<string>()
  const create: T[] = []
  const update: T[] = []

  for (const item of nextItems) {
    if (nextIds.has(item.id)) {
      throw new Error(`Duplicate renderer key: ${item.id}`)
    }
    nextIds.add(item.id)
    if (existing.has(item.id)) update.push(item)
    else create.push(item)
  }

  return {
    create,
    update,
    remove: [...existing].filter((id) => !nextIds.has(id)),
  }
}
