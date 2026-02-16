"use client";

import { useState, useEffect } from "react";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useCart } from '@/src/Context/CartContext';
import { useAuth } from '@/src/Context/AuthContext';
import { useRouter } from "next/navigation";
import { 
  Search, 
  ShoppingCart, 
  Upload, 
  Calendar, 
  Globe2, 
  Camera,
  Sparkles,
  TrendingUp,
  Tag,
  Check,
  Scissors,
  Brain,
  Users,
  Mail,
  ArrowRight,
  Menu,
  X,
  User
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredItems, setFeaturedItems] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [promotionProducts, setPromotionProducts] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { addToCart, getCartCount } = useCart();
  const { user } = useAuth();
  const cartCount = getCartCount();

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const productsCollection = collection(db, "products");
        const productsQuery = query(
          productsCollection, 
          orderBy("createdAt", "desc")
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        const allProducts = [];
        
        productsSnapshot.forEach((doc) => {
          allProducts.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setFeaturedItems(allProducts.slice(0, 4));
        
        const topSelling = allProducts
          .filter(p => p.salesCount > 0)
          .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
          .slice(0, 4);
        setTopSellingProducts(topSelling);
        
        const onPromotion = allProducts.filter(p => p.onPromotion === true).slice(0, 4);
        setPromotionProducts(onPromotion);
        
        const allOccasions = new Set();
        allProducts.forEach(product => {
          if (product.occasions && Array.isArray(product.occasions)) {
            product.occasions.forEach(occasion => allOccasions.add(occasion));
          }
        });
        setOccasions(Array.from(allOccasions).slice(0, 5));
        
        const allCultures = new Set();
        allProducts.forEach(product => {
          if (product.culture) {
            allCultures.add(product.culture);
          }
        });
        setCultures(Array.from(allCultures).slice(0, 6));
        
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleImageUploadClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          alert('Please upload an image file');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          sessionStorage.setItem('searchImage', event.target.result);
          sessionStorage.setItem('searchImageName', file.name);
          sessionStorage.setItem('searchImageType', file.type);
          router.push('/image-search');
        };
        reader.readAsDataURL(file);
      }
    };
    
    fileInput.click();
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 20px; height: 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>Added "${item.name}" to cart</span>
      </div>
    `;
    notification.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #2E8B57 0%, #228B4A 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(46, 139, 87, 0.3);
      z-index: 1000;
      animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

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

  const getTextColor = (culture) => {
    const colors = {
      'Xhosa': '#2C5C6F',
      'Zulu': '#8B6A3D',
      'Sotho': '#5C6F2C',
      'Ndebele': '#6F2C5C',
      'Tswana': '#2C6F5C',
      'Venda': '#5C2C6F',
      'Tsonga': '#6F5C2C',
      'Pedi': '#2C5C6F'
    };
    return colors[culture] || '#8B6A3D';
  };

  const ProductGrid = ({ products, title, subtitle, icon: Icon }) => (
    <section style={{ padding: '80px 0', background: '#FAFAFA' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '16px'
          }}>
            {Icon && <Icon size={24} color="#B38B59" />}
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#1A1A1A',
              margin: 0
            }}>
              {title}
            </h2>
          </div>
          {subtitle && (
            <p style={{ 
              fontSize: '16px', 
              color: '#666', 
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {products.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {products.map((item) => (
              <div 
                key={item.id} 
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: '1px solid #f0f0f0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(212, 207, 207, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(211, 205, 205, 0.06)';
                }}
              >
                <div style={{ 
                  position: 'relative',
                  backgroundColor: getCultureColor(item.culture),
                  color: getTextColor(item.culture),
                  height: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '64px' }}>{getProductEmoji(item)}</div>
                  {item.onPromotion && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
                    }}>
                      SALE
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px' 
                  }}>
                    <span style={{
                      background: `${getCultureColor(item.culture)}`,
                      color: getTextColor(item.culture),
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {item.culture || "Traditional"}
                    </span>
                    {item.occasions && item.occasions.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {item.occasions.slice(0, 2).map((occasion, idx) => (
                          <Check key={idx} size={16} color="#2E8B57" strokeWidth={3} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <h4 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1A1A1A',
                    margin: '0 0 8px 0',
                    lineHeight: '1.4'
                  }}>
                    {item.name || "Traditional Item"}
                  </h4>
                  
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#666', 
                    lineHeight: '1.5',
                    margin: '0 0 16px 0',
                    height: '42px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {item.description 
                      ? item.description
                      : (item.note || "Culturally significant traditional attire")}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div>
                      {item.onPromotion && item.originalPrice && (
                        <div style={{ 
                          textDecoration: 'line-through', 
                          color: '#999', 
                          fontSize: '13px',
                          marginBottom: '2px'
                        }}>
                          R {item.originalPrice.toFixed(2)}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: '22px', 
                        fontWeight: '700', 
                        color: '#1A1A1A'
                      }}>
                        R {item.price ? item.price.toFixed(2) : "0.00"}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAddToCart(item)}
                      style={{
                        background: 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(46, 139, 87, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 139, 87, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 139, 87, 0.2)';
                      }}
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#999',
            background: 'white',
            borderRadius: '16px',
            border: '2px dashed #e0e0e0'
          }}>
            <p style={{ fontSize: '16px', margin: 0 }}>No products available in this category yet.</p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
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
      
      
          
      <div style={{ minHeight: '100vh' }}>
        {/* Loading State */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
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
              <p style={{ 
                color: '#666', 
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Loading products...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            background: '#FFF3CD',
            color: '#856404',
            padding: '20px',
            margin: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #FFEAA7',
            maxWidth: '600px',
            margin: '24px auto'
          }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '500' }}>{error}</p>
            <a 
              href="/admin/products/add" 
              style={{
                color: '#007bff',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              Add products to Firebase first
            </a>
          </div>
        )}

        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(165deg, #1A1A1A 0%, #2D2D2D 100%)',
          color: 'white',
          padding: '100px 24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(179, 139, 89, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)'
          }}></div>
          
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              maxWidth: '700px',
              animation: 'fadeInUp 0.8s ease-out'
            }}>
              <h1 style={{
                fontSize: '56px',
                fontWeight: '700',
                lineHeight: '1.15',
                marginBottom: '24px',
                fontFamily: "'Crimson Pro', serif"
              }}>
                Find the right traditional attire — for the right occasion
              </h1>
              <p style={{
                fontSize: '20px',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '48px',
                fontWeight: '400'
              }}>
                Culturally appropriate clothing and jewellery for Southern African ceremonies
              </p>
              
              {/* Search Box */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 20px 60px rgba(182, 172, 172, 0.3)',
                animation: 'fadeInUp 0.8s ease-out 0.2s both'
              }}>
                <label style={{
                  display: 'block',
                  color: '#1A1A1A',
                  fontSize: '15px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Tell us about your occasion
                </label>
                <textarea 
                  placeholder="I'm attending a Xhosa wedding as a guest and need something respectful..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '16px',
                    fontSize: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                    outline: 'none',
                    marginBottom: '16px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B38B59'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <button 
                  onClick={() => window.location.href = `/shop?search=${searchQuery}`}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(179, 139, 89, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(179, 139, 89, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(179, 139, 89, 0.3)';
                  }}
                >
                  <Search size={20} />
                  Find Recommendations
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Entry Points */}
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {/* Browse by Occasion */}
              <div style={{
                background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF5E6 100%)',
                padding: '32px',
                borderRadius: '20px',
                border: '1px solid #f0e6d6',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(179, 139, 89, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 4px 16px rgba(179, 139, 89, 0.25)'
                }}>
                  <Calendar size={28} color="white" />
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '12px',
                  fontFamily: "'Crimson Pro', serif"
                }}>
                  Browse by Occasion
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  Find attire specifically chosen for different ceremonies and events
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  {occasions.length > 0 ? (
                    occasions.map((occasion) => (
                      <span key={occasion} style={{
                        background: 'white',
                        color: '#8B6A3D',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: '1px solid #f0e6d6'
                      }}>
                        {occasion}
                      </span>
                    ))
                  ) : (
                    <span style={{
                      background: 'white',
                      color: '#999',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}>
                      Loading...
                    </span>
                  )}
                </div>
                <a href="/shop?filter=occasion" style={{
                  color: '#B38B59',
                  fontSize: '15px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  Explore occasions
                  <ArrowRight size={18} />
                </a>
              </div>

              {/* Browse by Culture */}
              <div style={{
                background: 'linear-gradient(135deg, #F0F8FF 0%, #E6F3FF 100%)',
                padding: '32px',
                borderRadius: '20px',
                border: '1px solid #d6e9f7',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(44, 92, 111, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #2C5C6F 0%, #1E4250 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 4px 16px rgba(44, 92, 111, 0.25)'
                }}>
                  <Globe2 size={28} color="white" />
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '12px',
                  fontFamily: "'Crimson Pro', serif"
                }}>
                  Browse by Culture
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  Explore authentic attire from specific cultural traditions
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  {cultures.length > 0 ? (
                    cultures.map((culture) => (
                      <span key={culture} style={{
                        background: 'white',
                        color: '#2C5C6F',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: '1px solid #d6e9f7'
                      }}>
                        {culture}
                      </span>
                    ))
                  ) : (
                    <span style={{
                      background: 'white',
                      color: '#999',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}>
                      Loading...
                    </span>
                  )}
                </div>
                <a href="/shop?filter=culture" style={{
                  color: '#2C5C6F',
                  fontSize: '15px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  Explore cultures
                  <ArrowRight size={18} />
                </a>
              </div>

              {/* Image Upload Search */}
              <div style={{
                background: 'linear-gradient(135deg, #F5F0FF 0%, #EBE6FF 100%)',
                padding: '32px',
                borderRadius: '20px',
                border: '1px solid #e0d6f7',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(111, 44, 92, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #6F2C5C 0%, #571E47 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 4px 16px rgba(111, 44, 92, 0.25)'
                }}>
                  <Camera size={28} color="white" />
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '12px',
                  fontFamily: "'Crimson Pro', serif"
                }}>
                  Image Upload Search
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  Have a photo or pattern? Upload an image to find similar attire
                </p>
                <div 
                  onClick={handleImageUploadClick}
                  style={{
                    background: 'white',
                    border: '2px dashed #d6c7e9',
                    borderRadius: '12px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6F2C5C';
                    e.currentTarget.style.background = '#FAFAFA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d6c7e9';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <Upload size={32} color="#6F2C5C" style={{ marginBottom: '12px' }} />
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#6F2C5C'
                  }}>
                    Click to upload image
                  </div>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  JPG, PNG up to 5MB
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products on Promotion */}
        {promotionProducts.length > 0 && (
          <ProductGrid 
            products={promotionProducts}
            title="Special Offers"
            subtitle="Limited time promotions on authentic traditional attire"
            icon={Tag}
          />
        )}

        {/* Top Selling Products */}
        {topSellingProducts.length > 0 && (
          <ProductGrid 
            products={topSellingProducts}
            title="Popular Choices"
            subtitle="Most loved items by our community"
            icon={TrendingUp}
          />
        )}

        {/* Featured Products */}
        <ProductGrid 
          products={featuredItems}
          title="Recommended for Common Ceremonies"
          subtitle={featuredItems.length > 0 
            ? `Showing ${featuredItems.length} culturally appropriate items for specific events`
            : "Loading featured products..."}
          icon={Sparkles}
        />

        {/* Trust Section */}
        <section style={{
          padding: '80px 24px',
          background: 'linear-gradient(180deg, #FAFAFA 0%, white 100%)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '40px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #FFF9F0 0%, #FFE8CC 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 4px 20px rgba(179, 139, 89, 0.1)'
                }}>
                  <Scissors size={36} color="#B38B59" />
                </div>
                <h4 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '12px',
                  fontFamily: "'Crimson Pro', serif"
                }}>
                  Authentic Design
                </h4>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  lineHeight: '1.7'
                }}>
                  Carefully curated attire and beadwork inspired by real cultural practices and made by authentic artisans
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #F0F8FF 0%, #CCE5FF 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 4px 20px rgba(44, 92, 111, 0.1)'
                }}>
                  <Brain size={36} color="#2C5C6F" />
                </div>
                <h4 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '12px',
                  fontFamily: "'Crimson Pro', serif"
                }}>
                  Smart Recommendations
                </h4>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  lineHeight: '1.7'
                }}>
                  Our system helps you choose attire that is culturally appropriate for your specific event and role
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #F0FFF4 0%, #CCFFDC 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 4px 20px rgba(46, 139, 87, 0.1)'
                }}>
                  <Users size={36} color="#2E8B57" />
                </div>
                <h4 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '12px',
                  fontFamily: "'Crimson Pro', serif"
                }}>
                  Community Focused
                </h4>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  lineHeight: '1.7'
                }}>
                  Supporting local artisans and preserving cultural heritage through ethical commerce
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          background: 'linear-gradient(180deg, #1A1A1A 0%, #000000 100%)',
          color: 'white',
          padding: '60px 24px 24px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '48px',
              marginBottom: '48px'
            }}>
              {/* Company Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
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
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    iS
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '700',
                      fontFamily: "'Crimson Pro', serif"
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
                </div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  marginBottom: '12px'
                }}>
                  Culturally respectful traditional attire for Southern African ceremonies
                </p>
                {featuredItems.length > 0 && (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '13px'
                  }}>
                    Currently featuring {featuredItems.length} authentic products
                  </p>
                )}
              </div>

              {/* Quick Links */}
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  color: 'white'
                }}>
                  Quick Links
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {['Home', 'Shop', 'About Us', 'Image Search'].map(link => (
                    <li key={link} style={{ marginBottom: '12px' }}>
                      <a href={`/${link.toLowerCase().replace(' ', '-')}`} style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'color 0.2s'
                      }}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  color: 'white'
                }}>
                  Support
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {['Contact Us', 'FAQs', 'Shipping & Returns', 'Privacy Policy'].map(link => (
                    <li key={link} style={{ marginBottom: '12px' }}>
                      <a href="#" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'color 0.2s'
                      }}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  color: 'white'
                }}>
                  Stay Connected
                </h4>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  Subscribe for cultural insights and new arrivals
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="email" 
                    placeholder="Your email"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button style={{
                    background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}>
                    <Mail size={18} color="white" />
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '24px',
              textAlign: 'center'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                margin: 0
              }}>
                © 2024 iSiko Studio. All rights reserved. "iSiko" means "Culture" in several Southern African languages.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}