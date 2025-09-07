// pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, Shield, Phone, MapPin, Bell, Users, 
  CheckCircle, ArrowRight, Heart, Zap, Radio
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RwandaDisasterAlert</h1>
                <p className="text-red-100">Emergency Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="border border-white text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Stay Safe, Stay Informed
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Rwanda's official emergency alert system connecting citizens, emergency responders, 
              and government agencies for effective disaster management and public safety.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/signup"
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/emergency-guide"
                className="border border-red-600 text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Emergency Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Emergency Management
            </h3>
            <p className="text-lg text-gray-600">
              Multi-channel alerts, real-time coordination, and community safety features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Instant Alerts</h4>
              <p className="text-gray-600">
                Receive emergency notifications via SMS, mobile app, and email in Kinyarwanda, 
                English, or French.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Location-Based</h4>
              <p className="text-gray-600">
                Get alerts relevant to your district and find nearby emergency shelters 
                and safe areas.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Report & Respond</h4>
              <p className="text-gray-600">
                Report incidents, check in as safe, and access emergency resources 
                during disasters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Always Ready for Emergencies
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Our system operates 24/7 to ensure you receive critical information when it matters most. 
                Connected to all major telecom networks and emergency services across Rwanda.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Multi-language support (Kinyarwanda, English, French)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Connected to all Rwanda telecom networks</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Real-time weather and disaster monitoring</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Direct coordination with MINEMA</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Emergency Contacts
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <Phone className="h-6 w-6 text-red-600 mr-3" />
                    <span className="font-medium text-gray-900">Emergency Services</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">112</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-900">MINEMA</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">+250-788-000-000</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Heart className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Health Emergency</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">+250-788-111-222</span>
                </div>
              </div>
              
              <Link
                to="/emergency-contacts"
                className="block w-full mt-6 bg-gray-600 text-white text-center py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                View All Emergency Contacts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Quick Access
            </h3>
            <p className="text-lg text-gray-600">
              Essential emergency resources available to everyone
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              to="/emergency-guide"
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors group"
            >
              <Zap className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-xl font-semibold mb-2">Emergency Guide</h4>
              <p className="text-blue-100">
                Learn what to do before, during, and after emergencies
              </p>
            </Link>

            <Link
              to="/emergency-contacts"
              className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg transition-colors group"
            >
              <Phone className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-xl font-semibold mb-2">Emergency Contacts</h4>
              <p className="text-red-100">
                Essential phone numbers and contact information
              </p>
            </Link>

            <Link
              to="/safety/checkin"
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors group"
            >
              <CheckCircle className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-xl font-semibold mb-2">Safety Check-in</h4>
              <p className="text-green-100">
                Let others know you're safe during emergencies
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <span className="text-xl font-bold">RwandaDisasterAlert</span>
              </div>
              <p className="text-gray-300">
                Official emergency management system of the Republic of Rwanda, 
                operated by MINEMA.
              </p>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2">
                <li><Link to="/emergency-guide" className="text-gray-300 hover:text-white">Emergency Guide</Link></li>
                <li><Link to="/emergency-contacts" className="text-gray-300 hover:text-white">Emergency Contacts</Link></li>
                <li><Link to="/login" className="text-gray-300 hover:text-white">Sign In</Link></li>
                <li><Link to="/signup" className="text-gray-300 hover:text-white">Create Account</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">Contact MINEMA</h5>
              <div className="space-y-2 text-gray-300">
                <p>Ministry of Emergency Management</p>
                <p>Kigali, Rwanda</p>
                <p>Phone: +250-788-000-000</p>
                <p>Email: info@minema.gov.rw</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MINEMA - Ministry of Emergency Management, Republic of Rwanda</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;