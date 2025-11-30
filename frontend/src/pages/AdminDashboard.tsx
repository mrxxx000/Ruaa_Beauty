import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    // Check if user is authenticated and is admin
    const storedToken = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!storedToken || !user) {
      navigate('/');
      return;
    }

    const userObj = JSON.parse(user);
    if (userObj.role !== 'admin') {
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-navbar">
        <div className="admin-navbar-content">
          <h1 className="admin-title">Admin Dashboard</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="admin-container">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📋 Bookings ({bookings.length})
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({users.length})
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : activeTab === 'bookings' ? (
          <div className="bookings-section">
            <h2>All Bookings</h2>
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
                    {bookings.map((booking) => (
                      <tr key={booking.id} className={`booking-row status-${booking.status || 'pending'}`}>
                        <td>{booking.name}</td>
                        <td>{booking.email}</td>
                        <td>{booking.phone}</td>
                        <td>{booking.service}</td>
                        <td>{booking.date}</td>
                        <td>{booking.time}</td>
                        <td>
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
              <div className="users-grid">
                {users.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-role-badge">{user.role}</div>
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-id">ID: {user.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
