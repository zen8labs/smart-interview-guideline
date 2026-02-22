import { useMemo, useEffect } from 'react'
import { Outlet, useParams, useLocation } from 'react-router-dom'
import { PreparationStepper } from '@/components/PreparationStepper'
import type { PreparationStepIndex } from '@/components/PreparationStepper'
import { PreparationFlowProvider, usePreparationFlowProgress } from '@/contexts/PreparationFlowContext'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { useGetPreparationQuery } from '@/store/api/endpoints/preparationApi'

const STEP_TITLES: Record<0 | 1 | 2 | 3, string> = {
  0: 'Nhập JD',
  1: 'Memory Scan',
  2: 'Roadmap',
  3: 'Self-check',
}

function PreparationFlowContent() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const location = useLocation()
  const pathname = location.pathname
  const setPageTitle = useSetPageTitle()
  const { stepInProgress, stepProgressMessage } = usePreparationFlowProgress()

  const id = preparationId ? Number(preparationId) : null
  const validId = id != null && !Number.isNaN(id)

  const { data: preparation } = useGetPreparationQuery(id!, { skip: !validId || !id })

  const stepsWithData = useMemo((): PreparationStepIndex[] => {
    if (!preparation) return []
    const steps: PreparationStepIndex[] = []
    if (preparation.status !== 'jd_pending') steps.push(0)
    if (preparation.last_memory_scan_result != null) steps.push(1)
    if (preparation.roadmap_id != null) steps.push(2)
    return steps
  }, [preparation])

  let currentStep: 0 | 1 | 2 | 3 = 1
  if (pathname.includes('/jd')) currentStep = 0
  else if (pathname.includes('/memory-scan')) currentStep = 1
  else if (pathname.includes('/roadmap')) currentStep = 2
  else if (pathname.includes('/self-check')) currentStep = 3
  else if (validId) currentStep = 1

  useEffect(() => {
    setPageTitle(STEP_TITLES[currentStep], null)
  }, [setPageTitle, currentStep])

  if (!validId) {
    return <Outlet />
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PreparationStepper
        currentStep={currentStep}
        preparationId={id}
        stepInProgress={stepInProgress}
        stepProgressMessage={stepProgressMessage}
        stepsWithData={stepsWithData}
      />
      <Outlet />
    </div>
  )
}

export function PreparationFlowLayout() {
  return (
    <PreparationFlowProvider>
      <PreparationFlowContent />
    </PreparationFlowProvider>
  )
}
