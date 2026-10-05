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
    
    meta_from_sav = None
    try:
        if filename.endswith(".sav"):
            import tempfile
            import pyreadstat
            with tempfile.NamedTemporaryFile(suffix=".sav", delete=False) as tmp:
                tmp.write(contents)
                tmp_path = tmp.name
            try:
                df, meta_from_sav = pyreadstat.read_sav(tmp_path)
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        elif filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename.endswith(".tsv"):
            df = pd.read_csv(io.BytesIO(contents), sep="\t")
        elif filename.endswith(".json"):
            data_json = json.loads(contents.decode("utf-8"))
            if isinstance(data_json, dict) and "rows" in data_json:
                df = pd.DataFrame(data_json["rows"])
            else:
                df = pd.DataFrame(data_json)
        else:
            df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    variables_meta = []
    if meta_from_sav is not None:
        # Authentic SPSS metadata mapping from pyreadstat
        val_labels = getattr(meta_from_sav, "variable_value_labels", {}) or {}
        var_labels = getattr(meta_from_sav, "variable_to_label", {}) or {}
        var_measures = getattr(meta_from_sav, "variable_measure", {}) or {}

        for col in df.columns:
            clean_col = str(col).strip().replace(" ", "_")
            raw_measure = str(var_measures.get(col, "scale")).capitalize()
            measure = raw_measure if raw_measure in ["Scale", "Ordinal", "Nominal"] else "Scale"
            
            is_num = pd.api.types.is_numeric_dtype(df[col])
            col_type = "Numeric" if is_num else "String"
            
            # Format value labels into { "1": "Male", "2": "Female" }
            col_vals = val_labels.get(col, {})
            formatted_vals = {str(k): str(v) for k, v in col_vals.items()} if col_vals else {}
            
            variables_meta.append({
                "name": clean_col,
                "type": col_type,
                "width": 8,
                "decimals": 2 if col_type == "Numeric" else 0,
                "label": var_labels.get(col) or str(col),
                "values": formatted_vals,
                "missing": "None",
                "columns": 8,
                "align": "Right" if is_num else "Left",
                "measure": measure,
                "role": "Input"
            })
    else:
        # Detect 11 SPSS variable metadata columns for CSV/Excel/JSON
        for col in df.columns:
            col_type = "Numeric"
            col_measure = "Scale"
            col_align = "Right"

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

@app.post("/api/datasets/export-sav")
async def export_dataset_sav(req: Dict[str, Any]):
    try:
        import pyreadstat
        import tempfile
        
        name = req.get("name", "DataSet1").replace(".sav", "")
        variables = req.get("variables", [])
        rows = req.get("rows", [])
        
        df = pd.DataFrame(rows)
        # Select and order columns matching variables definition
        var_names = [v.get("name") for v in variables if v.get("name") in df.columns]
        if not var_names:
            var_names = list(df.columns)
            
        sub_df = df[var_names].copy()
        
        col_labels = {}
        var_val_labels = {}
        var_measures = {}
        for v in variables:
            vname = v.get("name")
            if vname in sub_df.columns:
                if v.get("label"):
                    col_labels[vname] = v["label"]
                if v.get("values") and isinstance(v["values"], dict):
                    clean_vals = {}
                    for k, val in v["values"].items():
                        try:
                            clean_vals[float(k) if '.' in k else int(k)] = str(val)
                        except Exception:
                            clean_vals[str(k)] = str(val)
                    var_val_labels[vname] = clean_vals
                if v.get("measure"):
                    var_measures[vname] = v["measure"].lower()
                    
        with tempfile.NamedTemporaryFile(suffix=".sav", delete=False) as tmp:
            tmp_path = tmp.name
            
        try:
            pyreadstat.write_sav(
                sub_df,
                tmp_path,
                column_labels=col_labels if col_labels else None,
                variable_value_labels=var_val_labels if var_val_labels else None,
                variable_measure=var_measures if var_measures else None
            )
            with open(tmp_path, "rb") as f:
                sav_bytes = f.read()
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        
        return Response(
            content=sav_bytes,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={name}.sav"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate .sav file: {str(e)}")

# -------------------------------------------------------------
# 4. STATISTICAL ANALYSIS ROUTES
# Helper for Split File processing across backend endpoints
def apply_split_file(req: Any, compute_callback: Any) -> Any:
    split_by = getattr(req, "split_by", None)
    data = getattr(req, "data", [])
    if split_by and len(data) > 0 and split_by in data[0]:
        df = pd.DataFrame(data)
        split_vals = df[split_by].dropna().unique()
        try:
            split_vals = sorted(split_vals)
        except Exception:
            pass
        if len(split_vals) > 1:
            split_results = []
            for val in split_vals:
                sub_data = df[df[split_by] == val].to_dict(orient="records")
                res = compute_callback(sub_data)
                if isinstance(res, dict):
                    res["title"] = f"{res.get('title', 'Analysis')} ({split_by} = {val})"
                    if "data" in res and isinstance(res["data"], dict):
                        res["data"]["split_variable"] = split_by
                        res["data"]["split_value"] = str(val)
                split_results.append(res)
            return split_results
    return compute_callback(data)

@app.post("/api/analyze/descriptives")
def run_descriptives(req: DescriptivesRequest):
    try:
        return apply_split_file(req, lambda d: compute_descriptives(d, req.variables, req.statistics))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/frequencies")
def run_frequencies(req: FrequenciesRequest):
    try:
        return apply_split_file(req, lambda d: compute_frequencies(d, req.variables, req.value_labels))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/crosstabs")
def run_crosstabs(req: CrosstabsRequest):
    try:
        return apply_split_file(req, lambda d: compute_crosstabs(d, req.row_var, req.col_var, req.display_expected, req.display_row_pct, req.display_col_pct))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/correlations")
def run_correlations(req: CorrelationRequest):
    try:
        return apply_split_file(req, lambda d: compute_correlations(d, req.variables, req.method))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/t-test/one-sample")
def run_one_sample_t_test(req: OneSampleTTestRequest):
    try:
        return apply_split_file(req, lambda d: compute_one_sample_t_test(d, req.variables, req.test_value))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/t-test/independent")
def run_independent_t_test(req: IndependentTTestRequest):
    try:
        return apply_split_file(req, lambda d: compute_independent_t_test(d, req.test_variables, req.group_variable, req.group1_val, req.group2_val))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/t-test/paired")
def run_paired_t_test(req: PairedTTestRequest):
    try:
        return apply_split_file(req, lambda d: compute_paired_t_test(d, req.pairs))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/anova")
def run_anova(req: AnovaRequest):
    try:
        return apply_split_file(req, lambda d: compute_one_way_anova(d, req.dependent_variable, req.factor_variable, req.run_post_hoc))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/regression")
def run_regression(req: RegressionRequest):
    try:
        return apply_split_file(req, lambda d: compute_linear_regression(d, req.dependent_variable, req.independent_variables))
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
