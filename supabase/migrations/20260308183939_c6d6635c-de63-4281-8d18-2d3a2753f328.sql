-- Reset admin password back to Muhsin@2026 (bcrypt hashed)
-- This fixes the login issue where the password hash may have become corrupted or changed
UPDATE public.admins 
SET password = extensions.crypt('Muhsin@2026', extensions.gen_salt('bf', 10))
WHERE email = 'amancarseat@gmail.com';