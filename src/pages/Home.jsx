import * as React from 'react'
    import { useState, useEffect, useRef, useCallback } from 'react'
    import Map from '../components/Map'
    import LottieButton from '../components/LottieButton'
    // import animationData from './send-arrow.json' // Removed import

    const Home = () => {
      const [isLoggedIn, setIsLoggedIn] = useState(false)
      const [currentUser, setCurrentUser] = useState(null)
      const [authModal, setAuthModal] = useState(null)
      const [error, setError] = useState('')
      const [isTracking, setIsTracking] = useState(false)
      const [driverLocation, setDriverLocation] = useState({ lat: 34.0522, lng: -118.2437 })
      const [markers, setMarkers] = useState([])
      const [selectedFile, setSelectedFile] = useState(null)
      const [submittedInvoices, setSubmittedInvoices] = useState(() => {
        const storedInvoices = localStorage.getItem('driverInvoices')
        return storedInvoices ? JSON.parse(storedInvoices) : []
      })
      const [messages, setMessages] = useState({})
      const [buttonAnimation, setButtonAnimation] = useState(null)
      const inputRefs = useRef({})
      const [selectedDriver, setSelectedDriver] = useState(null)
      const [editProfile, setEditProfile] = useState(false)
      const [profileName, setProfileName] = useState('')
      const [profileTruckNumber, setProfileTruckNumber] = useState('')

      const [supervisorData, setSupervisorData] = useState({
        activeDrivers: [
          { id: 1, name: 'John Doe', truckNumber: 'TRK-1234', location: 'Site A', speed: '45 km/h', coordinates: { lat: 34.0522, lng: -118.2437 }, invoices: [], routes: [] },
          { id: 2, name: 'Jane Smith', truckNumber: 'TRK-5678', location: 'Site B', speed: '50 km/h', coordinates: { lat: 34.0525, lng: -118.2430 }, invoices: [], routes: [] }
        ]
      })

      const updateDriverLocation = useCallback((pos) => {
        setDriverLocation(pos);
        setMarkers(prev => [...prev, { lat: pos.lat, lng: pos.lng, label: 'T' }]);
        setSupervisorData(prev => ({
          ...prev,
          activeDrivers: prev.activeDrivers.map(driver =>
            driver.id === currentUser?.id ? { ...driver, coordinates: pos, location: `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` } : driver
          )
        }));
      }, [currentUser, setDriverLocation, setMarkers, setSupervisorData]);

      useEffect(() => {
        if (isTracking && currentUser?.role === 'driver') {
          const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              (position) => updateDriverLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
              () => setError('Unable to retrieve your location.')
            );
          }, 5000);
          return () => clearInterval(interval);
        }
      }, [isTracking, currentUser, updateDriverLocation]);

      const handleAuth = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const role = formData.get('role');
        const users = JSON.parse(localStorage.getItem('roninUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (authModal === 'login') {
          if (user) {
            setIsLoggedIn(true);
            setCurrentUser(user);
            setAuthModal(null);
            setError('');
            setProfileName(user.name || '');
            setProfileTruckNumber(user.truckNumber || '');
          } else {
            setError('Invalid email or password');
          }
        } else if (authModal === 'signup') {
          if (users.some(u => u.email === email)) {
            setError('Email already exists');
            return;
          }
          const newUser = { email, password, role, id: Date.now() };
          localStorage.setItem('roninUsers', JSON.stringify([...users, newUser]));
          setIsLoggedIn(true);
          setCurrentUser(newUser);
          setAuthModal(null);
          setError('');
          setProfileName('');
          setProfileTruckNumber('');
        }
      };

      const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setSelectedDriver(null);
        setEditProfile(false);
      };

      const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

      const handleSubmitInvoice = () => {
        if (selectedFile) {
          const newInvoice = { id: Date.now(), file: URL.createObjectURL(selectedFile), date: new Date().toLocaleDateString() };
          const updatedInvoices = [...submittedInvoices, newInvoice];
          setSubmittedInvoices(updatedInvoices);
          localStorage.setItem('driverInvoices', JSON.stringify(updatedInvoices));
          setSelectedFile(null);
        }
      };

      const handleSendMessage = (driverId, message) => {
        setMessages(prev => ({ ...prev, [driverId]: [...(prev[driverId] || []), { text: message, sender: 'Supervisor' }] }));
        if (inputRefs.current[driverId]) {
          inputRefs.current[driverId].value = '';
        }
        setButtonAnimation(driverId);
        setTimeout(() => setButtonAnimation(null), 300);
      };

      const handleSaveProfile = () => {
        const users = JSON.parse(localStorage.getItem('roninUsers') || '[]');
        const updatedUsers = users.map(user => user.id === currentUser.id ? { ...user, name: profileName, truckNumber: profileTruckNumber } : user);
        localStorage.setItem('roninUsers', JSON.stringify(updatedUsers));
        setCurrentUser(prev => ({ ...prev, name: profileName, truckNumber: profileTruckNumber }));
        setEditProfile(false);
      };

      const DriverDashboard = () => (
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Driver Dashboard</h2>
            <button onClick={handleLogout} className="bg-red-600 px-6 py-2 rounded-lg text-white hover:bg-red-700 transition">Logout</button>
          </div>
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Driver Profile {!editProfile && (<button onClick={() => setEditProfile(true)} className="ml-4 text-blue-500 hover:underline">(Edit)</button>)}</h3>
            {editProfile ? (
              <div className="space-y-4">
                <div><label htmlFor="profileName" className="block mb-1">Name</label><input type="text" id="profileName" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label htmlFor="profileTruckNumber" className="block mb-1">Truck Number</label><input type="text" id="profileTruckNumber" value={profileTruckNumber} onChange={(e) => setProfileTruckNumber(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
                <button onClick={handleSaveProfile} className="bg-green-600 px-6 py-2 rounded-lg text-white hover:bg-green-700 transition">Save Profile</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between"><span className="font-medium">Name:</span><span>{currentUser?.name || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-medium">Truck Number:</span><span>{currentUser?.truckNumber || 'N/A'}</span></div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Tracking & Invoice</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Current Location:</span>
                <span>{driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Speed:</span>
                <span>45 km/h</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setIsTracking(!isTracking)} className={`py-3 rounded-lg font-medium transition flex-1 ${isTracking ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-ronin-primary hover:bg-blue-700 text-white'}`}>
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </button>
              <button onClick={handleSubmitInvoice} className="bg-green-600 px-6 py-3 rounded-lg text-white hover:bg-green-700 transition flex-1" disabled={!selectedFile}>Submit Invoice</button>
            </div>
            <div className="mt-4"><input type="file" accept="image/*" onChange={handleFileChange} /></div>
          </div>
          {submittedInvoices.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Submitted Invoices</h3>
              <div className="space-y-4">
                {submittedInvoices.map(invoice => (
                  <div key={invoice.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Date: {invoice.date}</span>
                      <a href={invoice.file} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Invoice</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      const SupervisorDashboard = () => (
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Supervisor Dashboard</h2>
            <button onClick={handleLogout} className="bg-red-600 px-6 py-2 rounded-lg text-white hover:bg-red-700 transition">Logout</button>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Map */}
            <div className="md:w-1/2">
              <h3 className="text-xl font-bold mb-4">Fleet Tracking</h3>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <div style={{ marginTop: '0px' }}>
                  <Map 
                    markers={supervisorData.activeDrivers.filter(driver => driver.coordinates).map(driver => ({
                      lat: driver.coordinates.lat,
                      lng: driver.coordinates.lng,
                      label: driver.truckNumber
                    }))}
                  />
                </div>
              </div>
            </div>
            {/* Driver List */}
            <div className="bg-white rounded-lg shadow p-6 md:w-1/2" style={{ marginTop: '24px' }}>
              <h3 className="text-xl font-bold mb-4">Driver Status</h3>
              <div className="space-y-4">
                {supervisorData.activeDrivers.map(driver => (
                  <div key={driver.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between">
                      <span className="font-medium">Driver:</span>
                      <button onClick={() => setSelectedDriver(driver)} className="text-blue-500 hover:underline">{driver.name}</button>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Truck:</span>
                      <span>{driver.truckNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Speed:</span>
                      <span>{driver.speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Location:</span>
                      <span>{driver.location}</span>
                    </div>
                    <div className="mt-2 relative flex items-center">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="w-full px-2 py-1 border rounded-md pr-8"
                        ref={(el) => (inputRefs.current[driver.id] = el)}
                      />
                      <button
                        onClick={() => {
                          if (inputRefs.current[driver.id] && inputRefs.current[driver.id].value.trim() !== '') {
                            handleSendMessage(driver.id, inputRefs.current[driver.id].value)
                          }
                        }}
                        className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-transform duration-300 ${buttonAnimation === driver.id ? 'scale-125' : 'scale-100'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                      {messages[driver.id] && (
                        <div className="mt-2 space-y-1">
                          {messages[driver.id].map((msg, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              <span className="font-medium">{msg.sender}:</span> {msg.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {selectedDriver && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">
                {selectedDriver.name}'s Profile
                <button onClick={() => setSelectedDriver(null)} className="ml-4 text-gray-500 hover:text-gray-700">
                  (Close)
                </button>
              </h3>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Invoices</h4>
                {selectedDriver.invoices.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedDriver.invoices.map(invoice => (
                      <li key={invoice.id}>
                        Date: {invoice.date}, File: {invoice.file}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No invoices submitted.</p>
                )}

                <h4 className="text-lg font-semibold mt-4">Routes</h4>
                {selectedDriver.routes.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedDriver.routes.map(route => (
                      <li key={route.id}>
                        Date: {route.date}, Locations: {route.locations.join(', ')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No routes recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>
      );

      return (
        <div className="min-h-screen bg-gray-50">
          {/* Auth Modal */}
          {authModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
                <button onClick={() => { setAuthModal(null); setError('') }} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">&times;</button>
                <h2 className="text-2xl font-bold mb-6">{authModal === 'login' ? 'Login' : 'Sign Up'}</h2>
                {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>)}
                <form onSubmit={handleAuth}>
                  <div className="space-y-4">
                    <div><label htmlFor="email" className="block mb-1">Email</label><input type="email" id="email" name="email" required className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label htmlFor="password" className="block mb-1">Password</label><input type="password" id="password" name="password" required className="w-full px-4 py-2 border rounded-lg" /></div>
                    {authModal === 'signup' && (
                      <div>
                        <label htmlFor="role" className="block mb-1">Role</label>
                        <select id="role" name="role" required className="w-full px-4 py-2 border rounded-lg">
                          <option value="driver">Driver</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                      </div>
                    )}
                    <button type="submit" className="w-full bg-ronin-primary text-white py-2 rounded-lg hover:bg-blue-700 transition">{authModal === 'login' ? 'Login' : 'Sign Up'}</button>
                  </div>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => { setAuthModal(authModal === 'login' ? 'signup' : 'login'); setError('') }} className="text-ronin-primary hover:underline">
                    {authModal === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section */}
          {!isLoggedIn && (
            <div className="relative h-[600px] bg-gradient-to-r from-blue-900 to-green-900">
              <div className="absolute inset-0 bg-black/50">
                <div className="container mx-auto px-4 h-full flex flex-col justify-center text-white">
                  <h1 className="text-5xl font-bold mb-6">Optimize Your Earthworks Operations</h1>
                  <p className="text-xl mb-8 max-w-2xl">Ronin Earthworks Tracking provides real-time dump truck monitoring and logistics management for drivers and supervisors.</p>
                  <div className="flex gap-6 flex-col md:flex-row">
                    <div className="bg-white/10 p-8 rounded-lg backdrop-blur">
                      <h2 className="text-2xl font-bold mb-4">Driver</h2>
                      <p className="mb-6">Track your routes and manage deliveries</p>
                      <button onClick={() => setAuthModal('login')} className="bg-ronin-primary px-6 py-3 rounded font-medium hover:bg-blue-700 transition">Driver Login</button>
                    </div>
                    <div className="bg-white/10 p-8 rounded-lg backdrop-blur">
                      <h2 className="text-2xl font-bold mb-4">Supervisor</h2>
                      <p className="mb-6">Monitor fleet and optimize operations</p>
                      <button onClick={() => setAuthModal('login')} className="bg-ronin-secondary px-6 py-3 rounded font-medium hover:bg-green-600 transition">Supervisor Login</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show dashboard if logged in */}
          {isLoggedIn && (
            currentUser?.role === 'driver' ? (
              <DriverDashboard />
            ) : (
              <SupervisorDashboard />
            )
          )}

          {/* Footer */}
          <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
              <div className="grid md:grid-cols-4 gap-8">
                <div><h3 className="text-xl font-bold mb-4">Ronin Earthworks</h3><p className="text-gray-400">Revolutionizing earthworks operations with cutting-edge tracking technology.</p></div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Features</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contact</h4>
                  <ul className="text-gray-400 space-y-2">
                    <li>123 Earthworks Lane</li>
                    <li>Construction City, CC 12345</li>
                    <li>Phone: (555) 123-4567</li>
                    <li>Email: info@roninearthworks.com</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
                  <div className="flex space-x-4">
                    <a href="#" className="text-gray-400 hover:text-white transition"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg></a>
                    <a href="#" className="text-gray-400 hover:text-white transition"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
                    <a href="#" className="text-gray-400 hover:text-white transition"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Ronin Earthworks. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      )
    }

    export default Home
