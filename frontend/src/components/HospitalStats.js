import React, { useState } from "react";
import PatientTable from "../components/PatientTable";
import AdmissionsChart from "../components/AdmissionsChart";
import Clock from "../components/Clock";

const Dashboard = () => {
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());

  // Refresh handler
  const handleRefresh = () => {
    setLastUpdatedTime(new Date());
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-center">
        Halton Emergency Department Dashboard
      </h1>

      {/* Current Time */}
      <Clock />

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Current Patients Table */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <PatientTable onRefresh={handleRefresh} lastUpdatedTime={lastUpdatedTime} />
        </div>

        {/* Daily Admissions Overview */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <AdmissionsChart />
        </div>

        {/* Hospital Statistics */}
        <div className="col-span-1 md:col-span-2">
          {/* Full-width on larger screens */}
          <HospitalStats />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
