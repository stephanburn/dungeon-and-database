-- PHB 2014 content pass:
-- expand starting equipment package coverage across PHB classes and backgrounds.
--
-- The current package schema can represent single-item alternatives directly,
-- but multi-item option bundles still need helper catalog rows. This slice
-- seeds those helper items so package content stays queryable and legible.

INSERT INTO public.equipment_items (
  key,
  name,
  item_category,
  cost_quantity,
  cost_unit,
  weight_lb,
  source,
  amended,
  amendment_note
)
VALUES
  ('explorers_pack', 'Explorer''s Pack', 'gear', 10, 'gp', 59.00, 'PHB', false, NULL),
  ('dungeoneers_pack', 'Dungeoneer''s Pack', 'gear', 12, 'gp', 61.50, 'PHB', false, NULL),
  ('burglars_pack', 'Burglar''s Pack', 'gear', 16, 'gp', 46.00, 'PHB', false, NULL),
  ('diplomats_pack', 'Diplomat''s Pack', 'gear', 39, 'gp', 36.00, 'PHB', false, NULL),
  ('entertainers_pack', 'Entertainer''s Pack', 'gear', 40, 'gp', 38.00, 'PHB', false, NULL),
  ('priests_pack', 'Priest''s Pack', 'gear', 19, 'gp', 24.00, 'PHB', false, NULL),
  ('scholars_pack', 'Scholar''s Pack', 'gear', 40, 'gp', 22.00, 'PHB', false, NULL),
  ('component_pouch', 'Component Pouch', 'gear', 25, 'gp', 2.00, 'PHB', false, NULL),
  ('arcane_focus_choice', 'Arcane Focus Choice', 'gear', 5, 'gp', 1.00, 'PHB', true, 'Represents a starting-equipment choice between standard PHB arcane focus options.'),
  ('druidic_focus_choice', 'Druidic Focus Choice', 'gear', 1, 'gp', 1.00, 'PHB', true, 'Represents a starting-equipment choice between standard PHB druidic focus options.'),
  ('musical_instrument_choice', 'Musical Instrument Choice', 'gear', 2, 'gp', 3.00, 'PHB', true, 'Represents a starting-equipment choice between standard PHB musical instruments.'),
  ('artisan_tools_choice', 'Artisan''s Tools Choice', 'gear', 5, 'gp', 5.00, 'PHB', true, 'Represents a starting-equipment choice between artisan''s tool proficiencies and kits.'),
  ('gaming_set_choice', 'Gaming Set Choice', 'gear', 1, 'sp', 0.00, 'PHB', true, 'Represents a starting-equipment choice between PHB gaming sets.'),
  ('simple_weapon_choice', 'Simple Weapon Choice', 'gear', 1, 'gp', 2.00, 'PHB', true, 'Represents a starting-equipment choice from simple weapons.'),
  ('simple_melee_weapon_choice', 'Simple Melee Weapon Choice', 'gear', 1, 'gp', 3.00, 'PHB', true, 'Represents a starting-equipment choice from simple melee weapons.'),
  ('martial_melee_weapon_choice', 'Martial Melee Weapon Choice', 'gear', 15, 'gp', 3.00, 'PHB', true, 'Represents a starting-equipment choice from martial melee weapons.'),
  ('two_simple_melee_weapons_set', 'Two Simple Melee Weapons', 'gear', 2, 'gp', 6.00, 'PHB', true, 'Represents a starting-equipment choice of any two simple melee weapons.'),
  ('martial_weapon_and_shield_set', 'Martial Weapon and Shield', 'gear', 25, 'gp', 9.00, 'PHB', true, 'Represents a starting-equipment choice of one martial weapon plus one shield.'),
  ('two_martial_weapons_set', 'Two Martial Weapons', 'gear', 30, 'gp', 6.00, 'PHB', true, 'Represents a starting-equipment choice of any two martial weapons.'),
  ('light_crossbow_and_20_bolts_set', 'Light Crossbow and 20 Bolts', 'gear', 26, 'gp', 6.50, 'PHB', true, 'Represents a starting-equipment bundle of one light crossbow and twenty bolts.'),
  ('longbow_and_20_arrows_set', 'Longbow and 20 Arrows', 'gear', 51, 'gp', 3.00, 'PHB', true, 'Represents a starting-equipment bundle of one longbow and twenty arrows.'),
  ('shortbow_and_20_arrows_set', 'Shortbow and 20 Arrows', 'gear', 26, 'gp', 3.00, 'PHB', true, 'Represents a starting-equipment bundle of one shortbow and twenty arrows.'),
  ('archer_fighter_loadout', 'Leather Armor, Longbow, and 20 Arrows', 'gear', 61, 'gp', 13.00, 'PHB', true, 'Represents the fighter starting-equipment bundle alternative to chain mail.'),
  ('disguise_kit', 'Disguise Kit', 'gear', 25, 'gp', 3.00, 'PHB', false, NULL),
  ('herbalism_kit', 'Herbalism Kit', 'gear', 5, 'gp', 3.00, 'PHB', false, NULL),
  ('fine_clothes', 'Fine Clothes', 'gear', 15, 'gp', 6.00, 'PHB', false, NULL),
  ('travelers_clothes', 'Traveler''s Clothes', 'gear', 2, 'gp', 4.00, 'PHB', false, NULL),
  ('dark_common_clothes', 'Dark Common Clothes', 'gear', 5, 'sp', 3.00, 'PHB', false, NULL),
  ('costume', 'Costume', 'gear', 5, 'gp', 4.00, 'PHB', false, NULL),
  ('charlatan_con_tools', 'Tools of the Con', 'gear', 5, 'gp', 2.00, 'PHB', true, 'Represents one of the Charlatan background''s con-prop options.'),
  ('crowbar', 'Crowbar', 'gear', 2, 'gp', 5.00, 'PHB', false, NULL),
  ('favor_of_admirer', 'Favor of an Admirer', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('shovel', 'Shovel', 'gear', 2, 'gp', 5.00, 'PHB', false, NULL),
  ('iron_pot', 'Iron Pot', 'gear', 2, 'gp', 10.00, 'PHB', false, NULL),
  ('letter_of_introduction', 'Letter of Introduction', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('guild_insignia', 'Guild Insignia', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('scroll_case_notes', 'Scroll Case of Notes', 'gear', 1, 'gp', 0.50, 'PHB', false, NULL),
  ('winter_blanket', 'Winter Blanket', 'gear', 5, 'sp', 3.00, 'PHB', false, NULL),
  ('signet_ring', 'Signet Ring', 'gear', 5, 'gp', 0.00, 'PHB', false, NULL),
  ('scroll_of_pedigree', 'Scroll of Pedigree', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('hunting_trap', 'Hunting Trap', 'gear', 5, 'gp', 25.00, 'PHB', false, NULL),
  ('trophy', 'Trophy', 'gear', 0, 'cp', 1.00, 'PHB', false, NULL),
  ('bottle_black_ink', 'Bottle of Black Ink', 'gear', 10, 'gp', 0.00, 'PHB', false, NULL),
  ('quill', 'Quill', 'gear', 2, 'cp', 0.00, 'PHB', false, NULL),
  ('small_knife', 'Small Knife', 'gear', 1, 'gp', 0.50, 'PHB', false, NULL),
  ('letter_dead_colleague', 'Letter from a Dead Colleague', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('silk_rope_50ft', 'Silk Rope (50 feet)', 'gear', 10, 'gp', 5.00, 'PHB', false, NULL),
  ('lucky_charm', 'Lucky Charm', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('insignia_of_rank', 'Insignia of Rank', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('trophy_from_fallen_enemy', 'Trophy from a Fallen Enemy', 'gear', 0, 'cp', 1.00, 'PHB', false, NULL),
  ('map_of_city', 'Map of the City', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('pet_mouse', 'Pet Mouse', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL),
  ('parental_token', 'Parental Token', 'gear', 0, 'cp', 0.00, 'PHB', false, NULL)
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  item_category = EXCLUDED.item_category,
  cost_quantity = EXCLUDED.cost_quantity,
  cost_unit = EXCLUDED.cost_unit,
  weight_lb = EXCLUDED.weight_lb,
  source = EXCLUDED.source,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.starting_equipment_packages (
  key,
  name,
  description,
  source,
  amended,
  amendment_note
)
VALUES
  ('background:acolyte:phb', 'Acolyte Starting Equipment', 'Prayerful gear for a devoted acolyte.', 'PHB', false, NULL),
  ('background:charlatan:phb', 'Charlatan Starting Equipment', 'Fine clothes and confidence tricks for a practiced deceiver.', 'PHB', false, NULL),
  ('background:criminal:phb', 'Criminal Starting Equipment', 'Shadowy street gear for a seasoned criminal.', 'PHB', false, NULL),
  ('background:entertainer:phb', 'Entertainer Starting Equipment', 'Stage-ready gear for a performer on the road.', 'PHB', false, NULL),
  ('background:folk_hero:phb', 'Folk Hero Starting Equipment', 'Practical village gear for a local champion.', 'PHB', false, NULL),
  ('background:guild_artisan:phb', 'Guild Artisan Starting Equipment', 'Trade credentials and travel gear for a respected artisan.', 'PHB', false, NULL),
  ('background:hermit:phb', 'Hermit Starting Equipment', 'Simple supplies gathered during a solitary life.', 'PHB', false, NULL),
  ('background:noble:phb', 'Noble Starting Equipment', 'Status markers and refined clothing for a person of rank.', 'PHB', false, NULL),
  ('background:outlander:phb', 'Outlander Starting Equipment', 'Travel-ready gear for a wilderness wanderer.', 'PHB', false, NULL),
  ('background:sage:phb', 'Sage Starting Equipment', 'Writing tools and notes for a devoted scholar.', 'PHB', false, NULL),
  ('background:sailor:phb', 'Sailor Starting Equipment', 'Seafaring essentials for life aboard a ship.', 'PHB', false, NULL),
  ('background:soldier:phb', 'Soldier Starting Equipment', 'Campaign keepsakes and field clothes for a veteran soldier.', 'PHB', false, NULL),
  ('background:urchin:phb', 'Urchin Starting Equipment', 'Keepsakes and city gear from a hard-knock upbringing.', 'PHB', false, NULL),

  ('class:barbarian:phb', 'Barbarian Starting Equipment', 'PHB barbarian starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for category-based weapon and bundle selections.'),
  ('class:bard:phb', 'Bard Starting Equipment', 'PHB bard starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for pack, instrument, and broad weapon selections.'),
  ('class:cleric:phb', 'Cleric Starting Equipment', 'PHB cleric starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for armor, weapon, and pack alternatives.'),
  ('class:druid:phb', 'Druid Starting Equipment', 'PHB druid starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for focus and weapon alternatives.'),
  ('class:fighter:phb', 'Fighter Starting Equipment', 'PHB fighter starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for weapon bundles and pack alternatives.'),
  ('class:monk:phb', 'Monk Starting Equipment', 'PHB monk starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for weapon and pack alternatives.'),
  ('class:paladin:phb', 'Paladin Starting Equipment', 'PHB paladin starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for weapon bundles and pack alternatives.'),
  ('class:ranger:phb', 'Ranger Starting Equipment', 'PHB ranger starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for armor, weapon bundles, and pack alternatives.'),
  ('class:rogue:phb', 'Rogue Starting Equipment', 'PHB rogue starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for weapon bundles and pack alternatives.'),
  ('class:sorcerer:phb', 'Sorcerer Starting Equipment', 'PHB sorcerer starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for weapon, focus, and pack alternatives.'),
  ('class:warlock:phb', 'Warlock Starting Equipment', 'PHB warlock starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for weapon, focus, and pack alternatives.'),
  ('class:wizard:phb', 'Wizard Starting Equipment', 'PHB wizard starting choices expressed with helper bundle items where needed.', 'PHB', true, 'Choice resolution is not yet automated for focus and pack alternatives.')
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source = EXCLUDED.source,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.starting_equipment_package_items (package_id, item_id, quantity, item_order, choice_group, notes)
VALUES
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:phb'), (SELECT id FROM public.equipment_items WHERE key = 'holy_symbol'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:phb'), (SELECT id FROM public.equipment_items WHERE key = 'prayer_book'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:phb'), (SELECT id FROM public.equipment_items WHERE key = 'stick_of_incense'), 5, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:phb'), (SELECT id FROM public.equipment_items WHERE key = 'vestments'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:phb'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 50, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 60, '', 'Contains 15 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:charlatan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'fine_clothes'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:charlatan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'disguise_kit'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:charlatan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'charlatan_con_tools'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:charlatan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 40, '', 'Contains 15 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:criminal:phb'), (SELECT id FROM public.equipment_items WHERE key = 'crowbar'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:criminal:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dark_common_clothes'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:criminal:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 30, '', 'Contains 15 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:entertainer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'musical_instrument_choice'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:entertainer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'favor_of_admirer'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:entertainer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'costume'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:entertainer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 40, '', 'Contains 15 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:folk_hero:phb'), (SELECT id FROM public.equipment_items WHERE key = 'artisan_tools_choice'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:folk_hero:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shovel'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:folk_hero:phb'), (SELECT id FROM public.equipment_items WHERE key = 'iron_pot'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:folk_hero:phb'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:folk_hero:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 50, '', 'Contains 10 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:guild_artisan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'artisan_tools_choice'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:guild_artisan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'letter_of_introduction'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:guild_artisan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'travelers_clothes'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:guild_artisan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'guild_insignia'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:guild_artisan:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 50, '', 'Contains 15 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:hermit:phb'), (SELECT id FROM public.equipment_items WHERE key = 'scroll_case_notes'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:hermit:phb'), (SELECT id FROM public.equipment_items WHERE key = 'winter_blanket'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:hermit:phb'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:hermit:phb'), (SELECT id FROM public.equipment_items WHERE key = 'herbalism_kit'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:hermit:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 50, '', 'Contains 5 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:noble:phb'), (SELECT id FROM public.equipment_items WHERE key = 'fine_clothes'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:noble:phb'), (SELECT id FROM public.equipment_items WHERE key = 'signet_ring'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:noble:phb'), (SELECT id FROM public.equipment_items WHERE key = 'scroll_of_pedigree'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:noble:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 40, '', 'Contains 25 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:outlander:phb'), (SELECT id FROM public.equipment_items WHERE key = 'quarterstaff'), 1, 10, '', 'Serves as the background''s staff'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:outlander:phb'), (SELECT id FROM public.equipment_items WHERE key = 'hunting_trap'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:outlander:phb'), (SELECT id FROM public.equipment_items WHERE key = 'trophy'), 1, 30, '', 'Represents a trophy taken from an animal you killed'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:outlander:phb'), (SELECT id FROM public.equipment_items WHERE key = 'travelers_clothes'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:outlander:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 50, '', 'Contains 10 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sage:phb'), (SELECT id FROM public.equipment_items WHERE key = 'bottle_black_ink'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sage:phb'), (SELECT id FROM public.equipment_items WHERE key = 'quill'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sage:phb'), (SELECT id FROM public.equipment_items WHERE key = 'small_knife'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sage:phb'), (SELECT id FROM public.equipment_items WHERE key = 'letter_dead_colleague'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sage:phb'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 50, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sage:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 60, '', 'Contains 10 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sailor:phb'), (SELECT id FROM public.equipment_items WHERE key = 'club'), 1, 10, '', 'Represents the background''s belaying pin'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sailor:phb'), (SELECT id FROM public.equipment_items WHERE key = 'silk_rope_50ft'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sailor:phb'), (SELECT id FROM public.equipment_items WHERE key = 'lucky_charm'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sailor:phb'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sailor:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 50, '', 'Contains 10 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:soldier:phb'), (SELECT id FROM public.equipment_items WHERE key = 'insignia_of_rank'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:soldier:phb'), (SELECT id FROM public.equipment_items WHERE key = 'trophy_from_fallen_enemy'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:soldier:phb'), (SELECT id FROM public.equipment_items WHERE key = 'gaming_set_choice'), 1, 30, '', 'Represents bone dice or a deck of cards'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:soldier:phb'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:soldier:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 50, '', 'Contains 10 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:urchin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'small_knife'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:urchin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'map_of_city'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:urchin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'pet_mouse'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:urchin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'parental_token'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:urchin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 50, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:urchin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 60, '', 'Contains 10 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:barbarian:phb'), (SELECT id FROM public.equipment_items WHERE key = 'greataxe'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:barbarian:phb'), (SELECT id FROM public.equipment_items WHERE key = 'martial_melee_weapon_choice'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:barbarian:phb'), (SELECT id FROM public.equipment_items WHERE key = 'handaxe'), 2, 30, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:barbarian:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 40, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:barbarian:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 50, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:barbarian:phb'), (SELECT id FROM public.equipment_items WHERE key = 'javelin'), 4, 60, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'rapier'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'longsword'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 30, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'diplomats_pack'), 1, 40, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'entertainers_pack'), 1, 50, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'musical_instrument_choice'), 1, 60, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 1, 70, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dagger'), 1, 80, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'mace'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'warhammer'), 1, 20, 'primary_weapon', 'Requires martial weapon proficiency from the chosen domain'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'scale_mail'), 1, 30, 'armor', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 1, 40, 'armor', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'chain_mail'), 1, 50, 'armor', 'Requires heavy armor proficiency from the chosen domain'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'light_crossbow_and_20_bolts_set'), 1, 60, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 70, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'priests_pack'), 1, 80, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 90, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shield'), 1, 100, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb'), (SELECT id FROM public.equipment_items WHERE key = 'holy_symbol'), 1, 110, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shield'), 1, 10, 'primary_weapon', 'Represents the druid''s wooden shield option'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb'), (SELECT id FROM public.equipment_items WHERE key = 'scimitar'), 1, 30, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_melee_weapon_choice'), 1, 40, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb'), (SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 1, 50, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 60, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb'), (SELECT id FROM public.equipment_items WHERE key = 'druidic_focus_choice'), 1, 70, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'chain_mail'), 1, 10, 'armor_loadout', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'archer_fighter_loadout'), 1, 20, 'armor_loadout', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'martial_weapon_and_shield_set'), 1, 30, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'two_martial_weapons_set'), 1, 40, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'light_crossbow_and_20_bolts_set'), 1, 50, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'handaxe'), 2, 60, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dungeoneers_pack'), 1, 70, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 80, 'pack', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:monk:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shortsword'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:monk:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:monk:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dungeoneers_pack'), 1, 30, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:monk:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 40, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:monk:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dart'), 10, 50, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'martial_weapon_and_shield_set'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'two_martial_weapons_set'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'javelin'), 5, 30, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_melee_weapon_choice'), 1, 40, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'priests_pack'), 1, 50, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 60, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'chain_mail'), 1, 70, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb'), (SELECT id FROM public.equipment_items WHERE key = 'holy_symbol'), 1, 80, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb'), (SELECT id FROM public.equipment_items WHERE key = 'scale_mail'), 1, 10, 'armor', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb'), (SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 1, 20, 'armor', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shortsword'), 2, 30, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb'), (SELECT id FROM public.equipment_items WHERE key = 'two_simple_melee_weapons_set'), 1, 40, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dungeoneers_pack'), 1, 50, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 60, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb'), (SELECT id FROM public.equipment_items WHERE key = 'longbow_and_20_arrows_set'), 1, 70, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'rapier'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shortsword'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shortbow_and_20_arrows_set'), 1, 30, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'shortsword'), 1, 40, 'secondary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'burglars_pack'), 1, 50, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dungeoneers_pack'), 1, 60, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 70, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 1, 80, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dagger'), 2, 90, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb'), (SELECT id FROM public.equipment_items WHERE key = 'thieves_tools_kit'), 1, 100, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'light_crossbow_and_20_bolts_set'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'component_pouch'), 1, 30, 'focus', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'arcane_focus_choice'), 1, 40, 'focus', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dungeoneers_pack'), 1, 50, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 60, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dagger'), 2, 70, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'light_crossbow_and_20_bolts_set'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'component_pouch'), 1, 30, 'focus', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'arcane_focus_choice'), 1, 40, 'focus', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'scholars_pack'), 1, 50, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dungeoneers_pack'), 1, 60, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 1, 70, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'simple_weapon_choice'), 1, 80, '', 'Represents the additional simple weapon granted by the PHB warlock package'),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dagger'), 2, 90, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'quarterstaff'), 1, 10, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'dagger'), 1, 20, 'primary_weapon', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'component_pouch'), 1, 30, 'focus', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'arcane_focus_choice'), 1, 40, 'focus', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'scholars_pack'), 1, 50, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'explorers_pack'), 1, 60, 'pack', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb'), (SELECT id FROM public.equipment_items WHERE key = 'spellbook'), 1, 70, '', NULL)
ON CONFLICT (package_id, item_id, choice_group) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  item_order = EXCLUDED.item_order,
  notes = EXCLUDED.notes;

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:phb')
WHERE name = 'Acolyte' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:charlatan:phb')
WHERE name = 'Charlatan' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:criminal:phb')
WHERE name = 'Criminal' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:entertainer:phb')
WHERE name = 'Entertainer' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:folk_hero:phb')
WHERE name = 'Folk Hero' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:guild_artisan:phb')
WHERE name = 'Guild Artisan' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:hermit:phb')
WHERE name = 'Hermit' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:noble:phb')
WHERE name = 'Noble' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:outlander:phb')
WHERE name = 'Outlander' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sage:phb')
WHERE name = 'Sage' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:sailor:phb')
WHERE name = 'Sailor' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:soldier:phb')
WHERE name = 'Soldier' AND source = 'PHB';

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:urchin:phb')
WHERE name = 'Urchin' AND source = 'PHB';

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:barbarian:phb')
WHERE name = 'Barbarian' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:bard:phb')
WHERE name = 'Bard' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:cleric:phb')
WHERE name = 'Cleric' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:druid:phb')
WHERE name = 'Druid' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:phb')
WHERE name = 'Fighter' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:monk:phb')
WHERE name = 'Monk' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:paladin:phb')
WHERE name = 'Paladin' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:ranger:phb')
WHERE name = 'Ranger' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:phb')
WHERE name = 'Rogue' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:sorcerer:phb')
WHERE name = 'Sorcerer' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:warlock:phb')
WHERE name = 'Warlock' AND source IN ('PHB', 'SRD', 'srd');

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:phb')
WHERE name = 'Wizard' AND source IN ('PHB', 'SRD', 'srd');
