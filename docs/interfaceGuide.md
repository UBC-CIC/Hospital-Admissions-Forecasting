# Interface Guide

[Please ensure the application is deployed, instructions in the
deployment guide here:](./deploymentGuide.md)

Once you have deployed the solution, the following user guide will help
you navigate the functions available.

Upon opening the application, the user will see the following home
page:
![halton_dashboard_UI_1](https://github.com/user-attachments/assets/20c66046-b7b7-4e75-8133-d393512e916d)


Upon clicking the refresh button, the model score updates in real-time.

The Current Patients table displays a list of patients, each identified by their unique `V_GUID`, `Facility ID`, `Registration Time`, and `Model Score`. Users can filter the table by Facility and Urgency to refine the displayed results. Users can also sort by `Registration Time` and `Model Score`.
![image](https://github.com/user-attachments/assets/e26ae06b-6a9c-44e4-8927-a6ca5716085a)

Sorted table would look something like this:
<img width="1404" alt="Screenshot 2025-03-26 at 5 51 26 PM" src="https://github.com/user-attachments/assets/226c6d12-c79d-4d34-bd3d-f0457640b4b3" />



At the bottom is a chart to see patients by `Urgency` (based on model score) and `Facility ID`. Hovering over each bar allows users to see the exact number of predictions distribution for each facility:
<img width="1373" alt="halton_dashboard_UI_2" src="https://github.com/user-attachments/assets/ec013547-2ce0-4fe5-8061-e0e96f3ff129" />






