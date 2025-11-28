import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, MapPin, MessageSquare, User, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type FormData = {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  location: string;
  customAddress: string;
  notes: string;
};

const defaultData: FormData = {
  name: '',
  email: '',
  phone: '',
  service: '',
  date: '',
  time: '',
  location: '',
  customAddress: '',
  notes: '',
};

const BookingForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>(defaultData);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Determine the address based on location choice
      const address = formData.location === 'studio' 
        ? 'Serenagatan 123, Malmö 21000'
        : formData.customAddress;

      // Prepare booking data with address
      const bookingData = {
        ...formData,
        address
      };

      console.log('Submitting booking data:', bookingData);

      // Use an explicit API base that can be configured via REACT_APP_API_URL.
      // In production (Vercel) set REACT_APP_API_URL to your backend base (https://api.example.com)
      // When not set, fall back to a relative '/api' so the frontend can be proxied/rewritten by the host.
      const apiBase = process.env.REACT_APP_API_URL || '/api';
      const url = `${apiBase}/booking`;
      console.log('Sending request to:', url);
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      console.log('Response status:', resp.status);

      if (resp.ok) {
        const responseData = await resp.json();
        console.log('Success response:', responseData);
        setSubmitted(true);
        setFormData(defaultData);
        setTimeout(() => setSubmitted(false), 5000);
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
      className="min-h-screen py-16 px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #fff6f8 0%, #fff1f3 100%)' }}
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

        {/* Form Card */}
        <div className="form-card">
          {/* Inner white section requested: two-per-row fields, slightly larger inputs */}
          <div className="booking-inner-card">
            <form onSubmit={handleSubmit} className="booking-form">
            <div className="booking-grid">
              {/* Name */}
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

              {/* Email */}
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

              {/* Phone */}
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

              {/* Service */}
              <div className="form-group">
                <label htmlFor="bf-service" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t('bookingForm.serviceLabel')} *
                </label>
                <div className="relative">
                  <select
                    id="bf-service"
                    required
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    onFocus={() => setFocusedField('service')}
                    onBlur={() => setFocusedField('')}
                    className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none appearance-none cursor-pointer ${focusedField === 'service' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                  >
                    <option value="">{t('bookingForm.servicePlaceholder')}</option>
                    <option value="lash-lift">{t('bookingForm.serviceLashLift')}</option>
                    <option value="brow-lift">{t('bookingForm.serviceBrowLift')}</option>
                    <option value="makeup">{t('bookingForm.serviceMakeup')}</option>
                    <option value="bridal-makeup">{t('bookingForm.serviceBridalMakeup')}</option>
                    <option value="mehendi">{t('bookingForm.serviceMehendi')}</option>
                    <option value="threading">{t('bookingForm.serviceThreading')}</option>
                  </select>
                </div>
              </div>

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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    <option value="09:00">{t('bookingForm.time09')}</option>
                    <option value="10:00">{t('bookingForm.time10')}</option>
                    <option value="11:00">{t('bookingForm.time11')}</option>
                    <option value="12:00">{t('bookingForm.time12')}</option>
                    <option value="13:00">{t('bookingForm.time13')}</option>
                    <option value="14:00">{t('bookingForm.time14')}</option>
                    <option value="15:00">{t('bookingForm.time15')}</option>
                    <option value="16:00">{t('bookingForm.time16')}</option>
                    <option value="17:00">{t('bookingForm.time17')}</option>
                    <option value="18:00">{t('bookingForm.time18')}</option>
                  </select>
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
                    value="Serenagatan 123, Malmö 21000"
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
