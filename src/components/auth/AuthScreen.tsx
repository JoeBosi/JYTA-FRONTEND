import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Apple, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface AuthScreenProps {
  onClose?: () => void;
}

export function AuthScreen({ onClose }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, resetPassword, signInWithGoogle, signInWithApple } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(formData.email, formData.password);
      } else if (mode === 'signup') {
        await signUp(formData.email, formData.password, formData.displayName);
      } else if (mode === 'reset') {
        await resetPassword(formData.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ios-surface to-ios-surface-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-0 shadow-ios-large">
        <AnimatePresence mode="wait" custom={mode}>
          <motion.div
            key={mode}
            custom={mode}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            <div className="text-center mb-8">
              <motion.h1 
                className="text-2xl font-semibold text-foreground mb-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'reset' && 'Reset Password'}
              </motion.h1>
              <motion.p 
                className="text-ios-label-secondary text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {mode === 'signin' && 'Sign in to your account to continue'}
                {mode === 'signup' && 'Create a new account to get started'}
                {mode === 'reset' && 'Enter your email to reset your password'}
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-label-secondary h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Display Name"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="pl-10 h-12 bg-ios-fill border-ios-separator rounded-xl"
                        required={mode === 'signup'}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-label-secondary h-5 w-5" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-12 bg-ios-fill border-ios-separator rounded-xl"
                  required
                />
              </div>

              <AnimatePresence>
                {mode !== 'reset' && (
                  <motion.div
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-label-secondary h-5 w-5" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-12 h-12 bg-ios-fill border-ios-separator rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ios-label-secondary"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-ios"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (
                  mode === 'signin' ? 'Sign In' :
                  mode === 'signup' ? 'Create Account' : 'Send Reset Link'
                )}
              </Button>
            </form>

            <AnimatePresence>
              {mode === 'signin' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-ios-separator" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-card text-ios-label-secondary">or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthSignIn('google')}
                      className="h-12 bg-ios-fill border-ios-separator rounded-xl"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthSignIn('apple')}
                      className="h-12 bg-ios-fill border-ios-separator rounded-xl"
                      disabled={loading}
                    >
                      <Apple className="w-5 h-5 mr-2" />
                      Apple
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center space-y-2">
              {mode === 'signin' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-primary text-sm font-medium"
                  >
                    Forgot your password?
                  </button>
                  <div>
                    <span className="text-ios-label-secondary text-sm">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary text-sm font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}

              {mode === 'signup' && (
                <div>
                  <span className="text-ios-label-secondary text-sm">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-primary text-sm font-medium"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="flex items-center justify-center text-primary text-sm font-medium mx-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to sign in
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}