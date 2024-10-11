import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function PrivateRoute({ children, openAuthModal, redirectPath }) {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) {
            openAuthModal();
        }
    }, [isLoggedIn, openAuthModal]);

    useEffect(() => {
        if (isLoggedIn && redirectPath) {
            navigate(redirectPath);
        }
    }, [isLoggedIn, redirectPath, navigate]);

    if (!isLoggedIn) {
        return null;
    }

    return children;
}

export default PrivateRoute;