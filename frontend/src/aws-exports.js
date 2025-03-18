import { Amplify } from "aws-amplify";

const apiEndpoint = process.env.VITE_API_ENDPOINT?.replace(/\/$/, "");

const awsExports = {
  API: {
    REST: {
      MyApi: {
        endpoint: apiEndpoint, // Injected from Amplify CDK
        region: process.env.VITE_AWS_REGION,
      },
    },
  },
};

export default awsExports;
