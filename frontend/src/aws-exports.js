import { Amplify } from "aws-amplify";

const awsExports = {
  API: {
    REST: {
      MyApi: {
        endpoint: process.env.VITE_API_ENDPOINT.replace(/\/$/, ""), // 🔥 Injected from Amplify CDK
        region: process.env.VITE_AWS_REGION,
      },
    },
  },
};

export default awsExports;
