import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface PageTitleState {
  title: string | null
  subtitle: string | null
}

interface PageTitleContextValue extends PageTitleState {
  setPageTitle: (title: string | null, subtitle?: string | null) => void
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null)

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PageTitleState>({
    title: null,
    subtitle: null,
  })

  const setPageTitle = useCallback(
    (title: string | null, subtitle: string | null = null) => {
      setState({ title, subtitle })
    },
    [],
  )

  return (
    <PageTitleContext.Provider value={{ ...state, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  const ctx = useContext(PageTitleContext)
  if (!ctx) {
    throw new Error('usePageTitle must be used within PageTitleProvider')
  }
  return ctx
}

export function useSetPageTitle() {
  const { setPageTitle } = usePageTitle()
  return setPageTitle
}
