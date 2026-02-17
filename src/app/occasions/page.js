"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { 
  Calendar, 
  Globe2, 
  Users,
  ArrowRight,
  Sparkles,
  Heart,
  Music,
  Gift,
  Search,
  Filter,
  Check,
  MapPin,
  Clock,
  TrendingUp,
  Star,
  Book
} from "lucide-react";

export default function OccasionsPage() {
  const router = useRouter();
  const [selectedCulture, setSelectedCulture] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [occasions, setOccasions] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trendingStories, setTrendingStories] = useState([]);

  // Fetch occasions data from Firebase
  useEffect(() => {
    const fetchOccasionsData = async () => {
      try {
        setLoading(true);
        
        // Fetch products to extract occasions data
        const productsRef = collection(db, "products");
        const productsSnapshot = await getDocs(productsRef);
        
        const occasionsMap = new Map();
        const culturesSet = new Set();
        const categoriesSet = new Set();
        
        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Extract cultures
          if (data.culture) {
            culturesSet.add(data.culture);
          }
          
          // Extract occasions
          if (data.occasions && Array.isArray(data.occasions)) {
            data.occasions.forEach(occasion => {
              if (!occasionsMap.has(occasion)) {
                occasionsMap.set(occasion, {
                  name: occasion,
                  culture: data.culture || 'Various',
                  products: [],
                  region: data.region || 'National',
                  category: getOccasionCategory(occasion)
                });
              }
              occasionsMap.get(occasion).products.push({
                id: doc.id,
                ...data
              });
            });
          }
        });
        
        // Convert to arrays
        const occasionsArray = Array.from(occasionsMap.values()).map(occ => ({
          id: occ.name.toLowerCase().replace(/\s+/g, '-'),
          title: occ.name,
          culture: occ.culture,
          region: occ.region,
          category: occ.category,
          productCount: occ.products.length,
          description: generateOccasionDescription(occ.name, occ.culture),
          origins: generateOrigins(occ.name, occ.culture),
          attire: generateAttireRecommendations(occ.name, occ.culture),
          traditions: generateTraditions(occ.name),
          imageId: occ.name.toLowerCase().replace(/\s+/g, ''),
          shopLink: `/shop?occasion=${encodeURIComponent(occ.name)}`,
          trending: Math.random() > 0.7
        }));
        
        setOccasions(occasionsArray);
        setCultures(Array.from(culturesSet));
        setCategories(Array.from(categoriesSet));
        
        // Generate trending stories
        setTrendingStories(generateTrendingStories(occasionsArray));
        
      } catch (error) {
        console.error("Error fetching occasions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOccasionsData();
  }, []);

  // Helper functions
  const getOccasionCategory = (occasion) => {
    const ceremonies = ['wedding', 'lobola', 'umembeso', 'initiation', 'umemulo'];
    const festivals = ['heritage', 'festival', 'carnival', 'celebration', 'diwali'];
    const rituals = ['imbeleko', 'ritual', 'ceremony', 'domba'];
    
    const lowerOccasion = occasion.toLowerCase();
    
    if (ceremonies.some(word => lowerOccasion.includes(word))) return 'Ceremony';
    if (festivals.some(word => lowerOccasion.includes(word))) return 'Festival';
    if (rituals.some(word => lowerOccasion.includes(word))) return 'Ritual';
    return 'Celebration';
  };

  const generateOccasionDescription = (name, culture) => {
    const descriptions = {
      'wedding': `A beautiful ${culture} wedding ceremony celebrating the union of two families and the beginning of a new chapter.`,
      'lobola': `Traditional bride price negotiation ceremony where families come together to honor customs and establish bonds.`,
      'heritage': 'A celebration of South African cultural diversity and unity through traditional customs and shared experiences.',
      'kitchen': 'A joyful gathering where women celebrate the bride-to-be with gifts, advice, and blessings.',
      'graduation': 'A significant milestone celebration marking academic achievement and future possibilities.',
      'birthday': 'A special celebration honoring life and bringing together family and friends in cultural tradition.'
    };
    
    const key = Object.keys(descriptions).find(k => name.toLowerCase().includes(k));
    return descriptions[key] || `A significant ${culture} cultural occasion celebrating tradition and community.`;
  };

  const generateOrigins = (name, culture) => {
    return `Dating back generations in ${culture} culture, this occasion represents the deep-rooted values and traditions that have been passed down through families, symbolizing respect, unity, and cultural preservation.`;
  };

  const generateAttireRecommendations = (name, culture) => {
    const baseAttire = [
      { name: "Traditional dress" },
      { name: "Beaded jewelry" },
      { name: "Cultural accessories" },
      { name: "Formal wear" }
    ];
    
    const cultureSpecific = {
      'Zulu': [
        { name: "Isidwaba (leather skirt)" },
        { name: "Beaded jewelry" },
        { name: "Traditional headdress" },
        { name: "Animal skins" }
      ],
      'Xhosa': [
        { name: "White traditional wear" },
        { name: "Ochre body paint" },
        { name: "Beaded accessories" },
        { name: "Traditional blanket" }
      ],
      'Ndebele': [
        { name: "Beaded necklaces" },
        { name: "Beaded apron" },
        { name: "Brass rings" },
        { name: "Geometric patterns" }
      ]
    };
    
    return cultureSpecific[culture] || baseAttire;
  };

  const generateTraditions = (name) => {
    return `Traditional customs include authentic attire, ceremonial practices, community gathering, traditional music and dance, and the sharing of cultural foods and beverages.`;
  };

  const generateTrendingStories = (occasionsArray) => {
    return [
      {
        date: "February 2026",
        title: "Modern Meets Traditional: The Evolution of SA Weddings",
        excerpt: "How young South Africans are beautifully blending contemporary aesthetics with time-honored cultural ceremonies.",
        category: "Wedding Trends"
      },
      {
        date: "February 2026",
        title: "Heritage Fashion Renaissance",
        excerpt: "Traditional fabrics and beadwork are taking center stage in mainstream fashion, creating stunning modern interpretations.",
        category: "Fashion"
      },
      {
        date: "January 2026",
        title: "Preserving Culture Through Digital Platforms",
        excerpt: "Communities are using technology to document and share traditional knowledge with younger generations.",
        category: "Technology"
      }
    ];
  };

  // Filter occasions
  const filteredOccasions = occasions.filter(occasion => {
    const matchesCulture = selectedCulture === 'all' || occasion.culture === selectedCulture;
    const matchesCategory = selectedCategory === 'all' || occasion.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      occasion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occasion.culture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occasion.region.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCulture && matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'Ceremony': { bg: 'linear-gradient(135deg, #FFF9F0 0%, #FFE8CC 100%)', text: '#8B6A3D', border: '#f0e6d6' },
      'Festival': { bg: 'linear-gradient(135deg, #F0F8FF 0%, #CCE5FF 100%)', text: '#2C5C6F', border: '#d6e9f7' },
      'Ritual': { bg: 'linear-gradient(135deg, #F5F0FF 0%, #E6D5FF 100%)', text: '#6F2C5C', border: '#e0d6f7' },
      'Celebration': { bg: 'linear-gradient(135deg, #F0FFF4 0%, #CCFFDC 100%)', text: '#2E8B57', border: '#d6f7e0' }
    };
    return colors[category] || colors['Celebration'];
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
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
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
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
                borderTop: '4px solid #FFB81C',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 24px'
              }}></div>
              <p style={{ color: '#666', fontSize: '16px', fontWeight: '500' }}>
                Loading cultural occasions...
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 50%, #2C3E50 100%)',
          color: 'white',
          padding: '100px 24px 80px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(255, 184, 28, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(0, 122, 77, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(-30%, 30%)'
          }}></div>
          
          {/* Rainbow Nation Dots */}
          <div style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            display: 'flex',
            gap: '12px',
            animation: 'fadeInUp 1s ease-out'
          }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#007A4D', opacity: 0.7 }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFB81C', opacity: 0.7 }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#DE3831', opacity: 0.7 }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#001489', opacity: 0.7 }}></div>
          </div>

          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              textAlign: 'center',
              animation: 'fadeInUp 0.8s ease-out'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '12px 24px',
                borderRadius: '50px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Calendar size={20} color="#FFB81C" />
                <span style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px' }}>
                  DISCOVER CULTURAL OCCASIONS
                </span>
              </div>

              <h1 style={{
                fontSize: '56px',
                fontWeight: '700',
                lineHeight: '1.15',
                marginBottom: '24px',
                fontFamily: "'Crimson Pro', serif"
              }}>
                Celebrate South African<br/>Cultural Traditions
              </h1>
              
              <p style={{
                fontSize: '20px',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '40px',
                maxWidth: '700px',
                margin: '0 auto 40px'
              }}>
                Explore authentic ceremonies, festivals, and celebrations from across the Rainbow Nation
              </p>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '24px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '24px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#FFB81C', marginBottom: '8px' }}>
                    {occasions.length}+
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Cultural Occasions
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '24px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#FFB81C', marginBottom: '8px' }}>
                    {cultures.length}+
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Cultures Represented
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '24px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#FFB81C', marginBottom: '8px' }}>
                    100%
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Authentic Traditions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Stories Section */}
        {trendingStories.length > 0 && (
          <section style={{ padding: '60px 24px', background: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={28} color="#FFB81C" />
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0,
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Trending Cultural Stories
                  </h2>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #FFB81C 0%, #FF6B35 100%)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  TRENDING NOW
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px'
              }}>
                {trendingStories.map((story, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF5E6 100%)',
                      padding: '28px',
                      borderRadius: '16px',
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
                    }}
                  >
                    <div style={{
                      display: 'inline-block',
                      background: 'white',
                      color: '#FF6B35',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      marginBottom: '16px',
                      border: '1px solid #FFE8CC'
                    }}>
                      {story.category}
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#1A1A1A',
                      marginBottom: '12px',
                      lineHeight: '1.4',
                      fontFamily: "'Crimson Pro', serif"
                    }}>
                      {story.title}
                    </h3>
                    <p style={{
                      fontSize: '15px',
                      color: '#666',
                      lineHeight: '1.7',
                      marginBottom: '16px'
                    }}>
                      {story.excerpt}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '13px', color: '#8B6A3D', fontWeight: '600' }}>
                        {story.date}
                      </span>
                      <ArrowRight size={18} color="#B38B59" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters Section */}
        <section style={{ padding: '40px 24px 0', background: '#FAFAFA' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Search Bar */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} color="#999" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
                <input
                  type="text"
                  placeholder="Search occasions, cultures, regions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    fontSize: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B38B59'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#666',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <Filter size={18} />
                Filter by:
              </div>

              {/* Category Filters */}
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  padding: '10px 20px',
                  border: selectedCategory === 'all' ? 'none' : '2px solid #e0e0e0',
                  background: selectedCategory === 'all' 
                    ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' 
                    : 'white',
                  color: selectedCategory === 'all' ? 'white' : '#666',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
              >
                All Categories
              </button>
              
              {['Ceremony', 'Festival', 'Ritual', 'Celebration'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '10px 20px',
                    border: selectedCategory === cat ? 'none' : '2px solid #e0e0e0',
                    background: selectedCategory === cat 
                      ? 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)' 
                      : 'white',
                    color: selectedCategory === cat ? 'white' : '#666',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div style={{
              fontSize: '15px',
              color: '#666',
              marginBottom: '32px',
              fontWeight: '500'
            }}>
              Showing {filteredOccasions.length} occasion{filteredOccasions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </section>

        {/* Occasions Grid */}
        <section style={{ padding: '0 24px 80px', background: '#FAFAFA' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {filteredOccasions.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '32px'
              }}>
                {filteredOccasions.map((occasion) => {
                  const colors = getCategoryColor(occasion.category);
                  return (
                    <div
                      key={occasion.id}
                      style={{
                        background: 'white',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        transition: 'all 0.4s ease',
                        cursor: 'pointer',
                        border: '1px solid #f0f0f0',
                        position: 'relative'
                      }}
                      onClick={() => router.push(occasion.shopLink)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-12px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                      }}
                    >
                      {/* Image */}
                      <div style={{
                        height: '280px',
                        background: `url('https://picsum.photos/seed/${occasion.imageId}/800/600') center/cover`,
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)'
                        }} />
                        
                        {/* Category Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          left: '16px',
                          background: colors.bg,
                          color: colors.text,
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '700',
                          border: `1px solid ${colors.border}`,
                          backdropFilter: 'blur(10px)'
                        }}>
                          {occasion.category}
                        </div>

                        {/* Trending Badge */}
                        {occasion.trending && (
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'linear-gradient(135deg, #FFB81C 0%, #FF6B35 100%)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            animation: 'pulse 2s infinite'
                          }}>
                            <TrendingUp size={14} />
                            TRENDING
                          </div>
                        )}

                        {/* Product Count */}
                        <div style={{
                          position: 'absolute',
                          bottom: '16px',
                          right: '16px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          color: '#1A1A1A',
                          padding: '8px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Gift size={14} />
                          {occasion.productCount} items
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '28px' }}>
                        <h3 style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#1A1A1A',
                          marginBottom: '12px',
                          lineHeight: '1.3',
                          fontFamily: "'Crimson Pro', serif"
                        }}>
                          {occasion.title}
                        </h3>

                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          marginBottom: '16px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            color: '#FF6B35',
                            fontWeight: '600'
                          }}>
                            <Globe2 size={16} />
                            {occasion.culture}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            color: '#666',
                            fontWeight: '500'
                          }}>
                            <MapPin size={16} />
                            {occasion.region}
                          </div>
                        </div>

                        <p style={{
                          fontSize: '15px',
                          color: '#666',
                          lineHeight: '1.7',
                          marginBottom: '20px'
                        }}>
                          {occasion.description}
                        </p>

                        {/* Details Section */}
                        <div style={{
                          borderTop: '2px solid #f0f0f0',
                          paddingTop: '20px',
                          marginBottom: '20px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#B38B59',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Book size={16} />
                            Origins & Significance
                          </div>
                          <p style={{
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6',
                            marginBottom: '16px'
                          }}>
                            {occasion.origins}
                          </p>

                          <div style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#B38B59',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Music size={16} />
                            Traditional Practices
                          </div>
                          <p style={{
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6'
                          }}>
                            {occasion.traditions}
                          </p>
                        </div>

                        {/* Attire Section */}
                        <div style={{
                          background: colors.bg,
                          padding: '20px',
                          borderRadius: '12px',
                          border: `2px solid ${colors.border}`,
                          marginBottom: '20px'
                        }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: colors.text,
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Users size={16} />
                            Recommended Attire
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px'
                          }}>
                            {occasion.attire.map((item, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: 'white',
                                  padding: '12px 16px',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  border: `1px solid ${colors.border}`
                                }}
                              >
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: colors.text,
                                  flexShrink: 0
                                }} />
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#1A1A1A'
                                }}>
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '16px',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 16px rgba(46, 139, 87, 0.2)',
                            fontFamily: 'inherit'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(46, 139, 87, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(46, 139, 87, 0.2)';
                          }}
                        >
                          <Gift size={18} />
                          Shop {occasion.productCount} Items
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 24px',
                background: 'white',
                borderRadius: '20px',
                border: '2px dashed #e0e0e0'
              }}>
                <Search size={48} color="#999" style={{ marginBottom: '16px' }} />
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '12px'
                }}>
                  No occasions found
                </h3>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedCulture('all');
                    setSearchQuery('');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 32px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Ubuntu Quote Section */}
        <section style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              opacity: 0.3
            }}>
              "
            </div>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '16px',
              fontFamily: "'Crimson Pro', serif",
              lineHeight: '1.4'
            }}>
              Ubuntu: I am because we are
            </h2>
            <p style={{
              fontSize: '18px',
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Celebrating the spirit of togetherness through our vibrant traditions. Each occasion connects us to our ancestors, our community, and the rich tapestry of South African culture.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}