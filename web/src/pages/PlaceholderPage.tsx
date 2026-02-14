import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'This feature is coming soon. Stay tuned!',
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

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
