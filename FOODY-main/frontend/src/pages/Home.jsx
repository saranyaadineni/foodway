import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import UserDashboard from "../components/UserDashboard";
import OwnerDashboard from "../components/OwnerDashboard";
import DeliveryBoy from "../components/DeliveryBoy";

function Home() {
  const { userData, authLoading } = useSelector((state) => state.user);
  const navigate = useNavigate();

  
  useEffect(() => {
    if (userData?.role === "superadmin") {
      navigate("/superadmin");
    }
  }, [userData?.role, navigate]);


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff9f6]">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

 
  return (
    <div className="w-screen min-h-screen pt-[100px] bg-[#fff9f6]">
      {/* ✅ PUBLIC / USER DEFAULT VIEW */}
      {!userData && <UserDashboard />}
      {userData?.role === "user" && <UserDashboard />}

      {/* ✅ ROLE BASED DASHBOARDS */}
      {userData?.role === "owner" && <OwnerDashboard />}
      {userData?.role === "deliveryBoy" && <DeliveryBoy />}
    </div>
  );
}

export default Home;
