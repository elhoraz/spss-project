from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Variable Meta Schema matching SPSS Variable View
class VariableMeta(BaseModel):
    name: str
    type: str = "Numeric"      # Numeric, String, Date, Dollar
    width: int = 8
    decimals: int = 2
    label: str = ""
    values: Dict[str, str] = Field(default_factory=dict) # e.g. {"1": "Male", "2": "Female"}
    missing: str = "None"
    columns: int = 8
    align: str = "Right"       # Right, Left, Center
    measure: str = "Scale"     # Scale, Ordinal, Nominal
    role: str = "Input"        # Input, Target, Both, None, Partition, Split

# Dataset Schemas
class DatasetCreate(BaseModel):
    name: str = "DataSet1"
    variables_meta: List[VariableMeta]
    rows_data: List[Dict[str, Any]]
    project_id: Optional[int] = None

class DatasetResponse(BaseModel):
    id: int
    name: str
    variables_meta: List[Dict[str, Any]]
    rows_data: List[Dict[str, Any]]
    project_id: Optional[int]

    class Config:
        from_attributes = True

# Project Schemas
class ProjectCreate(BaseModel):
    title: str = "Untitled Dataset.sav"
    description: Optional[str] = ""

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True

# Statistical Analysis Requests
class DescriptivesRequest(BaseModel):
    variables: List[str]
    data: List[Dict[str, Any]]
    statistics: Optional[List[str]] = None
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class FrequenciesRequest(BaseModel):
    variables: List[str]
    data: List[Dict[str, Any]]
    value_labels: Optional[Dict[str, Dict[str, str]]] = None
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class CrosstabsRequest(BaseModel):
    row_var: str
    col_var: str
    data: List[Dict[str, Any]]
    display_expected: bool = True
    display_row_pct: bool = True
    display_col_pct: bool = True
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class CorrelationRequest(BaseModel):
    variables: List[str]
    data: List[Dict[str, Any]]
    method: str = "pearson" # pearson, spearman, kendall
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class OneSampleTTestRequest(BaseModel):
    variables: List[str]
    data: List[Dict[str, Any]]
    test_value: float = 0.0
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class IndependentTTestRequest(BaseModel):
    test_variables: List[str]
    group_variable: str
    data: List[Dict[str, Any]]
    group1_val: Optional[Any] = None
    group2_val: Optional[Any] = None
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class PairedTTestRequest(BaseModel):
    pairs: List[List[str]] # e.g. [["salary", "salbegin"]]
    data: List[Dict[str, Any]]
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class AnovaRequest(BaseModel):
    dependent_variable: str
    factor_variable: str
    data: List[Dict[str, Any]]
    run_post_hoc: bool = True
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class RegressionRequest(BaseModel):
    dependent_variable: str
    independent_variables: List[str]
    data: List[Dict[str, Any]]
    split_by: Optional[str] = None
    weight_by: Optional[str] = None

class SyntaxRunRequest(BaseModel):
    syntax: str
    data: List[Dict[str, Any]]

class SaveOutputRequest(BaseModel):
    title: str
    items: List[Dict[str, Any]]
    project_id: Optional[int] = None
