<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tv } from 'tailwind-variants'
import { signIn, signUp, signInWithGoogle, resetPassword } from '@/services/authServices'

type Mode = 'login' | 'register' | 'forgot'

const router = useRouter()

const mode = ref<Mode>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPass = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const googleLoading = ref(false)
const error = ref('')
const success = ref(false)
const emailFocused = ref(false)
const passFocused = ref(false)
const confirmFocused = ref(false)

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthInfo = computed(() => {
  if (!password.value) return null
  const s = passwordStrength.value
  if (s <= 1) return { label: 'Слабый', color: '#ef4444', bars: 1 }
  if (s === 2) return { label: 'Средний', color: '#f59e0b', bars: 2 }
  if (s === 3) return { label: 'Хороший', color: '#10b981', bars: 3 }
  return { label: 'Сильный', color: '#059669', bars: 4 }
})

const confirmMatch = computed(() =>
  confirmPassword.value ? password.value === confirmPassword.value : null,
)

function validateForm(): string | null {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value.trim()) return 'Введите email'
  if (!emailRe.test(email.value.trim())) return 'Некорректный формат email'
  if (!password.value) return 'Введите пароль'
  if (password.value.length < 6) return 'Пароль должен содержать минимум 6 символов'
  if (mode.value === 'register') {
    if (passwordStrength.value < 2)
      return 'Пароль слишком простой — добавьте цифры или заглавные буквы'
    if (!confirmPassword.value) return 'Повторите пароль'
    if (password.value !== confirmPassword.value) return 'Пароли не совпадают'
  }
  return null
}

async function handleSubmit() {
  const e = validateForm()
  if (e) { error.value = e; return }
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      const res = await signIn(email.value.trim(), password.value)
      if (res.error) { error.value = res.error; return }
    } else {
      const res = await signUp(email.value.trim(), password.value)
      if (res.error) { error.value = res.error; return }
    }
    success.value = true
    setTimeout(() => router.push('/'), 1200)
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  error.value = ''
  googleLoading.value = true
  const res = await signInWithGoogle()
  googleLoading.value = false
  if (res.error) error.value = res.error
}

async function handleForgot() {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value.trim()) { error.value = 'Введите email'; return }
  if (!emailRe.test(email.value.trim())) { error.value = 'Некорректный формат email'; return }
  error.value = ''
  loading.value = true
  try {
    const res = await resetPassword(email.value.trim())
    if (res.error) { error.value = res.error; return }
    success.value = true
  } finally {
    loading.value = false
  }
}

function switchMode(m: Mode) {
  if (mode.value === m) return
  mode.value = m
  error.value = ''
  password.value = ''
  confirmPassword.value = ''
  showPass.value = false
  showConfirm.value = false
  success.value = false
}

const geoShapes: Array<{
  s: number
  t?: string; r?: string; b?: string; l?: string
  kind: 'ring' | 'diamond' | 'dot' | 'blob'
  c: string
  op: number
  anim: string
}> = [
  // Ring circles
  { s: 200, t: '-6%',  l: '-4%',  kind: 'ring',    c: '#10b981', op: 0.08, anim: 'geoFloat1 15s ease-in-out infinite' },
  { s: 280, b: '-8%',  r: '-5%',  kind: 'ring',    c: '#059669', op: 0.06, anim: 'geoFloat2 20s 2s ease-in-out infinite' },
  { s: 130, t: '28%',  r: '1%',   kind: 'ring',    c: '#34d399', op: 0.09, anim: 'geoFloat1 12s 1s ease-in-out infinite' },
  { s: 220, b: '4%',   l: '8%',   kind: 'ring',    c: '#10b981', op: 0.05, anim: 'geoFloat3 18s 4s ease-in-out infinite' },
  { s: 85,  t: '8%',   l: '18%',  kind: 'ring',    c: '#6ee7b7', op: 0.10, anim: 'geoFloat2 9s 0.5s ease-in-out infinite' },
  { s: 155, t: '58%',  r: '12%',  kind: 'ring',    c: '#34d399', op: 0.07, anim: 'geoFloat1 14s 3s ease-in-out infinite' },
  { s: 50,  t: '15%',  r: '20%',  kind: 'ring',    c: '#10b981', op: 0.11, anim: 'geoFloat3 10s 2s ease-in-out infinite' },
  // Diamonds (rotated squares)
  { s: 58,  t: '18%',  l: '4%',   kind: 'diamond', c: '#10b981', op: 0.09, anim: 'geoDiamond1 18s ease-in-out infinite' },
  { s: 38,  t: '68%',  l: '38%',  kind: 'diamond', c: '#34d399', op: 0.08, anim: 'geoDiamond2 14s 5s ease-in-out infinite' },
  { s: 48,  b: '12%',  r: '7%',   kind: 'diamond', c: '#059669', op: 0.08, anim: 'geoDiamond1 12s 2s ease-in-out infinite' },
  { s: 28,  t: '4%',   r: '22%',  kind: 'diamond', c: '#6ee7b7', op: 0.10, anim: 'geoDiamond2 10s 1s ease-in-out infinite' },
  // Small dots
  { s: 8,   t: '23%',  l: '28%',  kind: 'dot',     c: '#10b981', op: 0.18, anim: 'geoScale 7s ease-in-out infinite' },
  { s: 6,   t: '52%',  r: '28%',  kind: 'dot',     c: '#34d399', op: 0.16, anim: 'geoScale 9s 3s ease-in-out infinite' },
  { s: 10,  b: '28%',  l: '14%',  kind: 'dot',     c: '#059669', op: 0.14, anim: 'geoScale 6s 1s ease-in-out infinite' },
  { s: 5,   t: '78%',  r: '18%',  kind: 'dot',     c: '#6ee7b7', op: 0.18, anim: 'geoScale 8s 4s ease-in-out infinite' },
  { s: 7,   t: '40%',  l: '8%',   kind: 'dot',     c: '#10b981', op: 0.13, anim: 'geoScale 10s 2s ease-in-out infinite' },
  // Large soft blobs (very low opacity, blurred)
  { s: 450, t: '-20%', l: '-15%', kind: 'blob',    c: '#10b981', op: 0.03, anim: 'geoPulse 14s ease-in-out infinite' },
  { s: 380, b: '-18%', r: '-12%', kind: 'blob',    c: '#059669', op: 0.03, anim: 'geoPulse 18s 5s ease-in-out infinite' },
]

const styles = tv({
  slots: {
    page: 'min-h-screen bg-[#ecfdf5] flex items-center justify-center p-4 relative overflow-hidden',
    card: 'flex rounded-[20px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.18)] w-full max-w-[840px] relative z-[1]',
    // Left panel
    left: 'hidden md:flex w-[380px] shrink-0 relative overflow-hidden flex-col justify-between p-10',
    logoWrap: 'flex items-center gap-2.5 relative z-10',
    logoIcon:
      'w-9 h-9 rounded-[10px] bg-white/[0.18] backdrop-blur-sm border border-white/[0.25] flex items-center justify-center',
    logoText: 'text-white font-bold text-[15px] tracking-[-0.01em]',
    headlineWrap: 'relative z-10',
    headline:
      'text-white text-[33px] leading-[1.15] mb-3.5 font-[\'DM_Serif_Display\',serif] font-normal',
    headlineItalic: 'italic opacity-75',
    headlineSub: 'text-white/60 text-[13px] leading-[1.7] max-w-[260px]',
    statsRow: 'flex gap-6 relative z-10',
    statNum: 'text-white font-extrabold text-[18px]',
    statLabel: 'text-white/50 text-[11px] mt-0.5',
    // Right panel
    right: 'flex-1 bg-[#FAFAFA] flex flex-col justify-center px-10 py-12',
    formHeader: 'mb-7',
    formTitle: 'text-[24px] font-extrabold text-[#111] tracking-[-0.02em] mb-1.5',
    formSub: 'text-[13px] text-[#999]',
    formSubLink:
      'text-[#10b981] font-semibold cursor-pointer hover:text-[#059669] transition-colors duration-150',
    // Fields
    fieldWrap: 'mb-4',
    label: 'block text-[11px] font-bold text-[#aaa] uppercase tracking-[.07em] mb-1.5',
    inputBox:
      'flex items-center border-[1.5px] border-[#E5E5E5] rounded-[10px] bg-white overflow-hidden transition-[border-color,box-shadow] duration-[180ms]',
    inputIcon: 'px-3 text-[#ccc] flex items-center shrink-0',
    inputField:
      'flex-1 border-none outline-none py-3 pr-3 text-sm text-[#111] bg-transparent placeholder:text-[#ccc] font-[inherit]',
    eyeBtn:
      'px-3.5 text-[#bbb] flex items-center bg-transparent border-none cursor-pointer hover:text-[#555] transition-colors duration-150',
    // Strength bar
    strengthRow: 'flex items-center gap-2 mt-1.5',
    strengthBars: 'flex gap-1 flex-1',
    strengthBar: 'h-[3px] flex-1 rounded-full transition-[background] duration-300',
    strengthLabel: 'text-[11px] font-semibold',
    // Match indicator
    matchHint: 'text-[11px] mt-1 font-medium',
    // Error box
    errorBox:
      'flex items-center gap-2 bg-[#fff5f5] border border-[#fecaca] rounded-[8px] px-3.5 py-2.5 text-[13px] text-[#dc2626] mb-4 fade-in',
    // Success
    successWrap: 'flex flex-col items-center text-center py-4',
    successIcon:
      'w-16 h-16 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-5',
    successTitle: 'text-[20px] font-extrabold text-[#111] mb-2',
    successSub: 'text-[14px] text-[#888]',
    // Submit button
    submitBtn:
      'w-full py-[13px] rounded-[10px] text-white font-bold text-[15px] flex items-center justify-center gap-2 border-none cursor-pointer transition-[opacity,transform] duration-[180ms] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] mb-4',
    // Divider
    divider: 'flex items-center gap-3 mb-4',
    dividerLine: 'flex-1 h-px bg-[#eee]',
    dividerText: 'text-[12px] text-[#ccc] font-medium',
    // Google button
    googleBtn:
      'w-full py-[11px] rounded-[10px] border-[1.5px] border-[#E5E5E5] bg-white text-[#333] font-semibold text-[14px] flex items-center justify-center gap-2.5 cursor-pointer transition-[border-color,background] duration-[180ms] hover:border-[#10b981] hover:bg-[#f0fdf4]',
    spinner:
      'w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-anim inline-block',
  },
})

const s = styles()
</script>

<template>
  <div :class="s.page()">
    <!-- Animated geometric background -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
        v-for="(sh, i) in geoShapes"
        :key="i"
        :style="{
          position: 'absolute',
          width: sh.s + 'px',
          height: sh.s + 'px',
          top: sh.t,
          right: sh.r,
          bottom: sh.b,
          left: sh.l,
          borderRadius: sh.kind !== 'diamond' ? '50%' : '5px',
          border: (sh.kind === 'ring' || sh.kind === 'diamond') ? `1.5px solid ${sh.c}` : undefined,
          background: (sh.kind === 'dot' || sh.kind === 'blob') ? sh.c : undefined,
          filter: sh.kind === 'blob' ? 'blur(60px)' : undefined,
          transform: sh.kind === 'diamond' ? 'rotate(45deg)' : undefined,
          opacity: sh.op,
          animation: sh.anim,
        }"
      />
    </div>

    <div :class="s.card()">
      <!-- Left decorative panel -->
      <div
        :class="s.left()"
        style="background: linear-gradient(145deg, #022c22 0%, #064e3b 40%, #059669 100%)"
      >
        <!-- Decorative floating circles -->
        <div
          v-for="(c, i) in [
            { w: 220, h: 220, top: '-60px', right: '-60px', op: 0.12 },
            { w: 140, h: 140, top: '160px', left: '-50px', op: 0.08 },
            { w: 180, h: 180, bottom: '-60px', right: '20px', op: 0.1 },
          ]"
          :key="i"
          class="absolute rounded-full border border-white/50 pointer-events-none"
          :style="{
            width: c.w + 'px',
            height: c.h + 'px',
            top: c.top,
            bottom: c.bottom,
            left: c.left,
            right: c.right,
            opacity: c.op,
            animation: `floatA ${4 + i}s ease-in-out infinite`,
          }"
        />

        <!-- Subtle grid lines -->
        <svg
          viewBox="0 0 380 540"
          style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.04; pointer-events: none"
          aria-hidden="true"
        >
          <line
            v-for="i in 8"
            :key="'v' + i"
            :x1="(i - 1) * 54"
            y1="0"
            :x2="(i - 1) * 54"
            y2="540"
            stroke="white"
            stroke-width="1"
          />
          <line
            v-for="i in 10"
            :key="'h' + i"
            x1="0"
            :y1="(i - 1) * 60"
            x2="380"
            :y2="(i - 1) * 60"
            stroke="white"
            stroke-width="1"
          />
        </svg>

        <!-- Logo -->
        <div :class="s.logoWrap()">
          <div :class="s.logoIcon()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="20" height="14" rx="2" fill="white" opacity=".9" />
              <path d="M8 21h8M12 17v4" stroke="white" stroke-width="1.5" />
            </svg>
          </div>
          <span :class="s.logoText()">Альвиб – Онлайн Витрина</span>
        </div>

        <!-- Headline -->
        <div :class="s.headlineWrap()">
          <div :class="s.headline()">
            Ваш магазин<br /><em :class="s.headlineItalic()">всегда под рукой</em>
          </div>
          <p :class="s.headlineSub()">
            Управляйте товарами, следите за заказами и настраивайте витрину в пару кликов.
          </p>
        </div>

        <!-- Stats -->
        <div :class="s.statsRow()">
          <div v-for="[num, lbl] in [['12K+', 'магазинов'], ['98%', 'довольных'], ['24/7', 'поддержка']]" :key="num">
            <div :class="s.statNum()">{{ num }}</div>
            <div :class="s.statLabel()">{{ lbl }}</div>
          </div>
        </div>
      </div>

      <!-- Right form panel -->
      <div :class="s.right()">
        <!-- Success state -->
        <div v-if="success" :class="s.successWrap()" style="animation: fadeUp 400ms ease both">
          <div :class="s.successIcon()">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              stroke-width="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div :class="s.successTitle()">
            {{ mode === 'forgot' ? 'Письмо отправлено!' : mode === 'login' ? 'Вход выполнен!' : 'Аккаунт создан!' }}
          </div>
          <div :class="s.successSub()">
            {{ mode === 'forgot' ? 'Проверьте почту и перейдите по ссылке для сброса пароля' : 'Добро пожаловать в панель управления' }}
          </div>
        </div>

        <!-- Form state -->
        <template v-else>
          <!-- Header -->
          <div :class="s.formHeader()" style="animation: fadeUp 300ms ease both">
            <h2 :class="s.formTitle()">
              {{ mode === 'forgot' ? 'Сброс пароля' : mode === 'login' ? 'Войдите в аккаунт' : 'Создайте аккаунт' }}
            </h2>
            <p :class="s.formSub()">
              <template v-if="mode === 'login'">
                Нет аккаунта?
                <span :class="s.formSubLink()" @click="switchMode('register')">
                  Зарегистрироваться
                </span>
              </template>
              <template v-else-if="mode === 'register'">
                Уже есть аккаунт?
                <span :class="s.formSubLink()" @click="switchMode('login')">Войти</span>
              </template>
              <template v-else>
                Вспомнили пароль?
                <span :class="s.formSubLink()" @click="switchMode('login')">Войти</span>
              </template>
            </p>
          </div>

          <!-- Error box -->
          <div v-if="error" :class="s.errorBox()">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ error }}
          </div>

          <!-- Email field -->
          <div :class="s.fieldWrap()" style="animation: fadeUp 350ms 40ms ease both">
            <label :class="s.label()">Email</label>
            <div
              :class="[
                s.inputBox(),
                emailFocused && 'border-[#10b981] shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
              ]"
            >
              <span :class="s.inputIcon()">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                v-model="email"
                type="email"
                placeholder="you@example.com"
                :class="s.inputField()"
                autocomplete="email"
                @focus="emailFocused = true"
                @blur="emailFocused = false"
                @input="error = ''"
              />
            </div>
          </div>

          <!-- Password field -->
          <div v-if="mode !== 'forgot'" :class="s.fieldWrap()" style="animation: fadeUp 350ms 80ms ease both">
            <label :class="s.label()">Пароль</label>
            <div
              :class="[
                s.inputBox(),
                passFocused && 'border-[#10b981] shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
              ]"
            >
              <span :class="s.inputIcon()">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••"
                :class="s.inputField()"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                @focus="passFocused = true"
                @blur="passFocused = false"
                @input="error = ''"
              />
              <button type="button" :class="s.eyeBtn()" @click="showPass = !showPass">
                <svg
                  v-if="showPass"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>

            <!-- Password strength (register only) -->
            <div v-if="mode === 'register' && strengthInfo" :class="s.strengthRow()">
              <div :class="s.strengthBars()">
                <div
                  v-for="n in 4"
                  :key="n"
                  :class="s.strengthBar()"
                  :style="{
                    background:
                      n <= strengthInfo.bars ? strengthInfo.color : '#eee',
                  }"
                />
              </div>
              <span :class="s.strengthLabel()" :style="{ color: strengthInfo.color }">
                {{ strengthInfo.label }}
              </span>
            </div>
          </div>

          <!-- Confirm password -->
          <div
            v-if="mode === 'register'"
            :class="s.fieldWrap()"
            style="animation: fadeUp 350ms 100ms ease both"
          >
            <label :class="s.label()">Повторите пароль</label>
            <div
              :class="[
                s.inputBox(),
                confirmFocused && 'border-[#10b981] shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
                confirmMatch === false && 'border-[#ef4444] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]',
                confirmMatch === true && 'border-[#10b981]',
              ]"
            >
              <span :class="s.inputIcon()">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <input
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="••••••••"
                :class="s.inputField()"
                autocomplete="new-password"
                @focus="confirmFocused = true"
                @blur="confirmFocused = false"
                @input="error = ''"
              />
              <button type="button" :class="s.eyeBtn()" @click="showConfirm = !showConfirm">
                <svg
                  v-if="showConfirm"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
            <div
              v-if="confirmMatch !== null"
              :class="s.matchHint()"
              :style="{ color: confirmMatch ? '#10b981' : '#ef4444' }"
            >
              {{ confirmMatch ? '✓ Пароли совпадают' : '✕ Пароли не совпадают' }}
            </div>
          </div>

          <!-- Submit button -->
          <button
            :class="s.submitBtn()"
            :disabled="loading"
            style="
              background: linear-gradient(135deg, #059669, #10b981);
              box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
              animation: fadeUp 350ms 120ms ease both;
            "
            @click="mode === 'forgot' ? handleForgot() : handleSubmit()"
          >
            <span v-if="loading" :class="s.spinner()" />
            <template v-else>
              {{ mode === 'forgot' ? 'Отправить письмо →' : mode === 'login' ? 'Войти →' : 'Создать аккаунт →' }}
            </template>
          </button>

          <!-- Forgot password link (login mode only) -->
          <div v-if="mode === 'login'" style="text-align: center; margin-top: -8px; margin-bottom: 12px; animation: fadeUp 350ms 140ms ease both">
            <span :class="s.formSubLink()" @click="switchMode('forgot')">Забыли пароль?</span>
          </div>

          <!-- Divider (not shown in forgot mode) -->
          <div v-if="mode !== 'forgot'" :class="s.divider()" style="animation: fadeUp 350ms 160ms ease both">
            <div :class="s.dividerLine()" />
            <span :class="s.dividerText()">или</span>
            <div :class="s.dividerLine()" />
          </div>

          <!-- Google button (not shown in forgot mode) -->
          <button
            v-if="mode !== 'forgot'"
            :class="s.googleBtn()"
            :disabled="googleLoading"
            style="animation: fadeUp 350ms 200ms ease both"
            @click="handleGoogle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {{ googleLoading ? 'Перенаправление…' : 'Продолжить с Google' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Left panel decorative circles */
@keyframes floatA {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
}

/* Background geometry — float */
@keyframes geoFloat1 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
@keyframes geoFloat2 {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-16px); }
}
@keyframes geoFloat3 {
  0%, 100% { transform: translate(0, 0); }
  33%       { transform: translate(-10px, -14px); }
  66%       { transform: translate(8px, -7px); }
}

/* Background geometry — diamonds (keeps rotate(45deg)) */
@keyframes geoDiamond1 {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50%       { transform: rotate(45deg) translateY(-15px); }
}
@keyframes geoDiamond2 {
  0%, 100% { transform: rotate(45deg) translateX(0); }
  50%       { transform: rotate(45deg) translateX(-12px); }
}

/* Background geometry — dots */
@keyframes geoScale {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.6); }
}

/* Background geometry — blobs */
@keyframes geoPulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.07); }
}
</style>
