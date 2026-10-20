-- 1. Забрати в клієнтських ролей право оновлювати БУДЬ-ЯКУ колонку profiles
REVOKE UPDATE ON public.profiles FROM authenticated, anon;

-- 2. Повернути authenticated право оновлювати ТІЛЬКИ ці колонки
GRANT UPDATE (username, full_name, avatar_url, website, expo_push_token, updated_at)
  ON public.profiles TO authenticated;
