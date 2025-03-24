# Deployment Guide

## Table of Contents
<!-- no toc -->
- [Requirements](#requirements)
   - [Accounts Requirements](#accounts-requirements)
   - [Software Requirements](#software-requirements)
- [Pre-Deployment](#pre-deployment)
   - [Create GitHub Personal Access Token](#create-github-personal-access-token)
- [Deployment](#deployment)
   - [Step 1: Fork \& Clone The Repository](#step-1-fork--clone-the-repository)
     - [Install Dependencies](#install-dependencies)
   - [Step 2: Upload Secrets](#step-2-upload-secrets)
   - [Step 3: Backend Deployment](#step-3-backend-deployment)
     - [1: Navigate to the cdk directory](#1-navigate-to-the-cdk-directory)
     - [2: Upload the Elsevier API Key, Institution Token, Database Secret and OPS API Key](#2-upload-the-elsevier-api-key-institution-token-database-secret-and-ops-api-key)
     - [3a: CDK Deployment in Hybrid Cloud Environment](#3a-cdk-deployment-in-hybrid-cloud-environment)
     - [3b: CDK Deployment](#3b-cdk-deployment)
   - [Taking down the deployed stacks](#taking-down-the-deployed-stacks)
   - [Step 4: Upload Data to S3 for the Bulk Data Pipeline](#step-4-upload-data-to-s3-for-the-bulk-data-pipeline)
   - [Step 5: Upload Data to S3 for the Grant Data Pipeline](#step-5-upload-data-to-s3-for-the-grant-data-pipeline)
   - [Step 6: Starting Patent Data Pipeline](#step-6-starting-patent-data-pipeline)
- [Post-Deployment](#post-deployment)
   - [Step 1: Build AWS Amplify App](#step-1-build-aws-amplify-app)
   - [Step 2: Add Redirect](#step-2-add-redirect)
   - [Step 3: Visit Web App](#step-3-visit-web-app)
- [Creating a User](#creating-a-user)
- [Activating User Self Sign up](#activating-user-self-sign-up)

## Requirements

### Accounts Requirements

- [AWS Account](https://aws.amazon.com/account/)
- [GitHub Account](https://github.com/)

### Software Requirements

Before you deploy, you must have the following softwares installed on your device. Please install the correct version of each software according to your machine's operating system. As of October 31, 2024 this deployment has been verified with the following versions of softwares:

- [AWS CLI](https://aws.amazon.com/cli/) *(v2.15.43)*
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) *(v2.149.0)*
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) *(v10.7.0)*
- [node](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs) *(v20.12.2)*
- [git](https://git-scm.com/downloads) *(v2.45.0.windows.1)*


If you are on a Windows device, it is recommended to install the [Windows Subsystem For Linux](https://docs.microsoft.com/en-us/windows/wsl/install), which lets you run a Linux terminal on your Windows computer natively. Some of the steps will require its use. [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701) is also recommended for using WSL.

## Pre-Deployment
### Create GitHub Personal Access Token
To deploy this solution, you will need to generate a GitHub personal access token. Please visit [here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) for detailed instruction to create a personal access token.

*Note: when selecting the scopes to grant the token (step 8 of the instruction), make sure you select `repo` scope.*

**Once you create a token, please note down its value as you will use it later in the deployment process.**

## Deployment
### Step 1: Fork & Clone The Repository
First, you need to fork the repository. To create a fork, navigate to the main branch of this repository. Then, in the top-right corner, click Fork.



You will be directed to the page where you can customize owner, repository name, etc, but you do not have to change any option. Simply click Create fork in the bottom right corner.

Now let's clone the GitHub repository onto your machine. To do this:
1. Create a folder on your computer to contain the project code.
2. For an Apple computer, open Terminal. If on a Windows machine, open Command Prompt or Windows Terminal. Enter into the folder you made using the command cd path/to/folder. To find the path to a folder on a Mac, right click on the folder and press Get Info, then select the whole text found under Where: and copy with ⌘C. On Windows (not WSL), enter into the folder on File Explorer and click on the path box (located to the left of the search bar), then copy the whole text that shows up.
3. Clone the GitHub repository by entering the following command. Be sure to replace `<YOUR-GITHUB-USERNAME>` with your own username.
```
git clone <https://github.com/><YOUR-GITHUB-USERNAME>/AI-Learning-Assistant.git
```
The code should now be in the folder you created. Navigate into the root folder containing the entire codebase by running the command:
```
cd AI-Learning-Assistant
```
You would have to supply your GitHub personal access token you created earlier when deploying the solution. Run the following command and ensure you replace `<YOUR-GITHUB-TOKEN>` and `<YOUR-PROFILE-NAME>` with your actual GitHub token and the appropriate AWS profile name. Select the command corresponding to your operating system from the options below.

<details>
<summary>macOS</summary>


#### Install Dependencies

Go into the cdk folder which can be done with the following command:

```
cd cdk
```

Now that you are in the cdk directory, install the core dependencies with the following command:

```
npm install
```

Go into the frontend folder which can be done with the following command:

```
cd ../frontend
```

Now that you are in the frontend directory, install the core dependencies with the following command:

```bash
npm install
```

### Step 2: Upload Secrets
You would have to supply your GitHub personal access token you created earlier when deploying the solution. Run the following command and ensure you replace `<YOUR-GITHUB-TOKEN>` and `<YOUR-PROFILE-NAME>` with your actual GitHub token and the appropriate AWS profile name. Select the command corresponding to your operating system from the options below.

<details>
<summary>macOS</summary>

```bash
aws secretsmanager create-secret \
    --name github-personal-access-token \
    --secret-string '{"my-github-token": "<YOUR-GITHUB-TOKEN>"}' \
    --profile <YOUR-PROFILE-NAME>
```

</details>

<details>
<summary>Windows CMD</summary>

```cmd
aws secretsmanager create-secret ^
    --name github-personal-access-token ^
    --secret-string "{\"my-github-token\": \"<YOUR-GITHUB-TOKEN>\"}" ^
    --profile <YOUR-PROFILE-NAME>
```

</details>

<details>
<summary>PowerShell</summary>

```powershell
aws secretsmanager create-secret `
    --name github-personal-access-token `
    --secret-string '{"my-github-token": "<YOUR-GITHUB-TOKEN>"}' `
    --profile <YOUR-PROFILE-NAME>
```
</details>

&nbsp;

Moreover, you will need to upload your github username to Amazon SSM Parameter Store. You can do so by running the following command. Make sure you replace `<YOUR-GITHUB-USERNAME>` and `<YOUR-PROFILE-NAME>` with your actual username and the appropriate AWS profile name.


<details>
<summary>macOS</summary>

```bash
aws ssm put-parameter \
    --name "github-owner-name" \
    --value "<YOUR-GITHUB-USERNAME>" \
    --type String \
    --profile <YOUR-PROFILE-NAME>
```
</details>

<details>
<summary>Windows CMD</summary>

```cmd
aws ssm put-parameter ^
    --name "github-owner-name" ^
    --value "<YOUR-GITHUB-USERNAME>" ^
    --type String ^
    --profile <YOUR-PROFILE-NAME>
```

</details>

<details>
<summary>PowerShell</summary>

```powershell
aws ssm put-parameter `
    --name "github-owner-name" `
    --value "<YOUR-GITHUB-USERNAME>" `
    --type String `
    --profile <YOUR-PROFILE-NAME>
```
</details>

### Step 3: CDK Deployment
It's time to set up everything that goes on behind the scenes! For more information on how the backend works, feel free to refer to the Architecture Deep Dive, but an understanding of the backend is not necessary for deployment.

Open a terminal in the `/cdk` directory.

**Download Requirements**: Install requirements with npm by running `npm install` command.


**Initialize the CDK stack**(required only if you have not deployed any resources with CDK in this region before). Please replace `<your-profile-name>` with the appropriate AWS profile used earlier.
```
cdk synth --profile <your-profile-name>
cdk bootstrap aws://<YOUR_AWS_ACCOUNT_ID>/<YOUR_ACCOUNT_REGION> --profile <your-profile-name>
```

**Deploy CDK stack**
 You may run the following command to deploy the stacks all at once. Again, replace `<your-profile-name>` with the appropriate AWS profile used earlier. Also replace `<your-stack-prefix>` with the appropriate stack prefix.
The stack prefix will be prefixed onto the physical names of the resources created during deployment.
```
cdk deploy --all \
 --parameters <your-stack-prefix>-AmplifyStack:githubRepoName=Hospital-Admissions-Forecasting \
 --context StackPrefix=<your-stack-prefix> \
 --profile <your-profile-name>
```

For example:
```
cdk deploy --all --parameters AILA-AmplifyStack:githubRepoName=AI-Learning-Assistant --context StackPrefix=AILA --profile <your-profile-name>
```

If you have trouble running the commands, try removing all the \ and run it in one line.


#### 1: Navigate to the cdk directory
Navigate to the cdk directory in the repository using the following command.

```
cd cdk
```

#### 3a: CDK Deployment in Hybrid Cloud Environment

The following set of instructions are only if you want to deploy this application in a **hybrid cloud environment**. If you do not want to do this you can skip to [3b: CDK Deployment](#3b-cdk-deployment).

In order to deploy in a hybrid cloud environment, you will need to have access to the **aws-controltower-VPC** and the name of your **AWSControlTowerStackSet**.

#### Step-by-Step Instructions

1. **Modify the VPC Stack:**
   - Navigate to the `vpc-stack.ts` file located at `cdk/lib/vpc-stack.ts`.
   - Replace **line 13** with your existing VPC ID:
     ```typescript
     const existingVpcId: string = 'your-vpc-id'; //CHANGE IF DEPLOYING WITH EXISTING VPC
     ```
     You can find your VPC ID by navigating to the **VPC dashboard** in the AWS Management Console and locating the VPC in the `Your VPCs` section.

     ![VPC ID Image](images/ExistingVPCId.png)

2. **Update the AWS Control Tower Stack Set:**
   - Replace **line 21** with your AWS Control Tower Stack Set name:
     ```typescript
     const AWSControlTowerStackSet = "your-stackset-name"; //CHANGE TO YOUR CONTROL TOWER STACK SET
     ```
     You can find this name by navigating to the **CloudFormation dashboard** in AWS, under `Stacks`. Look for a stack name that starts with `StackSet-AWSControlTowerBP-VPC-ACCOUNT-FACTORY`.

     ![AWS Control Tower Stack Image](images/AWSControlTowerStack.png)


You can proceed with the rest of the deployment instructions and the Vpc Stack will automatically use your existing VPC instead of creating a new one. For more detailed information about the hybrid cloud deployment you checkout the [Hybrid Cloud Deployment Guide](/docs/HybridCloudDeploymentGuide.md)

#### 3b: CDK Deployment

Initialize the CDK stacks, replacing `<YOUR_AWS_ACCOUNT_ID>`, `<YOUR_ACCOUNT_REGION>` and `<YOUR-PROFILE-NAME>`. with the appropriate values. **NOTE: Remember to have your Docker container running.**

```bash
cdk bootstrap aws://<YOUR_AWS_ACCOUNT_ID>/<YOUR_ACCOUNT_REGION> --profile <YOUR-PROFILE-NAME>
cdk synth --profile <YOUR-PROFILE-NAME>
```

Deploy the CDK stacks:

**Note for deploying the PatentDataStack**: You must make a note of what the name of your institution appear on [Espacenet](https://worldwide.espacenet.com/patent/) or by working with a representative from the European Patent Office. We highly recommend working with a patent specialist to determine the exact name that represents your institution on Espacenet/EPO.

For example, it was determined that the EPO/Espacenet use "UNIV BRITISH COLUMBIA" to represent UNIVERSITY OF BRITISH COLUMBIA. ![alt text](images/espacenet-applicant-name.png)

Thus you should do the following if you would like to deploy only the Patent Data Stack:

```
cdk deploy PatentDataStack --parameters PatentDataStack:epoInstitutionName="UNIV BRITISH COLUMBIA,UNIVERSITY OF BRITISH COLUMBIA" --profile <YOUR-PROFILE-NAME>
```

Note that the two name `"UNIV BRITISH COLUMBIA,UNIVERSITY OF BRITISH COLUMBIA"`  is separated by a comma, and there is **no space before or after the comma**.


You may run the following command to deploy the stacks all at once. Again, replace `<YOUR-INSTITUTION-NAME>` with the name that represents your instiution on Espacenet/EPO and`<YOUR-PROFILE-NAME>` with the appropriate AWS profile used earlier.

```
cdk deploy --all --parameters PatentDataStack:epoInstitutionName="<YOUR-INSTITUTION-NAME>" --profile <YOUR-PROFILE-NAME>
```

* Example:
   ```
   cdk deploy --all --parameters PatentDataStack:epoInstitutionName="UNIV BRITISH COLUMBIA,UNIVERSITY OF BRITISH COLUMBIA" --profile <YOUR-PROFILE-NAME>
   ```

## Post-Deployment

### Step 1: Build AWS Amplify App

Log in to AWS console, and navigate to **AWS Amplify**. You can do so by typing `Amplify` in the search bar at the top.

From `All apps`, click `faculty-cv-amplify`. The first time you enter this console, you will need to follow a series of straightforward instructions to configure your GitHub app and give permission to Amplify to modify your repo.
![AWS Amplify Console](images/amplify_github.png)

After this go back to `All apps`, click `faculty-cv-amplify` to go to the app settings. Note down the App ID.\
![image](images/amplify-app.png)


You may run the following command to build the app. Please replace `<APP-ID>` with the app ID found in amplify and `<PROFILE-NAME>` with the appropriate AWS profile used earlier. 
```
aws amplify start-job --job-type RELEASE --app-id <APP-ID> --branch-name main --profile <PROFILE-NAME>
```
This will trigger the build. 
When the build is completed, you will see the screen as shown in the below image.
Please note down the URL highlighted in red, as this will be the URL of the web application.
![image](images/amplify-link.png)

### Step 2: Add Redirect

Click on `Hosting` in the left taskbar and click on `Rewrites and redirects`.

![image](images/amplify-hosting.png)

Here click on `Manage redirects` and then `Add Rewrite` to add a redirect with: 
- Source Address:
`</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
- Target Address: `/`
- Type: `404 (Redirect)`

![image](images/amplify-redirect.png)

And then click `Save`.
Refer to [AWS's Page on Single Page Apps](https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html#redirects-for-single-page-web-apps-spa) for further information on why we did that.

### Step 3: Visit Web App
Now you can navigate to the URL you created in step 1 to see your application in action.

