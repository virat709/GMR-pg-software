import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  FileText, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  X, 
  User,
  Plus,
  AlertCircle,
  Printer,
  BookOpen,
  Briefcase,
  Home,
  FileCheck,
  Building,
  MessageCircle,
  Lock,
  UserCheck
} from 'lucide-react';
import { Tenant, PaymentLog, IDType, Property, UserRole } from '../types';
import { triggerWhatsAppMessage, getAdmissionTemplate } from '../utils/whatsapp';

interface TenantDirectoryProps {
  userRole?: UserRole | null;
  tenants: Tenant[];
  payments: PaymentLog[];
  properties?: Property[];
  selectedPropertyId?: string;
  onAddTenant: (tenant: Omit<Tenant, 'id'>) => void;
  onEditTenant: (tenant: Tenant) => void;
  onCheckOutTenant: (tenantId: string) => void;
  selectedTenantId: string | null;
  onSelectTenant: (tenantId: string | null) => void;
}

export default function TenantDirectory({
  userRole = 'super_admin',
  tenants,
  payments,
  properties = [],
  selectedPropertyId = 'all',
  onAddTenant,
  onEditTenant,
  onCheckOutTenant,
  selectedTenantId,
  onSelectTenant
}: TenantDirectoryProps) {
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'CheckedOut'>('Active');
  
  // State for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Form State
  const [propertyId, setPropertyId] = useState<string>('prop_1');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [rentAmount, setRentAmount] = useState<number>(8000);
  const [securityDeposit, setSecurityDeposit] = useState<number>(15000);
  const [presentPaid, setPresentPaid] = useState<number>(15000);
  const [idType, setIdType] = useState<IDType>('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Custom GMR admission fields
  const [fatherName, setFatherName] = useState('');
  const [age, setAge] = useState<number>(22);
  const [dob, setDob] = useState('');
  const [educationalQualification, setEducationalQualification] = useState('');

  // Helper to calculate age from DOB string (YYYY-MM-DD)
  const calculateAgeFromDob = (dobString: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge >= 0 ? calculatedAge : 0;
  };

  const handleDobChange = (dobValue: string) => {
    setDob(dobValue);
    const computedAge = calculateAgeFromDob(dobValue);
    if (computedAge !== null) {
      setAge(computedAge);
    }
  };
  const [employment, setEmployment] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [familyContactNumber, setFamilyContactNumber] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingTenant(null);
    setPropertyId(selectedPropertyId === 'all' || !selectedPropertyId ? (properties[0]?.id || 'prop_1') : selectedPropertyId);
    setName('');
    setPhone('');
    setEmail('');
    setRoomNumber('');
    setRentAmount(8000);
    setSecurityDeposit(15000);
    setPresentPaid(15000);
    setIdType('Aadhaar');
    setIdNumber('');
    setCheckInDate(new Date().toISOString().split('T')[0]);
    
    // GMR Specific
    setFatherName('');
    setAge(22);
    setDob('');
    setEducationalQualification('');
    setEmployment('');
    setOfficeAddress('');
    setPermanentAddress('');
    setFamilyContactNumber('');
    setAadharNo('');
    setPanNo('');
    setRulesAccepted(false);
    
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting row
    setEditingTenant(tenant);
    setPropertyId(tenant.propertyId || 'prop_1');
    setName(tenant.name);
    setPhone(tenant.phone);
    setEmail(tenant.email);
    setRoomNumber(tenant.roomNumber);
    setRentAmount(tenant.rentAmount);
    setSecurityDeposit(tenant.securityDeposit);
    setPresentPaid(tenant.presentPaid || tenant.securityDeposit);
    setIdType(tenant.idType);
    setIdNumber(tenant.idNumber);
    setCheckInDate(tenant.checkInDate);
    
    // GMR Specific
    setFatherName(tenant.fatherName || '');
    const initialDob = tenant.dob || '';
    setDob(initialDob);
    const computedAge = calculateAgeFromDob(initialDob);
    setAge(computedAge !== null ? computedAge : (tenant.age || 22));
    setEducationalQualification(tenant.educationalQualification || '');
    setEmployment(tenant.employment || '');
    setOfficeAddress(tenant.officeAddress || '');
    setPermanentAddress(tenant.permanentAddress || '');
    setFamilyContactNumber(tenant.familyContactNumber || '');
    setAadharNo(tenant.aadharNo || '');
    setPanNo(tenant.panNo || '');
    setRulesAccepted(true); // default true for already registered
    
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !roomNumber || !idNumber) {
      alert('Please fill out all required fields.');
      return;
    }
    if (!rulesAccepted && !editingTenant) {
      alert('The resident must accept the GMR PG Rules and Regulations to complete registration.');
      return;
    }

    if (editingTenant) {
      onEditTenant({
        ...editingTenant,
        propertyId,
        name,
        phone,
        email,
        roomNumber,
        rentAmount: Number(rentAmount),
        securityDeposit: Number(securityDeposit),
        presentPaid: Number(presentPaid),
        idType,
        idNumber,
        checkInDate,
        fatherName,
        age: Number(age),
        dob,
        educationalQualification,
        employment,
        officeAddress,
        permanentAddress,
        familyContactNumber,
        aadharNo,
        panNo,
      });
    } else {
      onAddTenant({
        propertyId,
        name,
        phone,
        email,
        roomNumber,
        rentAmount: Number(rentAmount),
        securityDeposit: Number(securityDeposit),
        presentPaid: Number(presentPaid),
        idType,
        idNumber,
        checkInDate,
        checkOutDate: null,
        status: 'Active',
        fatherName,
        age: Number(age),
        dob,
        educationalQualification,
        employment,
        officeAddress,
        permanentAddress,
        familyContactNumber,
        aadharNo,
        panNo,
      });
    }
    setIsModalOpen(false);
  };

  // Filter tenants
  const filteredTenants = tenants.filter(t => {
    const matchesProperty = !selectedPropertyId || selectedPropertyId === 'all' || t.propertyId === selectedPropertyId;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesProperty && matchesSearch && matchesStatus;
  });

  // Selected Tenant Details
  const currentTenant = tenants.find(t => t.id === selectedTenantId);
  
  // Selected Tenant Payment logs
  const currentTenantPayments = payments
    .filter(p => p.tenantId === selectedTenantId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="tenant-directory-container">
      
      {/* Left Column: Tenant list and search (8 cols or full if no selection) */}
      <div className={`${selectedTenantId ? 'hidden lg:block lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
        
        {/* Search, Filter, and Action Bar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by name, room number, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-500 bg-neutral-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <div className="inline-flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600">
              <button 
                onClick={() => setStatusFilter('Active')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${statusFilter === 'Active' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setStatusFilter('CheckedOut')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${statusFilter === 'CheckedOut' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'}`}
              >
                Left
              </button>
              <button 
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${statusFilter === 'All' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'}`}
              >
                All
              </button>
            </div>

            {/* Add Tenant Button */}
            <button
              onClick={handleOpenAdd}
              className="bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              id="add-tenant-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Tenant</span>
            </button>
          </div>
        </div>

        {/* Tenants List */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Rent Cycle</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-neutral-400">
                      No tenants found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr 
                      key={tenant.id}
                      onClick={() => onSelectTenant(tenant.id)}
                      className={`hover:bg-neutral-50/70 transition-colors cursor-pointer ${selectedTenantId === tenant.id ? 'bg-neutral-50 font-medium' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-sm">
                            {tenant.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900">{tenant.name}</p>
                            <p className="text-xs text-neutral-400">{tenant.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md font-mono text-xs font-semibold text-neutral-700">
                          {tenant.roomNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        ₹{tenant.rentAmount.toLocaleString('en-IN')}/mo
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 font-mono text-xs">
                        {tenant.checkInDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          tenant.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }`}>
                          {tenant.status === 'Active' ? 'Active' : 'Checked Out'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {tenant.status === 'Active' && (
                            <button
                              onClick={() => {
                                const checkInMsg = `Hello, *${tenant.name}*! Just checking in to see if everything is comfortable with your stay in *Room ${tenant.roomNumber}* at *GMR Luxury PG*. Please let us know if you need any assistance or maintenance. We are here to make you feel like home! 🏠✨\n\nRegards,\n*GMR Co-Living Management*`;
                                triggerWhatsAppMessage(tenant.phone, checkInMsg);
                              }}
                              className="p-1.5 hover:bg-emerald-50 rounded-md text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Send quick check-in message on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleOpenEdit(tenant, e)}
                            className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                            title="Edit details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {tenant.status === 'Active' && (
                            userRole === 'super_admin' ? (
                              <button
                                onClick={() => onCheckOutTenant(tenant.id)}
                                className="p-1.5 hover:bg-red-50 rounded-md text-neutral-500 hover:text-red-600 transition-colors cursor-pointer"
                                title="Check out Resident (Super Access)"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => alert('Action Restricted! Resident checkout requires Super Admin PIN (1234).')}
                                className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-300 transition-colors cursor-not-allowed"
                                title="Checkout Restricted (Super Access Required)"
                              >
                                <Lock className="w-4 h-4 text-neutral-400" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Complete Tenant profile details / checks logs (5 cols) */}
      {selectedTenantId && currentTenant && (
        <div className="lg:col-span-5" id="tenant-details-panel">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full sticky top-0"
          >
            {/* Detail Header */}
            <div className="bg-neutral-50 p-5 border-b border-neutral-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Back button visible only on mobile (lg:hidden) */}
                <button 
                  onClick={() => onSelectTenant(null)}
                  className="lg:hidden p-1.5 bg-neutral-200/60 hover:bg-neutral-200 text-neutral-700 rounded-xl cursor-pointer transition-all mr-1"
                  title="Back to list"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-700 font-extrabold text-lg shadow-xs shrink-0">
                  {currentTenant.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">{currentTenant.name}</h2>
                  <span className="text-[10px] font-mono bg-white border border-neutral-200 px-2 py-0.5 rounded-md font-semibold text-neutral-600 block w-max mt-1">
                    Room {currentTenant.roomNumber}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => onSelectTenant(null)}
                className="hidden lg:block p-1 hover:bg-neutral-200 rounded-lg text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Fields */}
            <div className="p-5 space-y-6 overflow-y-auto max-h-[580px] flex-1">
              
              {/* Personal Details */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Personal Coordinates</span>
                </h3>
                
                <div className="grid grid-cols-1 gap-3 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/50 text-xs">
                  <div>
                    <p className="text-[10px] text-neutral-400 font-medium">Father's Name</p>
                    <p className="font-semibold text-neutral-800">{currentTenant.fatherName || 'Not filled'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-medium">Date of Birth</p>
                      <p className="font-semibold text-neutral-800 font-mono">{currentTenant.dob || 'Not filled'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-medium">Age</p>
                      <p className="font-semibold text-neutral-800">{currentTenant.age ? `${currentTenant.age} Yrs` : 'Not filled'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-medium">Qualification</p>
                      <p className="font-semibold text-neutral-800">{currentTenant.educationalQualification || 'Not filled'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-medium">Occupation</p>
                      <p className="font-semibold text-neutral-800">{currentTenant.employment || 'Not filled'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Verification IDs */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verification Credentials</span>
                </h3>
                
                <div className="grid grid-cols-1 gap-3 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/50 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Primary ID ({currentTenant.idType}):</span>
                    <span className="font-bold text-neutral-800">{currentTenant.idNumber}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-100 pt-2">
                    <span className="text-neutral-400">Aadhaar Document:</span>
                    <span className="font-bold text-neutral-800">{currentTenant.aadharNo || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-100 pt-2">
                    <span className="text-neutral-400">PAN Document:</span>
                    <span className="font-bold text-neutral-800 uppercase">{currentTenant.panNo || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Stay Setup & Fees */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>Stay & Financial Metrics</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl">
                    <span className="text-[9px] text-neutral-400 block font-bold uppercase">Monthly Rent</span>
                    <span className="text-sm font-bold text-neutral-800">₹{currentTenant.rentAmount.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl">
                    <span className="text-[9px] text-neutral-400 block font-bold uppercase">Deposit/Advance</span>
                    <span className="text-sm font-bold text-neutral-800">₹{currentTenant.securityDeposit.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <span className="text-[9px] text-emerald-600 block font-bold uppercase">Present Paid</span>
                    <span className="text-sm font-bold text-emerald-800">₹{(currentTenant.presentPaid || currentTenant.securityDeposit).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-200/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-[9px] text-neutral-400">Joined Date</p>
                      <p className="font-bold text-neutral-700 font-mono">{currentTenant.checkInDate}</p>
                    </div>
                  </div>

                  {currentTenant.checkOutDate ? (
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-[9px] text-red-400">Checkout Date</p>
                        <p className="font-bold text-red-700 font-mono">{currentTenant.checkOutDate}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-[9px] text-emerald-500">GMR Terms Accepted</p>
                        <p className="font-bold text-emerald-700">Yes (21 Rules)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information & Native Addresses */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Contact Details & Addresses</span>
                </h3>

                <div className="grid grid-cols-1 gap-3 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/50 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-medium">Personal Mobile</p>
                      <p className="font-bold text-neutral-800">{currentTenant.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-medium">Family Emergency No</p>
                      <p className="font-bold text-neutral-800">{currentTenant.familyContactNumber || 'Not filled'}</p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-2">
                    <p className="text-[10px] text-neutral-400 font-medium">Email Address</p>
                    <p className="font-bold text-neutral-800">{currentTenant.email || 'No email registered'}</p>
                  </div>

                  <div className="border-t border-neutral-100 pt-2">
                    <p className="text-[10px] text-neutral-400 font-medium">Office / Work Address</p>
                    <p className="font-medium text-neutral-700 leading-relaxed italic">{currentTenant.officeAddress || 'Not filled'}</p>
                  </div>

                  <div className="border-t border-neutral-100 pt-2">
                    <p className="text-[10px] text-neutral-400 font-medium">Permanent Home Address</p>
                    <p className="font-medium text-neutral-700 leading-relaxed italic">{currentTenant.permanentAddress || 'Not filled'}</p>
                  </div>
                </div>
              </div>

              {/* Payment History Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Payment History Logs</h3>
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {currentTenantPayments.length} Payments
                  </span>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {currentTenantPayments.length === 0 ? (
                    <div className="text-center py-5 border border-dashed border-neutral-200 rounded-xl text-neutral-400 text-[11px]">
                      No payment records found for this tenant.
                    </div>
                  ) : (
                    currentTenantPayments.map((pay) => (
                      <div 
                        key={pay.id}
                        className="p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-neutral-800">₹{pay.amount.toLocaleString('en-IN')}</p>
                          <div className="flex items-center gap-2 text-[9px] text-neutral-500">
                            <span>Month: <b>{pay.billingMonth}</b></span>
                            <span>•</span>
                            <span className="font-mono">{pay.paymentDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-white border border-neutral-200 text-neutral-600 text-[9px] px-1.5 py-0.5 rounded font-medium">
                            {pay.paymentMode}
                          </span>
                          <p className="text-[8px] text-neutral-400 font-mono mt-0.5 overflow-hidden max-w-[90px] truncate">{pay.referenceId}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Profile Action Footer: Print and Share official registration slip */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center gap-2">
              <button
                onClick={() => setIsSlipModalOpen(true)}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Admission Slip</span>
              </button>
              <button
                onClick={() => {
                  const text = getAdmissionTemplate({
                    tenantName: currentTenant.name,
                    roomNumber: currentTenant.roomNumber,
                    checkInDate: currentTenant.checkInDate,
                    rentAmount: currentTenant.rentAmount,
                    securityDeposit: currentTenant.securityDeposit,
                    presentPaid: currentTenant.presentPaid || currentTenant.securityDeposit
                  });
                  triggerWhatsAppMessage(currentTenant.phone, text);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>
            </div>

          </motion.div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-neutral-800" />
                  <span>{editingTenant ? 'Edit PG Admission Record' : 'Admission Form for PG Accommodation'}</span>
                </h3>
                <p className="text-xs text-neutral-400">Fill all GMR Admission Details and acknowledge terms to complete stay setup.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-neutral-200 rounded-lg text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
 
            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              
              {/* SECTION 1: Personal Profile */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                  <User className="w-3.5 h-3.5" />
                  <span>Personal Details</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sameer Kapoor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Father's Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ramesh Chandra Kapoor"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date of Birth *</label>
                    <input 
                      type="date" 
                      required
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Age *</label>
                    <input 
                      type="number" 
                      required
                      min={15}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Educational Qualification</label>
                    <input 
                      type="text" 
                      placeholder="e.g. B.Tech Computer Science"
                      value={educationalQualification}
                      onChange={(e) => setEducationalQualification(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Employment / Occupation</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Software Engineer, Student, Intern"
                    value={employment}
                    onChange={(e) => setEmployment(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                  />
                </div>
              </div>

              {/* SECTION 2: Contact Gateways */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact Information & Addresses</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Personal Mobile *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. +91 98989 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Family Contact No *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Emergency contact"
                      value={familyContactNumber}
                      onChange={(e) => setFamilyContactNumber(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Personal Email</label>
                    <input 
                      type="email" 
                      placeholder="e.g. sameer@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Office / College Address</label>
                    <textarea 
                      placeholder="Provide full work or college coordinates"
                      rows={2}
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Permanent Home Address *</label>
                    <textarea 
                      required
                      placeholder="Provide full native home coordinates"
                      rows={2}
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Allocation, Financials & Government ID verification */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                  <Building className="w-3.5 h-3.5" />
                  <span>Allocation, Financials & IDs</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Room Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 104-B"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-bold text-center bg-neutral-50/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Monthly Rent (₹) *</label>
                    <input 
                      type="number" 
                      required
                      value={rentAmount}
                      onChange={(e) => setRentAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Advance/Deposit (₹) *</label>
                    <input 
                      type="number" 
                      required
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Present Paid (₹) *</label>
                    <input 
                      type="number" 
                      required
                      value={presentPaid}
                      onChange={(e) => setPresentPaid(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50 text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Primary Verification ID Document *</label>
                    <div className="flex gap-2">
                      <select
                        value={idType}
                        onChange={(e) => setIdType(e.target.value as IDType)}
                        className="px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-neutral-50/50 select-none shrink-0"
                      >
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="PAN">PAN Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Other">Other ID</option>
                      </select>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter selected ID Number"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-xs font-mono tracking-wider bg-neutral-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Aadhaar No *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="12 digit Aadhaar"
                        value={aadharNo}
                        onChange={(e) => setAadharNo(e.target.value)}
                        className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-xs font-mono bg-neutral-50/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">PAN No *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="10 digit PAN"
                        value={panNo}
                        onChange={(e) => setPanNo(e.target.value)}
                        className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-xs font-mono uppercase bg-neutral-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Check-In / Joining Date *</label>
                  <input 
                    type="date" 
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 font-mono"
                  />
                </div>
              </div>

              {/* SECTION 4: GMR PG rules agreement list */}
              <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-200">
                  <BookOpen className="w-4 h-4 text-neutral-700" />
                  <span>Terms & Conditions - GMR PG Rules</span>
                </h4>
                
                <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold">
                  Please review the complete rules and regulations of PG accommodation below. The resident must acknowledge and accept these terms to bind the rental admission.
                </p>

                <div className="bg-white border border-neutral-200 rounded-xl p-3 max-h-[140px] overflow-y-auto space-y-2 text-[11px] text-neutral-600 leading-relaxed font-sans scrollbar-thin">
                  <p><b>1. Notice Period:</b> One month prior notice must be given in writing before checking out. Partial months are billed in full.</p>
                  <p><b>2. Lock-in Period:</b> Minimum lock-in period of stay is three (3) months. Early departure forfeits the security deposit.</p>
                  <p><b>3. Monthly Rent:</b> Rent must be paid in advance on or before the 5th of every calendar month.</p>
                  <p><b>4. Late Fees:</b> Rent received after the 5th of the month will attract a late payment charge of ₹100/- per day.</p>
                  <p><b>5. Security Deposit:</b> The refundable security deposit/advance is an independent safety collateral and cannot be adjusted against any monthly rent.</p>
                  <p><b>6. Refund Process:</b> Security deposit refunds are processed via bank transfer within 15 working days after successful checkout inspection.</p>
                  <p><b>7. Gate Timings:</b> Main PG outer doors will be locked at 11:30 PM for general safety. Late entries require prior clearance from the warden.</p>
                  <p><b>8. Guest Restrictions:</b> Female guests are strictly not allowed inside male rooms/PGs and vice-versa at any time due to safety protocols.</p>
                  <p><b>9. Overnight Stay:</b> Prior written approval and guest fee are required for any family guest overnight stays (maximum of 2 days).</p>
                  <p><b>10. Prohibited Substances:</b> Consumption, storage, or possession of alcohol, cigarettes, or drugs on premises is strictly prohibited and leads to immediate expulsion.</p>
                  <p><b>11. Property Damages:</b> Any damage to PG assets, walls, paint, electrical points, or appliances will be deducted directly from the security deposit.</p>
                  <p><b>12. Electrical Appliances:</b> Use of heavy-draw power appliances (personal room ACs, room heaters, electric stoves, electric kettles) inside rooms is strictly forbidden.</p>
                  <p><b>13. Room Cleanliness:</b> Residents must maintain absolute cleanliness inside rooms and toilets. Daily wet-mop is conducted by our cleaners.</p>
                  <p><b>14. Food Policy:</b> Self-cooking or bringing high-smell cooked items into shared dormitories is restricted. Mess kitchen timings must be respected.</p>
                  <p><b>15. Quiet Hours:</b> Quiet hours are strictly enforced from 10:30 PM to 7:00 AM. Loud music or phone speakers in public spots are prohibited.</p>
                  <p><b>16. Valuables Security:</b> Residents must keep wardrobes locked. Management holds no responsibility for lost gadgets, laptops, cash, or valuables.</p>
                  <p><b>17. Key Duplication:</b> Duplication of room keys is forbidden. Lost keys must be replaced at the resident's expense (₹500 for heavy latch).</p>
                  <p><b>18. Warden Authority:</b> Warden and PG landlord hold full authority on security discipline, room shifting, or eviction for misconduct.</p>
                  <p><b>19. Water & Electricity:</b> Wastage of water or leaving room lights, geysers, and fans switched on when room is vacant will attract penalties.</p>
                  <p><b>20. ID Registration:</b> Submission of copy of Aadhaar, PAN card, and the local Police verification form is mandatory before check-in.</p>
                  <p><b>21. Right of Entry:</b> The landlord reserves the right to inspect any room for structural maintenance or emergency checks with basic notice.</p>
                </div>

                <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    required={!editingTenant}
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900 shrink-0"
                  />
                  <span className="text-xs font-bold text-neutral-800 leading-tight">
                    I acknowledge that the resident has read, understood, and signed the copy agreeing to follow these 21 Rules and Regulations of PG Accommodation. *
                  </span>
                </label>
              </div>

              {/* Submit panel */}
              <div className="border-t border-neutral-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{editingTenant ? 'Save Changes' : 'Admit Resident'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* GMR PG Official Admission Slip Modal */}
      {isSlipModalOpen && currentTenant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-3xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
          >
            {/* Modal Actions Header - Hidden on physical print */}
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between shrink-0 print:hidden">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">GMR Admission Slip Preview</h3>
                <p className="text-[10px] text-neutral-400">Review paper draft. Click Print to output to printer or save to PDF.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = getAdmissionTemplate({
                      tenantName: currentTenant.name,
                      roomNumber: currentTenant.roomNumber,
                      checkInDate: currentTenant.checkInDate,
                      rentAmount: currentTenant.rentAmount,
                      securityDeposit: currentTenant.securityDeposit,
                      presentPaid: currentTenant.presentPaid || currentTenant.securityDeposit
                    });
                    triggerWhatsAppMessage(currentTenant.phone, text);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsSlipModalOpen(false)}
                  className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Paper Sheet (This element has id="print-area") */}
            <div 
              id="print-area" 
              className="p-8 md:p-12 overflow-y-auto flex-1 bg-white font-sans text-neutral-800 leading-relaxed text-xs print:p-0 print:overflow-visible print:max-h-none"
            >
              {/* Paper Header */}
              <div className="text-center space-y-2 border-b-2 border-neutral-900 pb-5">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <svg viewBox="0 0 100 100" className="w-8 h-8 text-[#0b75c8]" fill="currentColor">
                    <path d="M50,15 C47,30 47,45 50,60 C53,45 53,30 50,15 Z" />
                    <path d="M50,20 C42,32 40,46 45,58 C49,48 49,34 50,20 Z" />
                    <path d="M50,20 C58,32 60,46 55,58 C51,48 51,34 50,20 Z" />
                    <path d="M50,25 C34,35 32,50 40,62 C45,52 47,40 50,25 Z" />
                    <path d="M50,25 C66,35 68,50 60,62 C55,52 53,40 50,25 Z" />
                    <path d="M50,33 C26,42 25,58 35,66 C40,58 44,48 50,33 Z" />
                    <path d="M50,33 C74,42 75,58 65,66 C60,58 56,48 50,33 Z" />
                    <path d="M22,70 C40,55 60,80 78,65 C60,74 40,60 22,70 Z" />
                    <path d="M18,78 C38,62 62,88 82,72 C62,81 38,67 18,78 Z" />
                  </svg>
                  <h1 className="text-2xl font-black text-neutral-900 tracking-wider font-serif">GMR Luxury Co-Living PG</h1>
                </div>
                <p className="text-[11px] text-[#0b75c8] font-extrabold uppercase tracking-widest">Feels Like Home</p>
                <p className="text-[10px] text-neutral-500 font-medium">#7 Akash Nagar Main Road, A Narayanapura, Mahadevapura, Bengaluru - 560093</p>
                <p className="text-[9px] text-neutral-400 font-mono">Ph: +91 99515 13796 / +91 70360 19865 | Email: nagendranagiii955@gmail.com</p>
              </div>

              {/* Title */}
              <div className="my-6 text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-800 border-y border-neutral-200 py-1.5 bg-neutral-50 inline-block px-8">
                  PG Accommodation Admission Form & Agreement
                </h2>
              </div>

              {/* Grid 1: Personal Details */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-neutral-900 uppercase border-b border-neutral-200 pb-1 tracking-wider">
                  1. Personal Profile
                </h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px]">
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Resident Name</span>
                    <span className="text-neutral-800 font-semibold col-span-2">: {currentTenant.name}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Father's Name</span>
                    <span className="text-neutral-800 font-semibold col-span-2">: {currentTenant.fatherName || '__________________'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Date of Birth</span>
                    <span className="text-neutral-800 col-span-2">: {currentTenant.dob || '__________________'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Age</span>
                    <span className="text-neutral-800 col-span-2">: {currentTenant.age ? `${currentTenant.age} Years` : '______'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Qualification</span>
                    <span className="text-neutral-800 col-span-2">: {currentTenant.educationalQualification || '__________________'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Occupation</span>
                    <span className="text-neutral-800 col-span-2">: {currentTenant.employment || '__________________'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Contacts & Addresses */}
              <div className="space-y-4 mt-6">
                <h3 className="text-[11px] font-bold text-neutral-900 uppercase border-b border-neutral-200 pb-1 tracking-wider">
                  2. Contact & Native Addresses
                </h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px]">
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Mobile No</span>
                    <span className="text-neutral-800 font-semibold col-span-2">: {currentTenant.phone}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Family Contact</span>
                    <span className="text-neutral-800 font-semibold col-span-2">: {currentTenant.familyContactNumber || '__________________'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5 col-span-2">
                    <span className="font-bold text-neutral-500 col-span-1">Email Address</span>
                    <span className="text-neutral-800 col-span-2">: {currentTenant.email || '____________________________________'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5 col-span-2">
                    <span className="font-bold text-neutral-500 col-span-1">Office / College Address</span>
                    <span className="text-neutral-800 col-span-2 italic">: {currentTenant.officeAddress || '____________________________________'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5 col-span-2">
                    <span className="font-bold text-neutral-500 col-span-1">Permanent Home Address</span>
                    <span className="text-neutral-800 col-span-2 italic">: {currentTenant.permanentAddress || '____________________________________'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 3: Booking & Fees */}
              <div className="space-y-4 mt-6">
                <h3 className="text-[11px] font-bold text-neutral-900 uppercase border-b border-neutral-200 pb-1 tracking-wider">
                  3. Booking Parameters & Financials
                </h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px]">
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Room No</span>
                    <span className="text-neutral-800 font-bold col-span-2">: Room {currentTenant.roomNumber}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Monthly Rent</span>
                    <span className="text-neutral-800 font-bold col-span-2">: ₹{currentTenant.rentAmount.toLocaleString('en-IN')}/-</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Security Advance</span>
                    <span className="text-neutral-800 font-bold col-span-2">: ₹{currentTenant.securityDeposit.toLocaleString('en-IN')}/-</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Present Paid</span>
                    <span className="text-emerald-700 font-bold col-span-2">: ₹{(currentTenant.presentPaid || currentTenant.securityDeposit).toLocaleString('en-IN')}/-</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Check-In Date</span>
                    <span className="text-neutral-800 font-bold font-mono col-span-2">: {currentTenant.checkInDate}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-neutral-100 pb-1.5">
                    <span className="font-bold text-neutral-500 col-span-1">Status</span>
                    <span className="text-neutral-800 font-bold uppercase col-span-2">: {currentTenant.status}</span>
                  </div>
                </div>
              </div>

              {/* Grid 4: Government Verification IDs */}
              <div className="space-y-4 mt-6">
                <h3 className="text-[11px] font-bold text-neutral-900 uppercase border-b border-neutral-200 pb-1 tracking-wider">
                  4. Government Verification IDs
                </h3>
                <div className="grid grid-cols-3 gap-4 text-[11px]">
                  <div className="border border-neutral-200 p-2.5 rounded-lg text-center bg-neutral-50/50">
                    <p className="text-[9px] text-neutral-400 uppercase font-bold">Primary verification ({currentTenant.idType})</p>
                    <p className="font-bold text-neutral-800 font-mono mt-1 tracking-wider">{currentTenant.idNumber}</p>
                  </div>
                  <div className="border border-neutral-200 p-2.5 rounded-lg text-center bg-neutral-50/50">
                    <p className="text-[9px] text-neutral-400 uppercase font-bold">Aadhaar Number</p>
                    <p className="font-bold text-neutral-800 font-mono mt-1 tracking-wider">{currentTenant.aadharNo || '__________________'}</p>
                  </div>
                  <div className="border border-neutral-200 p-2.5 rounded-lg text-center bg-neutral-50/50">
                    <p className="text-[9px] text-neutral-400 uppercase font-bold">PAN Number</p>
                    <p className="font-bold text-neutral-800 font-mono mt-1 uppercase tracking-wider">{currentTenant.panNo || '__________________'}</p>
                  </div>
                </div>
              </div>

              {/* Rules Undertaking */}
              <div className="mt-8 p-4 border border-neutral-300 rounded-xl space-y-3 bg-neutral-50/30">
                <h4 className="text-[10px] font-extrabold uppercase text-neutral-900 tracking-wider">
                  5. Rules Undertaking & Acceptance
                </h4>
                <p className="text-[10px] text-neutral-600 leading-relaxed text-justify">
                  I, <b>{currentTenant.name}</b>, hereby declare that the details provided in this admission form are absolute, true, and complete. I confirm that I have read, understood, and accept all <b>21 Rules & Regulations of GMR PG Accommodation</b>. I acknowledge that I am bound to serve a <b>1-month prior checkout notice</b>, pay rent by the <b>5th of each month</b>, strictly adhere to the <b>11:30 PM gate curfew</b>, and maintain peace and cleanliness on premises. I accept that the management retains the right to evict me instantly in case of property damages or code breaches.
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="mt-16 grid grid-cols-2 gap-12 text-[11px] pt-4">
                <div className="space-y-1 text-center">
                  <div className="border-b border-neutral-400 w-48 mx-auto h-8"></div>
                  <p className="font-bold text-neutral-800">Signature of Resident</p>
                  <p className="text-[9px] text-neutral-400 font-mono">{currentTenant.name}</p>
                </div>
                
                <div className="space-y-1 text-center relative">
                  {/* Faded Approved Seal Stamp Graphic */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-emerald-600/20 flex items-center justify-center rotate-12 pointer-events-none select-none">
                    <div className="text-center text-[10px] text-emerald-600/30 font-black uppercase tracking-wider">
                      <span>GMR HOMES</span>
                      <span className="block text-[8px] tracking-normal font-bold">APPROVED</span>
                    </div>
                  </div>
                  
                  <div className="border-b border-neutral-400 w-48 mx-auto h-8"></div>
                  <p className="font-bold text-neutral-800">For GMR Co-Living Spaces</p>
                  <p className="text-[9px] text-neutral-400">Authorized Signatory & Seal</p>
                </div>
              </div>

              {/* Second Page: Full list of 21 rules to physically sign and attach */}
              <div className="mt-20 border-t border-dashed border-neutral-300 pt-10 page-break-before space-y-4">
                <div className="text-center pb-2 border-b border-neutral-200">
                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">ANNEXURE - RULES & CODE OF CONDUCT (21 MANDATORY RULES)</h4>
                  <p className="text-[9px] text-neutral-400">To be signed by the resident and retained as safety agreement collateral.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-[9.5px] text-neutral-600 leading-normal">
                  <p><b>1. Notice Period:</b> One month prior notice must be given in writing before checking out. Partial months are billed in full.</p>
                  <p><b>2. Lock-in Period:</b> Minimum lock-in period of stay is three (3) months. Early departure forfeits the security deposit.</p>
                  <p><b>3. Monthly Rent:</b> Rent must be paid in advance on or before the 5th of every calendar month.</p>
                  <p><b>4. Late Fees:</b> Rent received after the 5th of the month will attract a late payment charge of ₹100/- per day.</p>
                  <p><b>5. Security Deposit:</b> The refundable security deposit/advance is an independent safety collateral and cannot be adjusted against any monthly rent.</p>
                  <p><b>6. Refund Process:</b> Security deposit refunds are processed via bank transfer within 15 working days after successful checkout inspection.</p>
                  <p><b>7. Gate Timings:</b> Main PG outer doors will be locked at 11:30 PM for general safety. Late entries require prior clearance from the warden.</p>
                  <p><b>8. Guest Restrictions:</b> Female guests are strictly not allowed inside male rooms/PGs and vice-versa at any time due to safety protocols.</p>
                  <p><b>9. Overnight Stay:</b> Prior written approval and guest fee are required for any family guest overnight stays (maximum of 2 days).</p>
                  <p><b>10. Prohibited Substances:</b> Consumption, storage, or possession of alcohol, cigarettes, or drugs on premises is strictly prohibited and leads to immediate expulsion.</p>
                  <p><b>11. Property Damages:</b> Any damage to PG assets, walls, paint, electrical points, or appliances will be deducted directly from the security deposit.</p>
                  <p><b>12. Electrical Appliances:</b> Use of heavy-draw power appliances (personal room ACs, room heaters, electric stoves, electric kettles) inside rooms is strictly forbidden.</p>
                  <p><b>13. Room Cleanliness:</b> Residents must maintain absolute cleanliness inside rooms and toilets. Daily wet-mop is conducted by our cleaners.</p>
                  <p><b>14. Food Policy:</b> Self-cooking or bringing high-smell cooked items into shared dormitories is restricted. Mess kitchen timings must be respected.</p>
                  <p><b>15. Quiet Hours:</b> Quiet hours are strictly enforced from 10:30 PM to 7:00 AM. Loud music or phone speakers in public spots are prohibited.</p>
                  <p><b>16. Valuables Security:</b> Residents must keep wardrobes locked. Management holds no responsibility for lost gadgets, laptops, cash, or valuables.</p>
                  <p><b>17. Key Duplication:</b> Duplication of room keys is forbidden. Lost keys must be replaced at the resident's expense (₹500 for heavy latch).</p>
                  <p><b>18. Warden Authority:</b> Warden and PG landlord hold full authority on security discipline, room shifting, or eviction for misconduct.</p>
                  <p><b>19. Water & Electricity:</b> Wastage of water or leaving room lights, geysers, and fans switched on when room is vacant will attract penalties.</p>
                  <p><b>20. ID Registration:</b> Submission of copy of Aadhaar, PAN card, and the local Police verification form is mandatory before check-in.</p>
                  <p><b>21. Right of Entry:</b> The landlord reserves the right to inspect any room for structural maintenance or emergency checks with basic notice.</p>
                </div>

                <div className="pt-8 border-t border-neutral-100 flex items-center justify-between text-[10px]">
                  <span>I agree to follow all the 21 rules mentioned above.</span>
                  <div className="flex gap-12 pt-4">
                    <span className="border-t border-neutral-400 w-36 text-center pt-1 mt-4">Resident Signature</span>
                    <span className="border-t border-neutral-400 w-36 text-center pt-1 mt-4">Date Signed</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
