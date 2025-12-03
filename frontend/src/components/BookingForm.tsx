import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, MapPin, MessageSquare, User, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createPayPalOrder } from '../paymentApi';

type FormData = {
  name: string;
  email: string;
  phone: string;
  services: string[];
  mehendiHours: number; // Hours for Mehendi service
  lashLiftTint: boolean; // Tint add-on for Lash Lift
  browLiftTint: boolean; // Tint add-on for Brow Lift
  threadingAreas: string[]; // Multiple threading area selections
  date: string;
  time: string;
  location: string;
  customAddress: string;
  notes: string;
  paymentMethod: 'none' | 'paypal'; // Payment method selection
};

const defaultData: FormData = {
  name: '',
  email: '',
  phone: '',
  services: [],
  mehendiHours: 0,
  lashLiftTint: false,
  browLiftTint: false,
  threadingAreas: [],
  date: '',
  time: '',
  location: '',
  customAddress: '',
  notes: '',
  paymentMethod: 'none',
};

const SERVICES_PRICING: { [key: string]: number } = {
  'lash-lift': 300,
  'brow-lift': 300,
  'makeup': 700,
  'combined-lash-brow': 500,
  'bridal-makeup': 2000,
  'mehendi': 400,
  'threading': 200,
};

const BookingForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(defaultData);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string>('');
  const [availableHours, setAvailableHours] = useState<number[]>([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const [unavailableHours, setUnavailableHours] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; email: string; phone?: string } | null>(null);
  const [expandedLashLift, setExpandedLashLift] = useState<boolean>(false);
  const [expandedBrowLift, setExpandedBrowLift] = useState<boolean>(false);
  const [expandedCombinedLashBrow, setExpandedCombinedLashBrow] = useState<boolean>(false);
  const [expandedEventMakeup, setExpandedEventMakeup] = useState<boolean>(false);
  const [expandedBridalMakeup, setExpandedBridalMakeup] = useState<boolean>(false);
  const [expandedThreading, setExpandedThreading] = useState<boolean>(false);

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      const userData = JSON.parse(user);
      setIsLoggedIn(true);
      setCurrentUser(userData);
      
      // Immediately populate form with localStorage data
      setFormData(prev => ({
        ...prev,
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      }));
      
      // Then fetch the latest profile data from backend to update if needed
      const fetchLatestProfile = async () => {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
          const response = await fetch(`${backendUrl}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const profileData = data.user || data; // Handle both response formats
            // Update form only with non-empty values from backend
            setFormData(prev => ({
              ...prev,
              name: profileData.name || prev.name || '',
              email: profileData.email || prev.email || '',
              phone: profileData.phone_number || prev.phone || '',
            }));
            // Also update localStorage with latest data
            localStorage.setItem('currentUser', JSON.stringify({
              ...userData,
              name: profileData.name || userData.name,
              email: profileData.email || userData.email,
              phone: profileData.phone_number || userData.phone,
            }));
          }
        } catch (err) {
          console.log('Could not fetch latest profile, using localStorage:', err);
        }
      };

      fetchLatestProfile();
    }

    // Listen for profile update events
    const handleProfileUpdate = (event: any) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const fetchUpdatedProfile = async () => {
          try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
            const response = await fetch(`${backendUrl}/api/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              const profileData = data.user || data; // Handle both response formats
              // Update form with latest data, preserving existing values if backend returns empty
              setFormData(prev => ({
                ...prev,
                name: profileData.name || prev.name || '',
                email: profileData.email || prev.email || '',
                phone: profileData.phone_number || prev.phone || '',
              }));
            }
          } catch (err) {
            console.log('Could not fetch updated profile:', err);
          }
        };
        fetchUpdatedProfile();
      }
    };

    // Listen for login events to instantly update the form
    const handleUserLogin = (event: any) => {
      if (event instanceof CustomEvent) {
        const { user } = event.detail;
        setIsLoggedIn(true);
        setCurrentUser(user);
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
      }
    };

    // Listen for logout events to instantly reset the form
    const handleUserLogout = (event: any) => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setFormData(defaultData);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('userLogin', handleUserLogin);
    window.addEventListener('userLogout', handleUserLogout);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('userLogin', handleUserLogin);
      window.removeEventListener('userLogout', handleUserLogout);
    };
  }, []);

  // Helper function to determine final threading area(s)
  const getThreadingAreaPrice = (areas: string[]): number => {
    if (areas.length === 0) return 0;
    
    // If 3 or more areas are selected, automatically use full-face
    if (areas.length >= 3) {
      return 250; // Full Face price
    }
    
    // If 1-2 areas selected, sum their prices
    const areaPrices: { [key: string]: number } = {
      'eyebrows': 120,
      'upper-lip': 80,
      'chin': 80,
      'full-face': 250
    };
    
    return areas.reduce((sum, area) => sum + (areaPrices[area] || 0), 0);
  };

  // Helper function to get final threading area selection (auto-convert to full-face if 3+)
  const getFinalThreadingAreas = (areas: string[]): string[] => {
    if (areas.length >= 3) {
      return ['full-face'];
    }
    return areas;
  };

  // Calculate total price
  const calculateTotalPrice = (services: string[], mehendiHours: number = 0, lashLiftTint: boolean = false, browLiftTint: boolean = false, threadingAreas: string[] = []): number => {
    let total = services.reduce((sum, service) => {
      if (service === 'mehendi' && mehendiHours > 0) {
        // Mehendi is priced per hour (400 kr/hour)
        return sum + (SERVICES_PRICING[service] * mehendiHours);
      }
      if (service === 'threading' && threadingAreas.length > 0) {
        // Threading price based on selected areas
        return sum + getThreadingAreaPrice(threadingAreas);
      }
      return sum + (SERVICES_PRICING[service] || 0);
    }, 0);
    
    // Add tint add-on if lash lift is selected and tint is enabled
    if (services.includes('lash-lift') && lashLiftTint) {
      total += 20;
    }
    
    // Add tint add-on if brow lift is selected and tint is enabled
    if (services.includes('brow-lift') && browLiftTint) {
      total += 20;
    }
    
    return total;
  };

  const totalPrice = calculateTotalPrice(formData.services, formData.mehendiHours, formData.lashLiftTint, formData.browLiftTint, formData.threadingAreas);

  // Fetch available times when date or services change
  const fetchAvailableTimes = async (date: string, services: string[], mehendiHours: number = 0) => {
    if (!date || services.length === 0) {
      // Reset to all hours if no date or services
      setAvailableHours([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
      setUnavailableHours([]);
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
      //const backendUrl = 'http://localhost:10000';
      const servicesParam = services.join(',');
      let url = `${backendUrl}/api/available-times?date=${date}&services=${servicesParam}`;
      
      // Add mehendiHours to query if mehendi service is included
      if (services.includes('mehendi') && mehendiHours > 0) {
        url += `&mehendiHours=${mehendiHours}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAvailableHours(data.availableHours || [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
        setUnavailableHours(data.unavailableHours || []);
        // Clear selected time if it's no longer available
        if (formData.time && !data.availableHours.includes(parseInt(formData.time.split(':')[0]))) {
          setFormData(prev => ({ ...prev, time: '' }));
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching available times:', err);
    }
  };

  // Auto-fetch available times when date, services, or mehendiHours change
  useEffect(() => {
    if (formData.date && formData.services.length > 0) {
      fetchAvailableTimes(formData.date, formData.services, formData.mehendiHours);
    }
  }, [formData.date, formData.services, formData.mehendiHours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one service is selected
    if (formData.services.length === 0) {
      alert(t('bookingForm.selectAtLeastOneService') || 'Please select at least one service');
      return;
    }

    // Validate Mehendi hours if Mehendi is selected
    if (formData.services.includes('mehendi') && formData.mehendiHours === 0) {
      alert(t('bookingForm.selectMehendiHours') || 'Please select hours for Mehendi service');
      return;
    }
    
    // If PayPal payment is selected, handle PayPal flow instead of direct booking
    if (formData.paymentMethod === 'paypal') {
      setIsLoading(true);
      try {
        // Prepare booking data to store for after payment
        const address = formData.location === 'studio' 
          ? 'Odengatan 56274 31 Skurup'
          : formData.customAddress;

        const finalThreadingAreas = getFinalThreadingAreas(formData.threadingAreas);
        const bookingData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: formData.services.join(', '),
          date: formData.date,
          time: formData.time,
          location: formData.location,
          address: address,
          notes: formData.notes,
          mehendiHours: formData.mehendiHours,
          lashLiftTint: formData.lashLiftTint,
          browLiftTint: formData.browLiftTint,
          threadingAreas: finalThreadingAreas,
          totalPrice: totalPrice,
          paymentMethod: 'paypal',
        };

        // Store booking data in sessionStorage for retrieval after PayPal redirect
        sessionStorage.setItem('pendingPayPalBooking', JSON.stringify(bookingData));

        const paypalOrderId = await createPayPalOrder({
          totalPrice,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: formData.services.join(', '),
        });

        // Redirect to PayPal checkout (use production URL)
        const paypalCheckoutUrl = `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`;
        window.location.href = paypalCheckoutUrl;
      } catch (err) {
        alert('Failed to create PayPal order. Please try again.');
        console.error(err);
        setIsLoading(false);
      }
      return;
    }
    
    // Regular booking flow without payment
    setIsLoading(true);
    try {
      // Determine the address based on location choice
      const address = formData.location === 'studio' 
        ? 'Odengatan 56274 31 Skurup'
        : formData.customAddress;

      // Prepare booking data - only send fields the API expects
      const finalThreadingAreas = getFinalThreadingAreas(formData.threadingAreas);
      const bookingData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.services.join(', '), // Convert array to comma-separated string
        date: formData.date,
        time: formData.time,
        location: formData.location,
        address: address,
        notes: formData.notes,
        mehendiHours: formData.mehendiHours,
        lashLiftTint: formData.lashLiftTint,
        browLiftTint: formData.browLiftTint,
        threadingAreas: finalThreadingAreas,
        totalPrice: totalPrice,
        servicePricing: formData.services.map(s => {
          if (s === 'mehendi') {
            return {
              name: s,
              price: SERVICES_PRICING[s] * formData.mehendiHours,
              hours: formData.mehendiHours
            };
          }
          if (s === 'threading') {
            return {
              name: s,
              price: getThreadingAreaPrice(formData.threadingAreas),
              areas: finalThreadingAreas
            };
          }
          return {
            name: s,
            price: SERVICES_PRICING[s] || 0,
            tint: s === 'lash-lift' && formData.lashLiftTint ? 20 : s === 'brow-lift' && formData.browLiftTint ? 20 : undefined
          };
        }),
      };

      console.log('Submitting booking data:', bookingData);

      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
      //const backendUrl = 'http://localhost:10000';
      const url = `${backendUrl}/api/booking`;
      
      // Get JWT token if user is logged in
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('📤 Sending request with Authorization header');
      } else {
        console.log('📤 Sending request WITHOUT Authorization header');
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData),
      });

      console.log('Response status:', resp.status);

      if (resp.ok) {
        const responseData = await resp.json();
        console.log('Success response:', responseData);
        setSubmitted(true);
        setFormData(defaultData);
        setTimeout(() => setSubmitted(false), 5000);
      } else if (resp.status === 409) {
        // Time slot conflict - refresh available times and show error
        const data = await resp.json().catch(() => null);
        console.error('Time slot conflict:', data);
        await fetchAvailableTimes(formData.date, formData.services, formData.mehendiHours);
        alert(data?.message || 'This time slot is already booked. Available times have been updated. Please select a different time.');
        setFormData(prev => ({ ...prev, time: '' }));
      } else {
        const data = await resp.json().catch(() => null);
        console.error('Booking api error - Status:', resp.status, 'Data:', data);
        alert((data && data.message) || 'Failed to send booking request. Please try again.');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Booking submit error:', err);
      alert('An error occurred while sending booking request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="booking"
      className="min-h-screen py-16 px-4 relative"
      style={{ background: 'linear-gradient(180deg, #fff6f8 0%, #fff1f3 100%)', overflow: 'visible' }}
    >
      {/* Decorative background elements (purely decorative, class names assume CSS/tailwind exists) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-secondary opacity-10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-card rounded-full shadow-rose">
            <Sparkles className="w-5 h-5 text-primary animate-glow-pulse" />
            <span className="text-sm font-medium bg-gradient-primary bg-clip-text text-transparent">{t('bookingForm.badge')}</span>
          </div>
          <h2
            className="text-6xl md:text-7xl font-bold mb-4"
            style={{
              background: 'linear-gradient(90deg, #ff4d4f 0%, #ff85a1 100%)',
              WebkitBackgroundClip: 'text' as any,
              backgroundClip: 'text' as any,
              color: 'transparent',
            }}
          >
            {t('bookingForm.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('bookingForm.subtitle')}</p>
        </div>

        {/* Pricing Section */}
        <div className="pricing-section" style={{ marginBottom: '48px' }}>
          <h3 
            className="text-3xl md:text-4xl font-bold text-center mb-8"
            style={{
              background: 'linear-gradient(90deg, #ff4d4f 0%, #ff85a1 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {t('bookingForm.pricingTitle') || 'Our Services & Pricing'}
          </h3>
          <style>{`
            .pricing-grid {
              display: grid;
              gap: 20px;
              margin-bottom: 32px;
              width: 100%;
              box-sizing: border-box;
              max-width: 100%;
            }
            
            /* Desktop: 3-4 cards per row */
            @media (min-width: 769px) {
              .pricing-grid {
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              }
            }
            
            /* Tablet: 2 cards per row */
            @media (min-width: 641px) and (max-width: 768px) {
              .pricing-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                width: 100%;
              }
            }
            
            /* Mobile: 2 cards per row with smaller sizing */
            @media (max-width: 640px) {
              .pricing-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                width: 100%;
                max-width: 100%;
              }
              .service-card {
                padding: 16px !important;
                box-sizing: border-box !important;
                word-wrap: break-word;
                overflow-wrap: break-word;
                width: 100%;
                max-width: 100%;
                overflow: hidden;
              }
              .service-card-icon {
                font-size: 2rem !important;
                margin-bottom: 8px !important;
              }
              .service-card-name {
                font-size: 1rem !important;
                margin-bottom: 6px !important;
              }
              .service-card-price {
                font-size: 1.1rem !important;
                margin-bottom: 8px !important;
              }
              .service-card-description {
                font-size: 0.8rem !important;
                margin-bottom: 12px !important;
                min-height: 32px !important;
              }
              .service-card-button {
                padding: 8px !important;
                font-size: 0.85rem !important;
              }
            }
          `}</style>
          <div className="pricing-grid">
            {[
              { icon: '🌸', name: t('bookingForm.serviceLashLift'), price: '300 kr', value: 'lash-lift', description: t('bookingForm.priceLashLift') || 'Natural lift and curl', details: { duration: t('bookingForm.lashLiftDuration'), fullDescription: t('bookingForm.lashLiftDescription'), how: t('bookingForm.lashLiftHow'), result: t('bookingForm.lashLiftResult'), tint: t('bookingForm.lashLiftTint') } },
              { icon: '✨', name: t('bookingForm.serviceBrowLift'), price: '300 kr', value: 'brow-lift', description: t('bookingForm.priceBrowLift') || 'Perfectly shaped brows', details: { duration: t('bookingForm.browLiftDuration'), fullDescription: t('bookingForm.browLiftDescription'), how: t('bookingForm.browLiftHow'), result: t('bookingForm.browLiftResult'), tint: t('bookingForm.browLiftTint') } },
              { icon: '💄', name: t('bookingForm.serviceMakeup'), price: '700 kr', value: 'makeup', description: t('bookingForm.priceMakeup') || 'Customized event makeup', details: { duration: t('bookingForm.eventMakeupDuration'), fullDescription: t('bookingForm.eventMakeupDescription'), how: t('bookingForm.eventMakeupHow'), result: t('bookingForm.eventMakeupResult') } },
              { icon: '⭐', name: t('bookingForm.combinedLashBrowTitle'), price: '500 kr', value: 'combined-lash-brow', description: t('bookingForm.combinedLashBrowDescription') || 'Lash Lift + Brow Lift', details: { duration: t('bookingForm.combinedLashBrowDuration'), fullDescription: t('bookingForm.combinedLashBrowDescription'), how: t('bookingForm.combinedLashBrowHow'), result: t('bookingForm.combinedLashBrowResult') } },
              { icon: '👰', name: t('bookingForm.serviceBridalMakeup'), price: '2000 kr', value: 'bridal-makeup', description: t('bookingForm.priceBridalMakeup') || 'Your special day, perfected', details: { duration: t('bookingForm.bridalMakeupDuration'), fullDescription: t('bookingForm.bridalMakeupDescription'), how: t('bookingForm.bridalMakeupHow'), result: t('bookingForm.bridalMakeupResult') } },
              { icon: '🎨', name: t('bookingForm.serviceMehendi'), price: '400 kr/hr', value: 'mehendi', description: t('bookingForm.priceMehendi') || 'Intricate henna designs' },
              { icon: '🧵', name: t('bookingForm.serviceThreading'), price: '200 kr', value: 'threading', description: t('bookingForm.priceThreading') || 'Precise facial threading', details: { duration: t('bookingForm.threadingDuration'), fullDescription: t('bookingForm.threadingDescription'), how: t('bookingForm.threadingHow'), result: t('bookingForm.threadingResult') } },
            ].map((service) => (
              <div
                key={service.value}
                className="service-card"
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: formData.services.includes(service.value) ? '2px solid #ff6fa3' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 111, 163, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onClick={() => {
                  const isSelected = formData.services.includes(service.value);
                  const updatedServices = isSelected
                    ? formData.services.filter((s) => s !== service.value)
                    : [...formData.services, service.value];
                  
                  // Reset lashLiftTint if lash-lift is being removed
                  // Reset browLiftTint if brow-lift is being removed
                  // Reset bridalMakeupTint if bridal-makeup is being removed
                  // Reset threadingAreas if threading is being removed
                  const updatedFormData = { 
                    ...formData, 
                    services: updatedServices,
                    ...(service.value === 'lash-lift' && isSelected && { lashLiftTint: false }),
                    ...(service.value === 'brow-lift' && isSelected && { browLiftTint: false }),
                    ...(service.value === 'bridal-makeup' && isSelected && { bridalMakeupTint: false }),
                    ...(service.value === 'threading' && isSelected && { threadingAreas: [] })
                  };
                  
                  setFormData(updatedFormData);
                  // Fetch available times with updated services
                  if (formData.date) {
                    fetchAvailableTimes(formData.date, updatedServices, formData.mehendiHours);
                  }
                }}
              >
                <div className="service-card-icon" style={{ fontSize: '3rem', marginBottom: '12px', textAlign: 'center' }}>{service.icon}</div>
                <h4 className="service-card-name" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center', color: '#1f2937' }}>
                  {service.name}
                </h4>
                <p className="service-card-price" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6fa3', marginBottom: '12px', textAlign: 'center' }}>
                  {service.price}
                </p>
                <p className="service-card-description" style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '16px', textAlign: 'center', minHeight: '40px' }}>
                  {service.description}
                </p>
                
                {/* Lash Lift Detailed Information - Expandable */}
                {service.value === 'lash-lift' && service.details && (
                  <>
                    {/* Header with Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLashLift(!expandedLashLift);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#fff6f8',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: expandedLashLift ? '0' : '16px',
                        fontSize: '0.95rem',
                        color: '#ff6fa3',
                        border: '1px solid #ffe0e8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{t('bookingForm.serviceDetails')}</span>
                      <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease', transform: expandedLashLift ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>

                    {/* Expandable Details Content */}
                    {expandedLashLift && (
                      <div style={{
                        backgroundColor: '#fff6f8',
                        borderRadius: '0 0 8px 8px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        textAlign: 'left',
                        border: '1px solid #ffe0e8',
                        borderTop: 'none',
                        animation: 'slideDown 0.3s ease'
                      }}>
                        <style>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              max-height: 0;
                            }
                            to {
                              opacity: 1;
                              max-height: 500px;
                            }
                          }
                        `}</style>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#ff6fa3' }}>⏱️ {service.details?.duration}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>📝</strong> {service.details?.fullDescription}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✓</strong> {service.details?.how}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✨</strong> {service.details?.result}</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#ff6fa3' }}>➕ {service.details?.tint}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Lash Lift Tint Add-on Selector */}
                {service.value === 'lash-lift' && formData.services.includes('lash-lift') && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#fff6f8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, lashLiftTint: false });
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '2px solid #ff6fa3',
                        background: formData.lashLiftTint ? 'white' : '#ff6fa3',
                        color: formData.lashLiftTint ? '#ff6fa3' : 'white',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      −
                    </button>
                    <div style={{
                      minWidth: '80px',
                      textAlign: 'center',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#ff6fa3'
                    }}>
                      {formData.lashLiftTint ? '+20 kr' : 'No Tint'}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, lashLiftTint: true });
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '2px solid #ff6fa3',
                        background: formData.lashLiftTint ? '#ff6fa3' : 'white',
                        color: formData.lashLiftTint ? 'white' : '#ff6fa3',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Brow Lift Details Section */}
                {service.value === 'brow-lift' && service.details && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBrowLift(!expandedBrowLift);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#fff6f8',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: expandedBrowLift ? '0' : '16px',
                        fontSize: '0.95rem',
                        color: '#ff6fa3',
                        border: '1px solid #ffe0e8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{t('bookingForm.serviceDetails')}</span>
                      <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease', transform: expandedBrowLift ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                    {expandedBrowLift && (
                      <div style={{
                        backgroundColor: '#fff6f8',
                        borderRadius: '0 0 8px 8px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        textAlign: 'left',
                        border: '1px solid #ffe0e8',
                        borderTop: 'none',
                        animation: 'slideDown 0.3s ease'
                      }}>
                        <style>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              max-height: 0;
                            }
                            to {
                              opacity: 1;
                              max-height: 500px;
                            }
                          }
                        `}</style>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#ff6fa3' }}>⏱️ {service.details?.duration}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>📝</strong> {service.details?.fullDescription}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✓</strong> {service.details?.how}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✨</strong> {service.details?.result}</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#ff6fa3' }}>➕ {service.details?.tint}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Brow Lift Tint Add-on Selector */}
                {service.value === 'brow-lift' && formData.services.includes('brow-lift') && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#fff6f8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, browLiftTint: false });
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '2px solid #ff6fa3',
                        background: formData.browLiftTint ? 'white' : '#ff6fa3',
                        color: formData.browLiftTint ? '#ff6fa3' : 'white',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      −
                    </button>
                    <div style={{
                      minWidth: '80px',
                      textAlign: 'center',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#ff6fa3'
                    }}>
                      {formData.browLiftTint ? '+20 kr' : 'No Tint'}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, browLiftTint: true });
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '2px solid #ff6fa3',
                        background: formData.browLiftTint ? '#ff6fa3' : 'white',
                        color: formData.browLiftTint ? 'white' : '#ff6fa3',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Combined Lash + Brow Lift Details Section */}
                {service.value === 'combined-lash-brow' && service.details && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCombinedLashBrow(!expandedCombinedLashBrow);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#fff6f8',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: expandedCombinedLashBrow ? '0' : '16px',
                        fontSize: '0.95rem',
                        color: '#ff6fa3',
                        border: '1px solid #ffe0e8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{t('bookingForm.serviceDetails')}</span>
                      <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease', transform: expandedCombinedLashBrow ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>

                    {/* Expandable Details Content */}
                    {expandedCombinedLashBrow && (
                      <div style={{
                        backgroundColor: '#fff6f8',
                        borderRadius: '0 0 8px 8px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        textAlign: 'left',
                        border: '1px solid #ffe0e8',
                        borderTop: 'none',
                        animation: 'slideDown 0.3s ease'
                      }}>
                        <style>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              max-height: 0;
                            }
                            to {
                              opacity: 1;
                              max-height: 500px;
                            }
                          }
                        `}</style>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#ff6fa3' }}>⏱️ {service.details?.duration}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>📝</strong> {service.details?.fullDescription}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✓</strong> {service.details?.how}</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#ff6fa3' }}>✨ {service.details?.result}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Event Makeup Details Section */}
                {service.value === 'makeup' && service.details && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedEventMakeup(!expandedEventMakeup);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#fff6f8',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: expandedEventMakeup ? '0' : '16px',
                        fontSize: '0.95rem',
                        color: '#ff6fa3',
                        border: '1px solid #ffe0e8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{t('bookingForm.serviceDetails')}</span>
                      <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease', transform: expandedEventMakeup ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>

                    {/* Expandable Details Content */}
                    {expandedEventMakeup && (
                      <div style={{
                        backgroundColor: '#fff6f8',
                        borderRadius: '0 0 8px 8px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        textAlign: 'left',
                        border: '1px solid #ffe0e8',
                        borderTop: 'none',
                        animation: 'slideDown 0.3s ease'
                      }}>
                        <style>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              max-height: 0;
                            }
                            to {
                              opacity: 1;
                              max-height: 500px;
                            }
                          }
                        `}</style>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#ff6fa3' }}>⏱️ {service.details?.duration}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>📝</strong> {service.details?.fullDescription}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✓</strong> {service.details?.how}</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#ff6fa3' }}>✨ {service.details?.result}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Bridal Makeup Details Section */}
                {service.value === 'bridal-makeup' && service.details && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBridalMakeup(!expandedBridalMakeup);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#fff6f8',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: expandedBridalMakeup ? '0' : '16px',
                        fontSize: '0.95rem',
                        color: '#ff6fa3',
                        border: '1px solid #ffe0e8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{t('bookingForm.serviceDetails')}</span>
                      <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease', transform: expandedBridalMakeup ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>

                    {/* Expandable Details Content */}
                    {expandedBridalMakeup && (
                      <div style={{
                        backgroundColor: '#fff6f8',
                        borderRadius: '0 0 8px 8px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        textAlign: 'left',
                        border: '1px solid #ffe0e8',
                        borderTop: 'none',
                        animation: 'slideDown 0.3s ease'
                      }}>
                        <style>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              max-height: 0;
                            }
                            to {
                              opacity: 1;
                              max-height: 500px;
                            }
                          }
                        `}</style>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#ff6fa3' }}>⏱️ {service.details?.duration}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>📝</strong> {service.details?.fullDescription}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✓</strong> {service.details?.how}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✨</strong> {service.details?.result}</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#ff6fa3' }}>➕ {service.details?.tint}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Threading Details Section */}
                {service.value === 'threading' && service.details && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedThreading(!expandedThreading);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#fff6f8',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: expandedThreading ? '0' : '16px',
                        fontSize: '0.95rem',
                        color: '#ff6fa3',
                        border: '1px solid #ffe0e8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{t('bookingForm.serviceDetails')}</span>
                      <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease', transform: expandedThreading ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>

                    {/* Expandable Details Content */}
                    {expandedThreading && (
                      <div style={{
                        backgroundColor: '#fff6f8',
                        borderRadius: '0 0 8px 8px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '0.85rem',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        textAlign: 'left',
                        border: '1px solid #ffe0e8',
                        borderTop: 'none',
                        animation: 'slideDown 0.3s ease'
                      }}>
                        <style>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              max-height: 0;
                            }
                            to {
                              opacity: 1;
                              max-height: 500px;
                            }
                          }
                        `}</style>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#ff6fa3' }}>⏱️ {service.details?.duration}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>📝</strong> {service.details?.fullDescription}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>✓</strong> {service.details?.how}</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#ff6fa3' }}>✨ {service.details?.result}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Hours selector for Mehendi */}
                {service.value === 'mehendi' && formData.services.includes('mehendi') && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#fff6f8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (formData.mehendiHours > 1) {
                          setFormData({ ...formData, mehendiHours: formData.mehendiHours - 1 });
                        }
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '2px solid #ff6fa3',
                        background: 'white',
                        color: '#ff6fa3',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      −
                    </button>
                    <div style={{
                      minWidth: '50px',
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#ff6fa3'
                    }}>
                      {formData.mehendiHours}h
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, mehendiHours: formData.mehendiHours + 1 });
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '2px solid #ff6fa3',
                        background: '#ff6fa3',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Area selector for Threading */}
                {service.value === 'threading' && formData.services.includes('threading') && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#fff6f8',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    width: '100%',
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#ff6fa3',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {t('bookingForm.threadingAreas') || 'Select threading areas (3+ auto-selects full face):'}
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      width: '100%',
                      boxSizing: 'border-box',
                      maxWidth: '100%'
                    }}>
                      {[
                        { id: 'eyebrows', label: t('bookingForm.threadingEyebrows') || 'Eyebrows - 120 kr' },
                        { id: 'upper-lip', label: t('bookingForm.threadingUpperLip') || 'Upper Lip - 80 kr' },
                        { id: 'chin', label: t('bookingForm.threadingChin') || 'Chin - 80 kr' },
                        { id: 'full-face', label: t('bookingForm.threadingFullFace') || 'Full Face - 250 kr' }
                      ].map((option) => {
                        const isSelected = formData.threadingAreas.includes(option.id);
                        const hasFullFace = formData.threadingAreas.includes('full-face');
                        const isIndividualArea = option.id !== 'full-face';
                        // Disable individual areas if full-face is selected, and disable full-face if individual areas are selected
                        const isDisabled = (isIndividualArea && hasFullFace) || (!isIndividualArea && formData.threadingAreas.length > 0 && !hasFullFace);
                        
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDisabled) return;
                              
                              let updatedAreas: string[] = [];
                              
                              if (option.id === 'full-face') {
                                // If full-face is clicked, toggle it alone
                                updatedAreas = isSelected ? [] : ['full-face'];
                              } else if (isSelected) {
                                // Remove the area if already selected
                                updatedAreas = formData.threadingAreas.filter(a => a !== option.id);
                              } else {
                                // Add the area
                                updatedAreas = [...formData.threadingAreas, option.id];
                                // If 3 areas are now selected, auto-convert to full-face
                                if (updatedAreas.length >= 3) {
                                  updatedAreas = ['full-face'];
                                }
                              }
                              
                              setFormData({ ...formData, threadingAreas: updatedAreas });
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '6px',
                              border: isSelected ? 'none' : '2px solid #ff6fa3',
                              background: isSelected 
                                ? 'linear-gradient(90deg, #ff6fa3 0%, #ff9ccf 100%)'
                                : isDisabled ? '#e5e7eb' : 'white',
                              color: isSelected ? 'white' : isDisabled ? '#9ca3af' : '#ff6fa3',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center',
                              opacity: isDisabled ? 0.5 : 1,
                              width: '100%',
                              boxSizing: 'border-box',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected && !isDisabled) {
                                e.currentTarget.style.background = '#fff0f5';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected && !isDisabled) {
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                            {isSelected && '✓ '}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {formData.threadingAreas.length > 0 && (
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        paddingTop: '4px',
                        borderTop: '1px solid #ffe0e8'
                      }}>
                        Selected: {formData.threadingAreas.includes('full-face') 
                          ? (t('bookingForm.threadingFullFace') || 'Full Face')
                          : formData.threadingAreas.map(a => {
                              const areaNames: { [key: string]: string } = {
                                'eyebrows': t('bookingForm.threadingEyebrows') || 'Eyebrows',
                                'upper-lip': t('bookingForm.threadingUpperLip') || 'Upper Lip',
                                'chin': t('bookingForm.threadingChin') || 'Chin'
                              };
                              return areaNames[a] || a;
                            }).join(' + ')}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="service-card-button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: formData.services.includes(service.value) 
                      ? 'linear-gradient(90deg, #ff6fa3 0%, #ff9ccf 100%)'
                      : '#f3f4f6',
                    color: formData.services.includes(service.value) ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    if (!formData.services.includes(service.value)) {
                      e.currentTarget.style.background = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.services.includes(service.value)) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                >
                  {formData.services.includes(service.value) 
                    ? `✓ ${t('bookingForm.selected') || 'Selected'}`
                    : t('bookingForm.selectService') || 'Select Service'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="form-card">
          {/* Inner white section requested: two-per-row fields, slightly larger inputs */}
          <div className="booking-inner-card">
            <form onSubmit={handleSubmit} className="booking-form">
            <div className="booking-grid">
              {/* Name - Hidden when logged in */}
              {!isLoggedIn && (
                <div className="form-group">
                  <label htmlFor="bf-name" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <User className="w-4 h-4 text-primary" />
                    {t('bookingForm.nameLabel')} *
                  </label>
                  <div className="relative">
                    <input
                      id="bf-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      placeholder={t('bookingForm.namePlaceholder')}
                      className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focusedField === 'name' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                    />
                  </div>
                </div>
              )}
              
              {/* Name Display - Shown when logged in */}
              {isLoggedIn && (
                <div className="form-group">
                  <label className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <User className="w-4 h-4 text-primary" />
                    {t('bookingForm.nameLabel')}
                  </label>
                  <div className="relative">
                    <div style={{
                      width: '100%',
                      padding: '16px 24px',
                      fontSize: '1rem',
                      backgroundColor: '#f3f4f6',
                      border: '2px solid #e5e7eb',
                      borderRadius: '16px',
                      color: '#666',
                      fontWeight: '500',
                    }}>
                      {formData.name}
                    </div>
                  </div>
                </div>
              )}

              {/* Email - Hidden when logged in */}
              {!isLoggedIn && (
                <div className="form-group">
                  <label htmlFor="bf-email" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    {t('bookingForm.emailLabel')} *
                  </label>
                  <div className="relative">
                    <input
                      id="bf-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      placeholder={t('bookingForm.emailPlaceholder')}
                      className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focusedField === 'email' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                    />
                  </div>
                </div>
              )}
              
              {/* Email Display - Shown when logged in */}
              {isLoggedIn && (
                <div className="form-group">
                  <label className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    {t('bookingForm.emailLabel')}
                  </label>
                  <div className="relative">
                    <div style={{
                      width: '100%',
                      padding: '16px 24px',
                      fontSize: '1rem',
                      backgroundColor: '#f3f4f6',
                      border: '2px solid #e5e7eb',
                      borderRadius: '16px',
                      color: '#666',
                      fontWeight: '500',
                      wordBreak: 'break-all',
                    }}>
                      {formData.email}
                    </div>
                  </div>
                </div>
              )}

              {/* Phone - Hidden when logged in */}
              {!isLoggedIn && (
                <div className="form-group">
                  <label htmlFor="bf-phone" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    {t('bookingForm.phoneLabel')} *
                  </label>
                  <div className="relative">
                    <input
                      id="bf-phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField('')}
                      placeholder={t('bookingForm.phonePlaceholder')}
                      className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focusedField === 'phone' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                    />
                  </div>
                </div>
              )}
              
              {/* Phone Display - Shown when logged in (optional) */}
              {isLoggedIn && (
                <div className="form-group">
                  <label className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    {t('bookingForm.phoneLabel')} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#999' }}>(Optional)</span>
                  </label>
                  <div className="relative">
                    <div style={{
                      width: '100%',
                      padding: '16px 24px',
                      fontSize: '1rem',
                      backgroundColor: '#f3f4f6',
                      border: '2px solid #e5e7eb',
                      borderRadius: '16px',
                      color: formData.phone ? '#666' : '#999',
                      fontWeight: '500',
                    }}>
                      {formData.phone || '(Not provided)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Services - Multiple Selection */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <style>{`
                  .services-grid {
                    display: grid;
                    gap: 12px;
                  }
                  
                  /* Desktop: auto-fit layout */
                  @media (min-width: 769px) {
                    .services-grid {
                      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    }
                  }
                  
                  /* Mobile: 2 columns with smaller sizing */
                  @media (max-width: 768px) {
                    .services-grid {
                      grid-template-columns: repeat(2, 1fr);
                      gap: 8px;
                    }
                    .service-checkbox {
                      padding: 8px 12px !important;
                      gap: 8px !important;
                    }
                    .service-checkbox input[type="checkbox"] {
                      width: 16px !important;
                      height: 16px !important;
                    }
                    .service-checkbox span {
                      font-size: 0.85rem !important;
                    }
                  }
                `}</style>
                <label className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t('bookingForm.serviceLabel')} * <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666' }}>({t('bookingForm.selectMultiple') || 'Select one or more'})</span>
                </label>
                <div className="services-grid">
                  {[
                    { value: 'lash-lift', label: t('bookingForm.serviceLashLift') },
                    { value: 'brow-lift', label: t('bookingForm.serviceBrowLift') },
                    { value: 'makeup', label: t('bookingForm.serviceMakeup') },
                    { value: 'bridal-makeup', label: t('bookingForm.serviceBridalMakeup') },
                    { value: 'mehendi', label: t('bookingForm.serviceMehendi') },
                    { value: 'threading', label: t('bookingForm.serviceThreading') },
                  ].map((service) => (
                    <div key={service.value}>
                      <label
                        className={`service-checkbox ${formData.services.includes(service.value) ? 'selected' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          border: '2px solid',
                          borderColor: formData.services.includes(service.value) ? '#ff6fa3' : '#e5e7eb',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          backgroundColor: formData.services.includes(service.value) ? '#fff6f8' : 'white',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service.value)}
                          onChange={(e) => {
                            const updatedServices = e.target.checked
                              ? [...formData.services, service.value]
                              : formData.services.filter((s) => s !== service.value);
                            
                            // Reset lashLiftTint if lash-lift is being removed
                            const updatedFormData = {
                              ...formData,
                              services: updatedServices,
                              ...(service.value === 'lash-lift' && !e.target.checked && { lashLiftTint: false })
                            };
                            
                            setFormData(updatedFormData);
                            // Fetch available times with updated services
                            if (formData.date) {
                              fetchAvailableTimes(formData.date, updatedServices, formData.mehendiHours);
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff6fa3' }}
                        />
                        <span style={{ fontSize: '1rem', userSelect: 'none' }}>{service.label}</span>
                      </label>

                      {/* Hours selector for Mehendi in checkbox */}
                      {service.value === 'mehendi' && formData.services.includes('mehendi') && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#fff6f8',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (formData.mehendiHours > 1) {
                                setFormData({ ...formData, mehendiHours: formData.mehendiHours - 1 });
                              }
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '2px solid #ff6fa3',
                              background: 'white',
                              color: '#ff6fa3',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            −
                          </button>
                          <div style={{
                            minWidth: '45px',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#ff6fa3'
                          }}>
                            {formData.mehendiHours}h
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, mehendiHours: formData.mehendiHours + 1 });
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '2px solid #ff6fa3',
                              background: '#ff6fa3',
                              color: 'white',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* Lash Lift Tint Add-on Selector */}
                      {service.value === 'lash-lift' && formData.services.includes('lash-lift') && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#fff6f8',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, lashLiftTint: false });
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '2px solid #ff6fa3',
                              background: formData.lashLiftTint ? 'white' : '#ff6fa3',
                              color: formData.lashLiftTint ? '#ff6fa3' : 'white',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            −
                          </button>
                          <div style={{
                            minWidth: '80px',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#ff6fa3'
                          }}>
                            {formData.lashLiftTint ? '+20 kr' : 'No Tint'}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, lashLiftTint: true });
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '2px solid #ff6fa3',
                              background: formData.lashLiftTint ? '#ff6fa3' : 'white',
                              color: formData.lashLiftTint ? 'white' : '#ff6fa3',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* Brow Lift Tint Add-on Selector */}
                      {service.value === 'brow-lift' && formData.services.includes('brow-lift') && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#fff6f8',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, browLiftTint: false });
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '2px solid #ff6fa3',
                              background: formData.browLiftTint ? 'white' : '#ff6fa3',
                              color: formData.browLiftTint ? '#ff6fa3' : 'white',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            −
                          </button>
                          <div style={{
                            minWidth: '80px',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#ff6fa3'
                          }}>
                            {formData.browLiftTint ? '+20 kr' : 'No Tint'}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, browLiftTint: true });
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '2px solid #ff6fa3',
                              background: formData.browLiftTint ? '#ff6fa3' : 'white',
                              color: formData.browLiftTint ? 'white' : '#ff6fa3',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* Area selector for Threading in checkbox */}
                      {service.value === 'threading' && formData.services.includes('threading') && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#fff6f8',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          width: '100%',
                          boxSizing: 'border-box',
                          maxWidth: '100%',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#ff6fa3',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}>
                            {t('bookingForm.threadingAreas') || 'Select areas:'}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '6px',
                            width: '100%',
                            boxSizing: 'border-box',
                            maxWidth: '100%'
                          }}>
                            {[
                              { id: 'eyebrows', label: t('bookingForm.threadingEyebrows') || 'Eyebrows - 120 kr' },
                              { id: 'upper-lip', label: t('bookingForm.threadingUpperLip') || 'Upper Lip - 80 kr' },
                              { id: 'chin', label: t('bookingForm.threadingChin') || 'Chin - 80 kr' },
                              { id: 'full-face', label: t('bookingForm.threadingFullFace') || 'Full Face - 250 kr' }
                            ].map((option) => {
                              const isSelected = formData.threadingAreas.includes(option.id);
                              const hasFullFace = formData.threadingAreas.includes('full-face');
                              const isIndividualArea = option.id !== 'full-face';
                              const isDisabled = (isIndividualArea && hasFullFace) || (!isIndividualArea && formData.threadingAreas.length > 0 && !hasFullFace);
                              
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (isDisabled) return;
                                    
                                    let updatedAreas: string[] = [];
                                    
                                    if (option.id === 'full-face') {
                                      updatedAreas = isSelected ? [] : ['full-face'];
                                    } else if (isSelected) {
                                      updatedAreas = formData.threadingAreas.filter(a => a !== option.id);
                                    } else {
                                      updatedAreas = [...formData.threadingAreas, option.id];
                                      if (updatedAreas.length >= 3) {
                                        updatedAreas = ['full-face'];
                                      }
                                    }
                                    
                                    setFormData({ ...formData, threadingAreas: updatedAreas });
                                  }}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    border: isSelected ? 'none' : '2px solid #ff6fa3',
                                    background: isSelected 
                                      ? 'linear-gradient(90deg, #ff6fa3 0%, #ff9ccf 100%)'
                                      : isDisabled ? '#e5e7eb' : 'white',
                                    color: isSelected ? 'white' : isDisabled ? '#9ca3af' : '#ff6fa3',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'center',
                                    opacity: isDisabled ? 0.5 : 1,
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {isSelected && '✓ '}
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                          {formData.threadingAreas.length > 0 && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontStyle: 'italic',
                              paddingTop: '4px',
                              borderTop: '1px solid #ffe0e8',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}>
                              Selected: {formData.threadingAreas.includes('full-face') 
                                ? (t('bookingForm.threadingFullFace') || 'Full Face')
                                : formData.threadingAreas.map(a => {
                                    const areaNames: { [key: string]: string } = {
                                      'eyebrows': t('bookingForm.threadingEyebrows') || 'Eyebrows',
                                      'upper-lip': t('bookingForm.threadingUpperLip') || 'Upper Lip',
                                      'chin': t('bookingForm.threadingChin') || 'Chin'
                                    };
                                    return areaNames[a] || a;
                                  }).join(' + ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {formData.services.length === 0 && (
                  <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '8px' }}>{t('bookingForm.servicePlaceholder')}</p>
                )}
              </div>

              {/* Pricing Box */}
              {formData.services.length > 0 && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #fff6f8 0%, #fff1f3 100%)',
                    border: '2px solid #ff6fa3',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💰 {t('bookingForm.pricingSummary') || 'Pricing Summary'}
                    </h4>
                    
                    {formData.services.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        {formData.services.map((serviceValue) => {
                          // Map service value to display name
                          const serviceNames: { [key: string]: string } = {
                            'lash-lift': t('bookingForm.serviceLashLift'),
                            'brow-lift': t('bookingForm.serviceBrowLift'),
                            'makeup': t('bookingForm.serviceMakeup'),
                            'bridal-makeup': t('bookingForm.serviceBridalMakeup'),
                            'mehendi': t('bookingForm.serviceMehendi'),
                            'threading': t('bookingForm.serviceThreading'),
                          };

                          // Calculate price for this service
                          let servicePrice = SERVICES_PRICING[serviceValue] || 0;
                          let priceLabel = `${servicePrice} kr`;
                          
                          if (serviceValue === 'mehendi' && formData.mehendiHours > 0) {
                            servicePrice = SERVICES_PRICING[serviceValue] * formData.mehendiHours;
                            priceLabel = `${SERVICES_PRICING[serviceValue]} kr × ${formData.mehendiHours}h = ${servicePrice} kr`;
                          }
                          
                          if (serviceValue === 'threading' && formData.threadingAreas.length > 0) {
                            servicePrice = getThreadingAreaPrice(formData.threadingAreas);
                            priceLabel = `${servicePrice} kr`;
                          }
                          
                          return (
                            <div key={serviceValue}>
                              <div 
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '8px 0',
                                  borderBottom: '1px solid rgba(255, 111, 163, 0.2)',
                                  fontSize: '0.95rem',
                                  flexWrap: 'wrap',
                                  gap: '8px'
                                }}
                              >
                                <span style={{ color: '#374151' }}>{serviceNames[serviceValue] || serviceValue}</span>
                                <span style={{ fontWeight: '600', color: '#ff6fa3' }}>{priceLabel}</span>
                              </div>
                              
                              {/* Lash Lift Tint Add-on in Pricing */}
                              {serviceValue === 'lash-lift' && formData.lashLiftTint && (
                                <div 
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0 8px 16px',
                                    borderBottom: '1px solid rgba(255, 111, 163, 0.2)',
                                    fontSize: '0.9rem',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    fontStyle: 'italic',
                                    color: '#ff6fa3'
                                  }}
                                >
                                  <span style={{ color: '#6b7280' }}>  ➕ {t('bookingForm.lashLiftTint') || 'Tint Add-on'}</span>
                                  <span style={{ fontWeight: '600', color: '#ff6fa3' }}>+20 kr</span>
                                </div>
                              )}
                              
                              {/* Brow Lift Tint Add-on in Pricing */}
                              {serviceValue === 'brow-lift' && formData.browLiftTint && (
                                <div 
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0 8px 16px',
                                    borderBottom: '1px solid rgba(255, 111, 163, 0.2)',
                                    fontSize: '0.9rem',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    fontStyle: 'italic',
                                    color: '#ff6fa3'
                                  }}
                                >
                                  <span style={{ color: '#6b7280' }}>  ➕ {t('bookingForm.browLiftTint') || 'Tint Add-on'}</span>
                                  <span style={{ fontWeight: '600', color: '#ff6fa3' }}>+20 kr</span>
                                </div>
                              )}
                              
                              {/* Threading Areas in Pricing */}
                              {serviceValue === 'threading' && formData.threadingAreas.length > 0 && (
                                <div 
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0 8px 16px',
                                    borderBottom: '1px solid rgba(255, 111, 163, 0.2)',
                                    fontSize: '0.9rem',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    fontStyle: 'italic',
                                    color: '#ff6fa3'
                                  }}
                                >
                                  <span style={{ color: '#6b7280' }}>  🧵 {(() => {
                                    const areaNames: { [key: string]: string } = {
                                      'eyebrows': t('bookingForm.threadingEyebrows') || 'Eyebrows',
                                      'upper-lip': t('bookingForm.threadingUpperLip') || 'Upper Lip',
                                      'chin': t('bookingForm.threadingChin') || 'Chin',
                                      'full-face': t('bookingForm.threadingFullFace') || 'Full Face'
                                    };
                                    const finalAreas = getFinalThreadingAreas(formData.threadingAreas);
                                    return finalAreas.map(a => areaNames[a] || a).join(' + ');
                                  })()}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '2px solid #ff6fa3'
                    }}>
                      <span style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '700', 
                        color: '#1f2937' 
                      }}>
                        {t('bookingForm.totalPrice') || 'Total Price'}:
                      </span>
                      <span style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700', 
                        background: 'linear-gradient(90deg, #ff6fa3 0%, #ff9ccf 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                      }}>
                        {totalPrice} kr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Support Message - Always Visible */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'linear-gradient(135deg, #E0F2FE 0%, #EFF6FF 100%)',
                border: '2px solid #3B82F6',
                borderRadius: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  flexShrink: 0,
                  fontSize: '18px'
                }}>
                  🕒
                </div>
                <div>
                  <p style={{
                    color: '#1f2937',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '1rem'
                  }}>
                    {t('bookingForm.supportMessageTitle')}
                  </p>
                  <p style={{
                    color: '#4b5563',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    {(() => {
                      const content = t('bookingForm.supportMessageContent');
                      const currentLanguage = i18n.language;
                      
                      if (currentLanguage === 'en') {
                        const parts = content.split('contact us');
                        if (parts.length > 1) {
                          return (
                            <>
                              {parts[0]}
                              <button
                                type="button"
                                onClick={() => navigate('/contact')}
                                style={{
                                  color: '#2563EB',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  border: 'none',
                                  background: 'none',
                                  padding: '0',
                                  transition: 'text-decoration 0.2s',
                                  display: 'inline',
                                  fontSize: 'inherit'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                contact us
                              </button>
                              {parts[1]}
                            </>
                          );
                        }
                      } else if (currentLanguage === 'sv') {
                        const parts = content.split('kontakta oss');
                        if (parts.length > 1) {
                          return (
                            <>
                              {parts[0]}
                              <button
                                type="button"
                                onClick={() => navigate('/contact')}
                                style={{
                                  color: '#2563EB',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  border: 'none',
                                  background: 'none',
                                  padding: '0',
                                  transition: 'text-decoration 0.2s',
                                  display: 'inline',
                                  fontSize: 'inherit'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                kontakta oss
                              </button>
                              {parts[1]}
                            </>
                          );
                        }
                      } else if (currentLanguage === 'arb' || content.includes('الاتصال بنا')) {
                        // Arabic: hardcode detection for الاتصال بنا
                        const arabicLink = 'الاتصال بنا';
                        const index = content.indexOf(arabicLink);
                        if (index !== -1) {
                          const beforeText = content.substring(0, index);
                          const afterText = content.substring(index + arabicLink.length);
                          return (
                            <>
                              {beforeText}
                              <button
                                type="button"
                                onClick={() => navigate('/contact')}
                                style={{
                                  color: '#2563EB',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  border: 'none',
                                  background: 'none',
                                  padding: '0',
                                  transition: 'text-decoration 0.2s',
                                  display: 'inline',
                                  fontSize: 'inherit'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                الاتصال بنا
                              </button>
                              {afterText}
                            </>
                          );
                        }
                      }
                      
                      return content;
                    })()}
                  </p>
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div className="form-group">
                  <label htmlFor="bf-date" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t('bookingForm.dateLabel')} *
                  </label>
                  <div className="relative">
                    <input
                      id="bf-date"
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={(e) => {
                        setFormData({ ...formData, date: e.target.value });
                        fetchAvailableTimes(e.target.value, formData.services, formData.mehendiHours);
                      }}
                      onFocus={() => setFocusedField('date')}
                      onBlur={() => setFocusedField('')}
                      onClick={(e) => {
                        const input = e.currentTarget;
                        if (!input.showPicker) return;
                        try {
                          input.showPicker();
                        } catch (err) {
                          // showPicker not supported in some browsers, fallback to default behavior
                        }
                      }}
                      className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none cursor-pointer ${focusedField === 'date' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="form-group">
                  <label htmlFor="bf-time" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    {t('bookingForm.timeLabel')} *
                  </label>
                  <div className="relative">
                  <select
                    id="bf-time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    onFocus={() => setFocusedField('time')}
                    onBlur={() => setFocusedField('')}
                    className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none appearance-none cursor-pointer ${focusedField === 'time' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                  >
                    <option value="">{t('bookingForm.timePlaceholder')}</option>
                    {[
                      { value: '09:00', label: t('bookingForm.time09'), hour: 9 },
                      { value: '10:00', label: t('bookingForm.time10'), hour: 10 },
                      { value: '11:00', label: t('bookingForm.time11'), hour: 11 },
                      { value: '12:00', label: t('bookingForm.time12'), hour: 12 },
                      { value: '13:00', label: t('bookingForm.time13'), hour: 13 },
                      { value: '14:00', label: t('bookingForm.time14'), hour: 14 },
                      { value: '15:00', label: t('bookingForm.time15'), hour: 15 },
                      { value: '16:00', label: t('bookingForm.time16'), hour: 16 },
                      { value: '17:00', label: t('bookingForm.time17'), hour: 17 },
                      { value: '18:00', label: t('bookingForm.time18'), hour: 18 },
                    ].map((time) => {
                      const isUnavailable = unavailableHours.includes(time.hour);
                      return (
                        <option 
                          key={time.value} 
                          value={time.value}
                          disabled={isUnavailable}
                        >
                          {time.label} {isUnavailable ? '(Unavailable)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="bf-location" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                {t('bookingForm.locationLabel')} *
              </label>
              <div className="relative">
                <select
                  id="bf-location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  onFocus={() => setFocusedField('location')}
                  onBlur={() => setFocusedField('')}
                  className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none appearance-none cursor-pointer ${focusedField === 'location' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                >
                  <option value="">{t('bookingForm.locationPlaceholder')}</option>
                  <option value="studio">{t('bookingForm.locationStudio')}</option>
                  <option value="home">{t('bookingForm.locationHome')}</option>
                </select>
              </div>
            </div>

            {/* Studio Address Display - Shows when At Our Place is selected */}
            {formData.location === 'studio' && (
              <div className="form-group">
                <label className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t('bookingForm.addressLabel')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="Odengatan 56274 31 Skurup"
                    className="w-full px-6 py-4 text-lg bg-background border-2 border-border rounded-2xl outline-none cursor-default text-foreground"
                  />
                </div>
              </div>
            )}

            {/* Custom Address - Shows only when Home Service is selected */}
            {formData.location === 'home' && (
              <div className="form-group">
                <label htmlFor="bf-address" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t('bookingForm.addressLabel')} *
                </label>
                <div className="relative">
                  <input
                    id="bf-address"
                    type="text"
                    required
                    value={formData.customAddress}
                    onChange={(e) => setFormData({ ...formData, customAddress: e.target.value })}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField('')}
                    placeholder={t('bookingForm.addressPlaceholder')}
                    className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focusedField === 'address' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="bf-notes" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                <MessageSquare className="w-4 h-4 text-primary" />
                {t('bookingForm.notesLabel')}
              </label>
              <div className="relative">
                <textarea
                  id="bf-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField('')}
                  placeholder={t('bookingForm.notesPlaceholder')}
                  rows={4}
                  className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none resize-none placeholder:text-muted-foreground/50 ${focusedField === 'notes' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="form-group">
              <label className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                <span style={{ fontSize: '1.2rem' }}>💳</span>
                {t('bookingForm.paymentMethodLabel') || 'Payment Method'}
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                width: '100%'
              }}>
                {/* No Payment Option */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'none' })}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: formData.paymentMethod === 'none' ? '2px solid #ff6fa3' : '2px solid #e5e7eb',
                    backgroundColor: formData.paymentMethod === 'none' ? '#fff6f8' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff6fa3';
                    if (formData.paymentMethod !== 'none') {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.paymentMethod !== 'none') {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📋</div>
                  <p style={{
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: formData.paymentMethod === 'none' ? '#ff6fa3' : '#1f2937',
                    marginBottom: '4px'
                  }}>
                    {t('bookingForm.directBooking') || 'Direct Booking'}
                  </p>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#6b7280'
                  }}>
                    {t('bookingForm.directBookingDesc') || 'Book without payment'}
                  </p>
                </button>

                {/* PayPal Option */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'paypal' })}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: formData.paymentMethod === 'paypal' ? '2px solid #ff6fa3' : '2px solid #e5e7eb',
                    backgroundColor: formData.paymentMethod === 'paypal' ? '#fff6f8' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff6fa3';
                    if (formData.paymentMethod !== 'paypal') {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.paymentMethod !== 'paypal') {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🅿️</div>
                  <p style={{
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: formData.paymentMethod === 'paypal' ? '#ff6fa3' : '#1f2937',
                    marginBottom: '4px'
                  }}>
                    PayPal
                  </p>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#6b7280'
                  }}>
                    {t('bookingForm.paypalDesc') || 'Pay now securely'}
                  </p>
                </button>
              </div>
              {formData.paymentMethod === 'paypal' && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#fef3f4',
                  border: '1px solid #fecdd3',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#be123c',
                  textAlign: 'center'
                }}>
                  ℹ️ {t('bookingForm.paypalInfo') || 'You will be redirected to PayPal to complete payment'}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-8 bg-gradient-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-rose transition-all duration-300 flex items-center justify-center gap-3 group ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lavender hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('bookingForm.submitting') || 'Sending...'}</span>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {t('bookingForm.submitButton')}
                  <Sparkles className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                </>
              )}
            </button>

            {/* Success Message */}
            {submitted && (
              <div role="status" className="mt-6 p-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/30 rounded-2xl animate-success-bounce">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 animate-glow-pulse">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-1">{t('bookingForm.successTitle')}</h3>
                    <p className="text-muted-foreground">{t('bookingForm.successMessage')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Note */}
            <p className="text-sm text-muted-foreground text-center pt-4 border-t border-border/50">{t('bookingForm.footerNote')}</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;
