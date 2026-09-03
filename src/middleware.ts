import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Librarian-only paths
    const librarianPaths = [
      '/items/new',
      '/items/import',
      '/loans/bulk-return',
      '/alerts',
      '/my-items',
      '/members',
    ]
    const isLibrarianPath = librarianPaths.some((p) => pathname.startsWith(p))
    if (isLibrarianPath && token?.role !== 'LIBRARIAN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/items/:path*',
    '/loans/:path*',
    '/alerts/:path*',
    '/my-items/:path*',
    '/members/:path*',
    '/api/items/:path*',
    '/api/loans/:path*',
    '/api/alerts/:path*',
    '/api/custodians/:path*',
    '/api/dashboard/:path*',
  ],
}
