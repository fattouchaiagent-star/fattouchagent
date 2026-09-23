-- Allow either participant to mark messages as read without allowing
-- either participant to impersonate the sender of a message.
create or replace function public.prevent_message_sender_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_id <> old.sender_id then
    raise exception 'message sender cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_sender_immutable on public.messages;
create trigger messages_sender_immutable
before update on public.messages
for each row execute function public.prevent_message_sender_change();

drop policy if exists messages_participant_update on public.messages;
create policy messages_participant_update
on public.messages
for update
using (
  sender_id = auth.uid()
  or exists (
    select 1
    from public.contact_requests cr
    join public.listings l on l.id = cr.listing_id
    where cr.id = contact_request_id
      and (cr.requester_id = auth.uid() or l.owner_id = auth.uid())
  )
  or public.is_admin()
)
with check (
  exists (
    select 1
    from public.contact_requests cr
    join public.listings l on l.id = cr.listing_id
    where cr.id = contact_request_id
      and (cr.requester_id = auth.uid() or l.owner_id = auth.uid())
  )
  or public.is_admin()
);
