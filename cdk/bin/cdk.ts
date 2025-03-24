#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
// import { AmplifyStack } from "../lib/amplify-stack";
import { VpcStack } from "../lib/VpcStack";
import { ApiStack } from "../lib/ApiStack";
import { SageMakerEndpointStack } from "../lib/SageMakerEndpoint";
import { DatabaseStack } from '../lib/DatabaseStack';
import { InferenceLambdaStack } from '../lib/InferenceLambdaStack';
import { AmplifyStack } from '../lib/AmplifyStack';
import { Tags } from "aws-cdk-lib";

const app = new cdk.App();


// Define a common resource prefix
let resourcePrefix = app.node.tryGetContext("prefix") || "haltonhealthcare";

// Create Standalone VPC Stack
new VpcStack(app, `${resourcePrefix}-VpcStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// Create Aurora Databse Stack
const auroraStack = new DatabaseStack(app, "AuroraDatabaseStack");

// Creating an instance of the SagemakerEndpoint stack
const sageMakerEndpointStack = new SageMakerEndpointStack(app, `${resourcePrefix}-SageMakerEndpointStack`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// //  Create Standalone SageMaker Stack
// new LambdaStack(app, `${resourcePrefix}-LambdaStack`, {
//   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
// });

const apiStack = new ApiStack(app, "ApiStack", {
  dbCluster: auroraStack.dbCluster,
  dbSecret: auroraStack.secret,
  vpc: auroraStack.vpc,
});


new InferenceLambdaStack(app, 'InferenceLambdaStack', {
    sagemakerEndpointName: sageMakerEndpointStack.sagemakerEndpointName, //  FIXED
    dbCluster: auroraStack.dbCluster,
    dbSecret: auroraStack.secret,
    vpc: auroraStack.vpc,
});

const amplifyStack = new AmplifyStack(app, "AmplifyStack", apiStack);


// const amplifyStack = new AmplifyStack(app, `${resourcePrefix}-AmplifyStack`,apiStack, { env });



// // 🌟 Create Standalone Amplify Stack  
// new AmplifyStack(app, `${resourcePrefix}-AmplifyStack`, {
//   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
// });

//  Added Tags for easier AWS resource management
Tags.of(app).add("Project", "HaltonHealthcare-ML");
Tags.of(app).add("Environment", "Production");
Tags.of(app).add("Owner", "UBC-CIC");
