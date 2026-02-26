import React from "react";
import { useSelector } from "react-redux";
import Nav from "../components/Nav";
import aboutHero from "../assets/image1.jpg"; // Using existing asset

const About = () => {
  const { aboutContent } = useSelector((state) => state.user);

  return (
    <div className="min-h-screen bg-[#fff9f6]">
      <Nav />
      
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={aboutContent.image || aboutHero} 
            alt="About FoodWay" 
            className="w-full h-full object-cover opacity-30 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fff9f6]"></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {aboutContent.title}
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-[#fc8019] to-[#ff2b85] mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 pb-20 -mt-20 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[#fc8019]">Our Story</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              {aboutContent.description}
            </p>
          </section>

          <section className="space-y-4 border-l-4 border-[#ff2b85] pl-6 bg-[#fff9f6] py-6 rounded-r-2xl">
            <h2 className="text-2xl font-bold text-[#ff2b85]">Our Mission</h2>
            <p className="text-gray-700 italic text-lg leading-relaxed">
              "{aboutContent.mission}"
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gray-900">10k+</div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold">Restaurants</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gray-900">1M+</div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold">Happy Users</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gray-900">50+</div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold">Cities</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
