import { useSupabase } from '@/composables/useSupabase'

const { supabase } = useSupabase()

export function mapAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Неверный email или пароль'
  if (msg.includes('User already registered') || msg.includes('already been registered') || msg.includes('already registered'))
    return 'Пользователь с этим email уже существует'
  if (msg.includes('Email not confirmed')) return 'Сначала подтвердите email'
  if (msg.includes('invalid format') || msg.includes('Invalid email') || msg.includes('Unable to validate email'))
    return 'Некорректный формат email'
  if (msg.includes('signup_disabled') || msg.includes('Signups not allowed') || msg.includes('not allowed'))
    return 'Регистрация временно отключена'
  if (msg.includes('rate limit') || msg.includes('over_request_rate_limit') || msg.includes('too many'))
    return 'Слишком много попыток. Попробуйте позже'
  if (msg.includes('weak_password') || msg.includes('Password should be'))
    return 'Пароль слишком простой. Используйте буквы, цифры и символы'
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch'))
    return 'Ошибка сети. Проверьте подключение к интернету'
  if (msg.includes('Email address') && msg.includes('not authorized'))
    return 'Этот email не разрешён для регистрации'
  return msg
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data?.user ?? null, error: error ? mapAuthError(error.message) : null }
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data?.user ?? null, error: error ? mapAuthError(error.message) : null }
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  })
  return { error: error ? mapAuthError(error.message) : null }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth`,
  })
  return { error: error ? mapAuthError(error.message) : null }
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signOut() {
  await supabase.auth.signOut()
}
