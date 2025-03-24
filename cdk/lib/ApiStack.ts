import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  dbCluster: rds.DatabaseCluster;
  dbSecret: secretsmanager.Secret;
  vpc: ec2.Vpc;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;  // API URL Output

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);


    const apiGatewayLoggingRole = new iam.Role(this, 'ApiGatewayLoggingRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    const psycopg2Layer = new lambda.LayerVersion(this, 'Psycopg2Layer', {
      code: lambda.Code.fromAsset('layers/psycopg2.zip'),  // 🔹 Use locally bundled psycopg2
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: "Psycopg2 Lambda Layer",
    });


    // 🔹 Define the Fetch Entries Lambda inside API Stack
    const fetchEntriesLambda = new lambda.Function(this, 'FetchEntriesLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'fetchEntries.lambda_handler',
      code: lambda.Code.fromAsset('lambda/fetchEntries'), // Lambda function folder
      layers: [psycopg2Layer],
      environment: {
        DB_HOST: props.dbCluster.clusterEndpoint.hostname,
        DB_PORT: props.dbCluster.clusterEndpoint.port.toString(),
        DB_NAME: 'PredictionsDB',
        DB_SECRET_ARN: props.dbSecret.secretArn, // 🔹 Pass secret ARN instead of raw credentials
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      vpc: props.vpc,
      securityGroups: [props.dbCluster.connections.securityGroups[0]],
    });

    // 🔹 Grant Lambda permission to read database credentials
    props.dbSecret.grantRead(fetchEntriesLambda);

    // 🔹 Create API Gateway
    const api = new apigateway.RestApi(this, 'PredictionsAPI', {
      restApiName: "Predictions API",
      description: "Fetch daily entries from Aurora",
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.INFO, // Enables execution logging
        dataTraceEnabled: true, // Logs request/response data
        metricsEnabled: true, // Enables CloudWatch Metrics
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new cdk.aws_logs.LogGroup(this, 'ApiGatewayAccessLogs')
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,  // Enable CORS for frontend
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const cfnAccount = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayLoggingRole.roleArn,
    });

    api.node.addDependency(cfnAccount);


    // 🔹 Create API Endpoint for Fetching Entries
    const fetchEntriesIntegration = new apigateway.LambdaIntegration(fetchEntriesLambda);
    api.root.addResource('fetch').addMethod('GET', fetchEntriesIntegration);

    // Output API URL for frontend use
    this.apiUrl = api.url;

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: this.apiUrl,
      description: "API Gateway URL for fetching predictions",
    });
  }
}
