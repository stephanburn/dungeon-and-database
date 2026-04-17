'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getUnlockedMaverickBreakthroughSlots } from '@/lib/characters/maverick'

type MaverickBreakthroughCardProps = {
  classLevel: number
  availableChoices: Array<{
    value: string
    label: string
  }>
  selectedClassIds: string[]
  canEdit: boolean
  onChange: (classIds: string[]) => void
}

export function MaverickBreakthroughCard({
  classLevel,
  availableChoices,
  selectedClassIds,
  canEdit,
  onChange,
}: MaverickBreakthroughCardProps) {
  const slots = getUnlockedMaverickBreakthroughSlots(classLevel)

  if (slots.length === 0) return null

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-neutral-200">Arcane Breakthroughs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-500">
          Choose the extra class spell lists your Maverick can draw from. Each slot should be a different class.
        </p>
        {slots.map((slot, index) => {
          const selected = selectedClassIds[index] ?? ''
          return (
            <div key={slot.optionGroupKey} className="space-y-2">
              <Label className="text-neutral-300">Unlocked at Artificer {slot.classLevel}</Label>
              <Select
                value={selected}
                onValueChange={(value) => {
                  const next = [...selectedClassIds]
                  next[index] = value
                  onChange(next)
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {availableChoices.map((entry) => {
                    const chosenElsewhere = selectedClassIds.some((classId, classIndex) => classIndex !== index && classId === entry.value)
                    return (
                      <SelectItem
                        key={entry.value}
                        value={entry.value}
                        disabled={chosenElsewhere}
                        className="text-neutral-200"
                      >
                        {entry.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
