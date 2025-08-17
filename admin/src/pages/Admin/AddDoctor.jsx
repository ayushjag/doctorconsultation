import React, { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const AddDoctor = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { backendUrl } = useContext(AppContext);
    // Get the admin token 'aToken' from the context
    const { aToken, getAllDoctors } = useContext(AdminContext);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const newDoctorData = {
                name,
                email,
                password
            };

            // --- THIS IS THE FINAL FIX ---
            // The API call must include the correct Authorization header
            // that your authAdmin.js middleware is expecting.
            const { data } = await axios.post(`${backendUrl}/api/admin/add-doctor`, newDoctorData, { 
                headers: { Authorization: `Bearer ${aToken}` } 
            });

            if (data.success) {
                toast.success(data.message);
                // Reset the form after successful submission
                setName('');
                setEmail('');
                setPassword('');
                await getAllDoctors(); // Refresh the main doctors list
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create doctor account.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full max-w-lg'>
            <h1 className='mb-4 text-2xl font-bold text-gray-800'>Create Pre-Approved Doctor Account</h1>
            <p className="text-gray-500 mb-6">The new doctor will be prompted to complete their full profile details upon their first login.</p>

            <div className='bg-white p-8 border rounded-lg shadow-md w-full space-y-6'>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Full Name</label>
                    <input 
                        onChange={e => setName(e.target.value)} 
                        value={name} 
                        className='w-full border rounded-lg px-3 py-2' 
                        type="text" 
                        placeholder='e.g., Dr. Jane Doe' 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Email</label>
                    <input 
                        onChange={e => setEmail(e.target.value)} 
                        value={email} 
                        className='w-full border rounded-lg px-3 py-2' 
                        type="email" 
                        placeholder='doctor@example.com' 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Set a Temporary Password</label>
                    <input 
                        onChange={e => setPassword(e.target.value)} 
                        value={password} 
                        className='w-full border rounded-lg px-3 py-2' 
                        type="password" 
                        placeholder='Minimum 8 characters' 
                        required 
                    />
                     <p className="text-xs text-gray-500 mt-1">The doctor can change this later.</p>
                </div>
                <button 
                    type='submit' 
                    disabled={isLoading}
                    className='w-full bg-blue-600 text-white py-3 mt-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400'
                >
                    {isLoading ? 'Creating Account...' : 'Create Doctor Account'}
                </button>
            </div>
        </form>
    );
};

export default AddDoctor;