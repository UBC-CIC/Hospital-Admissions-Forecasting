import { Amplify } from "aws-amplify";

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT?.replace(/\/$/, "");

const awsExports = {
  API: {
    REST: {
      PredictionsAPI: {
        endpoint: apiEndpoint, // Injected from Amplify CDK
        region: process.env.REACT_APP_AWS_REGION	,
      },
    },
  },
};

export default awsExports;
