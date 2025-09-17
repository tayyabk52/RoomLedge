-- Function to automatically create a profile when a user signs up
-- This should be run in Supabase SQL Editor after the main schema

-- Create function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to run the function when a new user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS (Row Level Security) for production safety
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.bills enable row level security;
alter table public.bill_participants enable row level security;
alter table public.bill_payers enable row level security;
alter table public.bill_settlements enable row level security;
alter table public.bill_receipts enable row level security;
alter table public.notifications enable row level security;

-- Basic RLS policies for profiles (users can only see/edit their own profile)
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- RLS policies for rooms (members can see rooms they belong to)
create policy "Users can view rooms they belong to" on rooms
  for select using (
    exists (
      select 1 from room_members
      where room_members.room_id = rooms.id
      and room_members.user_id = auth.uid()
    )
  );

create policy "Users can create rooms" on rooms
  for insert with check (auth.uid() = created_by);

-- RLS policies for room_members
create policy "Users can view room members for their rooms" on room_members
  for select using (
    exists (
      select 1 from room_members rm
      where rm.room_id = room_members.room_id
      and rm.user_id = auth.uid()
    )
  );

create policy "Users can join rooms" on room_members
  for insert with check (auth.uid() = user_id);

-- RLS policies for bills (room members can see bills in their rooms)
create policy "Users can view bills in their rooms" on bills
  for select using (
    exists (
      select 1 from room_members
      where room_members.room_id = bills.room_id
      and room_members.user_id = auth.uid()
    )
  );

create policy "Users can create bills in their rooms" on bills
  for insert with check (
    exists (
      select 1 from room_members
      where room_members.room_id = bills.room_id
      and room_members.user_id = auth.uid()
    )
  );

-- Similar policies for other tables
create policy "Users can view bill participants for their bills" on bill_participants
  for select using (
    exists (
      select 1 from bills b
      join room_members rm on rm.room_id = b.room_id
      where b.id = bill_participants.bill_id
      and rm.user_id = auth.uid()
    )
  );

create policy "Users can add bill participants for their bills" on bill_participants
  for insert with check (
    exists (
      select 1 from bills b
      join room_members rm on rm.room_id = b.room_id
      where b.id = bill_participants.bill_id
      and rm.user_id = auth.uid()
    )
  );

create policy "Users can view bill payers for their bills" on bill_payers
  for select using (
    exists (
      select 1 from bills b
      join room_members rm on rm.room_id = b.room_id
      where b.id = bill_payers.bill_id
      and rm.user_id = auth.uid()
    )
  );

create policy "Users can add bill payers for their bills" on bill_payers
  for insert with check (
    exists (
      select 1 from bills b
      join room_members rm on rm.room_id = b.room_id
      where b.id = bill_payers.bill_id
      and rm.user_id = auth.uid()
    )
  );

create policy "Users can view settlements for their bills" on bill_settlements
  for select using (
    exists (
      select 1 from bills b
      join room_members rm on rm.room_id = b.room_id
      where b.id = bill_settlements.bill_id
      and rm.user_id = auth.uid()
    )
  );

create policy "Users can create settlements for their bills" on bill_settlements
  for insert with check (
    exists (
      select 1 from bills b
      join room_members rm on rm.room_id = b.room_id
      where b.id = bill_settlements.bill_id
      and rm.user_id = auth.uid()
    )
  );

create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "System can create notifications for users" on notifications
  for insert with check (true);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;