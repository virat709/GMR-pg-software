import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  CreditCard, 
  MapPin, 
  Briefcase, 
  BookOpen, 
  ShieldCheck, 
  Send,
  Home
} from 'lucide-react';
import { Property, IDType, PendingTenantRegistration } from '../types';
import { savePendingRegistrationInDb } from '../lib/firestoreService';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

interface TenantSelfRegistrationFormProps {
  properties: Property[];
  onFinish?: () => void;
}

export default function TenantSelfRegistrationForm({ properties, onFinish }: TenantSelfRegistrationFormProps) {
  const { t, language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [rentAmount, setRentAmount] = useState<number | string>('');
  const [securityDeposit, setSecurityDeposit] = useState<number | string>('');
  const [presentPaid, setPresentPaid] = useState<number | string>('');
  const [idType, setIdType] = useState<IDType>('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);

  // Admission details
  const [fatherName, setFatherName] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [dob, setDob] = useState('');
  const [educationalQualification, setEducationalQualification] = useState('');
  const [employment, setEmployment] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [familyContactNumber, setFamilyContactNumber] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [panNo, setPanNo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !roomNumber.trim()) {
      alert('Please fill in Name, Phone, and Room Number.');
      return;
    }

    setIsSubmitting(true);
    const propObj = properties.find(p => p.id === selectedPropId);

    const registration: PendingTenantRegistration = {
      id: 'pending_' + Math.random().toString(36).substring(2, 9),
      propertyId: selectedPropId || properties[0]?.id || 'prop_1',
      propertyName: propObj?.name || 'GMR PG Branch',
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      roomNumber: roomNumber.trim(),
      rentAmount: Number(rentAmount) || 0,
      securityDeposit: Number(securityDeposit) || 0,
      presentPaid: Number(presentPaid) || 0,
      idType,
      idNumber: idNumber.trim() || (idType === 'Aadhaar' ? aadharNo : panNo),
      checkInDate: checkInDate || new Date().toISOString().split('T')[0],
      fatherName: fatherName.trim(),
      age: Number(age) || 0,
      dob,
      educationalQualification: educationalQualification.trim(),
      employment: employment.trim(),
      officeAddress: officeAddress.trim(),
      permanentAddress: permanentAddress.trim(),
      familyContactNumber: familyContactNumber.trim(),
      aadharNo: aadharNo.trim() || (idType === 'Aadhaar' ? idNumber.trim() : ''),
      panNo: panNo.trim() || (idType === 'PAN' ? idNumber.trim() : ''),
      submittedAt: new Date().toISOString(),
      status: 'Pending'
    };

    await savePendingRegistrationInDb(registration);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950 text-neutral-100 flex flex-col items-center justify-start sm:justify-center px-3 py-4 sm:p-6 select-none font-sans">
      
      {/* Container Card */}
      <div className="w-full max-w-2xl bg-neutral-900/95 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl my-2 sm:my-6">
        
        {/* Header Branding & Language Switcher */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 bg-neutral-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-emerald-500/30">
              <img src="/logo-transparent.png" alt="GMR Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base sm:text-lg tracking-wide">
                {t('appName')}
              </h1>
              <p className="text-[11px] sm:text-xs text-emerald-300 font-bold tracking-wider font-script">
                {t('tagline')}
              </p>
            </div>
          </div>

          <LanguageToggle variant="full" />
        </div>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-12 text-center space-y-5"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {t('formSubmittedTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                {t('formSubmittedSub')}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-2xl text-xs text-neutral-400 font-mono inline-block">
              Status: <span className="text-amber-400 font-bold">Pending Manager Verification</span>
            </div>

            {onFinish && (
              <div className="pt-2">
                <button
                  onClick={onFinish}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Close Form
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-7 space-y-5">
            
            <div className="space-y-1 pb-3 border-b border-neutral-800/80">
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t('selfRegTitle')}</span>
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t('selfRegSub')}
              </p>
            </div>

            {/* PG Branch Selection */}
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('selectProperty')}</span>
              </label>
              <select
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                className="w-full bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-3 border border-neutral-700 focus:outline-none focus:border-emerald-400 cursor-pointer min-h-[46px]"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    🏢 {p.name} ({p.code}) - {p.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Resident Personal Information */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 shrink-0" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('activeResidents')} (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('contact')} (Mobile Phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('fatherName')}
                  </label>
                  <input
                    type="text"
                    placeholder="Father Name"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="rahul@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('ageLabel')}
                  </label>
                  <input
                    type="number"
                    placeholder="24"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('dobLabel')}
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('familyContact')}
                  </label>
                  <input
                    type="tel"
                    placeholder="Emergency Contact"
                    value={familyContactNumber}
                    onChange={(e) => setFamilyContactNumber(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Room & Rent Details */}
            <div className="space-y-3 pt-2 border-t border-neutral-800/60">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-4 h-4 shrink-0" />
                <span>Room & Stay Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('roomNo')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 102"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 font-mono font-bold min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('rentAmount')} (₹/mo)
                  </label>
                  <input
                    type="number"
                    placeholder="8500"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    {t('depositAmount')} Paid (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="3000"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                  {t('joiningDate')}
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 min-h-[44px]"
                />
              </div>
            </div>

            {/* ID Proof & Address Information */}
            <div className="space-y-3 pt-2 border-t border-neutral-800/60">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>ID Proof & Address Verification</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    ID Proof Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as IDType)}
                    className="w-full bg-neutral-800 text-white text-xs sm:text-sm rounded-xl px-3.5 py-3 border border-neutral-700 focus:outline-none focus:border-emerald-400 cursor-pointer min-h-[44px]"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Other">Other ID</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                    ID Proof Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter ID Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-neutral-400 block mb-1">
                  {t('permanentAddressLabel')}
                </label>
                <textarea
                  rows={2}
                  placeholder="H.No, Street, Village/City, State, Pincode"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-neutral-950 font-black text-sm hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 min-h-[48px]"
            >
              <Send className="w-4.5 h-4.5 text-neutral-950" />
              <span>{isSubmitting ? 'Submitting Application...' : t('submitForm')}</span>
            </button>
          </form>
        )}
      </div>

      <div className="text-[10px] text-neutral-500 font-semibold text-center mt-2 pb-4">
        <p>© {new Date().getFullYear()} GMR Luxury Co-Living PG • Secure Self-Registration Portal</p>
      </div>
    </div>
  );
}
