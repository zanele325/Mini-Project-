"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Tag,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  const subtotal = getCartTotal();
  const shipping = subtotal > 1000 ? 0 : 50;
  const tax = subtotal * 0.15;
  const total = subtotal + shipping + tax - discount;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'WELCOME10') {
      setDiscount(subtotal * 0.1);
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handleCheckout = () => {
    if (!user && !isGuest) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleContinueShopping = () => {
    router.push('/shop');
  };

  const getProductEmoji = (category) => {
    const emojiMap = {
      'Jewellery': '💎',
      'Clothing': '👗',
      'Headwear': '👑',
      'Accessories': '👜',
      'Footwear': '👞'
    };
    return emojiMap[category] || '🎁';
  };

  // Empty cart state
  if (cartItems.length === 0) {
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
          padding: '60px 20px',
          background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
                background: 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <ShoppingCart size={40} color="#999" />
              </div>
              
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '16px',
                fontFamily: "'Crimson Pro', serif"
              }}>
                Your cart is empty
              </h1>
              
              <p style={{
                color: '#666',
                marginBottom: '32px',
                lineHeight: '1.6',
                fontSize: '15px'
              }}>
                {isGuest 
                  ? "Looks like you haven't added anything to your cart yet."
                  : "Looks like you haven't added anything to your cart yet."}
              </p>
              
              <button 
                onClick={handleContinueShopping}
                style={{
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(179, 139, 89, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(179, 139, 89, 0.3)';
                }}
              >
                Continue Shopping
                <ArrowRight size={18} />
              </button>
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
      `}</style>
      
      <div style={{
        minHeight: 'calc(100vh - 76px)',
        background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
        padding: '40px 20px 80px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: '8px',
              fontFamily: "'Crimson Pro', serif"
            }}>
              Shopping Cart
            </h1>
            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
              {isGuest 
                ? "You're shopping as a guest. Sign in to save your cart for later."
                : `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`}
            </p>
          </div>

          {/* Cart Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '32px',
            alignItems: 'start'
          }}
          className="cart-grid">
            {/* Cart Items Section */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              border: '1px solid #f0f0f0'
            }}>
              {/* Desktop Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr 1.2fr 1fr 40px',
                padding: '0 0 20px',
                borderBottom: '2px solid #f0f0f0',
                color: '#999',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              className="cart-header">
                <div>Product</div>
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
                <div></div>
              </div>

              {/* Cart Items */}
              <div style={{ marginTop: '8px' }}>
                {cartItems.map((item, index) => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1fr 1.2fr 1fr 40px',
                      alignItems: 'center',
                      padding: '24px 0',
                      borderBottom: index < cartItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                    className="cart-item"
                  >
                    {/* Product - UPDATED TO USE REAL IMAGES */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative'
                      }}>
                        {item.imageUrl || item.image ? (
                          <img 
                            src={item.imageUrl || item.image} 
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              display: 'block'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.cart-image-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback emoji */}
                        <div 
                          className="cart-image-fallback"
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #FFF9F0 0%, #FFE8CC 100%)',
                            display: (item.imageUrl || item.image) ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            position: (item.imageUrl || item.image) ? 'absolute' : 'static',
                            top: 0,
                            left: 0
                          }}
                        >
                          {getProductEmoji(item.category)}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          marginBottom: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.name || 'Traditional Item'}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {item.culture && (
                            <span style={{
                              fontSize: '12px',
                              color: '#B38B59',
                              background: '#FFF9F0',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontWeight: '500'
                            }}>
                              {item.culture}
                            </span>
                          )}
                          {item.occasions && item.occasions[0] && (
                            <span style={{
                              fontSize: '12px',
                              color: '#666',
                              background: '#F5F5F5',
                              padding: '4px 10px',
                              borderRadius: '6px'
                            }}>
                              {item.occasions[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{
                      fontSize: '15px',
                      color: '#1A1A1A',
                      fontWeight: '500'
                    }}
                    className="item-price">
                      R {item.salePrice ? item.salePrice.toFixed(2) : item.price?.toFixed(2) || '0.00'}
                    </div>

                    {/* Quantity */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    className="item-quantity">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        style={{
                          width: '36px',
                          height: '36px',
                          border: '2px solid #e0e0e0',
                          background: 'white',
                          borderRadius: '8px',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          opacity: item.quantity <= 1 ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (item.quantity > 1) {
                            e.currentTarget.style.borderColor = '#B38B59';
                            e.currentTarget.style.background = '#FFF9F0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <Minus size={16} color="#666" />
                      </button>
                      
                      <span style={{
                        fontWeight: '600',
                        color: '#1A1A1A',
                        minWidth: '24px',
                        textAlign: 'center',
                        fontSize: '16px'
                      }}>
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        style={{
                          width: '36px',
                          height: '36px',
                          border: '2px solid #e0e0e0',
                          background: 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#B38B59';
                          e.currentTarget.style.background = '#FFF9F0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <Plus size={16} color="#666" />
                      </button>
                    </div>

                    {/* Total */}
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1A1A1A'
                    }}
                    className="item-total">
                      R {((item.salePrice || item.price || 0) * item.quantity).toFixed(2)}
                    </div>

                    {/* Remove */}
                    <div className="item-action">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FEF2F2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                        title="Remove item"
                      >
                        <X size={18} color="#E74C3C" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '2px solid #f0f0f0'
              }}
              className="cart-actions">
                <button
                  onClick={handleContinueShopping}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#B38B59',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <ArrowLeft size={18} />
                  Continue Shopping
                </button>
                
                <button
                  onClick={clearCart}
                  style={{
                    background: 'none',
                    border: '2px solid #e0e0e0',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FEF2F2';
                    e.currentTarget.style.borderColor = '#FECACA';
                    e.currentTarget.style.color = '#E74C3C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  <Trash2 size={16} />
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ position: 'sticky', top: '100px' }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: '1px solid #f0f0f0'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '24px',
                  fontFamily: "'Crimson Pro', serif"
                }}>
                  Order Summary
                </h2>

                {/* Summary Details */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    fontSize: '15px',
                    color: '#666'
                  }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: '600', color: '#1A1A1A' }}>R {subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    fontSize: '15px',
                    color: '#666'
                  }}>
                    <span>Shipping</span>
                    <span style={{ fontWeight: '600', color: '#1A1A1A' }}>
                      {shipping === 0 ? 'Free' : `R ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    fontSize: '15px',
                    color: '#666'
                  }}>
                    <span>Tax (15%)</span>
                    <span style={{ fontWeight: '600', color: '#1A1A1A' }}>R {tax.toFixed(2)}</span>
                  </div>
                  
                  {promoApplied && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      fontSize: '15px',
                      color: '#2E8B57'
                    }}>
                      <span>Discount (WELCOME10)</span>
                      <span style={{ fontWeight: '600' }}>-R {discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div style={{ height: '1px', background: '#f0f0f0', margin: '20px 0' }}></div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1A1A1A'
                  }}>
                    <span>Total</span>
                    <span style={{ color: '#B38B59' }}>R {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Promo Code */}
                <div style={{
                  marginBottom: '28px',
                  paddingBottom: '28px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Tag size={16} color="#B38B59" />
                    Promo Code
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        outline: 'none',
                        opacity: promoApplied ? 0.6 : 1
                      }}
                      onFocus={(e) => !promoApplied && (e.target.style.borderColor = '#B38B59')}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoApplied || !promoCode}
                      style={{
                        padding: '12px 24px',
                        background: promoApplied || !promoCode ? '#e0e0e0' : 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: promoApplied || !promoCode ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        boxShadow: promoApplied || !promoCode ? 'none' : '0 2px 8px rgba(179, 139, 89, 0.2)'
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#E74C3C',
                      fontSize: '13px',
                      marginTop: '8px'
                    }}>
                      <AlertCircle size={14} />
                      {promoError}
                    </div>
                  )}
                  {promoApplied && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#2E8B57',
                      fontSize: '13px',
                      marginTop: '8px'
                    }}>
                      <CheckCircle size={14} />
                      Promo code applied successfully!
                    </div>
                  )}
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '20px',
                    boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(179, 139, 89, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(179, 139, 89, 0.3)';
                  }}
                >
                  {isGuest ? 'Sign in to Checkout' : 'Proceed to Checkout'}
                  <ArrowRight size={18} />
                </button>

                {/* Guest Message */}
                {isGuest && (
                  <div style={{
                    background: '#FFF9F0',
                    border: '1px solid #F0E6D6',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      color: '#8B6A3D',
                      fontSize: '13px',
                      margin: 0,
                      lineHeight: '1.6'
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        You're checking out as a guest.{' '}
                        <Link href="/login?redirect=/checkout" style={{
                          color: '#B38B59',
                          textDecoration: 'none',
                          fontWeight: '600'
                        }}>
                          Sign in
                        </Link>
                        {' '}to save your order history and track shipments.
                      </span>
                    </p>
                  </div>
                )}

                {/* Payment Methods */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    color: '#999',
                    fontSize: '13px',
                    marginBottom: '12px'
                  }}>
                    We accept:
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#F5F5F5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CreditCard size={20} color="#666" />
                    </div>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#F5F5F5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Smartphone size={20} color="#666" />
                    </div>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#F5F5F5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 size={20} color="#666" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .cart-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .cart-header {
            display: none !important;
          }

          .cart-item {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            position: relative;
          }

          .item-price::before {
            content: "Price: ";
            font-weight: 400;
            color: #999;
          }

          .item-quantity::before {
            content: "Quantity: ";
            font-weight: 400;
            color: #999;
            margin-right: 8px;
          }

          .item-total::before {
            content: "Total: ";
            font-weight: 400;
            color: #999;
          }

          .item-action {
            position: absolute !important;
            top: 24px !important;
            right: 0 !important;
          }

          .cart-actions {
            flex-direction: column !important;
            gap: 16px !important;
            align-items: stretch !important;
          }

          .cart-actions button:last-child {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}