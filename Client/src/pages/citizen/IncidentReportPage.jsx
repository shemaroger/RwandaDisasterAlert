
// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   Camera, 
//   MapPin, 
//   AlertTriangle, 
//   Upload, 
//   X, 
//   CheckCircle, 
//   Loader2,
//   Phone,
//   Clock,
//   Users,
//   Building,
//   Navigation,
//   Monitor,
//   Smartphone
// } from 'lucide-react';

// // Import your actual API service
// // import apiService from '../services/api';

// // For demo purposes - replace with actual API service import
// const apiService = {
//   getDisasterTypes: () => {
//     // This should connect to your actual API
//     throw new Error('Please import your actual API service');
//   },
//   getLocations: () => {
//     // This should connect to your actual API
//     throw new Error('Please import your actual API service');
//   },
//   createIncident: (data) => {
//     // This should connect to your actual API
//     throw new Error('Please import your actual API service');
//   }
// };

// const IncidentReportPage = () => {
//   const [formData, setFormData] = useState({
//     report_type: '',
//     disaster_type: '',
//     title: '',
//     description: '',
//     location: '',
//     address: '',
//     latitude: null,
//     longitude: null,
//     casualties: '',
//     property_damage: '',
//     immediate_needs: ''
//   });

//   const [mediaFiles, setMediaFiles] = useState({
//     images: [],
//     videos: []
//   });

//   const [loading, setLoading] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [disasterTypes, setDisasterTypes] = useState([]);
//   const [locations, setLocations] = useState([]);
//   const [locationLoading, setLocationLoading] = useState(false);
  
//   const fileInputRef = useRef(null);
//   const videoInputRef = useRef(null);

//   const REPORT_TYPES = [
//     { value: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
//     { value: 'hazard', label: 'Hazard', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
//     { value: 'infrastructure', label: 'Infrastructure Damage', icon: Building, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
//     { value: 'health', label: 'Health Emergency', icon: Phone, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-200' },
//     { value: 'security', label: 'Security Incident', icon: AlertTriangle, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
//     { value: 'other', label: 'Other', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' }
//   ];

//   useEffect(() => {
//     loadInitialData();
//     getCurrentLocation();
//   }, []);

//   const loadInitialData = async () => {
//     try {
//       const [disasterTypesRes, locationsRes] = await Promise.all([
//         apiService.getDisasterTypes(),
//         apiService.getLocations()
//       ]);
      
//       setDisasterTypes(disasterTypesRes.results || []);
//       setLocations(locationsRes.results || []);
//     } catch (error) {
//       console.error('Failed to load initial data:', error);
//       // Handle error appropriately - show user message, etc.
//       setErrors(prev => ({
//         ...prev,
//         loading: 'Failed to load form data. Please refresh the page.'
//       }));
//     }
//   };

//   const getCurrentLocation = () => {
//     setLocationLoading(true);
    
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setFormData(prev => ({
//             ...prev,
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude
//           }));
//           setLocationLoading(false);
//         },
//         (error) => {
//           console.warn('Location access denied:', error);
//           setLocationLoading(false);
//         },
//         { 
//           enableHighAccuracy: true, 
//           timeout: 10000, 
//           maximumAge: 300000 
//         }
//       );
//     } else {
//       setLocationLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
    
//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({
//         ...prev,
//         [name]: null
//       }));
//     }
//   };

//   const handleFileUpload = (e, type) => {
//     const files = Array.from(e.target.files);
//     const maxSize = 10 * 1024 * 1024; // 10MB
//     const validFiles = [];
//     const newErrors = {};

//     files.forEach(file => {
//       if (file.size > maxSize) {
//         newErrors[`${type}_size`] = 'File size must be less than 10MB';
//         return;
//       }
      
//       if (type === 'images' && !file.type.startsWith('image/')) {
//         newErrors[`${type}_type`] = 'Only image files are allowed';
//         return;
//       }
      
//       if (type === 'videos' && !file.type.startsWith('video/')) {
//         newErrors[`${type}_type`] = 'Only video files are allowed';
//         return;
//       }
      
//       validFiles.push(file);
//     });

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(prev => ({ ...prev, ...newErrors }));
//       return;
//     }

//     setMediaFiles(prev => ({
//       ...prev,
//       [type]: [...prev[type], ...validFiles]
//     }));

//     // Clear input
//     e.target.value = '';
//   };

//   const removeFile = (type, index) => {
//     setMediaFiles(prev => ({
//       ...prev,
//       [type]: prev[type].filter((_, i) => i !== index)
//     }));
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.report_type) {
//       newErrors.report_type = 'Please select a report type';
//     }

//     if (!formData.title.trim()) {
//       newErrors.title = 'Title is required';
//     } else if (formData.title.length < 5) {
//       newErrors.title = 'Title must be at least 5 characters';
//     }

//     if (!formData.description.trim()) {
//       newErrors.description = 'Description is required';
//     } else if (formData.description.length < 10) {
//       newErrors.description = 'Description must be at least 10 characters';
//     }

//     if (formData.casualties && isNaN(formData.casualties)) {
//       newErrors.casualties = 'Casualties must be a number';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);
    
//     try {
//       const submitData = new FormData();
      
//       // Add form data
//       Object.keys(formData).forEach(key => {
//         if (formData[key] !== null && formData[key] !== '') {
//           submitData.append(key, formData[key]);
//         }
//       });

//       // Add media files
//       mediaFiles.images.forEach((file, index) => {
//         submitData.append(`images[${index}]`, file);
//       });
      
//       mediaFiles.videos.forEach((file, index) => {
//         submitData.append(`videos[${index}]`, file);
//       });

//       const result = await apiService.createIncident(submitData);
      
//       console.log('Incident created:', result);
//       setSubmitted(true);
      
//     } catch (error) {
//       console.error('Failed to submit incident:', error);
//       setErrors(prev => ({
//         ...prev,
//         submit: error.message || 'Failed to submit incident. Please try again.'
//       }));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       report_type: '',
//       disaster_type: '',
//       title: '',
//       description: '',
//       location: '',
//       address: '',
//       latitude: null,
//       longitude: null,
//       casualties: '',
//       property_damage: '',
//       immediate_needs: ''
//     });
//     setMediaFiles({
//       images: [],
//       videos: []
//     });
//     setSubmitted(false);
//     setErrors({});
//   };

//   if (submitted) {
//     return (
//       <div className="min-h-screen bg-gray-50 py-12">
//         <div className="max-w-2xl mx-auto px-4">
//           <div className="bg-white rounded-xl shadow-lg p-8 text-center">
//             <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">
//               Report Submitted Successfully
//             </h2>
//             <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
//               <p className="text-green-800 mb-2">
//                 Your incident report has been received and is being reviewed by emergency services.
//               </p>
//               <p className="text-sm text-green-600">
//                 You will be notified of any updates via your preferred contact method.
//               </p>
//             </div>
            
//             <div className="grid md:grid-cols-2 gap-4">
//               <button
//                 onClick={resetForm}
//                 className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
//               >
//                 Report Another Incident
//               </button>
//               <button
//                 onClick={() => window.location.href = '/'}
//                 className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
//               >
//                 Back to Home
//               </button>
//             </div>

//             {/* Access other platforms info */}
//             <div className="mt-8 pt-6 border-t border-gray-200">
//               <p className="text-sm text-gray-600 mb-4">Need to report on the go?</p>
//               <div className="flex justify-center gap-4 text-sm">
//                 <div className="flex items-center gap-2">
//                   <Smartphone className="w-4 h-4 text-blue-500" />
//                   <span>Download our mobile app</span>
//                 {/* Incident Title */}
//               <div>
//                 <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
//                   Incident Title *
//                 </label>
//                 <input
//                   type="text"
//                   id="title"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   placeholder="Brief, clear title describing what happened (e.g., 'House fire on Main Street')"
//                   maxLength="200"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                     errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                 />
//                 <div className="mt-1 flex justify-between text-sm">
//                   <div>
//                     {errors.title && (
//                       <span className="text-red-600 flex items-center gap-1">
//                         <AlertTriangle className="w-4 h-4" />
//                         {errors.title}
//                       </span>
//                     )}
//                   </div>
//                   <span className="text-gray-500">{formData.title.length}/200</span>
//                 </div>
//               </div>

//               {/* Detailed Description */}
//               <div>
//                 <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
//                   Detailed Description *
//                 </label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   rows={5}
//                   placeholder="Provide as much detail as possible:&#10;• What exactly happened?&#10;• When did it occur?&#10;• Current situation?&#10;• Any immediate dangers?"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                     errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                 />
//                 <div className="mt-1 flex justify-between text-sm">
//                   <div>
//                     {errors.description && (
//                       <span className="text-red-600 flex items-center gap-1">
//                         <AlertTriangle className="w-4 h-4" />
//                         {errors.description}
//                       </span>
//                     )}
//                   </div>
//                   <span className="text-gray-500">{formData.description.length} characters</span>
//                 </div>
//               </div>

//               {/* Location Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                
//                 <div>
//                   <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-2">
//                     Specific Location/Address
//                   </label>
//                   <div className="relative">
//                     <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
//                     <textarea
//                       id="address"
//                       name="address"
//                       value={formData.address}
//                       onChange={handleInputChange}
//                       rows={3}
//                       placeholder="Enter specific address, street names, landmarks, or detailed location description..."
//                       className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 </div>

//                 {/* GPS Location */}
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <h4 className="font-medium text-blue-900">GPS Location</h4>
//                       <p className="text-sm text-blue-700">Help responders find the exact location</p>
//                     </div>
                    
//                     <div className="text-right">
//                       {locationLoading ? (
//                         <div className="flex items-center gap-2">
//                           <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                           <span className="text-sm text-blue-600">Getting location...</span>
//                         </div>
//                       ) : formData.latitude && formData.longitude ? (
//                         <div className="flex items-center gap-2">
//                           <Navigation className="w-4 h-4 text-green-500" />
//                           <div className="text-sm">
//                             <div className="text-green-600 font-medium">Location captured</div>
//                             <div className="text-green-500 text-xs">
//                               {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
//                             </div>
//                           </div>
//                         </div>
//                       ) : (
//                         <button
//                           type="button"
//                           onClick={getCurrentLocation}
//                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
//                         >
//                           Get Current Location
//                         </button>
//                       )}
//                     </div>
//                   </div>
                  
//                   {errors.location && (
//                     <div className="mt-2 text-sm text-amber-600">
//                       {errors.location}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Impact Assessment */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Impact Assessment</h3>
                
//                 <div className="grid md:grid-cols-3 gap-4">
//                   {/* Casualties */}
//                   <div>
//                     <label htmlFor="casualties" className="block text-sm font-semibold text-gray-900 mb-2">
//                       People Affected
//                     </label>
//                     <div className="relative">
//                       <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//                       <input
//                         type="number"
//                         id="casualties"
//                         name="casualties"
//                         value={formData.casualties}
//                         onChange={handleInputChange}
//                         min="0"
//                         max="9999"
//                         placeholder="Number of people"
//                         className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                           errors.casualties ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                         }`}
//                       />
//                     </div>
//                     {errors.casualties && (
//                       <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
//                         <AlertTriangle className="w-4 h-4" />
//                         {errors.casualties}
//                       </p>
//                     )}
//                   </div>

//                   {/* Property Damage */}
//                   <div className="md:col-span-2">
//                     <label htmlFor="property_damage" className="block text-sm font-semibold text-gray-900 mb-2">
//                       Property/Infrastructure Damage
//                     </label>
//                     <input
//                       type="text"
//                       id="property_damage"
//                       name="property_damage"
//                       value={formData.property_damage}
//                       onChange={handleInputChange}
//                       placeholder="Describe any damage to buildings, roads, utilities, etc."
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 </div>

//                 {/* Immediate Needs */}
//                 <div>
//                   <label htmlFor="immediate_needs" className="block text-sm font-semibold text-gray-900 mb-2">
//                     Immediate Assistance Required
//                   </label>
//                   <textarea
//                     id="immediate_needs"
//                     name="immediate_needs"
//                     value={formData.immediate_needs}
//                     onChange={handleInputChange}
//                     rows={3}
//                     placeholder="What help is needed right now? (medical assistance, fire department, evacuation, rescue equipment, supplies, etc.)"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               {/* Media Upload */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Photos and Videos</h3>
//                 <p className="text-sm text-gray-600">Visual evidence helps emergency responders understand the situation better</p>
                
//                 <div className="grid md:grid-cols-2 gap-6">
//                   {/* Image Upload */}
//                   <div>
//                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
//                       <Camera className="w-8 h-8 text-gray-400 mx-auto mb-3" />
//                       <h4 className="font-medium text-gray-900 mb-2">Add Photos</h4>
//                       <p className="text-sm text-gray-500 mb-4">Upload images of the incident scene</p>
//                       <button
//                         type="button"
//                         onClick={() => fileInputRef.current?.click()}
//                         disabled={mediaFiles.images.length >= 5}
//                         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
//                       >
//                         Choose Photos
//                       </button>
//                       <p className="text-xs text-gray-400 mt-2">Max 10MB per file • Max 5 photos</p>
//                     </div>
//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       accept="image/*"
//                       multiple
//                       onChange={(e) => handleFileUpload(e, 'images')}
//                       className="hidden"
//                     />
//                     {(errors.images_size || errors.images_type || errors.images_count) && (
//                       <div className="mt-2 space-y-1">
//                         {errors.images_size && <p className="text-sm text-red-600">{errors.images_size}</p>}
//                         {errors.images_type && <p className="text-sm text-red-600">{errors.images_type}</p>}
//                         {errors.images_count && <p className="text-sm text-red-600">{errors.images_count}</p>}
//                       </div>
//                     )}
//                   </div>

//                   {/* Video Upload */}
//                   <div>
//                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
//                       <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
//                       <h4 className="font-medium text-gray-900 mb-2">Add Videos</h4>
//                       <p className="text-sm text-gray-500 mb-4">Upload video footage of the incident</p>
//                       <button
//                         type="button"
//                         onClick={() => videoInputRef.current?.click()}
//                         disabled={mediaFiles.videos.length >= 5}
//                         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
//                       >
//                         Choose Videos
//                       </button>
//                       <p className="text-xs text-gray-400 mt-2">Max 10MB per file • Max 5 videos</p>
//                     </div>
//                     <input
//                       ref={videoInputRef}
//                       type="file"
//                       accept="video/*"
//                       multiple
//                       onChange={(e) => handleFileUpload(e, 'videos')}
//                       className="hidden"
//                     />
//                     {(errors.videos_size || errors.videos_type || errors.videos_count) && (
//                       <div className="mt-2 space-y-1">
//                         {errors.videos_size && <p className="text-sm text-red-600">{errors.videos_size}</p>}
//                         {errors.videos_type && <p className="text-sm text-red-600">{errors.videos_type}</p>}
//                         {errors.videos_count && <p className="text-sm text-red-600">{errors.videos_count}</p>}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* File Preview */}
//                 {(mediaFiles.images.length > 0 || mediaFiles.videos.length > 0) && (
//                   <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
//                     <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                       <CheckCircle className="w-5 h-5 text-green-500" />
//                       Uploaded Files ({mediaFiles.images.length + mediaFiles.videos.length})
//                     </h4>
//                     <div className="space-y-3">
//                       {/* Images */}
//                       {mediaFiles.images.map((file, index) => (
//                         <div key={`image-${index}`} className="flex items-center justify-between p-3 bg-white rounded border">
//                           <div className="flex items-center gap-3">
//                             <Camera className="w-5 h-5 text-blue-500" />
//                             <div>
//                               <div className="font-medium text-gray-900">{file.name}</div>
//                               <div className="text-sm text-gray-500">
//                                 {(file.size / 1024 / 1024).toFixed(2)} MB
//                               </div>
//                             </div>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => removeFile('images', index)}
//                             className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
//                             title="Remove file"
//                           >
//                             <X className="w-4 h-4" />
//                           </button>
//                         </div>
//                       ))}
                      
//                       {/* Videos */}
//                       {mediaFiles.videos.map((file, index) => (
//                         <div key={`video-${index}`} className="flex items-center justify-between p-3 bg-white rounded border">
//                           <div className="flex items-center gap-3">
//                             <Upload className="w-5 h-5 text-green-500" />
//                             <div>
//                               <div className="font-medium text-gray-900">{file.name}</div>
//                               <div className="text-sm text-gray-500">
//                                 {(file.size / 1024 / 1024).toFixed(2)} MB
//                               </div>
//                             </div>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => removeFile('videos', index)}
//                             className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
//                             title="Remove file"
//                           >
//                             <X className="w-4 h-4" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Important Notice */}
//               <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
//                 <div className="flex">
//                   <AlertTriangle className="w-6 h-6 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
//                   <div>
//                     <h4 className="font-semibold text-amber-900 mb-2">Important Information</h4>
//                     <ul className="text-sm text-amber-800 space-y-1">
//                       <li>• This report will be sent to emergency services immediately</li>
//                       <li>• For life-threatening emergencies, call 911 directly</li>
//                       <li>• Provide accurate information to help responders assess the situation</li>
//                       <li>• You may be contacted for additional information</li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>

//               {/* Submit Section */}
//               <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t-2 border-gray-200">
//                 <button
//                   type="button"
//                   onClick={() => window.history.back()}
//                   disabled={loading}
//                   className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium text-lg"
//                 >
//                   Cancel
//                 </button>
                
//                 <button
//                   type="submit"
//                   disabled={loading || dataLoading}
//                   className="flex-1 bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 font-semibold text-lg min-h-[60px]"
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 className="w-6 h-6 animate-spin" />
//                       Submitting Report...
//                     </>
//                   ) : (
//                     <>
//                       <AlertTriangle className="w-6 h-6" />
//                       Submit Incident Report
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Alternative Contact Methods */}
//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
//                 <h4 className="font-semibold text-gray-900 mb-4">Other Ways to Report</h4>
//                 <div className="grid md:grid-cols-3 gap-4 text-sm">
//                   <div className="flex items-center gap-2">
//                     <Phone className="w-4 h-4 text-red-500" />
//                     <div>
//                       <div className="font-medium">Emergency Hotline</div>
//                       <div className="text-gray-600">Call: 911</div>
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center gap-2">
//                     <Smartphone className="w-4 h-4 text-blue-500" />
//                     <div>
//                       <div className="font-medium">SMS Reporting</div>
//                       <div className="text-gray-600">Text: 111</div>
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center gap-2">
//                     <Monitor className="w-4 h-4 text-green-500" />
//                     <div>
//                       <div className="font-medium">Mobile App</div>
//                       <div className="text-gray-600">Download from app store</div>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="mt-4 pt-4 border-t border-gray-300">
//                   <p className="text-xs text-gray-500">
//                     This web form is optimized for desktop and tablet use. For mobile reporting, 
//                     we recommend downloading our mobile app for a better experience.
//                   </p>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="bg-gray-800 text-white py-8 mt-12">
//         <div className="max-w-6xl mx-auto px-4">
//           <div className="grid md:grid-cols-3 gap-8">
//             <div>
//               <h4 className="font-semibold mb-3">Emergency Contacts</h4>
//               <ul className="space-y-2 text-sm text-gray-300">
//                 <li>Police Emergency: 911</li>
//                 <li>Fire Department: 912</li>
//                 <li>Medical Emergency: 913</li>
//                 <li>Disaster Management: 114</li>
//               </ul>
//             </div>
            
//             <div>
//               <h4 className="font-semibold mb-3">Report via Other Channels</h4>
//               <ul className="space-y-2 text-sm text-gray-300">
//                 <li>SMS: Text to 111</li>
//                 <li>USSD: Dial *111*1#</li>
//                 <li>WhatsApp: +250-XXX-XXXX</li>
//                 <li>Email: emergency@gov.rw</li>
//               </ul>
//             </div>
            
//             <div>
//               <h4 className="font-semibold mb-3">Get the Mobile App</h4>
//               <p className="text-sm text-gray-300 mb-3">
//                 Report incidents on the go with GPS integration and offline capability.
//               </p>
//               <div className="space-y-2">
//                 <button className="block w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors">
//                   Download for Android
//                 </button>
//                 <button className="block w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors">
//                   Download for iOS
//                 </button>
//               </div>
//             </div>
//           </div>
          
//           <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
//             <p>&copy; 2024 Emergency Alert System - Government of Rwanda. All rights reserved.</p>
//             <p className="mt-2">For technical support: support@emergency.gov.rw</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default IncidentReportPage;