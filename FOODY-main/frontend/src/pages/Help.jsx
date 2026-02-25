import React, { useState } from "react";
import Nav from "../components/Nav";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const Help = () => {
  const [activeTab, setActiveTab] = useState("Partner Onboarding");
  const [openFaq, setOpenFaq] = useState(null);

  const tabs = [
    "Partner Onboarding",
    "Legal",
    "FAQs",
  ];

  const content = {
    "Partner Onboarding": [
      {
        q: "I want to partner my restaurant with FoodWay",
        a: "To partner with us, please send an email to partners@foodway.com with your restaurant details including name, location, and contact information. Our team will get back to you within 24-48 hours.",
      },
      {
        q: "What are the mandatory documents needed to list my restaurant on FoodWay?",
        a: "You will need: 1. FSSAI License, 2. PAN Card of the owner/entity, 3. GST Registration (if applicable), 4. Bank Account details with a cancelled cheque, and 5. Menu images.",
      },
      {
        q: "I want to opt-out from Google reserve",
        a: "You can manage your external integrations through the Partner Dashboard under the 'Settings' section. Look for 'Google Reserve' and toggle it off.",
      },
      {
        q: "After I submit all documents, how long will it take for my restaurant to go live on FoodWay?",
        a: "Once all documents are verified, it typically takes 3-5 business days for your restaurant to go live on our platform.",
      },
    ],
    "Legal": [
      {
        q: "Terms of Service",
        a: "Our terms of service outline the rules and regulations for using the FoodWay platform. You can find the full document on our website under the Legal section.",
      },
      {
        q: "Privacy Policy",
        a: "We value your privacy. Our privacy policy explains how we collect, use, and protect your personal information.",
      },
    ],
    "FAQs": [
      {
        q: "How do I track my order?",
        a: "Go to 'My Orders' and click on 'Track Order' for any active delivery to see live status updates.",
      },
      {
        q: "What if I want to cancel my order?",
        a: "Orders can be cancelled within 1 minute of placement. After that, cancellation depends on whether the restaurant has started preparing your food.",
      },
    ],
  };

  const currentFaqs = content[activeTab] || [];

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      
      {/* Header Section */}
      <div className="bg-[#37718e] pt-[120px] pb-12 px-4 md:px-10">
        <div className="max-w-6xl mx-auto text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Help & Support</h1>
          <p className="text-sm md:text-base opacity-90 font-light">Let's take a step ahead and help you better.</p>
        </div>
      </div>

      {/* Main Content Area - Robust Table Format */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="w-[280px] p-5 text-left font-bold text-gray-700 border-r-2 border-gray-200">
                  Categories
                </th>
                <th className="p-5 text-left font-bold text-gray-700">
                  Questions & Answers for {activeTab}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {/* Left Column: Categories */}
                <td className="align-top border-r-2 border-gray-200 bg-gray-50/50 w-[280px]">
                  <div className="flex flex-col">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setOpenFaq(null);
                        }}
                        className={`text-left px-8 py-6 font-bold text-[15px] transition-all border-b border-gray-200 last:border-0 relative ${
                          activeTab === tab 
                            ? "bg-white text-[#fc8019] shadow-[inset_6px_0_0_0_#fc8019]" 
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </td>

                {/* Right Column: Q&A */}
                <td className="align-top bg-white p-0">
                  <div className="divide-y divide-gray-200">
                    {currentFaqs.length > 0 ? (
                      currentFaqs.map((faq, index) => (
                        <div key={index} className="group hover:bg-orange-50/30 transition-colors">
                          <div 
                            className="p-8 cursor-pointer flex items-center justify-between"
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                          >
                            <span className={`text-[17px] font-bold transition-colors ${
                              openFaq === index ? "text-[#fc8019]" : "text-gray-800 group-hover:text-gray-900"
                            }`}>
                              {faq.q}
                            </span>
                            <div className={`transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                              <FaChevronDown size={14} className={openFaq === index ? "text-[#fc8019]" : "text-gray-400"} />
                            </div>
                          </div>
                          
                          {openFaq === index && (
                            <div className="px-8 pb-10 text-[15px] text-gray-600 leading-relaxed animate-fade-in">
                              <div className="pt-6 border-t border-gray-100">
                                {faq.a}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-20 text-center text-gray-400 italic">
                        <p className="text-xl font-semibold">No content available</p>
                        <p className="text-sm mt-2">Select a different category from the left.</p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Help;
