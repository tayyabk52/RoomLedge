import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from '@/types'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: Pick<User, 'full_name' | 'avatar_url'>
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage
        src={user.avatar_url || undefined}
        alt={user.full_name}
        onError={() => console.log('Avatar image failed to load:', user.avatar_url)}
        onLoad={() => console.log('Avatar image loaded successfully:', user.avatar_url)}
      />
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getInitials(user.full_name)}
      </AvatarFallback>
    </Avatar>
  )
}