// pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, Shield, Phone, MapPin, Bell, Users, 
  CheckCircle, ArrowRight, Heart, Zap, Radio
} from 'lucide-react';

const Home = () => {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900/80 via-red-900/60 to-slate-900/80" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <div className="w-1 h-1 bg-red-400 rounded-full" />
          </div>
        ))}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" 
          style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Container */}
      <div className="relative z-10 fixed inset-0 flex flex-col">
        
        {/* Header */}
        <header className="bg-red-600/90 backdrop-blur-sm text-white border-b border-red-500/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">MINEMA Alert</h1>
                  <p className="text-red-100 text-sm">Emergency Management System</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="border border-white text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-700/20 backdrop-blur-sm border border-red-400/30 mb-4 shadow-2xl">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Stay Safe, Stay Informed
              </h2>
              <p className="text-lg text-slate-300 mb-6 max-w-3xl mx-auto">
                Rwanda's official emergency alert system connecting citizens, emergency responders, 
                and government agencies for effective disaster management and public safety.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/signup"
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/emergency-guide"
                  className="border border-red-400/50 text-red-300 bg-red-500/10 hover:bg-red-500/20 px-6 py-3 rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm"
                >
                  Emergency Guide
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl text-center">
                <div className="bg-red-500/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border border-red-400/30">
                  <Bell className="h-6 w-6 text-red-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Instant Alerts</h4>
                <p className="text-slate-300 text-sm">
                  Receive emergency notifications via SMS, mobile app, and email in multiple languages.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl text-center">
                <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-400/30">
                  <MapPin className="h-6 w-6 text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Location-Based</h4>
                <p className="text-slate-300 text-sm">
                  Get alerts relevant to your district and find nearby emergency shelters.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl text-center">
                <div className="bg-green-500/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border border-green-400/30">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Report & Respond</h4>
                <p className="text-slate-300 text-sm">
                  Report incidents, check in as safe, and access emergency resources.
                </p>
              </div>
            </div>

            {/* Emergency Info & Quick Access */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Emergency Contacts */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-red-400" />
                  Emergency Contacts
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-red-400 mr-2" />
                      <span className="font-medium text-white text-sm">Emergency Services</span>
                    </div>
                    <span className="text-xl font-bold text-red-400">112</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-blue-400 mr-2" />
                      <span className="font-medium text-white text-sm">MINEMA</span>
                    </div>
                    <span className="text-lg font-bold text-blue-400">+250-788-000-000</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 text-green-400 mr-2" />
                      <span className="font-medium text-white text-sm">Health Emergency</span>
                    </div>
                    <span className="text-lg font-bold text-green-400">+250-788-111-222</span>
                  </div>
                </div>
                
                <Link
                  to="/emergency-contacts"
                  className="block w-full mt-4 bg-slate-600/50 hover:bg-slate-600/70 text-white text-center py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm text-sm border border-slate-500/50"
                >
                  View All Emergency Contacts
                </Link>
              </div>

              {/* Quick Access */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                  Quick Access
                </h4>
                <div className="space-y-3">
                  <Link
                    to="/emergency-guide"
                    className="block bg-blue-500/20 hover:bg-blue-500/30 text-white p-3 rounded-lg transition-all duration-200 group border border-blue-400/30"
                  >
                    <div className="flex items-center">
                      <Zap className="w-5 h-5 mr-3 text-blue-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <h5 className="font-semibold text-sm">Emergency Guide</h5>
                        <p className="text-blue-200 text-xs">Learn emergency procedures</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/safety/checkin"
                    className="block bg-green-500/20 hover:bg-green-500/30 text-white p-3 rounded-lg transition-all duration-200 group border border-green-400/30"
                  >
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-3 text-green-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <h5 className="font-semibold text-sm">Safety Check-in</h5>
                        <p className="text-green-200 text-xs">Report your safety status</p>
                      </div>
                    </div>
                  </Link>

                  <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-400/30">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h5 className="text-sm font-semibold text-yellow-300">System Status</h5>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                          <span className="text-xs text-yellow-200">All systems operational</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-800/90 backdrop-blur-sm text-white border-t border-slate-700/50 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="font-bold">MINEMA Alert</span>
                </div>
                <p className="text-slate-300 text-xs">
                  Official emergency management system of the Republic of Rwanda.
                </p>
              </div>

              <div>
                <h5 className="font-semibold mb-2">Quick Links</h5>
                <div className="space-y-1 text-xs">
                  <Link to="/emergency-guide" className="block text-slate-300 hover:text-white transition-colors">Emergency Guide</Link>
                  <Link to="/emergency-contacts" className="block text-slate-300 hover:text-white transition-colors">Emergency Contacts</Link>
                  <Link to="/login" className="block text-slate-300 hover:text-white transition-colors">Sign In</Link>
                  <Link to="/signup" className="block text-slate-300 hover:text-white transition-colors">Create Account</Link>
                </div>
              </div>

              <div>
                <h5 className="font-semibold mb-2">Contact MINEMA</h5>
                <div className="space-y-1 text-slate-300 text-xs">
                  <p>Ministry of Emergency Management</p>
                  <p>Kigali, Rwanda</p>
                  <p>Phone: +250-788-000-000</p>
                  <p>Email: info@minema.gov.rw</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/50 mt-4 pt-4 text-center text-slate-400 text-xs">
              <p>&copy; 2024 MINEMA - Ministry of Emergency Management, Republic of Rwanda</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;