import React, { useState } from 'react';
import '../styles/Auth.css';
import { useAuth } from '../context/AuthContext';

function Auth({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true); // Switch between login and register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useAuth(); // Use login and register from context

  // Handle environment-based base path
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = isProduction ? '/TheRealEstate' : '';

  // Handle form submission for login or register
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLogin) {
      login(email, password, onClose); // Call login function if isLogin is true
    } else {
      register(email, password, onClose); // Call register function if isLogin is false
    }

    // Clear the form fields
    setEmail('');
    setPassword('');
  };

  // Toggle between login and register mode
  const handleToggle = () => {
    setIsLogin(!isLogin); // Toggle the isLogin state
    setEmail(''); // Reset email and password fields
    setPassword('');
  };

  // If the modal is closed, return null and don't render it
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
            {isLogin ? 'Sign in' : 'Register'} {/* Toggle button text based on isLogin */}
          </button>
        </form>
        {isLogin && (
          <div className="forgot-password">
            <a href="#">Forgot your password?</a> {/* Link for forgot password */}
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;
