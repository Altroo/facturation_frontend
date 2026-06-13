# Facturation Frontend

Next.js interface for a billing operations platform for quotes, pro-forma invoices, customer invoices, credit notes, delivery notes, payments, clients, articles, company settings, dashboards, notifications, and printable business documents.

This frontend is built around real staff workflows: authenticated navigation, dense dashboards, tables, filters, create/edit/detail pages, forms, actions, settings, notifications, and production data constraints.

## What It Shows

- Product UI work for an internal business system.
- Data-heavy React/Next.js screens with real workflow depth.
- State management with Redux Toolkit and redux-saga.
- Authenticated app structure with NextAuth and API-backed routes.
- Form, table, dashboard, notification, and settings flows built for daily operations.

## Key Capabilities

- Authenticated Next.js dashboard for clients, companies, articles, quotes, pro-forma invoices, customer invoices, credit notes, delivery notes, payments, users, objectives, and profile settings.
- MUI data-heavy screens with filters, tables, create/edit/detail flows, action buttons, document printing, and localized French/English UI.
- Redux Toolkit services and redux-saga flows for API calls, auth/session state, notifications, and document workflows.
- Formik/Zod forms for billing records, line items, payments, profile settings, and user management.
- Jest and Testing Library coverage for routes, helpers, auth, store, API services, and dashboard forms.

## Stack

- Next.js 16, React 19, TypeScript
- NextAuth, Axios, React Redux
- Redux Toolkit, redux-saga
- MUI, MUI X Data Grid, Sass, chart components
- Formik, Zod, date-fns
- Jest, Testing Library, ts-jest, Bun

## Related Repository

- Backend API: [Altroo/facturation_backend](https://github.com/Altroo/facturation_backend)

## Screenshots

Redacted production screenshots. Sensitive names, amounts, dates, and records are blurred.

![Dashboard overview](docs/screenshots/facturation-dashboard.png)

![Customer invoice list](docs/screenshots/facturation-invoices.png)

## Local Setup

Create local-only environment variables for the API base URL, auth settings, websocket endpoints, and public runtime config. Do not commit `.env` files or production credentials.

```bash
bun install
bun run dev
```

Default local port: `3000`.

## Quality Checks

```bash
bun x jest --runInBand --coverage=false
bun run lint
bun run build
```

## Portfolio Note

The repository is public for portfolio review. Screenshots are redacted, and sensitive production values are intentionally hidden.
