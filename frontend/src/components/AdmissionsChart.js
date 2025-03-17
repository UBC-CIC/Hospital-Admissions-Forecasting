import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { facility: "MDH", admissions: 120 },
  { facility: "GDH", admissions: 100 },
  { facility: "OTMH", admissions: 140 },
];

const AdmissionsChart = () => {
  // Define the colors for each facility
  const facilityColors = {
    MDH: "#0000FF", // Blue
    GDH: "#008000", // Green
    OTMH: "#FF0000", // Red
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="facility" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="admissions">
            {data.map((entry) => (
              <Cell key={entry.facility} fill={facilityColors[entry.facility]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdmissionsChart;
