import { Amplify } from "aws-amplify";

const awsExports = {
  API: {
    REST: {
      MyApi: {
        endpoint: process.env.VITE_API_ENDPOINT, // 🔥 Injected from Amplify CDK
      },
    },
  },
};

export default awsExports;
