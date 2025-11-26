import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, MapPin, MessageSquare, User, Mail, Phone } from 'lucide-react';

type FormData = {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  location: string;
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
  notes: '',
};

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(defaultData);
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch(process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/booking` : 'http://localhost:5000/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (resp.ok) {
        setSubmitted(true);
        setFormData(defaultData);
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        const data = await resp.json().catch(() => null);
        console.error('Booking api error', data);
        alert((data && data.message) || 'Failed to send booking request. Please try again.');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Booking submit error', err);
      alert('An error occurred while sending booking request. Please try again later.');
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
            <span className="text-sm font-medium bg-gradient-primary bg-clip-text text-transparent">Book Your Transformation</span>
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
            Reserve Your Appointment
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Fill out the form below and we'll contact you within 24 hours to confirm your booking</p>
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
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    id="bf-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Enter your name"
                    className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focusedField === 'name' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="bf-email" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address *
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
                    placeholder="your@email.com"
                    className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focusedField === 'email' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="bf-phone" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number *
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
                    placeholder="(123) 456-7890"
                    className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none placeholder:text-muted-foreground/50 ${focusedField === 'phone' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                  />
                </div>
              </div>

              {/* Service */}
              <div className="form-group">
                <label htmlFor="bf-service" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Select Service *
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
                    <option value="">Choose a service</option>
                    <option value="lash-extensions">💫 Lash Extensions</option>
                    <option value="lash-lift">✨ Lash Lift</option>
                    <option value="brow-lift">🌟 Brow Lift</option>
                    <option value="makeup">💄 Professional Makeup</option>
                    <option value="bridal-makeup">👰 Bridal Makeup</option>
                    <option value="mehendi">🎨 Mehendi (Henna)</option>
                    <option value="threading">🧵 Facial Threading</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="form-group">
                <label htmlFor="bf-date" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  Preferred Date *
                </label>
                <div className="relative">
                  <input
                    id="bf-date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    onFocus={() => setFocusedField('date')}
                    onBlur={() => setFocusedField('')}
                    className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none cursor-pointer ${focusedField === 'date' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                  />
                </div>
              </div>

              {/* Time */}
              <div className="form-group">
                <label htmlFor="bf-time" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  Preferred Time *
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
                    <option value="">Select time</option>
                    <option value="09:00">🌅 9:00 AM</option>
                    <option value="10:00">☀️ 10:00 AM</option>
                    <option value="11:00">☀️ 11:00 AM</option>
                    <option value="12:00">☀️ 12:00 PM</option>
                    <option value="13:00">🌤️ 1:00 PM</option>
                    <option value="14:00">🌤️ 2:00 PM</option>
                    <option value="15:00">🌤️ 3:00 PM</option>
                    <option value="16:00">🌅  4:00 PM</option>
                    <option value="17:00">🌅 5:00 PM</option>
                    <option value="18:00">🌆 6:00 PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="bf-location" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Preferred Location *
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
                  <option value="">Choose location</option>
                  <option value="studio">🏢 Studio Visit</option>
                  <option value="home">🏠 Home Service</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="bf-notes" className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
                <MessageSquare className="w-4 h-4 text-primary" />
                Additional Notes
              </label>
              <div className="relative">
                <textarea
                  id="bf-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Any special requests or questions?"
                  rows={4}
                  className={`w-full px-6 py-4 text-lg bg-background border-2 rounded-2xl transition-all duration-300 outline-none resize-none placeholder:text-muted-foreground/50 ${focusedField === 'notes' ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/50'}`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 px-8 bg-gradient-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-rose transition-all duration-300 hover:shadow-lavender hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Request Appointment
              <Sparkles className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
            </button>

            {/* Success Message */}
            {submitted && (
              <div role="status" className="mt-6 p-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/30 rounded-2xl animate-success-bounce">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 animate-glow-pulse">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-1">Booking Request Received! ✨</h3>
                    <p className="text-muted-foreground">We'll contact you shortly to confirm your appointment and answer any questions.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Note */}
            <p className="text-sm text-muted-foreground text-center pt-4 border-t border-border/50">💖 We'll contact you within 24 hours to confirm your booking</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;
