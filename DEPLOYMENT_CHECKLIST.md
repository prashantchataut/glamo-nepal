# Deployment Checklist

- Run `npm run static:check`.
- Run `npm run typecheck` after installing dependencies.
- Run `npm run build` after installing dependencies.
- Apply backend migrations before deploying the Worker.
- Confirm checkout can place COD and prepaid orders in production.
- Confirm `/admin` and all admin module URLs open after login.
