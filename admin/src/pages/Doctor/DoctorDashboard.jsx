import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';

// A simple loading spinner component for a better user experience
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full py-10">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
    </div>
);

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { dToken, backendUrl } = useContext(DoctorContext);
    const { currency } = useContext(AppContext);
    
    const [dashData, setDashData] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!dToken) {
                navigate('/doctor/login');
                return;
            }
            try {
                setIsLoading(true);
                // Fetch both dashboard stats and the chat list efficiently in parallel
                const [dashResponse, chatsResponse] = await Promise.all([
                    axios.get(`${backendUrl}/api/doctor/dashboard`, { headers: { Authorization: `Bearer ${dToken}` } }),
                    axios.get(`${backendUrl}/api/doctor/chats`, { headers: { Authorization: `Bearer ${dToken}` } })
                ]);

                if (dashResponse.data.success) {
                    setDashData(dashResponse.data.dashData);
                }
                if (chatsResponse.data.success) {
                    setConsultations(chatsResponse.data.chats);
                }

            } catch (error) {
                toast.error("Failed to load dashboard data.");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [dToken, backendUrl, navigate]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className='p-5 space-y-8'>
            {/* --- STATISTICS CARDS --- */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                <StatCard icon={assets.earning_icon} title="Total Earnings" value={`${currency}${dashData?.earnings || 0}`} />
                <StatCard icon={assets.appointments_icon} title="Active Consultations" value={dashData?.activeChats || 0} />
                <StatCard icon={assets.patients_icon} title="Total Patients" value={dashData?.totalPatients || 0} />
            </div>

            {/* --- CONSULTATIONS LIST --- */}
            <div className='bg-white rounded-lg shadow-md border'>
                <div className='flex items-center gap-3 px-6 py-4 border-b'>
                    <h2 className='font-semibold text-lg text-gray-800'>My Consultations</h2>
                </div>
                <div className='divide-y divide-gray-200'>
                    {consultations.length > 0 ? (
                        consultations.map((chat) => <ConsultationRow key={chat._id} chat={chat} navigate={navigate} />)
                    ) : (
                        <p className="p-6 text-center text-gray-500">You have no active or past consultations.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Helper Components for Cleaner and Reusable Code ---

const StatCard = ({ icon, title, value }) => (
    <div className='flex items-center gap-4 bg-white p-5 rounded-lg border shadow-sm hover:shadow-lg transition-shadow'>
        <img className='w-12' src={icon} alt={title} />
        <div>
            <p className='text-2xl font-bold text-gray-700'>{value}</p>
            <p className='text-gray-500'>{title}</p>
        </div>
    </div>
);

const ConsultationRow = ({ chat, navigate }) => {
    const isExpired = new Date(chat.expiresAt) < new Date();
    return (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-center py-4 px-6 hover:bg-gray-50 transition-colors'>
            {/* Patient Info */}
            <div className='flex items-center gap-3'>
                <img src={chat.userId.image || assets.default_user} className='w-10 h-10 rounded-full object-cover' alt="Patient" />
                <p className="font-medium text-gray-800">{chat.userId.name}</p>
            </div>
            {/* Consultation Start Date */}
            <p className="text-gray-600 text-sm">{new Date(chat.createdAt).toLocaleString()}</p>
            {/* Status Badge */}
            <div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {isExpired ? 'Expired' : 'Active'}
                </span>
            </div>
            {/* Action Button */}
            <div>
                <button
                    onClick={() => navigate(`/doctor/chat/${chat._id}`)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition"
                >
                    View Chat
                </button>
            </div>
        </div>
    );
};

export default DoctorDashboard;