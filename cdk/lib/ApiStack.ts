import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Define Lambda function
    const apiLambda = new lambda.Function(this, "ApiHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"), // Ensure you have a lambda/ folder
      handler: "api.handler",
    });

    // ✅ Create API Gateway
    const api = new apigateway.RestApi(this, "PatientApi", {
      restApiName: "Patient Prediction API",
      description: "API for patient data processing",
    });

    // ✅ Create API Gateway Resource (e.g., /predict)
    const predictResource = api.root.addResource("predict");

    // ✅ Define API Method (POST /predict)
    predictResource.addMethod("POST", new apigateway.LambdaIntegration(apiLambda));
  }
}
