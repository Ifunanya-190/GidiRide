import React, { FormEvent, useState, useEffect } from 'react';
import { driverApi } from '../../api/driver';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { DriverDocument, DriverProfile as DriverProfileType } from '../../types/driver';
import { User, Car, FileText, Shield, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const emptyProfile: DriverProfileType = {
  userId: '',
  fullName: '',
  phone: '',
  email: '',
  nin: '',
  licenseNumber: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleColor: '',
  plateNumber: '',
  vehicleYear: '',
  homeArea: '',
  kycStatus: 'NOT_SUBMITTED',
  onlineStatus: 'OFFLINE',
  documents: []
};

export function DriverProfile() {
  const [profile, setProfile] = useState<DriverProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<DriverProfileType>(emptyProfile);
  const [licenseFile, setLicenseFile] = useState('');
  const [paperFile, setPaperFile] = useState('');
  const [ninFile, setNinFile] = useState('');

  const fetchProfile = async () => {
    try {
      const data = await driverApi.getProfile();
      setProfile(data);
      if (data) {
        setForm(data);
        setIsEditing(data.kycStatus !== 'APPROVED');
      }
      setError(null);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  function update<K extends keyof DriverProfileType>(key: K, value: DriverProfileType[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const handleSaveKyc = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setSaveLoading(true);

    try {
      const now = new Date().toISOString();
      const documents: DriverDocument[] = [
        { id: 'license', label: 'Driver license', fileName: licenseFile || 'driver-license.jpg', uploadedAt: now, status: 'PENDING' },
        { id: 'nin', label: 'NIN slip', fileName: ninFile || 'nin-slip.jpg', uploadedAt: now, status: 'PENDING' },
        { id: 'car-paper', label: 'Car papers', fileName: paperFile || 'vehicle-papers.pdf', uploadedAt: now, status: 'PENDING' }
      ];
      const updated = await driverApi.submitKyc({ ...form, documents });
      setProfile(updated);
      setForm(updated);
      setSaveSuccess(updated.kycStatus === 'APPROVED' ? 'Profile updated.' : 'KYC submitted. Your documents are now queued for review.');
      if (updated.kycStatus === 'APPROVED') setIsEditing(false);
    } catch (err) {
      setSaveError(getFriendlyError(err));
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-950 min-h-screen">
        <LoadingSpinner label="Loading profile data..." />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-950 min-h-screen">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const kycStatusLabel = (profile?.kycStatus || 'NOT_SUBMITTED').replace('_', ' ');
  const isApproved = profile?.kycStatus === 'APPROVED';
  
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto bg-gray-950 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#00A859]/20 flex items-center justify-center">
              <User className="text-[#00A859]" size={24} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#00A859] uppercase tracking-wider">Driver Identity</h2>
              <h1 className="text-3xl font-bold text-white">Profile & KYC</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  profile?.onlineStatus === 'ONLINE' ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-gray-800 text-gray-400'
                }`}>
                  {profile?.onlineStatus || 'OFFLINE'}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  isApproved ? 'bg-[#00A859]/20 text-[#00A859]' :
                  kycStatusLabel === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  KYC: {kycStatusLabel}
                </span>
              </div>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="py-2 px-4 rounded-xl font-bold transition-all bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              Update Profile
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {isEditing ? (
          <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-[#00A859]" size={24} />
              <h2 className="text-xl font-bold text-white">KYC Submission</h2>
            </div>

            {saveError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span className="text-sm">{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveKyc} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-2 mb-4">Personal Details</h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">NIN</label>
                    <input
                      type="text"
                      value={form.nin}
                      onChange={e => update('nin', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                      placeholder="11 digit NIN"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Driver License Number</label>
                    <input
                      type="text"
                      value={form.licenseNumber}
                      onChange={e => update('licenseNumber', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                      placeholder="e.g. ABC1234567"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Residential Area</label>
                    <input
                      type="text"
                      value={form.homeArea}
                      onChange={e => update('homeArea', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                      placeholder="e.g. Yaba, Ikeja"
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-2 mb-4">Vehicle Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Make</label>
                      <input
                        type="text"
                        value={form.vehicleMake}
                        onChange={e => update('vehicleMake', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                        placeholder="e.g. Toyota"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model</label>
                      <input
                        type="text"
                        value={form.vehicleModel}
                        onChange={e => update('vehicleModel', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                        placeholder="e.g. Camry"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Year</label>
                      <input
                        type="text"
                        value={form.vehicleYear}
                        onChange={e => update('vehicleYear', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                        placeholder="YYYY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">License Plate</label>
                      <input
                        type="text"
                        value={form.plateNumber}
                        onChange={e => update('plateNumber', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                        placeholder="e.g. KJA-123AA"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Color</label>
                    <input
                      type="text"
                      value={form.vehicleColor}
                      onChange={e => update('vehicleColor', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                      placeholder="e.g. Silver"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saveLoading}
                  className="py-3 px-6 rounded-xl font-bold transition-all bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="py-3 px-6 rounded-xl font-bold transition-all bg-[#00A859] hover:bg-[#008f4c] text-white flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saveLoading ? <Loader2 className="animate-spin" size={20} /> : 'Submit KYC'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Identity & Contact Info */}
            <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                <Shield className="text-purple-500" size={24} />
                <h2 className="text-xl font-bold text-white">Identity</h2>
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                  <p className="text-white font-medium">{profile?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-white font-medium">{profile?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-white font-medium">{profile?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">National ID (NIN)</p>
                  <p className="text-white font-medium">{profile?.nin ? '••••' + profile.nin.slice(-4) : 'Not Provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Home Area</p>
                  <p className="text-white font-medium">{profile?.homeArea || 'Not Provided'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Vehicle Card */}
              <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4">
                  <Car className="text-blue-500" size={24} />
                  <h2 className="text-xl font-bold text-white">Vehicle Details</h2>
                </div>
                
                {profile?.vehicleMake ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Make / Model</p>
                      <p className="text-white font-medium">{profile.vehicleMake} {profile.vehicleModel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Year / Color</p>
                      <p className="text-white font-medium">{profile.vehicleYear} • {profile.vehicleColor}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">License Plate</p>
                      <div className="inline-block bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-3 py-1 rounded font-mono font-bold mt-1">
                        {profile.plateNumber}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Car className="mx-auto mb-2 opacity-50" size={32} />
                    <p>No vehicle details provided.</p>
                  </div>
                )}
              </div>

              {/* Documents Card */}
              <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="text-orange-500" size={24} />
                    <h2 className="text-xl font-bold text-white">Documents</h2>
                  </div>
                  <button className="text-[#00A859] hover:text-[#008f4c] transition-colors p-2 bg-[#00A859]/10 rounded-full">
                    <Upload size={18} />
                  </button>
                </div>

                {(!profile?.documents || profile.documents.length === 0) ? (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="mx-auto mb-2 opacity-50" size={32} />
                    <p>No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(profile.documents || []).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="text-gray-400" size={18} />
                          <div>
                            <p className="text-sm font-bold text-white">{doc.label}</p>
                            <p className="text-xs text-gray-500">{doc.fileName}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          doc.status === 'APPROVED' ? 'bg-[#00A859]/20 text-[#00A859]' :
                          doc.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
