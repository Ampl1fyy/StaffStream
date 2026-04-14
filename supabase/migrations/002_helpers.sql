-- ─────────────────────────────────────────
-- HELPER: nearby workers for matching engine
-- ─────────────────────────────────────────
create or replace function public.get_nearby_workers(
  shift_lat double precision,
  shift_lng double precision,
  radius_meters int default 5000,
  required_skill_id int default null
)
returns setof public.profiles language sql stable security definer as $$
  select p.* from public.profiles p
  left join public.worker_skills ws on ws.worker_id = p.id
  where p.role = 'worker'
    and p.is_active = true
    and p.location is not null
    and p.fcm_token is not null
    and (required_skill_id is null or ws.skill_id = required_skill_id)
    and st_dwithin(
      p.location,
      st_point(shift_lng, shift_lat)::geography,
      radius_meters
    )
  group by p.id
  order by st_distance(p.location, st_point(shift_lng, shift_lat)::geography) asc;
$$;
