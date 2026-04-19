-- If the goals table exists but the seed INSERT never ran (or rows were deleted),
-- onboarding and /goals will show no templates. This block is safe to re-run.

do $$
begin
  if (select count(*)::int from public.goals where is_template = true) > 0 then
    return;
  end if;

  insert into public.goals (
    owner_id,
    title,
    description,
    type,
    target_per_period,
    icon,
    color,
    is_template
  )
  values
    (
      null,
      'Core & mobility',
      'Daily check-in when you finish core, mobility, or planned rehab work — builds a streak.',
      'daily_binary',
      null,
      'flame',
      'orange',
      true
    ),
    (
      null,
      'Strength sessions',
      'Log each strength, Pilates, or studio workout; week resets Monday.',
      'weekly_count',
      3,
      'dumbbell',
      'teal',
      true
    ),
    (
      null,
      'Runs this week',
      'Count each run Mon–Sun — easy to share with a running group or coach.',
      'weekly_count',
      3,
      'footprints',
      'sky',
      true
    );
end;
$$;
