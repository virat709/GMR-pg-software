import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, 
  Send, 
  Smartphone, 
  CheckCircle, 
  History, 
  AlertCircle, 
  Info, 
  ShieldAlert, 
  Hammer, 
  Bell, 
  X,
  Users,
  CheckCircle2,
  Cpu,
  MessageCircle
} from 'lucide-react';
import { Tenant, Announcement, AnnouncementCategory } from '../types';
import { triggerWhatsAppMessage } from '../utils/whatsapp';

interface AnnouncementCenterProps {
  tenants: Tenant[];
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
}

interface SimulatedDevice {
  name: string;
  device: string;
  status: 'Idle' | 'Handshake' | 'Delivering' | 'Delivered' | 'Failed';
  delayMs: number;
}

export default function AnnouncementCenter({
  tenants,
  announcements,
  onAddAnnouncement
}: AnnouncementCenterProps) {
  // Compose Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('Urgent');
  const [roomsTargeted, setRoomsTargeted] = useState<'All' | string>('All');
  
  // Simulation states
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [simulatedDevices, setSimulatedDevices] = useState<SimulatedDevice[]>([]);
  const [currentProgressText, setCurrentProgressText] = useState('');
  const [overallSuccess, setOverallSuccess] = useState(false);

  // Get active tenants
  const activeTenants = tenants.filter(t => t.status === 'Active');

  // Trigger push broadcast
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Please fill out notice title and body content.');
      return;
    }

    // Prepare simulated resident devices
    const deviceModels = [
      'iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra', 'OnePlus 12', 
      'Google Pixel 8 Pro', 'iPhone 14', 'Nothing Phone (2)'
    ];
    
    const targets = activeTenants.filter(t => roomsTargeted === 'All' || t.roomNumber === roomsTargeted);
    
    if (targets.length === 0) {
      alert('No active tenants are matching selected room criteria.');
      return;
    }

    const devices: SimulatedDevice[] = targets.map((tenant, idx) => ({
      name: tenant.name,
      device: deviceModels[idx % deviceModels.length],
      status: 'Idle',
      delayMs: 300 + (idx * 400) // Staggered animations
    }));

    setSimulatedDevices(devices);
    setIsBroadcasting(true);
    setOverallSuccess(false);
    setCurrentProgressText('Establishing secure notification gateway tunnel...');

    // Run staggered simulation progress
    // Step 1: Handshake
    setTimeout(() => {
      setCurrentProgressText('Gateway handshake complete. Authenticating push server credentials...');
      setSimulatedDevices(prev => prev.map(d => ({ ...d, status: 'Handshake' })));
    }, 1200);

    // Step 2: Delivering (Staggered per device)
    setTimeout(() => {
      setCurrentProgressText('Broadcasting payload package to resident nodes...');
      devices.forEach((device, index) => {
        setTimeout(() => {
          setSimulatedDevices(prev => {
            const copy = [...prev];
            if (copy[index]) copy[index].status = 'Delivering';
            return copy;
          });
        }, device.delayMs);
      });
    }, 2400);

    // Step 3: Delivered (Staggered per device)
    setTimeout(() => {
      devices.forEach((device, index) => {
        setTimeout(() => {
          setSimulatedDevices(prev => {
            const copy = [...prev];
            if (copy[index]) copy[index].status = 'Delivered';
            return copy;
          });
        }, device.delayMs + 600);
      });
    }, 3200);

    // Step 4: Finished simulation successfully
    const totalSimDuration = 3200 + (devices.length * 400) + 1200;
    setTimeout(() => {
      setCurrentProgressText(`Broadcast completely transmitted to ${targets.length} devices!`);
      setOverallSuccess(true);
      
      // Add announcement log to parent state
      onAddAnnouncement({
        title,
        content,
        category,
        sentDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        roomsTargeted
      });

      // Clear Form
      setTitle('');
      setContent('');
      setCategory('General');
      setRoomsTargeted('All');
    }, totalSimDuration);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="announcement-center-container">
      
      {/* Left Column: Draft notice form & instructions (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
            <div className="p-2.5 bg-neutral-900 text-white rounded-xl">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 text-base">Notice Dispatcher</h2>
              <p className="text-xs text-neutral-400">Send instant mobile alerts & notifications</p>
            </div>
          </div>

          {/* Quick Notice Templates */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Quick Templates</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTitle('🍲 Food Service Delayed');
                  setCategory('Urgent');
                  setContent('Dear Residents, today\'s meal service is delayed by approximately 30 minutes due to fresh preparation. We apologize for the inconvenience and appreciate your patience!');
                }}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                🍲 Food Delayed
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('⚡ Scheduled Power Maintenance');
                  setCategory('Maintenance');
                  setContent('Please be advised that backup power generator testing is scheduled today. Minor 5-minute switchover pauses may occur.');
                }}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                ⚡ Power Maintenance
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('🚰 Overhead Tank Cleaning');
                  setCategory('Maintenance');
                  setContent('Overhead water tanks will undergo routine sanitization tomorrow morning. Water supply will be temporarily paused for 2 hours.');
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                🚰 Water Tank Cleaning
              </button>
            </div>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Notice Title *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Water Pump Maintenance Scheduled"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 focus:outline-hidden focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-500"
              />
            </div>

            {/* Category & Room Target in row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                >
                  <option value="Urgent">Urgent Alert</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Security">Security Notice</option>
                  <option value="General">General Info</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Resident Target *</label>
                <select
                  value={roomsTargeted}
                  onChange={(e) => setRoomsTargeted(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                >
                  <option value="All">All Rooms (Broadcast)</option>
                  {/* Distinct active room numbers */}
                  {Array.from(new Set(activeTenants.map(t => t.roomNumber)))
                    .sort()
                    .map(room => (
                      <option key={room} value={room}>Room {room}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Notice Content *</label>
              <textarea 
                required
                rows={5}
                placeholder="Write detailed information for your tenants. Avoid generic SaaS verbs. Clear and actionable instructions work best."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 focus:outline-hidden focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-500 resize-none leading-relaxed"
              ></textarea>
            </div>

            {/* Broadcast action button */}
            <button
              type="submit"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              id="broadcast-notice-submit"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Urgent Update</span>
            </button>
          </form>
        </div>

        {/* Informational tip */}
        <div className="bg-blue-50/50 border border-blue-200/50 p-4 rounded-xl flex gap-3 text-xs text-blue-800 leading-relaxed">
          <Info className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold">Automated Push Channels</h4>
            <p className="text-blue-700">Royal Homes PG is fully integrated with instant push receivers. Broadcasters push instant overlays directly onto mobile lockscreens.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Historical logs and visual transmission simulator (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Real-time Push Transmitter Visualization */}
        {isBroadcasting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 text-neutral-100 rounded-2xl p-6 border border-neutral-800 shadow-xl space-y-5 relative overflow-hidden"
          >
            {/* Visual background radar ping */}
            <div className="absolute right-[-40px] top-[-40px] w-40 h-40 bg-neutral-800/40 rounded-full border border-neutral-700/30 flex items-center justify-center animate-ping"></div>

            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-bold text-sm text-white tracking-wide">Push Notification Gateway Simulation</h3>
              </div>
              
              <button 
                onClick={() => setIsBroadcasting(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 cursor-pointer"
                title="Dismiss details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gateway status message */}
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 font-mono text-xs text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>{currentProgressText}</span>
            </div>

            {/* Simulated Residents Devices Status list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {simulatedDevices.map((device, idx) => (
                <div 
                  key={idx}
                  className="bg-neutral-950 p-3.5 border border-neutral-800/80 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold block text-neutral-200">{device.name}</span>
                    <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      {device.device}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      device.status === 'Delivered' 
                        ? 'bg-emerald-400' 
                        : device.status === 'Delivering' 
                          ? 'bg-blue-400 animate-pulse'
                          : device.status === 'Handshake'
                            ? 'bg-amber-400 animate-spin'
                            : 'bg-neutral-700'
                    }`}></span>
                    <span className={`text-[10px] font-mono font-bold ${
                      device.status === 'Delivered'
                        ? 'text-emerald-400'
                        : device.status === 'Delivering'
                          ? 'text-blue-400'
                          : device.status === 'Handshake'
                            ? 'text-amber-400'
                            : 'text-neutral-500'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulation completion state */}
            <AnimatePresence>
              {overallSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-emerald-300">Broadcast Completed Successfully!</h4>
                    <p className="text-[10px] text-emerald-400 leading-relaxed">Notifications have successfully landed on {simulatedDevices.length} registered mobile devices. Resident ledger records updated.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Historical dispatch notices log */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-neutral-400" />
              <h3 className="font-bold text-neutral-900 text-sm">Announcement Logs</h3>
            </div>
            <span className="text-xs text-neutral-400 font-semibold">{announcements.length} Sent Broadcasts</span>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {announcements.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs font-semibold">
                No past announcements logged.
              </div>
            ) : (
              announcements.map((ann) => (
                <div 
                  key={ann.id}
                  className="p-4 bg-neutral-50/70 border border-neutral-200/50 rounded-xl space-y-3 transition-colors duration-200 hover:border-neutral-300"
                  id={`ann-log-item-${ann.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        ann.category === 'Urgent'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : ann.category === 'Maintenance'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : ann.category === 'Security'
                              ? 'bg-slate-50 text-slate-700 border border-slate-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {ann.category}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-md">
                        Targets: Room {ann.roomsTargeted}
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono font-medium">{ann.sentDate}</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-900 text-sm">{ann.title}</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-neutral-200/40">
                    <span className="text-[10px] text-neutral-400 font-medium">Forward to Resident:</span>
                    <select
                      id={`forward-select-${ann.id}`}
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const tenantObj = activeTenants.find(t => t.id === val);
                        if (tenantObj) {
                          const forwardText = `*GMR LUXURY PG - URGENT NOTICE* 📢\n\n📌 *Topic:* ${ann.title}\n\n${ann.content}\n\n---\n*GMR Co-Living Spaces*\n🏠 Feels Like Home\n📞 +91 99515 13796`;
                          triggerWhatsAppMessage(tenantObj.phone, forwardText);
                        }
                        // Reset select
                        e.target.value = "";
                      }}
                      className="px-2 py-1 text-[10px] border border-neutral-200 rounded-lg bg-white font-medium text-neutral-700 focus:ring-1 focus:ring-neutral-900 cursor-pointer max-w-[180px]"
                    >
                      <option value="" disabled>Select Resident...</option>
                      {activeTenants.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Room {t.roomNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
