"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // Shipping info
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: ''
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentMethods] = useState([
    { id: 'cod', name: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive your order' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Pay with Visa, Mastercard, or AMEX' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️', description: 'Secure payment with PayPal' },
    { id: 'eft', name: 'EFT', icon: '🏦', description: 'Electronic Funds Transfer' }
  ]);

  // Calculate order totals
  const subtotal = getCartTotal();
  const shipping = subtotal > 1000 ? 0 : 50;
  const tax = subtotal * 0.15;
  const total = subtotal + shipping + tax;

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !orderComplete) {
      router.push('/cart');
    }
  }, [cartItems, orderComplete, router]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setLoading(true);

    // Simulate order processing
    setTimeout(async () => {
      try {
        // Generate order number
        const orderNum = 'ORD-' + Date.now().toString().slice(-8);
        setOrderNumber(orderNum);

        // Create order object
        const orderData = {
          orderNumber: orderNum,
          customer: {
            uid: user?.uid || 'guest',
            email: shippingInfo.email || user?.email,
            name: shippingInfo.fullName,
            phone: shippingInfo.phone,
            isGuest: isGuest
          },
          shipping: shippingInfo,
          paymentMethod: paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
          orderStatus: 'processing',
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.salePrice || item.price,
            quantity: item.quantity,
            culture: item.culture,
            category: item.category
          })),
          subtotal: subtotal,
          shipping: shipping,
          tax: tax,
          total: total,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save to Firebase if user is logged in
        if (user) {
          await addDoc(collection(db, 'orders'), orderData);
        }

        // Save to localStorage for guests
        if (isGuest) {
          const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
          guestOrders.push(orderData);
          localStorage.setItem('guestOrders', JSON.stringify(guestOrders));
        }

        // Clear cart and show success
        clearCart();
        setOrderComplete(true);
        setStep(3);
        
      } catch (error) {
        console.error('Error creating order:', error);
        alert('There was an error processing your order. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Render progress steps
  const renderProgressSteps = () => (
    <div className="progress-steps">
      <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
        <span className="step-number">{step > 1 ? '✓' : '1'}</span>
        <span className="step-label">Shipping</span>
      </div>
      <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
      <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
        <span className="step-number">{step > 2 ? '✓' : '2'}</span>
        <span className="step-label">Payment</span>
      </div>
      <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
      <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
        <span className="step-number">3</span>
        <span className="step-label">Confirmation</span>
      </div>
    </div>
  );

  // Render shipping form
  const renderShippingForm = () => (
    <form onSubmit={handleShippingSubmit} className="checkout-form">
      <h2 className="section-title">Shipping Information</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fullName">Full Name *</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={shippingInfo.fullName}
            onChange={handleInputChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={shippingInfo.email}
            onChange={handleInputChange}
            required
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={shippingInfo.phone}
            onChange={handleInputChange}
            required
            placeholder="+27 XX XXX XXXX"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="address">Street Address *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={shippingInfo.address}
          onChange={handleInputChange}
          required
          placeholder="Street address, P.O. Box"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={shippingInfo.city}
            onChange={handleInputChange}
            required
            placeholder="City"
          />
        </div>

        <div className="form-group">
          <label htmlFor="province">Province *</label>
          <select
            id="province"
            name="province"
            value={shippingInfo.province}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Province</option>
            <option value="Eastern Cape">Eastern Cape</option>
            <option value="Free State">Free State</option>
            <option value="Gauteng">Gauteng</option>
            <option value="KwaZulu-Natal">KwaZulu-Natal</option>
            <option value="Limpopo">Limpopo</option>
            <option value="Mpumalanga">Mpumalanga</option>
            <option value="Northern Cape">Northern Cape</option>
            <option value="North West">North West</option>
            <option value="Western Cape">Western Cape</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="postalCode">Postal Code *</label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={shippingInfo.postalCode}
            onChange={handleInputChange}
            required
            placeholder="Postal code"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Order Notes (Optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={shippingInfo.notes}
          onChange={handleInputChange}
          placeholder="Special instructions for delivery"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <Link href="/cart" className="back-link">
          ← Return to Cart
        </Link>
        <button type="submit" className="continue-btn">
          Continue to Payment
        </button>
      </div>
    </form>
  );

  // Render payment form
  const renderPaymentForm = () => (
    <form onSubmit={handlePaymentSubmit} className="checkout-form">
      <h2 className="section-title">Payment Method</h2>
      <p className="section-subtitle">Select how you'd like to pay</p>

      <div className="payment-methods">
        {paymentMethods.map((method) => (
          <label 
            key={method.id} 
            className={`payment-method ${paymentMethod === method.id ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={paymentMethod === method.id}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span className="payment-icon">{method.icon}</span>
            <div className="payment-details">
              <span className="payment-name">{method.name}</span>
              <span className="payment-description">{method.description}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Payment simulation notice */}
      <div className="payment-simulation">
        <span className="simulation-icon">🧪</span>
        <div className="simulation-text">
          <strong>Payment Simulation</strong>
          <p>This is a demo checkout. No actual payment will be processed.</p>
        </div>
      </div>

      <div className="order-summary-compact">
        <h3>Order Summary</h3>
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
        <div className="summary-row total">
          <span>Total</span>
          <span>R {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="back-btn"
          onClick={() => setStep(1)}
        >
          ← Back to Shipping
        </button>
        <button 
          type="submit" 
          className="place-order-btn"
          disabled={loading || !paymentMethod}
        >
          {loading ? 'Processing...' : `Place Order • R ${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  );

  // Render order confirmation
  const renderConfirmation = () => (
    <div className="confirmation-container">
      <div className="confirmation-icon">✓</div>
      <h1 className="confirmation-title">Thank You for Your Order!</h1>
      <p className="confirmation-subtitle">
        Your order has been placed successfully
      </p>
      
      <div className="order-details-card">
        <div className="order-number-section">
          <span className="order-number-label">Order Number</span>
          <span className="order-number-value">{orderNumber}</span>
        </div>

        <div className="order-info-grid">
          <div className="order-info-item">
            <span className="info-label">Date</span>
            <span className="info-value">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Payment Method</span>
            <span className="info-value">
              {paymentMethods.find(m => m.id === paymentMethod)?.name || paymentMethod}
            </span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Total Amount</span>
            <span className="info-value total">R {total.toFixed(2)}</span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Status</span>
            <span className="info-value status">Processing</span>
          </div>
        </div>

        <div className="confirmation-actions">
          {isGuest ? (
            <div className="guest-account-prompt">
              <p>Create an account to track your order and save your details for next time.</p>
              <Link href="/login?redirect=/orders" className="create-account-btn">
                Create Account
              </Link>
            </div>
          ) : (
            <Link href="/orders" className="view-order-btn">
              View Order History
            </Link>
          )}
          <Link href="/shop" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="whats-next">
        <h3>What's Next?</h3>
        <div className="next-steps">
          <div className="next-step">
            <span className="step-icon">📧</span>
            <div className="step-content">
              <strong>Confirmation Email</strong>
              <p>You'll receive an order confirmation email shortly.</p>
            </div>
          </div>
          <div className="next-step">
            <span className="step-icon">📦</span>
            <div className="step-content">
              <strong>Order Processing</strong>
              <p>We'll prepare your items and notify you when they ship.</p>
            </div>
          </div>
          <div className="next-step">
            <span className="step-icon">🚚</span>
            <div className="step-content">
              <strong>Delivery</strong>
              <p>Your order will be delivered within 3-5 business days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Progress Steps */}
        {!orderComplete && renderProgressSteps()}

        {/* Main Content */}
        <div className="checkout-grid">
          {/* Left Column - Forms */}
          <div className="checkout-main">
            {!orderComplete ? (
              <>
                {step === 1 && renderShippingForm()}
                {step === 2 && renderPaymentForm()}
              </>
            ) : (
              renderConfirmation()
            )}
          </div>

          {/* Right Column - Order Summary (only show before confirmation) */}
          {!orderComplete && step !== 2 && (
            <div className="checkout-sidebar">
              <div className="order-summary-card">
                <h3 className="sidebar-title">Your Order</h3>
                
                <div className="order-items">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="item-info">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <span className="item-price">
                        R {((item.salePrice || item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <div className="more-items">
                      +{cartItems.length - 3} more item{cartItems.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div className="sidebar-divider"></div>

                <div className="sidebar-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>R {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `R ${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax</span>
                    <span>R {tax.toFixed(2)}</span>
                  </div>
                  <div className="sidebar-divider"></div>
                  <div className="total-row final">
                    <span>Total</span>
                    <span>R {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .checkout-page {
          background: #F8FAFC;
          min-height: 100vh;
          padding: 40px 20px 80px;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Progress Steps */
        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 48px;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: 2px solid #E2E8F0;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s;
        }

        .progress-step.active .step-number {
          background: #3182CE;
          border-color: #3182CE;
          color: white;
        }

        .progress-step.completed .step-number {
          background: #2E7D32;
          border-color: #2E7D32;
          color: white;
        }

        .step-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748B;
        }

        .progress-step.active .step-label {
          color: #1A2B3C;
          font-weight: 600;
        }

        .progress-line {
          width: 80px;
          height: 2px;
          background: #E2E8F0;
          margin: 0 16px;
        }

        .progress-line.active {
          background: #3182CE;
        }

        /* Checkout Grid */
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }

        /* Checkout Main */
        .checkout-main {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
        }

        /* Form Styles */
        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 8px;
        }

        .section-subtitle {
          color: #64748B;
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #1A2B3C;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3182CE;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .form-group textarea {
          resize: vertical;
        }

        /* Payment Methods */
        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .payment-method {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .payment-method:hover {
          border-color: #3182CE;
          background: #F8FAFC;
        }

        .payment-method.selected {
          border-color: #3182CE;
          background: #EBF8FF;
        }

        .payment-method input[type="radio"] {
          width: 20px;
          height: 20px;
          accent-color: #3182CE;
        }

        .payment-icon {
          font-size: 24px;
        }

        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .payment-name {
          font-weight: 600;
          color: #1A2B3C;
        }

        .payment-description {
          font-size: 13px;
          color: #64748B;
        }

        /* Payment Simulation */
        .payment-simulation {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #FEF9C3;
          border: 1px solid #FDE68A;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .simulation-icon {
          font-size: 24px;
        }

        .simulation-text {
          flex: 1;
        }

        .simulation-text strong {
          color: #854D0E;
          display: block;
          margin-bottom: 4px;
        }

        .simulation-text p {
          color: #854D0E;
          font-size: 13px;
          margin: 0;
        }

        /* Order Summary Compact */
        .order-summary-compact {
          background: #F8FAFC;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .order-summary-compact h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          color: #4A5568;
          font-size: 14px;
        }

        .summary-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #1A2B3C;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #E2E8F0;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        .back-link {
          color: #3182CE;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .back-link:hover {
          color: #1E4E8C;
          transform: translateX(-4px);
        }

        .back-btn {
          padding: 14px 24px;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #4A5568;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #F8FAFC;
          border-color: #3182CE;
        }

        .continue-btn,
        .place-order-btn {
          padding: 14px 32px;
          background: #3182CE;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .continue-btn:hover,
        .place-order-btn:hover:not(:disabled) {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        .place-order-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Sidebar */
        .checkout-sidebar {
          position: sticky;
          top: 100px;
        }

        .order-summary-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
        }

        .sidebar-title {
          font-size: 18px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 20px;
        }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .item-quantity {
          font-size: 13px;
          color: #64748B;
        }

        .item-name {
          font-weight: 500;
          color: #1A2B3C;
        }

        .item-price {
          font-weight: 500;
          color: #1A2B3C;
        }

        .more-items {
          color: #64748B;
          font-size: 13px;
          padding-left: 28px;
        }

        .sidebar-divider {
          height: 1px;
          background: #EDF2F7;
          margin: 20px 0;
        }

        .sidebar-totals {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          color: #4A5568;
          font-size: 14px;
        }

        .total-row.final {
          font-size: 18px;
          font-weight: 700;
          color: #1A2B3C;
        }

        /* Confirmation Page */
        .confirmation-container {
          text-align: center;
          padding: 40px 20px;
        }

        .confirmation-icon {
          width: 80px;
          height: 80px;
          background: #2E7D32;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto 24px;
        }

        .confirmation-title {
          font-size: 32px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 16px;
        }

        .confirmation-subtitle {
          font-size: 18px;
          color: #64748B;
          margin-bottom: 40px;
        }

        .order-details-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          text-align: left;
          border: 1px solid #EDF2F7;
        }

        .order-number-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 24px;
          border-bottom: 1px solid #EDF2F7;
          margin-bottom: 24px;
        }

        .order-number-label {
          font-size: 14px;
          color: #64748B;
          font-weight: 500;
        }

        .order-number-value {
          font-size: 20px;
          font-weight: 700;
          color: #3182CE;
        }

        .order-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .order-info-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-label {
          font-size: 13px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #1A2B3C;
        }

        .info-value.total {
          color: #3182CE;
        }

        .info-value.status {
          color: #2E7D32;
        }

        .confirmation-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .guest-account-prompt {
          background: #FEF9C3;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }

        .guest-account-prompt p {
          color: #854D0E;
          margin-bottom: 16px;
        }

        .create-account-btn,
        .view-order-btn {
          display: inline-block;
          padding: 14px 28px;
          background: #3182CE;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .create-account-btn:hover,
        .view-order-btn:hover {
          background: #1E4E8C;
        }

        .continue-shopping-btn {
          display: inline-block;
          padding: 14px 28px;
          background: white;
          color: #3182CE;
          text-decoration: none;
          border: 1px solid #3182CE;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .continue-shopping-btn:hover {
          background: #EBF8FF;
        }

        .whats-next {
          text-align: left;
          margin-top: 40px;
        }

        .whats-next h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 24px;
        }

        .next-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .next-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .step-icon {
          font-size: 28px;
        }

        .step-content {
          flex: 1;
        }

        .step-content strong {
          display: block;
          color: #1A2B3C;
          margin-bottom: 4px;
        }

        .step-content p {
          color: #64748B;
          font-size: 14px;
          margin: 0;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }

          .checkout-sidebar {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .progress-steps {
            flex-wrap: wrap;
          }

          .progress-line {
            width: 30px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .order-info-grid {
            grid-template-columns: 1fr;
          }

          .next-steps {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
            gap: 16px;
          }

          .back-link,
          .continue-btn,
          .back-btn,
          .place-order-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}