import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { User, Mail, Shield, Sliders, Sun, Moon, Lock, Check, BookOpen, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'appearance' | 'security'
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'appearance', label: 'Interface Preferences', icon: Sliders },
    { id: 'security', label: 'Account Security', icon: Shield },
    { id: 'guide', label: 'Workspace Guide', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your personal profile, interface layout, and account security.
        </p>
      </div>

      {/* Settings Grid Panel */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 rounded-xl border border-border bg-card p-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-primary' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm min-h-[300px]">
          
          {/* PROFILE SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Profile Settings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your display name and email address settings.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                {isSaved && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-500 font-medium">
                    <Check size={13} />
                    Profile changes mock-saved successfully!
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="name-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Display Name
                  </label>
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <input
                      id="name-input"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Siddharth Pandey"
                      className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </label>
                  <div className="relative opacity-70">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <input
                      id="email-input"
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      disabled
                      placeholder="user@commitflow.com"
                      className="w-full rounded-lg border border-border bg-secondary pl-10 pr-4 py-2.5 text-xs text-muted-foreground cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-normal mt-1 block">
                    * Email address changes are disabled for SSO security validation.
                  </span>
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* INTERFACE PREFERENCES TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Interface Preferences</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize the visual layout and themes of the dashboard.
                </p>
              </div>

              <div className="space-y-4 max-w-lg">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-foreground">Theme State</h4>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Toggle client-side styles between light mode and zinc-slate dark mode styles.
                    </p>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-4 py-2.5 bg-secondary hover:bg-secondary/70 text-foreground text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun size={13} className="text-amber-400" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon size={13} className="text-blue-400" />
                        Dark Mode
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-lg border border-border p-4 bg-secondary/20">
                  <h4 className="text-xs font-bold text-foreground mb-1">Theme Capabilities</h4>
                  <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
                    <li>Minimalist slate border layouts configured for Figma blueprints.</li>
                    <li>Automatic browser system-theme detection checks.</li>
                    <li>Tailwind variables dynamic sync with zero lag.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Account Security</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Secure your developer login credentials.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label htmlFor="current-pw" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <input
                      id="current-pw"
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-pw" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <input
                      id="new-pw"
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-pw" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <input
                      id="confirm-pw"
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Password update form is a placeholder visual layout demo.')}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* WORKSPACE GUIDE TAB */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Workspace Guide</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Follow these steps to get started with your new workspace.
                </p>
              </div>

              <div className="space-y-6 mt-4">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Step 1: Launch a Project</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Create a brand new project space from your main dashboard hub.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Step 2: Invite Collaborators</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Go to the project page and add team members using their user emails.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Step 3: Organize Tasks</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Populate your Kanban board and transition statuses live to watch progress sync.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Step 4: Engage via Comments</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Open any task to upload attachments or post real-time chat updates.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
