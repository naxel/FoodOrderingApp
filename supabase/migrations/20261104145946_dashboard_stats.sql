create function public.orders_per_day(p_days int default 30)
  returns table (day date, orders bigint, revenue numeric)
  language sql stable
set search_path = ''
as $$
  with days as (
    select generate_series(
      (now() at time zone 'Europe/Kyiv')::date - (p_days - 1),
      (now() at time zone 'Europe/Kyiv')::date,
      interval '1 day'
    )::date as day
  )
select
  d.day,
  count(o.id) as orders,
  coalesce(round(sum(o.total)::numeric, 2), 0) as revenue
from days d
       left join public.orders o
                 on (o.created_at at time zone 'Europe/Kyiv')::date = d.day
group by d.day
order by d.day;
$$;

create function public.top_products(p_limit int default 5, p_days int default 30)
  returns table (product_id bigint, name text, quantity bigint)
  language sql stable
set search_path = ''
as $$
select p.id, p.name, sum(oi.quantity) as quantity
from public.order_items oi
join public.products p on p.id = oi.product_id
join public.orders o on o.id = oi.order_id
where o.created_at >= ((now() at time zone 'Europe/Kyiv')::date - (p_days - 1)) at time zone 'Europe/Kyiv'
group by p.id, p.name
order by quantity desc, p.id
  limit p_limit;
$$;
