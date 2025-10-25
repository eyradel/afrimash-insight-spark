# 🌾 Afrimash Insight Spark

**Public Repository:** [https://github.com/eyradel/afrimash-insight-spark](https://github.com/eyradel/afrimash-insight-spark)  
**Live Deployment:** [https://afrimash-insight-spark.vercel.app](https://afrimash-insight-spark.vercel.app)

---

## 🧩 Overview

**Afrimash Insight Spark** is a data-driven analytics and recommendation platform designed to generate actionable marketing insights for **Afrimash**, an agricultural e-commerce platform serving farmers across Ghana.

The system integrates **machine learning**, **semantic search**, and **interactive data visualization** to provide:

- RFM-based customer segmentation  
- AI-powered churn prediction  
- Purchase behavior forecasting  
- Personalized product recommendations  

The architecture emphasizes **modularity, scalability, and maintainability**, spanning data engineering, ML model management, API orchestration, and frontend visualization.

---

## 🧱 System Architecture

The platform follows a modular ML-Ops pipeline (see `System Architechture.png`):

1. **Data Collection** → ETL and ingestion from transactional, API, and cloud sources  
2. **Data Understanding** → EDA, feature profiling, and correlation analysis  
3. **Feature Engineering** → Transformations for RFM, product affinity, and seasonality  
4. **Model Training & Testing** → Predictive modeling and validation  
5. **Model Evaluation** → Metrics computation and model comparison  
6. **Model Export** → Serialization (`joblib` / `pickle`)  
7. **API Wrapping** → Exposed via REST (FastAPI/Flask)  
8. **Semantic Layer** → Embedding-based semantic search  
9. **Recommendation System** → Vector search + hybrid filtering  
10. **Frontend** → Insights dashboard (Next.js + TypeScript)  

---

## 🧮 Data Flow Summary

| **Stage** | **Input** | **Process** | **Output** |
|------------|------------|-------------|-------------|
| Data Collection | Raw business data | ETL, data cleaning | Structured dataset |
| Data Understanding | Processed data | EDA, visualization | Feature insights |
| Feature Engineering | Clean data | Transformation, scaling | Model-ready dataset |
| Model Training | Feature dataset | ML algorithm tuning | Trained model |
| Model Evaluation | Model + test data | Metric computation | Best model |
| Model Export | Serialized model | API wrapping | REST endpoint |
| Frontend Integration | APIs | HTTPS calls | Visual dashboards |
| Recommendation Engine | Vector embeddings | Semantic search | Personalized results |

---

## ⚙️ Technology Stack

| **Layer** | **Technology** | **Purpose** |
|------------|----------------|--------------|
| **Frontend** | Next.js (React + TypeScript) | Data visualization dashboards |
| **Backend API** | FastAPI / Flask | Model inference and analytics APIs |
| **Data Processing** | Python (Pandas, NumPy, Spark) | ETL and feature engineering |
| **ML Frameworks** | scikit-learn, TensorFlow, XGBoost | Predictive modeling |
| **Database** | PostgreSQL / BigQuery | Structured data storage |
| **Cloud** | Google Cloud Platform (GCP) | Hosting and scalability |
| **Monitoring** | Sentry, Vercel Analytics | Observability and logging |
| **Security** | JWT, HTTPS, CORS policies | Authentication and protection |

---

## 🧠 Module Descriptions

### 1. Data Collection
Collects transactional, marketing, and behavioral data from Afrimash systems and APIs.  
Supports both **batch** and **real-time** ingestion pipelines.

### 2. Data Understanding
Performs **Exploratory Data Analysis (EDA)**, missing value analysis, and statistical summaries using Python libraries.

### 3. Feature Engineering
Derives key metrics:
- **RFM (Recency, Frequency, Monetary)** scores  
- Product affinity  
- Purchase frequency trends  
- Customer segmentation features  

### 4. Model Training and Testing
Implements supervised ML models:
- **Churn Prediction:** Logistic Regression / XGBoost  
- **Segmentation:** K-Means / Hierarchical Clustering  
- **Recommendation Ranking:** Hybrid collaborative + content filtering  

Includes **cross-validation** and **hyperparameter optimization**.

### 5. Model Evaluation
Evaluates performance using:
- Accuracy, Precision, Recall, F1-score  
- ROC-AUC and Confusion Matrix  
- RMSE/MAE for regression tasks  

### 6. Model Export & Deployment
Exports best-performing models via `joblib` or `pickle` and wraps them in RESTful APIs using **FastAPI**.  
Deployed to **Google Cloud Run** or **Firebase Functions**.

### 7. API Integration
All APIs communicate securely over HTTPS.  
Example endpoints:
```bash
/api/metrics
/api/recommendations
/api/churn
