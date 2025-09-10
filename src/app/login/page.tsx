'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { Mail, Lock, LogIn } from 'lucide-react'
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative ocean-gradient">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-white border border-ocean-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-navy-900 flex items-center justify-center gap-2">
                <LogIn className="h-6 w-6 text-ocean-600" />
                Login
              </CardTitle>
              <CardDescription className="text-gray-600">
                Access your Resume2Path account
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

                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full h-12 text-md bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 text-white shadow-lg hover:shadow-ocean-500/25 transition-all duration-300"
                >
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </Button>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full h-12 text-md bg-red-500 hover:bg-red-600 text-white shadow-lg mt-2"
                >
                  {googleLoading ? 'Signing in with Google…' : 'Sign in with Google'}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Don't have an account? <a href="/signup" className="text-ocean-700 hover:underline">Sign up</a>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


