| Field | Description | Note(s) | Format |
|---|---|---|---|
| EDVisit.AdmitDateTime | Date/Time stamp of admission. If not admitted then left blank. |  | Date/Time |
| EDVisit.Age | Patient's age in years at time of registration. |  | Whole number |
| EDVisit.Expired | If patient died then = Y otherwise blank |  | Text |
| EDVisit.Facility_MisFacID | Facility = OTMH |  | Text |
| EDVisit.MisRegTypeName | Emergency or Emergency Mental Health |  | Text |
| EDVisit.RegistrationDateTime | Date/Time stamp of registration |  | Date/Time |
| EDVisit.Sex | Patient sex (M or F) |  | Text |
| Total Admitted | If patient was admitted then = 1 else equals 0 |  | Whole number |
| Total EDVisit | All rows = 1 |  | Whole number |
| EDAcctCanadianAbs.AmbulanceArrivalDateTime | If patient arrived by ambulance, date/time stamp of arrival |  | Date/Time |
| EDAcctCanadianAbs.EdmComplaintName | eCTAS complaint (Structured field selection) |  | Text |
| EDAcctCanadianAbs.Priority_MisTriageID | CTAS level (1 to 5) |  | Whole number |
| EDAcctCanadianAbs.StatedComplaint | Free-text complaint (reason for visit) |  | Text |
| EDAcctCanadianAbs.TriageDateTime | Date/Time stamp of triage |  | Date/Time |
| RegistrationDate | Date of registration (without time) |  | Date |
| Blood_Pressure.ValueInfo | FIRST blood pressure reading | These are all based on the first vital signs reading from arrival date/time. If reading was not done then cell(s) will be blank. | Text |
| Blood_Pressure.DateTime | Date/Time of FIRST blood pressure reading |  | Date/Time |
| Capillary_Refill.ValueInfo | FIRST capillary refill reading |  | Text |
| Capillary_Refill.DateTime | Date/Time of FIRST capillary refill reading |  | Date/Time |
| Glasgow_Coma_Scale.ValueInfo | FIRST Glasgow Coma Scale score |  | Whole number |
| Glasgow_Coma_Scale.DateTime | Date/Time of FIRST Glasgow Coma Scale score |  | Date/Time |
| Pain_Severity_Scale.ValueInfo | FIRST Pain Severity Score |  | Whole number |
| Pain_Severity_Scale.DateTime | Date/Time of FIRST pain severity score |  | Date/Time |
| Pulse_Oximetry.ValueInfo | FIRST pulse oximetry value |  | Whole number |
| Pulse_Oximetry.DateTime | Date/Time of FIRST pulse oximetry value |  | Date/Time |
| Pulse_Rate.ValueInfo | FIRST Pulse value |  | Whole number |
| Pulse_Rate.DateTime | Date/Time of FIRST pulse value |  | Date/Time |
| Temperature.ValueInfo | FIRST temperature reading (Celsius) |  | Decimal number |
| Temperature.DateTime | Date/Time of FIRST temperature reading |  | Date/Time |
| Respiratory_Rate.ValueInfo | FIRST respiratory rate reading |  | Whole number |
| Respiratory_Rate.DateTime | Date/Time of FIRST respiratory rate reading |  | Date/Time |
| AmbulanceArrival | If arrived by ambulance = 1 else equals 0 |  | Whole number |

