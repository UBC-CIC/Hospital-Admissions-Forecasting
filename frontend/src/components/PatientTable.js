// import React, { useState, useEffect } from "react";
// import { get } from "@aws-amplify/api"
// import { useNavigate } from "react-router-dom";
// import RefreshButton from "./RefreshButton";

// const PatientTable = () => {
//   const navigate = useNavigate();
//   const [patients, setPatients] = useState([]);
//   const [filters, setFilters] = useState({ facility: "", urgency: "" });

//   // Fetch patient data from API Gateway
//   useEffect(() => {
//     const fetchPatients = async () => {
//       try {
//         const response = await API.get("MyApi", "/fetch"); // Fetch from API Gateway
//         // Transform API response to match expected format
//         const formattedPatients = response.map((patient) => ({
//           id: patient.v_guid,
//           facility: patient.facility_id,
//           registrationTime: new Date(patient.registrationdatetime).toLocaleString(),
//           modelScore: patient.modelscore,
//           lastUpdated: new Date(patient.lastupdated).toLocaleString(),
//         }));
//         setPatients(formattedPatients);
//       } catch (error) {
//         console.error("Error fetching patient data:", error);
//       }
//     };

//     fetchPatients();
//   }, []);

//   // Refresh handler
//   const handleRefresh = async () => {
//     try {
//       const response = await API.get("MyApi", "/fetch");
//       const formattedPatients = response.map((patient) => ({
//         id: patient.v_guid,
//         facility: patient.facility_id,
//         registrationTime: new Date(patient.registrationdatetime).toLocaleString(),
//         modelScore: patient.modelscore,
//         lastUpdated: new Date(patient.lastupdated).toLocaleString(),
//       }));
//       setPatients(formattedPatients);
//     } catch (error) {
//       console.error("Error refreshing patient data:", error);
//     }
//   };

import React, { useState, useEffect } from "react";
import { get } from "@aws-amplify/api"; // Updated v6 import
import { useNavigate } from "react-router-dom";
import RefreshButton from "./RefreshButton";

const PatientTable = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({ facility: "", urgency: "" });

  // Fetch patient data from API Gateway
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Amplify v6 API call syntax
        const restOperation = get({ 
          apiName: "MyApi", 
          path: "/fetch"
        });
        
        const response = await restOperation.response;
        const data = await response.json();
        
        const formattedPatients = data.map((patient) => ({
          id: patient.v_guid,
          facility: patient.facility_id,
          registrationTime: new Date(patient.registrationdatetime).toLocaleString(),
          modelScore: patient.modelscore,
          lastUpdated: new Date(patient.lastupdated).toLocaleString(),
        }));
        
        setPatients(formattedPatients);
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    };

    fetchPatients();
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    try {
      const restOperation = get({
        apiName: "MyApi",
        path: "/fetch"
      });
      
      const response = await restOperation.response;
      const data = await response.json();
      
      const formattedPatients = data.map((patient) => ({
        id: patient.v_guid,
        facility: patient.facility_id,
        registrationTime: new Date(patient.registrationdatetime).toLocaleString(),
        modelScore: patient.modelscore,
        lastUpdated: new Date(patient.lastupdated).toLocaleString(),
      }));
      
      setPatients(formattedPatients);
    } catch (error) {
      console.error("Error refreshing patient data:", error);
    }
  };

  // Filter handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Navigate to patient details page
  const handlePatientClick = (id) => {
    navigate(`/patient/${id}`);
  };

  // Filtered data
  const filteredPatients = patients.filter((patient) => {
    const matchesFacility = filters.facility ? patient.facility === filters.facility : true;
    const matchesUrgency =
      filters.urgency === "high"
        ? patient.modelScore >= 0.8
        : filters.urgency === "medium"
        ? patient.modelScore >= 0.3 && patient.modelScore < 0.8
        : filters.urgency === "low"
        ? patient.modelScore < 0.3
        : true;

    return matchesFacility && matchesUrgency;
  });

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcons}>
          <div style={styles.filterContainer}>
            <label>
              Filter by Facility:
              <select name="facility" onChange={handleFilterChange} value={filters.facility} style={styles.select}>
                <option value="">All</option>
                <option value="OTMH">OTMH</option>
                <option value="MDH">MDH</option>
                <option value="GDH">GDH</option>
              </select>
            </label>

            <label style={{ marginLeft: "15px" }}>
              Filter by Urgency:
              <select name="urgency" onChange={handleFilterChange} value={filters.urgency} style={styles.select}>
                <option value="">All</option>
                <option value="high">High (≥0.8)</option>
                <option value="medium">Medium (0.3 - &lt;0.8)</option>
                <option value="low">Low (&lt;0.3)</option>
              </select>
            </label>
          </div>
          <div style={styles.refreshButtonContainer}>
            <RefreshButton onClick={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Table */}
      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>V_GUID</th>
            <th>Facility ID</th>
            <th>Registration Time</th>
            <th>Model Score</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((patient) => (
            <tr key={patient.id} style={{ backgroundColor: getUrgencyColor(patient.modelScore) }}>
              <td
                style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => handlePatientClick(patient.id)}
              >
                {patient.id}
              </td>
              <td>{patient.facility}</td>
              <td>{patient.registrationTime}</td>
              <td>{patient.modelScore.toFixed(2)}</td>
              <td>{patient.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Function to assign color based on urgency
const getUrgencyColor = (score) => {
  if (score >= 0.8) return "#FFCCCC"; // High urgency - Red
  if (score >= 0.3) return "#FFFFCC"; // Medium urgency - Yellow
  return "#CCFFCC"; // Low urgency - Green
};

// Styles
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#958F8F",
    color: "#fff",
    padding: "10px",
    marginBottom: "10px",
  },
  headerIcons: {
    display: "flex",
    alignItems: "center",
  },
  filterContainer: {
    display: "flex",
    alignItems: "center",
  },
  refreshButtonContainer: {
    marginLeft: "15px",
  },
  refreshButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  select: {
    padding: "5px",
    marginLeft: "10px",
  },
};

export default PatientTable;




// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import RefreshButton from "./RefreshButton"; 

// const PatientTable = () => {
//   const navigate = useNavigate();

//   // Sample patient data
//   const [patients, setPatients] = useState([
//     { id: '00002a02-fb5b-5606-8719-0216d8719fd4', facility: "MDH", registrationTime: "12/11/2023 9:45", modelScore: 0.14868010267790893 },
//     { id: '00002a02-fb5b-5606-8719-0216d8719fd4', facility: "MDH", registrationTime: "4/29/2022 22:00", modelScore: 0.8718983488148568 },
//     { id: '00009fb8-a2b1-54a2-8d14-96f0d75bb0d1', facility: "GDH", registrationTime: "5/7/2022 8:04", modelScore: 0.12317908837001576 },
//     { id: '0000c606-b522-5484-ba10-30a3ec2d86a4', facility: "OTMH", registrationTime: "2/12/2024 21:43", modelScore: 0.15591778525154049 },
//     { id: '0000e075-d00f-5eee-867c-7522fc16b382', facility: "OTMH", registrationTime: "8/18/2023 11:08", modelScore: 0.8086301959314897 },
//   ]);

//   const [filters, setFilters] = useState({ facility: "", urgency: "" });

//   // Refresh handler
//   const handleRefresh = () => {
//     window.location.reload(false); 
//   };

//   // Filter handler
//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   // Navigate to patient details page
//   const handlePatientClick = (id) => {
//     navigate(`/patient/${id}`);
//   };

//   // Filtered data
//   const filteredPatients = patients.filter((patient) => {
//     const matchesFacility = filters.facility ? patient.facility === filters.facility : true;
//     const matchesUrgency =
//       filters.urgency === "high"
//         ? patient.modelScore >= 0.8
//         : filters.urgency === "medium"
//         ? patient.modelScore >= 0.3 && patient.modelScore < 0.8
//         : filters.urgency === "low"
//         ? patient.modelScore < 0.3
//         : true;

//     return matchesFacility && matchesUrgency;
//   });

//   return (
//     <div>
//       {/* Header */}
//       <div style={styles.header}>
//         <div style={styles.headerIcons}>
//           <div style={styles.filterContainer}>
//             <label>
//               Filter by Facility:
//               <select name="facility" onChange={handleFilterChange} value={filters.facility} style={styles.select}>
//                 <option value="">All</option>
//                 <option value="OTMH">OTMH</option>
//                 <option value="MDH">MDH</option>
//                 <option value="GDH">GDH</option>
//               </select>
//             </label>

//             <label style={{ marginLeft: "15px" }}>
//               Filter by Urgency:
//               <select name="urgency" onChange={handleFilterChange} value={filters.urgency} style={styles.select}>
//                 <option value="">All</option>
//                 <option value="high">High (≥0.8)</option>
//                 <option value="medium">Medium (0.3 - &lt;0.8)</option>
//                 <option value="low">Low (&lt;0.3)</option>
//               </select>
//             </label>
//           </div>
//           <div style={styles.refreshButtonContainer}>
//             <RefreshButton onClick={handleRefresh} />
//           </div>
//         </div>
//       </div>

//       {/* Table */}
//       <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th>V_GUID</th>
//             <th>Facility ID</th>
//             <th>Registration Time</th>
//             <th>Model Score</th>
//             <th>Last Updated</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredPatients.map((patient) => (
//             <tr key={patient.id} style={{ backgroundColor: getUrgencyColor(patient.modelScore) }}>
//               {/* Clickable Patient ID */}
//               <td
//                 style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
//                 onClick={() => handlePatientClick(patient.id)}
//               >
//                 {patient.id}
//               </td>
//               <td>{patient.facility}</td>
//               <td>{patient.registrationTime}</td>
//               <td>{`${patient.modelScore.toFixed(2)} (last updated: ${new Date().toLocaleTimeString()})`}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// const getUrgencyColor = (score) => {
//   if (score >= 0.8) return "#FFCCCC"; // High urgency - Red
//   if (score >= 0.3) return "#FFFFCC"; // Medium urgency - Yellow
//   return "#CCFFCC"; // Low urgency - Green
// };

// const styles = {
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#958F8F",
//     color: "#fff",
//     padding: "10px",
//     marginBottom: "10px",
//   },
//   headerIcons: {
//     display: "flex",
//     alignItems: "center",
//   },
//   filterContainer: {
//     display: "flex",
//     alignItems: "center",
//   },
//   refreshButtonContainer: {
//     marginLeft: "15px", 
//   },
//   refreshButton: {
//     backgroundColor: "#4CAF50", 
//     color: "white", 
//     padding: "5px 10px",
//     borderRadius: "5px",
//     cursor: "pointer",
//   },
//   select: {
//     padding: "5px",
//     marginLeft: "10px",
//   },
// };

// export default PatientTable;
