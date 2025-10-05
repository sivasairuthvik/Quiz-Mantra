
import React, { useEffect, useState } from 'react';
import md5 from 'blueimp-md5';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminDashboardPage.css';

const groupByRole = (users) => {
  const grouped = { admin: [], teacher: [], student: [] };
  users.forEach(u => {
    if (grouped[u.role]) grouped[u.role].push(u);
  });
  return grouped;
};

const exportCSV = (users) => {
  if (!users.length) return;
  const header = Object.keys(users[0]).join(',');
  const rows = users.map(u => Object.values(u).map(v => `"${v}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

const AdminDashboardPage = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageRecipient, setMessageRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/auth/users?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    const fetchMessages = async () => {
      try {
        const res = await axios.get('/api/messages?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.data || []);
      } catch {}
    };
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/messages/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data.data);
      } catch {}
    };
    if (user?.role === 'admin') {
      fetchUsers();
      fetchMessages();
      fetchStats();
    }
  }, [token, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent || !messageRecipient) return;
    setSending(true);
    try {
      await axios.post('/api/messages', {
        recipient: messageRecipient,
        subject: 'Admin Message',
        content: messageContent,
        type: 'general',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessageContent('');
      setMessageRecipient('');
      // Refresh messages
      const res = await axios.get('/api/messages?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.data || []);
    } catch {}
    setSending(false);
  };

  // Filter users by role
  const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  // Export only filtered users
  const exportFilteredCSV = (userList) => {
    if (!userList.length) return;
    const header = ['id', 'name', 'email', 'role', 'profileUrl'];
    const rows = userList.map(u => [u._id, u.name, u.email, u.role, `/profile/${u._id}`]);
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-dashboard"><h2>Access Denied</h2><p>You must be an admin to view this page.</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Control Center</h2>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* User Stats */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>User Overview</h3>
          <p>Total Users: {users.length}</p>
          <p>Admins: {users.filter(u => u.role === 'admin').length}</p>
          <p>Teachers: {users.filter(u => u.role === 'teacher').length}</p>
          <p>Students: {users.filter(u => u.role === 'student').length}</p>
        </div>

        {/* Analytics */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>System Analytics</h3>
          {stats ? (
            <ul>
              <li>Messages Sent: {stats.sent}</li>
              <li>Messages Received: {stats.received}</li>
              <li>Unread Messages: {stats.unread}</li>
              <li>Message Types: {Object.entries(stats.typeBreakdown).map(([type, count]) => `${type}: ${count}`).join(', ')}</li>
            </ul>
          ) : <p>Loading analytics...</p>}
          <a href="/admin/analytics" className="export-btn" style={{ background: '#6366f1' }}>View Analytics</a>
        </div>

        {/* Messaging */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Quick Messaging</h3>
          <form onSubmit={handleSendMessage} style={{ marginBottom: '1rem' }}>
            <select value={messageRecipient} onChange={e => setMessageRecipient(e.target.value)} required style={{ width: '100%', marginBottom: 8 }}>
              <option value="">Select recipient...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email}) [{u.role}]</option>
              ))}
            </select>
            <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} required placeholder="Type your message..." style={{ width: '100%', minHeight: 60, marginBottom: 8 }} />
            <button type="submit" className="export-btn" disabled={sending}>Send Message</button>
          </form>
          <h4>Recent Messages</h4>
          <ul style={{ maxHeight: 120, overflowY: 'auto', padding: 0 }}>
            {messages.length === 0 ? <li>No recent messages.</li> : messages.map(m => (
              <li key={m._id} style={{ marginBottom: 4 }}>
                <strong>{m.subject}</strong>: {m.content.slice(0, 60)}... <span style={{ color: '#888' }}>to {m.recipient?.name || 'Unknown'}</span>
              </li>
            ))}
          </ul>
          <a href="/admin/messages" className="export-btn" style={{ background: '#f59e42' }}>View All Messages</a>
        </div>

        {/* Settings */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>System Settings</h3>
          <a href="/admin/settings" className="export-btn" style={{ background: '#10b981' }}>Go to Settings</a>
        </div>
      </div>

      {/* Role filter chips */}
      <div style={{ margin: '2rem 0', display: 'flex', gap: 12 }}>
        <button className={`export-btn${roleFilter === 'all' ? ' active-chip' : ''}`} style={{ background: '#64748b' }} onClick={() => setRoleFilter('all')}>All</button>
        <button className={`export-btn${roleFilter === 'admin' ? ' active-chip' : ''}`} style={{ background: '#6366f1' }} onClick={() => setRoleFilter('admin')}>Admins</button>
        <button className={`export-btn${roleFilter === 'teacher' ? ' active-chip' : ''}`} style={{ background: '#10b981' }} onClick={() => setRoleFilter('teacher')}>Teachers</button>
        <button className={`export-btn${roleFilter === 'student' ? ' active-chip' : ''}`} style={{ background: '#f59e42' }} onClick={() => setRoleFilter('student')}>Students</button>
        <button className="export-btn" style={{ background: '#059669' }} onClick={() => exportFilteredCSV(filteredUsers)}>Export Filtered to CSV</button>
      </div>

      {/* User Management Table */}
      <div style={{ marginTop: '1rem' }}>
        <h3>User Management</h3>
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Bio</th>
              <th>Institution</th>
              <th>Mobile Number</th>
              <th>Profile</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => {
              // Use Gravatar as fallback if profilePicture is missing
              const gravatarUrl = u.email ? `https://www.gravatar.com/avatar/${md5(u.email.trim().toLowerCase())}?d=identicon` : '/default-avatar.png';
              const avatarSrc = u.profilePicture && u.profilePicture.length > 5 ? u.profilePicture : gravatarUrl;
              return (
                <tr key={u._id}>
                  <td><img src={avatarSrc} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6', border: '1px solid #e5e7eb' }} /></td>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td>{u.email}</td>
                  <td>{u.profile?.bio || '-'}</td>
                  <td>{u.profile?.institution || '-'}</td>
                  <td>{u.mobileNumber || '-'}</td>
                  <td><a href={`/profile/${u._id}`}>Profile</a></td>
                  <td><a href={`/profile/${u._id}`} className="export-btn" style={{ background: '#6366f1', padding: '2px 10px', fontSize: '0.95rem' }}>View</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
