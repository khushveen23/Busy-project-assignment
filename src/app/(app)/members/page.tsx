'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, UserCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SystemUser {
  id: string
  name: string
  email: string
  role: 'LIBRARIAN' | 'MEMBER'
  createdAt: string
  _count: {
    loans: number
    custodianOf: number
  }
}

export default function MembersPage() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)

  function loadUsers() {
    setLoading(true)
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Users & Roles</h1>
          <p className="text-muted-foreground mt-1">Directory of registered librarians and member borrowers.</p>
        </div>

        <Button variant="outline" size="sm" onClick={loadUsers}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Registered Accounts ({users.length})
          </CardTitle>
          <CardDescription>Role-based access permissions: Librarians hold admin privileges over catalogue & loans.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading directory...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3.5 font-medium">User Name</th>
                  <th className="p-3.5 font-medium">Email</th>
                  <th className="p-3.5 font-medium">Role</th>
                  <th className="p-3.5 font-medium">Total Loans Requested / Borrowed</th>
                  <th className="p-3.5 font-medium">Custodian Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-semibold text-foreground">{user.name}</td>
                    <td className="p-3.5 text-muted-foreground">{user.email}</td>
                    <td className="p-3.5">
                      {user.role === 'LIBRARIAN' ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center w-fit gap-1">
                          <Shield className="w-3 h-3" /> Librarian
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center w-fit gap-1">
                          <UserCheck className="w-3 h-3" /> Member
                        </Badge>
                      )}
                    </td>
                    <td className="p-3.5 font-medium">{user._count.loans} loans</td>
                    <td className="p-3.5 text-muted-foreground">
                      {user.role === 'LIBRARIAN' ? `${user._count.custodianOf} items` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
