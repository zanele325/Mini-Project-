"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/src/Context/AuthContext';
import { auth, db } from '@/src/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Shield,
  UserCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/';
  
  const { user } = useAuth();
  
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const ADMIN_SECRET_CODE = process.env.NEXT_PUBLIC_ADMIN_SECRET_CODE || 'ADMIN2024';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  // Guest access - goes straight to homepage
  const handleGuestAccess = () => {
    try {
      setLoading(true);
      
      // Create guest session in localStorage
      const guestSession = {
        isGuest: true,
        createdAt: new Date().toISOString(),
        cart: JSON.parse(localStorage.getItem('guestCart') || '[]')
      };
      
      localStorage.setItem('guestSession', JSON.stringify(guestSession));
      sessionStorage.setItem('isGuest', 'true');
      
      router.push('/');
      
    } catch (error) {
      console.error('Guest access error:', error);
      setError('Failed to continue as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (role === 'admin' && adminCode !== ADMIN_SECRET_CODE) {
      setError('Invalid admin code. Please contact your administrator.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false,
        profile: {
          displayName: email.split('@')[0],
          preferences: {
            newsletter: false,
            notifications: true
          }
        }
      });

      setSuccess('Account created successfully! Redirecting...');
      
      localStorage.removeItem('guestSession');
      sessionStorage.removeItem('isGuest');
      
      setTimeout(() => {
        router.push(redirectPath);
      }, 2000);
      
    } catch (error) {
      console.error('Sign up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please login instead.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      await signInWithEmailAndPassword(auth, email, password);
      
      localStorage.removeItem('guestSession');
      sessionStorage.removeItem('isGuest');
      
      router.push(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await sendPasswordResetEmail(auth, email);
      
      setSuccess('Password reset email sent! Check your inbox.');
      
      setTimeout(() => {
        setMode('login');
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Mail size={16} color="#666" />
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B38B59'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Lock size={16} color="#666" />
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B38B59'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        style={{
          background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
          color: 'white',
          padding: '16px 24px',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(179, 139, 89, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(179, 139, 89, 0.3)';
        }}
      >
        {loading ? 'Logging in...' : 'Login'}
        {!loading && <ArrowRight size={18} />}
      </button>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '8px'
      }}>
        <button 
          type="button"
          onClick={() => setMode('forgot-password')}
          style={{
            background: 'none',
            border: 'none',
            color: '#B38B59',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Forgot Password?
        </button>
        <button 
          type="button"
          onClick={() => setMode('signup')}
          style={{
            background: 'none',
            border: 'none',
            color: '#B38B59',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Create Account
        </button>
      </div>
    </form>
  );

  const renderSignUpForm = () => (
    <form onSubmit={handleEmailSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Mail size={16} color="#666" />
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B38B59'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Lock size={16} color="#666" />
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="At least 6 characters"
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B38B59'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
        <small style={{ fontSize: '12px', color: '#666' }}>Password must be at least 6 characters</small>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Lock size={16} color="#666" />
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="••••••••"
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B38B59'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>
      
      {/* Role Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1A1A1A'
        }}>
          Account Type
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            border: role === 'customer' ? '2px solid #B38B59' : '2px solid #e0e0e0',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: role === 'customer' ? '#FFF9F0' : 'white'
          }}>
            <input
              type="radio"
              name="role"
              value="customer"
              checked={role === 'customer'}
              onChange={(e) => setRole(e.target.value)}
              style={{ marginRight: '12px', accentColor: '#B38B59' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
              <UserCircle size={20} color={role === 'customer' ? '#B38B59' : '#666'} />
              Customer
            </span>
          </label>
          
          <label style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            border: role === 'admin' ? '2px solid #B38B59' : '2px solid #e0e0e0',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: role === 'admin' ? '#FFF9F0' : 'white'
          }}>
            <input
              type="radio"
              name="role"
              value="admin"
              checked={role === 'admin'}
              onChange={(e) => setRole(e.target.value)}
              style={{ marginRight: '12px', accentColor: '#B38B59' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
              <Shield size={20} color={role === 'admin' ? '#B38B59' : '#666'} />
              Admin
            </span>
          </label>
        </div>
      </div>
      
      {/* Admin Code Field */}
      {role === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} color="#666" />
            Admin Secret Code
          </label>
          <input
            type="password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            required
            placeholder="Enter admin code"
            style={{
              padding: '14px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '15px',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#B38B59'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
          <small style={{ fontSize: '12px', color: '#666' }}>Contact your administrator for the admin code</small>
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={loading}
        style={{
          background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
          color: 'white',
          padding: '16px 24px',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(179, 139, 89, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(179, 139, 89, 0.3)';
        }}
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
        {!loading && <ArrowRight size={18} />}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <button 
          type="button"
          onClick={() => setMode('login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#B38B59',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Mail size={16} color="#666" />
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B38B59'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
        <small style={{ fontSize: '12px', color: '#666' }}>We'll send you a link to reset your password</small>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        style={{
          background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
          color: 'white',
          padding: '16px 24px',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(179, 139, 89, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(179, 139, 89, 0.3)';
        }}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
        {!loading && <ArrowRight size={18} />}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <button 
          type="button"
          onClick={() => setMode('login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#B38B59',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Back to Login
        </button>
      </div>
    </form>
  );

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
      
      <div style={{
        minHeight: 'calc(100vh - 76px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          border: '1px solid #f0f0f0'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(165deg, #1A1A1A 0%, #2D2D2D 100%)',
            color: 'white',
            padding: '40px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(179, 139, 89, 0.15) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            
            <Link href="/" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              textDecoration: 'none',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '18px',
                fontFamily: "'Crimson Pro', serif",
                boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)'
              }}>
                iS
              </div>
              <div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: 'white',
                  fontFamily: "'Crimson Pro', serif",
                  lineHeight: '1',
                  textAlign: 'left'
                }}>
                  iSiko Studio
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#B38B59',
                  fontWeight: '500',
                  letterSpacing: '0.5px',
                  textAlign: 'left'
                }}>
                  CULTURAL HERITAGE
                </div>
              </div>
            </Link>
            
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '12px',
              fontFamily: "'Crimson Pro', serif",
              position: 'relative',
              zIndex: 1
            }}>
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot-password' && 'Reset Password'}
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '15px',
              margin: 0,
              lineHeight: '1.5',
              position: 'relative',
              zIndex: 1
            }}>
              {mode === 'login' && 'Login to access your account, orders, and wishlist'}
              {mode === 'signup' && 'Sign up to save your cart, track orders, and more'}
              {mode === 'forgot-password' && 'Enter your email to reset your password'}
            </p>
          </div>
          
          {/* Error/Success Messages */}
          {error && (
            <div style={{
              margin: '24px 32px 0',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              background: '#FEF2F2',
              color: '#E74C3C',
              border: '1px solid #FECACA'
            }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              margin: '24px 32px 0',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              background: '#F0FDF4',
              color: '#2E8B57',
              border: '1px solid #BBF7D0'
            }}>
              <CheckCircle size={20} />
              {success}
            </div>
          )}
          
          {/* Auth Forms */}
          <div style={{ padding: '32px' }}>
            {mode === 'login' && renderLoginForm()}
            {mode === 'signup' && renderSignUpForm()}
            {mode === 'forgot-password' && renderForgotPasswordForm()}
            
            {/* Guest Button - Always visible on login and signup */}
            {(mode === 'login' || mode === 'signup') && (
              <>
                <div style={{
                  position: 'relative',
                  textAlign: 'center',
                  margin: '32px 0 24px'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: '#e0e0e0'
                  }}></div>
                  <span style={{
                    position: 'relative',
                    background: 'white',
                    padding: '0 16px',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    OR
                  </span>
                </div>
                
                <button 
                  onClick={handleGuestAccess}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: 'white',
                    border: '2px solid #1A1A1A',
                    borderRadius: '10px',
                    color: '#1A1A1A',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.3s',
                    marginBottom: '16px',
                    fontFamily: 'inherit',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#1A1A1A';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(26, 26, 26, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#1A1A1A';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <User size={20} />
                  <span>Continue as Guest</span>
                  <ArrowRight size={18} />
                </button>
                
                <div style={{
                  background: '#F8F8F8',
                  padding: '16px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#666',
                  lineHeight: '1.6'
                }}>
                  Shop immediately without an account. Your cart will be saved in your browser.
                  <Link href="/" style={{
                    color: '#B38B59',
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '4px'
                  }}>
                    Continue to homepage <ArrowRight size={14} />
                  </Link>
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div style={{
            padding: '24px 32px',
            background: '#FAFAFA',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#666',
              lineHeight: '1.6'
            }}>
              By continuing, you agree to iSiko Studio's{' '}
              <Link href="/terms" style={{ color: '#B38B59', textDecoration: 'none' }}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: '#B38B59', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}