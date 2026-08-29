// ═══════════════════════════════════════════════════════════════════════════
// MEDIÇÃO COM RÉGUA (Calibração Manual) — Ótica Express
// Baseado no modelo clínico óptico do medicao.md
// Orientação direta (sem efeito de selfie invertida), alta performance e carregamento paralelo.
// ═══════════════════════════════════════════════════════════════════════════

import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTES E ÍNDICES DE LANDMARKS
// ─────────────────────────────────────────────────────────────────────────
const LM_PUPIL_L     = 468;
const LM_PUPIL_R     = 473;
const LM_ZYGO_L      = 234;
const LM_ZYGO_R      = 454;
const LM_NOSE_DORSUM = 168;

const LM_EAR_L_OUTER = 33;  const LM_EAR_L_INNER = 133;
const LM_EAR_L_TOP1  = 159; const LM_EAR_L_TOP2  = 158;
const LM_EAR_L_BOT1  = 145; const LM_EAR_L_BOT2  = 144;

const LM_EAR_R_OUTER = 263; const LM_EAR_R_INNER = 362;
const LM_EAR_R_TOP1  = 386; const LM_EAR_R_TOP2  = 385;
const LM_EAR_R_BOT1  = 374; const LM_EAR_R_BOT2  = 373;

const CALIBRATION_MM = 100; // 10 cm = 100 mm

// ─────────────────────────────────────────────────────────────────────────
// ELEMENTOS DOM
// ─────────────────────────────────────────────────────────────────────────
const videoEl      = document.getElementById("webcam");
const canvasEl     = document.getElementById("overlay_canvas");
const ctx          = canvasEl.getContext("2d");

const elHintBox    = document.getElementById("hint_box");
const elHintIcon   = document.getElementById("hint_icon");
const elHintText   = document.getElementById("hint_text");
const elHintSub    = document.getElementById("hint_sub");
const elViewport   = document.getElementById("camViewport");

const elGuideL     = document.getElementById("guide_left");
const elGuideR     = document.getElementById("guide_right");
const elSliderL    = document.getElementById("slider_left");
const elSliderR    = document.getElementById("slider_right");
const elCalibBtn   = document.getElementById("calib_btn");
const elCalibInfo  = document.getElementById("calib_info");

const elFinalizeBtn = document.getElementById("finalize_btn");
const elRecalibBtn  = document.getElementById("recalib_btn");
const elDPLiveBadge = document.getElementById("dpLiveBadge");
const elDPLiveVal   = document.getElementById("dpLiveVal");
const elTipBox      = document.getElementById("tipBox");

// Modal
const elModalOverlay = document.getElementById("modalOverlay");
const elModalDPBino  = document.getElementById("modal_dp_bino");
const elModalDPEsq   = document.getElementById("modal_dp_esq");
const elModalDPDir   = document.getElementById("modal_dp_dir");
const elModalConfirm = document.getElementById("modalConfirm");
const elModalCancel  = document.getElementById("modalCancel");

// ─────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────
let faceLandmarker  = null;
let mediaStream     = null;
let animId          = null;
let lastVt          = -1;
let ppmCalibrated   = null;
let isCalibrated    = false;
let samples         = [];
const SAMPLE_MAX    = 60;
const SAMPLE_WINDOW = 20;

// ─────────────────────────────────────────────────────────────────────────
// SISTEMA DE DICAS VISUAIS (Responsivo)
// ─────────────────────────────────────────────────────────────────────────
const HINTS = {
  loading_camera: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    text: "Acessando câmera...",
    sub: "Permita o acesso à câmera se solicitado",
    level: "primary"
  },
  loading_model: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    text: "Carregando modelo biométrico...",
    sub: "Preparando visão computacional",
    level: "primary"
  },
  no_face: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="18" y1="2" x2="22" y2="6"/><line x1="22" y1="2" x2="18" y2="6"/></svg>`,
    text: "Nenhum rosto detectado",
    sub: "Posicione seu rosto de frente para a câmera",
    level: "danger"
  },
  calibrate: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="6" width="22" height="12" rx="2"/><line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="12"/><line x1="13" y1="6" x2="13" y2="10"/><line x1="17" y1="6" x2="17" y2="12"/></svg>`,
    text: "Ajuste os sliders sobre a régua",
    sub: "Alinhe as guias verde (0 cm) e vermelha (10 cm)",
    level: "warning"
  },
  calibrated: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Calibrado! Medição em tempo real",
    sub: "Retire a régua e mantenha o rosto centralizado",
    level: "success"
  },
  done: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Medição concluída!",
    sub: "Confira os resultados",
    level: "success"
  },
};

let currentHintKey = "";

function updateHint(key) {
  if (key === currentHintKey) return;
  currentHintKey = key;
  const h = HINTS[key];
  if (!h) return;

  elHintBox.dataset.level = h.level;
  elHintIcon.innerHTML    = h.icon;
  elHintText.textContent  = h.text;
  elHintSub.textContent   = h.sub;
}

// ─────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS MATEMÁTICOS
// ─────────────────────────────────────────────────────────────────────────
const dist2D = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

// ─────────────────────────────────────────────────────────────────────────
// CARREGAMENTO RÁPIDO & RESILIENTE DO MEDIAPIPE (GPU com Fallback CPU)
// ─────────────────────────────────────────────────────────────────────────
async function loadFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  const modelAssetPath =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

  try {
    const gpuInitPromise = FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence:  0.5,
      minTrackingConfidence:      0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout GPU")), 4000)
    );

    return await Promise.race([gpuInitPromise, timeoutPromise]);
  } catch (gpuErr) {
    console.warn("GPU delegate indisponível ou lento. Inicializando com CPU (WASM-SIMD)...", gpuErr);
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: "CPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence:  0.5,
      minTrackingConfidence:      0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ACESSO À CÂMERA (Orientação Direta)
// ─────────────────────────────────────────────────────────────────────────
async function initCamera() {
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width:  { ideal: 1280, min: 640 },
      height: { ideal: 720,  min: 480 },
      frameRate: { min: 30, ideal: 60 },
    },
  });

  videoEl.srcObject = mediaStream;
  await new Promise((resolve) => {
    videoEl.onloadedmetadata = () => {
      videoEl.play();
      resolve();
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO PARALELA
// ─────────────────────────────────────────────────────────────────────────
async function initApp() {
  updateHint("loading_camera");

  const cameraPromise = initCamera().then(() => {
    if (!faceLandmarker) updateHint("loading_model");
  });

  const modelPromise = loadFaceLandmarker().then((landmarker) => {
    faceLandmarker = landmarker;
  });

  try {
    await Promise.all([cameraPromise, modelPromise]);

    updateHint("calibrate");
    initSliders();
    renderLoop();
  } catch (err) {
    console.error("Erro na inicialização:", err);
    let msg = "Erro ao acessar a câmera.";
    if (err.name === "NotAllowedError") msg = "Permissão de câmera negada.";
    else if (err.name === "NotFoundError") msg = "Nenhuma câmera encontrada.";

    updateHint("no_face");
    elHintText.textContent = msg;
    elHintSub.textContent  = "Verifique as permissões ou recarregue a página";
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SLIDERS DE CALIBRAÇÃO
// ─────────────────────────────────────────────────────────────────────────
function initSliders() {
  elSliderL.value = 30;
  elSliderR.value = 70;
  updateGuidePositions();
  elSliderL.addEventListener("input", updateGuidePositions);
  elSliderR.addEventListener("input", updateGuidePositions);
}

function updateGuidePositions() {
  let lPct = parseFloat(elSliderL.value);
  let rPct = parseFloat(elSliderR.value);

  if (lPct >= rPct - 5) {
    rPct = Math.min(100, lPct + 5);
    elSliderR.value = rPct;
  }

  elGuideL.style.left = `${lPct}%`;
  elGuideR.style.left = `${rPct}%`;

  const containerW = elViewport.offsetWidth;
  const distPx = Math.abs(rPct - lPct) / 100 * containerW;
  elCalibInfo.textContent = `Distância: ${distPx.toFixed(0)} px`;
}

// ─────────────────────────────────────────────────────────────────────────
// CONFIRMAR CALIBRAÇÃO
// ─────────────────────────────────────────────────────────────────────────
function confirmCalibration() {
  const lPct = parseFloat(elSliderL.value);
  const rPct = parseFloat(elSliderR.value);

  const vw = videoEl.videoWidth  || 1280;
  const vh = videoEl.videoHeight || 720;
  const containerW = elViewport.offsetWidth;
  const containerH = elViewport.offsetHeight;

  const scaleX = containerW / vw;
  const scaleY = containerH / vh;
  const scale  = Math.max(scaleX, scaleY);
  const renderedW = vw * scale;
  const offsetX   = (renderedW - containerW) / 2;

  const guideLeftPx  = (lPct / 100 * containerW + offsetX) / scale;
  const guideRightPx = (rPct / 100 * containerW + offsetX) / scale;
  const distPx = Math.abs(guideRightPx - guideLeftPx);

  if (distPx < 30) {
    elHintText.textContent = "Guias muito próximas";
    elHintSub.textContent  = "Ajuste os sliders e tente novamente";
    return;
  }

  ppmCalibrated = distPx / CALIBRATION_MM;
  isCalibrated  = true;
  samples       = [];

  elViewport.classList.add("calibrated");
  updateHint("calibrated");

  elFinalizeBtn.style.display = "flex";
  elFinalizeBtn.disabled = false;
  elRecalibBtn.style.display  = "flex";
  elDPLiveBadge.classList.add("active");

  elTipBox.querySelector("span:last-child").textContent =
    "Retire a régua. A DP está sendo medida em tempo real. Quando estabilizar, clique em \"Finalizar Medição\".";
}

// ─────────────────────────────────────────────────────────────────────────
// LOOP DE RENDERIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────
function renderLoop() {
  animId = requestAnimationFrame(renderLoop);
  if (!faceLandmarker || videoEl.readyState < 2 || videoEl.paused) return;

  const nowMs = performance.now();
  if (videoEl.currentTime === lastVt) return;
  lastVt = videoEl.currentTime;

  const vw = videoEl.videoWidth  || 1280;
  const vh = videoEl.videoHeight || 720;

  if (canvasEl.width !== vw || canvasEl.height !== vh) {
    canvasEl.width  = vw;
    canvasEl.height = vh;
  }

  ctx.clearRect(0, 0, vw, vh);

  const res = faceLandmarker.detectForVideo(videoEl, nowMs);
  if (!res.faceLandmarks?.length) {
    if (!isCalibrated) updateHint("calibrate");
    else updateHint("no_face");
    return;
  }

  const lm = res.faceLandmarks[0];
  const px = (i) => ({ x: lm[i].x * vw, y: lm[i].y * vh });

  const pL = px(LM_PUPIL_L), pR = px(LM_PUPIL_R);
  const zL = px(LM_ZYGO_L),  zR = px(LM_ZYGO_R);
  const nD = px(LM_NOSE_DORSUM);

  // Desenhar landmarks em orientação direta
  drawLandmarks(pL, pR, zL, zR, nD);

  // Medição contínua pós-calibração
  if (isCalibrated && ppmCalibrated > 0) {
    const dpPx      = dist2D(pL, pR);
    const dpMm      = dpPx / ppmCalibrated;
    const dpLeftMm  = Math.abs(pL.x - nD.x) / ppmCalibrated;
    const dpRightMm = Math.abs(pR.x - nD.x) / ppmCalibrated;
    const faceWMm   = dist2D(zL, zR) / ppmCalibrated;

    samples.push({ dpMm, dpLeftMm, dpRightMm, faceWMm });
    if (samples.length > SAMPLE_MAX) samples.shift();

    const win = samples.slice(-SAMPLE_WINDOW);
    const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const avgDP = avg(win.map(s => s.dpMm));

    elDPLiveVal.textContent = avgDP.toFixed(1);
  }
}

function drawLandmarks(pL, pR, zL, zR, nD) {
  // Linha DP
  ctx.beginPath();
  ctx.moveTo(pL.x, pL.y);
  ctx.lineTo(pR.x, pR.y);
  ctx.strokeStyle = isCalibrated ? "rgba(34, 197, 94, 0.9)" : "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pupilas
  [pL, pR].forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00e5ff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Dorso nasal
  ctx.beginPath();
  ctx.arc(nD.x, nD.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#f59e0b";
  ctx.fill();

  // Zigomáticos
  [zL, zR].forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fb923c";
    ctx.fill();
  });
}

// ─────────────────────────────────────────────────────────────────────────
// FINALIZAR MEDIÇÃO
// ─────────────────────────────────────────────────────────────────────────
function finalizeMeasurement() {
  if (samples.length < SAMPLE_WINDOW) {
    elHintText.textContent = "Aguarde mais um instante...";
    elHintSub.textContent  = `Estabilizando leitura (${samples.length}/${SAMPLE_WINDOW})`;
    return;
  }

  const win = samples.slice(-SAMPLE_WINDOW);
  const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const finalDP    = avg(win.map(s => s.dpMm));
  const finalLeft  = avg(win.map(s => s.dpLeftMm));
  const finalRight = avg(win.map(s => s.dpRightMm));

  updateHint("done");

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
    videoEl.srcObject = null;
  }
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }

  elModalDPBino.textContent = finalDP.toFixed(1) + " mm";
  elModalDPEsq.textContent  = finalLeft.toFixed(1) + " mm";
  elModalDPDir.textContent  = finalRight.toFixed(1) + " mm";
  elModalOverlay.classList.add("active");

  window._medicaoResult = {
    metodo: "Com Régua (Calibração Manual)",
    dp_binocular: +finalDP.toFixed(1),
    dp_esq: +finalLeft.toFixed(1),
    dp_dir: +finalRight.toFixed(1),
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────────────────
elCalibBtn.addEventListener("click", confirmCalibration);
elFinalizeBtn.addEventListener("click", finalizeMeasurement);

elRecalibBtn.addEventListener("click", () => {
  isCalibrated  = false;
  ppmCalibrated = null;
  samples       = [];
  elViewport.classList.remove("calibrated");
  elFinalizeBtn.style.display = "none";
  elRecalibBtn.style.display  = "none";
  elDPLiveBadge.classList.remove("active");
  elDPLiveVal.textContent = "--";
  updateHint("calibrate");
  elTipBox.querySelector("span:last-child").textContent =
    "Posicione a régua plana na testa, ajuste os sliders verde e vermelho sobre as marcas de 0 cm e 10 cm, e clique em confirmar.";
});

// Modal
elModalConfirm.addEventListener("click", () => {
  if (window._medicaoResult) {
    localStorage.setItem("otica_medicao", JSON.stringify(window._medicaoResult));
  }
  window.location.href = "index.html";
});

elModalCancel.addEventListener("click", () => {
  localStorage.removeItem("otica_medicao");
  window.location.href = "index.html";
});

// ─────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────
initApp();
