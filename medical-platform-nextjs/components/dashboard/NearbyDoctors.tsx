'use client';

import { useState, useEffect } from 'react';

interface Doctor {
    Name: string;
    Specialty: string;
    'Hospital/Clinic': string;
    Address: string;
    City: string;
    Phone: string;
    Experience_Years: string;
}

const SPECIALTY_COLORS: Record<string, string> = {
    'Cardiologist': 'bg-red-100 text-red-700 border-red-200',
    'Neurologist': 'bg-purple-100 text-purple-700 border-purple-200',
    'Pediatrician': 'bg-blue-100 text-blue-700 border-blue-200',
    'Orthopedic Surgeon': 'bg-orange-100 text-orange-700 border-orange-200',
    'Gynecologist': 'bg-pink-100 text-pink-700 border-pink-200',
    'Dermatologist': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Psychiatrist': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Gastroenterologist': 'bg-green-100 text-green-700 border-green-200',
    'Nephrologist': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Urologist': 'bg-teal-100 text-teal-700 border-teal-200',
    'Ophthalmologist': 'bg-sky-100 text-sky-700 border-sky-200',
    'Pulmonologist': 'bg-lime-100 text-lime-700 border-lime-200',
    'Endocrinologist': 'bg-amber-100 text-amber-700 border-amber-200',
    'ENT Specialist': 'bg-rose-100 text-rose-700 border-rose-200',
    'General Physician': 'bg-gray-100 text-gray-700 border-gray-200',
};

const SPECIALTY_ICONS: Record<string, string> = {
    'Cardiologist': '❤️',
    'Neurologist': '🧠',
    'Pediatrician': '👶',
    'Orthopedic Surgeon': '🦴',
    'Gynecologist': '🌸',
    'Dermatologist': '🌿',
    'Psychiatrist': '💆',
    'Gastroenterologist': '🫁',
    'Nephrologist': '💧',
    'Urologist': '🔬',
    'Ophthalmologist': '👁️',
    'Pulmonologist': '🫀',
    'Endocrinologist': '⚗️',
    'ENT Specialist': '👂',
    'General Physician': '🩺',
};

function getSpecialtyColor(specialty: string) {
    return SPECIALTY_COLORS[specialty] || 'bg-violet-100 text-violet-700 border-violet-200';
}

function getSpecialtyIcon(specialty: string) {
    return SPECIALTY_ICONS[specialty] || '👨‍⚕️';
}

function formatPhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
}

export default function NearbyDoctors() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [city, setCity] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [sort, setSort] = useState<'experience' | 'name'>('experience');
    const [locationError, setLocationError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // Load filter options on mount
    useEffect(() => {
        fetch('/api/doctors/nearby')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setSpecialties(d.specialties);
                    setCities(d.cities);
                }
            });
    }, []);

    const fetchDoctors = async (cityOverride?: string, specialtyOverride?: string, sortOverride?: string) => {
        setLoading(true);
        setHasSearched(true);
        const params = new URLSearchParams();
        const c = cityOverride ?? city;
        const s = specialtyOverride ?? selectedSpecialty;
        const so = sortOverride ?? sort;
        if (c) params.set('city', c);
        if (s) params.set('specialty', s);
        if (so) params.set('sort', so);

        try {
            const res = await fetch(`/api/doctors/nearby?${params}`);
            const data = await res.json();
            if (data.success) setDoctors(data.data);
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = () => {
        setLocating(true);
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            setLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await res.json();
                    const detected =
                        data.address?.city ||
                        data.address?.town ||
                        data.address?.suburb ||
                        data.address?.county ||
                        '';
                    // Try to match to known cities
                    const knownMatch = cities.find(c =>
                        detected.toLowerCase().includes(c.toLowerCase()) ||
                        c.toLowerCase().includes(detected.toLowerCase())
                    );
                    const finalCity = knownMatch || detected;
                    setCity(finalCity);
                    await fetchDoctors(finalCity);
                } catch {
                    setLocationError('Could not determine your city. Please enter it manually.');
                } finally {
                    setLocating(false);
                }
            },
            () => {
                setLocationError('Location access denied. Please enter your city manually.');
                setLocating(false);
            }
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="text-3xl">📍</div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Find Nearby Doctors</h3>
                    <p className="text-sm text-gray-500">Search across 151 verified doctors in Mumbai, Navi Mumbai & Thane</p>
                </div>
            </div>

            {/* Search Panel */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5 space-y-4">
                {/* Location row */}
                <div className="flex gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Your City
                        </label>
                        <select
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        >
                            <option value="">All Cities</option>
                            {cities.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={detectLocation}
                        disabled={locating}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-300 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-50 transition disabled:opacity-60 whitespace-nowrap shadow-sm"
                    >
                        {locating ? (
                            <><span className="animate-spin">🔄</span> Locating...</>
                        ) : (
                            <><span>📍</span> Use My Location</>
                        )}
                    </button>
                </div>

                {locationError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        ⚠️ {locationError}
                    </p>
                )}

                {/* Filters row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Specialty
                        </label>
                        <select
                            value={selectedSpecialty}
                            onChange={e => setSelectedSpecialty(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        >
                            <option value="">All Specialties</option>
                            {specialties.map(s => (
                                <option key={s} value={s}>{getSpecialtyIcon(s)} {s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Sort By
                        </label>
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as 'experience' | 'name')}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        >
                            <option value="experience">⭐ Most Experienced</option>
                            <option value="name">🔤 Name (A–Z)</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => fetchDoctors()}
                    disabled={loading}
                    className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><span className="animate-spin">🔄</span> Searching...</>
                    ) : (
                        <>🔍 Search Doctors</>
                    )}
                </button>
            </div>

            {/* Results */}
            {hasSearched && !loading && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">
                            {doctors.length > 0 ? (
                                <><span className="text-purple-600">{doctors.length}</span> doctor{doctors.length !== 1 ? 's' : ''} found</>
                            ) : (
                                'No doctors found'
                            )}
                            {city && <span className="text-gray-500 font-normal"> in {city}</span>}
                            {selectedSpecialty && <span className="text-gray-500 font-normal"> · {selectedSpecialty}</span>}
                        </p>
                    </div>

                    {doctors.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-sm">No doctors match your search. Try a different city or specialty.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 max-h-[480px] overflow-y-auto pr-1">
                            {doctors.map((doc, i) => (
                                <div
                                    key={i}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-purple-200 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xl flex-shrink-0 border border-purple-200">
                                                {getSpecialtyIcon(doc.Specialty)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-gray-900 text-sm">{doc.Name}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getSpecialtyColor(doc.Specialty)}`}>
                                                        {doc.Specialty}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-0.5">🏥 {doc['Hospital/Clinic']}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {doc.Address}</p>
                                            </div>
                                        </div>
                                        {/* Experience badge */}
                                        <div className="flex-shrink-0 text-center">
                                            <div className="text-lg font-bold text-purple-600">{doc.Experience_Years}</div>
                                            <div className="text-xs text-gray-400 leading-tight">yrs exp</div>
                                        </div>
                                    </div>
                                    {/* Phone */}
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-gray-400">📞 {formatPhone(doc.Phone)}</span>
                                        <a
                                            href={`tel:${doc.Phone}`}
                                            className="text-xs px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium hover:bg-green-100 transition"
                                        >
                                            Call Now
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Initial empty state */}
            {!hasSearched && (
                <div className="text-center py-10 text-gray-400">
                    <div className="text-5xl mb-3">🗺️</div>
                    <p className="text-sm font-medium text-gray-500">Use your location or select a city to find doctors near you</p>
                    <p className="text-xs text-gray-400 mt-1">151 doctors across Mumbai, Navi Mumbai & Thane</p>
                </div>
            )}
        </div>
    );
}
