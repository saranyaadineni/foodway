import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#fff9f6] border-t border-orange-100/50 pt-10 pb-6 mt-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="text-2xl font-extrabold tracking-tight hover:scale-105 transition-transform inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85]">
                Food<span className="text-[#ff2b85]">Way</span>
              </span>
            </Link>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
              Delivering happiness to your doorstep. Order from the best restaurants and enjoy fresh, delicious food in minutes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 text-sm font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-500 hover:text-[#fc8019] text-xs transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-500 hover:text-[#fc8019] text-xs transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-gray-900 text-sm font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-500 hover:text-[#fc8019] text-xs transition-colors">Help Center</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="pt-8 pb-6 border-t border-orange-100/50 flex flex-col items-center">
          <h3 className="text-gray-800 text-xs font-bold mb-4 uppercase tracking-widest">Connect with us</h3>
          <div className="flex space-x-4">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
            >
              <FaFacebook size={20} />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 hover:bg-gradient-to-tr from-[#FFB000] via-[#FF2B85] to-[#833AB4] hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
            >
              <FaInstagram size={20} />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 hover:bg-[#1DA1F2] hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
            >
              <FaTwitter size={20} />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-orange-100/50 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
            © {new Date().getFullYear()} FoodWay. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <span className="text-gray-400 text-[10px] font-semibold cursor-pointer hover:text-[#fc8019] transition-colors">ENGLISH (US)</span>
            <span className="text-gray-400 text-[10px] font-semibold cursor-pointer hover:text-[#ff2b85] transition-colors">INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
