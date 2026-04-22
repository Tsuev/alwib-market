export function applyTheme(themeId: string) {
  if (themeId === 'minimal') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', themeId)
  }
  // Sync body background for scrollbar gutter area
  const style = getComputedStyle(document.documentElement)
  document.body.style.background = style.getPropertyValue('--bg').trim()
}
