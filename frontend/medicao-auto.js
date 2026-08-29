// ═══════════════════════════════════════════════════════════════════════════
// MEDIÇÃO AUTOMÁTICA (Depth-from-Iris) — Ótica Express
// Adaptado do método 1 do medicao.md, simplificado para o cliente.
// ═══════════════════════════════════════════════════════════════════════════

import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTES CLÍNICAS E ÍNDICES DE LANDMARKS
// ─────────────────────────────────────────────────────────────────────────
const IRIS_DIAMETER_MM = 11.7;

const LM_PUPIL_L  = 468;
const LM_PUPIL_R  = 473;
const LM_IRIS_L_OUTER = 469;
const LM_IRIS_L_INNER = 471;
const LM_IRIS_R_INNER = 474;
const LM_IRIS_R_OUTER = 476;
const LM_NOSE_DORSUM = 168;

const LM_EAR_L_OUTER = 33;  const LM_EAR_L_INNER = 133;
const LM_EAR_L_TOP1  = 159; const LM_EAR_L_TOP2  = 158;
const LM_EAR_L_BOT1  = 145; const LM_EAR_L_BOT2  = 144;

const LM_EAR_R_OUTER = 263; const LM_EAR_R_INNER = 362;
const LM_EAR_R_TOP1  = 386; const LM_EAR_R_TOP2  = 385;
const LM_EAR_R_BOT1  = 374; const LM_EAR_R_BOT2  = 373;

const LM_ZYGO_L = 234;
const LM_ZYGO_R = 454;

const EAR_THRESHOLD     = 0.22;
const YAW_THRESHOLD_MM  = 0.07;
const ROLL_THRESHOLD_DEG = 6.0;

// ─────────────────────────────────────────────────────────────────────────
// ELEMENTOS DOM
// ─────────────────────────────────────────────────────────────────────────
const videoEl    = document.getElementById("webcam");
const canvasEl   = document.getElementById("output_canvas");
const ctx        = canvasEl.getContext("2d");
const elHintBox  = document.getElementById("hint_box");
const elHintIcon = document.getElementById("hint_icon");
const elHintText = document.getElementById("hint_text");
const elHintSub  = document.getElementById("hint_sub");
const elCapBtn   = document.getElementById("capture_btn");
const elResetBtn = document.getElementById("reset_btn");
const elProgress = document.getElementById("progress_bar");
const elViewport = document.getElementById("camViewport");

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
let faceLandmarker = null;
let mediaStream    = null;
let animFrameId    = null;
let lastVideoTime  = -1;
let isCapturing    = false;
let samples        = [];
const SAMPLE_TARGET = 60;

// ─────────────────────────────────────────────────────────────────────────
// SISTEMA DE DICAS VISUAIS
// ─────────────────────────────────────────────────────────────────────────
const HINTS = {
  init: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    text: "Inicializando câmera...",
    sub:  "Aguarde o carregamento",
    level: "primary"
  },
  no_face: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="18" y1="2" x2="22" y2="6"/><line x1="22" y1="2" x2="18" y2="6"/></svg>`,
    text: "Nenhum rosto detectado",
    sub:  "Posicione seu rosto em frente à câmera",
    level: "danger"
  },
  too_far: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>`,
    text: "Aproxime-se da tela",
    sub:  "Seu rosto está muito longe",
    level: "warning"
  },
  too_close: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M3 3l4 4M17 17l4 4M3 21l4-4M17 7l4-4"/></svg>`,
    text: "Afaste-se da tela",
    sub:  "Seu rosto está próximo demais",
    level: "warning"
  },
  blinking: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="8" cy="10" rx="3" ry="2"/><ellipse cx="16" cy="10" rx="3" ry="2"/><path d="M7 18s2-2 5-2 5 2 5 2"/></svg>`,
    text: "Abra os olhos completamente",
    sub:  "Piscada detectada",
    level: "warning"
  },
  yaw_right: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M17 12l3-3-3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Vire o rosto para a esquerda",
    sub:  "Olhe diretamente para a câmera",
    level: "warning"
  },
  yaw_left: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M7 12L4 9l3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Vire o rosto para a direita",
    sub:  "Olhe diretamente para a câmera",
    level: "warning"
  },
  roll_left: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 12l-5-3" stroke-linecap="round"/><path d="M5 7l2 2-2 2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Incline a cabeça para a direita",
    sub:  "Mantenha a cabeça reta",
    level: "warning"
  },
  roll_right: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 12l5-3" stroke-linecap="round"/><path d="M19 7l-2 2 2 2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Incline a cabeça para a esquerda",
    sub:  "Mantenha a cabeça reta",
    level: "warning"
  },
  valid_idle: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Posição excelente!",
    sub:  "Clique em \"Iniciar Medição\" para capturar",
    level: "success"
  },
  capturing: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>`,
    text: "Medindo — não se mova!",
    sub:  "Mantenha os olhos abertos e o rosto reto",
    level: "capturing"
  },
  capturing_invalid: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
    text: "Frame inválido — aguardando...",
    sub:  "Corrija a posição para retomar",
    level: "warning"
  },
  done: {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    text: "Medição concluída!",
    sub:  "Confira os resultados",
    level: "success"
  },
};

let currentHintKey    = "init";
let hintDebounceTimer = null;

function updateHint(key) {
  if (key === currentHintKey) return;
  clearTimeout(hintDebounceTimer);
  hintDebounceTimer = setTimeout(() => {
    currentHintKey = key;
    const h = HINTS[key];
    if (!h) return;

    elHintBox.classList.add("med-hint-exit");
    setTimeout(() => {
      elHintBox.dataset.level = h.level;
      elHintIcon.innerHTML    = h.icon;
      elHintText.textContent  = h.text;
      elHintSub.textContent   = h.sub;
      elHintBox.classList.remove("med-hint-exit");
      elHintBox.classList.add("med-hint-enter");
      setTimeout(() => elHintBox.classList.remove("med-hint-enter"), 300);
    }, 150);

    const borderColors = {
      success:   "rgba(34,197,94,0.6)",
      warning:   "rgba(245,158,11,0.5)",
      danger:    "rgba(239,68,68,0.5)",
      primary:   "rgba(59,130,246,0.3)",
      capturing: "rgba(0,229,255,0.7)",
    };
    elViewport.style.boxShadow =
      `0 0 0 2px ${borderColors[h.level] || "transparent"}, 0 20px 40px rgba(0,0,0,0.5)`;
  }, 80);
}

// ─────────────────────────────────────────────────────────────────────────
// INICIALIZAÇÃO DO MEDIAPIPE
// ─────────────────────────────────────────────────────────────────────────
async function initMediaPipe() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence:  0.5,
    minTrackingConfidence:      0.5,
  });

  await initCamera();
}

// ─────────────────────────────────────────────────────────────────────────
// CÂMERA
// ─────────────────────────────────────────────────────────────────────────
async function initCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "user" },
        width:  { ideal: 1280, min: 640 },
        height: { ideal: 720,  min: 480 },
        frameRate: { min: 30, ideal: 60 },
      },
    });
    videoEl.srcObject = mediaStream;
    await new Promise((resolve) => {
      videoEl.onloadedmetadata = () => resolve(videoEl.play());
    });

    updateHint("no_face");
    elCapBtn.disabled = false;
    renderLoop();
  } catch (err) {
    let msg = "Erro ao acessar a câmera.";
    if (err.name === "NotAllowedError") msg = "Permissão de câmera negada.";
    else if (err.name === "NotFoundError") msg = "Nenhuma câmera encontrada.";
    else if (err.name === "NotReadableError") msg = "Câmera já em uso.";
    updateHint("no_face");
    elHintText.textContent = msg;
    elHintSub.textContent  = "Verifique as permissões do navegador";
  }
}

function releaseCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    videoEl.srcObject = null;
  }
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LOOP DE RENDERIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────
function renderLoop() {
  animFrameId = requestAnimationFrame(renderLoop);
  if (!faceLandmarker || videoEl.readyState < 2) return;
  const nowMs = performance.now();
  if (videoEl.currentTime === lastVideoTime) return;
  lastVideoTime = videoEl.currentTime;

  const result = faceLandmarker.detectForVideo(videoEl, nowMs);
  processFrame(result);
}

// ─────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS MATEMÁTICOS
// ─────────────────────────────────────────────────────────────────────────
const dist2D = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

function calcEAR(top1, top2, bot1, bot2, inner, outer) {
  const vertical   = (dist2D(top1, bot1) + dist2D(top2, bot2)) / 2;
  const horizontal = dist2D(inner, outer);
  return horizontal > 0 ? vertical / horizontal : 0;
}

function rollAngle(pL, pR) {
  return Math.atan2(pR.y - pL.y, pR.x - pL.x) * (180 / Math.PI);
}

// ─────────────────────────────────────────────────────────────────────────
// PROCESSAMENTO DE FRAME
// ─────────────────────────────────────────────────────────────────────────
function processFrame(result) {
  const vw = videoEl.videoWidth  || 1280;
  const vh = videoEl.videoHeight || 720;
  canvasEl.width  = vw;
  canvasEl.height = vh;

  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, -vw, 0, vw, vh);
  ctx.restore();

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    updateHint("no_face");
    return;
  }

  const lm = result.faceLandmarks[0];
  const px = (idx) => ({ x: lm[idx].x * vw, y: lm[idx].y * vh });

  const pupilL = px(LM_PUPIL_L);
  const pupilR = px(LM_PUPIL_R);
  const noseDorsum = px(LM_NOSE_DORSUM);

  const irisLO = px(LM_IRIS_L_OUTER);
  const irisLI = px(LM_IRIS_L_INNER);
  const irisRI = px(LM_IRIS_R_INNER);
  const irisRO = px(LM_IRIS_R_OUTER);

  const zygoL = px(LM_ZYGO_L);
  const zygoR = px(LM_ZYGO_R);

  // Depth-from-Iris: PPM
  const irisLDiaPx = dist2D(irisLO, irisLI);
  const irisRDiaPx = dist2D(irisRI, irisRO);
  const avgIrisPx  = (irisLDiaPx + irisRDiaPx) / 2;
  const ppm = avgIrisPx / IRIS_DIAMETER_MM;

  // Métricas
  const dpBinoPx  = dist2D(pupilL, pupilR);
  const dpBinoMm  = dpBinoPx / ppm;
  const dpLeftMm  = Math.abs(pupilL.x - noseDorsum.x) / ppm;
  const dpRightMm = Math.abs(pupilR.x - noseDorsum.x) / ppm;
  const faceWidthMm = dist2D(zygoL, zygoR) / ppm;

  // Diagnósticos
  const earL = calcEAR(
    px(LM_EAR_L_TOP1), px(LM_EAR_L_TOP2),
    px(LM_EAR_L_BOT1), px(LM_EAR_L_BOT2),
    px(LM_EAR_L_INNER), px(LM_EAR_L_OUTER)
  );
  const earR = calcEAR(
    px(LM_EAR_R_TOP1), px(LM_EAR_R_TOP2),
    px(LM_EAR_R_BOT1), px(LM_EAR_R_BOT2),
    px(LM_EAR_R_INNER), px(LM_EAR_R_OUTER)
  );
  const earAvg = (earL + earR) / 2;
  const isBlinking = earAvg < EAR_THRESHOLD;

  const dpSum = dpLeftMm + dpRightMm;
  const yawAsymmetry = dpSum > 0 ? Math.abs(dpLeftMm - dpRightMm) / dpSum : 1;
  const isYawed = yawAsymmetry > YAW_THRESHOLD_MM;

  const rollDeg = Math.abs(rollAngle(pupilL, pupilR));
  const isRolled = rollDeg > ROLL_THRESHOLD_DEG;

  const isTooFar  = ppm < 8;
  const isTooClose = ppm > 28;

  // Determinar status
  let hintKey;
  let isValidFrame = false;

  if (isTooFar) {
    hintKey = "too_far";
  } else if (isTooClose) {
    hintKey = "too_close";
  } else if (isBlinking) {
    hintKey = "blinking";
  } else if (isYawed) {
    hintKey = dpLeftMm < dpRightMm ? "yaw_right" : "yaw_left";
  } else if (isRolled) {
    const rawRoll = rollAngle(pupilL, pupilR);
    hintKey = rawRoll > 0 ? "roll_right" : "roll_left";
  } else if (dpBinoMm < 45 || dpBinoMm > 85) {
    hintKey = "too_far";
  } else {
    isValidFrame = true;
    hintKey = isCapturing ? "capturing" : "valid_idle";
  }

  // Coleta de amostras
  if (isCapturing) {
    if (isValidFrame) {
      samples.push({ dpBinoMm, dpLeftMm, dpRightMm, faceWidthMm, ppm });
      const progress = Math.min(samples.length / SAMPLE_TARGET, 1);
      elProgress.style.width = (progress * 100) + "%";
      updateHint("capturing");

      if (samples.length >= SAMPLE_TARGET) {
        finalizeMeasurement();
        return;
      }
    } else {
      updateHint(hintKey === "capturing" ? "capturing_invalid" : hintKey);
    }
  } else {
    updateHint(hintKey);
  }

  // Renderizar overlay
  drawOverlay(pupilL, pupilR, irisLO, irisLI, irisRI, irisRO, noseDorsum, isValidFrame, vw, vh);
}

function drawOverlay(pupilL, pupilR, irisLO, irisLI, irisRI, irisRO, noseDorsum, isValidFrame, vw, vh) {
  ctx.save();
  ctx.translate(vw, 0);
  ctx.scale(-1, 1);

  // Linha DP
  ctx.beginPath();
  ctx.moveTo(pupilL.x, pupilL.y);
  ctx.lineTo(pupilR.x, pupilR.y);
  ctx.strokeStyle = isValidFrame ? "rgba(34,197,94,0.9)" : "rgba(245,158,11,0.7)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pupilas
  [pupilL, pupilR].forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#00e5ff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,229,255,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Íris
  [irisLO, irisLI, irisRI, irisRO].forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,229,255,0.7)";
    ctx.fill();
  });

  // Dorso nasal
  ctx.beginPath();
  ctx.arc(noseDorsum.x, noseDorsum.y, 3.5, 0, 2 * Math.PI);
  ctx.fillStyle = "#f59e0b";
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────
// FINALIZAÇÃO DA COLETA
// ─────────────────────────────────────────────────────────────────────────
function finalizeMeasurement() {
  isCapturing = false;
  elCapBtn.disabled = true;
  elProgress.style.width = "100%";

  const trimFrac = 0.15;
  const trimN = Math.floor(samples.length * trimFrac);

  function trimmedMean(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const sliced = sorted.slice(trimN, sorted.length - trimN);
    return sliced.reduce((s, v) => s + v, 0) / sliced.length;
  }

  const finalDP    = trimmedMean(samples.map(s => s.dpBinoMm));
  const finalLeft  = trimmedMean(samples.map(s => s.dpLeftMm));
  const finalRight = trimmedMean(samples.map(s => s.dpRightMm));

  updateHint("done");
  releaseCamera();

  // Mostrar modal
  elModalDPBino.textContent = finalDP.toFixed(1) + " mm";
  elModalDPEsq.textContent  = finalLeft.toFixed(1) + " mm";
  elModalDPDir.textContent  = finalRight.toFixed(1) + " mm";
  elModalOverlay.classList.add("active");

  // Salvar dados temporários para confirmação
  window._medicaoResult = {
    metodo: "Automática (Depth-from-Iris)",
    dp_binocular: +finalDP.toFixed(1),
    dp_esq: +finalLeft.toFixed(1),
    dp_dir: +finalRight.toFixed(1),
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// CONTROLES
// ─────────────────────────────────────────────────────────────────────────
elCapBtn.addEventListener("click", () => {
  if (isCapturing) return;
  samples = [];
  isCapturing = true;
  elProgress.style.width = "0%";
  elCapBtn.disabled = true;
});

elResetBtn.addEventListener("click", () => {
  samples = [];
  isCapturing = false;
  currentHintKey = "";
  elCapBtn.disabled = false;
  elProgress.style.width = "0%";
  elModalOverlay.classList.remove("active");
  updateHint("no_face");

  if (!mediaStream) {
    initCamera();
  }
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
initMediaPipe().catch(err => {
  updateHint("no_face");
  elHintText.textContent = `Erro: ${err.message}`;
  elHintSub.textContent  = "Tente recarregar a página";
});
