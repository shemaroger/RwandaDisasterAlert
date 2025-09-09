import React, { useState, useEffect } from 'react';
import { Shield, Bell, MapPin, Globe, Wifi, Users, TrendingUp, Phone, Mail, Map, ExternalLink, Menu, X, AlertTriangle, Wind, CheckCircle, ArrowRight, Play, Download, Send } from 'lucide-react';

const RwandaDisasterAlert = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      
      // Update active section based on scroll position
      const sections = ['home', 'features', 'how-it-works', 'about', 'contact'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 200 && rect.bottom >= 200;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = () => {
    alert('Thank you for your message! We will get back to you within 24 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  // Navigation component
  const Navigation = () => (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-white shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <span className="text-xl font-bold text-gray-900">RwandaDisasterAlert</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {[
              { id: 'home', label: 'Home' },
              { id: 'features', label: 'Features' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'about', label: 'About' },
              { id: 'contact', label: 'Contact' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeSection === id
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
            <button 
              onClick={() => alert('🚨 Emergency Numbers:\n112 - General Emergency\n113 - Fire Department\n114 - Medical Emergency')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
            >
              <AlertTriangle className="h-4 w-4 mr-2 inline" />
              Emergency
            </button>
          </div>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-gray-900"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {[
                { id: 'home', label: 'Home' },
                { id: 'features', label: 'Features' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'about', label: 'About' },
                { id: 'contact', label: 'Contact' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600"
                >
                  {label}
                </button>
              ))}
              <button 
                onClick={() => alert('🚨 Emergency Numbers:\n112 - General Emergency\n113 - Fire Department\n114 - Medical Emergency')}
                className="w-full text-left bg-red-600 text-white px-3 py-2 rounded-lg font-medium"
              >
                <AlertTriangle className="h-4 w-4 mr-2 inline" />
                Emergency
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );

  // Alert Demo Component
  const AlertDemo = () => (
    <div className="relative z-10 animate-bounce">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm mx-auto">
        <div className="bg-red-600 text-white p-4 rounded-2xl mb-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <span className="font-bold">FLOOD ALERT</span>
          </div>
          <p className="text-sm">Heavy rainfall expected in Nyamirambo. Evacuation recommended for low-lying areas.</p>
          <div className="mt-3 flex justify-between items-center text-xs">
            <span>Ministry of Emergency Management</span>
            <span>2 min ago</span>
          </div>
        </div>
        <div className="bg-orange-600 text-white p-4 rounded-2xl mb-4">
          <div className="flex items-center mb-2">
            <Wind className="h-5 w-5 mr-3" />
            <span className="font-bold">WEATHER WARNING</span>
          </div>
          <p className="text-sm">Strong winds forecasted. Secure outdoor items and avoid travel if possible.</p>
        </div>
        <div className="text-center">
          <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors">
            <CheckCircle className="h-4 w-4 mr-2 inline" />
            Mark Safe
          </button>
        </div>
      </div>
    </div>
  );

  // Stats Component
  const StatsSection = () => {
    const stats = [
      { value: '12M+', label: 'Citizens Reached', color: 'text-blue-600' },
      { value: '99.9%', label: 'System Uptime', color: 'text-green-600' },
      { value: '<30s', label: 'Alert Delivery Time', color: 'text-orange-600' },
      { value: '24/7', label: 'Emergency Monitoring', color: 'text-red-600' }
    ];

    return (
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Features Component
  const FeaturesSection = () => {
    const features = [
      {
        icon: Bell,
        title: 'Real-Time Alerts',
        description: 'Instant notifications about floods, earthquakes, fires, or epidemics through multiple channels including SMS, push notifications, and email.',
        color: 'bg-red-100 text-red-600'
      },
      {
        icon: MapPin,
        title: 'Location-Based Alerts',
        description: 'Geofencing technology delivers targeted messages based on affected districts or zones using GPS and GIS data.',
        color: 'bg-blue-100 text-blue-600'
      },
      {
        icon: Globe,
        title: 'Multilingual Support',
        description: 'Accessible alerts in Kinyarwanda, English, and French to ensure everyone receives critical information.',
        color: 'bg-green-100 text-green-600'
      },
      {
        icon: Wifi,
        title: 'Offline Access',
        description: 'Critical messages cached for users with unstable networks, ensuring no one is left without vital emergency information.',
        color: 'bg-orange-100 text-orange-600'
      },
      {
        icon: Users,
        title: 'Citizen Engagement',
        description: 'Public can report incidents, request help, and provide status updates, creating a community-driven safety network.',
        color: 'bg-yellow-100 text-yellow-600'
      },
      {
        icon: TrendingUp,
        title: 'Analytics Dashboard',
        description: 'Comprehensive data analysis for authorities to monitor events, track responses, and improve future emergency strategies.',
        color: 'bg-purple-100 text-purple-600'
      }
    ];

    return (
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Comprehensive Emergency Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Our advanced system provides multiple layers of protection and communication to keep Rwanda safe</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // How It Works Component
  const HowItWorksSection = () => {
    const steps = [
      {
        number: 1,
        title: 'Detection & Assessment',
        description: 'Emergency management authorities monitor conditions and assess potential threats using advanced monitoring systems.',
        color: 'bg-red-600'
      },
      {
        number: 2,
        title: 'Alert Generation',
        description: 'Authorized personnel create and customize emergency alerts through our centralized admin portal with location targeting.',
        color: 'bg-orange-600'
      },
      {
        number: 3,
        title: 'Instant Delivery',
        description: 'Alerts are instantly distributed via SMS, mobile app notifications, email, and web platforms to all affected citizens.',
        color: 'bg-green-600'
      }
    ];

    return (
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">A simple, effective process that ensures rapid emergency communication</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${step.color}`}>
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // About Section Component
  const AboutSection = () => (
    <section id="about" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">About RwandaDisasterAlert</h2>
            <p className="text-lg text-gray-600 mb-6">
              RwandaDisasterAlert is Rwanda's comprehensive digital early warning and emergency alert system, 
              developed to enhance national preparedness and real-time communication during disasters.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: 'Improved Response Time',
                  description: 'Citizens are informed faster, enabling quicker protective actions and reducing casualties.'
                },
                {
                  title: 'Enhanced Public Safety',
                  description: 'People receive preparedness tips and safety guidance before and during emergencies.'
                },
                {
                  title: 'Data-Driven Management',
                  description: 'Authorities analyze responses and improve future emergency management strategies.'
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="text-green-600 h-6 w-6 mr-4 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-semibold mb-6">Key Objectives</h3>
            <ul className="space-y-3">
              {[
                'Build centralized emergency alert platform',
                'Integrate with telecom operators for mass SMS',
                'Provide multilingual accessibility',
                'Create comprehensive mobile application',
                'Enable location-based alert targeting',
                'Log events for post-disaster analysis'
              ].map((objective, index) => (
                <li key={index} className="flex items-center">
                  <ArrowRight className="text-blue-600 h-5 w-5 mr-3" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  // Emergency Contact Section
  const EmergencyContactSection = () => (
    <section className="bg-red-600 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-white">
          <h2 className="text-3xl font-bold mb-4">Emergency Contacts</h2>
          <p className="text-xl mb-8 text-red-100">In case of immediate emergency, contact these numbers</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Phone, title: 'Emergency Hotline', number: '112' },
              { icon: AlertTriangle, title: 'Fire Department', number: '113' },
              { icon: Phone, title: 'Medical Emergency', number: '114' }
            ].map((contact, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <contact.icon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{contact.title}</h3>
                <p className="text-2xl font-bold">{contact.number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  // Contact Form Component
  const ContactSection = () => (
    <section id="contact" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Have questions about RwandaDisasterAlert? Contact our team for more information</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
            <div className="space-y-4">
              {[
                { icon: Map, text: 'Ministry of Emergency Management, Kigali, Rwanda' },
                { icon: Phone, text: '+250 788 123 456' },
                { icon: Mail, text: 'info@rwandadisasteralert.gov.rw' },
                { icon: ExternalLink, text: 'www.rwandadisasteralert.gov.rw' }
              ].map((contact, index) => (
                <div key={index} className="flex items-center">
                  <contact.icon className="text-blue-600 h-5 w-5 mr-4" />
                  <span>{contact.text}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'instagram'].map((social, index) => (
                  <button
                    key={index}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-2xl">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all duration-200 resize-none"
                />
              </div>
              <button
                onClick={handleFormSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Footer Component
  const Footer = () => (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold">RwandaDisasterAlert</span>
            </div>
            <p className="text-gray-400 mb-4">Keeping Rwanda safe through advanced emergency notification and disaster management technology.</p>
            <div className="flex space-x-4">
              {['twitter', 'facebook', 'instagram'].map((social, index) => (
                <button key={index} className="text-gray-400 hover:text-white transition-colors duration-200">
                  <ExternalLink className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              {['Home', 'Features', 'How It Works', 'About', 'Contact'].map((link, index) => (
                <li key={index}>
                  <button className="hover:text-white transition-colors duration-200">{link}</button>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              {['Emergency Alerts', 'Weather Warnings', 'Safety Guidelines', 'Evacuation Plans', 'Community Reports'].map((service, index) => (
                <li key={index}>
                  <button className="hover:text-white transition-colors duration-200">{service}</button>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Emergency Resources</h4>
            <ul className="space-y-2 text-gray-400">
              {['Emergency Hotline: 112', 'Fire Department: 113', 'Medical Emergency: 114', 'Disaster Preparedness', 'Safety Tips'].map((resource, index) => (
                <li key={index}>
                  <button className="hover:text-white transition-colors duration-200">{resource}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 RwandaDisasterAlert. All rights reserved. Developed for the Ministry of Emergency Management, Republic of Rwanda.</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="font-sans bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section id="home" className="pt-16 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-pulse">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Stay Safe, Stay <span className="text-yellow-400">Alert</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100 leading-relaxed">
                Rwanda's first comprehensive digital early warning and emergency alert system. 
                Get real-time notifications, safety guidance, and evacuation instructions during disasters.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => alert('📱 The RwandaDisasterAlert mobile app will be available soon on Google Play Store and Apple App Store!')}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download App
                </button>
                <button 
                  onClick={() => alert('🎥 Demo video coming soon! This will showcase how RwandaDisasterAlert works to keep citizens safe during emergencies.')}
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Demo
                </button>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-blue-200">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span>1M+ Citizens Protected</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>24/7 Monitoring</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <AlertDemo />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-green-600 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AboutSection />
      <EmergencyContactSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default RwandaDisasterAlert;