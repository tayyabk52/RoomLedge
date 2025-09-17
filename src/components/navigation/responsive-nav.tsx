'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Bell, LogOut, Menu, X, Users, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Room } from '@/types'

interface ResponsiveNavProps {
  user: User
  room?: Room
  roomMembersCount?: number
  onSignOut: () => void
  onInviteMember: () => void
}

export function ResponsiveNav({
  user,
  room,
  roomMembersCount = 0,
  onSignOut,
  onInviteMember
}: ResponsiveNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <div className="bg-white border-b shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <UserAvatar user={user} size="lg" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.full_name}</h1>
                  {room && (
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{room.name}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{roomMembersCount} members</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {room.invite_code}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onInviteMember}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 relative">
                  <Bell className="h-5 w-5" />
                  {/* Notification dot */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </Button>
                <Button variant="ghost" size="icon" onClick={onSignOut} className="hover:bg-gray-100">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserAvatar user={user} size="md" />
                <div>
                  <h2 className="font-semibold text-gray-900">{user.full_name}</h2>
                  {room && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{room.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t space-y-3"
                >
                  {room && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{room.name}</p>
                          <p className="text-xs text-gray-500">{roomMembersCount} members</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {room.invite_code}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onInviteMember()
                            setMobileMenuOpen(false)
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => {
                      onSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}