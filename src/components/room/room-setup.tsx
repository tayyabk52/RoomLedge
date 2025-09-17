'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useCreateRoom, useJoinRoom } from '@/hooks/use-room-data'
import { Home, Users, Plus } from 'lucide-react'

const createRoomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters'),
})

const joinRoomSchema = z.object({
  invite_code: z.string().length(6, 'Invite code must be 6 characters'),
})

type CreateRoomForm = z.infer<typeof createRoomSchema>
type JoinRoomForm = z.infer<typeof joinRoomSchema>

export function RoomSetup() {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice')
  const createRoomMutation = useCreateRoom()
  const joinRoomMutation = useJoinRoom()

  const createForm = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
    },
  })

  const joinForm = useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      invite_code: '',
    },
  })

  const onCreateRoom = async (data: CreateRoomForm) => {
    await createRoomMutation.mutateAsync({
      name: data.name,
      base_currency: 'PKR', // Default to PKR for now
    })
  }

  const onJoinRoom = async (data: JoinRoomForm) => {
    await joinRoomMutation.mutateAsync({
      invite_code: data.invite_code,
    })
  }

  if (mode === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md lg:max-w-lg space-y-6">
          {/* Welcome Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to RoomLedger</h1>
            <p className="text-gray-600">Get started by creating or joining a room</p>
          </div>

          {/* Action Cards */}
          <div className="space-y-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200"
              onClick={() => setMode('create')}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Create Room</h3>
                    <p className="text-gray-600 text-sm">Start a new room for your hostel or group</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
              onClick={() => setMode('join')}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Join Room</h3>
                    <p className="text-gray-600 text-sm">Enter a room code to join an existing room</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md lg:max-w-lg">
          <CardHeader>
            <CardTitle className="text-center">Create Room</CardTitle>
            <CardDescription className="text-center">
              Create a new room for your hostel or group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateRoom)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Hostel 5th Floor"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('choice')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRoomMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    {createRoomMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Room'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md lg:max-w-lg">
          <CardHeader>
            <CardTitle className="text-center">Join Room</CardTitle>
            <CardDescription className="text-center">
              Enter the 6-character room code to join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...joinForm}>
              <form onSubmit={joinForm.handleSubmit(onJoinRoom)} className="space-y-4">
                <FormField
                  control={joinForm.control}
                  name="invite_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="HTL5A2"
                          className="text-center text-lg font-mono tracking-wider uppercase"
                          maxLength={6}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('choice')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={joinRoomMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500"
                  >
                    {joinRoomMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Joining...
                      </>
                    ) : (
                      'Join Room'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}