import React, { useState } from 'react';
import '../styles/Auth.css';
import { useAuth } from '../context/AuthContext';

function Auth({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useAuth();

  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = isProduction ? '/TheRealEstate' : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLogin) {
      login(email, password, onClose);
    } else {
      register(email, password, onClose);
    }

    setEmail('');
    setPassword('');
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-title">
          <span className="welcome-text">Welcome To</span>
          <img src={`${basePath}/house.png`} alt="house icon" className="title-icon" />
          <h2 className="title-text">TheRealEstate</h2>
        </div>
        <div className="auth-header">
          <button 
            onClick={handleToggle} 
            className={isLogin ? 'active' : ''}
          >
            Sign in
          </button>
          <button 
            onClick={handleToggle} 
            className={!isLogin ? 'active' : ''}
          >
            New account
          </button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
          <button type="submit" className="auth-submit">
            {isLogin ? 'Sign in' : 'Register'}
          </button>
        </form>
        {isLogin && (
          <div className="forgot-password">
            <a href="#">Forgot your password?</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;