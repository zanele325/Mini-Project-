"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';

export default function WishlistPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, wishlistCount, loading, removeFromWishlist, clearWishlist } = useWishlist();
  
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Redirect guests to login
  useEffect(() => {
    if (isGuest) {
      router.push('/login?redirect=/wishlist');
    }
  }, [isGuest, router]);

  // Move item to cart
  const handleMoveToCart = async (product) => {
    addToCart(product);
    await removeFromWishlist(product.id);
  };

  // Add all items to cart
  const handleAddAllToCart = () => {
    wishlistItems.forEach(item => {
      addToCart(item);
    });
    alert(`Added ${wishlistItems.length} items to your cart!`);
  };

  // Get product image emoji
  const getProductEmoji = (product) => {
    if (product.category === "Jewellery") return "💎";
    if (product.category === "Clothing") return "👗";
    if (product.category === "Headwear") return "👑";
    if (product.category === "Accessories") return "👜";
    if (product.category === "Footwear") return "👞";
    return "🎁";
  };

  // Get culture color
  const getCultureColor = (culture) => {
    const colors = {
      'Xhosa': '#E8F4F8',
      'Zulu': '#F8F4E8',
      'Sotho': '#F4F8E8',
      'Ndebele': '#F8E8F4',
      'Tswana': '#E8F8F4',
      'Venda': '#F4E8F8',
      'Tsonga': '#F8F8E8',
      'Pedi': '#E8E8F8'
    };
    return colors[culture] || '#F8F4E8';
  };

  // Loading state
  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty wishlist state
  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="empty-wishlist">
            <div className="empty-icon">♡</div>
            <h1 className="empty-title">Your wishlist is empty</h1>
            <p className="empty-text">
              Save items you love by clicking the ♡ icon on any product.
            </p>
            <Link href="/shop" className="shop-now-btn">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        {/* Header */}
        <div className="wishlist-header">
          <div className="header-left">
            <h1 className="wishlist-title">My Wishlist</h1>
            <p className="wishlist-subtitle">
              You have {wishlistCount} saved item{wishlistCount !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="header-actions">
            <button 
              className="share-btn"
              onClick={() => setShareModalOpen(true)}
            >
              <span className="btn-icon">🔗</span>
              Share
            </button>
            <button 
              className="add-all-btn"
              onClick={handleAddAllToCart}
              disabled={wishlistItems.length === 0}
            >
              <span className="btn-icon">🛒</span>
              Add All to Cart
            </button>
            <button 
              className="clear-btn"
              onClick={() => {
                if (confirm('Are you sure you want to clear your entire wishlist?')) {
                  clearWishlist();
                }
              }}
            >
              <span className="btn-icon">🗑️</span>
              Clear
            </button>
          </div>
        </div>

        {/* Wishlist Grid */}
      
<div className="wishlist-grid">
  {wishlistItems.map((item, index) => (  // ✅ Add index parameter
    <div 
      key={`wishlist-${item.id}-${index}`}  // ✅ Add index to make key unique
      className="wishlist-card"
    >
     
  
              {/* Product Image */}
              <div className="card-image">
                <div 
                  className="image-placeholder"
                  style={{ backgroundColor: getCultureColor(item.culture) }}
                >
                  <span className="product-emoji">{getProductEmoji(item)}</span>
                </div>
                
                <div className="card-badges">
                  <span className="culture-badge">{item.culture || 'Traditional'}</span>
                  {item.inStock && (
                    <span className="stock-badge">In Stock</span>
                  )}
                </div>

                <button 
                  className="remove-btn"
                  onClick={() => removeFromWishlist(item.id)}
                  title="Remove from wishlist"
                >
                  ✕
                </button>
              </div>

              <div className="card-content">
                <div className="occasion-tags">
                  {item.occasions?.slice(0, 2).map((occasion, idx) => (
                    <span key={idx} className="occasion-tag">{occasion}</span>
                  ))}
                  {item.occasions?.length > 2 && (
                    <span className="occasion-tag">+{item.occasions.length - 2}</span>
                  )}
                </div>

                <h3 className="product-name">
                  <Link href={`/product/${item.id}`} className="product-link">
                    {item.name || 'Traditional Item'}
                  </Link>
                </h3>

                <p className="product-description">
                  {item.description 
                    ? `${item.description.substring(0, 60)}...`
                    : 'Culturally significant traditional attire'}
                </p>

                <div className="card-footer">
                  <div className="price-section">
                    {item.salePrice ? (
                      <>
                        <span className="sale-price">R {item.salePrice.toFixed(2)}</span>
                        <span className="original-price">R {item.price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="price">R {item.price?.toFixed(2) || '0.00'}</span>
                    )}
                  </div>

                  <div className="action-buttons">
                    <button 
                      className="move-to-cart-btn"
                      onClick={() => handleMoveToCart(item)}
                      title="Move to cart"
                    >
                      🛒
                    </button>
                    <button 
                      className="view-btn"
                      onClick={() => router.push(`/product/${item.id}`)}
                      title="View details"
                    >
                      👁️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Share Modal - WITH REAL SOCIAL MEDIA LOGOS */}
        {shareModalOpen && (
          <div className="modal-overlay" onClick={() => setShareModalOpen(false)}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Share Your Wishlist</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShareModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <p className="modal-text">
                  Share your wishlist with friends and family:
                </p>
                
                <div className="share-link-container">
                  <input 
                    type="text"
                    className="share-link-input"
                    value={`https://isikostudio.com/wishlist/share/${user?.uid}`}
                    readOnly
                  />
                  <button 
                    className="copy-link-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://isikostudio.com/wishlist/share/${user?.uid}`);
                      alert('Link copied to clipboard!');
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div className="share-options">
                  <p className="share-options-title">Share via:</p>
                  <div className="share-buttons">
                    {/* WhatsApp */}
                    <button className="share-option whatsapp">
                      <svg className="share-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#25D366" d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.004.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.087.274.072.374-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087.159.058 1.011.477 1.184.564.173.087.289.13.332.202.043.072.043.419-.101.824z"/>
                      </svg>
                      WhatsApp
                    </button>
                    
                    {/* Email */}
                    <button className="share-option email">
                      <svg className="share-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#EA4335" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      Email
                    </button>
                    
                    {/* Facebook */}
                    <button className="share-option facebook">
                      <svg className="share-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>
                    
                    {/* Twitter/X */}
                    <button className="share-option twitter">
                      <svg className="share-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter
                    </button>
                    
                    {/* Pinterest */}
                    <button className="share-option pinterest">
                      <svg className="share-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#E60023" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.175.271-.406.163-1.528-.703-2.48-2.911-2.48-4.681 0-3.813 2.748-7.312 7.921-7.312 4.157 0 7.392 2.967 7.392 6.924 0 4.128-2.598 7.452-6.211 7.452-1.213 0-2.354-.629-2.745-1.373l-.749 2.854c-.271 1.041-1.008 2.345-1.5 3.142 1.135.353 2.322.542 3.55.542 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                      </svg>
                      Pinterest
                    </button>
                    
                    {/* LinkedIn */}
                    <button className="share-option linkedin">
                      <svg className="share-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </button>
                  </div>
                </div>

                <p className="modal-note">
                  <span className="note-icon">🔒</span>
                  Only you can edit your wishlist. Shared links are view-only.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .wishlist-page {
          background: #F8FAFC;
          min-height: 100vh;
          padding: 40px 20px 80px;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #E2E8F0;
          border-top-color: #3182CE;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-wishlist {
          max-width: 500px;
          margin: 80px auto;
          text-align: center;
          background: white;
          padding: 60px 40px;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .empty-icon {
          font-size: 64px;
          color: #FC8181;
          margin-bottom: 24px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .empty-title {
          font-size: 28px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 16px;
        }

        .empty-text {
          color: #64748B;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .shop-now-btn {
          display: inline-block;
          padding: 16px 32px;
          background: #3182CE;
          color: white;
          text-decoration: none;
          border-radius: 40px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .shop-now-btn:hover {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        .wishlist-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #E2E8F0;
        }

        .wishlist-title {
          font-size: 32px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 8px;
        }

        .wishlist-subtitle {
          color: #64748B;
          font-size: 16px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .share-btn,
        .add-all-btn,
        .clear-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #E2E8F0;
          background: white;
          color: #4A5568;
        }

        .share-btn:hover {
          background: #EBF8FF;
          border-color: #3182CE;
          color: #3182CE;
        }

        .add-all-btn {
          background: #3182CE;
          color: white;
          border: none;
        }

        .add-all-btn:hover:not(:disabled) {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        .add-all-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .clear-btn:hover {
          background: #FEF2F2;
          border-color: #FC8181;
          color: #E53E3E;
        }

        .btn-icon {
          font-size: 16px;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
        }

        .wishlist-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.02);
          transition: all 0.3s;
          position: relative;
        }

        .wishlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.06);
        }

        .card-image {
          position: relative;
          width: 100%;
          height: 240px;
          overflow: hidden;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s;
        }

        .wishlist-card:hover .image-placeholder {
          transform: scale(1.05);
        }

        .product-emoji {
          font-size: 64px;
        }

        .card-badges {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          gap: 8px;
        }

        .culture-badge {
          background: rgba(49, 130, 206, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .stock-badge {
          background: rgba(46, 125, 50, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .remove-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          background: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .remove-btn:hover {
          background: #FEF2F2;
          color: #E53E3E;
          transform: scale(1.1);
        }

        .card-content {
          padding: 24px;
        }

        .occasion-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .occasion-tag {
          background: #F1F5F9;
          color: #475569;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .product-name {
          margin-bottom: 12px;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
        }

        .product-link {
          color: #1A2B3C;
          text-decoration: none;
          transition: color 0.2s;
        }

        .product-link:hover {
          color: #3182CE;
        }

        .product-description {
          color: #64748B;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #EDF2F7;
        }

        .price-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .price {
          font-size: 20px;
          font-weight: 700;
          color: #1A2B3C;
        }

        .sale-price {
          font-size: 20px;
          font-weight: 700;
          color: #E53E3E;
        }

        .original-price {
          font-size: 14px;
          color: #94A3B8;
          text-decoration: line-through;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .move-to-cart-btn,
        .view-btn {
          width: 44px;
          height: 44px;
          border: 1px solid #E2E8F0;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #4A5568;
          cursor: pointer;
          transition: all 0.2s;
        }

        .move-to-cart-btn:hover {
          background: #EBF8FF;
          border-color: #3182CE;
          color: #3182CE;
        }

        .view-btn:hover {
          background: #F1F5F9;
          border-color: #64748B;
          color: #1A2B3C;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .share-modal {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          border-bottom: 1px solid #EDF2F7;
        }

        .modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1A2B3C;
          margin: 0;
        }

        .close-modal-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #94A3B8;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-modal-btn:hover {
          background: #F1F5F9;
          color: #1A2B3C;
        }

        .modal-body {
          padding: 28px;
        }

        .modal-text {
          color: #1A2B3C;
          margin-bottom: 20px;
          font-size: 15px;
        }

        .share-link-container {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
        }

        .share-link-input {
          flex: 1;
          padding: 14px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          color: #1A2B3C;
          background: #F8FAFC;
        }

        .copy-link-btn {
          padding: 14px 24px;
          background: #3182CE;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-link-btn:hover {
          background: #1E4E8C;
        }

        .share-options {
          margin-bottom: 28px;
        }

        .share-options-title {
          font-size: 15px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 16px;
        }

        .share-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .share-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          font-weight: 500;
          color: #1A2B3C;
        }

        .share-option:hover {
          background: #F8FAFC;
          border-color: #CBD5E0;
          transform: translateY(-2px);
        }

        .share-option.whatsapp:hover {
          border-color: #25D366;
          color: #25D366;
        }

        .share-option.email:hover {
          border-color: #EA4335;
          color: #EA4335;
        }

        .share-option.facebook:hover {
          border-color: #1877F2;
          color: #1877F2;
        }

        .share-option.twitter:hover {
          border-color: #000000;
          color: #000000;
        }

        .share-option.pinterest:hover {
          border-color: #E60023;
          color: #E60023;
        }

        .share-option.linkedin:hover {
          border-color: #0A66C2;
          color: #0A66C2;
        }

        .share-icon {
          width: 24px;
          height: 24px;
        }

        .modal-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #F8FAFC;
          border-radius: 12px;
          color: #64748B;
          font-size: 13px;
          margin: 0;
        }

        .note-icon {
          font-size: 16px;
        }

        @media (max-width: 1024px) {
          .wishlist-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .wishlist-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .header-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .share-btn,
          .add-all-btn,
          .clear-btn {
            flex: 1;
            justify-content: center;
          }

          .wishlist-grid {
            grid-template-columns: 1fr;
          }

          .share-buttons {
            grid-template-columns: repeat(2, 1fr);
          }

          .share-link-container {
            flex-direction: column;
          }

          .copy-link-btn {
            width: 100%;
          }

          .card-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .action-buttons {
            width: 100%;
          }

          .move-to-cart-btn,
          .view-btn {
            flex: 1;
          }
        }

        @media (max-width: 480px) {
          .wishlist-title {
            font-size: 28px;
          }

          .header-actions {
            flex-direction: column;
          }

          .share-buttons {
            grid-template-columns: 1fr;
          }

          .share-option {
            flex-direction: row;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}