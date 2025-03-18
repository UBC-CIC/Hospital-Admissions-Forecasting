import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with Subnets
    this.vpc = new ec2.Vpc(this, "MyVPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        { name: "PublicSubnet", subnetType: ec2.SubnetType.PUBLIC, mapPublicIpOnLaunch: true },
        { name: "PrivateSubnet", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { name: "IsolatedSubnet", subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });
  }
}
