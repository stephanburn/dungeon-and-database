'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  StartingEquipmentPackageEntry,
  WeaponCatalogEntry,
} from '@/lib/content/equipment-content'
import type { EquipmentItem } from '@/lib/types/database'
import {
  getHelperRequirements,
  getPackageChoiceGroups,
  resolveStartingEquipment,
  type StartingEquipmentSelections,
} from '@/lib/characters/starting-equipment'

type StartingEquipmentCardProps = {
  packages: StartingEquipmentPackageEntry[]
  equipmentItems: EquipmentItem[]
  weapons: WeaponCatalogEntry[]
  selections: StartingEquipmentSelections
  canEdit?: boolean
  onChange: (next: StartingEquipmentSelections) => void
}

function formatChoiceOption(
  option: StartingEquipmentPackageEntry['items'][number]
) {
  if (option.notes) {
    return `${option.item_name} (${option.notes})`
  }
  return option.item_name
}

export function StartingEquipmentCard({
  packages,
  equipmentItems,
  weapons,
  selections,
  canEdit = false,
  onChange,
}: StartingEquipmentCardProps) {
  const resolved = resolveStartingEquipment(packages, selections, equipmentItems, weapons)

  function updateGroupSelection(packageId: string, choiceGroup: string, packageItemId: string) {
    onChange({
      ...selections,
      [packageId]: {
        selectedPackageItemIdsByGroup: {
          ...(selections[packageId]?.selectedPackageItemIdsByGroup ?? {}),
          [choiceGroup]: packageItemId,
        },
        helperSelectionsByPackageItemId: {
          ...(selections[packageId]?.helperSelectionsByPackageItemId ?? {}),
        },
      },
    })
  }

  function updateHelperSelection(
    packageId: string,
    packageItemId: string,
    helperIndex: number,
    itemId: string
  ) {
    const existing = selections[packageId]?.helperSelectionsByPackageItemId?.[packageItemId] ?? []
    const next = existing.slice()
    next[helperIndex] = itemId

    onChange({
      ...selections,
      [packageId]: {
        selectedPackageItemIdsByGroup: {
          ...(selections[packageId]?.selectedPackageItemIdsByGroup ?? {}),
        },
        helperSelectionsByPackageItemId: {
          ...(selections[packageId]?.helperSelectionsByPackageItemId ?? {}),
          [packageItemId]: next,
        },
      },
    })
  }

  if (packages.length === 0) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-lg text-neutral-100">Starting Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-400">No seeded starting-equipment packages apply to this build yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg text-neutral-100">Starting Equipment</CardTitle>
        <p className="text-sm leading-6 text-neutral-400">
          Resolve the class and background starting gear now. The wizard will save the concrete item rows onto the character.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {packages.map((pkg) => {
          const packageSelection = selections[pkg.id] ?? {
            selectedPackageItemIdsByGroup: {},
            helperSelectionsByPackageItemId: {},
          }
          const fixedItems = pkg.items
            .filter((item) => !item.choice_group)
            .sort((left, right) => left.item_order - right.item_order)
          const choiceGroups = getPackageChoiceGroups(pkg)
          const activeChoiceItems = choiceGroups
            .map((group) => group.options.find((option) => option.id === packageSelection.selectedPackageItemIdsByGroup[group.key]) ?? null)
            .filter((item): item is StartingEquipmentPackageEntry['items'][number] => Boolean(item))
          const helperItems = [...fixedItems, ...activeChoiceItems].filter((item) => (
            getHelperRequirements(item, equipmentItems, weapons).length > 0
          ))
          const packagePreview = resolveStartingEquipment([pkg], selections, equipmentItems, weapons)

          return (
            <div key={pkg.id} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-medium text-neutral-100">{pkg.name}</p>
                {pkg.description && (
                  <p className="mt-1 text-sm text-neutral-400">{pkg.description}</p>
                )}
              </div>

              {choiceGroups.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {choiceGroups.map((group) => (
                    <div key={`${pkg.id}:${group.key}`} className="space-y-2">
                      <Label className="text-neutral-300">Choose {group.label}</Label>
                      <Select
                        value={packageSelection.selectedPackageItemIdsByGroup[group.key] ?? ''}
                        onValueChange={(value) => updateGroupSelection(pkg.id, group.key, value)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Choose ${group.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {group.options.map((option) => (
                            <SelectItem key={option.id} value={option.id} className="text-neutral-200">
                              {formatChoiceOption(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              {helperItems.map((item) => {
                const requirements = getHelperRequirements(item, equipmentItems, weapons)
                const selectedHelperItems = packageSelection.helperSelectionsByPackageItemId[item.id] ?? []

                return (
                  <div key={`${pkg.id}:${item.id}`} className="grid gap-4 sm:grid-cols-2">
                    {requirements.map((requirement, index) => (
                      <div key={`${item.id}:${requirement.key}`} className="space-y-2">
                        <Label className="text-neutral-300">
                          {requirement.label} for {item.item_name}
                        </Label>
                        <Select
                          value={selectedHelperItems[index] ?? ''}
                          onValueChange={(value) => updateHelperSelection(pkg.id, item.id, index, value)}
                          disabled={!canEdit}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Choose ${requirement.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {requirement.options.map((option) => (
                              <SelectItem key={option.itemId} value={option.itemId} className="text-neutral-200">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )
              })}

              {packagePreview.lines.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-200">Resolved Loadout</p>
                  <div className="flex flex-wrap gap-2">
                    {packagePreview.lines.map((line, index) => (
                      <span
                        key={`${line.packageId}:${line.itemId}:${index}`}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300"
                      >
                        {line.quantity}x {line.itemName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {resolved.issues.length > 0 && (
          <Alert className="border-amber-400/20 bg-amber-400/10">
            <AlertDescription className="space-y-1 text-sm text-amber-100">
              {resolved.issues.map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
