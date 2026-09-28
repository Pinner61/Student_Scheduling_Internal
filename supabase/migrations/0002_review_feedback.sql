-- Review-feedback iteration.
-- Rejection justification already lives on schedule_exceptions.review_note,
-- with reviewed_by / reviewed_at. No new exception columns are required.
-- Coverage thresholds remain optional and default off for Creative Strategy.

update public.application_settings
set value = coalesce(value, '{}'::jsonb) || '{"coverageThresholdsEnabled": false}'::jsonb
where key = 'app';

comment on column public.schedule_exceptions.review_note is
  'Supervisor justification. Required when status is DECLINED (shown to students as Rejected).';
