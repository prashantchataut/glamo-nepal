# GLAMO NEPAL Admin Panel Guide

## How to access

1. Create `.env.local` in the project root.
2. Add:

```env
ADMIN_EMAIL=admin@glamonepal.com
ADMIN_PASSWORD=ChangeMe@123
ADMIN_SESSION_SECRET=replace_with_a_long_random_secret_at_least_32_chars
AUTH_SECRET=replace_with_a_long_random_secret_at_least_32_chars
```

3. Run the frontend:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000/admin/login`.
5. Sign in with the email and password from `.env.local`.
6. After login, you will be redirected to `/admin`.

## Security model added

- `/admin` is blocked unless a signed `glamo-admin-session` cookie is present.
- Admin login is handled by `/api/admin/login`.
- Admin logout is handled by `/api/admin/logout`.
- Cookies are HTTP-only, same-site, path-scoped and secure in production.
- Legacy `glamo-auth-token` and `glamo-user-role` cookies are still set for compatibility, but admin route access now relies on the signed admin session cookie.

This is a strong frontend guard for the current project state. Final production should still connect admin login to the backend database, password hashing, session storage, audit logs and RBAC.

## Admin sections

- Dashboard: summary cards, sales/order snapshot, category bars and low-stock alerts.
- Products: searchable product table with export, add, view, edit and delete action placements.
- Orders: order table with editable status dropdowns.
- Stocks: low-stock watch, reorder point and target stock controls.
- Banners: adaptive banner manager for desktop and mobile artwork.
- Customers: customer overview placeholders ready for customer APIs.
- Analytics: category and product attention summaries.
- Settings: store constants for GLAMO NEPAL.

## Banner requirements

Supported formats:

- PNG
- JPG/JPEG
- WebP
- SVG

Recommended files:

- Desktop banner: 16:7 ratio, recommended 1920 x 840, under 3 MB.
- Mobile banner: 4:5 ratio, recommended 1080 x 1350, under 3 MB.

Rules:

- Keep important text and faces inside the center safe area.
- Use separate desktop and mobile crops.
- Do not place tiny text inside image files; use admin title/subtitle fields for readable text.
- Preview on mobile, tablet and desktop before publishing.

The current banner manager stores edits in browser storage until the backend CMS API is connected.
