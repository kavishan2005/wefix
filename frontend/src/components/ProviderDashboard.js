import React, { useState, useEffect } from 'react';
import { addService, getServices, db } from '../firebase/init';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './ProviderDashboard.css';

const serviceSectors = [
  { id: 'plumber', name: 'Plumber', icon: '🔧', description: 'Pipe repairs, installations, maintenance' },
  { id: 'electrician', name: 'Electrician', icon: '⚡', description: 'Wiring, repairs, installations' },
  { id: 'gardener', name: 'Gardener', icon: '🌿', description: 'Landscaping, maintenance, planting' },
  { id: 'driver', name: 'Driver', icon: '🚗', description: 'Personal, commercial, delivery' },
  { id: 'maid', name: 'Maid', icon: '🏠', description: 'Cleaning, housekeeping' },
  { id: 'tutor', name: 'Teacher/Tutor', icon: '📚', description: 'Academic support, lessons' },
  { id: 'carpenter', name: 'Carpenter', icon: '🔨', description: 'Furniture, repairs, woodwork' },
  { id: 'painter', name: 'Painter', icon: '🎨', description: 'Home painting, commercial' },
  { id: 'cleaner', name: 'Cleaner', icon: '🧹', description: 'Professional cleaning services' },
  { id: 'mechanic', name: 'Mechanic', icon: '🔩', description: 'Vehicle repairs, maintenance' },
  { id: 'beautician', name: 'Beautician', icon: '💅', description: 'Beauty, grooming services' },
  { id: 'tailor', name: 'Tailor', icon: '🧵', description: 'Clothing alterations, sewing' }
];

const ProviderDashboard = ({ user }) => {
  const [selectedSector, setSelectedSector] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    // Price and duration removed as requested
    location: user?.location || '',
    experience: '', // in years
    availability: 'available', // available, busy, away
    tags: []
  });

  // Load provider's services
  useEffect(() => {
    if (user?.uid) {
      loadProviderServices();
    }
  }, [user]);

  const loadProviderServices = async () => {
    try {
      setLoading(true);
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, where('providerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const servicesList = [];
      querySnapshot.forEach((doc) => {
        servicesList.push({ id: doc.id, ...doc.data() });
      });
      
      setServices(servicesList);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectorSelect = (sector) => {
    setSelectedSector(sector);
    setShowAddForm(true);
    setServiceForm({
      ...serviceForm,
      title: '',
      description: '',
      tags: [sector.name.toLowerCase()]
    });
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const serviceData = {
        ...serviceForm,
        providerId: user.uid,
        providerName: user.name,
        providerPhone: user.phone,
        providerEmail: user.email,
        sector: selectedSector.id,
        sectorName: selectedSector.name,
        rating: 0,
        totalReviews: 0,
        bookings: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      let result;
      if (editingService) {
        // Update existing service
        const serviceRef = doc(db, 'services', editingService.id);
        await updateDoc(serviceRef, serviceData);
        result = { success: true, id: editingService.id };
      } else {
        // Add new service
        result = await addService(serviceData);
      }

      if (result.success) {
        alert(editingService ? 'Service updated successfully!' : 'Service added successfully!');
        setServiceForm({
          title: '',
          description: '',
          location: user?.location || '',
          experience: '',
          availability: 'available',
          tags: []
        });
        setShowAddForm(false);
        setEditingService(null);
        loadProviderServices();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setSelectedSector(serviceSectors.find(s => s.id === service.sector));
    setServiceForm({
      title: service.title,
      description: service.description,
      location: service.location || '',
      experience: service.experience || '',
      availability: service.availability || 'available',
      tags: service.tags || []
    });
    setShowAddForm(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteDoc(doc(db, 'services', serviceId));
        loadProviderServices();
        alert('Service deleted successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service.');
      }
    }
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim().toLowerCase();
      if (!serviceForm.tags.includes(newTag)) {
        setServiceForm({
          ...serviceForm,
          tags: [...serviceForm.tags, newTag]
        });
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setServiceForm({
      ...serviceForm,
      tags: serviceForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="provider-dashboard">
      <div className="dashboard-header">
        <h1>🔧 Service Provider Dashboard</h1>
        <p>Welcome, {user?.name}! Manage your services here.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Services</h3>
          <p className="stat-number">{services.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Services</h3>
          <p className="stat-number">
            {services.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Service Sectors</h3>
          <p className="stat-number">
            {[...new Set(services.map(s => s.sector))].length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p className="stat-number">
            {services.reduce((sum, service) => sum + (service.bookings || 0), 0)}
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Left Column - Service Sectors */}
        <div className="sectors-section">
          <div className="section-header">
            <h2>Select Your Service Sector</h2>
            <p>Choose the category that matches your expertise</p>
          </div>
          
          <div className="sectors-grid">
            {serviceSectors.map((sector) => (
              <div 
                key={sector.id}
                className={`sector-card ${selectedSector?.id === sector.id ? 'selected' : ''}`}
                onClick={() => handleSectorSelect(sector)}
              >
                <div className="sector-icon">{sector.icon}</div>
                <h3>{sector.name}</h3>
                <p className="sector-description">{sector.description}</p>
                <div className="sector-badge">
                  {services.filter(s => s.sector === sector.id).length} services
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Add/Edit Service Form or Service List */}
        <div className="services-section">
          {showAddForm ? (
            <div className="add-service-form">
              <div className="form-header">
                <h2>
                  {editingService ? 'Edit Service' : 'Add New Service'} 
                  {selectedSector && ` - ${selectedSector.name}`}
                </h2>
                <button 
                  className="back-btn"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingService(null);
                  }}
                >
                  ← Back to Services
                </button>
              </div>

              <form onSubmit={handleServiceSubmit}>
                <div className="form-group">
                  <label>Service Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., House Plumbing Repair, Home Cleaning Service"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({...serviceForm, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    placeholder="Describe your service in detail. What do you offer? What are your specialties?"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                    rows="5"
                    required
                  />
                  <small className="form-hint">Be specific about what you offer. Customers will read this.</small>
                </div>

                <div className="form-group">
                  <label>Experience (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g., 5 (years of experience)"
                    value={serviceForm.experience}
                    onChange={(e) => setServiceForm({...serviceForm, experience: e.target.value})}
                  />
                  <small className="form-hint">Number of years you've been providing this service</small>
                </div>

                <div className="form-group">
                  <label>Service Area/Location (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Colombo, Kandy, Galle or specific areas you serve"
                    value={serviceForm.location}
                    onChange={(e) => setServiceForm({...serviceForm, location: e.target.value})}
                  />
                  <small className="form-hint">Where do you provide this service?</small>
                </div>

                <div className="form-group">
                  <label>Tags (Optional - Press Enter to add)</label>
                  <div className="tags-input">
                    <input
                      type="text"
                      placeholder="Add tags like 'emergency', 'weekend', '24/7', 'certified'"
                      onKeyDown={handleTagAdd}
                    />
                    <div className="tags-container">
                      {serviceForm.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <small className="form-hint">Tags help customers find your service more easily</small>
                </div>

                <div className="form-group">
                  <label>Availability</label>
                  <select
                    value={serviceForm.availability}
                    onChange={(e) => setServiceForm({...serviceForm, availability: e.target.value})}
                  >
                    <option value="available">✅ Available (Taking bookings)</option>
                    <option value="busy">🟡 Busy (Limited slots available)</option>
                    <option value="away">🔴 Away (Not taking new bookings)</option>
                  </select>
                  <small className="form-hint">Set your current availability status</small>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="submit-btn"
                  >
                    {loading ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                  </button>
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingService(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="services-list">
              <div className="section-header">
                <h2>Your Services ({services.length})</h2>
                <button 
                  className="add-service-btn"
                  onClick={() => setShowAddForm(true)}
                  disabled={!selectedSector}
                >
                  + Add New Service
                </button>
              </div>

              {loading ? (
                <div className="loading-services">
                  <div className="spinner"></div>
                  <p>Loading services...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="no-services">
                  <div className="no-services-icon">📝</div>
                  <h3>No Services Added Yet</h3>
                  <p>Select a service sector from the left to add your first service.</p>
                  <p>Choose a category that matches your expertise.</p>
                </div>
              ) : (
                <div className="services-grid">
                  {services.map((service) => (
                    <div key={service.id} className="service-card">
                      <div className="service-header">
                        <div className="service-icon">
                          {serviceSectors.find(s => s.id === service.sector)?.icon || '🔧'}
                        </div>
                        <div className="service-info">
                          <h3>{service.title}</h3>
                          <span className="service-sector">{service.sectorName}</span>
                        </div>
                        <div className="service-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditService(service)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <p className="service-description">{service.description}</p>
                      
                      <div className="service-details">
                        {service.experience && (
                          <div className="detail">
                            <span className="label">Experience:</span>
                            <span className="value">{service.experience} years</span>
                          </div>
                        )}
                        {service.location && (
                          <div className="detail">
                            <span className="label">Location:</span>
                            <span className="value">{service.location}</span>
                          </div>
                        )}
                        <div className="detail">
                          <span className="label">Status:</span>
                          <span className={`status ${service.availability}`}>
                            {service.availability === 'available' ? '✅ Available' : 
                             service.availability === 'busy' ? '🟡 Busy' : '🔴 Away'}
                          </span>
                        </div>
                        {service.rating > 0 && (
                          <div className="detail">
                            <span className="label">Rating:</span>
                            <span className="value">⭐ {service.rating.toFixed(1)} ({service.totalReviews || 0} reviews)</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="service-footer">
                        <div className="service-stats">
                          <span className="stat">
                            📅 {service.bookings || 0} bookings
                          </span>
                          <span className="stat">
                            📅 Added: {new Date(service.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {service.tags && service.tags.length > 0 && (
                          <div className="service-tags">
                            {service.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="tag">{tag}</span>
                            ))}
                            {service.tags.length > 3 && (
                              <span className="tag-more">+{service.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
