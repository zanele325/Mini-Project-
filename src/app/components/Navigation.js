"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';


export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { wishlistCount } = useWishlist();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const cartCount = isClient ? getCartCount() : 0;
  
  const isActive = (path) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleWishlistClick = () => {
    if (!user) {
      router.push('/login?redirect=/wishlist');
    } else {
      router.push('/wishlist');
    }
  };

  const handleCartClick = () => {
    router.push('/cart');
  };

  const handleSearchClick = () => {
    router.push('/shop?search=true');
  };

  const handleLoginClick = () => {
    const currentPath = pathname;
    if (currentPath !== '/login') {
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } else {
      router.push('/login');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="header">
      <div className="container header-content">
        {/* Logo */}
        <Link href="/" className="logo">
          <div className="logo-icon">iS</div>
          <div className="logo-text">iSiko Studio</div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="nav-links">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link href="/shop" className={`nav-link ${isActive('/shop') ? 'active' : ''}`}>Shop</Link>
          <Link href="/occasions" className={`nav-link ${isActive('/occasions') ? 'active' : ''}`}>Occasions</Link>
          <Link href="/cultures" className={`nav-link ${isActive('/cultures') ? 'active' : ''}`}>Cultures</Link>
          <Link href="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About</Link>
        </nav>
        
        {/* Right Icons */}
        <div className="right-icons">
          <button className="icon-button" onClick={handleSearchClick} title="Search">🔍</button>
         <button 
  className="icon-button"
  onClick={handleWishlistClick}
  title="Wishlist"
>
  ♡
  {user && wishlistCount > 0 && (
    <span className="icon-badge">{wishlistCount}</span>
  )}
</button>
          
          <button className="icon-button cart-button" onClick={handleCartClick} title="Cart">
            🛒
            {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
          </button>
          
          {/* User Menu */}
          <div className="user-menu-wrapper">
            {user ? (
              <>
                <button className="user-button" onClick={() => setShowUserMenu(!showUserMenu)} title="Account">
                  <div className="user-avatar">{getUserInitials()}</div>
                </button>
                
                {showUserMenu && (
                  <>
                    <div className="menu-backdrop" onClick={() => setShowUserMenu(false)} />
                    
                    <div className="user-dropdown">
                      {/* User Info Header */}
                      <div className="dropdown-header">
                        <div className="dropdown-user-avatar">{getUserInitials()}</div>
                        <div className="dropdown-user-info">
                          <div className="dropdown-user-name">{getUserDisplayName()}</div>
                          <div className="dropdown-user-email">{user.email}</div>
                          <div className="dropdown-user-role">
                            {isAdmin ? 'Administrator' : 'Customer'}
                          </div>
                        </div>
                      </div>

                      <div className="dropdown-divider"></div>

                      {/* Customer Menu */}
                      <Link href="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="item-icon">👤</span>
                        <span className="item-title">My Profile</span>
                      </Link>
                      
                      <Link href="/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="item-icon">📦</span>
                        <span className="item-title">Order History</span>
                      </Link>
                      
                      <Link href="/wishlist" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="item-icon">♡</span>
                        <span className="item-title">Wishlist</span>
                      </Link>

                      {/* ADMIN SECTION - Professional, clean, with blue header */}
                      {isAdmin && (
                        <>
                          <div className="dropdown-divider"></div>
                          <div className="dropdown-admin-section">
                            <div className="dropdown-admin-header">Administrator</div>
                            <div className="dropdown-admin-links">
                              <Link href="/admin" className="dropdown-admin-link" onClick={() => setShowUserMenu(false)}>
                                Dashboard
                              </Link>
                              <Link href="/admin/products" className="dropdown-admin-link" onClick={() => setShowUserMenu(false)}>
                                Products
                              </Link>
                              <Link href="/admin/orders" className="dropdown-admin-link" onClick={() => setShowUserMenu(false)}>
                                Orders
                              </Link>
                              <Link href="/admin/categories" className="dropdown-admin-link" onClick={() => setShowUserMenu(false)}>
                                Categories
                              </Link>
                              <Link href="/admin/reports" className="dropdown-admin-link" onClick={() => setShowUserMenu(false)}>
                                Reports
                              </Link>
                            </div>
                          </div>
                        </>
                      )}

                      {/* LOGOUT BUTTON */}
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout-button" onClick={handleLogout}>
                        <span className="item-icon">🚪</span>
                        <span className="item-title">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button className="login-button" onClick={handleLoginClick}>
                <span className="login-icon">👤</span>
                <span className="login-text">Sign In</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="mobile-menu-button" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          {showMobileMenu ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="mobile-nav">
          <Link href="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>Home</Link>
          <Link href="/shop" className={`mobile-nav-link ${isActive('/shop') ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>Shop</Link>
          <Link href="/occasions" className={`mobile-nav-link ${isActive('/occasions') ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>Occasions</Link>
          <Link href="/cultures" className={`mobile-nav-link ${isActive('/cultures') ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>Cultures</Link>
          <Link href="/about" className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>About</Link>
          
          {!user ? (
            <button className="mobile-login-button" onClick={() => { setShowMobileMenu(false); handleLoginClick(); }}>
              <span>👤</span> Sign In / Register
            </button>
          ) : (
            <>
              {isAdmin && (
                <>
                  <div className="mobile-divider"></div>
                  <div className="mobile-admin-label">Administrator</div>
                  <Link href="/admin" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                  <Link href="/admin/products" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Products</Link>
                  <Link href="/admin/orders" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Orders</Link>
                  <Link href="/admin/categories" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Categories</Link>
                  <Link href="/admin/reports" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Reports</Link>
                </>
              )}
              <button className="mobile-logout-button" onClick={() => { setShowMobileMenu(false); handleLogout(); }}>
                <span>🚪</span> Sign Out
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .header {
          background: white;
          border-bottom: 1px solid #EDF2F7;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 32px;
        }
        
        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        
        .logo-icon {
          background: linear-gradient(135deg, #3182CE, #1E4E8C);
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
        }
        
        .logo-text {
          color: #1A2B3C;
          font-weight: 700;
          font-size: 20px;
          background: linear-gradient(135deg, #3182CE, #1E4E8C);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Desktop Navigation */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .nav-link {
          color: #4A5568;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 40px;
          transition: all 0.2s;
        }
        
        .nav-link:hover {
          background: #F7FAFC;
          color: #3182CE;
        }
        
        .nav-link.active {
          color: #3182CE;
          background: #EBF8FF;
          font-weight: 600;
        }
        
        /* Right Icons */
        .right-icons {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .icon-button {
          background: none;
          border: none;
          font-size: 20px;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4A5568;
          width: 44px;
          height: 44px;
        }
        
        .icon-button:hover {
          background: #F7FAFC;
          color: #3182CE;
        }
        
        .cart-button {
          background: #EBF8FF;
          color: #3182CE;
        }
        
        .cart-button:hover {
          background: linear-gradient(135deg, #3182CE, #1E4E8C);
          color: white;
        }
        
        .icon-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #E53E3E;
          color: white;
          font-size: 11px;
          font-weight: 600;
          min-width: 20px;
          height: 20px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid white;
        }
        
        /* User Menu */
        .user-menu-wrapper {
          position: relative;
        }
        
        .user-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        
        .user-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #3182CE, #1E4E8C);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        
        .user-avatar:hover {
          transform: scale(1.05);
          border-color: white;
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
        }
        
        .login-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: white;
          border: 1.5px solid #E2E8F0;
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s;
          color: #1A2B3C;
          font-weight: 500;
          font-size: 14px;
        }
        
        .login-button:hover {
          background: #F7FAFC;
          border-color: #3182CE;
          color: #3182CE;
        }
        
        .login-icon {
          font-size: 18px;
        }
        
        /* Dropdown Menu */
        .menu-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 998;
        }
        
        .user-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: -20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          width: 260px;
          z-index: 999;
          overflow: hidden;
          border: 1px solid #EDF2F7;
          animation: slideDown 0.2s ease;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Dropdown Header */
        .dropdown-header {
          padding: 20px;
          background: linear-gradient(135deg, #F0F9FF, #E6F2FF);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .dropdown-user-avatar {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #3182CE, #1E4E8C);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 20px;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.2);
        }
        
        .dropdown-user-info {
          flex: 1;
        }
        
        .dropdown-user-name {
          font-weight: 600;
          color: #1A2B3C;
          font-size: 15px;
          margin-bottom: 4px;
        }
        
        .dropdown-user-email {
          font-size: 12px;
          color: #64748B;
          margin-bottom: 6px;
          word-break: break-word;
        }
        
        .dropdown-user-role {
          display: inline-block;
          padding: 4px 10px;
          background: white;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #3182CE;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        
        .dropdown-divider {
          height: 1px;
          background: #EDF2F7;
          margin: 8px 0;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: #1A2B3C;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        
        .dropdown-item:hover {
          background: #F8FAFC;
        }
        
        .item-icon {
          font-size: 18px;
          width: 20px;
          text-align: center;
        }
        
        .item-title {
          font-weight: 500;
        }
        
        /* ADMIN SECTION - Professional and clean */
        .dropdown-admin-section {
          padding: 4px 0;
        }
        
        .dropdown-admin-header {
          padding: 8px 20px 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #3182CE;
        }
        
        .dropdown-admin-links {
          display: flex;
          flex-direction: column;
        }
        
        .dropdown-admin-link {
          display: block;
          padding: 10px 20px 10px 32px;
          color: #4A5568;
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s;
          border-left: 2px solid transparent;
        }
        
        .dropdown-admin-link:hover {
          background: #F8FAFC;
          color: #3182CE;
          border-left-color: #3182CE;
        }
        
        .logout-button {
          color: #E53E3E;
        }
        
        .logout-button .item-title {
          color: #E53E3E;
        }
        
        .logout-button:hover {
          background: #FEF2F2;
        }
        
        /* Mobile Menu */
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 10px;
          color: #4A5568;
        }
        
        .mobile-nav {
          display: none;
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          background: white;
          padding: 24px;
          border-top: 1px solid #EDF2F7;
          box-shadow: 0 10px 20px rgba(0,0,0,0.02);
          z-index: 997;
          flex-direction: column;
          gap: 4px;
        }
        
        .mobile-nav-link {
          padding: 14px 20px;
          color: #4A5568;
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .mobile-nav-link:hover {
          background: #F7FAFC;
        }
        
        .mobile-nav-link.active {
          color: #3182CE;
          background: #EBF8FF;
        }
        
        .mobile-login-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #3182CE, #1E4E8C);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          width: 100%;
        }
        
        .mobile-logout-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          color: #E53E3E;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          width: 100%;
        }
        
        .mobile-divider {
          height: 1px;
          background: #EDF2F7;
          margin: 16px 0 8px;
        }
        
        .mobile-admin-label {
          padding: 8px 20px 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #3182CE;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
          .nav-links { display: none; }
          .mobile-menu-button { display: block; }
          .mobile-nav { display: flex; }
        }
        
        @media (max-width: 640px) {
          .header-content {
            padding: 0 16px;
            height: 70px;
          }
          
          .logo-icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
          
          .logo-text {
            font-size: 18px;
          }
          
          .user-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 24px 24px 0 0;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
          }
          
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          
          .login-button .login-text { display: none; }
          .login-button { padding: 10px; }
        }
      `}</style>
    </header>
  );
}