import { Amplify } from "@aws-amplify/core";

Amplify.configure({
  API: {
    REST: {
      MyApi: {
        endpoint: import.meta.env.VITE_API_ENDPOINT, // 🔥 Injected from Amplify CDK
      },
    },
  },
});
