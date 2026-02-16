"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';
import {
  Heart,
  Share2,
  ShoppingCart,
  Trash2,
  Eye,
  Plus,
  X,
  Copy,
  Check,
  Lock,
  AlertCircle,
  ArrowRight
} from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, wishlistCount, loading, removeFromWishlist, clearWishlist } = useWishlist();
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
    const emojiMap = {
      'Jewellery': '💎',
      'Clothing': '👗',
      'Headwear': '👑',
      'Accessories': '👜',
      'Footwear': '👞'
    };
    return emojiMap[product.category] || '🎁';
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://isikostudio.com/wishlist/share/${user?.uid}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
        
        <div style={{
          minHeight: 'calc(100vh - 76px)',
          background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
          padding: '40px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #B38B59',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }}></div>
            <p style={{ color: '#666', fontSize: '16px', fontWeight: '500' }}>Loading your wishlist...</p>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  // Empty wishlist state
  if (wishlistItems.length === 0) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
        
        <div style={{
          minHeight: 'calc(100vh - 76px)',
          padding: '60px 20px',
          background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)'
        }}>
          <div style={{ maxWidth: '600px', margin: '80px auto' }}>
            <div style={{
              background: 'white',
              padding: '60px 40px',
              borderRadius: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              textAlign: 'center',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #FFE8E8 0%, #FFD6D6 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'pulse 2s infinite'
              }}>
                <Heart size={40} color="#E74C3C" />
              </div>
              
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '16px',
                fontFamily: "'Crimson Pro', serif"
              }}>
                Your wishlist is empty
              </h1>
              
              <p style={{
                color: '#666',
                marginBottom: '32px',
                lineHeight: '1.6',
                fontSize: '15px'
              }}>
                Save items you love by clicking the <Heart size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on any product.
              </p>
              
              <Link href="/shop" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)'
              }}>
                Browse Products
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

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
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
      `}</style>
      
      <div style={{
        background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
        minHeight: 'calc(100vh - 76px)',
        padding: '40px 20px 80px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '40px',
            paddingBottom: '24px',
            borderBottom: '2px solid #f0f0f0',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '8px',
                fontFamily: "'Crimson Pro', serif"
              }}>
                My Wishlist
              </h1>
              <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
                You have {wishlistCount} saved item{wishlistCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShareModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#B38B59';
                  e.currentTarget.style.color = '#B38B59';
                  e.currentTarget.style.background = '#FFF9F0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <Share2 size={16} />
                Share
              </button>
              
              <button
                onClick={handleAddAllToCart}
                disabled={wishlistItems.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: wishlistItems.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
                  fontFamily: 'inherit',
                  opacity: wishlistItems.length === 0 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (wishlistItems.length > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(179, 139, 89, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(179, 139, 89, 0.3)';
                }}
              >
                <ShoppingCart size={16} />
                Add All to Cart
              </button>
              
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear your entire wishlist?')) {
                    clearWishlist();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FEF2F2';
                  e.currentTarget.style.borderColor = '#FECACA';
                  e.currentTarget.style.color = '#E74C3C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.color = '#666';
                }}
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </div>

          {/* Wishlist Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '32px'
          }}>
            {wishlistItems.map((item, index) => (
              <div 
                key={`wishlist-${item.id}-${index}`}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s',
                  position: 'relative',
                  border: '1px solid #f0f0f0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', width: '100%', height: '240px', overflow: 'hidden' }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: getCultureColor(item.culture),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '64px',
                    transition: 'transform 0.3s'
                  }}>
                    {getProductEmoji(item)}
                  </div>
                  
                  {/* Badges */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span style={{
                      background: 'rgba(179, 139, 89, 0.95)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {item.culture || 'Traditional'}
                    </span>
                    {item.inStock && (
                      <span style={{
                        background: 'rgba(46, 139, 87, 0.95)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backdropFilter: 'blur(4px)'
                      }}>
                        In Stock
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    title="Remove from wishlist"
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '36px',
                      height: '36px',
                      background: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEF2F2';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <X size={18} color="#E74C3C" />
                  </button>
                </div>

                {/* Card Content */}
                <div style={{ padding: '24px' }}>
                  {/* Occasion Tags */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    {item.occasions?.slice(0, 2).map((occasion, idx) => (
                      <span key={idx} style={{
                        background: '#F5F5F5',
                        color: '#666',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {occasion}
                      </span>
                    ))}
                    {item.occasions?.length > 2 && (
                      <span style={{
                        background: '#F5F5F5',
                        color: '#666',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        +{item.occasions.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Product Name */}
                  <h3 style={{
                    marginBottom: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    lineHeight: '1.4'
                  }}>
                    <Link href={`/product/${item.id}`} style={{
                      color: '#1A1A1A',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}>
                      {item.name || 'Traditional Item'}
                    </Link>
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: '#666',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    marginBottom: '20px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {item.description 
                      ? item.description
                      : 'Culturally significant traditional attire'}
                  </p>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.salePrice ? (
                        <>
                          <span style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#E74C3C'
                          }}>
                            R {item.salePrice.toFixed(2)}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            color: '#999',
                            textDecoration: 'line-through'
                          }}>
                            R {item.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#1A1A1A'
                        }}>
                          R {item.price?.toFixed(2) || '0.00'}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleMoveToCart(item)}
                        title="Move to cart"
                        style={{
                          width: '44px',
                          height: '44px',
                          border: '2px solid #e0e0e0',
                          background: 'white',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FFF9F0';
                          e.currentTarget.style.borderColor = '#B38B59';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#e0e0e0';
                        }}
                      >
                        <ShoppingCart size={18} color="#B38B59" />
                      </button>
                      
                      <button
                        onClick={() => router.push(`/product/${item.id}`)}
                        title="View details"
                        style={{
                          width: '44px',
                          height: '44px',
                          border: '2px solid #e0e0e0',
                          background: 'white',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F8F8F8';
                          e.currentTarget.style.borderColor = '#666';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#e0e0e0';
                        }}
                      >
                        <Eye size={18} color="#666" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Share Modal */}
          {shareModalOpen && (
            <div 
              onClick={() => setShareModalOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease',
                padding: '20px'
              }}
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  width: '100%',
                  maxWidth: '520px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  animation: 'slideUp 0.3s ease'
                }}
              >
                {/* Modal Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px 28px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0,
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Share Your Wishlist
                  </h3>
                  <button
                    onClick={() => setShareModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '50%',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <X size={20} color="#999" />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '28px' }}>
                  <p style={{
                    color: '#1A1A1A',
                    marginBottom: '20px',
                    fontSize: '15px'
                  }}>
                    Share your wishlist with friends and family:
                  </p>

                  {/* Share Link */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '28px'
                  }}>
                    <input
                      type="text"
                      value={`https://isikostudio.com/wishlist/share/${user?.uid}`}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        color: '#1A1A1A',
                        background: '#F8F8F8',
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleCopyLink}
                      style={{
                        padding: '14px 24px',
                        background: copied ? 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)' : 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: copied ? '0 4px 12px rgba(46, 139, 87, 0.3)' : '0 4px 12px rgba(179, 139, 89, 0.3)'
                      }}
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Privacy Notice */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: '#FFF9F0',
                    borderRadius: '12px',
                    border: '1px solid #F0E6D6'
                  }}>
                    <Lock size={20} color="#B38B59" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#8B6A3D',
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}>
                        Privacy Protected
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#8B6A3D',
                        lineHeight: '1.6'
                      }}>
                        Only you can edit your wishlist. Shared links are view-only.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          /* Responsive adjustments handled inline */
        }

        @media (max-width: 768px) {
          /* Mobile-specific styles */
        }
      `}</style>
    </>
  );
}