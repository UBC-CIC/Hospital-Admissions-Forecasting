
# Hospital Admissions Forecasting

This project involves a classical machine learning (ML) model to predict hospital admissions using data collected in an Emergency Room (ER).




## Motivation

When a patient visits an ER, typically they are triaged by ER nurses to collect preliminary information about the visit, and a few hours later, the patient receives a decision from a doctor regarding hospital admission. A ML model that can predict hospital admissions at the time of triage could potentially save the ER time to coordinate beds and allocate staffing resources.

![Impact of model prediction on bed coordination](https://placehold.co/600x400)
*Impact of model prediction on bed coordination. Picture taken from [1]*
## Project Solution

A random forest classifier was identified as the best classifier for the task. This solution prototype includes a dashboard for ER clinicians to sort ER patients by the model output and thus urgency/likelihood of patient admissions.

The solution utilises AWS resources to host a trained ML model and provide a dashboard with patient information.

![Dashboard Preview](https://placehold.co/600x400)
*Dashboard Preview*
## Architecture Diagram

![Architecture Diagram](https://placehold.co/600x400)
*Project Architecture Diagram*
## Credits

This application was architected and developed by Rohit Murali, Khushi Narang and Amy Cao with support from the UBC CIC.
## References
[1] - Yuval Barak-Corren, Andrew M. Fine, Ben Y. Reis; Early Prediction Model of Patient Hospitalization From the Pediatric Emergency Department. Pediatrics May 2017;