create or replace function public.increment_store_views(p_store_id bigint)
returns integer
language sql
volatile
set search_path = public
as $$
  update public.stores
  set views = coalesce(views, 0) + 1
  where id = p_store_id
  returning views;
$$;

revoke all on function public.increment_store_views(bigint) from public;
revoke all on function public.increment_store_views(bigint) from anon;
revoke all on function public.increment_store_views(bigint) from authenticated;
grant execute on function public.increment_store_views(bigint) to service_role;

create or replace function public.increment_product_views(p_product_id uuid)
returns integer
language sql
volatile
set search_path = public
as $$
  update public.products
  set views = coalesce(views, 0) + 1
  where id = p_product_id
  returning views;
$$;

revoke all on function public.increment_product_views(uuid) from public;
revoke all on function public.increment_product_views(uuid) from anon;
revoke all on function public.increment_product_views(uuid) from authenticated;
grant execute on function public.increment_product_views(uuid) to service_role;
