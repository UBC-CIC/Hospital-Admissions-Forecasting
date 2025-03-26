import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const UrgencyChart = ({ patients }) => {
  const urgencyCounts = patients.reduce(
    (acc, patient) => {
      const score = patient.modelscore;
      const facility = patient.facility_id;
      if (!acc[facility]) acc[facility] = { low: 0, medium: 0, high: 0 };

      if (score >= 0.8) acc[facility].high++;
      else if (score >= 0.3) acc[facility].medium++;
      else acc[facility].low++;

      return acc;
    },
    {}
  );

  const chartData = Object.entries(urgencyCounts).map(([facility, counts]) => ({
    facility,
    low: counts.low,
    medium: counts.medium,
    high: counts.high,
  }));

  return (
    <div>
      <h3 style={{ textAlign: "center" }}>Patients by Urgency Level</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} stackOffset="expand">
          <XAxis dataKey="facility" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="low" stackId="a" fill="#82ca9d" name="Low" />
          <Bar dataKey="medium" stackId="a" fill="#fdd835" name="Medium" />
          <Bar dataKey="high" stackId="a" fill="#f44336" name="High" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UrgencyChart;
