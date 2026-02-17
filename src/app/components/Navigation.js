"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';
import { 
  Search, 
  ShoppingCart, 
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Package,
  LayoutDashboard,
  ShoppingBag,
  List,
  BarChart3,
  LogOut,
  UserCircle
} from "lucide-react";

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
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
      
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 100,
        padding: '16px 0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              boxShadow: '0 4px 12px rgba(179, 139, 89, 0.25)'
            }}>
              iS
            </div>
            <div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#1A1A1A',
                fontFamily: "'Crimson Pro', serif",
                lineHeight: '1'
              }}>
                iSiko Studio
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#B38B59',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                CULTURAL HERITAGE
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav style={{ 
            display: 'flex', 
            gap: '32px', 
            alignItems: 'center'
          }}
          className="desktop-nav">
            <Link href="/" style={{
              textDecoration: 'none',
              color: isActive('/') ? '#B38B59' : '#1A1A1A',
              fontSize: '15px',
              fontWeight: isActive('/') ? '600' : '500',
              transition: 'color 0.2s',
              position: 'relative'
            }}>
              Home
              {isActive('/') && (
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  borderRadius: '3px 3px 0 0'
                }}></div>
              )}
            </Link>
            <Link href="/shop" style={{
              textDecoration: 'none',
              color: isActive('/shop') ? '#B38B59' : '#1A1A1A',
              fontSize: '15px',
              fontWeight: isActive('/shop') ? '600' : '500',
              transition: 'color 0.2s',
              position: 'relative'
            }}>
              Shop
              {isActive('/shop') && (
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  borderRadius: '3px 3px 0 0'
                }}></div>
              )}
            </Link>
            <Link href="/occasions" style={{
              textDecoration: 'none',
              color: isActive('/occasions') ? '#B38B59' : '#1A1A1A',
              fontSize: '15px',
              fontWeight: isActive('/occasions') ? '600' : '500',
              transition: 'color 0.2s',
              position: 'relative'
            }}>
              Occasions
              {isActive('/occasions') && (
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  borderRadius: '3px 3px 0 0'
                }}></div>
              )}
            </Link>
            <Link href="/cultures" style={{
              textDecoration: 'none',
              color: isActive('/cultures') ? '#B38B59' : '#1A1A1A',
              fontSize: '15px',
              fontWeight: isActive('/cultures') ? '600' : '500',
              transition: 'color 0.2s',
              position: 'relative'
            }}>
              Cultures
              {isActive('/cultures') && (
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  borderRadius: '3px 3px 0 0'
                }}></div>
              )}
            </Link>
            <Link href="/about" style={{
              textDecoration: 'none',
              color: isActive('/about') ? '#B38B59' : '#1A1A1A',
              fontSize: '15px',
              fontWeight: isActive('/about') ? '600' : '500',
              transition: 'color 0.2s',
              position: 'relative'
            }}>
              About
              {isActive('/about') && (
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  borderRadius: '3px 3px 0 0'
                }}></div>
              )}
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="right-icons">
            {/* Search Button */}
            <button 
              onClick={handleSearchClick}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Search"
            >
              <Search size={22} color="#1A1A1A" />
            </button>

            {/* Wishlist Button */}
            <button 
              onClick={handleWishlistClick}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Wishlist"
            >
              <Heart size={22} color="#1A1A1A" />
              {user && wishlistCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#E74C3C',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button 
              onClick={handleCartClick}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Cart"
            >
              <ShoppingCart size={22} color="#1A1A1A" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#E74C3C',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div style={{ position: 'relative' }}>
              {user ? (
                <>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Account"
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '18px',
                      transition: 'all 0.2s',
                      border: '2px solid transparent',
                      boxShadow: '0 2px 8px rgba(179, 139, 89, 0.2)'
                    }}>
                      {getUserInitials()}
                    </div>
                  </button>

                  {showUserMenu && (
                    <>
                      {/* Backdrop */}
                      <div 
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 998
                        }}
                      />

                      {/* Dropdown Menu */}
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        right: 0,
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        width: '280px',
                        zIndex: 999,
                        overflow: 'hidden',
                        border: '1px solid #f0f0f0',
                        animation: 'slideDown 0.2s ease'
                      }}>
                        {/* User Info Header */}
                        <div style={{
                          padding: '20px',
                          background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF5E6 100%)',
                          borderBottom: '1px solid #f0e6d6'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                              color: 'white',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '20px',
                              border: '2px solid white',
                              boxShadow: '0 4px 12px rgba(179, 139, 89, 0.2)'
                            }}>
                              {getUserInitials()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: '600',
                                color: '#1A1A1A',
                                fontSize: '15px',
                                marginBottom: '4px'
                              }}>
                                {getUserDisplayName()}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#666',
                                marginBottom: '6px',
                                wordBreak: 'break-word'
                              }}>
                                {user.email}
                              </div>
                              <div style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                background: 'white',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#B38B59',
                                border: '1px solid #f0e6d6'
                              }}>
                                {isAdmin ? 'Administrator' : 'Customer'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div style={{ padding: '8px 0' }}>
                          <Link 
                            href="/profile" 
                            onClick={() => setShowUserMenu(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 20px',
                              color: '#1A1A1A',
                              textDecoration: 'none',
                              fontSize: '14px',
                              transition: 'background 0.2s',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F8F8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <UserCircle size={20} color="#666" />
                            My Profile
                          </Link>

                          <Link 
                            href="/orders" 
                            onClick={() => setShowUserMenu(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 20px',
                              color: '#1A1A1A',
                              textDecoration: 'none',
                              fontSize: '14px',
                              transition: 'background 0.2s',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F8F8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Package size={20} color="#666" />
                            Order History
                          </Link>

                          <Link 
                            href="/wishlist" 
                            onClick={() => setShowUserMenu(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 20px',
                              color: '#1A1A1A',
                              textDecoration: 'none',
                              fontSize: '14px',
                              transition: 'background 0.2s',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F8F8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Heart size={20} color="#666" />
                            Wishlist
                          </Link>

                           <button 
                            onClick={handleLogout}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 20px',
                              color: '#E74C3C',
                              background: 'transparent',
                              border: 'none',
                              fontSize: '14px',
                              transition: 'background 0.2s',
                              cursor: 'pointer',
                              width: '100%',
                              textAlign: 'left',
                              fontWeight: '500',
                              fontFamily: 'inherit'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <LogOut size={20} color="#E74C3C" />
                            <span style={{ color: '#E74C3C' }}>Sign Out</span>
                          </button>
                        </div>

                        {/* Admin Section */}
                        {isAdmin && (
                          <>
                            <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }}></div>
                            <div style={{ padding: '8px 0' }}>
                              <div style={{
                                padding: '8px 20px 4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                color: '#B38B59'
                              }}>
                                Administrator
                              </div>
                              
                              <Link 
                                href="/admin/dashboard" 
                                onClick={() => setShowUserMenu(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 20px 10px 32px',
                                  color: '#4A5568',
                                  textDecoration: 'none',
                                  fontSize: '14px',
                                  transition: 'all 0.2s',
                                  borderLeft: '2px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#F8F8F8';
                                  e.currentTarget.style.borderLeftColor = '#B38B59';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderLeftColor = 'transparent';
                                }}
                              >
                                <LayoutDashboard size={18} color="#666" />
                                Dashboard
                              </Link>

                              <Link 
                                href="/admin/products" 
                                onClick={() => setShowUserMenu(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 20px 10px 32px',
                                  color: '#4A5568',
                                  textDecoration: 'none',
                                  fontSize: '14px',
                                  transition: 'all 0.2s',
                                  borderLeft: '2px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#F8F8F8';
                                  e.currentTarget.style.borderLeftColor = '#B38B59';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderLeftColor = 'transparent';
                                }}
                              >
                                <ShoppingBag size={18} color="#666" />
                                Products
                              </Link>

                              <Link 
                                href="/admin/orders" 
                                onClick={() => setShowUserMenu(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 20px 10px 32px',
                                  color: '#4A5568',
                                  textDecoration: 'none',
                                  fontSize: '14px',
                                  transition: 'all 0.2s',
                                  borderLeft: '2px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#F8F8F8';
                                  e.currentTarget.style.borderLeftColor = '#B38B59';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderLeftColor = 'transparent';
                                }}
                              >
                                <Package size={18} color="#666" />
                                Orders
                              </Link>

                              

                              <Link 
                                href="/admin/reports" 
                                onClick={() => setShowUserMenu(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 20px 10px 32px',
                                  color: '#4A5568',
                                  textDecoration: 'none',
                                  fontSize: '14px',
                                  transition: 'all 0.2s',
                                  borderLeft: '2px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#F8F8F8';
                                  e.currentTarget.style.borderLeftColor = '#B38B59';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderLeftColor = 'transparent';
                                }}
                              >
                                <BarChart3 size={18} color="#666" />
                                Reports
                              </Link>

                               <button 
                            onClick={handleLogout}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 20px',
                              color: '#E74C3C',
                              background: 'transparent',
                              border: 'none',
                              fontSize: '14px',
                              transition: 'background 0.2s',
                              cursor: 'pointer',
                              width: '100%',
                              textAlign: 'left',
                              fontWeight: '500',
                              fontFamily: 'inherit'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <LogOut size={20} color="#E74C3C" />
                            <span style={{ color: '#E74C3C' }}>Sign Out</span>
                          </button>
                            </div>
                          </>
                        )}

                        {/* Logout */}
                        <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }}></div>
                        <div style={{ padding: '8px 0' }}>
                          
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleLoginClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'white',
                    border: '1.5px solid #e0e0e0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: '#1A1A1A',
                    fontWeight: '500',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F8F8F8';
                    e.currentTarget.style.borderColor = '#B38B59';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                >
                  <User size={18} />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px'
              }}
              className="mobile-menu-btn"
            >
              {showMobileMenu ? <X size={24} color="#1A1A1A" /> : <Menu size={24} color="#1A1A1A" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div style={{
            position: 'fixed',
            top: '76px',
            left: 0,
            right: 0,
            background: 'white',
            padding: '24px',
            borderTop: '1px solid #f0f0f0',
            boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
            zIndex: 997,
            maxHeight: 'calc(100vh - 76px)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link 
                href="/" 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '14px 20px',
                  color: isActive('/') ? '#B38B59' : '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive('/') ? '600' : '500',
                  borderRadius: '8px',
                  background: isActive('/') ? '#FFF9F0' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                Home
              </Link>
              <Link 
                href="/shop" 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '14px 20px',
                  color: isActive('/shop') ? '#B38B59' : '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive('/shop') ? '600' : '500',
                  borderRadius: '8px',
                  background: isActive('/shop') ? '#FFF9F0' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                Shop
              </Link>
              <Link 
                href="/occasions" 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '14px 20px',
                  color: isActive('/occasions') ? '#B38B59' : '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive('/occasions') ? '600' : '500',
                  borderRadius: '8px',
                  background: isActive('/occasions') ? '#FFF9F0' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                Occasions
              </Link>
              <Link 
                href="/cultures" 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '14px 20px',
                  color: isActive('/cultures') ? '#B38B59' : '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive('/cultures') ? '600' : '500',
                  borderRadius: '8px',
                  background: isActive('/cultures') ? '#FFF9F0' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                Cultures
              </Link>
              <Link 
                href="/about" 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '14px 20px',
                  color: isActive('/about') ? '#B38B59' : '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive('/about') ? '600' : '500',
                  borderRadius: '8px',
                  background: isActive('/about') ? '#FFF9F0' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                About
              </Link>

              {!user ? (
                <button 
                  onClick={() => { setShowMobileMenu(false); handleLoginClick(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '16px',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                >
                  <User size={20} />
                  Sign In / Register
                </button>
              ) : (
                <>
                  {isAdmin && (
                    <>
                      <div style={{ height: '1px', background: '#f0f0f0', margin: '16px 0 8px' }}></div>
                      <div style={{
                        padding: '8px 20px 4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#B38B59'
                      }}>
                        Administrator
                      </div>
                      <Link href="/admin" onClick={() => setShowMobileMenu(false)} style={{
                        padding: '14px 20px',
                        color: '#4A5568',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        display: 'block'
                      }}>
                        Dashboard
                      </Link>
                      <Link href="/admin/products" onClick={() => setShowMobileMenu(false)} style={{
                        padding: '14px 20px',
                        color: '#4A5568',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        display: 'block'
                      }}>
                        Products
                      </Link>
                      <Link href="/admin/orders" onClick={() => setShowMobileMenu(false)} style={{
                        padding: '14px 20px',
                        color: '#4A5568',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        display: 'block'
                      }}>
                        Orders
                      </Link>
                      <Link href="/admin/categories" onClick={() => setShowMobileMenu(false)} style={{
                        padding: '14px 20px',
                        color: '#4A5568',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        display: 'block'
                      }}>
                        Categories
                      </Link>
                      <Link href="/admin/reports" onClick={() => setShowMobileMenu(false)} style={{
                        padding: '14px 20px',
                        color: '#4A5568',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        display: 'block'
                      }}>
                        Reports
                      </Link>
                    </>
                  )}
                  <button 
                    onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '14px 20px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '10px',
                      color: '#E74C3C',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '16px',
                      width: '100%',
                      fontFamily: 'inherit'
                    }}
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }

        @media (min-width: 1025px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}