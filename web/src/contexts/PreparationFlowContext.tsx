import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type PreparationStepIndex = 0 | 1 | 2 | 3

interface PreparationFlowProgressState {
  stepInProgress: PreparationStepIndex | null
  stepProgressMessage: string
}

interface PreparationFlowContextValue extends PreparationFlowProgressState {
  setStepProgress: (step: PreparationStepIndex, message: string) => void
  clearStepProgress: () => void
}

const PreparationFlowContext = createContext<PreparationFlowContextValue | null>(null)

export function PreparationFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreparationFlowProgressState>({
    stepInProgress: null,
    stepProgressMessage: '',
  })

  const setStepProgress = useCallback((step: PreparationStepIndex, message: string) => {
    setState({ stepInProgress: step, stepProgressMessage: message })
  }, [])

  const clearStepProgress = useCallback(() => {
    setState({ stepInProgress: null, stepProgressMessage: '' })
  }, [])

  return (
    <PreparationFlowContext.Provider
      value={{
        ...state,
        setStepProgress,
        clearStepProgress,
      }}
    >
      {children}
    </PreparationFlowContext.Provider>
  )
}

export function usePreparationFlowProgress() {
  const ctx = useContext(PreparationFlowContext)
  if (!ctx) {
    return {
      stepInProgress: null as PreparationStepIndex | null,
      stepProgressMessage: '',
      setStepProgress: (_step: PreparationStepIndex, _message: string) => {},
      clearStepProgress: () => {},
    }
  }
  return ctx
}
