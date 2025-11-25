// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Recipient Information
    recipientFirstName: '',
    recipientLastName: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientIdNumber: '',
    
    // Pickup Information
    pickupOption: '',
    pickupCounty: '',
    
    specialInstructions: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);

  // Pickup stations with detailed information
  const pickupStations = {
    easycoach: {
      name: 'EasyCoach Bus Station',
      description: 'Modern bus station with secure package holding facilities',
      logo: '🚌',
      features: ['Secure Storage', 'Restrooms', 'Waiting Area', 'Parking', 'Digital Tracking'],
      mainStation: {
        location: 'Accra Road, Nairobi CBD',
        directions: 'Next to the former Ambassadeur Hotel, opposite Kenya Reinsurance Plaza',
        landmark: 'Near Kenya Reinsurance Plaza'
      },
      stations: [
        {
          county: 'Nairobi',
          address: 'EasyCoach Bus Station, Accra Road, Nairobi CBD',
          hours: 'Mon-Sun: 6:00 AM - 10:00 PM',
          contact: '0700 000 000',
          facilities: ['Secure Storage', 'Restrooms', 'Waiting Area', 'Parking'],
          directions: 'Located in Nairobi CBD, next to the former Ambassadeur Hotel'
        },
        {
          county: 'Mombasa',
          address: 'EasyCoach Station, Moi Avenue, Mombasa CBD',
          hours: 'Mon-Sun: 5:30 AM - 9:30 PM',
          contact: '0700 000 001',
          facilities: ['Secure Storage', 'Restrooms', 'AC Waiting Area'],
          directions: 'Along Moi Avenue, next to Lions Court Hotel'
        },
        {
          county: 'Kisumu',
          address: 'EasyCoach Bus Station, Oginga Odinga Street, Kisumu',
          hours: 'Mon-Sun: 6:00 AM - 9:00 PM',
          contact: '0700 000 002',
          facilities: ['Secure Storage', 'Restrooms', 'Food Court'],
          directions: 'On Oginga Odinga Street, near the main market'
        },
        {
          county: 'Nakuru',
          address: 'EasyCoach Station, Kenyatta Avenue, Nakuru',
          hours: 'Mon-Sun: 5:30 AM - 9:00 PM',
          contact: '0700 000 003',
          facilities: ['Secure Storage', 'Restrooms', 'Parking'],
          directions: 'Along Kenyatta Avenue, opposite Nakuru General Post Office'
        },
        {
          county: 'Eldoret',
          address: 'EasyCoach Bus Station, Uganda Road, Eldoret',
          hours: 'Mon-Sun: 5:00 AM - 9:30 PM',
          contact: '0700 000 004',
          facilities: ['Secure Storage', 'Restrooms', 'Waiting Area'],
          directions: 'On Uganda Road, next to Eldoret Polytechnic'
        }
      ]
    },
    guardian: {
      name: 'Guardian Angel Bus Station',
      description: 'Reliable bus service with nationwide coverage and 24/7 security',
      logo: '👼',
      features: ['24/7 Security', 'Package Tracking', 'Customer Service Desk', 'SMS Alerts'],
      mainStation: {
        location: 'River Road, Nairobi CBD',
        directions: 'Along River Road, between Accra Road and Latema Road',
        landmark: 'Near Kamukunji Grounds'
      },
      stations: [
        {
          county: 'Nairobi',
          address: 'Guardian Angel Station, River Road, Nairobi CBD',
          hours: 'Mon-Sun: 5:00 AM - 11:00 PM',
          contact: '0700 000 100',
          facilities: ['24/7 Security', 'Package Tracking', 'Restrooms'],
          directions: 'Along River Road, between Accra Road and Latema Road'
        },
        {
          county: 'Mombasa',
          address: 'Guardian Angel Station, Nkrumah Road, Mombasa',
          hours: 'Mon-Sun: 4:30 AM - 10:30 PM',
          contact: '0700 000 101',
          facilities: ['Secure Storage', 'Restrooms', 'Customer Service Desk'],
          directions: 'On Nkrumah Road, near Mackinnon Market'
        },
        {
          county: 'Kisumu',
          address: 'Guardian Angel Bus Station, Jomo Kenyatta Highway, Kisumu',
          hours: 'Mon-Sun: 5:00 AM - 10:00 PM',
          contact: '0700 000 102',
          facilities: ['Secure Storage', 'Restrooms', 'Food Vendors'],
          directions: 'Along Jomo Kenyatta Highway, next to Lake Basin Mall'
        },
        {
          county: 'Thika',
          address: 'Guardian Angel Station, General Kago Road, Thika',
          hours: 'Mon-Sun: 5:30 AM - 9:30 PM',
          contact: '0700 000 103',
          facilities: ['Secure Storage', 'Restrooms', 'Parking'],
          directions: 'On General Kago Road, near Thika Level 5 Hospital'
        },
        {
          county: 'Machakos',
          address: 'Guardian Angel Bus Station, Masaku Road, Machakos',
          hours: 'Mon-Sun: 5:00 AM - 9:00 PM',
          contact: '0700 000 104',
          facilities: ['Secure Storage', 'Restrooms', 'Waiting Area'],
          directions: 'Along Masaku Road, opposite Machakos People\'s Park'
        }
      ]
    },
    mashpoa: {
      name: 'Mash Poa Bus Station',
      description: 'Affordable and convenient parcel pickup locations with digital notifications',
      logo: '💼',
      features: ['Package Lockers', 'Digital Notifications', 'SMS Alerts', 'Extended Hours'],
      mainStation: {
        location: 'Tom Mboya Street, Nairobi CBD',
        directions: 'Along Tom Mboya Street, between Muindi Mbingu Street and Luthuli Avenue',
        landmark: 'Near Archives Building'
      },
      stations: [
        {
          county: 'Nairobi',
          address: 'Mash Poa Station, Tom Mboya Street, Nairobi CBD',
          hours: 'Mon-Sun: 6:00 AM - 10:00 PM',
          contact: '0700 000 200',
          facilities: ['Package Lockers', 'Restrooms', 'Digital Notifications'],
          directions: 'Along Tom Mboya Street, between Muindi Mbingu Street and Luthuli Avenue'
        },
        {
          county: 'Mombasa',
          address: 'Mash Poa Station, Digo Road, Mombasa',
          hours: 'Mon-Sun: 5:30 AM - 9:30 PM',
          contact: '0700 000 201',
          facilities: ['Secure Storage', 'Restrooms', 'SMS Alerts'],
          directions: 'On Digo Road, near Mombasa Law Courts'
        },
        {
          county: 'Nakuru',
          address: 'Mash Poa Bus Station, Gusii Road, Nakuru',
          hours: 'Mon-Sun: 6:00 AM - 9:00 PM',
          contact: '0700 000 202',
          facilities: ['Package Lockers', 'Restrooms', 'Parking'],
          directions: 'Along Gusii Road, near Nakuru Boys High School'
        },
        {
          county: 'Kisii',
          address: 'Mash Poa Station, Kisii Town Center',
          hours: 'Mon-Sun: 6:30 AM - 8:30 PM',
          contact: '0700 000 203',
          facilities: ['Secure Storage', 'Restrooms'],
          directions: 'In Kisii Town Center, next to the main market'
        },
        {
          county: 'Kericho',
          address: 'Mash Poa Bus Station, Kericho Town CBD',
          hours: 'Mon-Sun: 6:00 AM - 8:00 PM',
          contact: '0700 000 204',
          facilities: ['Secure Storage', 'Restrooms', 'Waiting Area'],
          directions: 'In Kericho CBD, near Tea Hotel'
        }
      ]
    }
  };

  const cartItems = cart?.items || cart || [];
  const subtotal = getCartTotal();

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // When county is selected, find the matching station
    if (name === 'pickupCounty' && formData.pickupOption) {
      const station = pickupStations[formData.pickupOption]?.stations.find(
        s => s.county === value
      );
      setSelectedStation(station);
    }
  };

  const handleStationSelect = (stationKey) => {
    setFormData(prev => ({
      ...prev,
      pickupOption: stationKey,
      pickupCounty: '' // Reset county when station changes
    }));
    setSelectedStation(null);
  };

  // In Checkout.jsx - Update the handleCheckout function
// In Checkout.jsx - Update the handleCheckout function
const handleCheckout = async () => {
  setLoading(true);
  
  try {
    const getUserId = () => {
      let userId = localStorage.getItem('bloomsoko-user-id');
      if (!userId) {
        userId = `demo-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('bloomsoko-user-id', userId);
      }
      return userId;
    };

    const userId = getUserId();
    
    // Debug: Check form data
    console.log('Form Data:', formData);
    console.log('Recipient Email:', formData.recipientEmail);

    // Validate required fields
    if (!formData.recipientEmail) {
      throw new Error('Email is required. Please fill in the email field.');
    }

    const requestData = {
      amount: subtotal * 100,
      email: formData.recipientEmail, // This should match the form field name
      metadata: {
        recipient: {
          firstName: formData.recipientFirstName,
          lastName: formData.recipientLastName,
          email: formData.recipientEmail, // Make sure this matches the form field
          phone: formData.recipientPhone,
          idNumber: formData.recipientIdNumber
        },
        pickup: {
          option: formData.pickupOption,
          station: pickupStations[formData.pickupOption]?.name,
          county: formData.pickupCounty,
          stationDetails: selectedStation
        },
        items: cartItems,
        specialInstructions: formData.specialInstructions
      }
    };

    console.log('Sending to backend:', JSON.stringify(requestData, null, 2));

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/paystack/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'userid': userId
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const paymentData = await response.json();
    
    if (paymentData.success) {
      window.location.href = paymentData.data.authorization_url;
    } else {
      throw new Error(paymentData.message || 'Payment initialization failed');
    }
    
  } catch (error) {
    console.error('Payment error:', error);
    setLoading(false);
    alert(`Payment failed: ${error.message}`);
  }
};
  const handleTransportArrangement = () => {
    const subject = 'Transport Arrangement Request - Home Delivery';
    const body = `Hello Bloomsoko,\n\nI would like to arrange home delivery instead of pickup.\n\nRecipient Details:\n- Name: ${formData.recipientFirstName} ${formData.recipientLastName}\n- Phone: ${formData.recipientPhone}\n- Email: ${formData.recipientEmail}\n- ID: ${formData.recipientIdNumber}\n\nOrder Details:\n- Items: ${cartItems.length}\n- Total: KSh ${subtotal.toLocaleString()}\n- Preferred Delivery County: ${formData.pickupCounty || 'Not specified'}\n\nPlease contact me to discuss home delivery options and pricing.\n\nBest regards,\n${formData.recipientFirstName} ${formData.recipientLastName}`;
    
    window.location.href = `mailto:transport@bloomsoko.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <Link to="/products">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '2rem'
    }}>
      {/* Main Checkout Section */}
      <div className="checkout-main">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#2E7D32', marginBottom: '0.5rem' }}>Checkout</h1>
          <div className="breadcrumbs">
            <Link to="/">Home</Link> &gt; 
            <Link to="/cart">Cart</Link> &gt; 
            <span>Checkout</span>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="checkout-section" style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Recipient Information</h3>
          <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Please provide the details of the person who will pick up the package
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>First Name *</label>
              <input
                type="text"
                name="recipientFirstName"
                value={formData.recipientFirstName}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label>Last Name *</label>
              <input
                type="text"
                name="recipientLastName"
                value={formData.recipientLastName}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label>Email *</label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleInputChange}
                required
                style={inputStyle}
                placeholder="Confirmation will be sent here"
              />
            </div>
            <div>
              <label>Phone Number *</label>
              <input
                type="tel"
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>National ID Number *</label>
              <input
                type="text"
                name="recipientIdNumber"
                value={formData.recipientIdNumber}
                onChange={handleInputChange}
                required
                style={inputStyle}
                placeholder="Required for package pickup"
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Required for identity verification at pickup station
              </small>
            </div>
          </div>
        </div>

        {/* Pickup Station Selection */}
        <div className="checkout-section" style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Select Pickup Station</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Choose your preferred pickup station. No shipping fee required online - pay at station.
          </p>

          {/* Pickup Station Cards */}
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            {Object.entries(pickupStations).map(([key, station]) => (
              <div
                key={key}
                onClick={() => handleStationSelect(key)}
                style={{
                  padding: '1.5rem',
                  border: `2px solid ${formData.pickupOption === key ? '#2E7D32' : '#e0e0e0'}`,
                  borderRadius: '12px',
                  background: formData.pickupOption === key ? '#F1F8E9' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  if (formData.pickupOption !== key) {
                    e.currentTarget.style.borderColor = '#2E7D32';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (formData.pickupOption !== key) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {formData.pickupOption === key && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: '#2E7D32',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem'
                  }}>
                    ✓
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    fontSize: '2rem',
                    background: formData.pickupOption === key ? '#2E7D32' : '#f0f0f0',
                    color: formData.pickupOption === key ? 'white' : '#666',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {station.logo}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{ 
                        color: '#2E7D32', 
                        margin: 0,
                        fontSize: '1.2rem'
                      }}>
                        {station.name}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, pickupOption: key }));
                        }}
                        style={{
                          background: formData.pickupOption === key ? '#2E7D32' : '#FFC107',
                          color: formData.pickupOption === key ? 'white' : '#000',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        {formData.pickupOption === key ? 'Selected' : 'Select This Option'}
                      </button>
                    </div>
                    
                    <p style={{ color: '#666', marginBottom: '0.75rem' }}>
                      {station.description}
                    </p>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#2E7D32' }}>Main Station:</strong>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        {station.mainStation.location}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>
                        📍 {station.mainStation.directions}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {station.features.map((feature, index) => (
                        <span
                          key={index}
                          style={{
                            background: '#E8F5E8',
                            color: '#2E7D32',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      <strong>Available in:</strong> {station.stations.map(s => s.county).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* County Selection */}
          {formData.pickupOption && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Select Your County *
              </label>
              <select
                name="pickupCounty"
                value={formData.pickupCounty}
                onChange={handleInputChange}
                required
                style={inputStyle}
              >
                <option value="">Choose your county for pickup</option>
                {pickupStations[formData.pickupOption]?.stations.map(station => (
                  <option key={station.county} value={station.county}>
                    {station.county}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Station Details */}
          {selectedStation && (
            <div style={{
              background: '#E8F5E8',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #C8E6C9',
              marginTop: '1rem'
            }}>
              <h4 style={{ color: '#2E7D32', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📍 Selected Pickup Station Details
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <strong>Address:</strong>
                  <div style={{ color: '#666' }}>{selectedStation.address}</div>
                </div>
                <div>
                  <strong>Operating Hours:</strong>
                  <div style={{ color: '#666' }}>{selectedStation.hours}</div>
                </div>
                <div>
                  <strong>Contact:</strong>
                  <div style={{ color: '#666' }}>{selectedStation.contact}</div>
                </div>
                <div>
                  <strong>Directions:</strong>
                  <div style={{ color: '#666' }}>{selectedStation.directions}</div>
                </div>
              </div>
              
              <div>
                <strong>Facilities:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {selectedStation.facilities.map((facility, index) => (
                    <span
                      key={index}
                      style={{
                        background: '#2E7D32',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div style={{
            background: '#FFF3E0',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem',
            border: '1px solid #FFB74D'
          }}>
            <h4 style={{ color: '#E65100', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Important Pickup Instructions
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#666' }}>
              <li>Carry your <strong>Original National ID</strong> for verification</li>
              <li>Pay shipping fee at the station (amount varies by location)</li>
              <li>Keep your order reference number ready</li>
              <li>Packages must be collected within 7 days</li>
              <li>Contact station if you need to extend pickup period</li>
            </ul>
          </div>
        </div>

        {/* Transport Arrangement Option */}
        <div className="checkout-section" style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Need Home Delivery?</h3>
          <div style={{
            background: '#E3F2FD',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #90CAF9'
          }}>
            <h4 style={{ color: '#1565C0', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🚚 Home Delivery Service
            </h4>
            <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
              Prefer home delivery instead of pickup? We can arrange door-to-door delivery 
              anywhere in Kenya. Contact us for pricing and arrangements.
            </p>
            <button
              onClick={handleTransportArrangement}
              style={{
                background: 'transparent',
                border: '2px solid #2196F3',
                color: '#2196F3',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#2196F3';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#2196F3';
              }}
            >
              Request Home Delivery Quote
            </button>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="checkout-section" style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Special Instructions</h3>
          <textarea
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={handleInputChange}
            rows="3"
            style={{...inputStyle, resize: 'vertical'}}
            placeholder="Any special instructions for your order... (gift message, packaging preferences, etc.)"
          />
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="checkout-sidebar">
        <div style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: '2rem'
        }}>
          <h3 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Order Summary</h3>
          
          {/* Order Items */}
          <div style={{ marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
            {cartItems.map(item => (
              <div key={item._id || item.itemId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  {item.product?.featuredImage?.url || item.image ? (
                    <img 
                      src={item.product?.featuredImage?.url || item.image} 
                      alt={item.product?.name || item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '0.8rem'
                    }}>
                      No Image
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {item.product?.name || item.name}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>
                    Qty: {item.quantity} × KSh {item.price?.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
            <div style={priceRowStyle}>
              <span>Subtotal:</span>
              <span>KSh {subtotal.toLocaleString()}</span>
            </div>
            
            <div style={priceRowStyle}>
              <span>Shipping:</span>
              <span style={{ color: '#FF9800', fontWeight: '600' }}>Pay at Station</span>
            </div>

            <div style={{
              ...priceRowStyle,
              borderTop: '2px solid #2E7D32',
              paddingTop: '0.5rem',
              fontWeight: '700',
              fontSize: '1.1rem'
            }}>
              <span>Amount to Pay Now:</span>
              <span>KSh {subtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || !formData.recipientFirstName || !formData.recipientEmail || 
                     !formData.recipientPhone || !formData.recipientIdNumber || 
                     !formData.pickupOption || !formData.pickupCounty}
            style={{
              width: '100%',
              background: loading ? '#ccc' : '#FFC107',
              color: '#000',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (!loading && !e.target.disabled) {
                e.target.style.background = '#FFD54F';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading && !e.target.disabled) {
                e.target.style.background = '#FFC107';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Processing...' : `Pay KSh ${subtotal.toLocaleString()}`}
          </button>

          {/* Security Badge */}
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            padding: '0.5rem',
            background: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            🔒 Secure Paystack Payment
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const priceRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.25rem 0'
};

export default Checkout;