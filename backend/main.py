import os
import io
import json
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import User, Project, Dataset, AnalysisResult, SavedOutput
from .schemas import (
    VariableMeta, DatasetCreate, DatasetResponse, ProjectCreate, ProjectResponse,
    DescriptivesRequest, FrequenciesRequest, CrosstabsRequest, CorrelationRequest,
    OneSampleTTestRequest, IndependentTTestRequest, PairedTTestRequest,
    AnovaRequest, RegressionRequest, SyntaxRunRequest, SaveOutputRequest
)
from .stats_engine.descriptives import compute_descriptives
from .stats_engine.frequencies import compute_frequencies
from .stats_engine.crosstabs import compute_crosstabs
from .stats_engine.correlations import compute_correlations
from .stats_engine.t_tests import compute_one_sample_t_test, compute_independent_t_test, compute_paired_t_test
from .stats_engine.anova import compute_one_way_anova
from .stats_engine.regression import compute_linear_regression
from .stats_engine.reliability import compute_cronbach_alpha
from .stats_engine.non_parametrics import compute_mann_whitney_u, compute_wilcoxon_signed_rank, compute_kruskal_wallis
from .stats_engine.explore import compute_explore
from .stats_engine.factor_analysis import compute_factor_analysis
from .stats_engine.logistic_regression import compute_binary_logistic_regression
from .stats_engine.syntax_parser import parse_and_execute_syntax
from .sample_data import get_employee_sample_data, get_medical_sample_data
from .security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user_token
from .storage import storage_service

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StatisticaPro Enterprise Statistics API",
    description="Enterprise-grade Statistical Analysis Web Engine replicating IBM SPSS Statistics Desktop",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Status
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app": "StatisticaPro Enterprise",
        "version": "2.0.0",
        "engine": "Python 3.11+ SciPy, Statsmodels, Pandas, Scikit-Learn"
    }

# -------------------------------------------------------------
# 1. AUTHENTICATION & SESSIONS
# -------------------------------------------------------------
@app.post("/api/v1/auth/register")
def register_user(req: Dict[str, Any], db: Session = Depends(get_db)):
    email = req.get("email")
    username = req.get("username")
    password = req.get("password")
    
    if not email or not username or not password:
        raise HTTPException(status_code=400, detail="Email, username, and password required.")

    existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or username already exists.")

    hashed_pw = hash_password(password)
    user = User(username=username, email=email, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.email, "username": user.username, "user_id": user.id})
    return {"message": "User registered successfully", "access_token": access_token}

@app.post("/api/v1/auth/login")
def login_user(req: Dict[str, Any], response: Response, db: Session = Depends(get_db)):
    username_or_email = req.get("username_or_email", "")
    password = req.get("password", "")

    user = db.query(User).filter((User.email == username_or_email) | (User.username == username_or_email)).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")

    token_payload = {"sub": user.email, "username": user.username, "user_id": user.id}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    # Set secure HttpOnly cookie for refresh token
    response.set_cookie(
        key="spss_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "email": user.email}
    }

@app.get("/api/v1/auth/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user_token)):
    return user

# -------------------------------------------------------------
# 2. SAMPLE DATASETS
# -------------------------------------------------------------
@app.get("/api/samples/employee")
def sample_employee():
    return get_employee_sample_data()

@app.get("/api/samples/medical")
def sample_medical():
    return get_medical_sample_data()

# -------------------------------------------------------------
# 3. IMPORT DATA WIZARD
# -------------------------------------------------------------
@app.post("/api/datasets/import")
async def import_dataset_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    contents = await file.read()
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename.endswith(".tsv"):
            df = pd.read_csv(io.BytesIO(contents), sep="\t")
        elif filename.endswith(".json"):
            data_json = json.loads(contents.decode("utf-8"))
            df = pd.DataFrame(data_json)
        else:
            df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Detect 11 SPSS variable metadata columns
    variables_meta = []
    for col in df.columns:
        col_type = "Numeric"
        col_measure = "Scale"
        col_align = "Right"

        # Check numeric
        numeric_count = pd.to_numeric(df[col], errors='coerce').notna().sum()
        is_num = numeric_count > (len(df) * 0.5)

        if not is_num:
            col_type = "String"
            col_measure = "Nominal"
            col_align = "Left"
        else:
            unique_count = df[col].nunique()
            if unique_count <= 5:
                col_measure = "Nominal"

        clean_col = str(col).strip().replace(" ", "_")
        variables_meta.append({
            "name": clean_col,
            "type": col_type,
            "width": 8,
            "decimals": 2 if col_type == "Numeric" else 0,
            "label": str(col),
            "values": {},
            "missing": "None",
            "columns": 8,
            "align": col_align,
            "measure": col_measure,
            "role": "Input"
        })

    # Save to storage blob
    blob_uri = storage_service.upload_dataset_blob(file.filename, contents)
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    return {
        "name": file.filename,
        "variables_meta": variables_meta,
        "rows_data": records,
        "row_count": len(records),
        "column_count": len(variables_meta),
        "blob_uri": blob_uri
    }

# -------------------------------------------------------------
# 4. STATISTICAL ANALYSIS ROUTES
# -------------------------------------------------------------
@app.post("/api/analyze/descriptives")
def run_descriptives(req: DescriptivesRequest):
    try:
        return compute_descriptives(req.data, req.variables, req.statistics)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/frequencies")
def run_frequencies(req: FrequenciesRequest):
    try:
        return compute_frequencies(req.data, req.variables, req.value_labels)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/crosstabs")
def run_crosstabs(req: CrosstabsRequest):
    try:
        return compute_crosstabs(req.data, req.row_var, req.col_var, req.display_expected, req.display_row_pct, req.display_col_pct)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/correlations")
def run_correlations(req: CorrelationRequest):
    try:
        return compute_correlations(req.data, req.variables, req.method)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/t-test/one-sample")
def run_one_sample_t_test(req: OneSampleTTestRequest):
    try:
        return compute_one_sample_t_test(req.data, req.variables, req.test_value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/t-test/independent")
def run_independent_t_test(req: IndependentTTestRequest):
    try:
        return compute_independent_t_test(req.data, req.test_variables, req.group_variable, req.group1_val, req.group2_val)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/t-test/paired")
def run_paired_t_test(req: PairedTTestRequest):
    try:
        return compute_paired_t_test(req.data, req.pairs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/anova")
def run_anova(req: AnovaRequest):
    try:
        return compute_one_way_anova(req.data, req.dependent_variable, req.factor_variable, req.run_post_hoc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/regression")
def run_regression(req: RegressionRequest):
    try:
        return compute_linear_regression(req.data, req.dependent_variable, req.independent_variables)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/reliability")
def run_reliability(req: Dict[str, Any]):
    try:
        data = req.get("data", [])
        items = req.get("items", [])
        return compute_cronbach_alpha(data, items)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/nonparametric")
def run_nonparametric(req: Dict[str, Any]):
    try:
        test_type = req.get("test_type", "mann_whitney")
        data = req.get("data", [])
        if test_type == "mann_whitney":
            return compute_mann_whitney_u(data, req["test_variable"], req["group_variable"])
        elif test_type == "wilcoxon":
            return compute_wilcoxon_signed_rank(data, req["var1"], req["var2"])
        elif test_type == "kruskal_wallis":
            return compute_kruskal_wallis(data, req["test_variable"], req["group_variable"])
        else:
            raise HTTPException(status_code=400, detail="Unsupported non-parametric test.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/explore")
def run_explore(req: Dict[str, Any]):
    try:
        data = req.get("data", [])
        variables = req.get("variables", [])
        return compute_explore(data, variables)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/factor")
def run_factor(req: Dict[str, Any]):
    try:
        data = req.get("data", [])
        variables = req.get("variables", [])
        n_factors = req.get("n_factors", None)
        return compute_factor_analysis(data, variables, n_factors)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/logistic-regression")
def run_logistic_regression(req: Dict[str, Any]):
    try:
        data = req.get("data", [])
        dep_var = req.get("dependent_variable")
        covariates = req.get("covariates", [])
        return compute_binary_logistic_regression(data, dep_var, covariates)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/syntax")
def run_syntax(req: SyntaxRunRequest):
    try:
        return parse_and_execute_syntax(req.syntax, req.data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------
# 5. DATA MANAGEMENT & TRANSFORMATIONS
# -------------------------------------------------------------
@app.post("/api/datasets/sort")
def sort_dataset(req: Dict[str, Any]):
    data = req.get("data", [])
    sort_vars = req.get("sort_variables", [])
    ascending = req.get("ascending", True)
    if not data or not sort_vars:
        return data

    df = pd.DataFrame(data)
    valid_vars = [v for v in sort_vars if v in df.columns]
    if valid_vars:
        df = df.sort_values(by=valid_vars, ascending=ascending)
    return df.to_dict(orient="records")

@app.post("/api/datasets/select-cases")
def select_cases(req: Dict[str, Any]):
    data = req.get("data", [])
    condition = req.get("condition", "")
    if not data or not condition:
        return data

    try:
        df = pd.DataFrame(data)
        filtered = df.query(condition)
        return filtered.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid query condition: {str(e)}")

# -------------------------------------------------------------
# 6. PROJECTS & OUTPUT PERSISTENCE
# -------------------------------------------------------------
@app.post("/api/projects", response_model=ProjectResponse)
def create_project(req: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(title=req.title, description=req.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@app.get("/api/projects", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.updated_at.desc()).all()

@app.post("/api/outputs")
def save_output(req: SaveOutputRequest, db: Session = Depends(get_db)):
    output = SavedOutput(
        title=req.title,
        items=req.items,
        project_id=req.project_id
    )
    db.add(output)
    db.commit()
    db.refresh(output)
    return {"id": output.id, "title": output.title, "message": "Output document saved successfully"}

@app.get("/api/outputs")
def list_outputs(db: Session = Depends(get_db)):
    return db.query(SavedOutput).order_by(SavedOutput.created_at.desc()).all()
