export default function DoctorHeader({ doctor, expiresAt }) {
    return (
        <div className="bg-white p-4 shadow-sm flex items-center border-b">
            <img 
                src={doctor.image} 
                alt={doctor.name}
                className="w-10 h-10 rounded-full object-cover"
            />
            <div className="ml-3">
                <h3 className="font-semibold">{doctor.name}</h3>
                <p className="text-xs text-gray-500">
                    {doctor.speciality} • Expires: {new Date(expiresAt).toLocaleString()}
                </p>
            </div>
        </div>
    );
}