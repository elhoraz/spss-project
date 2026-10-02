# PHASE 8: Backend Clean Architecture
**Project**: StatisticaPro Enterprise  
**Framework**: Python FastAPI 0.115+  
**Architecture Pattern**: Clean Hexagonal Architecture (Domain, Application, Infrastructure, API Layer)  
**Status**: APPROVED  

---

## 1. Lapisan Arsitektur Bersih (Clean Architecture Layers)

Backend dirancang terisolasi tanpa kopling langsung antar dependensi teknis:

```
backend/
├── api/                     # 1. API LAYER (Framework & Transport)
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── project_routes.py
│   │   ├── dataset_routes.py
│   │   ├── analysis_routes.py
│   │   ├── script_routes.py
│   │   └── output_routes.py
│   ├── middlewares/
│   │   ├── auth_middleware.py
│   │   ├── audit_middleware.py
│   │   └── rate_limiter.py
│   └── dependencies.py      # Dependency Injection Providers
│
├── application/             # 2. APPLICATION LAYER (Use Cases & Orchestrators)
│   ├── use_cases/
│   │   ├── run_descriptives_use_case.py
│   │   ├── run_anova_use_case.py
│   │   ├── run_regression_use_case.py
│   │   ├── run_reliability_use_case.py
│   │   └── import_dataset_use_case.py
│   └── interfaces/
│       ├── i_dataset_repository.py
│       ├── i_storage_service.py
│       └── i_token_service.py
│
├── domain/                  # 3. DOMAIN LAYER (Pure Business Logic & Entities)
│   ├── entities/
│   │   ├── dataset.py
│   │   ├── column_meta.py
│   │   └── analysis_spec.py
│   ├── exceptions/
│   │   └── statistical_exceptions.py
│   └── rules/
│       └── variable_validation_rules.py
│
├── infrastructure/          # 4. INFRASTRUCTURE LAYER (External Drivers)
│   ├── database/
│   │   ├── database.py      # SQLAlchemy Session Factory & Pool
│   │   ├── models/          # ORM Models (Users, Projects, Datasets, Rows, Audit)
│   │   └── repositories/    # Concrete Repository Implementations
│   ├── storage/
│   │   └── minio_storage_service.py # MinIO / S3 Client
│   ├── security/
│   │   ├── jwt_token_service.py
│   │   └── password_hasher.py
│   └── stats_engine/        # Mesin Komputasi Numerik Murni
│       ├── descriptives.py
│       ├── frequencies.py
│       ├── crosstabs.py
│       ├── correlations.py
│       ├── t_tests.py
│       ├── anova.py
│       ├── regression.py
│       ├── reliability.py   # Cronbach's Alpha
│       ├── non_parametrics.py # Mann-Whitney, Wilcoxon, Kruskal-Wallis
│       └── syntax_parser.py
```

---

## 2. Pola Dependency Injection (DI)

FastAPI memanfaatkan `Depends` untuk menyuntikkan dependensi:

```python
# Contoh Kontrak Dependency Injection
from fastapi import Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.infrastructure.security.jwt_token_service import get_current_user
from backend.models import User

@router.post("/analysis/anova")
def execute_anova(
    request: AnovaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Use-case terisolasi dengan injeksi database dan konteks user
    return anova_use_case.execute(db, current_user.id, request)
```

---

## 3. Pipeline Komputasi Mesin Statistik

1. **Ekstraksi Data**: Mengambil kolom yang ditentukan pengguna dari data array atau database, mengonversinya menjadi `pandas.DataFrame` bertipe numerik terindeks.
2. **Penanganan Missing Values**: Nilai NaN, whitespace kosong, atau kode *missing* yang ditentukan disaring secara otomatis (analisis pairwise atau listwise).
3. **Komputasi Numerik**: Menggunakan pustaka teroptimasi C/Fortran:
   - `numpy` untuk aljabar matriks dan perkalian inner-product.
   - `scipy.stats` untuk distribusi $t$, $F$, $\chi^2$, Mann-Whitney U, Wilcoxon, Kruskal-Wallis.
   - `statsmodels` untuk regresi OLS dan ANOVA faktorial.
4. **Penyusunan Format Standar SPSS**: Hasil disusun ke dalam struktur kamus JSON yang memetakan baris dan kolom tabel pivot APA secara identik.
