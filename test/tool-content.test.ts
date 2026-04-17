import test from 'node:test'
import assert from 'node:assert/strict'
import { STANDARD_TOOL_OPTIONS } from '@/lib/characters/language-tool-provenance'
import { buildToolKeyByNameMap, normalizeToolName } from '@/lib/content/tool-content'

test('normalizeToolName matches display labels case-insensitively', () => {
  assert.equal(normalizeToolName("  Smith's   Tools "), "smith's tools")
  assert.equal(normalizeToolName('DRAGONCHESS SET'), 'dragonchess set')
})

test('buildToolKeyByNameMap covers the seeded standard tool names', () => {
  const keyByName = buildToolKeyByNameMap([
    { key: 'alchemists_supplies', name: "Alchemist's Supplies" },
    { key: 'brewers_supplies', name: "Brewer's Supplies" },
    { key: 'calligraphers_supplies', name: "Calligrapher's Supplies" },
    { key: 'carpenters_tools', name: "Carpenter's Tools" },
    { key: 'cartographers_tools', name: "Cartographer's Tools" },
    { key: 'cobblers_tools', name: "Cobbler's Tools" },
    { key: 'cooks_utensils', name: "Cook's Utensils" },
    { key: 'glassblowers_tools', name: "Glassblower's Tools" },
    { key: 'jewelers_tools', name: "Jeweler's Tools" },
    { key: 'leatherworkers_tools', name: "Leatherworker's Tools" },
    { key: 'masons_tools', name: "Mason's Tools" },
    { key: 'painters_supplies', name: "Painter's Supplies" },
    { key: 'potters_tools', name: "Potter's Tools" },
    { key: 'smiths_tools', name: "Smith's Tools" },
    { key: 'tinkers_tools', name: "Tinker's Tools" },
    { key: 'weavers_tools', name: "Weaver's Tools" },
    { key: 'woodcarvers_tools', name: "Woodcarver's Tools" },
    { key: 'disguise_kit', name: 'Disguise Kit' },
    { key: 'forgery_kit', name: 'Forgery Kit' },
    { key: 'herbalism_kit', name: 'Herbalism Kit' },
    { key: 'navigators_tools', name: "Navigator's Tools" },
    { key: 'poisoners_kit', name: "Poisoner's Kit" },
    { key: 'thieves_tools', name: "Thieves' Tools" },
    { key: 'dice_set', name: 'Dice Set' },
    { key: 'dragonchess_set', name: 'Dragonchess Set' },
    { key: 'playing_card_set', name: 'Playing Card Set' },
    { key: 'bagpipes', name: 'Bagpipes' },
    { key: 'drum', name: 'Drum' },
    { key: 'dulcimer', name: 'Dulcimer' },
    { key: 'flute', name: 'Flute' },
    { key: 'horn', name: 'Horn' },
    { key: 'lute', name: 'Lute' },
    { key: 'lyre', name: 'Lyre' },
    { key: 'pan_flute', name: 'Pan Flute' },
    { key: 'shawm', name: 'Shawm' },
    { key: 'viol', name: 'Viol' },
  ])

  for (const tool of STANDARD_TOOL_OPTIONS) {
    assert.ok(keyByName.get(normalizeToolName(tool)), `missing catalog key for ${tool}`)
  }
})
