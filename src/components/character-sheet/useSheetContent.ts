'use client'

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type {
  Background,
  Class,
  Feat,
  FeatureOption,
  FeatureSpellGrant,
  Language,
  Species,
  Subclass,
  Tool,
} from '@/lib/types/database'
import type { ArmorCatalogEntry, ShieldCatalogEntry } from '@/lib/content/equipment-content'
import type { SpellOption } from '@/lib/characters/wizard-helpers'
import { replaceSpellOptionsStable } from '@/lib/characters/spell-options'
import { contentDataOr, fetchContent, fetchContentErrorMessage } from '@/lib/client/fetch-content'

export type SheetContentLevelInput = {
  class_id: string
  level: number
  subclass_id: string | null
  hp_roll: number | null
}

type UseSheetContentArgs = {
  campaignId: string
  levels: SheetContentLevelInput[]
  speciesId: string
  initialSelectedSpells: SpellOption[]
  maverickBreakthroughClassIds: string[]
}

type UseSheetContentResult = {
  speciesList: Species[]
  backgroundList: Background[]
  classList: Class[]
  subclassMap: Record<string, Subclass[]>
  featList: Feat[]
  languageList: Language[]
  toolList: Tool[]
  armorCatalog: ArmorCatalogEntry[]
  shieldCatalog: ShieldCatalogEntry[]
  featureOptionRows: FeatureOption[]
  featureSpellGrants: FeatureSpellGrant[]
  spellOptions: SpellOption[]
  setSpellOptions: Dispatch<SetStateAction<SpellOption[]>>
  contentLoadError: string | null
  contentLoading: boolean
  retryContentLoad: () => void
}

export function useSheetContent({
  campaignId,
  levels,
  speciesId,
  initialSelectedSpells,
  maverickBreakthroughClassIds,
}: UseSheetContentArgs): UseSheetContentResult {
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [backgroundList, setBackgroundList] = useState<Background[]>([])
  const [classList, setClassList] = useState<Class[]>([])
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [featList, setFeatList] = useState<Feat[]>([])
  const [languageList, setLanguageList] = useState<Language[]>([])
  const [toolList, setToolList] = useState<Tool[]>([])
  const [armorCatalog, setArmorCatalog] = useState<ArmorCatalogEntry[]>([])
  const [shieldCatalog, setShieldCatalog] = useState<ShieldCatalogEntry[]>([])
  const [featureOptionRows, setFeatureOptionRows] = useState<FeatureOption[]>([])
  const [featureSpellGrants, setFeatureSpellGrants] = useState<FeatureSpellGrant[]>([])
  const [spellOptions, setSpellOptions] = useState<SpellOption[]>(initialSelectedSpells)
  const [contentLoadError, setContentLoadError] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const firstClassId = levels[0]?.class_id
  const firstClassLevel = levels[0]?.level ?? 0
  const firstClassSubclassIds = useMemo(
    () => levels
      .filter((level) => level.class_id === firstClassId && level.subclass_id)
      .map((level) => level.subclass_id as string),
    [firstClassId, levels]
  )

  const retryContentLoad = useCallback(() => {
    setContentLoadError(null)
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    const qs = `?campaign_id=${campaignId}`
    setContentLoading(true)

    Promise.all([
      fetchContent<Species[]>(`/api/content/species${qs}`),
      fetchContent<Background[]>(`/api/content/backgrounds${qs}`),
      fetchContent<Class[]>(`/api/content/classes${qs}`),
      fetchContent<Feat[]>(`/api/content/feats${qs}`),
      fetchContent<Language[]>(`/api/content/languages${qs}`),
      fetchContent<Tool[]>(`/api/content/tools${qs}`),
      fetchContent<ArmorCatalogEntry[]>(`/api/content/armor${qs}`),
      fetchContent<ShieldCatalogEntry[]>(`/api/content/shields${qs}`),
      fetchContent<FeatureOption[]>(`/api/content/feature-options${qs}`),
      fetchContent<FeatureSpellGrant[]>(`/api/content/feature-spell-grants${qs}`),
    ]).then(([s, b, c, f, languages, tools, armor, shields, featureOptions, spellGrants]) => {
      if (cancelled) return
      const loadError = fetchContentErrorMessage([s, b, c, f, languages, tools, armor, shields, featureOptions, spellGrants])
      if (loadError) {
        setContentLoadError(loadError)
        return
      }

      setContentLoadError(null)
      setSpeciesList(contentDataOr(s, []))
      setBackgroundList(contentDataOr(b, []))
      setClassList(contentDataOr(c, []))
      setFeatList(contentDataOr(f, []))
      setLanguageList(contentDataOr(languages, []))
      setToolList(contentDataOr(tools, []))
      setArmorCatalog(contentDataOr(armor, []))
      setShieldCatalog(contentDataOr(shields, []))
      setFeatureOptionRows(contentDataOr(featureOptions, []))
      setFeatureSpellGrants(contentDataOr(spellGrants, []))
    }).finally(() => {
      if (!cancelled) setContentLoading(false)
    })

    return () => { cancelled = true }
  }, [campaignId, reloadToken])

  useEffect(() => {
    let cancelled = false
    const classIds = Array.from(new Set(levels.map((l) => l.class_id).filter(Boolean)))
    if (classIds.length === 0) return

    const needed = classIds.filter((id) => !subclassMap[id])
    if (needed.length === 0) return
    setContentLoading(true)

    Promise.all(
      needed.map((id) =>
        fetchContent<Subclass[]>(`/api/content/classes/${id}/subclasses?campaign_id=${campaignId}`)
          .then((result) => ({ id, result }))
      )
    ).then((results) => {
      if (cancelled) return
      const loadError = fetchContentErrorMessage(results.map((entry) => entry.result))
      if (loadError) {
        setContentLoadError(loadError)
        return
      }

      setContentLoadError(null)
      setSubclassMap((prev) => {
        const next = { ...prev }
        results.forEach(({ id, result }) => { next[id] = contentDataOr(result, []) })
        return next
      })
    }).finally(() => {
      if (!cancelled) setContentLoading(false)
    })

    return () => { cancelled = true }
  }, [levels, campaignId, subclassMap, reloadToken])

  useEffect(() => {
    let cancelled = false
    const primaryClass = classList.find((cls) => cls.id === firstClassId) ?? null
    if (!campaignId || !firstClassId || !primaryClass?.spellcasting_type || primaryClass.spellcasting_type === 'none') {
      setSpellOptions(initialSelectedSpells)
      return
    }

    const params = new URLSearchParams({
      class_id: firstClassId,
      campaign_id: campaignId,
      class_level: String(firstClassLevel),
    })
    if (speciesId) params.set('species_id', speciesId)
    for (const subclassId of firstClassSubclassIds) params.append('subclass_id', subclassId)
    for (const expandedClassId of maverickBreakthroughClassIds.filter(Boolean)) {
      params.append('expanded_class_id', expandedClassId)
    }

    setContentLoading(true)
    fetchContent<SpellOption[]>(`/api/content/spells?${params.toString()}`)
      .then((result) => {
        if (cancelled) return
        if ('error' in result) {
          setContentLoadError(result.error.message)
          return
        }

        setContentLoadError(null)
        const mergedById = new Map<string, SpellOption>()
        for (const spell of initialSelectedSpells) mergedById.set(spell.id, spell)
        for (const spell of Array.isArray(result.data) ? result.data : []) mergedById.set(spell.id, spell)
        setSpellOptions((current) => replaceSpellOptionsStable(current, Array.from(mergedById.values())))
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false)
      })

    return () => { cancelled = true }
  }, [
    campaignId,
    classList,
    firstClassId,
    firstClassLevel,
    firstClassSubclassIds,
    initialSelectedSpells,
    maverickBreakthroughClassIds,
    reloadToken,
    speciesId,
  ])

  return {
    speciesList,
    backgroundList,
    classList,
    subclassMap,
    featList,
    languageList,
    toolList,
    armorCatalog,
    shieldCatalog,
    featureOptionRows,
    featureSpellGrants,
    spellOptions,
    setSpellOptions,
    contentLoadError,
    contentLoading,
    retryContentLoad,
  }
}
