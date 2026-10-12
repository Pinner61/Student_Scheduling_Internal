-- Add WITHDRAWN so pending requests can be withdrawn without reusing CANCELLED.
-- CANCELLED remains the status for an approved exception that was later cancelled.

do $$ begin
  alter type public.exception_status add value 'WITHDRAWN';
exception
  when duplicate_object then null;
end $$;
