'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { Mail, Lock, UserPlus, User } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (cred.user) {
        // Set display name
        await updateProfile(cred.user, { displayName: fullName })
        // Persist user profile in Firestore
        const userRef = doc(db, 'users', cred.user.uid)
        await setDoc(userRef, {
          uid: cred.user.uid,
          name: fullName,
          email: cred.user.email,
          photoURL: cred.user.photoURL || null,
          createdAt: new Date().toISOString(),
          provider: 'password'
        }, { merge: true })
      }
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen ocean-gradient">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-white border border-ocean-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-navy-900 flex items-center justify-center gap-2">
                <UserPlus className="h-6 w-6 text-ocean-600" />
                Create account
              </CardTitle>
              <CardDescription className="text-gray-600">
                Join Resume2Path in seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    <User className="h-4 w-4 inline mr-2 text-ocean-600" />
                    Full Name
                  </label>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2 text-ocean-600" />
                    Email
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-2 text-ocean-600" />
                    Password
                  </label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-2 text-ocean-600" />
                    Confirm password
                  </label>
                  <Input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !fullName || !email || !password || password !== confirm}
                  className="w-full h-12 text-md bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 text-white shadow-lg hover:shadow-ocean-500/25 transition-all duration-300"
                >
                  {isLoading ? 'Creating account…' : 'Create account'}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Already have an account? <a href="/login" className="text-ocean-700 hover:underline">Log in</a>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


