import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  IndianRupee, 
  Home, 
  AlertTriangle, 
  ArrowUpRight, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Building2,
  Plus,
  X,
  MapPin,
  Phone,
  Sparkles,
  Filter,
  MessageCircle,
  Lock,
  ShieldCheck,
  UserCheck,
  FileText,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { Tenant, PaymentLog, BillingAlert, Property, PropertyType, UserRole } from '../types';
import { triggerWhatsAppMessage, getRentReminderTemplate } from '../utils/whatsapp';
import { generateRentReminderPDF } from '../utils/reminderPdfGenerator';
import PartnerStatementModal from './PartnerStatementModal';
import { useLanguage } from '../context/LanguageContext';

interface DashboardOverviewProps {
  userRole?: UserRole | null;
  properties: Property[];
  selectedPropertyId: string;
  onSelectProperty: (propertyId: string) => void;
  onAddProperty: (newProperty: Omit<Property, 'id'>) => void;
  onEditProperty?: (property: Property) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onDeletePayment?: (paymentId: string) => void;
  tenants: Tenant[];
  payments: PaymentLog[];
  billingAlerts: BillingAlert[];
  onNavigate: (tab: 'dashboard' | 'tenants' | 'billing') => void;
  onSelectTenant: (tenantId: string) => void;
  onTriggerAlert: (alert: BillingAlert) => void;
  showToast?: (msg: string, type?: 'success' | 'info') => void;
}

export default function DashboardOverview({
  userRole = 'super_admin',
  properties,
  selectedPropertyId,
  onSelectProperty,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  onDeletePayment,
  tenants,
  payments,
  billingAlerts,
  onNavigate,
  onSelectTenant,
  onTriggerAlert,
  showToast = () => {}
}: DashboardOverviewProps) {
  const { t } = useLanguage();
  // Modal for adding a new property branch
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [propName, setPropName] = useState('');
  const [propCode, setPropCode] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propCity, setPropCity] = useState('');
  const [propTotalRooms, setPropTotalRooms] = useState<number | string>('');
  const [propTotalFloors, setPropTotalFloors] = useState<number | string>('');
  const [propContact, setPropContact] = useState('');
  const [propType, setPropType] = useState<PropertyType>('Co-Living');

  // Modal for editing an existing property branch
  const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editPropName, setEditPropName] = useState('');
  const [editPropCode, setEditPropCode] = useState('');
  const [editPropAddress, setEditPropAddress] = useState('');
  const [editPropCity, setEditPropCity] = useState('');
  const [editPropTotalRooms, setEditPropTotalRooms] = useState<number | string>('');
  const [editPropTotalFloors, setEditPropTotalFloors] = useState<number | string>('');
  const [editPropContact, setEditPropContact] = useState('');
  const [editPropType, setEditPropType] = useState<PropertyType>('Co-Living');

  // Currently selected property object (null if 'all')
  const activeProperty = properties.find(p => p.id === selectedPropertyId) || null;

  // Filter tenants by selected property and valid properties
  const validPropertyIds = new Set(properties.map(p => p.id));
  const filteredTenants = selectedPropertyId === 'all' 
    ? tenants.filter(t => properties.length === 0 || validPropertyIds.has(t.propertyId))
    : tenants.filter(t => t.propertyId === selectedPropertyId);

  // Filtered active tenants
  const activeTenants = filteredTenants.filter(t => t.status === 'Active');
  const checkedOutCount = filteredTenants.filter(t => t.status === 'CheckedOut').length;

  // Calculate total rooms available across filtered view
  const totalRoomsForView = activeProperty 
    ? activeProperty.totalRooms 
    : properties.reduce((sum, p) => sum + p.totalRooms, 0);

  const occupancyRate = totalRoomsForView > 0 
    ? Math.min(100, Math.round((activeTenants.length / totalRoomsForView) * 100))
    : 0;

  // Current billing month (dynamic based on current date)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filter payments for filtered tenants
  const filteredTenantIds = new Set(filteredTenants.map(t => t.id));
  const filteredPayments = payments.filter(p => filteredTenantIds.has(p.tenantId));

  // Rent collected this month
  const collectedThisMonth = filteredPayments
    .filter(p => p.billingMonth === currentMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  // Pending alerts calculation
  const filteredBillingAlerts = billingAlerts.filter(b => filteredTenantIds.has(b.tenantId));
  const pendingAlerts = filteredBillingAlerts.filter(b => b.status === 'Pending' || b.status === 'Overdue');
  const expectedTotalRent = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0);
  const pendingRentAmount = pendingAlerts.reduce((sum, b) => sum + b.rentAmount, 0);

  // Recent payments sorted
  const recentPayments = [...filteredPayments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  // Helper getters
  const getTenant = (tenantId: string) => tenants.find(t => t.id === tenantId);
  const getPropertyName = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.name : 'Main Branch';
  };

  const handleSendWhatsAppReminder = (alert: BillingAlert) => {
    const tenantObj = getTenant(alert.tenantId);
    if (!tenantObj) return;

    const propObj = properties.find(p => p.id === tenantObj.propertyId);

    // 1. Generate & download official Dues Notice PDF
    const pdfFilename = generateRentReminderPDF({
      alert,
      tenantPhone: tenantObj.phone,
      propertyName: propObj?.name,
      propertyAddress: propObj?.address
    });

    // 2. Prepare WhatsApp text
    const text = getRentReminderTemplate({
      tenantName: alert.tenantName,
      roomNumber: alert.roomNumber,
      rentAmount: alert.rentAmount,
      billingMonth: alert.billingMonth,
      dueDate: alert.dueDate,
      status: alert.status,
      propertyName: propObj?.name
    });

    // 3. Trigger WhatsApp
    triggerWhatsAppMessage(tenantObj.phone, text);

    // 4. Show toast notification
    showToast(`Dues Statement PDF downloaded! Attach '${pdfFilename}' in WhatsApp.`, 'success');
  };

  const handleAddPropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim() || !propAddress.trim() || !propCity.trim() || !propContact.trim()) {
      alert('Please fill in all required property details (Name, City, Address, Contact Number).');
      return;
    }

    const roomsNum = Number(propTotalRooms) || 1;
    const floorsNum = Number(propTotalFloors) || 1;

    onAddProperty({
      name: propName.trim(),
      code: propCode.trim().toUpperCase() || propName.trim().substring(0, 4).toUpperCase(),
      address: propAddress.trim(),
      city: propCity.trim(),
      totalRooms: roomsNum,
      totalFloors: floorsNum,
      contactNumber: propContact.trim(),
      type: propType
    });

    // Reset all form inputs to empty
    setPropName('');
    setPropCode('');
    setPropAddress('');
    setPropCity('');
    setPropTotalRooms('');
    setPropTotalFloors('');
    setPropContact('');
    setPropType('Co-Living');
    setIsAddPropertyOpen(false);
  };

  // ── Edit Property Handlers ──────────────────────────────────────────────────
  const handleOpenEditProperty = (property: Property) => {
    setEditingProperty(property);
    setEditPropName(property.name);
    setEditPropCode(property.code);
    setEditPropAddress(property.address);
    setEditPropCity(property.city);
    setEditPropTotalRooms(property.totalRooms);
    setEditPropTotalFloors(property.totalFloors);
    setEditPropContact(property.contactNumber);
    setEditPropType(property.type);
    setIsEditPropertyOpen(true);
  };

  const handleEditPropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    if (!editPropName.trim() || !editPropAddress.trim() || !editPropCity.trim() || !editPropContact.trim()) {
      alert('Please fill in all required fields (Name, City, Address, Contact Number).');
      return;
    }
    const updated: Property = {
      ...editingProperty,
      name: editPropName.trim(),
      code: editPropCode.trim().toUpperCase() || editPropName.trim().substring(0, 4).toUpperCase(),
      address: editPropAddress.trim(),
      city: editPropCity.trim(),
      totalRooms: Number(editPropTotalRooms) || editingProperty.totalRooms,
      totalFloors: Number(editPropTotalFloors) || editingProperty.totalFloors,
      contactNumber: editPropContact.trim(),
      type: editPropType,
    };
    onEditProperty?.(updated);
    setIsEditPropertyOpen(false);
    setEditingProperty(null);
  };

  const handleDeleteProperty = (property: Property) => {
    const tenantCount = tenants.filter(t => t.propertyId === property.id && t.status === 'Active').length;
    const confirmMsg = tenantCount > 0
      ? `⚠️ "${property.name}" has ${tenantCount} active resident(s).\n\nDeleting this branch will delete the branch and all associated resident records.\n\nAre you sure you want to permanently delete this branch?`
      : `Delete "${property.name}" permanently? This cannot be undone.`;
    if (window.confirm(confirmMsg)) {
      setIsEditPropertyOpen(false);
      setEditingProperty(null);
      onDeleteProperty?.(property.id);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-overview-view">
      
      {/* Property Selector Bar & Welcome Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
              {activeProperty ? activeProperty.name : 'All Properties (Global Portfolio)'}
            </h1>
            <span className="bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {activeProperty ? activeProperty.type : `${properties.length} Branches`}
            </span>
          </div>
          <p className="text-xs text-neutral-500 flex items-center gap-2">
            {activeProperty ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{activeProperty.address}, {activeProperty.city}</span>
                <span>•</span>
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{activeProperty.contactNumber}</span>
              </>
            ) : (
              <span>Managing {properties.length} PG branches across Hyderabad • Overall summary for {currentMonthLabel}</span>
            )}
          </p>
        </div>

        {/* Property Switcher & Partner PDF Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setIsPartnerModalOpen(true)}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all hover:shadow-md min-h-[40px] whitespace-nowrap"
            title="Generate & Download 30-Day Financial Statement PDF for Partners"
          >
            <FileText className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Partner 30-Day Statement PDF</span>
          </button>

          <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 min-h-[40px]">
            <Filter className="w-3.5 h-3.5 text-neutral-500 ml-1 shrink-0" />
            <select
              value={selectedPropertyId}
              onChange={(e) => onSelectProperty(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-900 border-0 focus:ring-0 cursor-pointer pr-3 w-full"
            >
              <option value="all">🏢 All Properties (Global View)</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  🏢 {prop.name} ({prop.code})
                </option>
              ))}
            </select>
          </div>

          {userRole === 'super_admin' ? (
            <button
              onClick={() => setIsAddPropertyOpen(true)}
              className="flex-1 sm:flex-none bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors min-h-[40px] whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Add Property</span>
            </button>
          ) : (
            <button
              disabled
              className="bg-neutral-100 text-neutral-400 border border-neutral-200 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-not-allowed"
              title="Requires Super Admin Access"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Add Property (Super Only)</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Occupancy Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-occupancy"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{t('totalBeds')}</span>
              <p className="text-3xl font-extrabold text-neutral-900">
                {activeTenants.length} <span className="text-base font-medium text-neutral-400">/ {totalRoomsForView} {t('rooms')}</span>
              </p>
            </div>
            <div className="p-3 bg-neutral-100 text-neutral-700 rounded-xl border border-neutral-200/80">
              <Home className="w-5 h-5 text-neutral-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold border-t border-neutral-100 pt-3">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{occupancyRate}% {t('occupancyRate')}</span>
            <span className="text-neutral-400">{Math.max(0, totalRoomsForView - activeTenants.length)} Vacant</span>
          </div>
        </motion.div>

        {/* Rent Collected Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-collected"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{t('monthlyCollection')}</span>
              <p className="text-3xl font-extrabold text-neutral-900">₹{collectedThisMonth.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/80">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold border-t border-neutral-100 pt-3">
            <span className="text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              ₹{Math.round((collectedThisMonth / (expectedTotalRent || 1)) * 100)}% Recd
            </span>
            <span className="text-neutral-400">Expected: ₹{expectedTotalRent.toLocaleString('en-IN')}</span>
          </div>
        </motion.div>

        {/* Unpaid Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-pending"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{t('pendingDues')}</span>
              <p className="text-3xl font-extrabold text-amber-600">₹{pendingRentAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200/80">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold border-t border-neutral-100 pt-3">
            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {pendingAlerts.length} Unpaid Bills
            </span>
            <button 
              onClick={() => onNavigate('billing')}
              className="text-neutral-700 hover:text-neutral-950 flex items-center gap-0.5 cursor-pointer font-bold"
            >
              Collect <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Active Property Branches Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-properties"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{t('totalBranches')}</span>
              <p className="text-3xl font-extrabold text-neutral-900">{properties.length} <span className="text-base font-medium text-neutral-400">{t('totalBranches')}</span></p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/80">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold border-t border-neutral-100 pt-3">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {selectedPropertyId === 'all' ? 'Showing All' : 'Filtered'}
            </span>
            {selectedPropertyId !== 'all' && (
              <button 
                onClick={() => onSelectProperty('all')}
                className="text-neutral-600 hover:text-neutral-900 underline cursor-pointer font-bold"
              >
                Reset Filter
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* PROPERTY PORTFOLIO OVERVIEW SECTION (Displayed prominently) */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-neutral-700" />
              <span>{t('branchOverview')}</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">{t('dashboardSub')}</p>
          </div>
          
          <button
            onClick={() => setIsAddPropertyOpen(true)}
            className="text-xs font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Branch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => {
            const propTenants = tenants.filter(t => t.propertyId === property.id && t.status === 'Active');
            const propPayments = payments.filter(p => {
              const t = tenants.find(ten => ten.id === p.tenantId);
              return t && t.propertyId === property.id && p.billingMonth === currentMonth;
            });
            const propCollected = propPayments.reduce((sum, p) => sum + p.amount, 0);
            const propTarget = propTenants.reduce((sum, t) => sum + t.rentAmount, 0);
            const propOccupancy = Math.round((propTenants.length / property.totalRooms) * 100);
            const isSelected = selectedPropertyId === property.id;

            return (
              <div 
                key={property.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isSelected 
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' 
                    : 'bg-neutral-50/70 text-neutral-800 border-neutral-200/80 hover:border-neutral-300 hover:bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isSelected 
                          ? 'bg-neutral-800 text-neutral-200 border border-neutral-700' 
                          : 'bg-white text-neutral-700 border border-neutral-200'
                      }`}>
                        {property.type} • {property.code}
                      </span>
                      <h3 className={`font-extrabold text-base mt-1.5 ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                        {property.name}
                      </h3>
                    </div>

                    {/* Edit & Delete buttons — Super Admin only */}
                    {userRole === 'super_admin' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEditProperty(property); }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected 
                              ? 'hover:bg-neutral-700 text-neutral-300 hover:text-white' 
                              : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700'
                          }`}
                          title="Edit Property Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteProperty(property); }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected 
                              ? 'hover:bg-red-900/50 text-neutral-400 hover:text-red-300' 
                              : 'hover:bg-red-50 text-neutral-300 hover:text-red-500'
                          }`}
                          title="Delete Property Branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className={`text-xs flex items-center gap-1 leading-snug ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{property.address}, {property.city}</span>
                  </p>
                </div>

                {/* Progress bar and stats */}
                <div className="space-y-3 pt-2 border-t border-neutral-200/40">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className={isSelected ? 'text-neutral-300' : 'text-neutral-600'}>
                      Occupancy: {propTenants.length} / {property.totalRooms} Rooms
                    </span>
                    <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {propOccupancy}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isSelected ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, propOccupancy)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className={`text-[10px] block uppercase font-bold tracking-wider ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                        Rent Recd (July)
                      </span>
                      <span className={`font-extrabold text-sm ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                        ₹{propCollected.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectProperty(isSelected ? 'all' : property.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-white text-neutral-950 hover:bg-neutral-100' 
                          : 'bg-neutral-900 text-white hover:bg-neutral-800'
                      }`}
                    >
                      <span>{isSelected ? 'View All' : 'Select Branch'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Pending Rents & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Billing alerts & notices (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Automated Billing Alerts */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-neutral-900">July Rent Roll & Overdues</h2>
                <p className="text-xs text-neutral-500">
                  {activeProperty ? `Rents due for ${activeProperty.name}` : 'Rents due across all branches'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Due July 5
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredBillingAlerts.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium">All residents are fully paid up for July!</p>
                </div>
              ) : (
                filteredBillingAlerts.map((alert) => {
                  const t = getTenant(alert.tenantId);
                  const pName = t ? getPropertyName(t.propertyId) : '';

                  return (
                    <div 
                      key={alert.tenantId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-50 border border-neutral-200/60 rounded-xl gap-3 transition-hover duration-200 hover:border-neutral-300"
                      id={`billing-alert-item-${alert.tenantId}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{alert.tenantName}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600">
                            Room {alert.roomNumber}
                          </span>
                          {selectedPropertyId === 'all' && pName && (
                            <span className="text-[10px] font-bold bg-neutral-200/80 text-neutral-700 px-1.5 py-0.5 rounded">
                              {pName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <span>Rent: <b>₹{alert.rentAmount}</b></span>
                          <span>•</span>
                          <span>Due: {alert.dueDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          alert.status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : alert.status === 'Overdue' 
                              ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {alert.status}
                        </span>
                        
                        {alert.status !== 'Paid' && (
                          <button
                            onClick={() => handleSendWhatsAppReminder(alert)}
                            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                            title="Send Rent Reminder on WhatsApp & Download PDF Statement"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => onNavigate('billing')}
                          className="text-xs bg-neutral-900 text-white hover:bg-neutral-800 px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-xs cursor-pointer"
                        >
                          Collect
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Column 2: Recent Payments (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-neutral-900">Recent Collections</h2>
                <p className="text-xs text-neutral-500">Latest completed rent transactions</p>
              </div>
              <button 
                onClick={() => onNavigate('billing')}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer"
              >
                Log Book <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              {recentPayments.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <p className="text-sm">No payment logs available for this selection.</p>
                </div>
              ) : (
                recentPayments.map((log) => {
                  const t = getTenant(log.tenantId);
                  return (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectTenant(log.tenantId)}
                            className="font-bold text-sm text-neutral-800 hover:text-neutral-900 text-left hover:underline cursor-pointer"
                          >
                            {t ? t.name : 'Resident'}
                          </button>
                          <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm">
                            Room {t ? t.roomNumber : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <span>{log.paymentDate}</span>
                          <span>•</span>
                          <span className="bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100 text-neutral-500 font-medium text-[10px]">{log.paymentMode}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-600 text-sm">+ ₹{log.amount}</span>
                          <p className="text-[10px] text-neutral-400">{log.billingMonth}</p>
                        </div>
                        {userRole === 'super_admin' && onDeletePayment && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete payment log record (+₹${log.amount}) permanently?`)) {
                                onDeletePayment(log.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-neutral-300 hover:text-red-600 rounded transition-colors"
                            title="Delete Payment Log (Super Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ADD PROPERTY BRANCH MODAL */}
      {isAddPropertyOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-neutral-800" />
                <h3 className="font-extrabold text-neutral-900 text-base">Register New PG Property Branch</h3>
              </div>
              <button 
                onClick={() => setIsAddPropertyOpen(false)}
                className="p-1 hover:bg-neutral-200 rounded-lg text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPropertySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Property Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. GMR Prime Heights"
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-semibold bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Branch Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PRIME"
                    value={propCode}
                    onChange={(e) => setPropCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-mono tracking-wider bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Property Type *</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value as PropertyType)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="Co-Living">Co-Living</option>
                    <option value="Boys PG">Boys PG</option>
                    <option value="Girls PG">Girls PG</option>
                    <option value="Luxury Apartments">Luxury Apartments</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">City *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Hyderabad"
                    value={propCity}
                    onChange={(e) => setPropCity(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Full Street Address *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Plot 42, Road No 12, Banjara Hills"
                  value={propAddress}
                  onChange={(e) => setPropAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Total Rooms *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="e.g. 15"
                    value={propTotalRooms}
                    onChange={(e) => setPropTotalRooms(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Floors *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="e.g. 4"
                    value={propTotalFloors}
                    onChange={(e) => setPropTotalFloors(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Manager Phone *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={propContact}
                    onChange={(e) => setPropContact(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddPropertyOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save & Add Property
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 30-DAY PARTNER STATEMENT MODAL */}
      <PartnerStatementModal 
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        properties={properties}
        tenants={tenants}
        payments={payments}
        billingAlerts={billingAlerts}
        selectedPropertyId={selectedPropertyId}
        showToast={showToast}
      />

      {/* ── EDIT PROPERTY BRANCH MODAL ───────────────────────────────────── */}
      {isEditPropertyOpen && editingProperty && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-base">Edit Property Branch</h3>
                  <p className="text-[11px] text-emerald-700 font-semibold">{editingProperty.name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsEditPropertyOpen(false); setEditingProperty(null); }}
                className="p-1 hover:bg-emerald-100 rounded-lg text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPropertySubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Row 1: Name & Code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Property Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. GMR Prime Heights"
                    value={editPropName}
                    onChange={(e) => setEditPropName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-semibold bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Branch Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PRIME"
                    value={editPropCode}
                    onChange={(e) => setEditPropCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-mono tracking-wider bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row 2: Type & City */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Property Type *</label>
                  <select
                    value={editPropType}
                    onChange={(e) => setEditPropType(e.target.value as PropertyType)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Co-Living">Co-Living</option>
                    <option value="Boys PG">Boys PG</option>
                    <option value="Girls PG">Girls PG</option>
                    <option value="Luxury Apartments">Luxury Apartments</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">City *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Hyderabad"
                    value={editPropCity}
                    onChange={(e) => setEditPropCity(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Full Street Address *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Plot 42, Road No 12, Banjara Hills"
                  value={editPropAddress}
                  onChange={(e) => setEditPropAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Row 3: Rooms, Floors, Phone */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Total Rooms *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={editPropTotalRooms}
                    onChange={(e) => setEditPropTotalRooms(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Floors *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={editPropTotalFloors}
                    onChange={(e) => setEditPropTotalFloors(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Manager Phone *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+91 98765 43210"
                    value={editPropContact}
                    onChange={(e) => setEditPropContact(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-mono bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium">
                ⚠️ Changing <b>Total Rooms</b> will update occupancy rate calculations across this branch. Changes are saved to cloud immediately.
              </div>

              {/* Action Buttons */}
              <div className="border-t border-neutral-100 pt-4 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDeleteProperty(editingProperty)}
                  className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Branch
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditPropertyOpen(false); setEditingProperty(null); }}
                    className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
