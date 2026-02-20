import { Outlet, useParams, useLocation } from 'react-router-dom'
import { PreparationStepper } from '@/components/PreparationStepper'

export function PreparationFlowLayout() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const location = useLocation()
  const pathname = location.pathname

  const id = preparationId ? Number(preparationId) : null
  const validId = id != null && !Number.isNaN(id)

  let currentStep: 0 | 1 | 2 | 3 = 1
  if (pathname.includes('/jd')) currentStep = 0
  else if (pathname.includes('/memory-scan')) currentStep = 1
  else if (pathname.includes('/roadmap')) currentStep = 2
  else if (pathname.includes('/self-check')) currentStep = 3
  else if (validId) currentStep = 1

  if (!validId) {
    return <Outlet />
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PreparationStepper currentStep={currentStep} preparationId={id} />
      <Outlet />
    </div>
  )
}
