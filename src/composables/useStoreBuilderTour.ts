import { nextTick } from 'vue'
import { driver, type DriveStep, type Driver } from 'driver.js'

const STORAGE_KEY = 'alwib-store-builder-tour-seen-v2'
const POPOVER_CLASS = 'store-builder-tour-popover'

type StoreBuilderTourOptions = {
  openProductDialog: () => void
  closeProductDialog: () => Promise<void> | void
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function waitForElement(selector: string, timeout = 4000): Promise<Element | null> {
  const start = window.performance.now()

  while (window.performance.now() - start < timeout) {
    const element = document.querySelector(selector)
    if (element) return element
    await wait(50)
  }

  return document.querySelector(selector)
}

export function useStoreBuilderTour(options: StoreBuilderTourOptions) {
  let tour: Driver | null = null

  const closeDialogAndWait = async () => {
    options.closeProductDialog()
    await wait(320)
  }

  const openDialogAndWait = async () => {
    options.openProductDialog()
    await nextTick()
    await waitForElement('[data-tour="product-photo"]')
    await wait(80)
  }

  const steps: DriveStep[] = [
    {
      element: '[data-tour="theme-tabs"]',
      popover: {
        title: '1. Выберите тему магазина',
        description:
          'Начните со стилистики витрины. Здесь выбирается визуальная тема: цвета, акцент и общий характер магазина.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="store-logo"]',
      popover: {
        title: '2. Загрузите логотип',
        description:
          'Добавьте логотип c разрешением 1:1. Он будет показан в шапке магазина и поможет сделать витрину узнаваемой.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="store-name"]',
      popover: {
        title: '3. Укажите название',
        description:
          'Введите понятное название магазина. Оно попадёт в превью и на опубликованную страницу.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="store-description"]',
      popover: {
        title: '4. Добавьте описание',
        description:
          'Коротко опишите магазин: что вы продаёте, для кого и в чём ценность. Этот текст будет показан в шапке витрины под названием.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="store-domain"]',
      popover: {
        title: '5. Настройте адрес',
        description:
          'Задайте короткий адрес на латинице для ссылки вида `alwib.ru/ваш-магазин`. Система сразу проверяет, свободен ли он.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="store-whatsapp"]',
      popover: {
        title: '6. Добавьте WhatsApp',
        description:
          'Укажите номер WhatsApp, чтобы покупатели могли быстро написать вам из карточки товара.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="store-telegram"]',
      popover: {
        title: '7. Добавьте Telegram',
        description:
          'Если у вас тариф Pro, сюда можно добавить Telegram-аккаунт.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="add-product"]',
      popover: {
        title: '8. Перейдите к созданию товара',
        description:
          'Нажмите сюда, чтобы открыть форму товара. Внутри вы заполните карточку: фото, название, описание, цену и теги.',
        side: 'left',
        align: 'center',
        onNextClick: async (_element, _step, { driver }) => {
          await openDialogAndWait()
          driver.moveNext()
        },
      },
    },
    {
      element: '[data-tour="product-photo"]',
      popover: {
        title: '9. Загрузите фото товара',
        description:
          'Первым делом добавьте фото. Хорошее изображение влияет на конверсию сильнее любой декоративной настройки.',
        side: 'right',
        align: 'start',
        onPrevClick: async (_element, _step, { driver }) => {
          await closeDialogAndWait()
          driver.movePrevious()
        },
      },
    },
    {
      element: '[data-tour="product-name"]',
      popover: {
        title: '10. Заполните название и описание',
        description:
          'Название обязательно. Ниже можно кратко описать товар, чтобы покупателю было проще понять ценность предложения.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="product-price"]',
      popover: {
        title: '11. Укажите цену',
        description:
          'Заполните основную цену и, при необходимости, цену со скидкой. Процент скидки посчитается автоматически.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="product-tags"]',
      popover: {
        title: '12. Добавьте теги и сохраните',
        description:
          'Теги помогают быстро описать товар короткими маркерами, например вы можете написать бренд товара или какое-то свойство. После заполнения нажимайте кнопку сохранения.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="product-save"]',
      popover: {
        title: '13. Сохранение карточки',
        description:
          'Эта кнопка создаёт товар и добавляет его в витрину. Вы можете это сделать позже.',
        side: 'top',
        align: 'end',
        onNextClick: async (_element, _step, { driver }) => {
          await closeDialogAndWait()
          driver.moveNext()
        },
      },
    },
    {
      element: '[data-tour="preview-store"]',
      popover: {
        title: '14. Проверьте магазин в превью',
        description:
          'Перед публикацией откройте превью и посмотрите, как тема, логотип, контакты и товары выглядят для покупателя.',
        side: 'top',
        align: 'end',
        onPrevClick: async (_element, _step, { driver }) => {
          await openDialogAndWait()
          driver.movePrevious()
        },
      },
    },
    {
      element: '[data-tour="publish-store"]',
      popover: {
        title: '15. Опубликуйте магазин',
        description:
          'Когда всё готово, нажмите "Опубликовать". Магазин сохранится и станет доступен по вашему адресу.',
        side: 'top',
        align: 'end',
      },
    },
  ]

  function getTour(): Driver {
    if (tour) return tour

    tour = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      stagePadding: 8,
      stageRadius: 14,
      nextBtnText: 'Далее',
      prevBtnText: 'Назад',
      doneBtnText: 'Готово',
      popoverClass: POPOVER_CLASS,
      steps,
      onDestroyed: () => {
        void closeDialogAndWait()
      },
    })

    return tour
  }

  async function startTour() {
    localStorage.setItem(STORAGE_KEY, '1')
    if (tour?.isActive()) {
      tour.destroy()
    }
    await closeDialogAndWait()
    await nextTick()
    getTour().drive()
  }

  async function maybeStartTour() {
    if (localStorage.getItem(STORAGE_KEY)) return
    await startTour()
  }

  function resetTourState() {
    localStorage.removeItem(STORAGE_KEY)
  }

  function destroyTour() {
    tour?.destroy()
    tour = null
  }

  return {
    startTour,
    maybeStartTour,
    resetTourState,
    destroyTour,
  }
}
