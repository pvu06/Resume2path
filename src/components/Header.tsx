'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Menu, X, LogIn, UserPlus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-navy-900/90 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3 group">
                                <div className="w-12 h-12 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-ocean-500/50 transition-all duration-300 transform hover:scale-110">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold text-white hover:text-ocean-300 transition-colors duration-300">
              Resume2Path
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/#features" className="text-ocean-200 hover:text-white transition-all duration-300 hover:scale-105 relative group font-medium">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-ocean-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="/#courses" className="text-ocean-200 hover:text-white transition-all duration-300 hover:scale-105 relative group font-medium">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-ocean-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="/#resources" className="text-ocean-200 hover:text-white transition-all duration-300 hover:scale-105 relative group font-medium">
              Resources
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-ocean-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="/#community" className="text-ocean-200 hover:text-white transition-all duration-300 hover:scale-105 relative group font-medium">
              Community
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-ocean-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Auth Area */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <UserIcon className="w-3 h-3 mr-1" />
                  {currentUser.displayName || 'Account'}
                </Badge>
                <Link href="/dashboard" className="flex items-center space-x-2 text-white hover:text-ocean-300">
                  {currentUser.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUser.photoURL} alt="pfp" className="w-8 h-8 rounded-full border border-ocean-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-ocean-600 text-white flex items-center justify-center font-semibold">
                      {(currentUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[160px] truncate">{currentUser.displayName || currentUser.email}</span>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-ocean-200 border border-ocean-200 hover:text-navy-900 hover:bg-ocean-200 hover:border-ocean-200"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    size="sm"
                    className="bg-ocean-200 text-navy-900 border border-ocean-200 hover:bg-transparent hover:text-ocean-200 hover:border-ocean-200"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-blue-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a 
                href="/#features" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="/#how-it-works" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a 
                href="/#pricing" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="/#contact" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="pt-4 border-t border-blue-100 px-3 pb-3">
                {currentUser ? (
                  <div className="flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                      {currentUser.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentUser.photoURL} alt="pfp" className="w-8 h-8 rounded-full border border-ocean-400" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ocean-600 text-white flex items-center justify-center font-semibold">
                          {(currentUser.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{currentUser.displayName || currentUser.email}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{currentUser.email}</div>
                      </div>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLogout}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-ocean-200 border border-ocean-200 hover:text-navy-900 hover:bg-ocean-200 hover:border-ocean-200"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button 
                        size="sm"
                        className="w-full bg-ocean-200 text-navy-900 border border-ocean-200 hover:bg-transparent hover:text-ocean-200 hover:border-ocean-200"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
