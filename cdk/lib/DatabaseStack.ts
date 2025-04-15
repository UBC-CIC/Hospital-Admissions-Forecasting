
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly dbCluster: rds.DatabaseCluster;
  public readonly secret: secretsmanager.Secret;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🔹 Create VPC
    this.vpc = new ec2.Vpc(this, 'AuroraVPC', { maxAzs: 2 });

    // 🔹 Create Secret
    this.secret = new secretsmanager.Secret(this, 'AuroraSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // 🔹 Create Enhanced Monitoring Role with CUSTOM POLICY
    const monitoringRole = new iam.Role(this, 'MonitoringRole', {
      assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
      inlinePolicies: {
        // Custom policy to replace the missing AWS-managed policy
        EnhancedMonitoringPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:DescribeLogStreams',
                'logs:PutLogEvents',
                'logs:GetLogEvents',
              ],
              resources: ['*'], // Broad permissions required for monitoring
            }),
          ],
        }),
      },
    });

    //  Create Aurora Serverless v2 Cluster
    this.dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromSecret(this.secret),
      defaultDatabaseName: 'PredictionsDB',
      storageEncrypted: true,
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: this.vpc,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      writer: rds.ClusterInstance.serverlessV2('AuroraWriter', {
        publiclyAccessible: false,
      }),
      // Enhanced Monitoring Configuration
      monitoringInterval: cdk.Duration.seconds(60),
      monitoringRole: monitoringRole, // Attach custom role
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    });

    // Outputs
    new cdk.CfnOutput(this, 'AuroraSecretArn', {
      value: this.secret.secretArn,
    });
    new cdk.CfnOutput(this, 'AuroraEndpoint', {
      value: this.dbCluster.clusterEndpoint.hostname,
    });
  }
}