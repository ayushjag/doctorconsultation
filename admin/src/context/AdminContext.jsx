import { createContext, useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [aToken, setAToken] = useState(localStorage.getItem('aToken') || '');
    const [doctors, setDoctors] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [dashData, setDashData] = useState(null);

    const handleAdminLogin = (newToken) => {
        localStorage.setItem('aToken', newToken);
        setAToken(newToken);
    };

    const handleAdminLogout = () => {
        localStorage.removeItem('aToken');
        setAToken('');
    };

    const getAllDoctors = async () => {
        if (!aToken) return;
        try {
            // --- THIS IS THE FIX ---
            const { data } = await axios.get(`${backendUrl}/api/admin/all-doctors`, { 
                headers: { Authorization: `Bearer ${aToken}` } 
            });
            if (data.success) setDoctors(data.doctors);
        } catch (error) { toast.error("Failed to load doctors."); }
    };

    const changeAvailability = async (docId) => {
        if (!aToken) return;
        try {
            // --- THIS IS THE FIX ---
            const { data } = await axios.post(`${backendUrl}/api/admin/change-availability`, { docId }, { 
                headers: { Authorization: `Bearer ${aToken}` }
            });
            if (data.success) {
                toast.success(data.message);
                await getAllDoctors();
            } else { toast.error(data.message); }
        } catch (error) { toast.error("Failed to change availability."); }
    };

    const getConsultations = async () => {
        if (!aToken) return;
        try {
            // --- THIS IS THE FIX ---
            const { data } = await axios.get(`${backendUrl}/api/admin/consultations`, { 
                headers: { Authorization: `Bearer ${aToken}` }
            });
            if (data.success) setConsultations(data.chats);
        } catch (error) { toast.error("Failed to load consultations."); }
    };

    const getDashData = async () => {
        if (!aToken) return;
        try {
            // --- THIS IS THE FIX ---
            const { data } = await axios.get(`${backendUrl}/api/admin/dashboard`, { 
                headers: { Authorization: `Bearer ${aToken}` }
            });
            if (data.success) setDashData(data.dashData);
        } catch (error) { toast.error("Failed to load dashboard data."); }
    };

    useEffect(() => {
        if (aToken) {
            getAllDoctors();
            getConsultations();
            getDashData();
        }
    }, [aToken]);

    const contextValue = { aToken, backendUrl, doctors, consultations, dashData, handleAdminLogin, handleAdminLogout, getAllDoctors, changeAvailability, getConsultations, getDashData };

    return <AdminContext.Provider value={contextValue}>{props.children}</AdminContext.Provider>;
};

export default AdminContextProvider;