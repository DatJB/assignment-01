 # Ứng dụng web chẩn đoán bệnh tiểu đường & dự đoán giá nhà đất sử dụng Machine Learning

## Giới thiệu

Đây là asignment 01 môn **Phát triển các hệ thống thông minh** — một ứng dụng web tích hợp hai chức năng chính:

**Chẩn đoán bệnh tiểu đường**: Dự đoán nguy cơ mắc bệnh dựa trên 8 chỉ số lâm sàng, hỗ trợ 4 mô hình ML khác nhau 
**Dự đoán giá nhà đất**: Ước tính giá bất động sản dựa trên 10 đặc trưng, sử dụng mô hình Gradient Boosting 

Sau mỗi lần chẩn đoán, ứng dụng tự động vẽ **Knowledge Graph** để trực quan hóa mối quan hệ giữa bệnh nhân, chỉ số lâm sàng và kết quả chẩn đoán.

---

## Cấu trúc dự án

```
assignment-01/
│
├── app.py                          # Backend Flask (API server)
│
├── models/
│   ├── diabetes/
│   │   ├── decision_tree.pkl       # Cây quyết định
│   │   ├── knn.pkl                 # K-Nearest Neighbors
│   │   ├── logistic_regression.pkl # Hồi quy logistic
│   │   └── random_forest.pkl       # Rừng ngẫu nhiên
│   │
│   └── house-price/
│       └── final_gradient_boosting_model.pkl  # Gradient Boosting (Pipeline)
│
└── static/
    ├── index.html                  # Giao diện web chính
    ├── style.css                   # Giao diện dark glassmorphism
    ├── app.js                      # Logic frontend + Knowledge Graph
    ├── vis-network.min.js          # Thư viện vẽ đồ thị (vis.js)
    └── vis-network.min.css         # CSS cho vis.js
```

---

## Knowledge Graph (Neo4j)

Sau mỗi lần chẩn đoán tiểu đường, ứng dụng tự động vẽ đồ thị tri thức với các loại node:

| Màu | Node | Ý nghĩa |
|-----|------|---------|
| 🟣 Tím | `Patient` | Thông tin bệnh nhân |
| 🔴 Đỏ / 🟢 Xanh | `Diagnosis` | Kết quả chẩn đoán |
| 🔵 Xanh dương | `ClinicalValue` | Chỉ số lâm sàng bình thường |
| 🟡 Vàng | `RiskFactor` | Chỉ số bất thường (nguy cơ cao) |
| 🟢 Xanh lá | `Recommendation` | Khuyến nghị y tế |
| 🔷 Xanh tối | `MLModel` | Mô hình đã dùng |

**Các mối quan hệ (Relationships):**

```
(Patient)-[:DIAGNOSED_WITH]->(Diagnosis)
(Patient)-[:HAS_VALUE]->(ClinicalValue)
(Patient)-[:HAS_VALUE]->(RiskFactor)
(RiskFactor)-[:CONTRIBUTES_TO]->(Diagnosis)
(Diagnosis)-[:PREDICTED_BY]->(MLModel)
(Diagnosis)-[:RECOMMENDS]->(Recommendation)
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/` | Giao diện web chính |
| `GET` | `/api/diabetes/models` | Danh sách model tiểu đường |
| `POST` | `/api/diabetes/predict` | Chẩn đoán tiểu đường |
| `GET` | `/api/house/info` | Thông tin model giá nhà |
| `POST` | `/api/house/predict` | Dự đoán giá nhà |

## Công nghệ sử dụng

| Layer | Công nghệ |
|-------|-----------|
| **Backend** | Python · Flask · Flask-CORS |
| **ML** | scikit-learn · joblib · NumPy · Pandas |
| **Frontend** | HTML5 · Vanilla CSS · Vanilla JavaScript |
| **Graph** | vis.js Network (mô phỏng Neo4j Browser) |
| **Design** | Dark Glassmorphism · CSS Variables · CSS Animations |

---

## Dữ liệu huấn luyện

- **Diabetes**: Tập dữ liệu Pima Indians Diabetes
- **House Price**: Tập dữ liệu bất động sản Việt Nam

