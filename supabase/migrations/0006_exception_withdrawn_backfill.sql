-- Historical pending cancellations were stored as CANCELLED with no review stamp.
-- Map those rows to WITHDRAWN. Approved-then-cancelled rows keep CANCELLED.

update public.schedule_exceptions
set status = 'WITHDRAWN'
where status = 'CANCELLED'
  and reviewed_at is null;
