import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const AllConsultations = () => {
    // Use the new, correct state and functions from the refactored context
    const { consultations, getConsultations } = useContext(AdminContext);
    const { currency } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await getConsultations();
            setIsLoading(false);
        };
        fetchData();
    }, []); // Fetch data once on component mount

    return (
        <div className='w-full max-w-6xl m-5'>
            <h1 className='mb-4 text-2xl font-bold text-gray-800'>All Consultations</h1>
            <div className='bg-white border rounded-lg shadow-md text-sm max-h-[80vh] overflow-y-scroll'>
                {/* Table Header */}
                <div className='hidden sm:grid grid-cols-5 gap-4 py-3 px-6 border-b font-semibold text-gray-600 sticky top-0 bg-gray-50'>
                    <p>Patient</p>
                    <p>Doctor</p>
                    <p>Date Initiated</p>
                    <p>Fee Paid</p>
                    <p>Status</p>
                </div>

                {/* Table Body */}
                {isLoading ? (
                    <p className="p-6 text-center text-gray-500">Loading consultations...</p>
                ) : consultations.length === 0 ? (
                    <p className="p-6 text-center text-gray-500">No consultations have been initiated yet.</p>
                ) : (
                    consultations.map((chat) => {
                        const isExpired = new Date(chat.expiresAt) < new Date();
                        return (
                            <div key={chat._id} className='grid grid-cols-1 sm:grid-cols-5 gap-4 items-center py-3 px-6 border-b hover:bg-gray-50'>
                                {/* Patient Info */}
                                <div className='flex items-center gap-3'>
                                    <img src={chat.userId.image || assets.default_user} className='w-9 h-9 rounded-full object-cover' alt="Patient" />
                                    <div>
                                        <p className="font-medium text-gray-800">{chat.userId.name}</p>
                                        <p className="text-xs text-gray-500">{chat.userId.email}</p>
                                    </div>
                                </div>
                                {/* Doctor Info */}
                                <div className='flex items-center gap-3'>
                                    <img src={chat.doctorId.image || assets.default_doctor} className='w-9 h-9 rounded-full object-cover' alt="Doctor" />
                                    <div>
                                        <p className="font-medium text-gray-800">{chat.doctorId.name}</p>
                                        <p className="text-xs text-gray-500">{chat.doctorId.speciality}</p>
                                    </div>
                                </div>
                                {/* Date */}
                                <p className="text-gray-600">{new Date(chat.createdAt).toLocaleString()}</p>
                                {/* Fee */}
                                <p className="font-semibold text-green-600">{currency}{chat.amount}</p>
                                {/* Status */}
                                <div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {isExpired ? 'Expired' : 'Active'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AllConsultations;