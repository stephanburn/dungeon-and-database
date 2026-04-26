-- Slice E5: Artificer infusions modeled as a feature_option_groups family.
-- ERftLW infusions are now selectable as repeating feature options, with
-- minimum class-level prerequisites enforcing the book's level gates.
-- Magic-item replication targets are flattened into individual options so
-- selection legality and player-facing display stay clean.

INSERT INTO public.feature_option_groups (
  key,
  name,
  option_family,
  description,
  selection_limit,
  allows_duplicate_selections,
  metadata,
  source,
  amended,
  amendment_note
)
VALUES (
  'artificer:infusion:2014',
  'Artificer Infusions (2014)',
  'artificer_infusion',
  'ERftLW Artificer infusions selectable as repeating feature options, with magic-item replication targets surfaced as individual options.',
  12,
  false,
  '{"class_name":"Artificer","rule_set":"2014","selection_mode":"per_slot"}'::jsonb,
  'ERftLW',
  true,
  'Per-infusion combat riders and magic-item replication effects remain descriptive; only selection, prerequisites, and counts are automated.'
)
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  option_family = EXCLUDED.option_family,
  description = EXCLUDED.description,
  selection_limit = EXCLUDED.selection_limit,
  allows_duplicate_selections = EXCLUDED.allows_duplicate_selections,
  metadata = EXCLUDED.metadata,
  source = EXCLUDED.source,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.feature_options (
  group_key,
  key,
  name,
  description,
  option_order,
  prerequisites,
  effects,
  source
)
VALUES
  -- Level 2 (base) infusions
  ('artificer:infusion:2014', 'enhanced_arcane_focus', 'Enhanced Arcane Focus', 'Infuse a rod, staff, or wand into a +1 spell attack focus that ignores half cover.', 10, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'enhanced_defense', 'Enhanced Defense', 'Infuse a suit of armor or shield into a +1 defensive enchantment.', 20, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'enhanced_weapon', 'Enhanced Weapon', 'Infuse a simple or martial weapon into a +1 attack and damage enchantment.', 30, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'mind_sharpener', 'Mind Sharpener', 'Infuse armor or robes that let the wearer steady a faltering concentration check.', 40, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'repeating_shot', 'Repeating Shot', 'Infuse a ranged weapon that produces its own +1 magical ammunition.', 50, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_bag_of_holding', 'Bag of Holding', 'Replicate a Bag of Holding as an artificer infusion.', 100, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Bag of Holding"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_cap_of_water_breathing', 'Cap of Water Breathing', 'Replicate a Cap of Water Breathing as an artificer infusion.', 110, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Cap of Water Breathing"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_goggles_of_night', 'Goggles of Night', 'Replicate Goggles of Night as an artificer infusion.', 120, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Goggles of Night"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_sending_stones', 'Sending Stones', 'Replicate a pair of Sending Stones as an artificer infusion.', 130, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Sending Stones"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_wand_of_magic_detection', 'Wand of Magic Detection', 'Replicate a Wand of Magic Detection as an artificer infusion.', 140, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Wand of Magic Detection"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_wand_of_secrets', 'Wand of Secrets', 'Replicate a Wand of Secrets as an artificer infusion.', 150, '{"minimum_class_level":2}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Wand of Secrets"}'::jsonb, 'ERftLW'),

  -- Level 6 infusions
  ('artificer:infusion:2014', 'boots_of_the_winding_path', 'Boots of the Winding Path', 'Infuse a pair of boots that let the wearer recall a recent step as a bonus action.', 200, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'homunculus_servant', 'Homunculus Servant', 'Infuse a gemstone that becomes a homunculus companion under the artificer''s direction.', 210, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"creature"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'resistant_armor', 'Resistant Armor', 'Infuse armor that grants resistance to a chosen damage type.', 220, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'returning_weapon', 'Returning Weapon', 'Infuse a thrown weapon that returns to the wielder''s hand after each throw.', 230, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'spell_refueling_ring', 'Spell-Refueling Ring', 'Infuse a ring that recovers a 3rd-level or lower spell slot for its wearer once per day.', 240, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_cloak_of_protection', 'Cloak of Protection', 'Replicate a Cloak of Protection as an artificer infusion.', 300, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Cloak of Protection"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_eyes_of_charming', 'Eyes of Charming', 'Replicate Eyes of Charming as an artificer infusion.', 310, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Eyes of Charming"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_gloves_of_thievery', 'Gloves of Thievery', 'Replicate Gloves of Thievery as an artificer infusion.', 320, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Gloves of Thievery"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_slippers_of_spider_climbing', 'Slippers of Spider Climbing', 'Replicate Slippers of Spider Climbing as an artificer infusion.', 330, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Slippers of Spider Climbing"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_ventilating_lungs', 'Ventilating Lungs', 'Replicate Ventilating Lungs as an artificer infusion.', 340, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Ventilating Lungs"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_winged_boots', 'Winged Boots', 'Replicate Winged Boots as an artificer infusion.', 350, '{"minimum_class_level":6}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Winged Boots"}'::jsonb, 'ERftLW'),

  -- Level 10 infusions
  ('artificer:infusion:2014', 'radiant_weapon', 'Radiant Weapon', 'Infuse a weapon that emits radiant light and can blind nearby foes on a hit.', 400, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'repulsion_shield', 'Repulsion Shield', 'Infuse a shield that can shove an attacker on a successful block.', 410, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_boots_of_striding_and_springing', 'Boots of Striding and Springing', 'Replicate Boots of Striding and Springing as an artificer infusion.', 500, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Boots of Striding and Springing"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_boots_of_the_winterlands', 'Boots of the Winterlands', 'Replicate Boots of the Winterlands as an artificer infusion.', 510, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Boots of the Winterlands"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_bracers_of_archery', 'Bracers of Archery', 'Replicate Bracers of Archery as an artificer infusion.', 520, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Bracers of Archery"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_brooch_of_shielding', 'Brooch of Shielding', 'Replicate a Brooch of Shielding as an artificer infusion.', 530, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Brooch of Shielding"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_broom_of_flying', 'Broom of Flying', 'Replicate a Broom of Flying as an artificer infusion.', 540, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Broom of Flying"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_cloak_of_the_manta_ray', 'Cloak of the Manta Ray', 'Replicate a Cloak of the Manta Ray as an artificer infusion.', 550, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Cloak of the Manta Ray"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_eyes_of_the_eagle', 'Eyes of the Eagle', 'Replicate Eyes of the Eagle as an artificer infusion.', 560, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Eyes of the Eagle"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_gauntlets_of_ogre_power', 'Gauntlets of Ogre Power', 'Replicate Gauntlets of Ogre Power as an artificer infusion.', 570, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Gauntlets of Ogre Power"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_gem_of_brightness', 'Gem of Brightness', 'Replicate a Gem of Brightness as an artificer infusion.', 580, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Gem of Brightness"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_headband_of_intellect', 'Headband of Intellect', 'Replicate a Headband of Intellect as an artificer infusion.', 590, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Headband of Intellect"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_hewards_handy_haversack', 'Heward''s Handy Haversack', 'Replicate Heward''s Handy Haversack as an artificer infusion.', 600, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Heward''s Handy Haversack"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_medallion_of_thoughts', 'Medallion of Thoughts', 'Replicate a Medallion of Thoughts as an artificer infusion.', 610, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Medallion of Thoughts"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_necklace_of_adaptation', 'Necklace of Adaptation', 'Replicate a Necklace of Adaptation as an artificer infusion.', 620, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Necklace of Adaptation"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_periapt_of_wound_closure', 'Periapt of Wound Closure', 'Replicate a Periapt of Wound Closure as an artificer infusion.', 630, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Periapt of Wound Closure"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_pipes_of_haunting', 'Pipes of Haunting', 'Replicate Pipes of Haunting as an artificer infusion.', 640, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Pipes of Haunting"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_quiver_of_ehlonna', 'Quiver of Ehlonna', 'Replicate a Quiver of Ehlonna as an artificer infusion.', 650, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Quiver of Ehlonna"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_ring_of_jumping', 'Ring of Jumping', 'Replicate a Ring of Jumping as an artificer infusion.', 660, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Ring of Jumping"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_ring_of_mind_shielding', 'Ring of Mind Shielding', 'Replicate a Ring of Mind Shielding as an artificer infusion.', 670, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Ring of Mind Shielding"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_ring_of_water_walking', 'Ring of Water Walking', 'Replicate a Ring of Water Walking as an artificer infusion.', 680, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Ring of Water Walking"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_sentinel_shield', 'Sentinel Shield', 'Replicate a Sentinel Shield as an artificer infusion.', 690, '{"minimum_class_level":10}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Sentinel Shield"}'::jsonb, 'ERftLW'),

  -- Level 14 infusions
  ('artificer:infusion:2014', 'helm_of_awareness', 'Helm of Awareness', 'Infuse a helm that grants its wearer advantage on initiative and resistance to surprise.', 700, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"enhancement"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_amulet_of_health', 'Amulet of Health', 'Replicate an Amulet of Health as an artificer infusion.', 800, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Amulet of Health"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_belt_of_hill_giant_strength', 'Belt of Hill Giant Strength', 'Replicate a Belt of Hill Giant Strength as an artificer infusion.', 810, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Belt of Hill Giant Strength"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_boots_of_levitation', 'Boots of Levitation', 'Replicate Boots of Levitation as an artificer infusion.', 820, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Boots of Levitation"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_boots_of_speed', 'Boots of Speed', 'Replicate Boots of Speed as an artificer infusion.', 830, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Boots of Speed"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_bracers_of_defense', 'Bracers of Defense', 'Replicate Bracers of Defense as an artificer infusion.', 840, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Bracers of Defense"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_cloak_of_the_bat', 'Cloak of the Bat', 'Replicate a Cloak of the Bat as an artificer infusion.', 850, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Cloak of the Bat"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_dimensional_shackles', 'Dimensional Shackles', 'Replicate Dimensional Shackles as an artificer infusion.', 860, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Dimensional Shackles"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_gem_of_seeing', 'Gem of Seeing', 'Replicate a Gem of Seeing as an artificer infusion.', 870, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Gem of Seeing"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_horn_of_blasting', 'Horn of Blasting', 'Replicate a Horn of Blasting as an artificer infusion.', 880, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Horn of Blasting"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_ring_of_free_action', 'Ring of Free Action', 'Replicate a Ring of Free Action as an artificer infusion.', 890, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Ring of Free Action"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_ring_of_protection', 'Ring of Protection', 'Replicate a Ring of Protection as an artificer infusion.', 900, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Ring of Protection"}'::jsonb, 'ERftLW'),
  ('artificer:infusion:2014', 'replicate_ring_of_the_ram', 'Ring of the Ram', 'Replicate a Ring of the Ram as an artificer infusion.', 910, '{"minimum_class_level":14}'::jsonb, '{"infusion_kind":"replicate_magic_item","item_name":"Ring of the Ram"}'::jsonb, 'ERftLW')
ON CONFLICT (group_key, key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  option_order = EXCLUDED.option_order,
  prerequisites = EXCLUDED.prerequisites,
  effects = EXCLUDED.effects,
  source = EXCLUDED.source;

UPDATE public.classes
SET
  amended = true,
  amendment_note = 'Infusion selection and prerequisites are modeled; per-infusion combat riders, infused-item attunement tracking, and the daily infusions-prepared resource are still descriptive.'
WHERE name = 'Artificer' AND source = 'ERftLW';
