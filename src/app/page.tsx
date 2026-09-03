import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'

export default async function HomePage() {
  const session = await getAuth()
  if (!session) redirect('/login')
  redirect('/dashboard')
}
