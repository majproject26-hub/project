import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';
import { QuerixLogo } from '../components/common/QuerixLogo';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-[#4D5A2A] selection:text-[#F7F4E8]">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <QuerixLogo size="lg" showText={true} showTagline={true} tagline="A Unified Multi-Tenant Lakehouse Analytics" variant="dark" />
          </NavLink>

          <div className="flex items-center gap-2 sm:gap-3">
            <NavLink to="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </NavLink>
            <NavLink to="/signup">
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#748447]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#4D5A2A]/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs text-[#DCE4C2] shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#DCE4C2]" />
            <span>Next-Gen Enterprise Analytics & Lakehouse Storage</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            One Unified Lakehouse for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F7F4E8] via-[#DCE4C2] to-[#748447]">
              All Your Companies
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Unlock faster analytics, simplify data exploration with AI-powered text and voice queries, automate data optimization, and turn insights into real-time dashboards—all through one secure, unified Lakehouse platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <NavLink to="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-7" icon={ArrowRight} iconPosition="right">
                Sign In to QUERIX
              </Button>
            </NavLink>
            <NavLink to="/signup" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-slate-300 border-slate-700 hover:bg-slate-800 px-7">
                Sign Up
              </Button>
            </NavLink>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 mt-auto text-center text-xs text-slate-500">
        <p className="mb-2">QUERIX — A Unified Multi-Tenant Lakehouse Analytics Platform</p>
        <p>© 2026 QUERIX. Turning Data into Insights.</p>
      </footer>
    </div>
  );
}

