import { createContext, useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [dToken, setDToken] = useState(localStorage.getItem('dToken') || '');
    const [consultations, setConsultations] = useState([]);
    const [dashData, setDashData] = useState(null);
    const [profileData, setProfileData] = useState(null);

    const handleDoctorLogin = (newToken) => {
        localStorage.setItem('dToken', newToken);
        setDToken(newToken);
    };
    const handleDoctorLogout = () => {
        localStorage.removeItem('dToken');
        setDToken('');
    };

    const getConsultations = async () => {
        if (!dToken) return;
        try {
            // --- THIS IS THE FIX ---
            const { data } = await axios.get(`${backendUrl}/api/doctor/chats`, { 
                headers: { Authorization: `Bearer ${dToken}` }
            });
            if (data.success) setConsultations(data.chats);
        } catch (error) { toast.error("Failed to load consultations."); }
    };

    const getDashData = async () => {
        if (!dToken) return;
        try {
            // --- THIS IS THE FIX ---
            const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard`, { 
                headers: { Authorization: `Bearer ${dToken}` }
            });
            if (data.success) setDashData(data.dashData);
        } catch (error) { toast.error("Failed to load dashboard data."); }
    };
    
    // ... any other protected API calls for the doctor would go here with the same header fix ...

    useEffect(() => {
        if (dToken) {
            // Load initial data for a logged-in doctor
            getDashData();
            getConsultations();
        }
    }, [dToken]);

    const contextValue = { dToken, backendUrl, consultations, dashData, profileData, setProfileData, handleDoctorLogin, handleDoctorLogout, getConsultations, getDashData };

    return <DoctorContext.Provider value={contextValue}>{props.children}</DoctorContext.Provider>;
};

export default DoctorContextProvider;