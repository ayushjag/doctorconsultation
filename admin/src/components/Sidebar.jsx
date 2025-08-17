import React, { useContext } from 'react';
import { assets } from '../assets/assets';
import { NavLink } from 'react-router-dom';
import { DoctorContext } from '../context/DoctorContext';
import { AdminContext } from '../context/AdminContext';

const Sidebar = () => {
    const { dToken } = useContext(DoctorContext);
    const { aToken } = useContext(AdminContext);

    // This component will render the correct set of links based on the user's role.
    const role = aToken ? 'admin' : dToken ? 'doctor' : null;

    if (!role) {
        return null; // Don't render a sidebar on the login page
    }

    // Define the links for each role
    const adminLinks = [
        { path: '/admin/dashboard', icon: assets.home_icon, label: 'Dashboard' },
        { path: '/admin/consultations', icon: assets.appointment_icon, label: 'Consultations' },
        { path: '/admin/add-doctor', icon: assets.add_icon, label: 'Add Doctor' },
        { path: '/admin/doctors', icon: assets.people_icon, label: 'Doctors List' },
    ];

    const doctorLinks = [
        { path: '/doctor/dashboard', icon: assets.home_icon, label: 'Dashboard' },
        { path: '/doctor/profile', icon: assets.people_icon, label: 'My Profile' },
    ];

    const linksToRender = role === 'admin' ? adminLinks : doctorLinks;

    return (
        <div className='min-h-screen bg-white border-r pt-8'>
            <ul className='text-gray-600 font-medium space-y-2'>
                {linksToRender.map((link) => (
                    <li key={link.path}>
                        <NavLink 
                            to={link.path} 
                            className={({ isActive }) => 
                                `flex items-center gap-3 py-3 px-6 cursor-pointer transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600 ${
                                    isActive 
                                        ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-600 font-semibold' 
                                        : ''
                                }`
                            }
                        >
                            <img className='w-5' src={link.icon} alt={`${link.label} icon`} />
                            <p className='hidden md:block'>{link.label}</p>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;