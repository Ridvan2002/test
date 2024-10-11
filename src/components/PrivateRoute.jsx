import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function PrivateRoute({ children, openAuthModal, redirectPath }) {
    const { isLoggedIn } = useAuth();  // Check authentication status
    const navigate = useNavigate();

    // Open the authentication modal if the user is not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            openAuthModal();  // Open modal if not authenticated
        }
    }, [isLoggedIn, openAuthModal]);

    // Navigate to the desired path if the user is logged in
    useEffect(() => {
        if (isLoggedIn && redirectPath) {
            navigate(redirectPath);  // Navigate to redirectPath if provided
        }
    }, [isLoggedIn, redirectPath, navigate]);

    // Render children only if the user is logged in, otherwise return null
    if (!isLoggedIn) {
        return null;  // Don't render the children if not logged in
    }

    return children;  // Render the children if authenticated
}

export default PrivateRoute;
