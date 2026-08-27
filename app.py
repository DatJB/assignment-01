from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import warnings

warnings.filterwarnings("ignore")

app = Flask(__name__, static_folder="static")
CORS(app)

# ── Diabetes Models ─────────────────────────────────────────────────────────
DIABETES_MODELS = {}
_diabetes_files = {
    "decision_tree": "models/diabetes/decision_tree.pkl",
    "knn": "models/diabetes/knn.pkl",
    "logistic_regression": "models/diabetes/logistic_regression.pkl",
    "random_forest": "models/diabetes/random_forest.pkl",
}
for _name, _path in _diabetes_files.items():
    try:
        DIABETES_MODELS[_name] = joblib.load(_path)
        print(f"[OK] {_name}")
    except Exception as e:
        print(f"[FAIL] {_name}: {e}")

# ── House Price Model ───────────────────────────────────────────────────────
HOUSE_MODEL = None
try:
    HOUSE_MODEL = joblib.load("models/house-price/final_gradient_boosting_model.pkl")
    print("[OK] house_price gradient_boosting")
except Exception as e:
    print(f"[FAIL] house_price: {e}")

DIABETES_FEATURES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]
HOUSE_NUM_FEATURES = ["Area", "Frontage", "Access Road", "Floors", "Bedrooms", "Bathrooms"]
HOUSE_CAT_FEATURES = ["House direction", "Balcony direction", "Legal status", "Furniture state"]
HOUSE_CAT_OPTIONS = {
    "House direction": ["Bắc", "Nam", "Tây", "Tây - Bắc", "Tây - Nam", "Đông", "Đông - Bắc", "Đông - Nam"],
    "Balcony direction": ["Bắc", "Nam", "Tây", "Tây - Bắc", "Tây - Nam", "Đông", "Đông - Bắc", "Đông - Nam"],
    "Legal status": ["Have certificate", "Sale contract"],
    "Furniture state": ["Basic", "Full"],
}

DIABETES_MODEL_NAMES = {
    "decision_tree": "Decision Tree",
    "knn": "K-Nearest Neighbors",
    "logistic_regression": "Logistic Regression",
    "random_forest": "Random Forest",
}

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

@app.route("/api/diabetes/models")
def api_diabetes_models():
    return jsonify({
        "models": [
            {"id": k, "name": v, "loaded": k in DIABETES_MODELS}
            for k, v in DIABETES_MODEL_NAMES.items()
        ]
    })

@app.route("/api/diabetes/predict", methods=["POST"])
def api_diabetes_predict():
    data = request.get_json()
    model_name = data.get("model", "random_forest")
    if model_name not in DIABETES_MODELS:
        return jsonify({"error": "Model not available"}), 400
    try:
        features = [float(data.get(f, 0)) for f in DIABETES_FEATURES]
        X = np.array([features])
        model = DIABETES_MODELS[model_name]
        prediction = int(model.predict(X)[0])
        proba = None
        if hasattr(model, "predict_proba"):
            pa = model.predict_proba(X)[0]
            proba = {"negative": round(float(pa[0]) * 100, 1), "positive": round(float(pa[1]) * 100, 1)}
        return jsonify({
            "prediction": prediction,
            "label": "Có nguy cơ mắc bệnh tiểu đường" if prediction == 1 else "Không có nguy cơ",
            "probability": proba,
            "model_used": model_name,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/house/info")
def api_house_info():
    return jsonify({
        "numeric_features": HOUSE_NUM_FEATURES,
        "categorical_features": HOUSE_CAT_FEATURES,
        "categorical_options": HOUSE_CAT_OPTIONS,
        "model_loaded": HOUSE_MODEL is not None,
    })

@app.route("/api/house/predict", methods=["POST"])
def api_house_predict():
    if HOUSE_MODEL is None:
        return jsonify({"error": "Model not loaded"}), 500
    data = request.get_json()
    try:
        row = {}
        for f in HOUSE_NUM_FEATURES:
            row[f] = float(data.get(f, 0))
        for f in HOUSE_CAT_FEATURES:
            row[f] = str(data.get(f, ""))
        df = pd.DataFrame([row])
        pred = float(HOUSE_MODEL.predict(df)[0])
        return jsonify({
            "prediction": pred,
            "prediction_formatted": f"{pred:,.3f}",
            "unit": "Tỷ đồng",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)
