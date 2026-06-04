# Security Notes

This project is a production prototype, not a full commercial security model yet.

## Required production actions

1. Never commit `.env`.
2. Keep `DATABASE_URL` only in Netlify/Supabase environment variables.
3. Rotate the Supabase database password if it was ever shown in screenshots or shared.
4. Set `ADMIN_SECRET` in production to protect `/dashboard/review` and moderation actions.
5. Replace demo auth in `lib/auth.ts` with Clerk before letting unknown users submit real content.

## Admin protection

If `ADMIN_SECRET` is empty, the review queue runs in demo mode.

If `ADMIN_SECRET` is set, open the moderation page with:

```txt
/dashboard/review?admin=YOUR_ADMIN_SECRET
```

This is a temporary protection layer for prototypes. It is not a replacement for Clerk or real role-based auth.
