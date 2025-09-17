'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Bell, LogOut, Menu, X, Users, Copy, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Room } from '@/types'

interface ResponsiveNavProps {
  user: User
  room?: Room
  roomMembersCount?: number
  onSignOut: () => void
  onInviteMember: () => void
  onProfileClick?: () => void
  onRoomDetailsClick?: () => void
}

export function ResponsiveNav({
  user,
  room,
  roomMembersCount = 0,
  onSignOut,
  onInviteMember,
  onProfileClick,
  onRoomDetailsClick
}: ResponsiveNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Premium Minimal Desktop Navigation */}
      <div className="hidden lg:block">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled 
              ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/30 shadow-sm' 
              : 'bg-white/90 backdrop-blur-md border-b border-gray-100/30'
          }`}
        >
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section - User Profile & Room Info */}
              <motion.div 
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* User Profile */}
                <motion.button
                  onClick={onProfileClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-50/50 transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative">
                    <UserAvatar user={user} size="md" className="ring-1 ring-gray-200" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                      {user.full_name}
                    </h2>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </motion.button>

                {/* Room Info - Moved to left section */}
                {room && (
                  <motion.div
                    onClick={onRoomDetailsClick}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50/50 transition-all duration-200 group border border-gray-200/50 cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Users className="h-3 w-3 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-medium text-gray-900 group-hover:text-gray-700">
                        {room.name}
                      </h3>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span>{roomMembersCount} members</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Badge variant="outline" className="text-xs h-4 px-1.5 border-gray-200 text-gray-600 font-mono">
                        {room.invite_code}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onInviteMember()
                        }}
                        className="h-4 w-4 p-0 hover:bg-gray-200 rounded-sm"
                      >
                        <Copy className="h-2.5 w-2.5 text-gray-500" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Center Section - Empty for clean look */}
              <div className="flex-1"></div>

              {/* Right Section - Clean Actions */}
              <motion.div 
                className="flex items-center space-x-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9 rounded-lg hover:bg-gray-50/80 transition-all duration-200 group"
                >
                  <Bell className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onSignOut} 
                  className="h-9 w-9 rounded-lg hover:bg-gray-50/80 transition-all duration-200 group ml-2"
                >
                  <LogOut className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
        {/* Minimal spacer */}
        <div className="h-16"></div>
      </div>
      {/* Clean Mobile Navigation */}
      <div className="lg:hidden">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled 
              ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/30 shadow-sm' 
              : 'bg-white/90 backdrop-blur-md border-b border-gray-100/30'
          }`}
        >
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Mobile Left - User Info */}
              <motion.button
                onClick={onProfileClick}
                className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-50/50 transition-all duration-200 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <UserAvatar user={user} size="sm" className="ring-1 ring-gray-200" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="text-left">
                  <h2 className="font-medium text-gray-900 text-sm group-hover:text-gray-700 transition-colors">
                    {user.full_name}
                  </h2>
                  {room && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onRoomDetailsClick?.()
                      }}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <Users className="h-3 w-3" />
                      <span className="truncate max-w-32">{room.name}</span>
                    </div>
                  )}
                </div>
              </motion.button>

              {/* Mobile Right - Clean Actions */}
              <motion.div 
                className="flex items-center space-x-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9 rounded-lg hover:bg-gray-50/50 transition-all duration-200"
                >
                  <Bell className="h-4 w-4 text-gray-600" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="h-9 w-9 rounded-lg hover:bg-gray-50/50 transition-all duration-200"
                >
                  <motion.div
                    animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {mobileMenuOpen ? <X className="h-4 w-4 text-gray-600" /> : <Menu className="h-4 w-4 text-gray-600" />}
                  </motion.div>
                </Button>
              </motion.div>
            </div>

            {/* Clean Mobile Menu Dropdown */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="py-3 space-y-2 border-t border-gray-100/50">
                    {/* Room Info Card for Mobile - Clean */}
                    {room && (
                      <motion.div
                        onClick={() => {
                          onRoomDetailsClick?.()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full p-3 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900 text-sm">{room.name}</p>
                              <p className="text-xs text-gray-500">{roomMembersCount} members</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs h-5 px-2 border-gray-200 text-gray-600">
                              {room.invite_code}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onInviteMember()
                                setMobileMenuOpen(false)
                              }}
                              className="h-6 w-6 p-0 hover:bg-gray-200 rounded-md"
                            >
                              <Copy className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Clean Menu Items */}
                    <div className="space-y-1">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={() => {
                            onProfileClick?.()
                            setMobileMenuOpen(false)
                          }}
                          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 h-10 rounded-lg"
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Profile Settings
                        </Button>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={() => {
                            onSignOut()
                            setMobileMenuOpen(false)
                          }}
                          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 h-10 rounded-lg"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        {/* Mobile Spacer */}
        <div className="h-14"></div>
      </div>
    </>
  )
}