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
   - [Step 3: Training the model](#step-3-Training-the-Model-and-Generating-model.tar.gz)
   - [Step 4: CDK Deployment](#step-3-cdk-deployment)
   - [Step 5: Deploying the Sagemaker Inference Endpoint](#step-4-Deploying-the-Sagemaker-Inference-Endpoint)
- [Post-Deployment](#post-deployment)
   - [Step 1: Build AWS Amplify App](#step-1-build-aws-amplify-app)
   - [Step 2: Add Redirect](#step-2-add-redirect)
   - [Step 3: Visit Web App](#step-3-visit-web-app)

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
**Note**: This solution is designed for deployment in the `ca-central-1` AWS region. If you are using a different AWS region, please review the [Region-Specific Configuration Notes](#region-specific-configuration-notes) below before deployment.

### Create GitHub Personal Access Token
To deploy this solution, you will need to generate a GitHub personal access token. Please visit [here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) for detailed instruction to create a personal access token.

*Note: when selecting the scopes to grant the token (step 8 of the instruction), make sure you select `repo` scope.*

**Once you create a token, please note down its value as you will use it later in the deployment process.**

## Deployment
### Step 1: Fork & Clone The Repository
First, you need to fork the repository. To create a fork, navigate to the main branch of this repository. Then, in the top-right corner, click Fork.

![fork-repo](https://github.com/user-attachments/assets/602d9890-d85a-4dcb-9e20-fc0d33afd2e6)


You will be directed to the page where you can customize owner, repository name, etc, but you do not have to change any option. Simply click Create fork in the bottom right corner.

Now let's clone the GitHub repository onto your machine. To do this:
1. Create a folder on your computer to contain the project code.
2. For an Apple computer, open Terminal. If on a Windows machine, open Command Prompt or Windows Terminal. Enter into the folder you made using the command cd path/to/folder. To find the path to a folder on a Mac, right click on the folder and press Get Info, then select the whole text found under Where: and copy with ⌘C. On Windows (not WSL), enter into the folder on File Explorer and click on the path box (located to the left of the search bar), then copy the whole text that shows up.
3. Clone the GitHub repository by entering the following command. Be sure to replace `<YOUR-GITHUB-USERNAME>` with your own username.
```
git clone <https://github.com/><YOUR-GITHUB-USERNAME>/Hospital-Admissions-Forecasting.git
```
The code should now be in the folder you created. Navigate into the root folder containing the entire codebase by running the command:
```
cd Hospital-Admissions-Forecasting
```
You would have to supply your GitHub personal access token you created earlier when deploying the solution. Run the following command and ensure you replace `<YOUR-GITHUB-TOKEN>` and `<YOUR-PROFILE-NAME>` with your actual GitHub token and the appropriate AWS profile name. Select the command corresponding to your operating system from the options below.


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

### Step 3: Training the Model and Generating model.tar.gz
Open the Jupyter Notebook in SageMaker Studio

Upload and open the provided Training notebook in SageMaker Studio. 
You can find the training notebook [here](https://github.com/UBC-CIC/Hospital-Admissions-Forecasting/tree/de358887cb097bb9e6819f02a5bdf859ba38b65d/Training%20Notebook).

Run the Notebook to Train the Model. Refer to the [training guide](https://github.com/UBC-CIC/Hospital-Admissions-Forecasting/blob/de358887cb097bb9e6819f02a5bdf859ba38b65d/docs/training-and-experimentation-guide.md)

SageMaker will train the model and save the trained artifacts to the specified S3 bucket. Retrieve the `model.tar.gz` File

Once the training job is complete, SageMaker automatically generates a model.tar.gz file. This file contains the serialized model and any supporting files (e.g., tokenizer, config).

*Note: Make sure you upload the `inference.py` and `requirements.txt` [link](https://github.com/UBC-CIC/Hospital-Admissions-Forecasting/tree/main/training%20files) to the training bucket before generating the trained model file as mentioned in the [training guide](https://github.com/UBC-CIC/Hospital-Admissions-Forecasting/blob/de358887cb097bb9e6819f02a5bdf859ba38b65d/docs/training-and-experimentation-guide.md).



### Step 4: CDK Deployment
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
cdk deploy --all --parameters halton-AmplifyStack:githubRepoName=Hospital-Admissions-Forecasting --context StackPrefix=halton --profile <your-profile-name>
```

If you have trouble running the commands, try removing all the \ and run it in one line.

#### **Region-Specific Configuration Notes**

This solution is configured by default for the `ca-central-1` AWS region. If you are deploying in a different region (e.g., `us-west-2`), you must update the following items accordingly:

1. **AWS Lambda Layer ARN (AWS SDK for Pandas)**:

   - The Lambda function in this project uses a prebuilt AWS-managed Lambda layer for `awswrangler` (AWS SDK for Pandas).

   - These ARNs are region-specific. The current reference uses the `ca-central-1` ARN:
   `arn:aws:lambda:ca-central-1:336392948345:layer:AWSSDKPandas-Python39:2`

   - If you're deploying in another region (e.g., `us-west-2`), change the ARN region part to match your deployment region. The account ID remains unchanged (`336392948345`).

   - Here is a reference documentation for more information:
   [AWS SDK for Pandas Lambda Layer Docs](https://aws-sdk-pandas.readthedocs.io/en/3.9.0/layers.html). 

2. **SageMaker Container Image URI**:

   - The SageMaker model in this project uses a prebuilt scikit-learn container image from a public AWS ECR.

   - These URIs also vary by region. The current URI in use is for `ca-central-1`:
   
      `image_uri = '341280168497.dkr.ecr.ca-central-1.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3'`

   - For deployments outside of `ca-central-1`, refer to this documentation to find the correct container image URI for your region: [ SageMaker Container Registry Paths by Region](https://docs.aws.amazon.com/sagemaker/latest/dg-ecr-paths/sagemaker-algo-docker-registry-paths.html).

### Step 5: Deploying the Sagemaker Inference Endpoint
1. Make sure you have the trained model artifact file (should be named `model.tar.gz`) with the inference script and requirements file.
2. At the [AWS online console](https://console.aws.amazon.com/console/home), enter `S3` in the search bar.
3. In the `Buckets` search bar enter `sagemaker` and click on the name of the bucket (the actual name will vary a bit but should have `model bucket` in its name). This is where you will upload the trained model artifact.
   ![image](https://github.com/user-attachments/assets/1ac2736c-2745-45ab-a2b7-45e59b44a978)
5. In this bucket click `Upload`. Then, click `Add Files`. Add the trained model artifact file `model.tar.gz` and click `Upload` to complete the process.
   ![Screenshot 2025-03-24 at 12 31 08 PM](https://github.com/user-attachments/assets/1f2d0929-12b8-40a7-a33f-023d1bcc093e)
6. Once the upload is complete, click `Close`.
7. At the [AWS online console](https://console.aws.amazon.com/console/home), enter `Amazon SageMaker AI`. Navigate to `Inference`, then `Endpoints`. Make sure the `medical-inference-endpoint` is `InService`.
   ![Screenshot 2025-03-24 at 12 31 08 PM](https://github.com/user-attachments/assets/92dcae42-e231-4fd2-8ea3-dd114b79f9fb)


## Post-Deployment
### Step 1: Build AWS Amplify App

1. Log in to AWS console, and navigate to **AWS Amplify**. You can do so by typing `Amplify` in the search bar at the top.
2. From `All apps`, click `halton-amplify`.
3. Then click `main` under `branches`
4. Click `run job` and wait for the build to complete.
5. You now have access to the `Amplify App ID` and the public domain name to use the web app.

### Step 2: Change Redirects

1. Click back to navigate to `halton-amplify/Overview`
2. In the left side bar click   `Rewrites and Redirects` under `Hosting`
3. Click `manage redirects` on the top right
4. Click `add rewrite`
5. For `Source address` type `</^[^.]+$|.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
6. For `Target address` type `/`
7. For `Type` select `404 (Redirect)`
8. Click `Save`


### Step 3: Visit Web App
Now you can navigate to the URL you created in step 1 to see your application in action.



