import React from "react";
import {
  Check,
  Tablet,
  Search,
  Bell,
  House,
  BarChart2,
  QrCode,
  MapPin,
  Users,
  Settings,
  UserCheck,
  Shield,
  Activity,
} from "lucide-react";

export function IllustrationSection() {
  return (
    <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 relative bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:24px_24px] overflow-hidden flex-col justify-between p-8 xl:p-10 select-none">
      
      {/* Ambient Circular Overlay Lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-[620px] h-[620px] border border-slate-300/60 rounded-full" />
        <div className="absolute w-[820px] h-[820px] border border-slate-200/50 rounded-full" />
      </div>

      {/* Main Center Container */}
      <div className="relative w-full h-full min-h-[490px] flex items-center justify-center">
        
        {/* Floating Card Top Left: QR Scan Passed */}
        <div className="absolute top-[4%] left-[4%] z-30 animate-bounce" style={{ animationDuration: '6s' }}>
          <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm shadow-md shadow-emerald-200">
              <Check className="w-4.5 h-4.5 stroke-[3]" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">QR Scan Passed</div>
              <div className="text-[10px] font-medium text-slate-400">SN-TAB-9901 • Active</div>
            </div>
          </div>
        </div>

        {/* Floating Card Top Right: Monthly Inspection Progress */}
        <div
          className="absolute top-[1%] right-[4%] z-30 animate-bounce"
          style={{ animationDuration: '7s', animationDelay: '1s' }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl p-3.5 min-w-[210px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">
              Monthly Inspection Progress
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">98.4%</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                +4.2%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full w-[98.4%]" />
            </div>
          </div>
        </div>

        {/* Background Isometric 3D Floor Pedestal Platform */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="[transform:rotateX(54deg)_rotateZ(-32deg)] w-[510px] h-[370px] bg-slate-200/50 rounded-[48px] shadow-[-30px_40px_60px_rgba(0,0,0,0.06)] flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-tr from-slate-100 via-white to-slate-50 rounded-[44px] border-4 border-white/80 p-4" />
          </div>
        </div>

        {/* Center Mockup Group: STRAIGHT FRONT-FACING TABLET (+10% Scaled Up Size: 475px) */}
        <div className="relative z-20 flex items-center justify-center my-auto">
          
          {/* Straight Front-Facing Tablet Device (Scaled Up +10% Width) */}
          <div className="w-[475px] bg-slate-900 rounded-[30px] p-3 shadow-[-18px_28px_65px_rgba(15,23,42,0.26),0_0_2px_rgba(0,0,0,0.4)] border-4 border-slate-800/90 relative">
            {/* Camera Dot Top Center */}
            <div className="w-2 h-2 bg-slate-700 rounded-full mx-auto mb-2" />

            {/* Tablet Display Screen */}
            <div className="w-full bg-slate-50 rounded-[22px] overflow-hidden flex flex-col text-[10px] text-slate-700 select-none shadow-inner">
              
              {/* App Top Bar */}
              <div className="bg-white px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <div className="w-4 h-4 bg-indigo-600 text-white rounded flex items-center justify-center text-[9px] shadow-sm">
                    <Tablet className="w-2.5 h-2.5" />
                  </div>
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Search className="w-3.5 h-3.5 hover:text-slate-600 transition-colors cursor-pointer" />
                  <Bell className="w-3.5 h-3.5 hover:text-slate-600 transition-colors cursor-pointer" />
                </div>
              </div>

              {/* App Body Grid */}
              <div className="p-3.5 flex gap-3">
                
                {/* Left Dark Navigation Sidebar */}
                <div className="w-8 bg-slate-900 rounded-xl p-1.5 flex flex-col items-center gap-2.5 text-slate-400">
                  <div className="w-5.5 h-5.5 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm">
                    <House className="w-3 h-3" />
                  </div>
                  <BarChart2 className="w-3.5 h-3.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                  <QrCode className="w-3.5 h-3.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                  <MapPin className="w-3.5 h-3.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                  <Users className="w-3.5 h-3.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                  <Settings className="w-3.5 h-3.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer mt-auto mb-1" />
                </div>

                {/* Main Dashboard Canvas */}
                <div className="flex-1 flex flex-col gap-2.5">
                  
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-[8px] font-semibold text-slate-400">Total Tablet</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">248</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-[8px] font-semibold text-slate-400">Inspection</div>
                      <div className="text-xs font-bold text-indigo-600 mt-0.5">98.4%</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-[8px] font-semibold text-slate-400">Locations</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">32</div>
                    </div>
                  </div>

                  {/* Charts & Recent Activity Section */}
                  <div className="grid grid-cols-5 gap-2.5 flex-1">
                    
                    {/* Inspection Progress Bar Chart */}
                    <div className="col-span-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div className="font-bold text-[9px] text-slate-700">Inspection Progress</div>
                      <div className="flex items-end justify-between gap-1.5 h-16 pt-3 px-1">
                        <div className="w-2.5 bg-indigo-200 h-[40%] rounded-t-sm" />
                        <div className="w-2.5 bg-indigo-300 h-[60%] rounded-t-sm" />
                        <div className="w-2.5 bg-indigo-400 h-[35%] rounded-t-sm" />
                        <div className="w-2.5 bg-indigo-500 h-[80%] rounded-t-sm" />
                        <div className="w-2.5 bg-indigo-600 h-[100%] rounded-t-sm" />
                        <div className="w-2.5 bg-indigo-500 h-[70%] rounded-t-sm" />
                      </div>
                    </div>

                    {/* Recent Activity List */}
                    <div className="col-span-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1.5">
                      <div className="font-bold text-[8px] text-slate-700 mb-0.5">Recent Activity</div>
                      <div className="flex items-center gap-1.5 text-[7px]">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                        <span className="truncate font-medium text-slate-600">QR Scan Passed</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[7px]">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                        <span className="truncate font-medium text-slate-600">Tablet Checked</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[7px]">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                        <span className="truncate font-medium text-slate-600">Inspection Sync</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* 3D Angled QR Code Tile Adjacent to Tablet Bottom Right */}
          <div className="[transform:rotateX(54deg)_rotateZ(-32deg)] absolute right-[8%] bottom-[16%] w-20 h-20 bg-white rounded-2xl p-2 shadow-[-10px_15px_30px_rgba(0,0,0,0.14)] flex items-center justify-center border border-slate-100 z-20">
            <div className="w-full h-full bg-slate-900 rounded-xl p-1.5 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white" />
                </div>
                <div className="w-4 h-4 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white" />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="w-4 h-4 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white" />
                </div>
                <div className="w-3 h-3 bg-indigo-500 rounded-sm" />
              </div>
            </div>
          </div>

        </div>

        {/* Floating Card Bottom Center: Automated Role Routing */}
        <div
          className="absolute bottom-[2%] z-30 animate-bounce"
          style={{ animationDuration: '8s', animationDelay: '2s' }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl px-5 py-3 flex items-center gap-4 min-w-[340px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
              <UserCheck className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Automated Role Routing</span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  v1.0.0
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                Admin • PIC (Supervisor) • Manager
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM FEATURE HIGHLIGHTS GRID (Reduced Gap to Tablet Illustration above) */}
      <div className="grid grid-cols-4 gap-4 mt-auto pt-4 border-t border-slate-100/60">
        
        {/* Feature 1: Secure */}
        <div className="flex flex-col items-center text-center group cursor-pointer">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <Shield className="w-5.5 h-5.5 stroke-current fill-none transition-colors" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 mb-0.5">Secure</h3>
          <p className="text-[11px] text-slate-400 font-medium leading-tight">Enterprise Grade Security</p>
        </div>

        {/* Feature 2: Real-time */}
        <div className="flex flex-col items-center text-center group cursor-pointer">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <Activity className="w-5.5 h-5.5 stroke-current fill-none transition-colors" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 mb-0.5">Real-time</h3>
          <p className="text-[11px] text-slate-400 font-medium leading-tight">Monitoring & Analytics</p>
        </div>

        {/* Feature 3: Multi Location */}
        <div className="flex flex-col items-center text-center group cursor-pointer">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <MapPin className="w-5.5 h-5.5 stroke-current fill-none transition-colors" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 mb-0.5">Multi Location</h3>
          <p className="text-[11px] text-slate-400 font-medium leading-tight">Inspection Tracking</p>
        </div>

        {/* Feature 4: Role Based */}
        <div className="flex flex-col items-center text-center group cursor-pointer">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <UserCheck className="w-5.5 h-5.5 stroke-current fill-none transition-colors" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 mb-0.5">Role Based</h3>
          <p className="text-[11px] text-slate-400 font-medium leading-tight">Access Control</p>
        </div>

      </div>

    </div>
  );
}
