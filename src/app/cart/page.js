"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';

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

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h1 className="empty-cart-title">Your cart is empty</h1>
            <p className="empty-cart-text">
              {isGuest 
                ? "Looks like you haven't added anything to your cart yet."
                : "Looks like you haven't added anything to your cart yet."}
            </p>
            <button onClick={handleContinueShopping} className="continue-shopping-btn">
              Continue Shopping
            </button>
          </div>
        </div>

        <style jsx>{`
          .cart-page {
            min-height: 60vh;
            padding: 60px 20px;
            background: #F8FAFC;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .empty-cart {
            max-width: 500px;
            margin: 0 auto;
            text-align: center;
            background: white;
            padding: 60px 40px;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          }

          .empty-cart-icon {
            font-size: 64px;
            margin-bottom: 24px;
            color: #94A3B8;
          }

          .empty-cart-title {
            font-size: 28px;
            font-weight: 700;
            color: #1A2B3C;
            margin-bottom: 16px;
          }

          .empty-cart-text {
            color: #64748B;
            margin-bottom: 32px;
            line-height: 1.6;
          }

          .continue-shopping-btn {
            background: #3182CE;
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 40px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .continue-shopping-btn:hover {
            background: #1E4E8C;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Header */}
        <div className="cart-header">
          <h1 className="cart-title">Shopping Cart</h1>
          <p className="cart-subtitle">
            {isGuest 
              ? "You're shopping as a guest. Sign in to save your cart for later."
              : `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`}
          </p>
        </div>

        {/* Cart Content */}
        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items-section">
            <div className="cart-items-header">
              <div className="product-col">Product</div>
              <div className="price-col">Price</div>
              <div className="quantity-col">Quantity</div>
              <div className="total-col">Total</div>
              <div className="action-col"></div>
            </div>

            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-product">
                    <div className="item-image-placeholder">
                      {item.category === 'Jewellery' ? '💎' : 
                       item.category === 'Clothing' ? '👗' : 
                       item.category === 'Headwear' ? '👑' : '🎁'}
                    </div>
                    <div className="item-details">
                      <h3 className="item-name">{item.name || 'Traditional Item'}</h3>
                      <div className="item-meta">
                        {item.culture && (
                          <span className="item-culture">{item.culture}</span>
                        )}
                        {item.occasions && item.occasions[0] && (
                          <span className="item-occasion">{item.occasions[0]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="item-price">
                    R {item.salePrice ? item.salePrice.toFixed(2) : item.price?.toFixed(2) || '0.00'}
                  </div>
                  
                  <div className="item-quantity">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="item-total">
                    R {((item.salePrice || item.price || 0) * item.quantity).toFixed(2)}
                  </div>
                  
                  <div className="item-action">
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-actions">
              <button onClick={handleContinueShopping} className="continue-link">
                ← Continue Shopping
              </button>
              <button onClick={clearCart} className="clear-cart-btn">
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>R {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `R ${shipping.toFixed(2)}`}</span>
              </div>
              
              <div className="summary-row">
                <span>Tax (15%)</span>
                <span>R {tax.toFixed(2)}</span>
              </div>
              
              {promoApplied && (
                <div className="summary-row discount">
                  <span>Discount (WELCOME10)</span>
                  <span>-R {discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Total</span>
                <span>R {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="promo-section">
              <h3 className="promo-title">Promo Code</h3>
              <div className="promo-input-group">
                <input
                  type="text"
                  className="promo-input"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoApplied}
                />
                <button 
                  className="promo-apply-btn"
                  onClick={handleApplyPromo}
                  disabled={promoApplied || !promoCode}
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="promo-error">{promoError}</p>}
              {promoApplied && (
                <p className="promo-success">✓ Promo code applied successfully!</p>
              )}
            </div>

            {/* Checkout Button */}
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
            >
              {isGuest ? 'Sign in to Checkout' : 'Proceed to Checkout'}
            </button>

            {/* Guest Message */}
            {isGuest && (
              <div className="guest-message">
                <p>
                  <span>👤</span> 
                  You're checking out as a guest. 
                  <Link href="/login?redirect=/checkout" className="guest-link">
                    Sign in
                  </Link> 
                  to save your order history and track shipments.
                </p>
              </div>
            )}

            {/* Accepted Payments */}
            <div className="payment-methods">
              <p className="payment-text">We accept:</p>
              <div className="payment-icons">
                <span className="payment-icon">💳</span>
                <span className="payment-icon">📱</span>
                <span className="payment-icon">🏦</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          background: #F8FAFC;
          padding: 40px 20px 80px;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header */
        .cart-header {
          margin-bottom: 40px;
        }

        .cart-title {
          font-size: 32px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 8px;
        }

        .cart-subtitle {
          color: #64748B;
          font-size: 16px;
        }

        /* Cart Content */
        .cart-content {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
        }

        /* Cart Items Section */
        .cart-items-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
        }

        .cart-items-header {
          display: grid;
          grid-template-columns: 3fr 1fr 1fr 1fr 40px;
          padding: 0 0 16px;
          border-bottom: 1px solid #EDF2F7;
          color: #64748B;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cart-items {
          margin-top: 8px;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 3fr 1fr 1fr 1fr 40px;
          align-items: center;
          padding: 24px 0;
          border-bottom: 1px solid #EDF2F7;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        /* Product Column */
        .item-product {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .item-image-placeholder {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #F0F9FF, #E6F2FF);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-size: 16px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 6px;
        }

        .item-meta {
          display: flex;
          gap: 8px;
        }

        .item-culture {
          font-size: 12px;
          color: #3182CE;
          background: #EBF8FF;
          padding: 4px 8px;
          border-radius: 20px;
        }

        .item-occasion {
          font-size: 12px;
          color: #64748B;
          background: #F1F5F9;
          padding: 4px 8px;
          border-radius: 20px;
        }

        /* Price Column */
        .item-price {
          font-size: 15px;
          color: #1A2B3C;
          font-weight: 500;
        }

        /* Quantity Column */
        .item-quantity {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quantity-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #E2E8F0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #4A5568;
          transition: all 0.2s;
        }

        .quantity-btn:hover:not(:disabled) {
          background: #F7FAFC;
          border-color: #3182CE;
          color: #3182CE;
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-value {
          font-weight: 600;
          color: #1A2B3C;
          min-width: 24px;
          text-align: center;
        }

        /* Total Column */
        .item-total {
          font-size: 16px;
          font-weight: 600;
          color: #1A2B3C;
        }

        /* Action Column */
        .remove-btn {
          background: none;
          border: none;
          font-size: 18px;
          color: #94A3B8;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #FEF2F2;
          color: #E53E3E;
        }

        /* Cart Actions */
        .cart-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #EDF2F7;
        }

        .continue-link {
          background: none;
          border: none;
          color: #3182CE;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .continue-link:hover {
          color: #1E4E8C;
          transform: translateX(-4px);
        }

        .clear-cart-btn {
          background: none;
          border: 1px solid #E2E8F0;
          padding: 10px 20px;
          border-radius: 8px;
          color: #64748B;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-cart-btn:hover {
          background: #FEF2F2;
          border-color: #FECACA;
          color: #E53E3E;
        }

        /* Order Summary */
        .order-summary {
          background: white;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
          height: fit-content;
          position: sticky;
          top: 100px;
        }

        .summary-title {
          font-size: 20px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 24px;
        }

        .summary-details {
          margin-bottom: 24px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          color: #4A5568;
          font-size: 15px;
        }

        .summary-row.discount {
          color: #2E7D32;
        }

        .summary-divider {
          height: 1px;
          background: #EDF2F7;
          margin: 20px 0;
        }

        .summary-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 0;
        }

        /* Promo Section */
        .promo-section {
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid #EDF2F7;
        }

        .promo-title {
          font-size: 15px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 12px;
        }

        .promo-input-group {
          display: flex;
          gap: 12px;
        }

        .promo-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .promo-input:focus {
          outline: none;
          border-color: #3182CE;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .promo-apply-btn {
          padding: 12px 24px;
          background: #3182CE;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .promo-apply-btn:hover:not(:disabled) {
          background: #1E4E8C;
        }

        .promo-apply-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .promo-error {
          color: #E53E3E;
          font-size: 13px;
          margin-top: 8px;
        }

        .promo-success {
          color: #2E7D32;
          font-size: 13px;
          margin-top: 8px;
        }

        /* Checkout Button */
        .checkout-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #3182CE, #1E4E8C);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 20px;
        }

        .checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.3);
        }

        /* Guest Message */
        .guest-message {
          background: #FEF9C3;
          border: 1px solid #FDE68A;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .guest-message p {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #854D0E;
          font-size: 14px;
          margin: 0;
          flex-wrap: wrap;
        }

        .guest-link {
          color: #3182CE;
          text-decoration: none;
          font-weight: 600;
          margin-left: 4px;
        }

        .guest-link:hover {
          text-decoration: underline;
        }

        /* Payment Methods */
        .payment-methods {
          text-align: center;
        }

        .payment-text {
          color: #64748B;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .payment-icons {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .payment-icon {
          font-size: 24px;
          opacity: 0.7;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .cart-content {
            grid-template-columns: 1fr;
          }

          .order-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .cart-items-header {
            display: none;
          }

          .cart-item {
            grid-template-columns: 1fr;
            gap: 16px;
            position: relative;
            padding: 20px 0;
          }

          .item-product {
            grid-column: 1 / -1;
          }

          .item-price,
          .item-quantity,
          .item-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 96px;
          }

          .item-price::before {
            content: "Price:";
            font-weight: 400;
            color: #64748B;
          }

          .item-quantity::before {
            content: "Quantity:";
            font-weight: 400;
            color: #64748B;
          }

          .item-total::before {
            content: "Total:";
            font-weight: 400;
            color: #64748B;
          }

          .item-action {
            position: absolute;
            top: 20px;
            right: 0;
          }

          .cart-actions {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .clear-cart-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}