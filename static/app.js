/* ── Constants ─────────────────────────────────────────────────────────── */
const API_BASE = 'http://localhost:5000';
let selectedDiabetesModel = 'random_forest';

/* ── Patient Presets ───────────────────────────────────────────────────── */
const PATIENTS = {
  1: {
    name: 'Nguyễn Thị An',
    'Pregnancies': 1, 'Glucose': 89, 'BloodPressure': 66,
    'SkinThickness': 23, 'Insulin': 94, 'BMI': 28.1,
    'DiabetesPedigreeFunction': 0.167, 'Age': 21,
  },
  2: {
    name: 'Trần Văn Bình',
    'Pregnancies': 3, 'Glucose': 130, 'BloodPressure': 78,
    'SkinThickness': 32, 'Insulin': 0, 'BMI': 30.5,
    'DiabetesPedigreeFunction': 0.393, 'Age': 45,
  },
  3: {
    name: 'Lê Thị Cúc',
    'Pregnancies': 8, 'Glucose': 183, 'BloodPressure': 64,
    'SkinThickness': 0, 'Insulin': 0, 'BMI': 36.6,
    'DiabetesPedigreeFunction': 0.672, 'Age': 50,
  },
};

const FIELD_MAP = {
  'Pregnancies': 'd-pregnancies', 'Glucose': 'd-glucose',
  'BloodPressure': 'd-bloodpressure', 'SkinThickness': 'd-skinthickness',
  'Insulin': 'd-insulin', 'BMI': 'd-bmi',
  'DiabetesPedigreeFunction': 'd-dpf', 'Age': 'd-age',
};

function loadPatient(id) {
  const p = PATIENTS[id];
  if (!p) return;

  // Fill form fields
  Object.entries(FIELD_MAP).forEach(([key, elId]) => {
    document.getElementById(elId).value = p[key];
  });

  // Highlight active patient card
  document.querySelectorAll('.patient-card').forEach(c => c.classList.remove('active-patient'));
  document.getElementById('patient-card-' + id).classList.add('active-patient');

  // Hide old result
  document.getElementById('diabetes-result').style.display = 'none';

  showToast('✅ Đã tải dữ liệu bệnh nhân: ' + p.name);
}



/* ── Init ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  checkServer();
  loadDiabetesModels();
});

/* ── Page Navigation ───────────────────────────────────────────────────── */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  const navBtn = document.getElementById(`nav-${page}`);
  navBtn.classList.add('active');

  // Update nav icon style for house
  if (page === 'house') {
    navBtn.classList.add('nav-house');
  }
}

/* ── Server Status ─────────────────────────────────────────────────────── */
async function checkServer() {
  const dot = document.getElementById('server-dot');
  const status = document.getElementById('server-status');
  try {
    const res = await fetch(`${API_BASE}/api/diabetes/models`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      dot.classList.add('online');
      status.textContent = 'Server đang chạy';
    } else {
      throw new Error();
    }
  } catch {
    dot.classList.remove('online');
    dot.classList.add('offline');
    status.textContent = 'Không kết nối được';
  }
}

/* ── Load Diabetes Models ──────────────────────────────────────────────── */
async function loadDiabetesModels() {
  const container = document.getElementById('diabetes-model-cards');
  try {
    const res = await fetch(`${API_BASE}/api/diabetes/models`);
    const data = await res.json();

    container.innerHTML = '';
    data.models.forEach((model, idx) => {
      const card = document.createElement('div');
      card.className = `model-card${model.id === selectedDiabetesModel ? ' selected' : ''}`;
      card.id = `model-card-${model.id}`;
      card.onclick = () => selectDiabetesModel(model.id);

      const modelIcons = {
        decision_tree: '🌳',
        knn: '📍',
        logistic_regression: '📈',
        random_forest: '🌲',
      };
      const modelDescs = {
        decision_tree: 'Cây quyết định',
        knn: 'K láng giềng gần nhất',
        logistic_regression: 'Hồi quy logistic',
        random_forest: 'Rừng ngẫu nhiên',
      };

      card.innerHTML = `
        <div class="model-card-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="model-card-name">${modelIcons[model.id] || '🤖'} ${model.name}</div>
        <div class="model-card-type">${modelDescs[model.id] || ''}</div>
        ${model.loaded ? '<div class="model-card-badge">✓ Sẵn sàng</div>' : '<div class="model-card-badge" style="background:rgba(255,79,123,0.1);color:var(--accent-red);border-color:rgba(255,79,123,0.2)">Lỗi</div>'}
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div style="color:var(--accent-red);font-size:13px;padding:12px;">Không thể tải danh sách models. Kiểm tra server.</div>`;
  }
}

function selectDiabetesModel(modelId) {
  selectedDiabetesModel = modelId;
  document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`model-card-${modelId}`).classList.add('selected');
}

/* ── Diabetes Prediction ───────────────────────────────────────────────── */
async function predictDiabetes() {
  const btn = document.getElementById('btn-diabetes-predict');
  const resultSection = document.getElementById('diabetes-result');

  const payload = {
    model: selectedDiabetesModel,
    Pregnancies: getVal('d-pregnancies'),
    Glucose: getVal('d-glucose'),
    BloodPressure: getVal('d-bloodpressure'),
    SkinThickness: getVal('d-skinthickness'),
    Insulin: getVal('d-insulin'),
    BMI: getVal('d-bmi'),
    DiabetesPedigreeFunction: getVal('d-dpf'),
    Age: getVal('d-age'),
  };

  setLoading(btn, true);
  resultSection.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/diabetes/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.error) {
      showToast('❌ ' + data.error, 'error');
      return;
    }

    displayDiabetesResult(data);
    resultSection.style.display = 'block';
    buildKnowledgeGraph(payload, data);
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    showToast('❌ Không kết nối được với server', 'error');
  } finally {
    setLoading(btn, false);
  }
}

function displayDiabetesResult(data) {
  const card = document.getElementById('diabetes-result-card');
  const icon = document.getElementById('diabetes-result-icon');
  const label = document.getElementById('diabetes-result-label');
  const modelEl = document.getElementById('diabetes-result-model');
  const probaEl = document.getElementById('diabetes-result-proba');

  const isPositive = data.prediction === 1;
  card.className = `result-card ${isPositive ? 'positive' : 'negative'}`;
  icon.textContent = isPositive ? '⚠️' : '✅';
  label.textContent = isPositive ? 'Có nguy cơ mắc bệnh tiểu đường' : 'Không có nguy cơ mắc bệnh tiểu đường';
  label.style.color = isPositive ? 'var(--accent-red)' : 'var(--accent-green)';

  const modelNames = {
    decision_tree: 'Decision Tree', knn: 'K-Nearest Neighbors',
    logistic_regression: 'Logistic Regression', random_forest: 'Random Forest',
  };
  modelEl.textContent = `Model: ${modelNames[data.model_used] || data.model_used}`;

  if (data.probability) {
    const p = data.probability;
    probaEl.innerHTML = `
      <div class="proba-bar-group">
        <div class="proba-bar-label">
          <span>Không có nguy cơ</span>
          <span>${p.negative}%</span>
        </div>
        <div class="proba-bar-track">
          <div class="proba-bar-fill green" style="width:0%" id="pb-neg"></div>
        </div>
      </div>
      <div class="proba-bar-group">
        <div class="proba-bar-label">
          <span>Có nguy cơ</span>
          <span>${p.positive}%</span>
        </div>
        <div class="proba-bar-track">
          <div class="proba-bar-fill red" style="width:0%" id="pb-pos"></div>
        </div>
      </div>
    `;
    setTimeout(() => {
      document.getElementById('pb-neg').style.width = p.negative + '%';
      document.getElementById('pb-pos').style.width = p.positive + '%';
    }, 50);
  } else {
    probaEl.innerHTML = '';
  }
}

function resetDiabetesForm() {
  const defaults = { 'd-pregnancies': 1, 'd-glucose': 120, 'd-bloodpressure': 72, 'd-skinthickness': 23, 'd-insulin': 79, 'd-bmi': 32.0, 'd-dpf': 0.372, 'd-age': 33 };
  Object.entries(defaults).forEach(([id, val]) => { document.getElementById(id).value = val; });
  document.getElementById('diabetes-result').style.display = 'none';
}

/* ── House Price Prediction ────────────────────────────────────────────── */
async function predictHouse() {
  const btn = document.getElementById('btn-house-predict');
  const resultSection = document.getElementById('house-result');

  const payload = {
    'Area': getVal('h-area'),
    'Frontage': getVal('h-frontage'),
    'Access Road': getVal('h-access'),
    'Floors': getVal('h-floors'),
    'Bedrooms': getVal('h-bedrooms'),
    'Bathrooms': getVal('h-bathrooms'),
    'House direction': document.getElementById('h-house-dir').value,
    'Balcony direction': document.getElementById('h-balcony-dir').value,
    'Legal status': document.getElementById('h-legal').value,
    'Furniture state': document.getElementById('h-furniture').value,
  };

  setLoading(btn, true);
  resultSection.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/house/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.error) {
      showToast('❌ ' + data.error, 'error');
      return;
    }

    document.getElementById('house-result-price').textContent = data.prediction_formatted;
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    showToast('❌ Không kết nối được với server', 'error');
  } finally {
    setLoading(btn, false);
  }
}

function resetHouseForm() {
  document.getElementById('h-area').value = 50;
  document.getElementById('h-frontage').value = 4;
  document.getElementById('h-access').value = 4;
  document.getElementById('h-floors').value = 3;
  document.getElementById('h-bedrooms').value = 3;
  document.getElementById('h-bathrooms').value = 2;
  document.getElementById('h-house-dir').value = 'Nam';
  document.getElementById('h-balcony-dir').value = 'Đông - Nam';
  document.getElementById('h-legal').value = 'Have certificate';
  document.getElementById('h-furniture').value = 'Full';
  if (document.getElementById('h-province')) document.getElementById('h-province').value = 'Hà Nội';
  document.getElementById('house-result').style.display = 'none';
}

/* ── Helpers ───────────────────────────────────────────────────────────── */
function getVal(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function setLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn.innerHTML = `<div class="spinner"></div> <span>Đang dự đoán...</span>`;
  } else {
    btn.classList.remove('loading');
    if (btn.id === 'btn-diabetes-predict') {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Dự đoán`;
    } else {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Dự đoán giá`;
    }
  }
}

let toastTimer;
function showToast(msg, type = 'info') {
  clearTimeout(toastTimer);
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  toastTimer = setTimeout(() => toast.remove(), 4000);
}


/* ── Knowledge Graph (Neo4j-style, rendered with vis.js) ───────────────── */
let kgNetwork = null;

function buildKnowledgeGraph(formData, diagData) {
  const section = document.getElementById('kg-section');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const isPositive = diagData.prediction === 1;
  const prob = diagData.probability;

  // ── Colour palette matching Neo4j Browser colours ────────────────────
  const C = {
    patient:    { bg: '#7c5cbf', border: '#9b7fe8', font: '#fff' },
    diagnosis:  { bg: isPositive ? '#c0392b' : '#148f77', border: isPositive ? '#e74c3c' : '#1abc9c', font: '#fff' },
    clinical:   { bg: '#154360', border: '#2471a3', font: '#aed6f1' },
    risk:       { bg: '#7d6608', border: '#b7950b', font: '#f9e79f' },
    recommend:  { bg: '#0e6655', border: '#148f77', font: '#a9dfbf' },
  };

  // Helper
  let nodeId = 0;
  const nodes = [];
  const edges = [];
  const addNode = (label, title, group, extra = {}) => {
    const id = ++nodeId;
    nodes.push({ id, label, title, group, ...extra });
    return id;
  };
  const addEdge = (from, to, label) => edges.push({ from, to, label, arrows: 'to', font: { color: '#888', size: 11, strokeWidth: 0 }, color: { color: '#444', highlight: '#9b7fe8' } });

  // ── Nodes ─────────────────────────────────────────────────────────────
  const age     = formData.Age;
  const glucose = formData.Glucose;
  const bmi     = formData.BMI;
  const bp      = formData.BloodPressure;
  const ins     = formData.Insulin;
  const preg    = formData.Pregnancies;
  const skin    = formData.SkinThickness;
  const dpf     = formData.DiabetesPedigreeFunction;

  // Patient
  const patientId = addNode(
    'Patient\n━━━━━━━━\nAge: ' + age + '\nPregnancies: ' + preg,
    'Neo4j Label: :Patient', 'patient',
    { shape: 'dot', size: 30, color: { background: C.patient.bg, border: C.patient.border }, font: { color: C.patient.font, size: 13, bold: true } }
  );

  // Diagnosis
  const diagId = addNode(
    (isPositive ? '⚠ POSITIVE\n━━━━━━━━' : '✓ NEGATIVE\n━━━━━━━━') +
    (prob ? '\nPos: ' + prob.positive + '%\nNeg: ' + prob.negative + '%' : ''),
    'Neo4j Label: :Diagnosis', 'diagnosis',
    { shape: 'dot', size: 26, color: { background: C.diagnosis.bg, border: C.diagnosis.border }, font: { color: C.diagnosis.font, size: 12, bold: true } }
  );
  addEdge(patientId, diagId, 'DIAGNOSED_WITH');

  // Model node
  const modelNames = { decision_tree: 'DecisionTree', knn: 'KNN', logistic_regression: 'LogisticReg', random_forest: 'RandomForest' };
  const modelId = addNode(
    'Model\n━━━━━\n' + (modelNames[diagData.model_used] || diagData.model_used),
    'Neo4j Label: :MLModel', 'clinical',
    { shape: 'diamond', size: 18, color: { background: '#1a3a5c', border: '#2980b9' }, font: { color: '#aed6f1', size: 11 } }
  );
  addEdge(diagId, modelId, 'PREDICTED_BY');

  // ── Clinical value nodes ───────────────────────────────────────────────
  const clinicalNodes = [
    { key: 'Glucose',    val: glucose, unit: 'mg/dL', high: glucose > 125, label: 'Glucose' },
    { key: 'BMI',        val: bmi,     unit: 'kg/m²', high: bmi > 30,      label: 'BMI' },
    { key: 'BloodPres.', val: bp,      unit: 'mmHg',  high: bp > 90,       label: 'BloodPressure' },
    { key: 'Insulin',    val: ins,     unit: 'mu/ml', high: ins > 200,     label: 'Insulin' },
    { key: 'SkinThick.', val: skin,    unit: 'mm',    high: skin > 35,     label: 'SkinThickness' },
    { key: 'DPF',        val: dpf,     unit: '',      high: dpf > 0.5,     label: 'DiabetesPedigreeFunction' },
  ];

  clinicalNodes.forEach(cn => {
    const style = cn.high
      ? { shape: 'dot', size: 18, color: { background: C.risk.bg, border: C.risk.border }, font: { color: C.risk.font, size: 11 } }
      : { shape: 'dot', size: 14, color: { background: C.clinical.bg, border: C.clinical.border }, font: { color: C.clinical.font, size: 11 } };
    const nid = addNode(cn.key + '\n' + cn.val + ' ' + cn.unit, 'Neo4j Label: :ClinicalValue', cn.high ? 'risk' : 'clinical', style);
    addEdge(patientId, nid, 'HAS_VALUE');
    if (cn.high) addEdge(nid, diagId, 'CONTRIBUTES_TO');
  });

  // ── Recommendations ───────────────────────────────────────────────────
  const recs = isPositive
    ? ['Xét nghiệm HbA1c', 'Kiểm soát đường huyết', 'Tư vấn dinh dưỡng', 'Tập thể dục đều đặn']
    : ['Duy trì cân nặng', 'Kiểm tra định kỳ', 'Chế độ ăn lành mạnh'];
  recs.forEach(r => {
    const rid = addNode('💊 ' + r, 'Neo4j Label: :Recommendation', 'recommend',
      { shape: 'box', color: { background: C.recommend.bg, border: C.recommend.border }, font: { color: C.recommend.font, size: 11 } });
    addEdge(diagId, rid, 'RECOMMENDS');
  });

  // ── Render with vis.js ─────────────────────────────────────────────────
  const container = document.getElementById('kg-canvas');
  const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  const options = {
    nodes: { borderWidth: 2, shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', x: 3, y: 3, size: 8 } },
    edges: { width: 1.5, smooth: { type: 'curvedCW', roundness: 0.15 }, font: { align: 'middle' } },
    physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -80, springLength: 120, springConstant: 0.05 }, stabilization: { iterations: 150 } },
    interaction: { hover: true, zoomView: true, dragView: true },
    layout: { improvedLayout: true },
  };
  if (kgNetwork) kgNetwork.destroy();
  kgNetwork = new vis.Network(container, data, options);
}
