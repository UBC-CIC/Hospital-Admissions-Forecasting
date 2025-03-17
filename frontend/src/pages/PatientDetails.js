import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import Clock from "../components/Clock"; 

const PatientDetailsPage = () => {
  const navigate = useNavigate(); 
  const patient = {
    name: "00002a02-fb5b-5606-8719-0216d8719fd4",
    age: 27,
    status: "Awaiting Admission Decision",
    modelScore: 0.14868010267790893,
    recommendation: "Recommend Admit",
    patientId: "MDH",
    registrationTime: "12/11/2023 9:45",
    timeSinceRegistration: "24 minutes 15 seconds", // This can be dynamically updated
    ctasLevel: 1,
    alerts: ["Medical History needed"],
  };

  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      padding: "30px",
      maxWidth: "1000px",
      margin: "0 auto",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    headerTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#333",
    },
    detailsContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      marginBottom: "20px",
    },
    card: {
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      borderLeft: "5px solid #007bff", 
    },
    cardTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "#007bff",
    },
    patientInfo: {
      fontSize: "16px",
      color: "#333",
      marginBottom: "5px",
    },
    patientInfoLabel: {
      fontWeight: "bold", 
    },
    alertCard: {
      backgroundColor: "#ffefef",
      padding: "15px",
      borderRadius: "8px",
      borderLeft: "5px solid #ff4d4d",
      color: "#ff4d4d",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    },
    alertTitle: {
      fontWeight: "bold",
      marginBottom: "10px",
    },
    buttonContainer: {
      display: "flex",
      gap: "15px",
      justifyContent: "flex-end",
      marginTop: "30px",
    },
    button: {
      padding: "12px 18px",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px",
      width: "160px",
    },
    buttonGreen: {
      backgroundColor: "#28a745", 
    },
    buttonRed: {
      backgroundColor: "#dc3545", 
    },
    buttonDisabled: {
      backgroundColor: "#d6d6d6",
      cursor: "not-allowed",
    },
    graphPlaceholder: {
      width: "100%",
      height: "250px",
      backgroundColor: "#e0e0e0",
      borderRadius: "8px",
      marginBottom: "30px",
    },
    backButton: {
      padding: "10px 20px",
      backgroundColor: "#6c757d", 
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px",
      marginBottom: "20px",
    },
  };

  // Function to handle back button click
  const handleBackClick = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button onClick={handleBackClick} style={styles.backButton}>
        Back
      </button>

      <div style={styles.header}>
        <div style={styles.headerTitle}>
          {patient.name}, {patient.age}
        </div>
        <Clock />
      </div>

      {/* Alerts Section */}
      <div style={styles.alertCard}>
        <div style={styles.alertTitle}>Alerts</div>
        {patient.alerts.map((alert, index) => (
          <div key={index}>{alert}</div>
        ))}
      </div>

      <div style={styles.detailsContainer}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Patient Information</div>
          <div style={styles.patientInfo}>
            <span style={styles.patientInfoLabel}>Status:</span> {patient.status}
          </div>
          <div style={styles.patientInfo}>
            <span style={styles.patientInfoLabel}>Model Score:</span> {patient.modelScore}
          </div>
          <div style={styles.patientInfo}>
            <span style={styles.patientInfoLabel}>Recommendation:</span> {patient.recommendation}
          </div>
          <div style={styles.patientInfo}>
            <span style={styles.patientInfoLabel}>Facility ID:</span> {patient.patientId}
          </div>
          <div style={styles.patientInfo}>
            <span style={styles.patientInfoLabel}>Registration Time:</span> {patient.registrationTime}
          </div>
          <div style={styles.patientInfo}>
            <span style={styles.patientInfoLabel}>Time Since Registration:</span> {patient.timeSinceRegistration}
          </div>
          <div style={styles.patientInfo}>
            <span style={styles.patientInfoLabel}>CTAS Level:</span> {patient.ctasLevel}
          </div>
        </div>

        <div style={styles.graphPlaceholder}>
          {/* Placeholder for Model Score Progression Chart */}
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button style={{ ...styles.button, ...styles.buttonGreen }}>This patient was admitted</button>
        <button style={{ ...styles.button, ...styles.buttonRed }}>This patient was released</button>
      </div>
    </div>
  );
};

export default PatientDetailsPage;
