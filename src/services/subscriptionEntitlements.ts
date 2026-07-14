import { FREE_THEME_IDS, THEMES } from '@/constants/constants'
import type { Plan } from '@/types/types'

export type SubscriptionStatus = 'inactive' | 'active' | 'past_due'

export const FREE_PRODUCT_LIMIT = 10
export const PRO_PRODUCT_LIMIT = 100

const FALLBACK_FREE_THEME_ID =
  Object.values(THEMES).find((theme) => FREE_THEME_IDS.has(theme.id))?.id ?? 'minimal'

export function hasActiveSubscription(input: {
  plan: Plan
  subscriptionStatus?: SubscriptionStatus | null
  subscriptionExpiresAt?: string | null
}): boolean {
  if (input.plan !== 'pro') return false

  if (input.subscriptionStatus === 'inactive' || input.subscriptionStatus === 'past_due') {
    return false
  }

  if (!input.subscriptionExpiresAt) return true

  return new Date(input.subscriptionExpiresAt).getTime() > Date.now()
}

export function resolveVisibleProductLimit(isPro: boolean): number {
  return isPro ? PRO_PRODUCT_LIMIT : FREE_PRODUCT_LIMIT
}

export function isThemeAllowedForPlan(themeId: string, isPro: boolean): boolean {
  return isPro || FREE_THEME_IDS.has(themeId)
}

export function getFallbackFreeThemeId(): string {
  return FALLBACK_FREE_THEME_ID
}

export function getEffectiveThemeId(themeId: string, isPro: boolean): string {
  return isThemeAllowedForPlan(themeId, isPro) ? themeId : FALLBACK_FREE_THEME_ID
}
