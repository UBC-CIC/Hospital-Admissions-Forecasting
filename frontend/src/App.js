// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Dashboard from "./pages/Dashboard";
// import PatientDetails from "./pages/PatientDetails";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Dashboard />} />
//         <Route path="/patient/:id" element={<PatientDetails />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import Dashboard from "./pages/Dashboard";
import PatientDetails from "./pages/PatientDetails";

// AWS Amplify Configuration (Dynamically Injected from CDK)
Amplify.configure({
  API: {
    REST: {
      MyApi: {
        endpoint: process.env.REACT_APP_API_ENDPOINT, // Injected via Amplify/CDK
      },
    },
  },
});

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patient/:id" element={<PatientDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
