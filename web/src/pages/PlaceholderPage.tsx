import { useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'This feature is coming soon. Stay tuned!',
}: PlaceholderPageProps) {
  const setPageTitle = useSetPageTitle()

  useEffect(() => {
    setPageTitle(title, description)
  }, [setPageTitle, title, description])

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-dashed">
        <CardHeader className="items-center text-center">
          <div className="rounded-full bg-muted p-4 mb-2">
            <Construction className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Under Construction</CardTitle>
          <CardDescription className="max-w-sm">
            We&apos;re building something great here. This page will be available
            in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Check back soon for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
