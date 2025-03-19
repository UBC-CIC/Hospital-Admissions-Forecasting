import React, { useState } from "react";
import PatientTable from "../components/PatientTable";
import AdmissionsChart from "../components/AdmissionsChart";
import Clock from "../components/Clock.js";

const Dashboard = () => {
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());

  const styles = {
    container: {
      padding: "40px",
      backgroundColor: "#ecf0f1",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
    },
    titleContainer: {
      textAlign: "center",
      backgroundColor: "#2c3e50",
      color: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      marginBottom: "20px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "bold",
    },
    mainContent: {
      display: "flex",
      flexDirection: "column",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      gap: "30px",
    },
    card: {
      backgroundColor: "#ffffff",
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      borderLeft: "6px solid #3498db",
    },
    cardTitle: {
      fontSize: "22px",
      fontWeight: "bold",
      color: "#3498db",
      marginBottom: "10px",
      textTransform: "uppercase",
    },
    lastUpdated: {
      fontSize: "14px",
      color: "#7f8c8d",
      textAlign: "center",
      marginTop: "20px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleContainer}>
        <h1 style={styles.title}>Halton Emergency Department Dashboard</h1>
      </div>

      {/* Current Time */}
      <Clock />

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Current Patients Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Current Patients</div>
          <PatientTable />
        </div>

        {/* Daily Admissions Overview at the Bottom */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Daily Admissions Overview</div>
          <AdmissionsChart />
        </div>
      </div>

      {/* Last Updated Time */}
      <p style={styles.lastUpdated}>
        Last updated: {lastUpdatedTime.toLocaleString()}
      </p>
    </div>
  );
};

export default Dashboard;
