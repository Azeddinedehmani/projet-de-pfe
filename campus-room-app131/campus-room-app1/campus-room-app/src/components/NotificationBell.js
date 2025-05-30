import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import SockJS from 'sockjs-client';
import * as Stomp from '@stomp/stompjs';
import { FaBell } from 'react-icons/fa';
import '../../styles/unifié.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const stompClient = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      setupWebSocket();
    }

    // Click outside to close
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.disconnect();
      }
    };
  }, [user]);

  // WebSocket setup
  const setupWebSocket = () => {
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    client.debug = null; // disable logs

    client.connect(
      { Authorization: `Bearer ${localStorage.getItem('token')}` },
      () => {
        stompClient.current = client;
        client.subscribe(`/user/${user.id}/queue/notifications`, (message) => {
          const newNotification = JSON.parse(message.body);
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((count) => count + 1);
        });
      },
      (err) => {
        console.error('WebSocket error', err);
      }
    );
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotifications(res.data);
    } catch (err) {
      setError('Une erreur est survenue lors du chargement des notifications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications/unread/count', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Erreur récupération du nombre de notifications non lues');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur lors du marquage comme lu');
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button className="btn-notification" onClick={toggleDropdown}>
        <FaBell />
        {unreadCount > 0 && (
          <div className="notification-count">{unreadCount}</div>
        )}
      </button>

      {showDropdown && (
        <div className="notifications-container">
          <div className="notification-panel">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                Tout marquer comme lu
              </button>
            </div>

            <div className="notification-content">
              {loading ? (
                <div className="notification-loading">
                  <i className="fas fa-spinner fa-spin" />
                  Chargement...
                </div>
              ) : error ? (
                <div className="notification-error">
                  <i className="fas fa-exclamation-triangle" />
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <i className="fas fa-bell-slash" />
                  Aucune notification pour l’instant.
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className={`notification-item ${notif.read ? '' : 'unread'} reservation-${notif.status}`}
                  >
                    <div className="notification-icon">
                      <i className="fas fa-info" />
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notif.title}</div>
                      <div className="notification-message">{notif.message}</div>
                      <div className="notification-time">{notif.time}</div>
                    </div>
                    {!notif.read && (
                      <div className="notification-badge">
                        <span className="unread-dot" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="notification-footer">
              <button className="notification-action" onClick={fetchNotifications}>
                Actualiser
              </button>
              <button className="notification-action" onClick={() => setShowDropdown(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
