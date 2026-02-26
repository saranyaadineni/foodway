import React, { useState } from "react";
import { useSelector } from "react-redux";
import Nav from "../components/Nav";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";

const Contact = () => {
  const { contactContent } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[#fff9f6]">
      <Nav />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#fc8019] to-[#ff2b85] pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center text-white space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Get in Touch</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto font-medium">
            Have a question or feedback? We'd love to hear from you. Our team is here to help 24/7.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl space-y-6 border border-orange-50">
              <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#fc8019] group-hover:bg-[#fc8019] group-hover:text-white transition-all shadow-sm">
                    <FiMail size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Email Us</p>
                    <p className="text-lg font-semibold text-gray-700">{contactContent.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#ff2b85] group-hover:bg-[#ff2b85] group-hover:text-white transition-all shadow-sm">
                    <FiPhone size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Call Us</p>
                    <p className="text-lg font-semibold text-gray-700">{contactContent.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#fc8019] group-hover:bg-[#fc8019] group-hover:text-white transition-all shadow-sm">
                    <FiMapPin size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Our Office</p>
                    <p className="text-lg font-semibold text-gray-700 leading-relaxed">
                      {contactContent.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-200 h-[250px] rounded-3xl overflow-hidden shadow-lg border border-white relative group">
              {contactContent.mapUrl ? (
                <iframe 
                  src={contactContent.mapUrl} 
                  className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
                  allowFullScreen="" 
                  loading="lazy"
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 gap-2">
                  <FiMapPin size={40} />
                  <p className="font-bold tracking-widest text-sm uppercase">Live Map View</p>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-orange-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 opacity-50"></div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Send us a Message</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#fc8019] outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#ff2b85] outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 ml-1">Your Message</label>
                <textarea 
                  rows="5" 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="How can we help you?"
                  className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#fc8019] outline-none transition-all shadow-inner resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={submitted}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-lg ${
                  submitted ? 'bg-green-500 scale-95' : 'bg-gradient-to-r from-[#fc8019] to-[#ff2b85] hover:shadow-2xl hover:scale-[1.02] active:scale-95'
                }`}
              >
                {submitted ? (
                  <>Message Sent! <FiSend /></>
                ) : (
                  <>Send Message <FiSend /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
