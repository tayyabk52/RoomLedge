import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Completely disabled middleware - client-side auth only
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Temporarily disable middleware to test client-side only auth
     * Will re-enable once session persistence is working
     */
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}