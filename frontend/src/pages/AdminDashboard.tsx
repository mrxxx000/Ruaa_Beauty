import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Calendar, Menu, Check, AlertCircle } from 'lucide-react';
import '../styles/admin-dashboard.css';
import {
  getAllBookings,
  getAllUsers,
  updateBookingStatus,
  cancelBookingAdmin,
  Booking,
  User,
} from '../adminApi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'users'>('bookings');
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    // Check if user is authenticated and is admin
    const storedToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');

    if (!storedToken || !user) {
      navigate('/');
      return;
    }

    try {
      const userObj = JSON.parse(user);
      if (userObj.role !== 'admin') {
        navigate('/');
        return;
      }
      setCurrentUser(userObj);
    } catch (err) {
      console.error('Failed to parse user:', err);
      navigate('/');
      return;
    }

    setToken(storedToken);
    loadData(storedToken);
  }, [navigate]);

  const loadData = async (authToken: string) => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'bookings') {
        const bookingsData = await getAllBookings(authToken);
        setBookings(bookingsData);
      } else {
        const usersData = await getAllUsers(authToken);
        setUsers(usersData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [activeTab, token]);

  const handleStatusChange = async (bookingId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateBookingStatus(token, bookingId, newStatus);
      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking status');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBookingAdmin(token, bookingId);
        setBookings(bookings.filter((booking) => booking.id !== bookingId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Dispatch logout event for other components
    const logoutEvent = new CustomEvent('userLogout', {
      detail: { timestamp: new Date().getTime() }
    });
    window.dispatchEvent(logoutEvent);
    
    navigate('/');
  };

  return (
    <div className="admin-dashboard">
      {/* Admin Navigation Bar */}
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="admin-navbar-title">
            <h1>Ruaa Beauty Admin</h1>
          </div>

          <div className="admin-navbar-user">
            <span className="admin-user-name">{currentUser?.name || 'Admin'}</span>
            <button 
              className="admin-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Admin Sidebar Navigation */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-content">
          <button
            className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Calendar className="w-5 h-5" />
            <span>Bookings</span>
            {bookings.length > 0 && <span className="badge">{bookings.length}</span>}
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
            {users.length > 0 && <span className="badge">{users.length}</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-main-content">
        <div className="admin-container">
          {error && (
            <div className="admin-error">
              <span>{error}</span>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          {loading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : activeTab === 'bookings' ? (
            <div className="bookings-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>All Bookings</h2>
                <div className="booking-filters" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={`filter-btn ${bookingFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setBookingFilter('all')}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    className={`filter-btn ${bookingFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setBookingFilter('pending')}
                  >
                    Pending ({bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length})
                  </button>
                  <button
                    className={`filter-btn ${bookingFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setBookingFilter('completed')}
                  >
                    Done ({bookings.filter(b => b.status === 'completed').length})
                  </button>
                </div>
              </div>

              {bookings.length === 0 ? (
                <p className="no-data">No bookings found</p>
              ) : (
                <div className="bookings-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings
                        .filter(booking => {
                          if (bookingFilter === 'pending') return booking.status !== 'completed' && booking.status !== 'cancelled';
                          if (bookingFilter === 'completed') return booking.status === 'completed';
                          return true;
                        })
                        .map((booking) => (
                          <tr key={booking.id} className={`booking-row status-${booking.status || 'pending'}`}>
                            <td>{booking.name}</td>
                            <td>{booking.email}</td>
                            <td>{booking.phone}</td>
                            <td>{booking.service.replace('-', ' ').toUpperCase()}</td>
                            <td>{new Date(booking.date).toLocaleDateString()}</td>
                            <td>{booking.time}</td>
                            <td>
                              {booking.status === 'completed' ? (
                                <div className="status-completed">
                                  <Check className="w-5 h-5" style={{ marginRight: '0.5rem' }} />
                                  Completed
                                </div>
                              ) : (
                                <select
                                  className="status-select"
                                  value={booking.status || 'pending'}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      booking.id,
                                      e.target.value as 'pending' | 'completed' | 'cancelled'
                                    )
                                  }
                                >
                                  <option value="pending">Pending</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              )}
                            </td>
                            <td>${booking.total_price || 0}</td>
                            <td>
                              <button
                                className="cancel-btn"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="users-section">
              <h2>All Users</h2>
              {users.length === 0 ? (
                <p className="no-data">No users found</p>
              ) : (
                <div className="users-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className={`user-row role-${user.role}`}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{(user as any).phone_number || '-'}</td>
                          <td>
                            <span className={`role-badge role-${user.role}`}>
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
