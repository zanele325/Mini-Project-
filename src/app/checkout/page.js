"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/src/Context/AuthContext';
import { useCart } from '@/src/Context/CartContext';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";

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
    { id: 'cod', name: 'Cash on Delivery', icon: DollarSign, description: 'Pay when you receive your order' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Pay with Visa, Mastercard, or AMEX' },
    { id: 'paypal', name: 'PayPal', icon: Package, description: 'Secure payment with PayPal' },
    { id: 'eft', name: 'EFT', icon: FileText, description: 'Electronic Funds Transfer' }
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
        const orderNum = 'ORD-' + Date.now().toString().slice(-8);
        setOrderNumber(orderNum);

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

        if (user) {
          await addDoc(collection(db, 'orders'), orderData);
        }

        if (isGuest) {
          const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
          guestOrders.push(orderData);
          localStorage.setItem('guestOrders', JSON.stringify(guestOrders));
        }

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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '48px',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: step >= 1 ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' : 'white',
          border: step >= 1 ? 'none' : '2px solid #e0e0e0',
          color: step >= 1 ? 'white' : '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '18px',
          boxShadow: step >= 1 ? '0 4px 12px rgba(179, 139, 89, 0.3)' : 'none',
          transition: 'all 0.3s'
        }}>
          {step > 1 ? <CheckCircle size={24} /> : '1'}
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: step === 1 ? '600' : '500',
          color: step === 1 ? '#1A1A1A' : '#666'
        }}>
          Shipping
        </span>
      </div>

      <div style={{
        width: '80px',
        height: '3px',
        background: step >= 2 ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' : '#e0e0e0',
        borderRadius: '3px'
      }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: step >= 2 ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' : 'white',
          border: step >= 2 ? 'none' : '2px solid #e0e0e0',
          color: step >= 2 ? 'white' : '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '18px',
          boxShadow: step >= 2 ? '0 4px 12px rgba(179, 139, 89, 0.3)' : 'none',
          transition: 'all 0.3s'
        }}>
          {step > 2 ? <CheckCircle size={24} /> : '2'}
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: step === 2 ? '600' : '500',
          color: step === 2 ? '#1A1A1A' : '#666'
        }}>
          Payment
        </span>
      </div>

      <div style={{
        width: '80px',
        height: '3px',
        background: step >= 3 ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' : '#e0e0e0',
        borderRadius: '3px'
      }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: step >= 3 ? 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)' : 'white',
          border: step >= 3 ? 'none' : '2px solid #e0e0e0',
          color: step >= 3 ? 'white' : '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '18px',
          boxShadow: step >= 3 ? '0 4px 12px rgba(46, 139, 87, 0.3)' : 'none',
          transition: 'all 0.3s'
        }}>
          {step >= 3 ? <CheckCircle size={24} /> : '3'}
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: step === 3 ? '600' : '500',
          color: step === 3 ? '#1A1A1A' : '#666'
        }}>
          Complete
        </span>
      </div>
    </div>
  );

  // Render shipping form
  const renderShippingForm = () => (
    <form onSubmit={handleShippingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1A1A1A',
          marginBottom: '8px',
          fontFamily: "'Crimson Pro', serif"
        }}>
          Shipping Information
        </h2>
        <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
          Enter your delivery details
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Package size={16} color="#666" />
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={shippingInfo.fullName}
            onChange={handleInputChange}
            required
            placeholder="Enter your full name"
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
            <Mail size={16} color="#666" />
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={shippingInfo.email}
            onChange={handleInputChange}
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
          <Phone size={16} color="#666" />
          Phone Number *
        </label>
        <input
          type="tel"
          name="phone"
          value={shippingInfo.phone}
          onChange={handleInputChange}
          required
          placeholder="+27 XX XXX XXXX"
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
          <MapPin size={16} color="#666" />
          Street Address *
        </label>
        <input
          type="text"
          name="address"
          value={shippingInfo.address}
          onChange={handleInputChange}
          required
          placeholder="Street address, P.O. Box"
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
            City *
          </label>
          <input
            type="text"
            name="city"
            value={shippingInfo.city}
            onChange={handleInputChange}
            required
            placeholder="City"
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
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
            Province *
          </label>
          <select
            name="province"
            value={shippingInfo.province}
            onChange={handleInputChange}
            required
            style={{
              padding: '14px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '15px',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              outline: 'none',
              background: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#B38B59'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          >
            <option value="">Select</option>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
            Postal Code *
          </label>
          <input
            type="text"
            name="postalCode"
            value={shippingInfo.postalCode}
            onChange={handleInputChange}
            required
            placeholder="Code"
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
          Order Notes (Optional)
        </label>
        <textarea
          name="notes"
          value={shippingInfo.notes}
          onChange={handleInputChange}
          placeholder="Special instructions for delivery"
          rows="3"
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B38B59'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <Link href="/cart" style={{
          color: '#B38B59',
          textDecoration: 'none',
          fontSize: '15px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}>
          <ArrowLeft size={18} />
          Return to Cart
        </Link>
        <button 
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
            color: 'white',
            padding: '16px 32px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
            fontFamily: 'inherit',
            display: 'flex',
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
          Continue to Payment
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );

  // Render payment form
  const renderPaymentForm = () => (
    <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1A1A1A',
          marginBottom: '8px',
          fontFamily: "'Crimson Pro', serif"
        }}>
          Payment Method
        </h2>
        <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
          Select how you'd like to pay
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <label 
              key={method.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                border: paymentMethod === method.id ? '2px solid #B38B59' : '2px solid #e0e0e0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: paymentMethod === method.id ? '#FFF9F0' : 'white'
              }}
              onMouseEnter={(e) => {
                if (paymentMethod !== method.id) {
                  e.currentTarget.style.borderColor = '#B38B59';
                  e.currentTarget.style.background = '#FAFAFA';
                }
              }}
              onMouseLeave={(e) => {
                if (paymentMethod !== method.id) {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: '20px', height: '20px', accentColor: '#B38B59' }}
              />
              <div style={{
                width: '48px',
                height: '48px',
                background: paymentMethod === method.id ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' : '#F5F5F5',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconComponent size={24} color={paymentMethod === method.id ? 'white' : '#666'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                  {method.name}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {method.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Payment simulation notice */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: '#FFF9F0',
        border: '1px solid #F0E6D6',
        borderRadius: '12px'
      }}>
        <AlertCircle size={24} color="#B38B59" />
        <div>
          <div style={{ fontWeight: '600', color: '#8B6A3D', marginBottom: '4px' }}>
            Payment Simulation
          </div>
          <div style={{ fontSize: '13px', color: '#8B6A3D' }}>
            This is a demo checkout. No actual payment will be processed.
          </div>
        </div>
      </div>

      {/* Order summary compact */}
      <div style={{
        background: '#FAFAFA',
        padding: '20px',
        borderRadius: '12px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
          Order Summary
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: '500', color: '#1A1A1A' }}>R {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
            <span>Shipping</span>
            <span style={{ fontWeight: '500', color: '#1A1A1A' }}>
              {shipping === 0 ? 'Free' : `R ${shipping.toFixed(2)}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
            <span>Tax (15%)</span>
            <span style={{ fontWeight: '500', color: '#1A1A1A' }}>R {tax.toFixed(2)}</span>
          </div>
          <div style={{ height: '1px', background: '#e0e0e0', margin: '8px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>
            <span>Total</span>
            <span style={{ color: '#B38B59' }}>R {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <button 
          type="button"
          onClick={() => setStep(1)}
          style={{
            background: 'white',
            color: '#666',
            padding: '14px 24px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#B38B59';
            e.currentTarget.style.color = '#B38B59';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e0e0e0';
            e.currentTarget.style.color = '#666';
          }}
        >
          <ArrowLeft size={18} />
          Back to Shipping
        </button>
        <button 
          type="submit"
          disabled={loading || !paymentMethod}
          style={{
            background: loading || !paymentMethod ? '#ccc' : 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)',
            color: 'white',
            padding: '16px 32px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || !paymentMethod ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: loading || !paymentMethod ? 'none' : '0 4px 12px rgba(46, 139, 87, 0.3)',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!loading && paymentMethod) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 139, 87, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 139, 87, 0.3)';
          }}
        >
          {loading ? 'Processing...' : `Place Order • R ${total.toFixed(2)}`}
          {!loading && <ArrowRight size={18} />}
        </button>
      </div>
    </form>
  );

  // Render order confirmation
  const renderConfirmation = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 8px 24px rgba(46, 139, 87, 0.3)'
      }}>
        <CheckCircle size={48} />
      </div>
      
      <h1 style={{
        fontSize: '36px',
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: '16px',
        fontFamily: "'Crimson Pro', serif"
      }}>
        Thank You for Your Order!
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
        Your order has been placed successfully
      </p>
      
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        textAlign: 'left',
        border: '1px solid #f0f0f0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '24px',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Order Number</span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#B38B59' }}>{orderNumber}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Date
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Payment Method
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>
              {paymentMethods.find(m => m.id === paymentMethod)?.name || paymentMethod}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Total Amount
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#B38B59' }}>
              R {total.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Status
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2E8B57' }}>
              Processing
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isGuest ? (
            <div style={{ background: '#FFF9F0', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: '#8B6A3D', marginBottom: '16px' }}>
                Create an account to track your order and save your details for next time.
              </p>
              <Link href="/login?redirect=/orders" style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)'
              }}>
                Create Account
              </Link>
            </div>
          ) : (
            <Link href="/orders" style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              transition: 'all 0.2s',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)'
            }}>
              View Order History
            </Link>
          )}
          <Link href="/shop" style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: 'white',
            color: '#B38B59',
            textDecoration: 'none',
            border: '2px solid #B38B59',
            borderRadius: '10px',
            fontWeight: '600',
            transition: 'all 0.2s',
            textAlign: 'center'
          }}>
            Continue Shopping
          </Link>
        </div>
      </div>

      <div style={{ textAlign: 'left', marginTop: '40px' }}>
        <h3 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1A1A1A',
          marginBottom: '24px',
          fontFamily: "'Crimson Pro', serif"
        }}>
          What's Next?
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: Mail, title: 'Confirmation Email', desc: "You'll receive an order confirmation email shortly." },
            { icon: Package, title: 'Order Processing', desc: "We'll prepare your items and notify you when they ship." },
            { icon: Truck, title: 'Delivery', desc: 'Your order will be delivered within 3-5 business days.' }
          ].map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #FFF9F0 0%, #FFE8CC 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={24} color="#B38B59" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
        background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
        minHeight: 'calc(100vh - 76px)',
        padding: '40px 20px 80px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Progress Steps */}
          {!orderComplete && renderProgressSteps()}

          {/* Main Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: orderComplete || step === 2 ? '1fr' : '1fr 380px',
            gap: '32px',
            alignItems: 'start'
          }}>
            {/* Left Column - Forms */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              border: '1px solid #f0f0f0'
            }}>
              {!orderComplete ? (
                <>
                  {step === 1 && renderShippingForm()}
                  {step === 2 && renderPaymentForm()}
                </>
              ) : (
                renderConfirmation()
              )}
            </div>

            {/* Right Column - Order Summary (only show on step 1) */}
            {!orderComplete && step === 1 && (
              <div style={{ position: 'sticky', top: '100px' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  border: '1px solid #f0f0f0'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '20px',
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Your Order
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {cartItems.slice(0, 3).map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '13px', color: '#999' }}>{item.quantity}×</span>
                          <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{item.name}</span>
                        </div>
                        <span style={{ fontWeight: '600', color: '#1A1A1A' }}>
                          R {((item.salePrice || item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {cartItems.length > 3 && (
                      <div style={{ color: '#999', fontSize: '13px', paddingLeft: '28px' }}>
                        +{cartItems.length - 3} more item{cartItems.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div style={{ height: '1px', background: '#f0f0f0', margin: '20px 0' }}></div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                      <span>Subtotal</span>
                      <span style={{ fontWeight: '500', color: '#1A1A1A' }}>R {subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                      <span>Shipping</span>
                      <span style={{ fontWeight: '500', color: '#1A1A1A' }}>
                        {shipping === 0 ? 'Free' : `R ${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                      <span>Tax</span>
                      <span style={{ fontWeight: '500', color: '#1A1A1A' }}>R {tax.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700' }}>
                      <span style={{ color: '#1A1A1A' }}>Total</span>
                      <span style={{ color: '#B38B59' }}>R {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}