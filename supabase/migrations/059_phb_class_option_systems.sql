-- PHB 2014 behavior completion, slice 3i:
-- seed reusable class option families for Battle Master maneuvers,
-- Hunter choice trees, Circle of the Land terrain, and
-- Way of the Four Elements disciplines.

INSERT INTO public.feature_option_groups (
  key,
  name,
  option_family,
  description,
  selection_limit,
  allows_duplicate_selections,
  metadata,
  source
)
VALUES
  (
    'maneuver:battle_master:2014',
    'Battle Master Maneuvers (2014)',
    'maneuver',
    '2014 PHB Battle Master maneuvers.',
    1,
    false,
    '{"subclass_name":"Battle Master","rule_set":"2014","selection_mode":"per_slot"}'::jsonb,
    'PHB'
  ),
  (
    'hunter:hunters_prey:2014',
    'Hunter''s Prey (2014)',
    'hunter_option',
    '2014 PHB Hunter''s Prey options.',
    1,
    false,
    '{"subclass_name":"Hunter","feature_name":"Hunter''s Prey","rule_set":"2014"}'::jsonb,
    'PHB'
  ),
  (
    'hunter:defensive_tactics:2014',
    'Defensive Tactics (2014)',
    'hunter_option',
    '2014 PHB Defensive Tactics options.',
    1,
    false,
    '{"subclass_name":"Hunter","feature_name":"Defensive Tactics","rule_set":"2014"}'::jsonb,
    'PHB'
  ),
  (
    'hunter:multiattack:2014',
    'Hunter Multiattack (2014)',
    'hunter_option',
    '2014 PHB Hunter Multiattack options.',
    1,
    false,
    '{"subclass_name":"Hunter","feature_name":"Multiattack","rule_set":"2014"}'::jsonb,
    'PHB'
  ),
  (
    'hunter:superior_defense:2014',
    'Superior Hunter''s Defense (2014)',
    'hunter_option',
    '2014 PHB Superior Hunter''s Defense options.',
    1,
    false,
    '{"subclass_name":"Hunter","feature_name":"Superior Hunter''s Defense","rule_set":"2014"}'::jsonb,
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'Circle of the Land Terrain (2014)',
    'terrain_choice',
    '2014 PHB Circle of the Land terrain choices.',
    1,
    false,
    '{"subclass_name":"Circle of the Land","rule_set":"2014"}'::jsonb,
    'PHB'
  ),
  (
    'elemental_discipline:four_elements:2014',
    'Way of the Four Elements Disciplines (2014)',
    'elemental_discipline',
    '2014 PHB elemental disciplines for the Way of the Four Elements.',
    1,
    false,
    '{"subclass_name":"Way of the Four Elements","rule_set":"2014","selection_mode":"per_slot"}'::jsonb,
    'PHB'
  )
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  option_family = EXCLUDED.option_family,
  description = EXCLUDED.description,
  selection_limit = EXCLUDED.selection_limit,
  allows_duplicate_selections = EXCLUDED.allows_duplicate_selections,
  metadata = EXCLUDED.metadata,
  source = EXCLUDED.source;

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
  ('maneuver:battle_master:2014', 'commanders_strike', 'Commander''s Strike', 'Direct an ally to strike instead of making one of your own attacks.', 10, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'disarming_attack', 'Disarming Attack', 'Use a superiority die to force a target to drop a held item.', 20, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'distracting_strike', 'Distracting Strike', 'Set up an ally by making the next attack against your target easier.', 30, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'evasive_footwork', 'Evasive Footwork', 'Spend a superiority die to improve your defense while moving.', 40, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'feinting_attack', 'Feinting Attack', 'Use a bonus action and superiority die to gain advantage on one attack.', 50, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'goading_attack', 'Goading Attack', 'Pressure a foe so it struggles to attack anyone but you.', 60, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'lunging_attack', 'Lunging Attack', 'Extend your reach for one attack and add superiority damage.', 70, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'maneuvering_attack', 'Maneuvering Attack', 'Create an opening that lets an ally move without provoking.', 80, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'menacing_attack', 'Menacing Attack', 'Rattle a target with a frightening superiority-fueled strike.', 90, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'parry', 'Parry', 'Reduce melee damage taken by expending a superiority die as a reaction.', 100, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'precision_attack', 'Precision Attack', 'Add a superiority die to an attack roll after seeing the d20 result.', 110, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'pushing_attack', 'Pushing Attack', 'Drive a target backward with a forceful superiority strike.', 120, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'rally', 'Rally', 'Bolster an ally with temporary hit points from your superiority die.', 130, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'riposte', 'Riposte', 'Punish a missed melee attack with a reaction strike and superiority damage.', 140, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'sweeping_attack', 'Sweeping Attack', 'Carry excess damage into a second nearby target.', 150, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('maneuver:battle_master:2014', 'trip_attack', 'Trip Attack', 'Knock a target prone with a superiority-enhanced strike.', 160, '{}'::jsonb, '{}'::jsonb, 'PHB'),

  ('hunter:hunters_prey:2014', 'colossus_slayer', 'Colossus Slayer', 'Deal extra damage once per turn to a wounded target.', 10, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('hunter:hunters_prey:2014', 'giant_killer', 'Giant Killer', 'Make a reaction attack when a Large or larger foe misses you.', 20, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('hunter:hunters_prey:2014', 'horde_breaker', 'Horde Breaker', 'Make an extra attack against a second nearby enemy once per turn.', 30, '{}'::jsonb, '{}'::jsonb, 'PHB'),

  ('hunter:defensive_tactics:2014', 'escape_the_horde', 'Escape the Horde', 'Creatures making opportunity attacks against you do so with disadvantage.', 10, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('hunter:defensive_tactics:2014', 'multiattack_defense', 'Multiattack Defense', 'A creature you have been hit by becomes less accurate with later attacks.', 20, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('hunter:defensive_tactics:2014', 'steel_will', 'Steel Will', 'Gain advantage on saves against being frightened.', 30, '{}'::jsonb, '{}'::jsonb, 'PHB'),

  ('hunter:multiattack:2014', 'volley', 'Volley', 'Make a ranged attack against every target in a chosen area.', 10, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('hunter:multiattack:2014', 'whirlwind_attack', 'Whirlwind Attack', 'Make one melee attack against each creature within your reach.', 20, '{}'::jsonb, '{}'::jsonb, 'PHB'),

  ('hunter:superior_defense:2014', 'evasion', 'Evasion', 'Turn some Dexterity-save damage into none or half.', 10, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('hunter:superior_defense:2014', 'stand_against_the_tide', 'Stand Against the Tide', 'Redirect a missed melee attack toward another creature.', 20, '{}'::jsonb, '{}'::jsonb, 'PHB'),
  ('hunter:superior_defense:2014', 'uncanny_dodge', 'Uncanny Dodge', 'Use your reaction to halve the damage of an attack that hits you.', 30, '{}'::jsonb, '{}'::jsonb, 'PHB'),

  (
    'circle_of_land:terrain:2014',
    'arctic',
    'Arctic',
    'Arctic circle spells focus on restraint, terrain control, and cold.',
    10,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Hold Person', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:hold_person'),
        jsonb_build_object('spell_name', 'Spike Growth', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:spike_growth'),
        jsonb_build_object('spell_name', 'Sleet Storm', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:sleet_storm'),
        jsonb_build_object('spell_name', 'Slow', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:slow'),
        jsonb_build_object('spell_name', 'Freedom of Movement', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:freedom_of_movement'),
        jsonb_build_object('spell_name', 'Ice Storm', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:ice_storm'),
        jsonb_build_object('spell_name', 'Commune with Nature', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:commune_with_nature'),
        jsonb_build_object('spell_name', 'Cone of Cold', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:arctic:cone_of_cold')
      )
    ),
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'coast',
    'Coast',
    'Coast circle spells blend illusion, mobility, and water magic.',
    20,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Mirror Image', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:mirror_image'),
        jsonb_build_object('spell_name', 'Misty Step', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:misty_step'),
        jsonb_build_object('spell_name', 'Water Breathing', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:water_breathing'),
        jsonb_build_object('spell_name', 'Water Walk', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:water_walk'),
        jsonb_build_object('spell_name', 'Control Water', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:control_water'),
        jsonb_build_object('spell_name', 'Freedom of Movement', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:freedom_of_movement'),
        jsonb_build_object('spell_name', 'Conjure Elemental', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:conjure_elemental'),
        jsonb_build_object('spell_name', 'Scrying', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:coast:scrying')
      )
    ),
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'desert',
    'Desert',
    'Desert circle spells emphasize endurance, concealment, and harsh terrain.',
    30,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Blur', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:blur'),
        jsonb_build_object('spell_name', 'Silence', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:silence'),
        jsonb_build_object('spell_name', 'Create Food and Water', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:create_food_and_water'),
        jsonb_build_object('spell_name', 'Protection from Energy', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:protection_from_energy'),
        jsonb_build_object('spell_name', 'Blight', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:blight'),
        jsonb_build_object('spell_name', 'Hallucinatory Terrain', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:hallucinatory_terrain'),
        jsonb_build_object('spell_name', 'Insect Plague', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:insect_plague'),
        jsonb_build_object('spell_name', 'Wall of Stone', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:desert:wall_of_stone')
      )
    ),
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'forest',
    'Forest',
    'Forest circle spells emphasize mobility, storms, and woodland insight.',
    40,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Barkskin', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:barkskin'),
        jsonb_build_object('spell_name', 'Spider Climb', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:spider_climb'),
        jsonb_build_object('spell_name', 'Call Lightning', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:call_lightning'),
        jsonb_build_object('spell_name', 'Plant Growth', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:plant_growth'),
        jsonb_build_object('spell_name', 'Divination', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:divination'),
        jsonb_build_object('spell_name', 'Freedom of Movement', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:freedom_of_movement'),
        jsonb_build_object('spell_name', 'Commune with Nature', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:commune_with_nature'),
        jsonb_build_object('spell_name', 'Tree Stride', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:forest:tree_stride')
      )
    ),
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'grassland',
    'Grassland',
    'Grassland circle spells focus on stealth, speed, and farsight.',
    50,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Invisibility', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:invisibility'),
        jsonb_build_object('spell_name', 'Pass without Trace', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:pass_without_trace'),
        jsonb_build_object('spell_name', 'Daylight', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:daylight'),
        jsonb_build_object('spell_name', 'Haste', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:haste'),
        jsonb_build_object('spell_name', 'Divination', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:divination'),
        jsonb_build_object('spell_name', 'Freedom of Movement', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:freedom_of_movement'),
        jsonb_build_object('spell_name', 'Dream', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:dream'),
        jsonb_build_object('spell_name', 'Insect Plague', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:grassland:insect_plague')
      )
    ),
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'mountain',
    'Mountain',
    'Mountain circle spells favor climbing, stone, and explosive force.',
    60,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Spider Climb', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:spider_climb'),
        jsonb_build_object('spell_name', 'Spike Growth', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:spike_growth'),
        jsonb_build_object('spell_name', 'Lightning Bolt', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:lightning_bolt'),
        jsonb_build_object('spell_name', 'Meld into Stone', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:meld_into_stone'),
        jsonb_build_object('spell_name', 'Stone Shape', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:stone_shape'),
        jsonb_build_object('spell_name', 'Stoneskin', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:stoneskin'),
        jsonb_build_object('spell_name', 'Passwall', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:passwall'),
        jsonb_build_object('spell_name', 'Wall of Stone', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:mountain:wall_of_stone')
      )
    ),
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'swamp',
    'Swamp',
    'Swamp circle spells blend rot, concealment, and tracking through marshes.',
    70,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Darkness', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:darkness'),
        jsonb_build_object('spell_name', 'Melf''s Acid Arrow', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:melfs_acid_arrow'),
        jsonb_build_object('spell_name', 'Water Walk', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:water_walk'),
        jsonb_build_object('spell_name', 'Stinking Cloud', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:stinking_cloud'),
        jsonb_build_object('spell_name', 'Freedom of Movement', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:freedom_of_movement'),
        jsonb_build_object('spell_name', 'Locate Creature', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:locate_creature'),
        jsonb_build_object('spell_name', 'Insect Plague', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:insect_plague'),
        jsonb_build_object('spell_name', 'Scrying', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:swamp:scrying')
      )
    ),
    'PHB'
  ),
  (
    'circle_of_land:terrain:2014',
    'underdark',
    'Underdark',
    'Underdark circle spells focus on webs, fumes, and lethal concealment.',
    80,
    '{}'::jsonb,
    jsonb_build_object(
      'spell_grants',
      jsonb_build_array(
        jsonb_build_object('spell_name', 'Spider Climb', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:spider_climb'),
        jsonb_build_object('spell_name', 'Web', 'min_class_level', 3, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:web'),
        jsonb_build_object('spell_name', 'Gaseous Form', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:gaseous_form'),
        jsonb_build_object('spell_name', 'Stinking Cloud', 'min_class_level', 5, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:stinking_cloud'),
        jsonb_build_object('spell_name', 'Greater Invisibility', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:greater_invisibility'),
        jsonb_build_object('spell_name', 'Stone Shape', 'min_class_level', 7, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:stone_shape'),
        jsonb_build_object('spell_name', 'Cloudkill', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:cloudkill'),
        jsonb_build_object('spell_name', 'Insect Plague', 'min_class_level', 9, 'source_feature_key', 'subclass_feature:circle_of_the_land:underdark:insect_plague')
      )
    ),
    'PHB'
  ),

  ('elemental_discipline:four_elements:2014', 'fangs_of_the_fire_snake', 'Fangs of the Fire Snake', 'Extend your strikes with fire and add extra fire damage by spending ki.', 10, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'fist_of_four_thunders', 'Fist of Four Thunders', 'Unleash thunderous force in a close blast fueled by ki.', 20, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'fist_of_unbroken_air', 'Fist of Unbroken Air', 'Hammer a creature with compressed air and hurl it away.', 30, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'rush_of_the_gale_spirits', 'Rush of the Gale Spirits', 'Ride a burst of wind that batters creatures in a line.', 40, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'shape_the_flowing_river', 'Shape the Flowing River', 'Freeze or reshape water and ice around you.', 50, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'shaping_of_the_ice', 'Shaping of the Ice', 'Carve and move ice as a flexible elemental working.', 60, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'sweeping_cinder_strike', 'Sweeping Cinder Strike', 'Whip out a wave of cinders and flame in a broad arc.', 70, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'water_whip', 'Water Whip', 'Crack a lash of water that drags or knocks down a target.', 80, jsonb_build_object('minimum_class_level', 3), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'clench_of_the_north_wind', 'Clench of the North Wind', 'Lock down a creature with bitter cold and ki.', 90, jsonb_build_object('minimum_class_level', 6), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'gong_of_the_summit', 'Gong of the Summit', 'Send out a resonant blast of thunderous force.', 100, jsonb_build_object('minimum_class_level', 6), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'flames_of_the_phoenix', 'Flames of the Phoenix', 'Explode outward in fire at the center of the effect.', 110, jsonb_build_object('minimum_class_level', 11), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'mist_stance', 'Mist Stance', 'Turn into mist for a brief elemental escape.', 120, jsonb_build_object('minimum_class_level', 11), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'ride_the_wind', 'Ride the Wind', 'Take to the air on sustained elemental currents.', 130, jsonb_build_object('minimum_class_level', 11), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'breath_of_winter', 'Breath of Winter', 'Exhale an intense cone of cold through gathered ki.', 140, jsonb_build_object('minimum_class_level', 17), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'eternal_mountain_defense', 'Eternal Mountain Defense', 'Wrap yourself in stone-hard elemental protection.', 150, jsonb_build_object('minimum_class_level', 17), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'river_of_hungry_flame', 'River of Hungry Flame', 'Conjure a roving line of flame that scorches enemies.', 160, jsonb_build_object('minimum_class_level', 17), '{}'::jsonb, 'PHB'),
  ('elemental_discipline:four_elements:2014', 'wave_of_rolling_earth', 'Wave of Rolling Earth', 'Send a crushing wave of stone and earth across the battlefield.', 170, jsonb_build_object('minimum_class_level', 17), '{}'::jsonb, 'PHB')
ON CONFLICT (group_key, key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  option_order = EXCLUDED.option_order,
  prerequisites = EXCLUDED.prerequisites,
  effects = EXCLUDED.effects,
  source = EXCLUDED.source;

UPDATE public.subclasses
SET
  amended = true,
  amendment_note = 'Maneuver selections are modeled; superiority-die tracking, Student of War tool choice, and Know Your Enemy analysis are still not automated.'
WHERE name = 'Battle Master' AND source = 'PHB';

UPDATE public.subclasses
SET
  amended = true,
  amendment_note = 'Hunter option selections are modeled; the combat effects of those options are still not automated.'
WHERE name = 'Hunter' AND source = 'PHB';

UPDATE public.subclasses
SET
  amended = true,
  amendment_note = 'Land terrain choice and circle spells are modeled; bonus cantrip and Natural Recovery behavior are still not automated.'
WHERE name = 'Circle of the Land' AND source = 'PHB';

UPDATE public.subclasses
SET
  amended = true,
  amendment_note = 'Elemental discipline selections are modeled; ki spending and discipline effects are still not automated.'
WHERE name = 'Way of the Four Elements' AND source = 'PHB';
