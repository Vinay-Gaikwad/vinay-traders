create policy "public can read products temporarily"
on public.products
for select
to anon
using (true);