// pages/safety/EmergencyContacts.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, MapPin, Clock, Shield, Heart, Zap, 
  ArrowLeft, Search, Copy, ExternalLink
} from 'lucide-react';

const EmergencyContacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const contactCategories = [
    { id: 'all', name: 'All Contacts', icon: Phone },
    { id: 'emergency', name: 'Emergency Services', icon: Shield },
    { id: 'health', name: 'Health Services', icon: Heart },
    { id: 'government', name: 'Government', icon: Zap },
    { id: 'utilities', name: 'Utilities', icon: MapPin }
  ];

  const emergencyContacts = [
    {
      id: 1,
      category: 'emergency',
      name: 'Emergency Services',
      number: '112',
      description: 'Police, Fire, Medical Emergency',
      availability: '24/7',
      type: 'primary',
      languages: ['Kinyarwanda', 'English', 'French']
    },
    {
      id: 2,
      category: 'government',
      name: 'MINEMA Emergency Operations',
      number: '+250-788-000-000',
      description: 'Ministry of Emergency Management',
      availability: '24/7',
      type: 'primary',
      languages: ['Kinyarwanda', 'English', 'French']
    },
    {
      id: 3,
      category: 'health',
      name: 'Health Emergency Hotline',
      number: '+250-788-111-222',
      description: 'Medical emergencies and health advice',
      availability: '24/7',
      type: 'primary',
      languages: ['Kinyarwanda', 'English', 'French']
    },
    {
      id: 4,
      category: 'emergency',
      name: 'Rwanda National Police',
      number: '+250-788-311-155',
      description: 'Police headquarters and emergency dispatch',
      availability: '24/7',
      type: 'secondary'
    },
    {
      id: 5,
      category: 'emergency',
      name: 'Fire Brigade',
      number: '+250-788-311-222',
      description: 'Fire emergency and rescue services',
      availability: '24/7',
      type: 'secondary'
    },
    {
      id: 6,
      category: 'health',
      name: 'King Faisal Hospital',
      number: '+250-788-123-000',
      description: 'Major referral hospital emergency department',
      availability: '24/7',
      type: 'secondary',
      location: 'Kigali'
    },
    {
      id: 7,
      category: 'health',
      name: 'Rwanda Military Hospital',
      number: '+250-788-456-000',
      description: 'Military hospital emergency services',
      availability: '24/7',
      type: 'secondary',
      location: 'Kigali'
    },
    {
      id: 8,
      category: 'health',
      name: 'University Teaching Hospital (CHUK)',
      number: '+250-788-789-000',
      description: 'University hospital emergency department',
      availability: '24/7',
      type: 'secondary',
      location: 'Kigali'
    },
    {
      id: 9,
      category: 'government',
      name: 'Red Cross Rwanda',
      number: '+250-788-383-100',
      description: 'Disaster response and emergency assistance',
      availability: '24/7',
      type: 'secondary'
    },
    {
      id: 10,
      category: 'utilities',
      name: 'EUCL Emergency',
      number: '+250-788-311-911',
      description: 'Electricity utility emergency line',
      availability: '24/7',
      type: 'secondary'
    },
    {
      id: 11,
      category: 'utilities',
      name: 'WASAC Water Emergency',
      number: '+250-788-311-800',
      description: 'Water utility emergency and outages',
      availability: '24/7',
      type: 'secondary'
    },
    {
      id: 12,
      category: 'health',
      name: 'Poison Control Center',
      number: '+250-788-555-777',
      description: 'Poisoning emergencies and toxic exposure',
      availability: '24/7',
      type: 'secondary'
    }
  ];

  const filteredContacts = emergencyContacts.filter(contact => {
    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.number.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const callNumber = (number) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-red-100 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <div className="border-l border-red-400 h-6"></div>
              <div className="flex items-center space-x-2">
                <Phone className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Emergency Contacts</h1>
              </div>
            </div>
            <Link
              to="/emergency-guide"
              className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
            >
              Emergency Guide
            </Link>
          </div>
        </div>
      </div>

      {/* Priority Contacts Banner */}
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h2 className="text-lg font-semibold text-red-800 mb-3">Priority Emergency Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => callNumber('112')}
              className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              <div className="text-center">
                <p className="text-3xl font-bold">112</p>
                <p className="text-sm">All Emergency Services</p>
              </div>
            </button>
            <button
              onClick={() => callNumber('+250-788-000-000')}
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <div className="text-center">
                <p className="text-lg font-bold">+250-788-000-000</p>
                <p className="text-sm">MINEMA Operations</p>
              </div>
            </button>
            <button
              onClick={() => callNumber('+250-788-111-222')}
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <div className="text-center">
                <p className="text-lg font-bold">+250-788-111-222</p>
                <p className="text-sm">Health Emergency</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search contacts by name, service, or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {contactCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white rounded-lg shadow border-l-4 transition-shadow hover:shadow-lg ${
                contact.type === 'primary' 
                  ? 'border-l-red-500' 
                  : 'border-l-blue-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                    <p className="text-sm text-gray-600">{contact.description}</p>
                  </div>
                  {contact.type === 'primary' && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      Priority
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Phone Number */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-mono text-lg font-semibold text-gray-900">
                        {contact.number}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(contact.number)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Copy number"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => callNumber(contact.number)}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Call now"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Available: {contact.availability}</span>
                  </div>

                  {/* Location (if available) */}
                  {contact.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{contact.location}</span>
                    </div>
                  )}

                  {/* Languages (if available) */}
                  {contact.languages && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.languages.map((language) => (
                        <span
                          key={language}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Call Button */}
                <button
                  onClick={() => callNumber(contact.number)}
                  className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors ${
                    contact.type === 'primary'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Call Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Phone className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Important Notice */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Important Emergency Information</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Always call <strong>112</strong> first for life-threatening emergencies</li>
                  <li>Provide clear location information when calling emergency services</li>
                  <li>Keep these numbers accessible offline (written down or saved in phone)</li>
                  <li>If you cannot speak, stay on the line - emergency services can trace calls</li>
                  <li>For non-emergency situations, use the appropriate direct numbers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 MINEMA - Ministry of Emergency Management, Republic of Rwanda</p>
            <p className="mt-1">Emergency numbers are monitored 24/7 by trained professionals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;