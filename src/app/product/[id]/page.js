"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';
import { useAuth } from '@/src/Context/AuthContext';
import {
  Heart,
  ShoppingCart,
  ChevronRight,
  Plus,
  Minus,
  Star,
  Truck,
  RotateCcw,
  Clock,
  Globe,
  Package,
  CheckCircle,
  AlertCircle,
  Tag
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const productDoc = await getDoc(doc(db, 'products', id));
      
      if (productDoc.exists()) {
        setProduct({
          id: productDoc.id,
          ...productDoc.data()
        });
      } else {
        setError('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    alert(`Added ${quantity} × "${product.name}" to cart!`);
  };

  const handleAddToWishlist = () => {
    addToWishlist(product);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
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

  if (loading) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
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
            <p style={{ color: '#666', fontSize: '16px', fontWeight: '500', fontFamily: "'Inter', sans-serif" }}>
              Loading product details...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
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
                margin: '0 auto 24px'
              }}>
                <AlertCircle size={40} color="#E74C3C" />
              </div>
              
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '16px',
                fontFamily: "'Crimson Pro', serif"
              }}>
                Product Not Found
              </h1>
              
              <p style={{
                color: '#666',
                marginBottom: '32px',
                lineHeight: '1.6',
                fontSize: '15px',
                fontFamily: "'Inter', sans-serif"
              }}>
                {error || "The product you're looking for doesn't exist."}
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
                boxShadow: '0 4px 12px rgba(179, 139, 89, 0.3)',
                fontFamily: "'Inter', sans-serif"
              }}>
                Browse All Products
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;

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
          {/* Breadcrumb */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            fontSize: '14px',
            color: '#666',
            flexWrap: 'wrap'
          }}>
            <Link href="/" style={{ color: '#B38B59', textDecoration: 'none', transition: 'color 0.2s' }}>
              Home
            </Link>
            <ChevronRight size={16} color="#999" />
            <Link href="/shop" style={{ color: '#B38B59', textDecoration: 'none', transition: 'color 0.2s' }}>
              Shop
            </Link>
            {product.category && (
              <>
                <ChevronRight size={16} color="#999" />
                <Link href={`/shop?category=${product.category}`} style={{ color: '#B38B59', textDecoration: 'none' }}>
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight size={16} color="#999" />
            <span style={{ color: '#1A1A1A', fontWeight: '500' }}>{product.name}</span>
          </div>

          {/* Product Main */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            marginBottom: '60px',
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #f0f0f0'
          }}
          className="product-main-grid">
            {/* Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                background: getCultureColor(product.culture),
                borderRadius: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '120px'
                }}>
                  {getProductEmoji(product.category)}
                </div>
                
                {product.onPromotion && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Tag size={16} />
                    SALE {discount}% OFF
                  </div>
                )}
                
                {!product.inStock && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: '#1A1A1A',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}>
                    Out of Stock
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Culture & Category */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                {product.culture && (
                  <span style={{
                    background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {product.culture}
                  </span>
                )}
                {product.category && (
                  <span style={{
                    background: '#F5F5F5',
                    color: '#666',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {product.category}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#1A1A1A',
                margin: 0,
                lineHeight: '1.2',
                fontFamily: "'Crimson Pro', serif"
              }}>
                {product.name}
              </h1>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                {product.salePrice ? (
                  <>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#E74C3C'
                    }}>
                      R {product.salePrice.toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: '20px',
                      color: '#999',
                      textDecoration: 'line-through'
                    }}>
                      R {product.price.toFixed(2)}
                    </span>
                    <span style={{
                      background: '#FEF2F2',
                      color: '#E74C3C',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {discount}% OFF
                    </span>
                  </>
                ) : (
                  <span style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#1A1A1A'
                  }}>
                    R {product.price?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Rating */}
              {product.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={star <= Math.floor(product.rating) ? '#FBBF24' : 'none'}
                        color={star <= Math.floor(product.rating) ? '#FBBF24' : '#E0E0E0'}
                      />
                    ))}
                  </div>
                  <span style={{ color: '#666', fontSize: '15px' }}>
                    {product.rating} ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              )}

              {/* Description */}
              <p style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#666',
                margin: '8px 0'
              }}>
                {product.description || "This traditional attire piece carries deep cultural significance and is crafted with authentic materials and techniques."}
              </p>

              {/* Occasions */}
              {product.occasions && product.occasions.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    marginBottom: '12px'
                  }}>
                    Perfect for:
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {product.occasions.map((occasion, index) => (
                      <Link 
                        key={`occasion-${index}`}
                        href={`/shop?occasion=${occasion}`}
                        style={{
                          background: '#F5F5F5',
                          color: '#666',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FFF9F0';
                          e.currentTarget.style.color = '#B38B59';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F5F5F5';
                          e.currentTarget.style.color = '#666';
                        }}
                      >
                        {occasion}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div style={{
                margin: '8px 0',
                padding: '16px 0',
                borderTop: '1px solid #f0f0f0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                {product.inStock ? (
                  <div style={{
                    color: '#2E8B57',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '15px'
                  }}>
                    <CheckCircle size={20} />
                    In Stock — {product.stockCount || 'Available'} units
                  </div>
                ) : (
                  <div style={{
                    color: '#E74C3C',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '15px'
                  }}>
                    <AlertCircle size={20} />
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {product.inStock && (
                <div>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    marginBottom: '12px'
                  }}>
                    Quantity:
                  </h3>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    padding: '8px'
                  }}>
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'white',
                        borderRadius: '8px',
                        cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: quantity <= 1 ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (quantity > 1) {
                          e.currentTarget.style.background = '#F8F8F8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <Minus size={18} color="#666" />
                    </button>
                    
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1A1A1A',
                      minWidth: '30px',
                      textAlign: 'center'
                    }}>
                      {quantity}
                    </span>
                    
                    <button
                      onClick={() => handleQuantityChange(1)}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8F8F8'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <Plus size={18} color="#666" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button
                  onClick={handleAddToWishlist}
                  disabled={!product.inStock}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    background: inWishlist ? '#FEF2F2' : 'white',
                    border: `2px solid ${inWishlist ? '#E74C3C' : '#e0e0e0'}`,
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: inWishlist ? '#E74C3C' : '#666',
                    cursor: !product.inStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    opacity: !product.inStock ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (product.inStock) {
                      e.currentTarget.style.borderColor = '#E74C3C';
                      e.currentTarget.style.color = '#E74C3C';
                      e.currentTarget.style.background = '#FEF2F2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (product.inStock && !inWishlist) {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.color = '#666';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <Heart size={20} fill={inWishlist ? '#E74C3C' : 'none'} />
                  {inWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
                </button>
                
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  style={{
                    flex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    background: !product.inStock ? '#ccc' : 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: !product.inStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: !product.inStock ? 'none' : '0 4px 12px rgba(179, 139, 89, 0.3)',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (product.inStock) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(179, 139, 89, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(179, 139, 89, 0.3)';
                  }}
                >
                  <ShoppingCart size={20} />
                  Add to Cart {quantity > 1 ? `(${quantity} items)` : ''}
                </button>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    marginBottom: '12px'
                  }}>
                    Tags:
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {product.tags.map((tag, index) => (
                      <Link 
                        key={`tag-${index}`}
                        href={`/shop?search=${tag}`}
                        style={{
                          background: '#FFF9F0',
                          color: '#B38B59',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          border: '1px solid #F0E6D6'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = '#B38B59';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFF9F0';
                          e.currentTarget.style.color = '#B38B59';
                          e.currentTarget.style.borderColor = '#F0E6D6';
                        }}
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #f0f0f0'
          }}>
            {/* Tabs Header */}
            <div style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '16px',
              marginBottom: '32px',
              flexWrap: 'wrap'
            }}>
              {['description', 'details', 'cultural', 'shipping'].map((tab) => {
                const labels = {
                  description: 'Description',
                  details: 'Product Details',
                  cultural: 'Cultural Significance',
                  shipping: 'Shipping & Returns'
                };
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '12px 24px',
                      background: activeTab === tab ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' : 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: activeTab === tab ? 'white' : '#666',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      boxShadow: activeTab === tab ? '0 4px 12px rgba(179, 139, 89, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.background = '#F8F8F8';
                        e.currentTarget.style.color = '#1A1A1A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#666';
                      }
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '200px' }}>
              {activeTab === 'description' && (
                <div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '20px',
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    About this item
                  </h3>
                  <p style={{ color: '#666', lineHeight: '1.7', marginBottom: '16px', fontSize: '15px' }}>
                    {product.description || "This traditional attire piece represents the rich cultural heritage of Southern Africa. Each item is carefully crafted by skilled artisans using authentic materials and traditional techniques passed down through generations."}
                  </p>
                  {product.longDescription && (
                    <p style={{ color: '#666', lineHeight: '1.7', fontSize: '15px' }}>
                      {product.longDescription}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '20px',
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Product Specifications
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '24px'
                  }}
                  className="specs-grid">
                    {[
                      { label: 'Culture', value: product.culture },
                      { label: 'Category', value: product.category },
                      { label: 'Materials', value: product.materials?.join(', ') },
                      { label: 'Features', value: product.features?.join(', ') },
                      { label: 'Dimensions', value: product.dimensions },
                      { label: 'Weight', value: product.weight },
                      { label: 'Origin', value: product.origin },
                      { label: 'Artisan', value: product.artisan }
                    ].filter(spec => spec.value).map((spec, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          fontSize: '13px',
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: '500'
                        }}>
                          {spec.label}
                        </span>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: '#1A1A1A'
                        }}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'cultural' && (
                <div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '20px',
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Cultural Significance
                  </h3>
                  <p style={{ color: '#666', lineHeight: '1.7', marginBottom: '24px', fontSize: '15px' }}>
                    {product.culturalSignificance || `This ${product.culture || 'traditional'} piece holds special meaning within ${product.culture || 'its'} culture. It is traditionally worn during ${product.occasions?.join(', ') || 'ceremonial occasions'} and represents ${product.culture ? `${product.culture} heritage` : 'cultural identity'}.`}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    background: '#FFF9F0',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #F0E6D6'
                  }}>
                    <Globe size={24} color="#B38B59" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{
                        display: 'block',
                        color: '#8B6A3D',
                        marginBottom: '4px',
                        fontSize: '15px'
                      }}>
                        Respectful appreciation
                      </strong>
                      <p style={{
                        margin: 0,
                        color: '#8B6A3D',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}>
                        We work directly with community artisans to ensure authentic representation and fair compensation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '20px',
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Shipping & Returns
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {[
                      { icon: Truck, title: 'Free Shipping', desc: 'On orders over R1000 (South Africa only)' },
                      { icon: Clock, title: 'Delivery Time', desc: '3-5 business days within South Africa' },
                      { icon: RotateCcw, title: 'Returns', desc: '30-day return policy. Items must be unused and in original packaging.' }
                    ].map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            background: '#FFF9F0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IconComponent size={24} color="#B38B59" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{
                              display: 'block',
                              color: '#1A1A1A',
                              marginBottom: '4px',
                              fontSize: '16px'
                            }}>
                              {item.title}
                            </strong>
                            <p style={{
                              margin: 0,
                              color: '#666',
                              fontSize: '14px',
                              lineHeight: '1.6'
                            }}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .product-main-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          
          .specs-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .product-main-grid {
            padding: 24px !important;
          }
        }
      `}</style>
    </>
  );
}