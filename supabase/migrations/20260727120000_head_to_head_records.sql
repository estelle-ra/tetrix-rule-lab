create table if not exists public.head_to_head_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  games_played integer not null default 0 check (games_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  last_played_at timestamptz not null default now(),
  primary key (user_id, opponent_id),
  constraint head_to_head_distinct_players check (user_id <> opponent_id),
  constraint head_to_head_games_balance check (
    games_played = wins + losses
  )
);

create table if not exists public.versus_match_submissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, match_key),
  constraint versus_match_key_length check (
    char_length(match_key) between 8 and 80
  )
);

alter table public.head_to_head_records enable row level security;
alter table public.versus_match_submissions enable row level security;

revoke all on public.head_to_head_records
  from public, anon, authenticated;
revoke all on public.versus_match_submissions
  from public, anon, authenticated;
grant select on public.head_to_head_records to authenticated;

drop policy if exists "players read own head to head records"
  on public.head_to_head_records;
create policy "players read own head to head records"
on public.head_to_head_records for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.submit_head_to_head(
  p_match_key text,
  p_results jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  player_id uuid := auth.uid();
  result jsonb;
  opponent uuid;
  player_won boolean;
  inserted_count integer;
begin
  if player_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if char_length(trim(p_match_key)) not between 8 and 80 then
    raise exception 'INVALID_MATCH_KEY';
  end if;
  if jsonb_typeof(p_results) <> 'array'
    or jsonb_array_length(p_results) > 7 then
    raise exception 'INVALID_MATCH_RESULTS';
  end if;

  insert into public.versus_match_submissions (user_id, match_key)
  values (player_id, trim(p_match_key))
  on conflict do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    return;
  end if;

  for result in select value from jsonb_array_elements(p_results)
  loop
    begin
      opponent := (result ->> 'opponent_id')::uuid;
      player_won := (result ->> 'won')::boolean;
    exception when others then
      raise exception 'INVALID_MATCH_RESULT';
    end;

    if opponent = player_id
      or not exists (
        select 1 from public.profiles where id = opponent
      ) then
      raise exception 'INVALID_OPPONENT';
    end if;

    insert into public.head_to_head_records (
      user_id,
      opponent_id,
      games_played,
      wins,
      losses,
      last_played_at
    )
    values (
      player_id,
      opponent,
      1,
      case when player_won then 1 else 0 end,
      case when player_won then 0 else 1 end,
      now()
    )
    on conflict (user_id, opponent_id) do update
    set
      games_played = public.head_to_head_records.games_played + 1,
      wins = public.head_to_head_records.wins
        + case when player_won then 1 else 0 end,
      losses = public.head_to_head_records.losses
        + case when player_won then 0 else 1 end,
      last_played_at = now();
  end loop;
end;
$$;

revoke all on function public.submit_head_to_head(text, jsonb)
  from public;
grant execute on function public.submit_head_to_head(text, jsonb)
  to authenticated;
