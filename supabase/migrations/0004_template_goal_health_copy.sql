-- Refresh shipped template goal copy for DBs that already ran the original seed.

update public.goals
set
  title = 'Core & mobility',
  description =
    'Daily check-in when you finish core, mobility, or planned rehab work — builds a streak.',
  icon = 'flame',
  color = 'orange',
  is_public = true
where
  is_template = true
  and title = 'Ab Challenge';

update public.goals
set
  title = 'Strength sessions',
  description =
    'Log each strength, Pilates, or studio workout; week resets Monday.',
  icon = 'dumbbell',
  color = 'teal',
  is_public = true
where
  is_template = true
  and title = 'BFT Sessions';

update public.goals
set
  title = 'Runs this week',
  description =
    'Count each run Mon–Sun — easy to share with a running group or coach.',
  icon = 'footprints',
  color = 'sky',
  is_public = true
where
  is_template = true
  and title = 'Run Count';
