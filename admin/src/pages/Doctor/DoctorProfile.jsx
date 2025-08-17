import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const DoctorProfile = () => {
    const { dToken, backendUrl } = useContext(DoctorContext);
    const { currency } = useContext(AppContext);
    
    const [profileData, setProfileData] = useState(null);
    const [originalData, setOriginalData] = useState(null); // For cancel functionality
    const [isEdit, setIsEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const getProfileData = async () => {
        try {
            setIsLoading(true);
            const { data } = await axios.get(`${backendUrl}/api/doctor/profile`, { headers: { Authorization: `Bearer ${dToken}` } });
            if (data.success) {
                setProfileData(data.profileData);
                setOriginalData(data.profileData); // Set initial state for cancel
            }
        } catch (error) {
            toast.error("Failed to load profile.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (dToken) getProfileData();
    }, [dToken]);

    const handleSaveChanges = async () => {
        try {
            // Use PATCH for updating existing data
            const { data } = await axios.patch(`${backendUrl}/api/doctor/profile`, profileData, { headers: { Authorization: `Bearer ${dToken}` } });
            if (data.success) {
                toast.success(data.message);
                setIsEdit(false);
                getProfileData(); // Reload fresh data from the server
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed.");
        }
    };

    if (isLoading || !profileData) {
        return <div className="text-center p-10">Loading profile...</div>;
    }

    return (
        <div className="container mx-auto p-5 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                <div>
                    {isEdit ? (
                        <div className="flex gap-4">
                            <button onClick={() => { setIsEdit(false); setProfileData(originalData); }} className="px-6 py-2 rounded-full text-sm font-semibold bg-gray-200 hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSaveChanges} className="px-6 py-2 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEdit(true)} className="px-6 py-2 rounded-full text-sm font-semibold text-white bg-gray-800 hover:bg-black">Edit Profile</button>
                    )}
                </div>
            </div>

            {/* Warning for new doctors */}
            {profileData.profileStatus === 'incomplete' && !isEdit && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Please Complete Your Profile</p>
                    <p>Fill in all required details to activate your account and start receiving consultations.</p>
                </div>
            )}

            <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b">
                    <img className='w-32 h-32 rounded-full object-cover border-4 border-white shadow-sm' src={profileData.image} alt="Profile" />
                    <div className="text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-gray-800">{profileData.name}</h2>
                        <p className="text-gray-500 mt-1">{profileData.email}</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Professional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoField label="Speciality" value={profileData.speciality} isEdit={isEdit} onChange={(e) => setProfileData(p => ({ ...p, speciality: e.target.value }))} />
                            <InfoField label="Degree" value={profileData.degree} isEdit={isEdit} onChange={(e) => setProfileData(p => ({ ...p, degree: e.target.value }))} />
                            <InfoField label="Years of Experience" type="number" value={profileData.experience} isEdit={isEdit} onChange={(e) => setProfileData(p => ({ ...p, experience: e.target.value }))} />
                            <InfoField label="Consultation Fee" type="number" value={profileData.fees} isEdit={isEdit} onChange={(e) => setProfileData(p => ({ ...p, fees: e.target.value }))} prefix={currency} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">About</h3>
                        {isEdit ? <textarea className='w-full bg-gray-100 border rounded-lg p-3' rows={5} value={profileData.about} onChange={(e) => setProfileData(p => ({ ...p, about: e.target.value }))} /> : <p className="text-gray-600">{profileData.about}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                         <h3 className="text-lg font-semibold text-gray-700">Available for Consultations</h3>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={profileData.available} onChange={() => isEdit && setProfileData(p => ({ ...p, available: !p.available }))} className="sr-only peer" disabled={!isEdit}/>
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for cleaner code
const InfoField = ({ label, value, isEdit, onChange, type = 'text', prefix }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        {isEdit ? (
            <div className="relative">
                {prefix && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">{prefix}</span>}
                <input type={type} value={value || ''} onChange={onChange} className={`w-full bg-gray-100 border rounded-lg py-2 transition ${prefix ? 'pl-7 pr-3' : 'px-3'}`} />
            </div>
        ) : (
            <p className="text-gray-800">{prefix}{value || 'Not specified'}</p>
        )}
    </div>
);

export default DoctorProfile;