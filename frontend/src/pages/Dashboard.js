// import React, { useState } from "react";
// import PatientTable from "../components/PatientTable";
// import AdmissionsChart from "../components/AdmissionsChart";
// import Clock from "../components/Clock.js"; 

// const Dashboard = () => {
//   const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date()); 

//   const handleRefresh = () => {
//     setLastUpdatedTime(new Date()); // Update last refresh time
//   };

//   const styles = {
//     container: {
//       padding: "30px",
//       backgroundColor: "#f4f7fb",
//       minHeight: "100vh",
//     },
//     title: {
//       textAlign: "center",
//       fontSize: "32px",
//       fontWeight: "bold",
//       color: "#2c3e50",
//       marginBottom: "20px",
//     },
//     mainContent: {
//       display: "grid",
//       gridTemplateColumns: "1fr", 
//       gap: "30px",
//       maxWidth: "1200px",
//       margin: "0 auto",
//       padding: "20px",
//     },
//     card: {
//       backgroundColor: "#ffffff",
//       padding: "20px",
//       borderRadius: "8px",
//       boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//       borderLeft: "5px solid #3498db", 
//     },
//     cardTitle: {
//       fontSize: "24px",
//       fontWeight: "bold",
//       color: "#3498db",
//       marginBottom: "15px",
//     },
//     refreshButton: {
//       backgroundColor: "#e67e22", 
//       color: "white",
//       border: "none",
//       borderRadius: "5px",
//       padding: "10px 20px",
//       cursor: "pointer",
//       fontSize: "16px",
//     },
//     lastUpdated: {
//       fontSize: "14px",
//       color: "#7f8c8d",
//       textAlign: "center",
//       marginTop: "10px",
//     },
//     gridContainer: {
//       display: "grid",
//       gridTemplateColumns: "1fr", 
//       gap: "20px",
//       marginTop: "30px",
//     },
//   };

//   return (
//     <div style={styles.container}>
//       {/* Title */}
//       <h1 style={styles.title}>Halton Emergency Department Dashboard</h1>

//       {/* Current Time */}
//       <Clock />

//       {/* Main Content */}
//       <div style={styles.mainContent}>
//         {/* Current Patients Table */}
//         <div style={styles.card}>
//           <div style={styles.cardTitle}>Current Patients</div>
//           <PatientTable onRefresh={handleRefresh} lastUpdatedTime={lastUpdatedTime} />
//         </div> 

//         {/* Daily Admissions Overview */}
//         <div style={styles.card}>
//           <div style={styles.cardTitle}>Daily Admissions Overview</div>
//           <AdmissionsChart />
//         </div>
//       </div>

//       {/* Last Updated Time */}
//       <p style={styles.lastUpdated}>
//         Last updated: {lastUpdatedTime.toLocaleString()}
//       </p>
//     </div>
//   );
// };

// export default Dashboard;
import React, { useState, useEffect } from "react";
import PatientTable from "../components/PatientTable";
import AdmissionsChart from "../components/AdmissionsChart";
import Clock from "../components/Clock";
import { get } from "@aws-amplify/api"
// import { API } from "@aws-amplify/api";
// import { Amplify } from "@aws-amplify/core";


const Dashboard = () => {
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());
  const [patients, setPatients] = useState([]); // Store fetched patient data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error handling

  // Function to fetch data from API Gateway
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      // const response = await API.get("MyApi", "/fetch");
      const response = await get({
        apiName: "PredictionsAPI",
        path: "/fetch"
      }).response;

      const data = await response.json();

      const formattedPatients = data.map((patient) => ({
        id: patient.v_guid,
        facility: patient.facility_id,
        registrationTime: new Date(patient.registrationdatetime).toLocaleString(),
        modelScore: patient.modelscore,
        lastUpdated: new Date(patient.lastupdated).toLocaleString(),
      }));
      setPatients(formattedPatients);
      setLastUpdatedTime(new Date()); // Update refresh timestamp
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setError("Failed to load data. Please try again.");
    }
    setLoading(false);
  };

  // Fetch patient data on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    fetchPatients();
  };

  return (
    <div style={styles.container}>
      {/* Title */}
      <h1 style={styles.title}>Halton Emergency Department Dashboard</h1>

      {/* Current Time */}
      <Clock />

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Patient Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Current Patients</div>
          {loading ? (
            <p>Loading data...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <PatientTable patients={patients} onRefresh={handleRefresh} />
          )}
        </div>

        {/* Daily Admissions Overview */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Daily Admissions Overview</div>
          <AdmissionsChart />
        </div>
      </div>

      {/* Last Updated Time */}
      <p style={styles.lastUpdated}>Last updated: {lastUpdatedTime.toLocaleString()}</p>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#f4f7fb",
    minHeight: "100vh",
  },
  title: {
    textAlign: "center",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: "20px",
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderLeft: "5px solid #3498db",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: "15px",
  },
  lastUpdated: {
    fontSize: "14px",
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: "10px",
  },
};

export default Dashboard;
