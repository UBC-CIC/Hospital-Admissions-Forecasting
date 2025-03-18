import {
    App,
    GitHubSourceCodeProvider,
  } from "@aws-cdk/aws-amplify-alpha";
  import * as cdk from "aws-cdk-lib";
  import { BuildSpec } from "aws-cdk-lib/aws-codebuild";
  import { Construct } from "constructs";
  import * as yaml from "yaml";
  import { ApiStack } from "./ApiStack"; // Ensure this points to your API Stack
  
  export class AmplifyStack extends cdk.Stack {
    constructor(
      scope: Construct,
      id: string,
      apiStack: ApiStack,
      props?: cdk.StackProps
    ) {
      super(scope, id, props);
  
      // Define the GitHub repository as a parameter
      const githubRepoName = new cdk.CfnParameter(this, "githubRepoName", {
        type: "String",
        description: "GitHub repository name for the Amplify app",
      }).valueAsString;
  
      // 🔹 Define the Amplify YAML configuration with redirects
      const amplifyYaml = yaml.parse(`
        version: 1
        applications:
          - appRoot: frontend
            frontend:
              phases:
                preBuild:
                  commands:
                    - pwd
                    - npm ci
                build:
                  commands:
                    - npm run build
              artifacts:
                baseDirectory: dist
                files:
                  - '**/*'
              cache:
                paths:
                  - 'node_modules/**/*'
              redirects:
                - source: </^[^.]+$|.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>
                  target: /
                  status: 404
      `);
  
      // 🔹 Fetch GitHub username from AWS SSM Parameter Store
      const username = cdk.aws_ssm.StringParameter.valueForStringParameter(
        this,
        "github-owner-name"
      );
  
      // 🔹 Create the Amplify app
      const amplifyApp = new App(this, `${id}-AmplifyApp`, {
        appName: `${id}-amplify`,
        sourceCodeProvider: new GitHubSourceCodeProvider({
          owner: username,
          repository: githubRepoName,
          oauthToken: cdk.SecretValue.secretsManager(
            "github-personal-access-token",
            {
              jsonField: "my-github-token",
            }
          ),
        }),
        environmentVariables: {
          VITE_AWS_REGION: this.region,
          VITE_API_ENDPOINT: apiStack.apiUrl, // ✅ Inject API URL dynamically
        },
        buildSpec: BuildSpec.fromObjectToYaml(amplifyYaml),
      });
  
      // 🔹 Deploy Amplify app on the "main" branch
      amplifyApp.addBranch("main");
  
      // Output Amplify App URL
      new cdk.CfnOutput(this, "AmplifyAppURL", {
        value: amplifyApp.defaultDomain,
        description: "Amplify App URL",
      });
    }
  }
  