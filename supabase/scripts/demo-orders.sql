-- Local demo data for the admin dashboard: 60 days of random orders.
-- Run:   docker exec -i supabase_db_FoodOrdering psql -U postgres < supabase/scripts/demo-orders.sql
-- Undo:  delete from public.orders where payment_intent_id like 'demo_%';  (items go by ON DELETE CASCADE)
-- payment_intent_id is unique (webhook idempotency), so each demo order gets its own 'demo_<uuid>'.
do $$
declare
  v_user uuid := (select id from public.profiles where "group" = 'USER' limit 1);
  v_today date := (now() at time zone 'Europe/Kyiv')::date;
  v_day date;
  v_order bigint;
begin
  for v_day in select generate_series(v_today - 59, v_today, interval '1 day')::date loop
    for i in 1 .. floor(random() * 6)::int loop
      insert into public.orders (user_id, status, total, payment_intent_id, created_at)
      values (
        v_user,
        -- old orders are delivered, recent ones are anywhere in the flow
        case when v_day < v_today - 1 then 'Delivered'
             else (array['New', 'Cooking', 'Delivering', 'Delivered'])[1 + floor(random() * 4)::int] end,
        0,
        'demo_' || gen_random_uuid(),
        -- 10:00-22:00 Kyiv time, never in the future
        least(
          (v_day + time '10:00' + random() * interval '12 hours') at time zone 'Europe/Kyiv',
          now()
        )
      )
      returning id into v_order;

      -- 1-3 different menu products; lower ids are picked more often, so the top chart is not flat
      insert into public.order_items (order_id, product_id, size, quantity)
      select v_order, p.id, (array['S', 'M', 'L', 'XL'])[1 + floor(random() * 4)::int], 1 + floor(random() * 3)::int
      from public.products p
      where p.archived_at is null
      order by random() * p.id
      limit 1 + floor(random() * 3)::int;

      -- same rule as priceCart: total = sum of current price * quantity
      update public.orders o
      set total = (
        select round(sum(p.price * oi.quantity)::numeric, 2)
        from public.order_items oi
        join public.products p on p.id = oi.product_id
        where oi.order_id = o.id
      )
      where o.id = v_order;
    end loop;
  end loop;
end $$;
