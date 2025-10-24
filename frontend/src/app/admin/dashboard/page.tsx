'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Simple interfaces
interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

interface AdminStats {
  total_users: number;
  active_users: number;
}

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
 
  // Check admin access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, isAuthenticated, router]);

  // Fetch admin data
  useEffect(() => {
    if (user?.role === 'admin' && token && isAuthenticated) {
      fetchAdminData();
    }
  }, [user, token, isAuthenticated]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const [usersResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:8000/api/v1/admin/users?limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:8000/api/v1/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (usersResponse.ok && statsResponse.ok) {
        const usersData = await usersResponse.json();
        const statsData = await statsResponse.json();
        setUsers(usersData || []);
        setStats({
          total_users: statsData.total_users || 0,
          active_users: statsData.active_users || 0
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setMessage('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Delete user ${userEmail}?`)) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setMessage(`User ${userEmail} deleted`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Failed to delete user');
    }
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Admin Dashboard</h1>
        <button 
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#155724'
        }}>
          {message}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            minWidth: '150px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Total Users</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_users}</div>
          </div>
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            minWidth: '150px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Active Users</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.active_users}</div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Users ({users.length})</h2>
        
        {users.length === 0 ? (
          <div>No users found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #dee2e6'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>XP</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Last Login</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Login Streak</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.full_name}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.email}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                        color: 'white'
                      }}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.total_xp}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.last_login}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.login_streak}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: user.status === 'active' ? '#28a745' : '#6c757d',
                        color: 'white'
                      }}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={fetchAdminData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;