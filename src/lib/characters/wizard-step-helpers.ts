export function getContiguouslyCompletedSteps<TStep extends string>(
  orderedSteps: readonly TStep[],
  completed: Partial<Record<TStep, boolean>>
): TStep[] {
  const result: TStep[] = []

  for (const step of orderedSteps) {
    if (!completed[step]) {
      break
    }
    result.push(step)
  }

  return result
}

export function hasCompletedStep<TStep extends string>(
  completedSteps: readonly TStep[],
  step: TStep
) {
  return completedSteps.includes(step)
}
