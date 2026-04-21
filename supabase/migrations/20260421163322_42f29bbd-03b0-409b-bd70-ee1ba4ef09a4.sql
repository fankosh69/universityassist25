CREATE OR REPLACE FUNCTION public.award_user_badge(_badge_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  badge_uuid uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id INTO badge_uuid FROM public.badges WHERE code = _badge_code LIMIT 1;
  IF badge_uuid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'badge_not_found');
  END IF;

  INSERT INTO public.user_badges (profile_id, badge_id)
  VALUES (current_user_id, badge_uuid)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'badge_id', badge_uuid);
END;
$$;