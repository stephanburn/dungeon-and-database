CREATE TABLE public.character_skill_proficiencies (
  character_id uuid    NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  skill        text    NOT NULL,
  expertise    boolean NOT NULL DEFAULT false,
  PRIMARY KEY (character_id, skill)
);

ALTER TABLE public.character_skill_proficiencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "char_skills_select" ON public.character_skill_proficiencies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_skills_insert_own" ON public.character_skill_proficiencies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_skills_update_own" ON public.character_skill_proficiencies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_skills_delete_own" ON public.character_skill_proficiencies
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );
