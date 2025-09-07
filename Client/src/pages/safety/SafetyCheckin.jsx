// pages/safety/SafetyCheckin.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, AlertTriangle, ArrowLeft, MapPin, Clock,
  Users, Heart, Phone, Send, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SafetyCheckin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [checkinData, setCheckinData] = useState({
    status: '',
    location: '',
    note: '',
    contactInfo: '',
    needsHelp: false,
    familyMembers: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setCheckinData(prev => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          }));
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate API call to submit safety check-in
      console.log('Safety check-in submitted:', checkinData);
      
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCheckinData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Check-in Submitted
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your safety status has been recorded and shared with emergency responders. 
            Thank you for helping us coordinate our response efforts.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setCheckinData({
                  status: '',
                  location: '',
                  note: '',
                  contactInfo: '',
                  needsHelp: false,
                  familyMembers: ''
                });
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Another Check-in
            </button>
            
            <Link
              to={isAuthenticated() ? '/dashboard' : '/'}
              className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need immediate help?</strong><br />
              Call 112 for emergency services or +250-788-000-000 for MINEMA
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={isAuthenticated() ? '/dashboard' : '/'}
                className="flex items-center text-green-100 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Link>
              <div className="border-l border-green-400 h-6"></div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Safety Check-in</h1>
              </div>
            </div>
            <Link
              to="/emergency-contacts"
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
            >
              Emergency Contacts
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Your Safety Status</h2>
          <p className="text-gray-600 mb-4">
            During emergencies, letting authorities know your safety status helps coordinate 
            response efforts and resources. Your information will be shared with emergency 
            responders to ensure appropriate assistance is provided.
          </p>
          
          {!isAuthenticated() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Anonymous Check-in:</strong> You can submit a safety check-in without 
                an account. For personalized alerts and better coordination, consider{' '}
                <Link to="/signup" className="underline hover:text-blue-900">
                  creating an account
                </Link>.
              </p>
            </div>
          )}
        </div>

        {/* Check-in Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Safety Status Report</h3>
            <p className="text-gray-600">All fields are optional, but more information helps responders</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Safety Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What is your current safety status? *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="status"
                    value="safe"
                    checked={checkinData.status === 'safe'}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    checkinData.status === 'safe'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}>
                    <div className="flex items-center">
                      <CheckCircle className={`w-6 h-6 mr-3 ${
                        checkinData.status === 'safe' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">I'm Safe</h4>
                        <p className="text-sm text-gray-600">I am unharmed and in a secure location</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="status"
                    value="need_help"
                    checked={checkinData.status === 'need_help'}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    checkinData.status === 'need_help'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}>
                    <div className="flex items-center">
                      <AlertTriangle className={`w-6 h-6 mr-3 ${
                        checkinData.status === 'need_help' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">I Need Help</h4>
                        <p className="text-sm text-gray-600">I require emergency assistance</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Location
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="location"
                  value={checkinData.location}
                  onChange={handleChange}
                  placeholder="Enter your current location or address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Use GPS
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Providing your location helps emergency responders find you quickly
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information
              </label>
              <input
                type="text"
                name="contactInfo"
                value={checkinData.contactInfo}
                onChange={handleChange}
                placeholder="Phone number or email (if different from account)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {user && (
                <p className="text-xs text-gray-500 mt-1">
                  Default contact: {user.email} {user.phone && `• ${user.phone}`}
                </p>
              )}
            </div>

            {/* Family Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family/Group Members Status
              </label>
              <textarea
                name="familyMembers"
                value={checkinData.familyMembers}
                onChange={handleChange}
                rows={3}
                placeholder="List family members or group members and their status (e.g., 'John - safe, Mary - safe, Peter - unknown')"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                name="note"
                value={checkinData.note}
                onChange={handleChange}
                rows={4}
                placeholder="Any additional information that might help emergency responders (injuries, resources needed, shelter status, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Help Needed Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                name="needsHelp"
                checked={checkinData.needsHelp}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <label className="text-sm font-medium text-gray-700">
                  I need immediate assistance
                </label>
                <p className="text-xs text-gray-500">
                  Check this if you require urgent help from emergency services
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Check-in...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Safety Check-in
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Important Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Life-Threatening Emergency?</h3>
                <p className="text-sm text-red-700 mt-2">
                  If you are in immediate danger or need urgent medical assistance, 
                  <strong> call 112 immediately</strong>. Do not rely solely on this check-in form 
                  for emergency response.
                </p>
                <div className="mt-3">
                  <a
                    href="tel:112"
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call 112 Now
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Users className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-blue-800">Help Others Check In</h3>
                <p className="text-sm text-blue-700 mt-2">
                  If you're safe, help elderly neighbors, people with disabilities, 
                  or others who might need assistance submitting their safety status. 
                  Community support saves lives.
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Help Others Check In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy & Information Use</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              • Your safety check-in information will be shared with authorized emergency responders 
              and government agencies involved in disaster response.
            </p>
            <p>
              • Location data is used solely for emergency response coordination and will not be 
              used for other purposes.
            </p>
            <p>
              • Your information helps responders prioritize resources and coordinate rescue efforts 
              more effectively.
            </p>
            <p>
              • Check-in data is retained for emergency response duration and statistical analysis 
              to improve future emergency preparedness.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 MINEMA - Ministry of Emergency Management, Republic of Rwanda</p>
            <p className="mt-1">Your safety information helps save lives during emergencies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyCheckin;