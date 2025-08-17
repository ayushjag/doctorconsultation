import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { assets } from '../../assets/assets'; // It's good practice to import assets if you plan to use a default image

const DoctorsList = () => {
    // The context provides the data and the functions to manage it.
    const { doctors, changeAvailability, aToken, getAllDoctors } = useContext(AdminContext);

    // This effect is responsible for fetching the initial list of doctors.
    useEffect(() => {
        // We only fetch if the admin is logged in (i.e., aToken exists).
        if (aToken) {
            getAllDoctors();
        }
        // --- FIX: Add getAllDoctors to the dependency array ---
        // This tells React to re-run the effect if this function ever changes,
        // which follows best practices and prevents potential bugs.
    }, [aToken, getAllDoctors]);

    if (!doctors || doctors.length === 0) {
        return <div className="p-10 text-center text-gray-500">No doctors found.</div>;
    }

    return (
        <div className='m-5'>
            <h1 className='text-2xl font-bold text-gray-800 mb-6'>Manage Doctors</h1>
            <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                {doctors.map((doctor) => (
                    <div key={doctor._id} className='bg-white border rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1'>
                        <img 
                            className='w-full h-48 object-cover bg-gray-200' 
                            src={doctor.image || assets.default_doctor} // Use a default image if one is missing
                            alt={`Dr. ${doctor.name}`} 
                        />
                        <div className='p-4'>
                            <p className='text-lg font-semibold text-gray-800'>{doctor.name}</p>
                            <p className='text-sm text-blue-600 font-medium'>{doctor.speciality}</p>
                            <div className='mt-4 flex items-center justify-between'>
                                <span className='text-sm text-gray-500'>Availability</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"  
                                        checked={doctor.available}
                                        onChange={() => changeAvailability(doctor._id)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DoctorsList;