'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import { useUploadAvatar, useDeleteAvatar } from '@/hooks/use-profile'
import { useAuth } from '@/hooks/use-auth'
import { User } from '@/types'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface AvatarUploadProps {
  user?: User // Make user optional since we'll use auth hook
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { profile } = useAuth() // Get current profile from auth hook

  const uploadAvatarMutation = useUploadAvatar()
  const deleteAvatarMutation = useDeleteAvatar()

  // Always use current profile from auth hook (most up-to-date), fallback to prop if needed
  const currentUser = profile || user

  if (!currentUser) {
    return null // Don't render if no user data available
  }


  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Upload the file
    uploadAvatarMutation.mutate(
      { userId: currentUser.id, file },
      {
        onSuccess: () => {
          setPreviewUrl(null)
          // Clear the input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
        onError: () => {
          setPreviewUrl(null)
          // Clear the input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }
    )
  }

  const handleDeleteAvatar = () => {
    if (!currentUser.avatar_url) return

    deleteAvatarMutation.mutate(currentUser.id, {
      onSuccess: () => {
        setPreviewUrl(null)
      }
    })
  }

  const isUploading = uploadAvatarMutation.isPending
  const isDeleting = deleteAvatarMutation.isPending
  const isLoading = isUploading || isDeleting

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative cursor-pointer group"
        onClick={handleFileSelect}
      >
        <div className="relative">
          {previewUrl ? (
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src={previewUrl}
                alt="Preview"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <UserAvatar
              user={currentUser}
              size="lg"
              className="w-24 h-24 lg:w-32 lg:h-32 border-4 border-white shadow-lg"
            />
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}

          {/* Camera Overlay - Only on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFileSelect}
          disabled={isLoading}
          className="flex items-center gap-2 h-9 px-4 text-sm border-gray-300 rounded-lg hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
        >
          <Camera className="h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Change Avatar'}
        </Button>

        {currentUser.avatar_url && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={isLoading}
            className="flex items-center gap-2 h-9 px-4 text-sm border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 focus:border-red-500 focus:ring-red-500"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Guidelines */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Supported formats: JPG, PNG, GIF (max 5MB)
        </p>
      </div>
    </div>
  )
}