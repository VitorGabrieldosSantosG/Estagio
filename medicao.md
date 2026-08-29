Medição padrão:
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Biometria Óptica (Depth-from-Iris) — OptoBiometria</title>
    <meta name="description" content="Medição clínica de distância pupilar (DP) e morfologia facial via MediaPipe Face Landmarker com modelo Depth-from-Iris 100% óptico." />

    <!-- Shared Design System -->
    <link rel="stylesheet" href="./style.css" />

    <!-- MediaPipe Tasks Vision (API v0.10 — WASM/WebGL) -->
    <script type="module">
      import {
        FaceLandmarker,
        FilesetResolver,
        DrawingUtils,
      } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
      import { recomendarArmacao, FORMATOS_ROSTO } from "./recomendacao.js";

      // ─────────────────────────────────────────────────────────────────────────
      // CONSTANTES CLÍNICAS E ÍNDICES DE LANDMARKS
      // ─────────────────────────────────────────────────────────────────────────
      const IRIS_DIAMETER_MM = 11.7; // Diâmetro transversal estável da íris humana adulta

      // Pupils (attention mesh)
      const LM_PUPIL_L  = 468; // Centro pupila olho esquerdo do usuário
      const LM_PUPIL_R  = 473; // Centro pupila olho direito do usuário

      // Íris esquerda — contorno horizontal (469=extremo esq, 471=extremo dir)
      const LM_IRIS_L_OUTER = 469;
      const LM_IRIS_L_INNER = 471;
      // Íris direita — contorno horizontal (474=extremo esq, 476=extremo dir)
      const LM_IRIS_R_INNER = 474;
      const LM_IRIS_R_OUTER = 476;

      // Ponte nasal
      const LM_NOSE_DORSUM = 168; // Dorso superior
      const LM_NOSE_TIP    = 4;   // Ápice (ponta)

      // Contorno ocular EAR — olho esquerdo (do usuário)
      const LM_EAR_L_OUTER  = 33;  // Canto ext. olho esq.
      const LM_EAR_L_INNER  = 133; // Canto int. olho esq.
      const LM_EAR_L_TOP1   = 159;
      const LM_EAR_L_TOP2   = 158;
      const LM_EAR_L_BOT1   = 145;
      const LM_EAR_L_BOT2   = 144;

      // Contorno ocular EAR — olho direito (do usuário)
      const LM_EAR_R_OUTER  = 263; // Canto ext. olho dir.
      const LM_EAR_R_INNER  = 362; // Canto int. olho dir.
      const LM_EAR_R_TOP1   = 386;
      const LM_EAR_R_TOP2   = 385;
      const LM_EAR_R_BOT1   = 374;
      const LM_EAR_R_BOT2   = 373;

      // Zigomáticos (largura do rosto)
      const LM_ZYGO_L = 234;
      const LM_ZYGO_R = 454;

      // Limites de validação
      const EAR_THRESHOLD     = 0.22; // Abaixo → piscando / semicerrado
      const YAW_THRESHOLD_MM  = 0.07; // Assimetria relativa DP monocular (7%)
      const ROLL_THRESHOLD_DEG = 6.0; // Graus de inclinação lateral aceitável

      // ─────────────────────────────────────────────────────────────────────────
      // ELEMENTOS DOM
      // ─────────────────────────────────────────────────────────────────────────
      const videoEl      = document.getElementById("webcam");
      const canvasEl     = document.getElementById("output_canvas");
      const ctx          = canvasEl.getContext("2d");

      const elStatus     = document.getElementById("status");
      const elStatusDot  = document.getElementById("status_dot");
      const elDpBino     = document.getElementById("dp_bino");
      const elDpStatusSub= document.getElementById("dp_status_sub");
      const elDpLeft     = document.getElementById("dp_left");
      const elDpRight    = document.getElementById("dp_right");
      const elFaceW      = document.getElementById("face_width");
      const elPPM        = document.getElementById("ppm_val");
      const elRefScale   = document.getElementById("ref_scale_val");

      const elEAR        = document.getElementById("ear_val");
      const elYaw        = document.getElementById("yaw_val");
      const elRoll       = document.getElementById("roll_val");
      const elAlign      = document.getElementById("align_val");

      const elLogs       = document.getElementById("logs");
      const elCapBtn     = document.getElementById("capture_btn");
      const elResetBtn   = document.getElementById("reset_btn");
      const elJsonOut    = document.getElementById("json_output");
      const elJsonWrap   = document.getElementById("json_wrap");
      const elProgress   = document.getElementById("progress_bar");

      const elRecCard    = document.getElementById("rec_card");
      const elRecCat     = document.getElementById("rec_cat");
      const elRecLente   = document.getElementById("rec_lente");
      const elRecTotal   = document.getElementById("rec_total");
      const elRecPonte   = document.getElementById("rec_ponte");
      const elRecDec     = document.getElementById("rec_dec");
      const elRecEstilos = document.getElementById("rec_estilos");
      const elRecEvitar  = document.getElementById("rec_evitar");
      const elRecObs     = document.getElementById("rec_obs");
      const elRecJson    = document.getElementById("rec_json");

      const elHintBox    = document.getElementById("hint_box");
      const elHintIcon   = document.getElementById("hint_icon");
      const elHintText   = document.getElementById("hint_text");
      const elHintSub    = document.getElementById("hint_sub");
      const elViewport   = document.querySelector(".viewport-wrap");

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
      let selectedFormato = "neutro";
      let lastFinalDP    = null;
      let lastFinalFaceW = null;
      let lastFinalLeft  = null;
      let lastFinalRight = null;

      // ── Sistema de Dicas Visuais ──────────────────────────────────────────────
      const HINTS = {
        init: {
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
          text: "Inicializando modelos...",
          sub:  "Aguarde o carregamento do MediaPipe",
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
          sub:  "Seu rosto está muito longe para medir com precisão",
          level: "warning"
        },
        too_close: {
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M3 3l4 4M17 17l4 4M3 21l4-4M17 7l4-4"/></svg>`,
          text: "Afaste-se da tela",
          sub:  "Seu rosto está próximo demais da câmera",
          level: "warning"
        },
        blinking: {
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="8" cy="10" rx="3" ry="2"/><ellipse cx="16" cy="10" rx="3" ry="2"/><path d="M5 10c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M13 10c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M7 18s2-2 5-2 5 2 5 2"/></svg>`,
          text: "Abra os olhos completamente",
          sub:  "Piscada ou olhos semicerrados detectados",
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
          sub:  "Corrija a posição para retomar a coleta",
          level: "warning"
        },
        done: {
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
          text: "Medição concluída!",
          sub:  "Resultados disponíveis no painel ao lado",
          level: "success"
        },
      };

      let currentHintKey  = "init";
      let hintDebounceTimer = null;

      function updateHint(key) {
        if (key === currentHintKey) return;
        clearTimeout(hintDebounceTimer);
        hintDebounceTimer = setTimeout(() => {
          currentHintKey = key;
          const h = HINTS[key];
          if (!h) return;

          elHintBox.classList.add("hint-exit");
          setTimeout(() => {
            elHintBox.dataset.level = h.level;
            elHintIcon.innerHTML   = h.icon;
            elHintText.textContent = h.text;
            elHintSub.textContent  = h.sub;
            elHintBox.classList.remove("hint-exit");
            elHintBox.classList.add("hint-enter");
            setTimeout(() => elHintBox.classList.remove("hint-enter"), 300);
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
      // INICIALIZAÇÃO DO MEDIAPIPE FACE LANDMARKER (Tasks API)
      // ─────────────────────────────────────────────────────────────────────────
      async function initMediaPipe() {
        appendLog("⟳ Carregando modelos MediaPipe WASM...");
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

        appendLog("✔ MediaPipe inicializado. Acessando câmera...");
        await initCamera();
      }

      // ─────────────────────────────────────────────────────────────────────────
      // ACESSO À CÂMERA (WebRTC)
      // ─────────────────────────────────────────────────────────────────────────
      async function initCamera() {
        try {
          const constraints = {
            audio: false,
            video: {
              facingMode: { ideal: "user" },
              width:      { ideal: 1280, min: 640 },
              height:     { ideal: 720,  min: 480 },
              frameRate:  { min: 30, ideal: 60 },
            },
          };

          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          videoEl.srcObject = mediaStream;

          await new Promise((resolve) => {
            videoEl.onloadedmetadata = () => resolve(videoEl.play());
          });

          const track = mediaStream.getVideoTracks()[0];
          const settings = track.getSettings();
          appendLog(`✔ Câmera ativa: ${settings.width}x${settings.height} @ ~${Math.round(settings.frameRate || 30)}fps`);
          setStatus("Posicione seu rosto na moldura", "primary");
          updateHint("no_face");

          elRefScale.textContent = "Íris Humana: 11.7 mm (Depth-from-Iris)";

          renderLoop();
        } catch (err) {
          console.error("Erro getUserMedia:", err);
          let msg = "Erro ao acessar a câmera.";
          if (err.name === "NotAllowedError") msg = "Permissão de câmera negada.";
          else if (err.name === "NotFoundError") msg = "Nenhuma câmera encontrada.";
          else if (err.name === "NotReadableError") msg = "Câmera já em uso por outro aplicativo.";
          setStatus(msg, "danger");
          appendLog(`✖ ${msg} (${err.name})`);
        }
      }

      function releaseCamera() {
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          mediaStream = null;
          videoEl.srcObject = null;
          appendLog("ℹ Câmera liberada (coleta concluída).");
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
        const vertical = (dist2D(top1, bot1) + dist2D(top2, bot2)) / 2;
        const horizontal = dist2D(inner, outer);
        return horizontal > 0 ? vertical / horizontal : 0;
      }

      function rollAngle(pL, pR) {
        const dx = pR.x - pL.x;
        const dy = pR.y - pL.y;
        return Math.atan2(dy, dx) * (180 / Math.PI);
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
          setStatus("Nenhum rosto detectado", "danger");
          elAlign.textContent = "Sem rosto";
          elAlign.style.color = "var(--danger)";
          updateHint("no_face");
          return;
        }

        const lm = result.faceLandmarks[0];
        const px = (idx) => ({
          x: lm[idx].x * vw,
          y: lm[idx].y * vh,
        });

        const pupilL    = px(LM_PUPIL_L);
        const pupilR    = px(LM_PUPIL_R);
        const noseDorsum= px(LM_NOSE_DORSUM);
        const noseTip   = px(LM_NOSE_TIP);

        const irisLO  = px(LM_IRIS_L_OUTER);
        const irisLI  = px(LM_IRIS_L_INNER);
        const irisRI  = px(LM_IRIS_R_INNER);
        const irisRO  = px(LM_IRIS_R_OUTER);

        const earLT1 = px(LM_EAR_L_TOP1); const earLT2 = px(LM_EAR_L_TOP2);
        const earLB1 = px(LM_EAR_L_BOT1); const earLB2 = px(LM_EAR_L_BOT2);
        const earLOuter = px(LM_EAR_L_OUTER); const earLInner = px(LM_EAR_L_INNER);

        const earRT1 = px(LM_EAR_R_TOP1); const earRT2 = px(LM_EAR_R_TOP2);
        const earRB1 = px(LM_EAR_R_BOT1); const earRB2 = px(LM_EAR_R_BOT2);
        const earROuter = px(LM_EAR_R_OUTER); const earRInner = px(LM_EAR_R_INNER);

        const zygoL = px(LM_ZYGO_L);
        const zygoR = px(LM_ZYGO_R);

        // ── Depth-from-Iris: Fator de Conversão PPM ──────────────────────────
        const irisLDiaPx = dist2D(irisLO, irisLI);
        const irisRDiaPx = dist2D(irisRI, irisRO);
        const avgIrisPx  = (irisLDiaPx + irisRDiaPx) / 2;
        const ppm = avgIrisPx / IRIS_DIAMETER_MM;

        // ── Métricas Primárias ─────────────────────────────────────────────────
        const dpBinoPx  = dist2D(pupilL, pupilR);
        const dpBinoMm  = dpBinoPx / ppm;

        const dpLeftMm   = Math.abs(pupilL.x - noseDorsum.x) / ppm;
        const dpRightMm  = Math.abs(pupilR.x - noseDorsum.x) / ppm;
        const faceWidthMm = dist2D(zygoL, zygoR) / ppm;

        // ── Diagnósticos ───────────────────────────────────────────────────────
        const earL = calcEAR(earLT1, earLT2, earLB1, earLB2, earLInner, earLOuter);
        const earR = calcEAR(earRT1, earRT2, earRB1, earRB2, earRInner, earROuter);
        const earAvg = (earL + earR) / 2;
        const isBlinking = earAvg < EAR_THRESHOLD;

        const dpSum = dpLeftMm + dpRightMm;
        const yawAsymmetry = dpSum > 0 ? Math.abs(dpLeftMm - dpRightMm) / dpSum : 1;
        const isYawed = yawAsymmetry > YAW_THRESHOLD_MM;

        const rollDeg = Math.abs(rollAngle(pupilL, pupilR));
        const isRolled = rollDeg > ROLL_THRESHOLD_DEG;

        const isTooFar   = ppm < 8;
        const isTooClose = ppm > 28;

        let validationStatus;
        let statusLevel;
        let hintKey;

        if (isTooFar) {
          validationStatus = "⬆ Aproxime-se da tela";
          statusLevel = "warning";
          hintKey = "too_far";
          elAlign.textContent = "Muito longe";
          elAlign.style.color = "var(--warning)";
        } else if (isTooClose) {
          validationStatus = "⬇ Afaste-se da tela";
          statusLevel = "warning";
          hintKey = "too_close";
          elAlign.textContent = "Muito perto";
          elAlign.style.color = "var(--warning)";
        } else if (isBlinking) {
          validationStatus = "⚠ Piscando / Olhos semicerrados";
          statusLevel = "warning";
          hintKey = "blinking";
          elAlign.textContent = "Olhos fechados";
          elAlign.style.color = "var(--warning)";
        } else if (isYawed) {
          hintKey = dpLeftMm < dpRightMm ? "yaw_right" : "yaw_left";
          validationStatus = "↔ Rosto rotacionado lateralmente (Yaw)";
          statusLevel = "warning";
          elAlign.textContent = "Yaw excessivo";
          elAlign.style.color = "var(--warning)";
        } else if (isRolled) {
          const rawRoll = rollAngle(pupilL, pupilR);
          hintKey = rawRoll > 0 ? "roll_right" : "roll_left";
          validationStatus = "↻ Rosto inclinado (Roll)";
          statusLevel = "warning";
          elAlign.textContent = "Roll excessivo";
          elAlign.style.color = "var(--warning)";
        } else if (dpBinoMm < 45 || dpBinoMm > 85) {
          validationStatus = "⚠ Ajuste de distância / Postura";
          statusLevel = "warning";
          hintKey = "too_far";
          elAlign.textContent = "Fora da faixa";
          elAlign.style.color = "var(--warning)";
        } else {
          validationStatus = "✔ Posição ideal para medição";
          statusLevel = "success";
          hintKey = isCapturing ? "capturing" : "valid_idle";
          elAlign.textContent = "Alinhado";
          elAlign.style.color = "var(--success)";
        }

        const isValidFrame = statusLevel === "success";

        // ── Coleta de Amostras ─────────────────────────────────────────────────
        if (isCapturing) {
          if (isValidFrame) {
            samples.push({ dpBinoMm, dpLeftMm, dpRightMm, faceWidthMm, ppm });
            const progress = Math.min(samples.length / SAMPLE_TARGET, 1);
            elProgress.style.width = (progress * 100) + "%";
            elDpStatusSub.textContent = `Coletando amostras: ${samples.length} / ${SAMPLE_TARGET}`;
            appendLog(`[${samples.length}/${SAMPLE_TARGET}] DP=${dpBinoMm.toFixed(2)} mm | PPM=${ppm.toFixed(2)}`);
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

        // ── Atualizar UI de Métricas ───────────────────────────────────────────
        if (isValidFrame || !isCapturing) {
          elDpBino.textContent  = isValidFrame ? dpBinoMm.toFixed(1) : "--";
          elDpLeft.textContent  = isValidFrame ? dpLeftMm.toFixed(1) + " mm" : "--";
          elDpRight.textContent = isValidFrame ? dpRightMm.toFixed(1) + " mm" : "--";
          elFaceW.textContent   = isValidFrame ? faceWidthMm.toFixed(1) + " mm" : "--";
        }

        elEAR.textContent  = earAvg.toFixed(3);
        elYaw.textContent  = (yawAsymmetry * 100).toFixed(1) + "%";
        elRoll.textContent = rollDeg.toFixed(1) + "°";
        elPPM.textContent  = ppm.toFixed(3) + " px/mm";

        setStatus(validationStatus, statusLevel);

        // ── Renderização no Canvas ─────────────────────────────────────────────
        drawOverlay({
          pupilL, pupilR, noseDorsum, noseTip,
          irisLO, irisLI, irisRI, irisRO,
          zygoL, zygoR,
          isValidFrame,
          vw, vh
        });
      }

      function drawOverlay({ pupilL, pupilR, noseDorsum, noseTip, irisLO, irisLI,
                             irisRI, irisRO, zygoL, zygoR, isValidFrame, vw, vh }) {
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

        // Zigomáticos
        [zygoL, zygoR].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "#fb923c";
          ctx.fill();
        });

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────────────────
      // FINALIZAÇÃO DA COLETA
      // ─────────────────────────────────────────────────────────────────────────
      function finalizeMeasurement() {
        isCapturing = false;
        elCapBtn.disabled = false;
        elCapBtn.textContent = "Iniciar Medição";
        elProgress.style.width = "100%";
        elDpStatusSub.textContent = "✔ Medição Finalizada com Sucesso";

        const trimFrac = 0.15;
        const trimN    = Math.floor(samples.length * trimFrac);

        function trimmedMean(arr) {
          const sorted = [...arr].sort((a, b) => a - b);
          const sliced = sorted.slice(trimN, sorted.length - trimN);
          return sliced.reduce((s, v) => s + v, 0) / sliced.length;
        }

        const finalDP    = trimmedMean(samples.map(s => s.dpBinoMm));
        const finalLeft  = trimmedMean(samples.map(s => s.dpLeftMm));
        const finalRight = trimmedMean(samples.map(s => s.dpRightMm));
        const finalFaceW = trimmedMean(samples.map(s => s.faceWidthMm));
        const finalPPM   = trimmedMean(samples.map(s => s.ppm));
        const discarded  = samples.length - (samples.length - trimN * 2);

        const result = {
          metodo: "Biometria Óptica (Depth-from-Iris)",
          timestamp: new Date().toISOString(),
          dp_binocular_mm:     +finalDP.toFixed(2),
          dp_monocular_esq_mm: +finalLeft.toFixed(2),
          dp_monocular_dir_mm: +finalRight.toFixed(2),
          face_width_mm:       +finalFaceW.toFixed(2),
          ppm_fator_escala:    +finalPPM.toFixed(4),
          referencial_escala:  "Íris Humana (11.70 mm)",
          amostras_coletadas:  samples.length,
          amostras_filtradas_trim: discarded,
        };

        elDpBino.textContent  = finalDP.toFixed(1);
        elDpLeft.textContent  = finalLeft.toFixed(1) + " mm";
        elDpRight.textContent = finalRight.toFixed(1) + " mm";
        elFaceW.textContent   = finalFaceW.toFixed(1) + " mm";
        elPPM.textContent     = finalPPM.toFixed(3) + " px/mm";

        setStatus("✔ Medição Concluída com Sucesso!", "success");
        updateHint("done");

        elJsonOut.textContent = JSON.stringify(result, null, 2);
        elJsonWrap.style.display = "block";

        appendLog(`\n──────────────────────────────────`);
        appendLog(`✔ RESULTADO FINAL (${samples.length} amostras, ${discarded} removidas por trim):`);
        appendLog(`  DP Binocular : ${finalDP.toFixed(2)} mm`);
        appendLog(`  DP Esq.      : ${finalLeft.toFixed(2)} mm`);
        appendLog(`  DP Dir.      : ${finalRight.toFixed(2)} mm`);
        appendLog(`  Larg. Facial : ${finalFaceW.toFixed(2)} mm`);
        appendLog(`  Fator PPM    : ${finalPPM.toFixed(4)} px/mm`);

        lastFinalDP    = finalDP;
        lastFinalFaceW = finalFaceW;
        lastFinalLeft  = finalLeft;
        lastFinalRight = finalRight;

        renderRecomendacao(finalDP, finalFaceW, finalLeft, finalRight);
        releaseCamera();
      }

      // ─────────────────────────────────────────────────────────────────────────
      // MOTOR DE RECOMENDAÇÃO
      // ─────────────────────────────────────────────────────────────────────────
      function renderRecomendacao(dp, faceW, dpEsq, dpDir) {
        const payload = recomendarArmacao({
          dp_binocular:  dp,
          largura_rosto: faceW,
          formato_rosto: selectedFormato,
          dp_esq:        dpEsq,
          dp_dir:        dpDir,
        });

        if (payload.status !== "ok") {
          appendLog(`✖ Recomendação: ${payload.erros?.join("; ")}`);
          return;
        }

        const cl  = payload.classificacao;
        const ar  = payload.armacao_ref;
        const co  = payload.centragem_optica;
        const ha  = payload.harmonizacao_estetica;
        const obs = payload.observacoes_clinicas;

        elRecCat.textContent       = cl.categoria_label;
        elRecCat.style.background  = cl.cor_categoria + "22";
        elRecCat.style.color       = cl.cor_categoria;
        elRecCat.style.borderColor = cl.cor_categoria + "66";

        elRecLente.textContent = `${cl.lente_min_mm}–${cl.lente_max_mm} mm  (ideal: ${cl.lente_ideal_mm} mm)`;
        elRecTotal.textContent = `${ar.l_total_min_mm}–${ar.l_total_max_mm} mm  (alvo: ${ar.l_total_alvo_mm} mm)`;
        elRecPonte.textContent = `${ar.ponte_ref_mm} mm`;
        elRecDec.textContent   = co.assimetria_mm > 0.1
          ? `E ${co.decentramento_esq_mm > 0 ? "+" : ""}${co.decentramento_esq_mm} mm  /  D ${co.decentramento_dir_mm > 0 ? "+" : ""}${co.decentramento_dir_mm} mm`
          : "Simétrico — sem decentramento";

        elRecEstilos.innerHTML = ha.formatos_sugeridos
          .map(f => `<span class="style-pill style-ok">${f}</span>`).join("");
        elRecEvitar.innerHTML  = ha.formatos_evitar.length
          ? ha.formatos_evitar.map(f => `<span class="style-pill style-no">${f}</span>`).join("")
          : `<span class="style-pill style-none">Nenhum</span>`;

        elRecObs.innerHTML = obs.map(o => `<li>${o}</li>`).join("");
        elRecJson.textContent = JSON.stringify(payload, null, 2);

        elRecCard.style.display = "block";
        elRecCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
        appendLog(`✔ Recomendação gerada: ${cl.categoria_label} | Lentes ${cl.lente_min_mm}–${cl.lente_max_mm} mm`);
      }

      // ─────────────────────────────────────────────────────────────────────────
      // CONTROLES DE CAPTURA
      // ─────────────────────────────────────────────────────────────────────────
      elCapBtn.addEventListener("click", () => {
        if (isCapturing) return;
        samples = [];
        isCapturing = true;
        elProgress.style.width = "0%";
        elCapBtn.disabled = true;
        elCapBtn.textContent = "Medindo...";
        elDpStatusSub.textContent = "Coletando amostras biométricas...";
        elJsonWrap.style.display = "none";
        appendLog("▶ Coleta iniciada. Mantenha-se imóvel e olhando direto para a câmera.");
      });

      elResetBtn.addEventListener("click", () => {
        samples = [];
        isCapturing = false;
        currentHintKey = "";
        elCapBtn.disabled = false;
        elCapBtn.textContent = "Iniciar Medição";
        elProgress.style.width = "0%";
        elDpBino.textContent = "--";
        elDpStatusSub.textContent = "Aguardando medição";
        elDpLeft.textContent = "--";
        elDpRight.textContent = "--";
        elFaceW.textContent = "--";
        elJsonWrap.style.display = "none";
        elRecCard.style.display = "none";
        lastFinalDP = lastFinalFaceW = lastFinalLeft = lastFinalRight = null;
        elLogs.textContent = "Log reiniciado.\n";
        updateHint("no_face");

        if (!mediaStream) {
          appendLog("⟳ Reiniciando câmera...");
          initCamera();
        }
      });

      // ─────────────────────────────────────────────────────────────────────────
      // HELPERS DE UI
      // ─────────────────────────────────────────────────────────────────────────
      function setStatus(text, level) {
        elStatus.textContent = text;
        elStatus.className = `status-badge status-${level}`;
        elStatusDot.className = `status-dot dot-${level}`;
      }

      function appendLog(msg) {
        const ts = new Date().toLocaleTimeString("pt-BR", { hour12: false });
        elLogs.textContent += `[${ts}] ${msg}\n`;
        elLogs.scrollTop = elLogs.scrollHeight;
      }

      document.querySelectorAll(".fmt-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".fmt-btn").forEach(b => b.dataset.sel = "false");
          btn.dataset.sel = "true";
          selectedFormato = btn.dataset.fmt;
          if (lastFinalDP !== null) {
            renderRecomendacao(lastFinalDP, lastFinalFaceW, lastFinalLeft, lastFinalRight);
          }
        });
      });

      // ─────────────────────────────────────────────────────────────────────────
      // BOOT
      // ─────────────────────────────────────────────────────────────────────────
      initMediaPipe().catch(err => {
        setStatus(`Erro de inicialização: ${err.message}`, "danger");
        appendLog(`✖ Erro crítico: ${err.message}`);
      });
    </script>

    <!-- Estilos específicos do Método 1 (Hint Box) -->
    <style>
      #webcam, #output_canvas {
        transform: scaleX(-1);
      }

      .hint-box {
        position: absolute;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        border-radius: var(--radius-xl);
        background: rgba(6, 10, 18, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        pointer-events: none;
        max-width: 90%;
        transition: border-color 0.25s ease, background 0.25s ease;
      }

      .hint-box[data-level="success"]   { border-color: rgba(34, 197, 94, 0.4);  background: rgba(8, 28, 16, 0.9); }
      .hint-box[data-level="warning"]   { border-color: rgba(245, 158, 11, 0.4); background: rgba(28, 20, 8, 0.9); }
      .hint-box[data-level="danger"]    { border-color: rgba(239, 68, 68, 0.4);  background: rgba(28, 8, 8, 0.9); }
      .hint-box[data-level="primary"]   { border-color: rgba(59, 130, 246, 0.35); background: rgba(8, 16, 32, 0.9); }
      .hint-box[data-level="capturing"] { border-color: rgba(0, 229, 255, 0.6);  background: rgba(4, 24, 32, 0.92); box-shadow: 0 0 20px rgba(0, 229, 255, 0.25); }

      .hint-icon {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hint-icon svg { width: 100%; height: 100%; }
      .hint-box[data-level="success"]   .hint-icon svg { color: #4ade80; }
      .hint-box[data-level="warning"]   .hint-icon svg { color: #fbbf24; }
      .hint-box[data-level="danger"]    .hint-icon svg { color: #f87171; }
      .hint-box[data-level="primary"]   .hint-icon svg { color: #60a5fa; }
      .hint-box[data-level="capturing"] .hint-icon svg { color: #22d3ee; animation: capturing-pulse 0.9s ease-in-out infinite; }

      .hint-content { display: flex; flex-direction: column; gap: 1px; }
      .hint-text {
        font-size: 0.78rem;
        font-weight: 700;
        line-height: 1.2;
      }
      .hint-box[data-level="success"]   .hint-text { color: #86efac; }
      .hint-box[data-level="warning"]   .hint-text { color: #fcd34d; }
      .hint-box[data-level="danger"]    .hint-text { color: #fca5a5; }
      .hint-box[data-level="primary"]   .hint-text { color: #bfdbfe; }
      .hint-box[data-level="capturing"] .hint-text { color: #67e8f9; }

      .hint-sub {
        font-size: 0.65rem;
        font-weight: 400;
        color: rgba(200, 210, 230, 0.65);
        line-height: 1.2;
      }

      .hint-exit  { opacity: 0; transform: translateX(-50%) translateY(-4px); transition: opacity 0.15s ease, transform 0.15s ease; }
      .hint-enter { animation: hintIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      @keyframes hintIn {
        from { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.96); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1); }
      }
      @keyframes capturing-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.6; transform: scale(0.88); }
      }

      @media (max-width: 600px) {
        .hint-box {
          top: 8px;
          padding: 6px 10px;
          gap: 7px;
          max-width: 95%;
        }
        .hint-icon {
          width: 18px;
          height: 18px;
        }
        .hint-text {
          font-size: 0.72rem;
        }
        .hint-sub {
          font-size: 0.6rem;
        }
      }
    </style>
  </head>
  <body>

    <!-- ── Top Navigation Bar ────────────────────────────────────────────── -->
    <div class="app-nav-wrap">
      <nav class="app-nav">
        <a href="index.html" class="nav-brand">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <span class="brand-title">OptoBiometria</span>
          <span class="brand-badge">Lab</span>
        </a>

        <div class="nav-links">
          <a href="index.html" class="nav-item active" data-page="iris">
            <span class="nav-icon">👁️</span>
            <div class="nav-text">
              <span class="nav-name">Biometria Óptica</span>
              <span class="nav-desc">Depth-from-Iris</span>
            </div>
            <span class="nav-tag tag-auto">100% Óptico</span>
          </a>

          <a href="cartao.html" class="nav-item" data-page="cartao">
            <span class="nav-icon">💳</span>
            <div class="nav-text">
              <span class="nav-name">Cartão ID-1</span>
              <span class="nav-desc">OpenCV.js</span>
            </div>
            <span class="nav-tag tag-iso">Régua Dinâmica</span>
          </a>

          <a href="regua.html" class="nav-item" data-page="regua">
            <span class="nav-icon">📏</span>
            <div class="nav-text">
              <span class="nav-name">Régua Física</span>
              <span class="nav-desc">Calibração UI</span>
            </div>
            <span class="nav-tag tag-fallback">Fallback</span>
          </a>
        </div>
      </nav>
    </div>

    <!-- ── Header do Método ──────────────────────────────────────────────── -->
    <header>
      <div class="header-kicker">
        <div class="dot"></div>
        Método 1 · Biometria Óptica Pura
      </div>
      <h1>Medição por <span>Depth-from-Iris</span></h1>
      <p>
        Prova de conceito clínica sem referenciais externos. Utiliza o diâmetro transversal da íris humana (11.7 mm)
        para estimar o fator de escala euclidiano, com validação anti-paralaxe (Yaw/Roll) e taxa EAR.
      </p>
    </header>

    <div class="layout">

      <!-- ── Viewport da Câmera ──────────────────────────────────────────── -->
      <div class="viewport-wrap">
        <video id="webcam" autoplay playsinline muted></video>
        <canvas id="output_canvas"></canvas>

        <!-- Dica Visual Contextual (topo central) -->
        <div id="hint_box" class="hint-box" data-level="primary">
          <div id="hint_icon" class="hint-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <div class="hint-content">
            <div id="hint_text" class="hint-text">Inicializando modelos...</div>
            <div id="hint_sub"  class="hint-sub">Aguarde o carregamento do MediaPipe</div>
          </div>
        </div>

        <!-- Legenda dos Landmarks -->
        <div class="lm-legend">
          <div class="lm-legend-item"><div class="lm-dot" style="background:#00e5ff;"></div> Pupilas (468, 473)</div>
          <div class="lm-legend-item"><div class="lm-dot" style="background:#f59e0b;"></div> Dorso Nasal (168)</div>
          <div class="lm-legend-item"><div class="lm-dot" style="background:#fb923c;"></div> Zigomáticos (234, 454)</div>
        </div>

        <!-- HUD de status sobreposto -->
        <div class="hud-overlay">
          <div class="hud-status-group">
            <div id="status_dot" class="status-dot dot-primary"></div>
            <div id="status" class="status-badge status-primary">Inicializando modelos...</div>
          </div>
        </div>

        <!-- Barra de progresso da coleta -->
        <div class="progress-track">
          <div id="progress_bar"></div>
        </div>
      </div>

      <!-- ── Painel de Resultados & Diagnósticos ────────────────────────── -->
      <div class="panel">

        <!-- DP Binocular — Métrica Principal em Destaque -->
        <div class="card dp-main" id="dp_main_card">
          <div class="dp-label">Distância Pupilar Binocular</div>
          <div class="dp-value-wrap">
            <span id="dp_bino" class="dp-value">--</span><span class="dp-unit"> mm</span>
          </div>
          <div class="dp-sub" id="dp_status_sub">Aguardando medição</div>
        </div>

        <!-- Métricas Biométricas Detalhadas -->
        <div class="card" id="metrics_card">
          <div class="card-title">Métricas Biométricas</div>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="m-label">DP Olho Esq.</div>
              <div class="m-val" id="dp_left">--</div>
            </div>
            <div class="metric-item">
              <div class="m-label">DP Olho Dir.</div>
              <div class="m-val" id="dp_right">--</div>
            </div>
            <div class="metric-item">
              <div class="m-label">Largura Facial (Zigomática)</div>
              <div class="m-val" id="face_width">--</div>
            </div>
            <div class="metric-item">
              <div class="m-label">Fator de Escala (PPM)</div>
              <div class="m-val" id="ppm_val">--</div>
            </div>
            <div class="metric-item full-width">
              <div class="m-label">Referencial de Escala</div>
              <div class="m-val" id="ref_scale_val" style="font-size:0.75rem; color:var(--accent);">Íris Humana: 11.70 mm</div>
            </div>
          </div>
        </div>

        <!-- Diagnósticos em Tempo Real -->
        <div class="card">
          <div class="card-title">Diagnósticos em Tempo Real</div>
          <div class="diag-list">
            <div class="diag-row">
              <span class="diag-key">EAR médio (Abertura Ocular)</span>
              <span class="diag-val" id="ear_val">--</span>
            </div>
            <div class="diag-row">
              <span class="diag-key">Yaw (Rotação / Assimetria)</span>
              <span class="diag-val" id="yaw_val">--</span>
            </div>
            <div class="diag-row">
              <span class="diag-key">Roll (Inclinação Lateral)</span>
              <span class="diag-val" id="roll_val">--</span>
            </div>
            <div class="diag-row">
              <span class="diag-key">Status de Alinhamento</span>
              <span class="diag-val" id="align_val">--</span>
            </div>
          </div>
        </div>

        <!-- Controles -->
        <div class="btn-group">
          <button id="capture_btn" class="btn-primary">▶ Iniciar Medição</button>
          <button id="reset_btn" class="btn-secondary">↺ Reset</button>
        </div>

        <!-- Harmonização Estética (Formato Facial) -->
        <div class="card">
          <div class="card-title">Harmonização Estética (Formato Facial)</div>
          <div class="fmt-grid">
            <button class="fmt-btn" data-fmt="redondo"    data-sel="false"><span class="fmt-icon">⭕</span><span class="fmt-name">Redondo</span></button>
            <button class="fmt-btn" data-fmt="quadrado"   data-sel="false"><span class="fmt-icon">⬜</span><span class="fmt-name">Quadrado</span></button>
            <button class="fmt-btn" data-fmt="oval"       data-sel="false"><span class="fmt-icon">⬭</span><span class="fmt-name">Oval</span></button>
            <button class="fmt-btn" data-fmt="triangular" data-sel="false"><span class="fmt-icon">🔻</span><span class="fmt-name">Triangular</span></button>
            <button class="fmt-btn" data-fmt="losango"    data-sel="false"><span class="fmt-icon">◇</span><span class="fmt-name">Losango</span></button>
            <button class="fmt-btn" data-fmt="neutro"     data-sel="true"><span class="fmt-icon">—</span><span class="fmt-name">Não sei</span></button>
          </div>
          <p class="fmt-helper">
            Selecione para enriquecer a recomendação estética da armação com contraste morfológico.
          </p>
        </div>

        <!-- Recomendação de Armação Oftálmica -->
        <div class="card" id="rec_card" style="display:none;">
          <div class="card-title">Recomendação de Armação Oftálmica</div>

          <div id="rec_cat" class="rec-cat-badge">—</div>

          <div class="rec-rows">
            <div class="rec-row">
              <span class="rec-key">Lentes recomendadas</span>
              <span class="rec-val" id="rec_lente">--</span>
            </div>
            <div class="rec-row">
              <span class="rec-key">Largura Total da Armação</span>
              <span class="rec-val" id="rec_total">--</span>
            </div>
            <div class="rec-row">
              <span class="rec-key">Ponte Nasal de Referência</span>
              <span class="rec-val" id="rec_ponte">--</span>
            </div>
            <div class="rec-row">
              <span class="rec-key">Decentramento Óptico</span>
              <span class="rec-val" id="rec_dec">--</span>
            </div>
          </div>

          <div style="margin-top:12px;">
            <div class="card-title" style="margin-bottom:6px;">Formatos Sugeridos</div>
            <div class="style-pills" id="rec_estilos"></div>
          </div>

          <div style="margin-top:10px;">
            <div class="card-title" style="margin-bottom:6px;">Formatos a Evitar</div>
            <div class="style-pills" id="rec_evitar"></div>
          </div>

          <div style="margin-top:12px;">
            <div class="card-title" style="margin-bottom:4px;">Notas e Alertas Clínicos</div>
            <ul id="rec_obs"></ul>
          </div>

          <pre id="rec_json"></pre>
        </div>

        <!-- Log de Eventos -->
        <div class="card">
          <div class="card-title">Log de Execução</div>
          <div id="logs">Aguardando inicialização do MediaPipe...\n</div>
        </div>

        <!-- JSON Output -->
        <div class="card json-card" id="json_wrap">
          <div class="card-title">Payload JSON Estruturado</div>
          <pre id="json_output"></pre>
        </div>

      </div>
    </div>
  </body>
</html>


----
MEDIÇÂO Régua

<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Régua Física (Calibração Manual) — OptoBiometria</title>
    <meta name="description" content="Medição de distância pupilar com calibração assistida por interface e régua física como fallback robusto para situações sem OpenCV." />

    <!-- Shared Design System -->
    <link rel="stylesheet" href="./style.css" />

    <!-- MediaPipe Tasks Vision (ES Module) + Lógica Principal -->
    <script type="module">
      import { FaceLandmarker, FilesetResolver } from
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
      import { recomendarArmacao, FORMATOS_ROSTO } from "./recomendacao.js";

      // ───────────────────────────────────────────────────────────────────────
      // CONSTANTES E ÍNDICES DE LANDMARKS
      // ───────────────────────────────────────────────────────────────────────
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

      // ───────────────────────────────────────────────────────────────────────
      // REFERÊNCIAS DOM
      // ───────────────────────────────────────────────────────────────────────
      const videoEl       = document.getElementById("webcam");
      const canvasEl      = document.getElementById("overlay_canvas");
      const ctx           = canvasEl.getContext("2d");

      const elStatus      = document.getElementById("status");
      const elStatusDot   = document.getElementById("status_dot");
      const elLogs        = document.getElementById("logs");

      // Calibração
      const elCalibWrap   = document.getElementById("calib_wrap");
      const elGuideL      = document.getElementById("guide_left"); 
      const elGuideR      = document.getElementById("guide_right");
      const elSliderL     = document.getElementById("slider_left");
      const elSliderR     = document.getElementById("slider_right");
      const elCalibBtn    = document.getElementById("calib_btn");
      const elCalibInfo   = document.getElementById("calib_info");
      const elRecalibBtn  = document.getElementById("recalib_btn");

      // Métricas e Resultados Padronizados
      const elDpBino      = document.getElementById("dp_bino");
      const elDpStatusSub = document.getElementById("dp_status_sub");
      const elDpLeft      = document.getElementById("dp_left");
      const elDpRight     = document.getElementById("dp_right");
      const elFaceW       = document.getElementById("face_width");
      const elPPM         = document.getElementById("ppm_val");
      const elRefScale    = document.getElementById("ref_scale_val");

      // Diagnósticos em tempo real
      const elEarVal      = document.getElementById("ear_val");
      const elYawVal      = document.getElementById("yaw_val");
      const elRollVal     = document.getElementById("roll_val");
      const elAlignVal    = document.getElementById("align_val");

      // Recomendação
      const elRecCard     = document.getElementById("rec_card");
      const elRecCat      = document.getElementById("rec_cat");
      const elRecLente    = document.getElementById("rec_lente");
      const elRecTotal    = document.getElementById("rec_total");
      const elRecPonte    = document.getElementById("rec_ponte");
      const elRecDec      = document.getElementById("rec_dec");
      const elRecEstilos  = document.getElementById("rec_estilos");
      const elRecEvitar   = document.getElementById("rec_evitar");
      const elRecObs      = document.getElementById("rec_obs");
      const elRecJson     = document.getElementById("rec_json");

      // JSON + Log
      const elJsonWrap    = document.getElementById("json_wrap");
      const elJsonOut     = document.getElementById("json_output");

      // ───────────────────────────────────────────────────────────────────────
      // ESTADO GLOBAL
      // ───────────────────────────────────────────────────────────────────────
      let faceLandmarker  = null;
      let mediaStream     = null;
      let animId          = null;
      let lastVt          = -1;
      let ppmCalibrated   = null;
      let isCalibrated    = false;
      let selectedFormato = "neutro";

      let samples         = [];
      const SAMPLE_MAX    = 120;
      const SAMPLE_WINDOW = 30;

      // ───────────────────────────────────────────────────────────────────────
      // UTILITÁRIOS MATEMÁTICOS
      // ───────────────────────────────────────────────────────────────────────
      const dist2D = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

      function calcEAR(t1, t2, b1, b2, inner, outer) {
        const v = (dist2D(t1, b1) + dist2D(t2, b2)) / 2;
        const h = dist2D(inner, outer);
        return h > 0 ? v / h : 0;
      }

      function rollAngle(pL, pR) {
        return Math.atan2(pR.y - pL.y, pR.x - pL.x) * (180 / Math.PI);
      }

      // ───────────────────────────────────────────────────────────────────────
      // INICIALIZAÇÃO
      // ───────────────────────────────────────────────────────────────────────
      async function init() {
        try {
          setStatus("Carregando MediaPipe...", "primary");
          appendLog("⟳ Carregando MediaPipe Face Landmarker (GPU)...");

          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
          );
          faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          });
          appendLog("✔ MediaPipe Face Landmarker pronto.");

          setStatus("Acessando câmera...", "primary");
          appendLog("⟳ Solicitando acesso à câmera frontal...");

          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "user" },
              width:      { ideal: 1280 },
              height:     { ideal: 720 },
              frameRate:  { min: 30, ideal: 60 },
            },
          });

          videoEl.srcObject = mediaStream;
          await new Promise(r => videoEl.addEventListener("loadeddata", r, { once: true }));

          appendLog("✔ Câmera ativa. Aguardando calibração da régua.");
          setStatus("Posicione a régua e calibre.", "primary");
          elRefScale.textContent = "Régua Física: Calibração 10.0 cm (100 mm)";
          initSliders();
          renderLoop();

        } catch (err) {
          appendLog(`✖ Erro de inicialização: ${err.name} — ${err.message}`);
          setStatus(`Erro: ${err.message}`, "danger");
        }
      }

      // ───────────────────────────────────────────────────────────────────────
      // SLIDERS DE CALIBRAÇÃO
      // ───────────────────────────────────────────────────────────────────────
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

        const containerW = elCalibWrap.offsetWidth;
        const distPx = Math.abs(rPct - lPct) / 100 * containerW;
        elCalibInfo.textContent = `Distância: ${distPx.toFixed(0)} px (marca de 10 cm)`;
      }

      // ───────────────────────────────────────────────────────────────────────
      // CONFIRMAR CALIBRAÇÃO
      // ───────────────────────────────────────────────────────────────────────
      function confirmCalibration() {
        const lPct = parseFloat(elSliderL.value);
        const rPct = parseFloat(elSliderR.value);

        const vw = videoEl.videoWidth  || 1280;
        const vh = videoEl.videoHeight || 720;
        const containerW = elCalibWrap.offsetWidth;
        const containerH = elCalibWrap.offsetHeight;

        const scaleX = containerW / vw;
        const scaleY = containerH / vh;
        const scale  = Math.max(scaleX, scaleY);
        const renderedW = vw * scale;
        const offsetX   = (renderedW - containerW) / 2;

        const guideLeftPx  = (lPct / 100 * containerW + offsetX) / scale;
        const guideRightPx = (rPct / 100 * containerW + offsetX) / scale;

        const distPx = Math.abs(guideRightPx - guideLeftPx);

        if (distPx < 30) {
          appendLog("✖ Guias muito próximas. Reposicione.");
          setStatus("Guias muito próximas — reposicione.", "danger");
          return;
        }

        ppmCalibrated = distPx / CALIBRATION_MM;
        isCalibrated  = true;
        samples       = [];

        appendLog(`✔ Calibração confirmada:`);
        appendLog(`   Distância entre guias: ${distPx.toFixed(1)} px (vídeo real)`);
        appendLog(`   PPM = ${distPx.toFixed(1)} ÷ ${CALIBRATION_MM} = ${ppmCalibrated.toFixed(4)} px/mm`);

        setStatus("✔ Calibrado! Medindo DP em tempo real...", "success");
        elCalibWrap.classList.add("calibrated");
        elRecalibBtn.style.display = "inline-flex";
        elPPM.textContent     = ppmCalibrated.toFixed(3) + " px/mm";
        elDpStatusSub.textContent = "✔ Calibração Ativa — Medição em Tempo Real";
        elRefScale.textContent = `Régua: ${distPx.toFixed(0)}px = 100.0 mm (${ppmCalibrated.toFixed(4)} px/mm)`;
      }

      // ───────────────────────────────────────────────────────────────────────
      // LOOP DE RENDERIZAÇÃO
      // ───────────────────────────────────────────────────────────────────────
      function renderLoop() {
        animId = requestAnimationFrame(renderLoop);
        if (!faceLandmarker || videoEl.readyState < 2) return;
        if (videoEl.currentTime === lastVt) return;
        lastVt = videoEl.currentTime;

        const vw = videoEl.videoWidth  || 1280;
        const vh = videoEl.videoHeight || 720;
        canvasEl.width  = vw;
        canvasEl.height = vh;
        ctx.clearRect(0, 0, vw, vh);

        const res = faceLandmarker.detectForVideo(videoEl, performance.now());
        if (!res.faceLandmarks?.length) {
          elAlignVal.textContent = "Sem rosto";
          elAlignVal.style.color = "var(--danger)";
          return;
        }

        const lm = res.faceLandmarks[0];
        const px = (i) => ({ x: lm[i].x * vw, y: lm[i].y * vh });

        const pL = px(LM_PUPIL_L), pR = px(LM_PUPIL_R);
        const zL = px(LM_ZYGO_L),  zR = px(LM_ZYGO_R);
        const nD = px(LM_NOSE_DORSUM);

        // ── Diagnósticos em Tempo Real ─────────────────────────────────────
        const earL = calcEAR(px(LM_EAR_L_TOP1), px(LM_EAR_L_TOP2),
                             px(LM_EAR_L_BOT1), px(LM_EAR_L_BOT2),
                             px(LM_EAR_L_INNER), px(LM_EAR_L_OUTER));
        const earR = calcEAR(px(LM_EAR_R_TOP1), px(LM_EAR_R_TOP2),
                             px(LM_EAR_R_BOT1), px(LM_EAR_R_BOT2),
                             px(LM_EAR_R_INNER), px(LM_EAR_R_OUTER));
        const earAvg = (earL + earR) / 2;
        elEarVal.textContent  = earAvg.toFixed(3);

        const rollDeg = Math.abs(rollAngle(pL, pR));
        elRollVal.textContent = rollDeg.toFixed(1) + "°";

        const dpLPx = Math.abs(pL.x - nD.x);
        const dpRPx = Math.abs(pR.x - nD.x);
        const dpSum = dpLPx + dpRPx;
        const yawAsym = dpSum > 0 ? Math.abs(dpLPx - dpRPx) / dpSum : 1;
        elYawVal.textContent = (yawAsym * 100).toFixed(1) + "%";

        if (rollDeg <= 6.0 && yawAsym <= 0.08 && earAvg >= 0.22) {
          elAlignVal.textContent = "Alinhado";
          elAlignVal.style.color = "var(--success)";
        } else {
          elAlignVal.textContent = "Ajuste postura";
          elAlignVal.style.color = "var(--warning)";
        }

        // ── Desenhar Overlay ───────────────────────────────────────────────
        drawLandmarks(pL, pR, zL, zR, nD, vw, vh);

        // ── Medição Contínua (pós-calibração) ──────────────────────────────
        if (isCalibrated && ppmCalibrated > 0) {
          const dpPx     = dist2D(pL, pR);
          const dpMm     = dpPx / ppmCalibrated;
          const dpLeftMm = dpLPx / ppmCalibrated;
          const dpRightMm= dpRPx / ppmCalibrated;
          const faceWMm  = dist2D(zL, zR) / ppmCalibrated;

          samples.push({ dpMm, dpLeftMm, dpRightMm, faceWMm });
          if (samples.length > SAMPLE_MAX) samples.shift();

          const window  = samples.slice(-SAMPLE_WINDOW);
          const avg     = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
          const avgDP   = avg(window.map(s => s.dpMm));
          const avgDPL  = avg(window.map(s => s.dpLeftMm));
          const avgDPR  = avg(window.map(s => s.dpRightMm));
          const avgFW   = avg(window.map(s => s.faceWMm));

          elDpBino.textContent    = avgDP.toFixed(1);
          elDpLeft.textContent    = avgDPL.toFixed(1) + " mm";
          elDpRight.textContent   = avgDPR.toFixed(1) + " mm";
          elFaceW.textContent     = avgFW.toFixed(1) + " mm";

          if (samples.length % 30 === 0 || samples.length === SAMPLE_WINDOW) {
            renderRecomendacao(avgDP, avgFW, avgDPL, avgDPR);
          }

          // Badge flutuante sobre as pupilas no Canvas
          ctx.font         = "600 15px Inter, sans-serif";
          ctx.fillStyle    = "rgba(0,229,255,0.95)";
          ctx.textAlign    = "center";
          ctx.textBaseline = "bottom";
          const midX = (pL.x + pR.x) / 2;
          const midY = Math.min(pL.y, pR.y) - 12;
          ctx.fillText(`DP: ${avgDP.toFixed(1)} mm`, midX, midY);
        }
      }

      function drawLandmarks(pL, pR, zL, zR, nD, vw, vh) {
        ctx.beginPath();
        ctx.moveTo(pL.x, pL.y);
        ctx.lineTo(pR.x, pR.y);
        ctx.strokeStyle = isCalibrated ? "rgba(34,197,94,0.9)" : "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        [pL, pR].forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "#00e5ff";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0,229,255,0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(nD.x, nD.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();

        [zL, zR].forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#fb923c";
          ctx.fill();
        });
      }

      // ─────────────────────────────────────────────────────────────────────────
      // MOTOR DE RECOMENDAÇÃO
      // ─────────────────────────────────────────────────────────────────────────
      function renderRecomendacao(dp, faceW, dpEsq, dpDir) {
        const payload = recomendarArmacao({
          dp_binocular:  dp,
          largura_rosto: faceW,
          formato_rosto: selectedFormato,
          dp_esq:        dpEsq,
          dp_dir:        dpDir,
        });

        if (payload.status !== "ok") {
          appendLog(`✖ Recomendação: ${payload.erros?.join("; ")}`);
          return;
        }

        const cl  = payload.classificacao;
        const ar  = payload.armacao_ref;
        const co  = payload.centragem_optica;
        const ha  = payload.harmonizacao_estetica;
        const obs = payload.observacoes_clinicas;

        elRecCat.textContent       = cl.categoria_label;
        elRecCat.style.background  = cl.cor_categoria + "22";
        elRecCat.style.color       = cl.cor_categoria;
        elRecCat.style.borderColor = cl.cor_categoria + "66";

        elRecLente.textContent = `${cl.lente_min_mm}–${cl.lente_max_mm} mm  (ideal: ${cl.lente_ideal_mm} mm)`;
        elRecTotal.textContent = `${ar.l_total_min_mm}–${ar.l_total_max_mm} mm  (alvo: ${ar.l_total_alvo_mm} mm)`;
        elRecPonte.textContent = `${ar.ponte_ref_mm} mm`;
        elRecDec.textContent   = co.assimetria_mm > 0.1
          ? `E ${co.decentramento_esq_mm > 0 ? "+" : ""}${co.decentramento_esq_mm} mm  /  D ${co.decentramento_dir_mm > 0 ? "+" : ""}${co.decentramento_dir_mm} mm`
          : "Simétrico — sem decentramento";

        elRecEstilos.innerHTML = ha.formatos_sugeridos
          .map(f => `<span class="style-pill style-ok">${f}</span>`).join("");
        elRecEvitar.innerHTML  = ha.formatos_evitar.length
          ? ha.formatos_evitar.map(f => `<span class="style-pill style-no">${f}</span>`).join("")
          : `<span class="style-pill style-none">Nenhum</span>`;

        elRecObs.innerHTML    = obs.map(o => `<li>${o}</li>`).join("");
        elRecJson.textContent = JSON.stringify(payload, null, 2);
        elJsonOut.textContent = JSON.stringify(payload, null, 2);
        elJsonWrap.style.display = "block";

        elRecCard.style.display = "block";
      }

      // ───────────────────────────────────────────────────────────────────────
      // HELPERS DE UI
      // ───────────────────────────────────────────────────────────────────────
      function setStatus(text, level) {
        elStatus.textContent  = text;
        elStatus.className    = `status-badge status-${level}`;
        elStatusDot.className = `status-dot dot-${level}`;
      }

      function appendLog(msg) {
        const ts = new Date().toLocaleTimeString("pt-BR", { hour12: false });
        elLogs.textContent += `[${ts}] ${msg}\n`;
        elLogs.scrollTop = elLogs.scrollHeight;
      }

      // ───────────────────────────────────────────────────────────────────────
      // EVENT LISTENERS
      // ───────────────────────────────────────────────────────────────────────
      elCalibBtn.addEventListener("click", confirmCalibration);

      elRecalibBtn.addEventListener("click", () => {
        isCalibrated  = false;
        ppmCalibrated = null;
        samples       = [];
        elCalibWrap.classList.remove("calibrated");
        elRecalibBtn.style.display = "none";
        elRecCard.style.display     = "none";
        elJsonWrap.style.display    = "none";
        elDpBino.textContent = elDpLeft.textContent = elDpRight.textContent = elFaceW.textContent = elPPM.textContent = "--";
        elDpStatusSub.textContent = "Aguardando calibração";
        setStatus("Reposicione a régua e calibre.", "primary");
        appendLog("↺ Calibração reiniciada.");
      });

      document.querySelectorAll(".fmt-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".fmt-btn").forEach(b => b.dataset.sel = "false");
          btn.dataset.sel = "true";
          selectedFormato = btn.dataset.fmt;
          if (samples.length >= SAMPLE_WINDOW) {
            const window = samples.slice(-SAMPLE_WINDOW);
            const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
            renderRecomendacao(
              avg(window.map(s => s.dpMm)),
              avg(window.map(s => s.faceWMm)),
              avg(window.map(s => s.dpLeftMm)),
              avg(window.map(s => s.dpRightMm))
            );
          }
        });
      });

      // ───────────────────────────────────────────────────────────────────────
      // BOOT
      // ───────────────────────────────────────────────────────────────────────
      init();
    </script>

    <!-- Estilos específicos do Método 3 (Sliders & Guias) -->
    <style>
      #overlay_canvas { pointer-events: none; z-index: 5; }

      .guide {
        position: absolute;
        top: 0; bottom: 0;
        width: 2px;
        z-index: 10;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .guide::before {
        content: "";
        position: absolute;
        inset: 0;
        width: 2px;
      }
      .guide-left::before  { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
      .guide-right::before { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

      .guide-label {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        white-space: nowrap;
        letter-spacing: 0.06em;
      }
      .guide-left  .guide-label { background: rgba(34,197,94,0.9); color: #fff; }
      .guide-right .guide-label { background: rgba(239,68,68,0.9); color: #fff; }

      .calibrated .guide,
      .calibrated .calib-sliders { opacity: 0.15; pointer-events: none; }

      .calib-sliders {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        z-index: 15;
        background: linear-gradient(transparent, rgba(6, 10, 18, 0.95) 30%);
        padding: 16px 16px 12px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .slider-row {
        display: flex; align-items: center; gap: 10px;
      }
      .slider-row label {
        font-size: 0.72rem; font-weight: 700; min-width: 45px;
      }
      .slider-row label.label-l { color: #86efac; }
      .slider-row label.label-r { color: #fca5a5; }
      .slider-row input[type="range"] {
        flex: 1; height: 6px;
        -webkit-appearance: none; appearance: none;
        background: var(--border); border-radius: 3px; outline: none;
      }
      .slider-row input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 20px; height: 20px;
        border-radius: 50%; cursor: pointer;
      }
      .slider-l::-webkit-slider-thumb { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
      .slider-r::-webkit-slider-thumb { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

      .calib-bottom {
        display: flex; align-items: center; gap: 10px;
        justify-content: space-between;
      }
      #calib_info {
        font-size: 0.68rem; color: var(--text-muted);
        font-family: var(--font-mono); font-variant-numeric: tabular-nums;
      }

      .instr-overlay {
        position: absolute; bottom: 105px; left: 50%; transform: translateX(-50%);
        z-index: 11; pointer-events: none;
        background: rgba(6, 10, 18, 0.85); backdrop-filter: blur(8px);
        padding: 6px 14px; border-radius: var(--radius-sm);
        border: 1px solid rgba(245, 158, 11, 0.35);
        font-size: 0.72rem; font-weight: 600; color: #fcd34d;
        text-align: center; max-width: 90%; line-height: 1.4;
      }
      .calibrated .instr-overlay { display: none; }

      @media (max-width: 600px) {
        .instr-overlay {
          bottom: 90px;
          font-size: 0.65rem;
          padding: 4px 10px;
          max-width: 95%;
        }
        .calib-sliders {
          padding: 10px 10px 8px;
          gap: 6px;
        }
        .slider-row {
          gap: 6px;
        }
        .slider-row label {
          font-size: 0.66rem;
          min-width: 36px;
        }
        .slider-row input[type="range"]::-webkit-slider-thumb {
          width: 22px;
          height: 22px;
        }
        .calib-bottom {
          gap: 6px;
        }
        #calib_info {
          font-size: 0.62rem;
        }
        #calib_btn {
          padding: 7px 12px;
          font-size: 0.76rem;
          min-height: 38px;
        }
      }
    </style>
  </head>

  <body>

    <!-- ── Top Navigation Bar ────────────────────────────────────────────── -->
    <div class="app-nav-wrap">
      <nav class="app-nav">
        <a href="index.html" class="nav-brand">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <span class="brand-title">OptoBiometria</span>
          <span class="brand-badge">Lab</span>
        </a>

        <div class="nav-links">
          <a href="index.html" class="nav-item" data-page="iris">
            <span class="nav-icon">👁️</span>
            <div class="nav-text">
              <span class="nav-name">Biometria Óptica</span>
              <span class="nav-desc">Depth-from-Iris</span>
            </div>
            <span class="nav-tag tag-auto">100% Óptico</span>
          </a>

          <a href="cartao.html" class="nav-item" data-page="cartao">
            <span class="nav-icon">💳</span>
            <div class="nav-text">
              <span class="nav-name">Cartão ID-1</span>
              <span class="nav-desc">OpenCV.js</span>
            </div>
            <span class="nav-tag tag-iso">Régua Dinâmica</span>
          </a>

          <a href="regua.html" class="nav-item active" data-page="regua">
            <span class="nav-icon">📏</span>
            <div class="nav-text">
              <span class="nav-name">Régua Física</span>
              <span class="nav-desc">Calibração UI</span>
            </div>
            <span class="nav-tag tag-fallback">Fallback</span>
          </a>
        </div>
      </nav>
    </div>

    <!-- ── Header do Método ──────────────────────────────────────────────── -->
    <header>
      <div class="header-kicker">
        <div class="dot" style="background:var(--warning);"></div>
        Método 3 · Calibração Assistida por Interface
      </div>
      <h1>Medição por <span style="color:var(--warning);">Régua Física</span></h1>
      <p>
        Método de fallback manual. O usuário posiciona uma régua física na testa e ajusta as guias de 0 cm e 10 cm (100 mm).
        O sistema calibra o fator PPM de forma assistida pela interface e realiza a medição contínua via MediaPipe.
      </p>
    </header>

    <div class="layout">

      <!-- ── Viewport da Câmera ──────────────────────────────────────────── -->
      <div class="viewport-wrap" id="calib_wrap">
        <video id="webcam" autoplay playsinline muted></video>
        <canvas id="overlay_canvas"></canvas>

        <!-- Legenda dos Landmarks -->
        <div class="lm-legend">
          <div class="lm-legend-item"><div class="lm-dot" style="background:#00e5ff;"></div> Pupilas (468, 473)</div>
          <div class="lm-legend-item"><div class="lm-dot" style="background:#f59e0b;"></div> Dorso Nasal (168)</div>
          <div class="lm-legend-item"><div class="lm-dot" style="background:#fb923c;"></div> Zigomáticos (234, 454)</div>
        </div>

        <!-- HUD de status sobreposto -->
        <div class="hud-overlay">
          <div class="hud-status-group">
            <div id="status_dot" class="status-dot dot-primary"></div>
            <div id="status" class="status-badge status-primary">Inicializando...</div>
          </div>
        </div>

        <!-- Instrução flutuante -->
        <div class="instr-overlay">
          📏 Posicione a régua na testa. Ajuste os sliders sobre 0 cm e 10 cm.
        </div>

        <!-- Guias visuais -->
        <div id="guide_left" class="guide guide-left" style="left:30%;">
          <div class="guide-label">0 cm (Esq)</div>
        </div>
        <div id="guide_right" class="guide guide-right" style="left:70%;">
          <div class="guide-label">10 cm (Dir)</div>
        </div>

        <!-- Sliders de calibração -->
        <div class="calib-sliders">
          <div class="slider-row">
            <label class="label-l">0 cm</label>
            <input type="range" id="slider_left" class="slider-l" min="2" max="98" value="30" step="0.1">
          </div>
          <div class="slider-row">
            <label class="label-r">10 cm</label>
            <input type="range" id="slider_right" class="slider-r" min="2" max="98" value="70" step="0.1">
          </div>
          <div class="calib-bottom">
            <span id="calib_info">Distância: -- px</span>
            <button id="calib_btn" class="btn-warning">✓ Confirmar Calibração</button>
          </div>
        </div>
      </div>

      <!-- ── Painel de Resultados & Diagnósticos ────────────────────────── -->
      <div class="panel">

        <!-- Instruções de Calibração -->
        <div class="card">
          <div class="card-title">Instruções de Calibração</div>
          <ol style="font-size:0.75rem; color:var(--text-muted); padding-left:18px; line-height:1.75;">
            <li>Posicione uma régua <strong>plana</strong> na testa ou queixo.</li>
            <li>Arraste o slider <span style="color:#86efac; font-weight:700;">verde (0 cm)</span> para a marca 0 cm.</li>
            <li>Arraste o slider <span style="color:#fca5a5; font-weight:700;">vermelho (10 cm)</span> para a marca 10 cm.</li>
            <li>Clique em <strong>"Confirmar Calibração"</strong> para medir a DP.</li>
          </ol>
        </div>

        <!-- DP Binocular — Métrica Principal em Destaque -->
        <div class="card dp-main" id="dp_main_card">
          <div class="dp-label">Distância Pupilar Binocular</div>
          <div class="dp-value-wrap">
            <span id="dp_bino" class="dp-value">--</span><span class="dp-unit"> mm</span>
          </div>
          <div class="dp-sub" id="dp_status_sub">Aguardando calibração</div>
        </div>

        <!-- Métricas Biométricas Detalhadas -->
        <div class="card" id="metrics_card">
          <div class="card-title">Métricas Biométricas</div>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="m-label">DP Olho Esq.</div>
              <div class="m-val" id="dp_left">--</div>
            </div>
            <div class="metric-item">
              <div class="m-label">DP Olho Dir.</div>
              <div class="m-val" id="dp_right">--</div>
            </div>
            <div class="metric-item">
              <div class="m-label">Largura Facial (Zigomática)</div>
              <div class="m-val" id="face_width">--</div>
            </div>
            <div class="metric-item">
              <div class="m-label">Fator de Escala (PPM)</div>
              <div class="m-val" id="ppm_val">--</div>
            </div>
            <div class="metric-item full-width">
              <div class="m-label">Referencial de Escala</div>
              <div class="m-val" id="ref_scale_val" style="font-size:0.72rem; color:var(--warning);">Régua Física: Calibração 10.0 cm (100 mm)</div>
            </div>
          </div>
        </div>

        <!-- Diagnósticos em Tempo Real -->
        <div class="card">
          <div class="card-title">Diagnósticos em Tempo Real</div>
          <div class="diag-list">
            <div class="diag-row">
              <span class="diag-key">EAR médio (Abertura Ocular)</span>
              <span class="diag-val" id="ear_val">--</span>
            </div>
            <div class="diag-row">
              <span class="diag-key">Yaw (Rotação / Assimetria)</span>
              <span class="diag-val" id="yaw_val">--</span>
            </div>
            <div class="diag-row">
              <span class="diag-key">Roll (Inclinação Lateral)</span>
              <span class="diag-val" id="roll_val">--</span>
            </div>
            <div class="diag-row">
              <span class="diag-key">Status de Alinhamento</span>
              <span class="diag-val" id="align_val">--</span>
            </div>
          </div>
        </div>

        <!-- Controles -->
        <div class="btn-group" style="grid-template-columns: 1fr;">
          <button id="recalib_btn" class="btn-secondary" style="display:none;">↺ Recalibrar Régua</button>
        </div>

        <!-- Harmonização Estética (Formato Facial) -->
        <div class="card">
          <div class="card-title">Harmonização Estética (Formato Facial)</div>
          <div class="fmt-grid">
            <button class="fmt-btn" data-fmt="redondo"    data-sel="false"><span class="fmt-icon">⭕</span><span class="fmt-name">Redondo</span></button>
            <button class="fmt-btn" data-fmt="quadrado"   data-sel="false"><span class="fmt-icon">⬜</span><span class="fmt-name">Quadrado</span></button>
            <button class="fmt-btn" data-fmt="oval"       data-sel="false"><span class="fmt-icon">⬭</span><span class="fmt-name">Oval</span></button>
            <button class="fmt-btn" data-fmt="triangular" data-sel="false"><span class="fmt-icon">🔻</span><span class="fmt-name">Triangular</span></button>
            <button class="fmt-btn" data-fmt="losango"    data-sel="false"><span class="fmt-icon">◇</span><span class="fmt-name">Losango</span></button>
            <button class="fmt-btn" data-fmt="neutro"     data-sel="true"><span class="fmt-icon">—</span><span class="fmt-name">Não sei</span></button>
          </div>
          <p class="fmt-helper">
            Selecione antes ou após calibrar para personalizar a recomendação ótica.
          </p>
        </div>

        <!-- Recomendação de Armação Oftálmica -->
        <div class="card" id="rec_card" style="display:none;">
          <div class="card-title">Recomendação de Armação Oftálmica</div>

          <div id="rec_cat" class="rec-cat-badge">—</div>

          <div class="rec-rows">
            <div class="rec-row">
              <span class="rec-key">Lentes recomendadas</span>
              <span class="rec-val" id="rec_lente">--</span>
            </div>
            <div class="rec-row">
              <span class="rec-key">Largura Total da Armação</span>
              <span class="rec-val" id="rec_total">--</span>
            </div>
            <div class="rec-row">
              <span class="rec-key">Ponte Nasal de Referência</span>
              <span class="rec-val" id="rec_ponte">--</span>
            </div>
            <div class="rec-row">
              <span class="rec-key">Decentramento Óptico</span>
              <span class="rec-val" id="rec_dec">--</span>
            </div>
          </div>

          <div style="margin-top:12px;">
            <div class="card-title" style="margin-bottom:6px;">Formatos Sugeridos</div>
            <div class="style-pills" id="rec_estilos"></div>
          </div>

          <div style="margin-top:10px;">
            <div class="card-title" style="margin-bottom:6px;">Formatos a Evitar</div>
            <div class="style-pills" id="rec_evitar"></div>
          </div>

          <div style="margin-top:12px;">
            <div class="card-title" style="margin-bottom:4px;">Notas e Alertas Clínicos</div>
            <ul id="rec_obs"></ul>
          </div>

          <pre id="rec_json"></pre>
        </div>

        <!-- Log de Eventos -->
        <div class="card">
          <div class="card-title">Log de Execução</div>
          <div id="logs">Aguardando inicialização...\n</div>
        </div>

        <!-- JSON Output -->
        <div class="card json-card" id="json_wrap">
          <div class="card-title">Payload JSON Estruturado</div>
          <pre id="json_output"></pre>
        </div>

      </div>
    </div>
  </body>
</html>
