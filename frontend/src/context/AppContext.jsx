import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from 'axios';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const currencySymbol = '₹';
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [doctors, setDoctors] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeChats, setActiveChats] = useState([]);

    const getDoctorsData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/doctor/list`);
            if (data.success) {
                setDoctors(data.doctors);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            toast.error(error.response?.data?.message || 'Failed to load doctors');
        } finally {
            setLoading(false);
        }
    };

    const loadUserProfileData = async () => {
        if (!token) return;
        
        setLoading(true);
        try {
            // --- THIS IS THE CORRECTED HEADER ---
            const { data } = await axios.get(`${backendUrl}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                setUserData(data.userData);
                await loadActiveChats();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            if (error.response?.status === 401) {
                handleLogout(); // Automatically log out if token is invalid
            }
        } finally {
            setLoading(false);
        }
    };

    const loadActiveChats = async () => {
        if (!token) return;
        try {
            // --- THIS IS THE CORRECTED HEADER ---
            const { data } = await axios.get(`${backendUrl}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setActiveChats(data.chats);
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const handleLogin = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken('');
        setUserData(null);
        setActiveChats([]);
    };

    const initiateChatPayment = async (doctorId) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/chats/initiate`,
                { doctorId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return data;
        } catch (error) {
            console.error('Payment initiation failed:', error);
            throw error;
        }
    };

    const verifyChatPayment = async (paymentData) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/chats/verify`,
                paymentData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return data;
        } catch (error) {
            console.error('Payment verification failed:', error);
            throw error;
        }
    };

    useEffect(() => {
        getDoctorsData();
    }, []);

    useEffect(() => {
        if (token) {
            loadUserProfileData();
        } else {
            // Clear user data if there is no token
            setUserData(null);
            setActiveChats([]);
        }
    }, [token]);

    return (
        <AppContext.Provider value={{
            doctors,
            currencySymbol,
            backendUrl,
            token,
            setToken,
            userData,
            setUserData, // Add setUserData to the provider value
            loading,
            setLoading,
            activeChats,
            handleLogin,
            handleLogout,
            loadUserProfileData,
            initiateChatPayment,
            verifyChatPayment,
            loadActiveChats
        }}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;