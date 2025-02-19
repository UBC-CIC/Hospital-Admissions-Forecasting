#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
// import { AmplifyStack } from "../lib/amplify-stack";
import { VpcStack } from "../lib/VpcStack";
import { SageMakerTrainingStack } from "../lib/SageMakerTraining";
import { ApiStack } from "../lib/ApiStack";
import { SageMakerEndpointStack } from "../lib/SageMakerEndpoint";
import { PatientDataStack } from "../lib/PatientData"; 
import { LambdaStack } from "../lib/Lambda";


import { Tags } from "aws-cdk-lib";

const app = new cdk.App();

// Define a common resource prefix
let resourcePrefix = app.node.tryGetContext("prefix") || "haltonhealthcare";

// 🌟 Create Standalone VPC Stack
new VpcStack(app, `${resourcePrefix}-VpcStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// 🌟 Create Standalone SageMaker Stack
new SageMakerTrainingStack(app, `${resourcePrefix}-SageMakerTrainingStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});


// 🌟 Create Standalone SageMaker Stack
new SageMakerEndpointStack(app, `${resourcePrefix}-SageMakerEndpointStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// 🌟 Create Standalone SageMaker Stack
new LambdaStack(app, `${resourcePrefix}-LambdaStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// 🌟 Create Standalone Lambda + API Gateway Stack
new ApiStack(app, `${resourcePrefix}-ApiStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// 🌟 Create Standalone Lambda + API Gateway Stack
new PatientDataStack(app, `${resourcePrefix}-PatientDataStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// // 🌟 Create Standalone Amplify Stack
// new AmplifyStack(app, `${resourcePrefix}-AmplifyStack`, {
//   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
// });

// 📌 Add Tags for easier AWS resource management
Tags.of(app).add("Project", "HaltonHealthcare-ML");
Tags.of(app).add("Environment", "Production");
Tags.of(app).add("Owner", "UBC-CIC");
