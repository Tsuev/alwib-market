import { useBreakpoints as _useBreakpoints } from '@vueuse/core'

export const useBreakpoints = () => {
  const { smaller } = _useBreakpoints({ mobile: 1024 })

  const displays = {
    mobile: smaller('mobile'),
  }

  return displays
}
