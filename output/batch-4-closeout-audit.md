# Batch 4 Closeout Audit

This document is the Slice 4o closeout gate for Batch 4. It answers two questions:

1. Does the guided builder now cover the Batch 4 promise for creation and level-up?
2. What residual gaps remain, and which of them are explicit Batch 5 entry tasks rather than hidden Batch 4 debt?

## Representative Archetype Matrix

Creation remains intentionally single-class and level 1. The multiclass smoke therefore means:

- create the base character through the guided creation flow only
- then use the guided level-up flow to add the new multiclass level

| Archetype | Guided creation smoke | Guided level-up smoke | Notes |
| --- | --- | --- | --- |
| Single-class caster | Wizard 1 | Wizard 2 | Exercises spell selection, HP gain, and class-scoped spell review |
| Multiclass caster / martial | Fighter 1 | Fighter 1 / Wizard 1 | Exercises multiclass prerequisite validation, multiclass skill grant, and class-scoped spell persistence |
| Feat-heavy | Variant Human Fighter 1 | Fighter 2 or Fighter 4 depending on feat-slot fixture | Exercises species feat handling in creation and ASI / feat persistence in level-up |
| Species / background-heavy | Changeling Bard 1 or Warforged Artificer 1 | same class to next level | Exercises typed language/tool/species-choice provenance and feature-driven spell / option handling |

## Smoke Evidence

The current repo state supports the matrix above through guided flows only:

- creation is driven from `src/app/characters/new/CharacterNewForm.tsx` and explicitly blocks raw-sheet multiclass shortcuts
- level-up is driven from `src/app/characters/[id]/LevelUpWizard.tsx` and now persists additive-only changes through the level-up RPC path
- shared legality / derivation is reused by creation review, level-up review, and post-save reloads

Verification run for Slice 4o:

- `npm test -- test/level-up-flow.test.ts test/atomic-save.test.ts test/wizard-step-helpers.test.ts test/batch-4-closeout.test.ts`
- `node node_modules/next/dist/bin/next build`

## Gap Audit

### Confirmed clear for Batch 4

- No primary guided save path writes new feat or spell state into `character_choices`; guided character saves go through `save_character_atomic` or `save_character_level_up_atomic`
- Level-up no longer relies on aggregate class rows alone; additive provenance is anchored on `character_class_levels`
- Multiclass spell editing is class-scoped rather than flattening all spell rows together
- Guided creation is the intended level-1 entry path; guided level-up is the intended multiclass / advancement path

### Legacy seams still present but not Batch 4 blockers

- `character_choices` is still read into snapshots so older rows remain auditable during transition
- typed spell / feat replacement helpers still clear mirrored legacy `character_choices` rows to prevent stale fallback state from resurfacing
- creation is still intentionally single-class at level 1, so “multiclass creation” is not part of Batch 4 scope

## Batch 5 Entry Tasks

These are explicit follow-ons, not hidden Batch 4 blockers:

- deepen sheet presentation so adjusted scores, AC sources, spell DC / attack mods, and proficiency provenance are readable without DB inspection
- surface character choice provenance and stale `(source_category, source_entity_id)` references in DM-facing audit UI
- improve combat-time presentation for already-modeled but lightly surfaced feature systems such as maneuvers, terrains, disciplines, and reactive species traits
- consider a broader smoke harness that programmatically walks representative creation and level-up payloads instead of relying only on targeted helper and save-path tests

## Closeout Result

Batch 4 is effectively complete. A player can create a level 1 character through guided steps without depending on the raw editor, and can level up through a guided flow that persists only what changed. Remaining work is now primarily Batch 5 sheet depth and audit presentation rather than missing builder workflow plumbing.
