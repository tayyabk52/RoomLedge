'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from './avatar-upload'
import { useUpdateProfile } from '@/hooks/use-profile'
import { User } from '@/types'
import { Save, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [fullName, setFullName] = useState(user.full_name)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateProfileMutation = useUpdateProfile()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const trimmedName = fullName.trim()

    // Only update if the name has actually changed
    if (trimmedName === user.full_name) {
      return
    }

    updateProfileMutation.mutate({
      userId: user.id,
      data: { full_name: trimmedName }
    })
  }

  const isSubmitting = updateProfileMutation.isPending
  const hasChanges = fullName.trim() !== user.full_name

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-4"
      >
        <AvatarUpload user={user} />
        <p className="text-sm text-gray-600 text-center">
          Click on your avatar to upload a new image
        </p>
      </motion.div>

      {/* Name Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-3"
      >
        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={`h-11 text-sm border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
            errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={isSubmitting}
          placeholder="Enter your full name"
        />
        {errors.fullName && (
          <p className="text-xs text-red-600">{errors.fullName}</p>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="pt-2"
      >
        <Button
          type="submit"
          disabled={isSubmitting || !hasChanges}
          className={`
            w-full h-12 rounded-xl text-sm font-medium
            bg-blue-500 hover:bg-blue-600 text-white 
            border-0 shadow-sm hover:shadow-md
            transition-all duration-200
            ${isSubmitting || !hasChanges ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>
                {hasChanges ? 'Save Changes' : 'No Changes'}
              </span>
            </div>
          )}
        </Button>
      </motion.div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="text-center"
      >
        <p className="text-xs text-gray-500">
          Your profile information will be visible to other room members
        </p>
      </motion.div>
    </form>
  )
}