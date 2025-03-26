
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UrgencyChart from "./UrgencyChart"; // Adjust the path as needed


const PatientTable = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({ facility: "", urgency: "" });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}fetch`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setPatients(data);
      setLastUpdatedAt(new Date()); // Update timestamp
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  };

  useEffect(() => {
    fetchPatients();
    const intervalId = setInterval(fetchPatients, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchPatients();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedPatients = [...patients].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === "registrationdatetime") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredPatients = sortedPatients.filter((patient) => {
    const matchesFacility = filters.facility ? patient.facility_id === filters.facility : true;
    const matchesUrgency =
      filters.urgency === "high"
        ? patient.modelscore >= 0.8
        : filters.urgency === "medium"
        ? patient.modelscore >= 0.3 && patient.modelscore < 0.8
        : filters.urgency === "low"
        ? patient.modelscore < 0.3
        : true;
    return matchesFacility && matchesUrgency;
  });

  const totalPages = Math.ceil(filteredPatients.length / recordsPerPage);
  const currentPatients = filteredPatients.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div style={styles.header}>
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
          <button onClick={handleRefresh} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>


      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>V_GUID</th>
            <th>Facility ID</th>
            <th>
              Registration Time{" "}
              <button style={styles.sortButton} onClick={() => handleSort("registrationdatetime")}>
                {sortConfig.key === "registrationdatetime" && sortConfig.direction === "asc" ? "⬆️" : "⬇️"}
              </button>
            </th>
            <th>
              Model Score{" "}
              <button style={styles.sortButton} onClick={() => handleSort("modelscore")}>
                {sortConfig.key === "modelscore" && sortConfig.direction === "asc" ? "⬆️" : "⬇️"}
              </button>
            </th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {currentPatients.map((patient) => (
            <tr key={patient.v_guid} style={{ backgroundColor: getUrgencyColor(patient.modelscore) }}>
              <td
                style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate(`/patient/${patient.v_guid}`)}
              >
                {patient.v_guid}
              </td>
              <td>{patient.facility_id}</td>
              <td>{formatDate(patient.registrationdatetime)}</td>
              <td>{patient.modelscore.toFixed(2)}</td>
              <td>{formatDate(patient.lastupdated)}</td>
            </tr>
          ))}
        </tbody>

      </table>

      {/* Pagination */}
      <div style={styles.pagination}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={styles.pageButton}
        >
          ◀ Prev
        </button>

        <span style={{ margin: "0 10px" }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={styles.pageButton}
        >
          Next ▶
        </button>
      </div>

      <UrgencyChart patients={patients} />

      {/* Last Updated */}
      <p style={{ marginTop: "10px", fontStyle: "italic", color: "gray" }}>
        Last updated: {lastUpdatedAt ? formatDate(lastUpdatedAt) : "Loading..."}
      </p>
    </div>
  );
};

const getUrgencyColor = (score) => {
  if (score >= 0.8) return "#FFCCCC";
  if (score >= 0.3) return "#FFFFCC";
  return "#CCFFCC";
};

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
    padding: "6px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    border: "none",
  },
  select: {
    padding: "5px",
    marginLeft: "10px",
  },
  sortButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    marginLeft: "5px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "10px",
  },
  pageButton: {
    padding: "6px 12px",
    margin: "0 5px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    cursor: "pointer",
    backgroundColor: "#f0f0f0",
  },
};

export default PatientTable;
