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
      
      // Set a flag in sessionStorage to indicate guest mode
      sessionStorage.setItem('isGuest', 'true');
      
      // Redirect to homepage (page.js)
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
      
      // Clear guest session if it exists
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
      
      // Clear guest session on login
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

  // SIMPLIFIED: Direct guest button on the main login/signup page
  const renderLoginForm = () => (
    <form onSubmit={handleEmailLogin} className="auth-form">
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      
      <button 
        type="submit" 
        className="auth-button" 
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      
      <div className="auth-links">
        <button 
          type="button" 
          className="link-button"
          onClick={() => setMode('forgot-password')}
        >
          Forgot Password?
        </button>
        <button 
          type="button" 
          className="link-button"
          onClick={() => setMode('signup')}
        >
          Create Account
        </button>
      </div>
    </form>
  );

  const renderSignUpForm = () => (
    <form onSubmit={handleEmailSignUp} className="auth-form">
      <div className="form-group">
        <label htmlFor="signup-email">Email Address</label>
        <input
          type="email"
          id="signup-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="signup-password">Password</label>
        <input
          type="password"
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="At least 6 characters"
        />
        <small>Password must be at least 6 characters</small>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirm-password">Confirm Password</label>
        <input
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      
      {/* Role Selection */}
      <div className="form-group">
        <label>Account Type</label>
        <div className="role-selector">
          <label className="role-option">
            <input
              type="radio"
              name="role"
              value="customer"
              checked={role === 'customer'}
              onChange={(e) => setRole(e.target.value)}
            />
            <span className="role-label">
              <span className="role-icon">👤</span>
              Customer
            </span>
          </label>
          
          <label className="role-option">
            <input
              type="radio"
              name="role"
              value="admin"
              checked={role === 'admin'}
              onChange={(e) => setRole(e.target.value)}
            />
            <span className="role-label">
              <span className="role-icon">⚙️</span>
              Admin
            </span>
          </label>
        </div>
      </div>
      
      {/* Admin Code Field */}
      {role === 'admin' && (
        <div className="form-group">
          <label htmlFor="admin-code">Admin Secret Code</label>
          <input
            type="password"
            id="admin-code"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            required
            placeholder="Enter admin code"
          />
          <small>Contact your administrator for the admin code</small>
        </div>
      )}
      
      <button 
        type="submit" 
        className="auth-button" 
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
      
      <div className="auth-links">
        <button 
          type="button" 
          className="link-button"
          onClick={() => setMode('login')}
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="auth-form">
      <div className="form-group">
        <label htmlFor="reset-email">Email Address</label>
        <input
          type="email"
          id="reset-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
        />
        <small>We'll send you a link to reset your password</small>
      </div>
      
      <button 
        type="submit" 
        className="auth-button" 
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      
      <div className="auth-links">
        <button 
          type="button" 
          className="link-button"
          onClick={() => setMode('login')}
        >
          Back to Login
        </button>
      </div>
    </form>
  );

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            <span className="logo-icon">iS</span>
            <span className="logo-text">iSiko Studio</span>
          </Link>
          <h1 className="auth-title">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot-password' && 'Reset Password'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' && 'Login to access your account, orders, and wishlist'}
            {mode === 'signup' && 'Sign up to save your cart, track orders, and more'}
            {mode === 'forgot-password' && 'Enter your email to reset your password'}
          </p>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        {success && (
          <div className="auth-success">
            <span className="success-icon">✓</span>
            {success}
          </div>
        )}
        
        {/* Auth Forms */}
        <div className="auth-body">
          {mode === 'login' && renderLoginForm()}
          {mode === 'signup' && renderSignUpForm()}
          {mode === 'forgot-password' && renderForgotPasswordForm()}
          
          {/* BIG PROMINENT GUEST BUTTON - Always visible on login and signup pages */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="divider">
                <span>OR</span>
              </div>
              
              <button 
                onClick={handleGuestAccess}
                className="guest-button-large"
                disabled={loading}
              >
                <span className="guest-icon">👤</span>
                <span className="guest-text">Continue as Guest</span>
                <span className="guest-arrow">→</span>
              </button>
              
              <p className="guest-info">
                Shop immediately without an account. Your cart will be saved in your browser.
                <Link href="/" className="guest-home-link"> Continue to homepage →</Link>
              </p>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="auth-footer">
          <p>
            By continuing, you agree to iSiko Studio's{' '}
            <Link href="/terms">Terms of Service</Link> and{' '}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 40px 20px;
        }
        
        .auth-container {
          max-width: 520px;
          width: 100%;
          background: white;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .auth-header {
          background: linear-gradient(135deg, #2C3E50 0%, #1a2634 100%);
          color: white;
          padding: 40px 32px;
          text-align: center;
        }
        
        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          text-decoration: none;
        }
        
        .logo-icon {
          background: #B38B59;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
        }
        
        .logo-text {
          color: white;
          font-weight: 600;
          font-size: 20px;
        }
        
        .auth-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        
        .auth-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 15px;
          margin: 0;
        }
        
        .auth-body {
          padding: 32px;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #2C3E50;
        }
        
        .form-group input {
          padding: 12px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #B38B59;
          box-shadow: 0 0 0 3px rgba(179, 139, 89, 0.1);
        }
        
        .form-group small {
          font-size: 12px;
          color: #666;
        }
        
        .role-selector {
          display: flex;
          gap: 16px;
          margin-top: 4px;
        }
        
        .role-option {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .role-option:hover {
          background: #F8F9FA;
        }
        
        .role-option input[type="radio"] {
          width: 18px;
          height: 18px;
          margin-right: 12px;
          accent-color: #B38B59;
        }
        
        .role-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #2C3E50;
        }
        
        .role-icon {
          font-size: 18px;
        }
        
        .auth-button {
          background: #B38B59;
          color: white;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .auth-button:hover:not(:disabled) {
          background: #9a7647;
        }
        
        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .auth-links {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .link-button {
          background: none;
          border: none;
          color: #B38B59;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
        }
        
        .link-button:hover {
          text-decoration: underline;
        }
        
        .divider {
          position: relative;
          text-align: center;
          margin: 32px 0 24px;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #E5E7EB;
        }
        
        .divider span {
          position: relative;
          background: white;
          padding: 0 16px;
          color: #666;
          font-size: 14px;
        }
        
        /* BIG PROMINENT GUEST BUTTON */
        .guest-button-large {
          width: 100%;
          padding: 18px 24px;
          background: white;
          border: 2px solid #2C3E50;
          border-radius: 12px;
          color: #2C3E50;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          transition: all 0.3s;
          margin-bottom: 16px;
        }
        
        .guest-button-large:hover:not(:disabled) {
          background: #2C3E50;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(44, 62, 80, 0.2);
        }
        
        .guest-icon {
          font-size: 24px;
        }
        
        .guest-text {
          flex: 0 1 auto;
        }
        
        .guest-arrow {
          font-size: 20px;
          transition: transform 0.3s;
        }
        
        .guest-button-large:hover .guest-arrow {
          transform: translateX(8px);
        }
        
        .guest-info {
          margin-top: 16px;
          text-align: center;
          font-size: 13px;
          color: #666;
          background: #F8F9FA;
          padding: 16px;
          border-radius: 8px;
          line-height: 1.6;
        }
        
        .guest-home-link {
          color: #B38B59;
          text-decoration: none;
          font-weight: 600;
        }
        
        .guest-home-link:hover {
          text-decoration: underline;
        }
        
        .auth-error,
        .auth-success {
          margin: 0 32px 24px;
          padding: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }
        
        .auth-error {
          background: #FEF2F2;
          color: #E74C3C;
          border: 1px solid #FECACA;
        }
        
        .auth-success {
          background: #F0FDF4;
          color: #2E8B57;
          border: 1px solid #BBF7D0;
        }
        
        .error-icon,
        .success-icon {
          font-size: 18px;
        }
        
        .auth-footer {
          padding: 24px 32px;
          background: #F8F9FA;
          border-top: 1px solid #E5E7EB;
          text-align: center;
        }
        
        .auth-footer p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }
        
        .auth-footer a {
          color: #B38B59;
          text-decoration: none;
        }
        
        .auth-footer a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 640px) {
          .auth-container {
            border-radius: 16px;
          }
          
          .auth-header {
            padding: 32px 24px;
          }
          
          .auth-title {
            font-size: 24px;
          }
          
          .auth-body {
            padding: 24px;
          }
          
          .role-selector {
            flex-direction: column;
          }
          
          .guest-button-large {
            padding: 16px 20px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}