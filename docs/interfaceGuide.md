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
![halton_dashboard_UI_3](https://github.com/user-attachments/assets/b4330b40-772d-4a3e-a23c-73ca99abd260)

At the bottom is a chart to see patients by `Urgency` (based on model score) and `Facility ID`. Hovering over each bar allows users to see the exact number of predictions distribution for each facility:
<img width="1373" alt="halton_dashboard_UI_2" src="https://github.com/user-attachments/assets/ec013547-2ce0-4fe5-8061-e0e96f3ff129" />






