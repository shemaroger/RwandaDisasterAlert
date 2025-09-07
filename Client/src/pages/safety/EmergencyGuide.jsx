// pages/safety/EmergencyGuide.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, Home, Zap, Cloud, Heart, Shield, 
  CheckCircle, Phone, ArrowLeft, ChevronDown, ChevronRight
} from 'lucide-react';

const EmergencyGuide = () => {
  const [selectedCategory, setSelectedCategory] = useState('flood');
  const [expandedSection, setExpandedSection] = useState(null);

  const emergencyTypes = [
    { id: 'flood', name: 'Flooding', icon: Cloud, color: 'blue' },
    { id: 'earthquake', name: 'Earthquake', icon: Zap, color: 'red' },
    { id: 'fire', name: 'Fire', icon: AlertTriangle, color: 'orange' },
    { id: 'health', name: 'Health Emergency', icon: Heart, color: 'green' },
    { id: 'general', name: 'General Preparedness', icon: Shield, color: 'purple' }
  ];

  const emergencyGuides = {
    flood: {
      before: [
        "Know your evacuation routes and higher ground locations",
        "Prepare an emergency kit with 3 days of supplies",
        "Store important documents in waterproof containers",
        "Register for emergency alerts on your phone",
        "Identify safe meeting points for your family"
      ],
      during: [
        "Move to higher ground immediately if water is rising",
        "Never walk or drive through flood water",
        "Stay away from downed power lines",
        "Listen to emergency broadcasts on radio",
        "Call 112 only for life-threatening emergencies"
      ],
      after: [
        "Wait for authorities to declare area safe",
        "Avoid flood water - it may be contaminated",
        "Check on neighbors, especially elderly",
        "Document damage with photos for insurance",
        "Boil water until authorities say it's safe"
      ]
    },
    earthquake: {
      before: [
        "Secure heavy furniture and objects to walls",
        "Practice Drop, Cover, and Hold On drills",
        "Keep emergency supplies in accessible locations",
        "Know how to turn off gas, water, and electricity",
        "Create a family communication plan"
      ],
      during: [
        "Drop to hands and knees immediately",
        "Take cover under sturdy furniture if available",
        "Hold on and protect your head and neck",
        "Stay where you are until shaking stops",
        "If outdoors, move away from buildings and trees"
      ],
      after: [
        "Check yourself and others for injuries",
        "Check for gas leaks and electrical damage",
        "Use battery-powered radio for information",
        "Stay out of damaged buildings",
        "Be prepared for aftershocks"
      ]
    },
    fire: {
      before: [
        "Install smoke detectors and check batteries monthly",
        "Plan and practice escape routes from every room",
        "Keep fire extinguishers in key locations",
        "Store flammable materials safely",
        "Know emergency contact numbers"
      ],
      during: [
        "Get out immediately - don't gather belongings",
        "Crawl low under smoke to avoid toxic fumes",
        "Feel doors before opening - don't open if hot",
        "Never use elevators during a fire",
        "Call 112 once you're safely outside"
      ],
      after: [
        "Stay outside until authorities say it's safe",
        "Get medical attention for smoke inhalation",
        "Contact insurance company to report damage",
        "Keep receipts for temporary housing expenses",
        "Don't enter damaged buildings"
      ]
    },
    health: {
      before: [
        "Keep a well-stocked first aid kit",
        "Know basic first aid and CPR",
        "Keep list of emergency contacts and medical info",
        "Maintain supply of prescription medications",
        "Know location of nearest health center"
      ],
      during: [
        "Call 112 for serious medical emergencies",
        "Provide first aid if trained and safe to do so",
        "Keep the person calm and comfortable",
        "Don't move someone with potential spinal injury",
        "Be prepared to provide information to responders"
      ],
      after: [
        "Follow up with healthcare providers as needed",
        "Monitor for delayed symptoms or complications",
        "Replenish first aid supplies that were used",
        "Document the incident for medical records",
        "Seek counseling if traumatic event"
      ]
    },
    general: {
      before: [
        "Create and practice a family emergency plan",
        "Build an emergency kit with essentials for 3+ days",
        "Stay informed about local hazards and risks",
        "Register for community alert systems",
        "Learn basic first aid and emergency skills"
      ],
      during: [
        "Stay calm and follow your emergency plan",
        "Listen to official emergency broadcasts",
        "Follow evacuation orders immediately",
        "Help others if you can do so safely",
        "Use 112 only for life-threatening emergencies"
      ],
      after: [
        "Check on family, neighbors, and community members",
        "Assess damage and document for authorities",
        "Follow official recovery and safety guidance",
        "Be patient as services are restored",
        "Take care of mental health and seek support"
      ]
    }
  };

  const currentGuide = emergencyGuides[selectedCategory];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <div className="border-l border-gray-300 h-6"></div>
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Emergency Preparedness Guide</h1>
              </div>
            </div>
            <Link
              to="/emergency-contacts"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Emergency Contacts
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Emergency Types */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Types</h2>
              <nav className="space-y-2">
                {emergencyTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedCategory === type.id;
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedCategory(type.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? `bg-${type.color}-100 text-${type.color}-700 border border-${type.color}-200`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {type.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const selectedType = emergencyTypes.find(t => t.id === selectedCategory);
                    const Icon = selectedType.icon;
                    return <Icon className={`w-8 h-8 text-${selectedType.color}-600`} />;
                  })()}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {emergencyTypes.find(t => t.id === selectedCategory)?.name} Emergency Guide
                    </h2>
                    <p className="text-gray-600">What to do before, during, and after</p>
                  </div>
                </div>
              </div>

              {/* Guide Content */}
              <div className="divide-y divide-gray-200">
                {/* Before Section */}
                <div className="p-6">
                  <button
                    onClick={() => toggleSection('before')}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Home className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Before the Emergency</h3>
                        <p className="text-sm text-gray-600">Preparation and planning</p>
                      </div>
                    </div>
                    {expandedSection === 'before' ? 
                      <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSection === 'before' && (
                    <div className="mt-4 ml-14">
                      <ul className="space-y-3">
                        {currentGuide.before.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* During Section */}
                <div className="p-6">
                  <button
                    onClick={() => toggleSection('during')}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">During the Emergency</h3>
                        <p className="text-sm text-gray-600">Immediate response actions</p>
                      </div>
                    </div>
                    {expandedSection === 'during' ? 
                      <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSection === 'during' && (
                    <div className="mt-4 ml-14">
                      <ul className="space-y-3">
                        {currentGuide.during.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* After Section */}
                <div className="p-6">
                  <button
                    onClick={() => toggleSection('after')}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">After the Emergency</h3>
                        <p className="text-sm text-gray-600">Recovery and safety</p>
                      </div>
                    </div>
                    {expandedSection === 'after' ? 
                      <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSection === 'after' && (
                    <div className="mt-4 ml-14">
                      <ul className="space-y-3">
                        {currentGuide.after.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Kit Section */}
            <div className="mt-8 bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Emergency Kit Essentials</h3>
                <p className="text-gray-600">Basic supplies every household should have</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Basic Supplies (3+ days)</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Water (1 gallon per person per day)</li>
                      <li>• Non-perishable food</li>
                      <li>• Battery-powered or hand crank radio</li>
                      <li>• Flashlight and extra batteries</li>
                      <li>• First aid kit</li>
                      <li>• Whistle for signaling help</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Additional Items</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Prescription medications</li>
                      <li>• Important documents (copies)</li>
                      <li>• Cash and credit cards</li>
                      <li>• Emergency contact information</li>
                      <li>• Blankets and sleeping bags</li>
                      <li>• Change of clothing and sturdy shoes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contacts Card */}
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Emergency Contacts</h3>
                  <p className="text-red-700">Always keep these numbers accessible</p>
                </div>
                <Phone className="w-8 h-8 text-red-600" />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">112</p>
                  <p className="text-sm text-red-700">Emergency Services</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">+250-788-000-000</p>
                  <p className="text-sm text-red-700">MINEMA</p>
                </div>
                <div className="text-center">
                  <Link
                    to="/emergency-contacts"
                    className="inline-block bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    View All Contacts
                  </Link>
                </div>
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
            <p className="mt-1">For emergencies, always call 112 first</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyGuide;