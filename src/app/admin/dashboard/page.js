"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { useAuth } from '@/src/Context/AuthContext';
import { 
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  ShoppingCart,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  FileText,
  Settings,
  Globe2,
  Heart
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    revenueGrowth: 0,
    ordersGrowth: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [cultureBreakdown, setCultureBreakdown] = useState([]);

  useEffect(() => {
    // Redirect if not admin
    if (user && !isAdmin) {
      router.push('/');
      return;
    }

    if (user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, isAdmin, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const productsRef = collection(db, "products");
      const productsSnapshot = await getDocs(productsRef);
      const productsData = [];
      
      let totalRevenue = 0;
      const categoryCount = {};
      const cultureCount = {};

      productsSnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        productsData.push(data);
        
        // Calculate revenue
        const sales = data.salesCount || 0;
        const price = data.price || 0;
        totalRevenue += sales * price;

        // Category breakdown
        if (data.category) {
          categoryCount[data.category] = (categoryCount[data.category] || 0) + 1;
        }

        // Culture breakdown
        if (data.culture) {
          cultureCount[data.culture] = (cultureCount[data.culture] || 0) + 1;
        }
      });

      // Get top selling products
      const topSelling = productsData
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 5);

      // Fetch orders
      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);
      const ordersData = [];
      
      let pendingCount = 0;
      let completedCount = 0;
      let totalCustomers = new Set();

      ordersSnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        ordersData.push(data);
        
        if (data.status === 'pending') pendingCount++;
        if (data.status === 'completed') completedCount++;
        if (data.userId) totalCustomers.add(data.userId);
      });

      // Sort orders by date
      const recentOrdersList = ordersData
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        })
        .slice(0, 5);

      // Category breakdown
      const categoryArray = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count,
        percentage: ((count / productsData.length) * 100).toFixed(1)
      }));

      // Culture breakdown
      const cultureArray = Object.entries(cultureCount).map(([name, count]) => ({
        name,
        count,
        percentage: ((count / productsData.length) * 100).toFixed(1)
      }));

      // Generate recent activity
      const activity = generateRecentActivity(ordersData, productsData);

      setStats({
        totalRevenue,
        totalOrders: ordersData.length,
        totalProducts: productsData.length,
        totalCustomers: totalCustomers.size,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        revenueGrowth: 12.5, // Mock data - calculate from actual data
        ordersGrowth: 8.3 // Mock data - calculate from actual data
      });

      setRecentOrders(recentOrdersList);
      setTopProducts(topSelling);
      setRecentActivity(activity);
      setCategoryBreakdown(categoryArray);
      setCultureBreakdown(cultureArray);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (orders, products) => {
    const activities = [];
    
    // Recent orders
    orders.slice(0, 3).forEach(order => {
      activities.push({
        type: 'order',
        icon: ShoppingCart,
        color: '#2E8B57',
        message: `New order #${order.id.slice(0, 8)} placed`,
        time: getTimeAgo(order.createdAt?.toDate?.() || new Date())
      });
    });

    // Recently added products
    products
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      })
      .slice(0, 2)
      .forEach(product => {
        activities.push({
          type: 'product',
          icon: Package,
          color: '#FFB81C',
          message: `New product "${product.name}" added`,
          time: getTimeAgo(product.createdAt?.toDate?.() || new Date())
        });
      });

    return activities.sort(() => Math.random() - 0.5).slice(0, 5);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFB81C',
      processing: '#3498db',
      completed: '#2E8B57',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#999';
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, isCurrency }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 8px 0',
            fontWeight: '500'
          }}>
            {title}
          </p>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#1A1A1A',
            margin: 0,
            fontFamily: "'Crimson Pro', serif"
          }}>
            {isCurrency && 'R '}
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h2>
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={28} color={color} />
        </div>
      </div>
      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          {trend === 'up' ? (
            <>
              <ArrowUpRight size={16} color="#2E8B57" />
              <span style={{ color: '#2E8B57' }}>+{trendValue}%</span>
            </>
          ) : (
            <>
              <ArrowDownRight size={16} color="#e74c3c" />
              <span style={{ color: '#e74c3c' }}>-{trendValue}%</span>
            </>
          )}
          <span style={{ color: '#999' }}>vs last month</span>
        </div>
      )}
    </div>
  );

  if (!user || !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAFA'
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={64} color="#e74c3c" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', color: '#1A1A1A', marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ color: '#666' }}>You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <LayoutDashboard size={32} color="#B38B59" />
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0,
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Admin Dashboard
                  </h1>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: 0
                }}>
                  Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => router.push('/admin/products')}
                  style={{
                    padding: '12px 24px',
                    background: 'white',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#B38B59'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                >
                  <Package size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Manage Products
                </button>
                <button
                  onClick={() => router.push('/admin/orders')}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 12px rgba(179, 139, 89, 0.2)'
                  }}
                >
                  <ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  View Orders
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
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
              <p style={{ color: '#666', fontSize: '16px' }}>Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 40px' }}>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <StatCard
                title="Total Revenue"
                value={stats.totalRevenue.toFixed(2)}
                icon={DollarSign}
                trend="up"
                trendValue={stats.revenueGrowth}
                color="#2E8B57"
                isCurrency={true}
              />
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                icon={ShoppingBag}
                trend="up"
                trendValue={stats.ordersGrowth}
                color="#3498db"
              />
              <StatCard
                title="Total Products"
                value={stats.totalProducts}
                icon={Package}
                color="#FFB81C"
              />
              <StatCard
                title="Total Customers"
                value={stats.totalCustomers}
                icon={Users}
                color="#9b59b6"
              />
            </div>

            {/* Secondary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#FFB81C15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={24} color="#FFB81C" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                    Pending Orders
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0
                  }}>
                    {stats.pendingOrders}
                  </p>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#2E8B5715',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={24} color="#2E8B57" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                    Completed Orders
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0
                  }}>
                    {stats.completedOrders}
                  </p>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#3498db15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Star size={24} color="#3498db" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                    Avg. Order Value
                  </p>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0
                  }}>
                    R {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {/* Recent Orders */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0,
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Recent Orders
                  </h3>
                  <button
                    onClick={() => router.push('/admin/orders')}
                    style={{
                      color: '#B38B59',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    View All
                  </button>
                </div>

                {recentOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          padding: '16px',
                          background: '#FAFAFA',
                          borderRadius: '10px',
                          border: '1px solid #f0f0f0',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#FAFAFA'}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1A1A1A'
                          }}>
                            Order #{order.id.slice(0, 8)}
                          </span>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status)
                          }}>
                            {order.status || 'pending'}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {order.items?.length || 0} items
                          </span>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1A1A1A'
                          }}>
                            R {(order.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    No orders yet
                  </p>
                )}
              </div>

              {/* Top Products */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0,
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Top Selling Products
                  </h3>
                  <TrendingUp size={20} color="#2E8B57" />
                </div>

                {topProducts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topProducts.map((product, index) => (
                      <div
                        key={product.id}
                        style={{
                          padding: '16px',
                          background: '#FAFAFA',
                          borderRadius: '10px',
                          border: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '14px'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            margin: '0 0 4px 0'
                          }}>
                            {product.name}
                          </p>
                          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                            {product.salesCount || 0} sales
                          </p>
                        </div>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#2E8B57'
                        }}>
                          R {((product.price || 0) * (product.salesCount || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    No sales data available
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {/* Recent Activity */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '24px',
                  fontFamily: "'Crimson Pro', serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Activity size={20} />
                  Recent Activity
                </h3>

                {recentActivity.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {recentActivity.map((activity, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: `${activity.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <activity.icon size={20} color={activity.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '14px',
                            color: '#1A1A1A',
                            margin: '0 0 4px 0',
                            fontWeight: '500'
                          }}>
                            {activity.message}
                          </p>
                          <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    No recent activity
                  </p>
                )}
              </div>

              {/* Category Breakdown */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '24px',
                  fontFamily: "'Crimson Pro', serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BarChart3 size={20} />
                  Category Breakdown
                </h3>

                {categoryBreakdown.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {categoryBreakdown.map((category, index) => (
                      <div key={index}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                            {category.name}
                          </span>
                          <span style={{ fontSize: '14px', color: '#666' }}>
                            {category.count} ({category.percentage}%)
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${category.percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    No category data
                  </p>
                )}
              </div>

              {/* Culture Breakdown */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '24px',
                  fontFamily: "'Crimson Pro', serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Globe2 size={20} />
                  Culture Distribution
                </h3>

                {cultureBreakdown.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cultureBreakdown.slice(0, 6).map((culture, index) => (
                      <div key={index}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                            {culture.name}
                          </span>
                          <span style={{ fontSize: '14px', color: '#666' }}>
                            {culture.count} ({culture.percentage}%)
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${culture.percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    No culture data
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}