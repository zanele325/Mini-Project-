// app/components/Navigation.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const pathname = usePathname();
  
  // Check if a link is active
  const isActive = (path) => {
    return pathname === path;
  };

  // Mock cart items (you'll replace this with real cart context later)
  const mockAddToCart = () => {
    setCartCount(cartCount + 1);
  };

  return (
    <header className="header">
      <div className="container header-content">
        {/* Logo */}
        <Link href="/" className="logo">
          <div className="logo-icon">iS</div>
          <div className="logo-text">iSiko Studio</div>
        </Link>
        
        {/* Main Navigation */}
        <nav className="nav-links">
          <Link 
            href="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            href="/shop" 
            className={`nav-link ${isActive('/shop') ? 'active' : ''}`}
          >
            Shop
          </Link>
          <Link 
            href="/occasions" 
            className={`nav-link ${isActive('/occasions') ? 'active' : ''}`}
          >
            Occasions
          </Link>
          <Link 
            href="/cultures" 
            className={`nav-link ${isActive('/cultures') ? 'active' : ''}`}
          >
            Cultures
          </Link>
          <Link 
            href="/about" 
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          >
            About
          </Link>
          
          {/* Search Button */}
          <button 
            className="icon-button"
            onClick={() => alert("Search functionality coming soon!")}
            title="Search"
          >
            🔍
          </button>
          
          {/* Wishlist Button */}
          <button 
            className="icon-button"
            onClick={() => {
              setWishlistCount(wishlistCount + 1);
              alert("Added to wishlist!");
            }}
            title="Wishlist"
          >
            ♡
            {wishlistCount > 0 && (
              <span className="icon-badge">{wishlistCount}</span>
            )}
          </button>
          
          {/* Cart Button */}
          <button 
            className="icon-button"
            onClick={() => {
              mockAddToCart();
              alert("Added sample item to cart!");
            }}
            title="Cart"
          >
            🛒
            {cartCount > 0 && (
              <span className="icon-badge">{cartCount}</span>
            )}
          </button>
          
          {/* User/Login Button */}
          <button 
            className="icon-button"
            onClick={() => alert("Login/Signup coming soon!")}
            title="Account"
          >
            👤
          </button>
        </nav>
        
        {/* Mobile Menu Button (hidden on desktop) */}
        <button 
          className="mobile-menu-button"
          onClick={() => alert("Mobile menu coming soon!")}
        >
          ☰
        </button>
      </div>
    </header>
  );
}