"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from '@/src/Context/AuthContext';
import { 
  Package,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowUpDown,
  MoreVertical,
  X
} from "lucide-react";

export default function AdminOrders() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/');
      return;
    }

    if (user && isAdmin) {
      fetchOrders();
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchQuery, statusFilter, sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const ordersData = [];
      let totalRevenue = 0;
      const statusCount = { pending: 0, processing: 0, completed: 0, cancelled: 0 };

      ordersSnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        ordersData.push(data);
        
        totalRevenue += data.total || 0;
        if (statusCount.hasOwnProperty(data.status)) {
          statusCount[data.status]++;
        }
      });

      setOrders(ordersData);
      setStats({
        total: ordersData.length,
        ...statusCount,
        totalRevenue
      });

    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order => {
        const query = searchQuery.toLowerCase();
        return (
          order.id.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.customerEmail?.toLowerCase().includes(query) ||
          order.items?.some(item => item.name?.toLowerCase().includes(query))
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (b.createdAt?.toDate?.() || new Date(0)) - (a.createdAt?.toDate?.() || new Date(0));
        case "date-asc":
          return (a.createdAt?.toDate?.() || new Date(0)) - (b.createdAt?.toDate?.() || new Date(0));
        case "total-desc":
          return (b.total || 0) - (a.total || 0);
        case "total-asc":
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Show success notification
      showNotification("Order status updated successfully", "success");
    } catch (error) {
      console.error("Error updating order:", error);
      showNotification("Failed to update order status", "error");
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders(orders.filter(order => order.id !== orderId));
      setShowOrderDetails(false);
      showNotification("Order deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting order:", error);
      showNotification("Failed to delete order", "error");
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #2E8B57 0%, #228B4A 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'};
      color: white;
      padding: 16px 24px;
      borderRadius: 12px;
      boxShadow: 0 8px 24px rgba(0,0,0,0.2);
      zIndex: 10000;
      fontSize: 14px;
      fontWeight: 500;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      processing: Package,
      completed: CheckCircle,
      cancelled: XCircle
    };
    return icons[status] || AlertCircle;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Date', 'Customer', 'Email', 'Total', 'Status', 'Items'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        formatDate(order.createdAt),
        order.customerName || 'N/A',
        order.customerEmail || 'N/A',
        `R ${(order.total || 0).toFixed(2)}`,
        order.status || 'pending',
        order.items?.length || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
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
                  <ShoppingBag size={32} color="#B38B59" />
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: 0,
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Orders Management
                  </h1>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: 0
                }}>
                  Manage and track all customer orders
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => router.push('/admin')}
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
                  Back to Dashboard
                </button>
                <button
                  onClick={exportOrders}
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
                    boxShadow: '0 4px 12px rgba(179, 139, 89, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 32px' }}>
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
                background: '#B38B5915',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingBag size={24} color="#B38B59" />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                  Total Orders
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: 0
                }}>
                  {stats.total}
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
                background: '#FFB81C15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={24} color="#FFB81C" />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                  Pending
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: 0
                }}>
                  {stats.pending}
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
                <Package size={24} color="#3498db" />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                  Processing
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: 0
                }}>
                  {stats.processing}
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
                  Completed
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: 0
                }}>
                  {stats.completed}
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
                <TrendingUp size={24} color="#2E8B57" />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                  Total Revenue
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: 0
                }}>
                  R {stats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={20} color="#999" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
                <input
                  type="text"
                  placeholder="Search by order ID, customer, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    fontSize: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B38B59'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              {/* Status Filter */}
              <div style={{ position: 'relative' }}>
                <Filter size={20} color="#999" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    fontSize: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white',
                    appearance: 'none'
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown size={20} color="#999" style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* Sort By */}
              <div style={{ position: 'relative' }}>
                <ArrowUpDown size={20} color="#999" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    fontSize: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white',
                    appearance: 'none'
                  }}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="total-desc">Highest Value</option>
                  <option value="total-asc">Lowest Value</option>
                </select>
                <ChevronDown size={20} color="#999" style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              fontSize: '14px',
              color: '#666'
            }}>
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>

          {/* Orders Table */}
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
                <p style={{ color: '#666', fontSize: '16px' }}>Loading orders...</p>
              </div>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #f0f0f0'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 150px 150px 120px 120px 100px',
                padding: '16px 24px',
                background: '#FAFAFA',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '13px',
                fontWeight: '700',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>Order ID</div>
                <div>Customer</div>
                <div>Date</div>
                <div>Items</div>
                <div>Total</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {/* Table Body */}
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 150px 150px 120px 120px 100px',
                    padding: '20px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#B38B59',
                    fontFamily: 'monospace'
                  }}>
                    #{order.id.slice(0, 8)}
                  </div>

                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1A1A1A',
                      marginBottom: '4px'
                    }}>
                      {order.customerName || 'N/A'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {order.customerEmail || 'No email'}
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {formatDate(order.createdAt)}
                  </div>

                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                  </div>

                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1A1A1A'
                  }}>
                    R {(order.total || 0).toFixed(2)}
                  </div>

                  <div>
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      style={{
                        padding: '8px',
                        background: '#B38B5915',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#B38B5930'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#B38B5915'}
                      title="View Details"
                    >
                      <Eye size={18} color="#B38B59" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOrder(order.id);
                      }}
                      style={{
                        padding: '8px',
                        background: '#e74c3c15',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e74c3c30'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#e74c3c15'}
                      title="Delete Order"
                    >
                      <Trash2 size={18} color="#e74c3c" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '60px 24px',
              textAlign: 'center',
              border: '2px dashed #e0e0e0'
            }}>
              <ShoppingBag size={64} color="#ccc" style={{ marginBottom: '16px' }} />
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>
                No orders found
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or search query'
                  : 'Orders will appear here once customers make purchases'}
              </p>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setShowOrderDetails(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                animation: 'slideIn 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'white',
                zIndex: 1
              }}>
                <div>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    margin: '0 0 4px 0',
                    fontFamily: "'Crimson Pro', serif"
                  }}>
                    Order Details
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: 0,
                    fontFamily: 'monospace'
                  }}>
                    #{selectedOrder.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  <X size={24} color="#666" />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
                {/* Customer Info */}
                <div style={{
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <User size={20} />
                    Customer Information
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <User size={16} color="#666" />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {selectedOrder.customerName || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mail size={16} color="#666" />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {selectedOrder.customerEmail || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Phone size={16} color="#666" />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {selectedOrder.customerPhone || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <MapPin size={16} color="#666" style={{ marginTop: '2px' }} />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {selectedOrder.shippingAddress || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div style={{
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Calendar size={20} />
                    Order Information
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>
                        Order Date
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>
                        {formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>
                        Status
                      </p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: `${getStatusColor(selectedOrder.status)}20`,
                        color: getStatusColor(selectedOrder.status),
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {React.createElement(getStatusIcon(selectedOrder.status), { size: 16 })}
                        {selectedOrder.status || 'pending'}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>
                        Items Count
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>
                        {selectedOrder.items?.length || 0} items
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>
                        Total Amount
                      </p>
                      <p style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#2E8B57',
                        margin: 0
                      }}>
                        R {(selectedOrder.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Package size={20} />
                    Order Items
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#FAFAFA',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            margin: '0 0 4px 0'
                          }}>
                            {item.name || 'Product'}
                          </p>
                          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                            Quantity: {item.quantity || 1}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1A1A1A',
                            margin: 0
                          }}>
                            R {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}