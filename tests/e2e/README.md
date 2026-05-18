# E2E tests (Playwright)

## 1) Prepare env

1. Copy `.env.e2e.example` to `.env.e2e`.
2. Fill `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` with a real account from your Supabase project.

## 2) Install Playwright

```bash
npm i
npm run test:e2e:install
```

## 3) Run tests

```bash
npm run test:e2e
```

Optional:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```
