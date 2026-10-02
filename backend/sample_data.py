from typing import Dict, Any, List

def get_employee_sample_data() -> Dict[str, Any]:
    variables_meta = [
        {"name": "id", "type": "Numeric", "width": 4, "decimals": 0, "label": "Employee Code", "values": {}, "missing": "None", "columns": 6, "align": "Right", "measure": "Nominal", "role": "Input"},
        {"name": "gender", "type": "String", "width": 1, "decimals": 0, "label": "Gender", "values": {"m": "Male", "f": "Female"}, "missing": "None", "columns": 8, "align": "Left", "measure": "Nominal", "role": "Input"},
        {"name": "bdate", "type": "Date", "width": 10, "decimals": 0, "label": "Date of Birth", "values": {}, "missing": "None", "columns": 10, "align": "Right", "measure": "Scale", "role": "Input"},
        {"name": "educ", "type": "Numeric", "width": 2, "decimals": 0, "label": "Educational Level (years)", "values": {}, "missing": "None", "columns": 8, "align": "Right", "measure": "Ordinal", "role": "Input"},
        {"name": "jobcat", "type": "Numeric", "width": 1, "decimals": 0, "label": "Employment Category", "values": {"1": "Clerical", "2": "Custodial", "3": "Manager"}, "missing": "None", "columns": 10, "align": "Right", "measure": "Nominal", "role": "Input"},
        {"name": "salary", "type": "Dollar", "width": 8, "decimals": 2, "label": "Current Salary ($)", "values": {}, "missing": "None", "columns": 10, "align": "Right", "measure": "Scale", "role": "Target"},
        {"name": "salbegin", "type": "Dollar", "width": 8, "decimals": 2, "label": "Beginning Salary ($)", "values": {}, "missing": "None", "columns": 10, "align": "Right", "measure": "Scale", "role": "Input"},
        {"name": "jobtime", "type": "Numeric", "width": 3, "decimals": 0, "label": "Months since Hire", "values": {}, "missing": "None", "columns": 8, "align": "Right", "measure": "Scale", "role": "Input"},
        {"name": "minority", "type": "Numeric", "width": 1, "decimals": 0, "label": "Minority Classification", "values": {"0": "No", "1": "Yes"}, "missing": "None", "columns": 8, "align": "Right", "measure": "Nominal", "role": "Input"}
    ]

    # Generate representative SPSS sample rows
    rows_data = [
        {"id": 1, "gender": "m", "bdate": "1952-02-03", "educ": 15, "jobcat": 3, "salary": 57000.0, "salbegin": 27000.0, "jobtime": 98, "minority": 0},
        {"id": 2, "gender": "m", "bdate": "1958-05-23", "educ": 16, "jobcat": 1, "salary": 40200.0, "salbegin": 18750.0, "jobtime": 98, "minority": 0},
        {"id": 3, "gender": "f", "bdate": "1929-07-26", "educ": 12, "jobcat": 1, "salary": 21450.0, "salbegin": 12000.0, "jobtime": 98, "minority": 0},
        {"id": 4, "gender": "f", "bdate": "1947-04-15", "educ": 8, "jobcat": 1, "salary": 21900.0, "salbegin": 13200.0, "jobtime": 98, "minority": 0},
        {"id": 5, "gender": "m", "bdate": "1955-02-09", "educ": 15, "jobcat": 1, "salary": 45000.0, "salbegin": 21000.0, "jobtime": 98, "minority": 0},
        {"id": 6, "gender": "m", "bdate": "1958-08-22", "educ": 15, "jobcat": 1, "salary": 32100.0, "salbegin": 13500.0, "jobtime": 98, "minority": 0},
        {"id": 7, "gender": "m", "bdate": "1956-04-26", "educ": 15, "jobcat": 1, "salary": 36000.0, "salbegin": 18750.0, "jobtime": 98, "minority": 0},
        {"id": 8, "gender": "f", "bdate": "1966-05-06", "educ": 12, "jobcat": 1, "salary": 21900.0, "salbegin": 9750.0, "jobtime": 98, "minority": 0},
        {"id": 9, "gender": "f", "bdate": "1946-01-23", "educ": 15, "jobcat": 1, "salary": 27900.0, "salbegin": 12750.0, "jobtime": 98, "minority": 0},
        {"id": 10, "gender": "f", "bdate": "1946-02-13", "educ": 12, "jobcat": 1, "salary": 24000.0, "salbegin": 13500.0, "jobtime": 98, "minority": 0},
        {"id": 11, "gender": "f", "bdate": "1950-02-07", "educ": 16, "jobcat": 1, "salary": 30300.0, "salbegin": 16500.0, "jobtime": 98, "minority": 0},
        {"id": 12, "gender": "m", "bdate": "1960-01-11", "educ": 8, "jobcat": 1, "salary": 28350.0, "salbegin": 12000.0, "jobtime": 98, "minority": 1},
        {"id": 13, "gender": "m", "bdate": "1964-07-17", "educ": 15, "jobcat": 1, "salary": 27750.0, "salbegin": 14250.0, "jobtime": 98, "minority": 1},
        {"id": 14, "gender": "f", "bdate": "1962-02-26", "educ": 12, "jobcat": 1, "salary": 35100.0, "salbegin": 16800.0, "jobtime": 98, "minority": 1},
        {"id": 15, "gender": "m", "bdate": "1964-08-29", "educ": 12, "jobcat": 1, "salary": 27300.0, "salbegin": 13500.0, "jobtime": 97, "minority": 0},
        {"id": 16, "gender": "m", "bdate": "1964-11-17", "educ": 12, "jobcat": 1, "salary": 40800.0, "salbegin": 15000.0, "jobtime": 97, "minority": 0},
        {"id": 17, "gender": "m", "bdate": "1962-07-18", "educ": 15, "jobcat": 1, "salary": 46000.0, "salbegin": 14250.0, "jobtime": 97, "minority": 0},
        {"id": 18, "gender": "m", "bdate": "1956-03-20", "educ": 16, "jobcat": 3, "salary": 103750.0, "salbegin": 27510.0, "jobtime": 97, "minority": 0},
        {"id": 19, "gender": "m", "bdate": "1957-07-08", "educ": 12, "jobcat": 1, "salary": 42300.0, "salbegin": 14250.0, "jobtime": 97, "minority": 0},
        {"id": 20, "gender": "f", "bdate": "1940-01-23", "educ": 12, "jobcat": 1, "salary": 26250.0, "salbegin": 11550.0, "jobtime": 97, "minority": 0},
        {"id": 21, "gender": "m", "bdate": "1963-02-19", "educ": 12, "jobcat": 1, "salary": 38850.0, "salbegin": 15000.0, "jobtime": 97, "minority": 0},
        {"id": 22, "gender": "m", "bdate": "1940-09-24", "educ": 12, "jobcat": 1, "salary": 21750.0, "salbegin": 12750.0, "jobtime": 97, "minority": 0},
        {"id": 23, "gender": "f", "bdate": "1965-03-08", "educ": 15, "jobcat": 1, "salary": 24000.0, "salbegin": 13500.0, "jobtime": 97, "minority": 1},
        {"id": 24, "gender": "f", "bdate": "1961-07-27", "educ": 12, "jobcat": 1, "salary": 16950.0, "salbegin": 9000.0, "jobtime": 97, "minority": 1},
        {"id": 25, "gender": "f", "bdate": "1964-07-14", "educ": 15, "jobcat": 1, "salary": 21150.0, "salbegin": 12750.0, "jobtime": 96, "minority": 0},
        {"id": 26, "gender": "m", "bdate": "1966-02-26", "educ": 19, "jobcat": 3, "salary": 90625.0, "salbegin": 30000.0, "jobtime": 96, "minority": 0},
        {"id": 27, "gender": "f", "bdate": "1965-04-11", "educ": 15, "jobcat": 1, "salary": 19350.0, "salbegin": 10500.0, "jobtime": 96, "minority": 0},
        {"id": 28, "gender": "m", "bdate": "1964-04-11", "educ": 19, "jobcat": 3, "salary": 135000.0, "salbegin": 79980.0, "jobtime": 96, "minority": 0},
        {"id": 29, "gender": "m", "bdate": "1964-01-28", "educ": 15, "jobcat": 3, "salary": 72500.0, "salbegin": 28740.0, "jobtime": 96, "minority": 0},
        {"id": 30, "gender": "m", "bdate": "1961-09-17", "educ": 15, "jobcat": 1, "salary": 31200.0, "salbegin": 15000.0, "jobtime": 96, "minority": 0},
        {"id": 31, "gender": "m", "bdate": "1964-08-19", "educ": 12, "jobcat": 3, "salary": 110000.0, "salbegin": 52500.0, "jobtime": 96, "minority": 0},
        {"id": 32, "gender": "m", "bdate": "1962-09-02", "educ": 19, "jobcat": 3, "salary": 65000.0, "salbegin": 27480.0, "jobtime": 96, "minority": 0},
        {"id": 33, "gender": "m", "bdate": "1954-04-15", "educ": 15, "jobcat": 3, "salary": 45000.0, "salbegin": 20490.0, "jobtime": 96, "minority": 0},
        {"id": 34, "gender": "f", "bdate": "1962-11-01", "educ": 12, "jobcat": 1, "salary": 21450.0, "salbegin": 11250.0, "jobtime": 96, "minority": 0},
        {"id": 35, "gender": "m", "bdate": "1963-02-08", "educ": 8, "jobcat": 2, "salary": 24000.0, "salbegin": 13500.0, "jobtime": 96, "minority": 0},
        {"id": 36, "gender": "m", "bdate": "1962-08-09", "educ": 8, "jobcat": 2, "salary": 25500.0, "salbegin": 13500.0, "jobtime": 96, "minority": 0},
        {"id": 37, "gender": "m", "bdate": "1960-05-27", "educ": 12, "jobcat": 2, "salary": 30750.0, "salbegin": 15000.0, "jobtime": 96, "minority": 0},
        {"id": 38, "gender": "m", "bdate": "1959-10-18", "educ": 12, "jobcat": 2, "salary": 26250.0, "salbegin": 14250.0, "jobtime": 96, "minority": 0},
        {"id": 39, "gender": "m", "bdate": "1963-05-26", "educ": 8, "jobcat": 2, "salary": 24000.0, "salbegin": 13500.0, "jobtime": 96, "minority": 0},
        {"id": 40, "gender": "f", "bdate": "1964-07-18", "educ": 15, "jobcat": 1, "salary": 16950.0, "salbegin": 11250.0, "jobtime": 96, "minority": 1}
    ]

    return {
        "name": "Employee data.sav",
        "variables_meta": variables_meta,
        "rows_data": rows_data
    }

def get_medical_sample_data() -> Dict[str, Any]:
    variables_meta = [
        {"name": "patient_id", "type": "Numeric", "width": 4, "decimals": 0, "label": "Patient ID", "values": {}, "missing": "None", "columns": 8, "align": "Right", "measure": "Nominal", "role": "Input"},
        {"name": "treatment", "type": "Numeric", "width": 1, "decimals": 0, "label": "Treatment Group", "values": {"1": "Placebo", "2": "Low Dose", "3": "High Dose"}, "missing": "None", "columns": 10, "align": "Right", "measure": "Nominal", "role": "Input"},
        {"name": "age", "type": "Numeric", "width": 3, "decimals": 0, "label": "Age in Years", "values": {}, "missing": "None", "columns": 8, "align": "Right", "measure": "Scale", "role": "Input"},
        {"name": "baseline_bp", "type": "Numeric", "width": 5, "decimals": 1, "label": "Baseline Systolic BP (mmHg)", "values": {}, "missing": "None", "columns": 10, "align": "Right", "measure": "Scale", "role": "Input"},
        {"name": "post_bp", "type": "Numeric", "width": 5, "decimals": 1, "label": "Post-Treatment Systolic BP (mmHg)", "values": {}, "missing": "None", "columns": 10, "align": "Right", "measure": "Scale", "role": "Target"},
        {"name": "cholesterol", "type": "Numeric", "width": 5, "decimals": 1, "label": "Serum Cholesterol (mg/dL)", "values": {}, "missing": "None", "columns": 10, "align": "Right", "measure": "Scale", "role": "Input"}
    ]

    rows_data = [
        {"patient_id": 101, "treatment": 1, "age": 52, "baseline_bp": 145.0, "post_bp": 143.0, "cholesterol": 220.5},
        {"patient_id": 102, "treatment": 1, "age": 58, "baseline_bp": 150.0, "post_bp": 148.5, "cholesterol": 240.0},
        {"patient_id": 103, "treatment": 1, "age": 61, "baseline_bp": 155.0, "post_bp": 153.0, "cholesterol": 235.2},
        {"patient_id": 104, "treatment": 1, "age": 49, "baseline_bp": 140.0, "post_bp": 141.0, "cholesterol": 210.0},
        {"patient_id": 105, "treatment": 1, "age": 65, "baseline_bp": 160.0, "post_bp": 158.0, "cholesterol": 255.0},
        {"patient_id": 106, "treatment": 2, "age": 50, "baseline_bp": 148.0, "post_bp": 136.0, "cholesterol": 215.0},
        {"patient_id": 107, "treatment": 2, "age": 54, "baseline_bp": 152.0, "post_bp": 138.5, "cholesterol": 228.4},
        {"patient_id": 108, "treatment": 2, "age": 59, "baseline_bp": 158.0, "post_bp": 142.0, "cholesterol": 245.0},
        {"patient_id": 109, "treatment": 2, "age": 47, "baseline_bp": 142.0, "post_bp": 130.0, "cholesterol": 205.0},
        {"patient_id": 110, "treatment": 2, "age": 63, "baseline_bp": 162.0, "post_bp": 145.0, "cholesterol": 250.0},
        {"patient_id": 111, "treatment": 3, "age": 51, "baseline_bp": 150.0, "post_bp": 125.0, "cholesterol": 210.0},
        {"patient_id": 112, "treatment": 3, "age": 55, "baseline_bp": 155.0, "post_bp": 128.0, "cholesterol": 222.0},
        {"patient_id": 113, "treatment": 3, "age": 60, "baseline_bp": 160.0, "post_bp": 132.0, "cholesterol": 238.0},
        {"patient_id": 114, "treatment": 3, "age": 48, "baseline_bp": 144.0, "post_bp": 120.0, "cholesterol": 198.0},
        {"patient_id": 115, "treatment": 3, "age": 64, "baseline_bp": 165.0, "post_bp": 135.0, "cholesterol": 248.0}
    ]

    return {
        "name": "Clinical Trial.sav",
        "variables_meta": variables_meta,
        "rows_data": rows_data
    }
