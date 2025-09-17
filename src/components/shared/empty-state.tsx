import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn('p-8 text-center', className)}>
      <div className="flex flex-col items-center space-y-4">
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {action && (
          <Button 
            onClick={action.onClick} 
            className="mt-6 h-11 px-6 rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white border-0 transition-all duration-200"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}