# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev        # Start dev server (exposed on all interfaces via --host)
npm run build      # Type-check + compile for production
npm run type-check # Run vue-tsc type checking only
npm run lint       # ESLint with auto-fix
npm run format     # Prettier format src/
```

## Environment Variables

Create a `.env` file with:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_KEY` — Supabase anon key
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key
- `VITE_API_BASE_URL` — Base URL for the axios HTTP client

## Architecture

**Stack:** Vue 3 (Composition API) + TypeScript + Vite + Pinia + Vue Router + TailwindCSS v4 + PrimeVue (Aura theme) + Supabase

**Path alias:** `@` maps to `src/`

**Two HTTP clients run in parallel:**
- `src/composables/useSupabase.ts` — Supabase client (auth + database), initialized from env vars. Auth operations live in `src/services/authServices.ts`.
- `src/services/index.ts` — axios instance with `VITE_API_BASE_URL` as base, attaches `Bearer` token from `localStorage` on every request, logs on 401.

**State management:** Pinia stores in `src/stores/`. Use the composition-style `defineStore` pattern (as seen in `counter.ts`).

**Composables pattern:**
- `useSupabase` — returns the Supabase client instance
- `useBreakpoints` — wraps `@vueuse/core` breakpoints; mobile breakpoint is `< 1024px`
- Domain-specific composables go in `src/composables/`

**Layouts:** `src/layouts/default.vue` is a thin slot wrapper. Wrap views with it for consistent layout.

**Shared types/enums/constants:** `src/types/types.ts`, `src/enums/enum.ts`, `src/constants/constants.ts` — add shared definitions here rather than inlining them in components.

---

## UI Components

### Rule: PrimeVue first, PrimeVue Headless second, custom last

Always prefer built-in PrimeVue components over writing custom HTML. If PrimeVue has the component — use it. If the visual result needs full control (custom markup, animations, unique structure), use the **headless (renderless) variant** from PrimeVue instead of a raw `<div>`. Only build a fully custom component from scratch when neither option covers the use case.

**Decision order:**

1. **PrimeVue component** — `<Button>`, `<DataTable>`, `<Dialog>`, `<Select>`, `<Tabs>`, `<Toast>`, etc.
2. **PrimeVue Headless** — `useToast`, `<Galleria>` with custom item slot, `<Listbox>` with `#option` slot, `<DataView>` with `#list`/`#grid`, `OverlayPanel`, etc. Headless APIs expose state and logic; you supply the markup.
3. **Custom component** — only when PrimeVue has no equivalent at all.

```vue
<!-- ✅ Prefer PrimeVue -->
<Button label="Save" severity="primary" />

<!-- ✅ Need custom markup? Use headless slot/API -->
<Select v-model="val" :options="items" optionLabel="name">
  <template #option="{ option }">
    <div class="...">{{ option.name }}</div>
  </template>
</Select>

<!-- ❌ Don't reinvent the wheel -->
<div @click="open = !open">...</div>
```

---

## Styling

### Rule: All styles go through `tailwind-variants` (`tv`)

**Never** use bare class strings scattered in the template or a plain `class` attribute with many tokens. Every component must define its styles via `tv()` at the top of `<script setup>`, destructure the slots, and bind them in the template.

```vue
<script setup lang="ts">
import { tv } from 'tailwind-variants';

const styles = tv({
  slots: {
    root: 'w-full h-screen flex items-center justify-center',
    title: 'text-3xl font-semibold text-surface-900',
    badge: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
  },
  variants: {
    intent: {
      success: { badge: 'bg-green-100 text-green-800' },
      danger:  { badge: 'bg-red-100 text-red-800' },
    },
  },
  defaultVariants: {
    intent: 'success',
  },
});

const props = defineProps<{ intent?: 'success' | 'danger' }>();
const { root, title, badge } = styles({ intent: props.intent });
</script>

<template>
  <div :class="root()">
    <h1 :class="title()">Hello</h1>
    <span :class="badge()">Active</span>
  </div>
</template>
```

**Key conventions:**

- `tv()` is called **once** per component at module level (not inside `setup` or computed).
- Slot names should be semantic: `root`, `header`, `body`, `footer`, `label`, `icon`, etc.
- Use `variants` for intent/size/state driven class changes — avoid ternary class bindings in the template.
- For PrimeVue component styling use the `pt` (PassThrough) prop to inject Tailwind classes into internal PrimeVue slots:

```vue
<Button
  label="Save"
  :pt="{
    root: { class: styles().root() },
    label: { class: styles().label() },
  }"
/>
```

- Never use `@apply` in CSS files — keep all tokens in `tv()` slots.
- Never write `class="a b c d e f"` directly on an element without a corresponding `tv` slot.
