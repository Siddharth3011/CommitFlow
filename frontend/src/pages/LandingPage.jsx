import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ShieldCheck, Users, Activity, ChevronRight, CheckCircle2, LockKeyhole, FileCode2, Cpu, Server } from 'lucide-react';
import ss1 from '../assets/ss1.png';
import ss2 from '../assets/ss2.png';
import ss3 from '../assets/ss3.png';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 selection:bg-indigo-500/30 font-sans smooth-scroll">
      
      {/* 1. Functional High-End Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-900/80 bg-[#030712]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <img src="/logo.png" alt="logo" className='w-7 h-7' />
              {/* <Network className="w-5 h-5 text-indigo-400" /> */}
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CommitFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#workspace" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Workspace</a>
            <a href="#security" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Security Pillars</a>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="text-sm font-medium bg-white text-[#030712] px-4 py-2 rounded-md hover:bg-slate-200 transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Premium Hero Section & Ambient Aura Display */}
      <section className="relative pt-32 pb-20 px-6 sm:pt-40 lg:pt-48 overflow-hidden max-w-7xl mx-auto">
        <div className="relative text-center max-w-3xl mx-auto space-y-6 z-10">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Unify your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              engineering sync.
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed font-light mx-auto max-w-xl">
            A high-density developer platform. Seamlessly aggregate project boards, telemetry insights, and role-based access protocols into one centralized brain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/register" 
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-md font-medium hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] w-full sm:w-auto"
            >
              Get Started Free
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Browser Mockup Frame & Ambient Aura */}
        <div className="relative mt-20 lg:mt-24 max-w-5xl mx-auto">
          {/* Centralized Ambient Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[400px] bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative rounded-lg border border-slate-900/80 bg-[#0a0f1c] shadow-2xl p-1.5 ring-1 ring-white/5 z-10">
            <div className="w-full rounded border border-slate-800 bg-[#0b0f19] flex flex-col overflow-hidden">
              <div className="h-10 bg-[#121826] border-b border-slate-800/80 flex items-center px-4 justify-between shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                  <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                  <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                </div>
                <div className="font-mono text-[11px] text-slate-500 tracking-wider">
                  commitflow-workspace [v1.0.0]
                </div>
                <div className="w-10"></div>
              </div>
              <div className="relative w-full bg-[#0b0f19]">
                <img 
                  src={ss1} 
                  alt="Platform Workspace Interface" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Tracking Bar underneath */}
          <div className="relative z-10 mt-6 flex flex-wrap justify-center items-center gap-6 md:gap-12 text-xs font-mono text-slate-500 tracking-wider">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> System Load: 12%
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" /> Active Nodes: 4/4
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Aggregation: Real-time
            </div>
          </div>
        </div>
      </section>

      {/* 3. Technical Grid UI Features (Security & Architecture) */}
      <section id="security" className="py-24 px-6 mt-12 bg-[#02040a]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Security & Architecture Pillars</h2>
            <p className="text-slate-400 font-light max-w-2xl">
              Engineered for strict organizational compliance and identity protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-slate-900/80">
            {/* Feature Block 1 */}
            <div className="p-8 border-r border-b border-slate-900/80 bg-[#030712] hover:bg-[#0a0f1c] transition-colors">
              <LockKeyhole className="w-6 h-6 text-indigo-400 mb-6" />
              <h3 className="text-lg font-bold text-white mb-2">Granular Identity Gate</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                A multi-layered session handshake securely blocks unverified visitors. Time-sensitive OTP challenges precede any JWT issuance.
              </p>
            </div>
            {/* Feature Block 2 */}
            <div className="p-8 border-r border-b border-slate-900/80 bg-[#030712] hover:bg-[#0a0f1c] transition-colors">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-6" />
              <h3 className="text-lg font-bold text-white mb-2">Role-Based Matrix (RBAC)</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                Strict permissions tiering differentiating Admins, Editors, and Viewers. Rendering logic mapping directly to DB middleware.
              </p>
            </div>
            {/* Feature Block 3 */}
            <div className="p-8 border-r border-b border-slate-900/80 bg-[#030712] hover:bg-[#0a0f1c] transition-colors">
              <Activity className="w-6 h-6 text-cyan-400 mb-6" />
              <h3 className="text-lg font-bold text-white mb-2">Interactive Pipeline</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                A high-performance execution cycle tracking tickets. Bidirectional state sync ensures developers never act on stale data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Split Feature Layouts */}
      <section id="workspace" className="py-24 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          
          {/* Section A */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-5">
              <div className="inline-flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-widest border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 rounded">
                <Users className="w-3.5 h-3.5" /> Assignment Workflow
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                Synchronized Task Engine
              </h2>
              <p className="text-slate-400 font-light leading-relaxed max-w-md">
                Manage your development lifecycle with absolute clarity. Our assignment matrix ensures every pull request and critical bug fix is instantly delegated to the appropriate engineers without context switching.
              </p>
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-3 text-slate-300 text-sm font-light">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Real-time peer status tracking
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm font-light">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Integrated markdown activity feeds
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative group">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
              <div className="relative rounded-lg border border-slate-800 bg-[#0a0f1c] p-1 shadow-2xl overflow-hidden">
                <img src={ss2} alt="Live Task View Tracker" className="w-full h-auto rounded border border-slate-800/80" />
              </div>
            </div>
          </div>

          <div id="features" className="w-full h-px bg-slate-900/80 my-16"></div>

          {/* Section B */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-5 lg:pl-12">
              <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 rounded">
                <Network className="w-3.5 h-3.5" /> Telemetry & Insights
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                Aggregation Reporting
              </h2>
              <p className="text-slate-400 font-light leading-relaxed max-w-md">
                We capture millions of micro-events across your repository infrastructure. Backend telemetry processors aggregate these data points into actionable insights to track organizational health.
              </p>
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-3 text-slate-300 text-sm font-light">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" /> Cross-project velocity charts
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm font-light">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" /> Developer performance metrics
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative group">
              <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700" />
              <div className="relative rounded-lg border border-slate-800 bg-[#0a0f1c] p-1 shadow-2xl overflow-hidden">
                <img src={ss3} alt="Analytics Dashboard Reporting" className="w-full h-auto rounded border border-slate-800/80" />
              </div>
            </div>
          </div>

        </div>
      </section>
      
      <div id="documentation" className="w-full h-px"></div>

      {/* 5. Streamlined Footer Layout */}
      <footer className="border-t border-slate-900/80 bg-[#02040a] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 mb-16">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-lg text-white">CommitFlow</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-light max-w-sm">
                The centralized system brain for engineering sync. Designed for teams who demand absolute clarity and velocity.
              </p>
            </div>
            
            <div>
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-6">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#workspace" className="text-slate-400 hover:text-white transition-colors">Workspace</a></li>
                <li><a href="#security" className="text-slate-400 hover:text-white transition-colors">Security Pillars</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900/80 flex items-center justify-between">
            <p className="text-xs font-mono text-slate-600">
              © {new Date().getFullYear()} CommitFlow, Inc. All rights reserved.
            </p>
             <p className="text-xs font-mono text-slate-600">
              Made with ❤️ by Siddharth Pandey
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
