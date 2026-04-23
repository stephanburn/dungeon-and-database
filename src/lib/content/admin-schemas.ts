import { z } from 'zod'

const abilityKeySchema = z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha'])
const alignmentModeSchema = z.enum(['prepared', 'known', 'spellbook', 'none'])
const sizeCategorySchema = z.enum(['tiny', 'small', 'medium', 'large'])
const variantTypeSchema = z.enum(['base', 'subrace', 'variant'])
const spellcastingTypeSchema = z.enum(['full', 'half', 'third', 'pact', 'none'])
const ruleSetSchema = z.enum(['2014', '2024'])

const nullableUuidSchema = z.union([z.string().uuid(), z.null()])

const skillChoicesSchema = z.object({
  count: z.number().int().min(0),
  from: z.array(z.string()),
}).strict()

const multiclassPrereqSchema = z.object({
  ability: z.string().min(1),
  min: z.number().int().min(1),
}).strict()

const spellcastingProgressionSchema = z.object({
  mode: alignmentModeSchema,
  spellcasting_ability: abilityKeySchema.optional(),
  cantrips_known_by_level: z.array(z.number().int().min(0)).optional(),
  spells_known_by_level: z.array(z.number().int().min(0)).optional(),
  spellbook_spells_by_level: z.array(z.number().int().min(0)).optional(),
  prepared_formula: z.enum([
    'class_level',
    'half_level_down',
    'half_level_up',
    'third_level_down',
    'third_level_up',
    'fixed',
  ]).optional(),
  prepared_fixed: z.number().int().min(0).optional(),
  prepared_add_ability_mod: z.boolean().optional(),
  prepared_min: z.number().int().min(0).optional(),
}).strict()

const startingEquipmentItemSchema = z.object({
  item: z.string().min(1),
  quantity: z.number().int().min(1),
}).strict()

const featPrerequisiteSchema = z.object({
  type: z.enum(['ability', 'proficiency', 'feature', 'level', 'spellcasting']),
  ability: z.string().optional(),
  min: z.number().int().optional(),
  proficiency: z.string().optional(),
  feature: z.string().optional(),
}).strict()

const spellComponentsSchema = z.object({
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
  material_description: z.string().optional(),
}).strict()

const abilityScoreBonusSchema = z.object({
  ability: abilityKeySchema,
  bonus: z.number().int(),
}).strict()

const senseSchema = z.object({
  type: z.string().min(1),
  range_ft: z.number().int().min(0),
}).strict()

const classFieldsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  hit_die: z.number().int().min(1).max(20).optional(),
  primary_ability: z.array(z.string()).optional(),
  saving_throw_proficiencies: z.array(z.string()).optional(),
  armor_proficiencies: z.array(z.string()).optional(),
  weapon_proficiencies: z.array(z.string()).optional(),
  tool_proficiencies: z.record(z.string(), z.unknown()).optional(),
  skill_choices: skillChoicesSchema.optional(),
  multiclass_prereqs: z.array(multiclassPrereqSchema).optional(),
  multiclass_proficiencies: z.record(z.string(), z.unknown()).optional(),
  starting_equipment_package_id: nullableUuidSchema.optional(),
  spellcasting_type: z.union([spellcastingTypeSchema, z.null()]).optional(),
  spellcasting_progression: z.union([spellcastingProgressionSchema, z.null()]).optional(),
  subclass_choice_level: z.number().int().min(1).max(20).optional(),
  source: z.string().min(1).optional(),
  amended: z.boolean().optional(),
  amendment_note: z.union([z.string(), z.null()]).optional(),
}).strict()

const subclassFieldsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  class_id: z.string().uuid().optional(),
  choice_level: z.number().int().min(1).max(20).optional(),
  source: z.string().min(1).optional(),
  amended: z.boolean().optional(),
  amendment_note: z.union([z.string(), z.null()]).optional(),
}).strict()

const backgroundFieldsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  skill_proficiencies: z.array(z.string()).optional(),
  skill_choice_count: z.number().int().min(0).optional(),
  skill_choice_from: z.array(z.string()).optional(),
  tool_proficiencies: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  starting_equipment: z.array(startingEquipmentItemSchema).optional(),
  starting_equipment_package_id: nullableUuidSchema.optional(),
  feature: z.string().optional(),
  background_feat_id: nullableUuidSchema.optional(),
  source: z.string().min(1).optional(),
  amended: z.boolean().optional(),
  amendment_note: z.union([z.string(), z.null()]).optional(),
}).strict()

const featFieldsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  prerequisites: z.array(featPrerequisiteSchema).optional(),
  benefits: z.record(z.string(), z.unknown()).optional(),
  source: z.string().min(1).optional(),
  amended: z.boolean().optional(),
  amendment_note: z.union([z.string(), z.null()]).optional(),
}).strict()

const speciesFieldsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parent_species_id: nullableUuidSchema.optional(),
  lineage_key: z.string().optional(),
  variant_type: variantTypeSchema.optional(),
  variant_order: z.number().int().min(0).optional(),
  size: sizeCategorySchema.optional(),
  speed: z.number().int().min(0).optional(),
  ability_score_bonuses: z.array(abilityScoreBonusSchema).optional(),
  languages: z.array(z.string()).optional(),
  traits: z.array(z.string()).optional(),
  senses: z.array(senseSchema).optional(),
  damage_resistances: z.array(z.string()).optional(),
  condition_immunities: z.array(z.string()).optional(),
  source: z.string().min(1).optional(),
  amended: z.boolean().optional(),
  amendment_note: z.union([z.string(), z.null()]).optional(),
}).strict()

const spellFieldsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  level: z.number().int().min(0).max(9).optional(),
  school: z.string().min(1).optional(),
  casting_time: z.string().min(1).optional(),
  range: z.string().min(1).optional(),
  components: spellComponentsSchema.optional(),
  duration: z.string().min(1).optional(),
  concentration: z.boolean().optional(),
  ritual: z.boolean().optional(),
  description: z.string().optional(),
  classes: z.array(z.string().uuid()).optional(),
  source: z.string().min(1).optional(),
  amended: z.boolean().optional(),
  amendment_note: z.union([z.string(), z.null()]).optional(),
}).strict()

const equipmentItemFieldsSchema = z.object({
  key: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  item_category: z.string().min(1).optional(),
  cost_quantity: z.number().int().min(0).optional(),
  cost_unit: z.string().min(1).optional(),
  weight_lb: z.union([z.number().min(0), z.null()]).optional(),
  source: z.string().min(1).optional(),
  amended: z.boolean().optional(),
  amendment_note: z.union([z.string(), z.null()]).optional(),
}).strict()

export const classCreateSchema = classFieldsSchema.extend({
  name: z.string().min(1).max(100),
  hit_die: z.number().int().min(1).max(20),
  source: z.string().min(1),
})

export const classUpdateSchema = classFieldsSchema.extend({
  id: z.string().uuid(),
})

export const subclassCreateSchema = subclassFieldsSchema.extend({
  name: z.string().min(1).max(100),
  class_id: z.string().uuid(),
  source: z.string().min(1),
})

export const subclassUpdateSchema = subclassFieldsSchema.extend({
  id: z.string().uuid(),
})

export const backgroundCreateSchema = backgroundFieldsSchema.extend({
  name: z.string().min(1).max(100),
  source: z.string().min(1),
})

export const backgroundUpdateSchema = backgroundFieldsSchema.extend({
  id: z.string().uuid(),
})

export const featCreateSchema = featFieldsSchema.extend({
  name: z.string().min(1).max(100),
  source: z.string().min(1),
})

export const featUpdateSchema = featFieldsSchema.extend({
  id: z.string().uuid(),
})

export const speciesCreateSchema = speciesFieldsSchema.extend({
  name: z.string().min(1).max(100),
  source: z.string().min(1),
})

export const speciesUpdateSchema = speciesFieldsSchema.extend({
  id: z.string().uuid(),
})

export const spellCreateSchema = spellFieldsSchema.extend({
  name: z.string().min(1).max(100),
  level: z.number().int().min(0).max(9),
  school: z.string().min(1),
  casting_time: z.string().min(1),
  range: z.string().min(1),
  duration: z.string().min(1),
  source: z.string().min(1),
})

export const spellUpdateSchema = spellFieldsSchema.extend({
  id: z.string().uuid(),
})

export const equipmentItemCreateSchema = equipmentItemFieldsSchema.extend({
  key: z.string().min(1),
  name: z.string().min(1),
  item_category: z.string().min(1),
  source: z.string().min(1),
})

export const equipmentItemUpdateSchema = equipmentItemFieldsSchema.extend({
  id: z.string().uuid(),
})

export const sourceUpdateSchema = z.object({
  original_key: z.string().min(1),
  key: z.string().min(1),
  full_name: z.string().min(1),
  is_srd: z.boolean().optional(),
  rule_set: ruleSetSchema.optional(),
}).strict()
