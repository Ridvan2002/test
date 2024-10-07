import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Ensure proper use of navigate

function PrivateRoute({ children, openAuthModal, redirectPath }) {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate(); // Use useNavigate hook for navigation

    useEffect(() => {
        if (!isLoggedIn) {
            openAuthModal(); // Trigger the Auth modal if not logged in
        }
    }, [isLoggedIn, openAuthModal]);

    useEffect(() => {
        if (isLoggedIn && redirectPath) {
            navigate(redirectPath); // Navigate to the intended page after login
        }
    }, [isLoggedIn, redirectPath, navigate]);

    if (!isLoggedIn) {
        return null; // Don't render the protected content if not logged in
    }

    return children; // Render the protected content if logged in
}

export default PrivateRoute;
