import React from 'react';
import { assets } from '../../assets/assets';

export default function PatientHeader({ patient, expiresAt }) {
    return (
        <div className="bg-white p-4 shadow-sm flex items-center border-b">
            <img 
                src={patient.image || assets.default_user} // Use a default user image if patient.image is not available
                alt={patient.name}
                className="w-10 h-10 rounded-full object-cover"
            />
            <div className="ml-3">
                <h3 className="font-semibold">{patient.name}</h3>
                <p className="text-xs text-gray-500">
                    Expires: {new Date(expiresAt).toLocaleString()}
                </p>
            </div>
        </div>
    );
}