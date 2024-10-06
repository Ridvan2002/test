import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children, openAuthModal, redirectPath, navigate }) {
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        if (!isLoggedIn) {
            openAuthModal(); // Trigger the Auth modal
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
