"use client";

import { useState, useEffect } from "react";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from '@/src/Context/CartContext';
import {
  Globe2,
  TrendingUp,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Heart,
  Users,
  MapPin,
  ChevronRight
} from "lucide-react";

export default function CulturesPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCulture, setSelectedCulture] = useState(null);

  // Culture information with unique colors and descriptions
  const cultureInfo = {
    'Xhosa': {
      color: '#2C5C6F',
      bgLight: '#E8F4F8',
      bgGradient: 'linear-gradient(135deg, #E8F4F8 0%, #D4E9F0 100%)',
      description: 'Known for intricate beadwork and striking umbhaco (traditional dress)',
      region: 'Eastern Cape',
      
      pattern: 'Geometric beadwork patterns in white, black, and blue'
    },
    'Zulu': {
      color: '#8B6A3D',
      bgLight: '#F8F4E8',
      bgGradient: 'linear-gradient(135deg, #F8F4E8 0%, #F0E8D4 100%)',
      description: 'Vibrant colors, animal hide garments, and distinctive izicholo hats',
      region: 'KwaZulu-Natal',
      
      pattern: 'Bold shields and traditional beaded accessories'
    },
    'Sotho': {
      color: '#5C6F2C',
      bgLight: '#F4F8E8',
      bgGradient: 'linear-gradient(135deg, #F4F8E8 0%, #E8F0D4 100%)',
      description: 'Famous for the Basotho blanket and mokorotlo (cone-shaped hat)',
      region: 'Free State & Lesotho',
      
      pattern: 'Colorful blanket designs with symbolic meanings'
    },
    'Ndebele': {
      color: '#6F2C5C',
      bgLight: '#F8E8F4',
      bgGradient: 'linear-gradient(135deg, #F8E8F4 0%, #F0D4E8 100%)',
      description: 'Renowned for colorful geometric murals and beaded neck rings',
      region: 'Mpumalanga & Limpopo',
      
      pattern: 'Bright geometric patterns in primary colors'
    },
    'Tswana': {
      color: '#2C6F5C',
      bgLight: '#E8F8F4',
      bgGradient: 'linear-gradient(135deg, #E8F8F4 0%, #D4F0E8 100%)',
      description: 'Elegant leather work and distinctive tshega (traditional skirt)',
      region: 'North West Province',
      
      pattern: 'Earth tones with animal skin accents'
    },
    'Venda': {
      color: '#5C2C6F',
      bgLight: '#F4E8F8',
      bgGradient: 'linear-gradient(135deg, #F4E8F8 0%, #E8D4F0 100%)',
      description: 'Mystical patterns, python symbolism, and vibrant ceremonial dress',
      region: 'Limpopo',
      
      pattern: 'Swirling patterns inspired by sacred python'
    },
    'Tsonga': {
      color: '#6F5C2C',
      bgLight: '#F8F8E8',
      bgGradient: 'linear-gradient(135deg, #F8F8E8 0%, #F0F0D4 100%)',
      description: 'Colorful xibelani skirts and jingling ankle rattles',
      region: 'Limpopo & Mpumalanga',
      
      pattern: 'Vibrant layered fabrics with bold prints'
    },
    'Pedi': {
      color: '#2C5C6F',
      bgLight: '#E8E8F8',
      bgGradient: 'linear-gradient(135deg, #E8E8F8 0%, #D4D4F0 100%)',
      description: 'Sophisticated beadwork and traditional leather aprons',
      region: 'Limpopo',
      
      pattern: 'Intricate beaded designs with symbolic colors'
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const productsQuery = query(productsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(productsQuery);
      const productsData = [];
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCultureProducts = (culture) => {
    return products
      .filter(p => p.culture === culture)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 4);
  };

  const getCultureProductCount = (culture) => {
    return products.filter(p => p.culture === culture).length;
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    // Show notification
    const notification = document.createElement('div');
    notification.innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><div style="width:20px;height:20px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span>Added to cart!</span></div>`;
    notification.style.cssText = `position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#2E8B57,#228B4A);color:white;padding:16px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(46,139,87,0.3);z-index:3000;animation:slideIn 0.4s;font-size:14px;font-weight:500;`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const getProductEmoji = (category) => {
    const map = { Jewellery:'💎', Clothing:'👗', Headwear:'👑', Accessories:'👜', Footwear:'👞' };
    return map[category] || '🎁';
  };

  const cultures = Object.keys(cultureInfo);
  const culturesWithProducts = cultures.filter(c => getCultureProductCount(c) > 0);

  if (loading) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <div style={{ minHeight:'calc(100vh - 76px)', background:'#FAFAFA', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ width:'60px', height:'60px', border:'4px solid #f3f3f3', borderTop:'4px solid #B38B59', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 24px' }}></div>
            <p style={{ color:'#666', fontSize:'16px', fontWeight:'500' }}>Loading cultures...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{ minHeight:'calc(100vh - 76px)', background:'#FAFAFA' }}>
        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
          color: 'white',
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'400px', height:'400px', background:'radial-gradient(circle, rgba(179,139,89,0.15) 0%, transparent 70%)', borderRadius:'50%' }}></div>
          <div style={{ position:'absolute', bottom:'-80px', left:'-80px', width:'300px', height:'300px', background:'radial-gradient(circle, rgba(46,139,87,0.12) 0%, transparent 70%)', borderRadius:'50%' }}></div>
          
          <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:1 }}>
            <div style={{ textAlign:'center', maxWidth:'800px', margin:'0 auto', animation:'fadeInUp 0.8s ease-out' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'12px', marginBottom:'24px', padding:'12px 24px', background:'rgba(179,139,89,0.15)', borderRadius:'50px', border:'1px solid rgba(179,139,89,0.3)' }}>
                <Globe2 size={20} color="#B38B59" />
                <span style={{ fontSize:'14px', fontWeight:'600', color:'#B38B59', letterSpacing:'1px', textTransform:'uppercase' }}>Cultural Heritage</span>
              </div>
              
              <h1 style={{
                fontSize:'56px',
                fontWeight:'800',
                lineHeight:'1.15',
                marginBottom:'24px',
                fontFamily:"'Playfair Display', serif",
                background:'linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%)',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent',
                backgroundClip:'text'
              }}>
                Explore Southern African Cultures
              </h1>
              
              <p style={{ fontSize:'20px', lineHeight:'1.7', color:'rgba(255,255,255,0.85)', marginBottom:'40px', fontWeight:'400' }}>
                Discover authentic traditional attire from {culturesWithProducts.length} distinct cultural groups, each with their own unique heritage and craftsmanship
              </p>
              
              <div style={{ display:'flex', justifyContent:'center', gap:'16px', flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 20px', background:'rgba(255,255,255,0.1)', borderRadius:'12px', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                  <Users size={18} color="#B38B59" />
                  <span style={{ fontSize:'14px', fontWeight:'500' }}>{culturesWithProducts.length} Cultures</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 20px', background:'rgba(255,255,255,0.1)', borderRadius:'12px', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                  <ShoppingCart size={18} color="#B38B59" />
                  <span style={{ fontSize:'14px', fontWeight:'500' }}>{products.length} Products</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cultures Grid */}
        <section style={{ padding:'80px 24px', background:'#FAFAFA' }}>
          <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
            {culturesWithProducts.map((cultureName, cultureIndex) => {
              const info = cultureInfo[cultureName];
              const cultureProducts = getCultureProducts(cultureName);
              const productCount = getCultureProductCount(cultureName);
              
              return (
                <div 
                  key={cultureName}
                  style={{
                    marginBottom: cultureIndex < culturesWithProducts.length - 1 ? '80px' : '0',
                    animation: `fadeInUp 0.8s ease-out ${cultureIndex * 0.1}s both`
                  }}
                >
                  {/* Culture Header */}
                  <div style={{
                    background: info.bgGradient,
                    borderRadius:'24px',
                    padding:'40px',
                    marginBottom:'32px',
                    border:`2px solid ${info.bgLight}`,
                    position:'relative',
                    overflow:'hidden'
                  }}>
                    {/* Background Pattern */}
                    <div style={{
                      position:'absolute',
                      top:'50%',
                      right:'-50px',
                      fontSize:'180px',
                      opacity:0.1,
                      transform:'translateY(-50%) rotate(15deg)'
                    }}>
                      {info.icon}
                    </div>
                    
                    <div style={{ position:'relative', zIndex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'24px' }}>
                        <div style={{ flex:1, minWidth:'300px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px' }}>
                            <div style={{ fontSize:'48px', animation:'float 3s ease-in-out infinite' }}>
                              {info.icon}
                            </div>
                            <div>
                              <h2 style={{
                                fontSize:'42px',
                                fontWeight:'800',
                                color:info.color,
                                margin:'0 0 4px',
                                fontFamily:"'Playfair Display', serif"
                              }}>
                                {cultureName}
                              </h2>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', color:info.color, opacity:0.7 }}>
                                <MapPin size={14} />
                                <span style={{ fontWeight:'500' }}>{info.region}</span>
                              </div>
                            </div>
                          </div>
                          
                          <p style={{ fontSize:'16px', lineHeight:'1.7', color:info.color, marginBottom:'16px', opacity:0.9, fontWeight:'500' }}>
                            {info.description}
                          </p>
                          
                          <div style={{
                            display:'inline-flex',
                            alignItems:'center',
                            gap:'8px',
                            padding:'8px 16px',
                            background:'rgba(255,255,255,0.6)',
                            borderRadius:'10px',
                            fontSize:'13px',
                            fontWeight:'600',
                            color:info.color
                          }}>
                            <Sparkles size={14} />
                            {info.pattern}
                          </div>
                        </div>
                        
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px', alignItems:'flex-end' }}>
                          <div style={{
                            background:'white',
                            padding:'16px 24px',
                            borderRadius:'16px',
                            textAlign:'center',
                            boxShadow:'0 4px 16px rgba(0,0,0,0.06)'
                          }}>
                            <div style={{ fontSize:'32px', fontWeight:'800', color:info.color, fontFamily:"'Playfair Display', serif" }}>
                              {productCount}
                            </div>
                            <div style={{ fontSize:'13px', color:info.color, opacity:0.7, fontWeight:'500' }}>
                              Products
                            </div>
                          </div>
                          
                          <Link 
                            href={`/shop?culture=${cultureName}`}
                            style={{
                              display:'inline-flex',
                              alignItems:'center',
                              gap:'8px',
                              padding:'12px 24px',
                              background:info.color,
                              color:'white',
                              textDecoration:'none',
                              borderRadius:'12px',
                              fontSize:'14px',
                              fontWeight:'600',
                              transition:'all 0.2s',
                              boxShadow:`0 4px 16px ${info.color}40`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform='translateY(-2px)';
                              e.currentTarget.style.boxShadow=`0 6px 20px ${info.color}60`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform='translateY(0)';
                              e.currentTarget.style.boxShadow=`0 4px 16px ${info.color}40`;
                            }}
                          >
                            View All
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trending Products */}
                  {cultureProducts.length > 0 && (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
                        <TrendingUp size={20} color={info.color} />
                        <h3 style={{ fontSize:'22px', fontWeight:'700', color:'#1A1A1A', margin:0, fontFamily:"'Playfair Display', serif" }}>
                          Trending {cultureName} Products
                        </h3>
                      </div>
                      
                      <div style={{
                        display:'grid',
                        gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',
                        gap:'24px'
                      }}>
                        {cultureProducts.map((product, prodIndex) => (
                          <div
                            key={product.id}
                            style={{
                              background:'white',
                              borderRadius:'20px',
                              overflow:'hidden',
                              boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
                              transition:'all 0.3s',
                              border:'1px solid #f0f0f0',
                              animation:`scaleIn 0.5s ease-out ${prodIndex * 0.1}s both`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform='translateY(-8px)';
                              e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform='translateY(0)';
                              e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)';
                            }}
                          >
                            {/* Product Image */}
                            <div style={{ position:'relative', height:'220px', overflow:'hidden' }}>
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl}
                                  alt={product.name}
                                  style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
                                  onError={(e) => {
                                    e.target.style.display='none';
                                    const fallback = e.target.parentElement.querySelector('.product-fallback');
                                    if (fallback) fallback.style.display='flex';
                                  }}
                                />
                              ) : null}
                              
                              <div 
                                className="product-fallback"
                                style={{
                                  width:'100%',
                                  height:'100%',
                                  background:info.bgLight,
                                  display: product.imageUrl ? 'none' : 'flex',
                                  alignItems:'center',
                                  justifyContent:'center',
                                  fontSize:'56px',
                                  position: product.imageUrl ? 'absolute' : 'static',
                                  top:0,
                                  left:0
                                }}
                              >
                                {getProductEmoji(product.category)}
                              </div>
                              
                              {/* Badges */}
                              <div style={{ position:'absolute', top:'12px', left:'12px', display:'flex', gap:'8px' }}>
                                <span style={{
                                  background:`${info.color}dd`,
                                  color:'white',
                                  padding:'6px 12px',
                                  borderRadius:'8px',
                                  fontSize:'11px',
                                  fontWeight:'700',
                                  backdropFilter:'blur(8px)',
                                  letterSpacing:'0.5px'
                                }}>
                                  {cultureName}
                                </span>
                                {product.salesCount > 0 && (
                                  <span style={{
                                    background:'rgba(255,255,255,0.95)',
                                    color:info.color,
                                    padding:'6px 12px',
                                    borderRadius:'8px',
                                    fontSize:'11px',
                                    fontWeight:'700',
                                    display:'flex',
                                    alignItems:'center',
                                    gap:'4px'
                                  }}>
                                    <TrendingUp size={12} />
                                    {product.salesCount}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Product Content */}
                            <div style={{ padding:'20px' }}>
                              <h4 style={{ fontSize:'16px', fontWeight:'600', color:'#1A1A1A', margin:'0 0 8px', lineHeight:'1.4' }}>
                                {product.name}
                              </h4>
                              
                              <p style={{ fontSize:'13px', color:'#666', lineHeight:'1.6', margin:'0 0 16px', height:'40px', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                                {product.description || "Authentic traditional attire"}
                              </p>
                              
                              {/* Footer */}
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'16px', borderTop:'1px solid #f0f0f0' }}>
                                <div>
                                  {product.onPromotion && product.originalPrice && (
                                    <div style={{ fontSize:'12px', color:'#999', textDecoration:'line-through' }}>
                                      R {product.originalPrice.toFixed(2)}
                                    </div>
                                  )}
                                  <div style={{ fontSize:'20px', fontWeight:'700', color:info.color }}>
                                    R {product.price?.toFixed(2) || '0.00'}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  style={{
                                    background:`${info.color}`,
                                    color:'white',
                                    border:'none',
                                    padding:'10px 20px',
                                    borderRadius:'10px',
                                    fontSize:'13px',
                                    fontWeight:'600',
                                    cursor:'pointer',
                                    transition:'all 0.2s',
                                    display:'flex',
                                    alignItems:'center',
                                    gap:'6px',
                                    boxShadow:`0 4px 12px ${info.color}30`
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform='scale(1.05)';
                                    e.currentTarget.style.boxShadow=`0 6px 16px ${info.color}40`;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform='scale(1)';
                                    e.currentTarget.style.boxShadow=`0 4px 12px ${info.color}30`;
                                  }}
                                >
                                  <ShoppingCart size={14} />
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          background:'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
          padding:'80px 24px',
          color:'white',
          textAlign:'center'
        }}>
          <div style={{ maxWidth:'700px', margin:'0 auto' }}>
            <h2 style={{ fontSize:'42px', fontWeight:'800', marginBottom:'20px', fontFamily:"'Playfair Display', serif" }}>
              Discover More Cultural Heritage
            </h2>
            <p style={{ fontSize:'18px', lineHeight:'1.7', color:'rgba(255,255,255,0.8)', marginBottom:'40px' }}>
              Explore our complete collection of authentic traditional attire from all cultures
            </p>
            <Link
              href="/shop"
              style={{
                display:'inline-flex',
                alignItems:'center',
                gap:'12px',
                padding:'18px 40px',
                background:'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                color:'white',
                textDecoration:'none',
                borderRadius:'14px',
                fontSize:'16px',
                fontWeight:'600',
                transition:'all 0.3s',
                boxShadow:'0 8px 24px rgba(179,139,89,0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform='translateY(-3px)';
                e.currentTarget.style.boxShadow='0 12px 32px rgba(179,139,89,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform='translateY(0)';
                e.currentTarget.style.boxShadow='0 8px 24px rgba(179,139,89,0.4)';
              }}
            >
              Browse All Products
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}