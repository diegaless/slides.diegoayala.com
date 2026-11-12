// Interaction engine adapted from https://iansilber.com/ (2026-11-11). See README.md.
import { readLeaderboard, saveScore, validateScore } from "./leaderboard.mjs?v=7";
import { createGlyphAtlas } from "./glyph-atlas.mjs";

      (() => {
        const homeAppearance = window.frameElement?.dataset;
        const ringFontFamily = homeAppearance?.fontFamily || '"Helvetica Neue", Helvetica, Arial, sans-serif';
        const ringFontWeight = homeAppearance?.fontWeight || "400";
        const ringFont = (size) => `${ringFontWeight} ${size}px ${ringFontFamily}`;
        let homeGlyphColors = [];
        try { homeGlyphColors = JSON.parse(homeAppearance?.glyphColors || "[]"); } catch {}
        let useHomeGlyphColors = homeGlyphColors.length > 0;
        let waitingForEntrance = homeAppearance?.morph === "true";
        const initialBackground = homeAppearance?.background || "#000000";
        const initialForeground = homeAppearance?.foreground || "#ffffff";
        document.documentElement.style.setProperty("--page-background", initialBackground);
        document.documentElement.style.setProperty("--page-foreground", initialForeground);
        if (homeAppearance?.surface) {
          document.documentElement.style.setProperty("--home-surface", homeAppearance.surface);
          document.body.classList.add("has-home-surface");
        }
        const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);
        const isLocal = window.location.protocol === "file:" || localHosts.has(window.location.hostname);

        const isProductionHost =
          window.location.hostname === "slides.diegoayala.com";

        const query = new URLSearchParams(window.location.search);
        const showTweaks = query.has("tweaks");
        const audioDebugEnabled = query.has("audioDebug");

        document.body.classList.toggle("is-local", isLocal);
        document.body.classList.toggle("is-production", isProductionHost);
        document.body.classList.toggle("show-tweaks", showTweaks);

        const isSafari =
          /Safari/.test(navigator.userAgent) &&
          !/Chrome|Chromium|CriOS|Edg|OPR|Android/.test(navigator.userAgent);
        const isIOS =
          /iPhone|iPad|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        const canvas = document.querySelector(".shader");
        const controls = document.querySelectorAll("[data-shader-control]");
        const context = canvas.getContext("2d", { alpha: true });
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
        const settings = {
          opacity: 0,
          density: 0.28,
          spread: 0.25,
          pixel: 2,
          motion: 1,
          drift: 0.08,
          blend: "multiply",
          color: "#000000",
          accent: "#ffffff",
          background: "#000000",
          text: "#ffffff",
        };
        let width = 0;
        let height = 0;
        let pixelRatio = 1;
        let frame;

        const resize = () => {
          pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          width = Math.ceil(window.innerWidth * pixelRatio);
          height = Math.ceil(window.innerHeight * pixelRatio);
          canvas.width = width;
          canvas.height = height;
        };

        const smoothstep = (edge0, edge1, value) => {
          const amount = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
          return amount * amount * (3 - 2 * amount);
        };

        const hexToRgb = (hex) => {
          const value = Number.parseInt(hex.slice(1), 16);
          return {
            red: (value >> 16) & 255,
            green: (value >> 8) & 255,
            blue: value & 255,
          };
        };

        const draw = (time = 0) => {
          const cell = Math.max(1, Math.round(settings.pixel * pixelRatio));
          const aspect = width / height;
          const drift = reduceMotion.matches ? 0 : time * 0.00018 * settings.motion;
          const centerX = 0.5 + Math.sin(drift) * settings.drift;
          const centerY = 0.5 + Math.cos(drift * 0.7) * settings.drift;
          const color = hexToRgb(settings.color);

          context.clearRect(0, 0, width, height);

          if (settings.opacity <= 0) {
            return;
          }

          context.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${settings.opacity})`;

          for (let y = 0; y < height; y += cell) {
            for (let x = 0; x < width; x += cell) {
              const column = Math.floor(x / cell);
              const row = Math.floor(y / cell);
              const threshold = (bayer[(row % 4) * 4 + (column % 4)] + 0.5) / 16;
              const normalizedX = x / width;
              const normalizedY = y / height;
              const dx = (normalizedX - centerX) * aspect;
              const dy = normalizedY - centerY;
              const radius = Math.sqrt(dx * dx + dy * dy);
              const sphere = 1 - smoothstep(0.02, settings.spread, radius);
              const grain = settings.density + sphere * 0.5;

              if (threshold < grain) {
                context.fillRect(x, y, cell, cell);
              }
            }
          }

          if (!reduceMotion.matches && settings.motion > 0) {
            frame = window.requestAnimationFrame(draw);
          }
        };

        const render = () => {
          window.cancelAnimationFrame(frame);
          resize();
          draw();
        };

        const updateSetting = (control) => {
          const key = control.dataset.shaderControl;
          settings[key] = control.type === "range" ? Number(control.value) : control.value;
          if (key === "blend") {
            canvas.style.mixBlendMode = settings.blend;
          }
          if (key === "accent") {
            document.documentElement.style.setProperty("--control-accent", settings.accent);
          }
          if (key === "background") {
            document.documentElement.style.setProperty("--page-background", settings.background);
          }
          if (key === "text") {
            document.documentElement.style.setProperty("--page-foreground", settings.text);
          }
          window.cancelAnimationFrame(frame);
          draw();
        };

        controls.forEach((control) => {
          control.addEventListener("input", () => updateSetting(control));
        });

        window.addEventListener("resize", render);
        reduceMotion.addEventListener("change", render);
        render();

        const artwork = document.querySelector(".artwork");
        const circularView = document.querySelector(".circular-view");
        circularView.dataset.ballId = "0";
        const circleControls = document.querySelectorAll("[data-circle-control]");
        const circleTweaksStorageKey = "slides-circle-tweaks-v1";
        const getResponsiveRingRadius = () => 0.425;
        const circleSettings = {
          spinDuration: 60,
          fontSize: 26,
          radius: getResponsiveRingRadius(),
          gap: 0.75,
          startRotation: 180,
          direction: "normal",
          bounce: 0.94,
          friction: 0.971,
          puckFriction: 0.04,
          goalSize: 2,
          gravity: 0.0004,
          squish: 0.9,
          popDepth: 0.51,
          popHold: 900,
          maxSquish: 1.4,
          contactBunch: 0.22,
          contactArc: 0.65,
          burstPower: 1.9,
          popPieces: "words",
          sound: "pop",
          soundVolume: 0.85,
          soundPitch: 1.15,
          soundDuration: 64,
        };
        let ringRadiusCustomized = false;
        let hasBallPosition = false;
        let physicsFrame;
        let lastPhysicsTime = 0;
        let dragState = null;
        let pinchState = null;
        let ringScale = 1;
        const activePointers = new Map();
        const ballPosition = { x: 0, y: 0 };
        const ballVelocity = { x: 0, y: 0 };
        const dragPressure = { left: 0, right: 0, top: 0, bottom: 0 };
        const ballBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        const softBodyPoints = 64;
        const deformation = new Float32Array(softBodyPoints);
        const deformationVelocity = new Float32Array(softBodyPoints);
        const nextDeformationVelocity = new Float32Array(softBodyPoints);
        const spawnedBalls = [];
        const tapCandidates = new Map();
        const lastTapByBall = new Map();
        let activeBallContacts = new Set();
        let nextBallId = 1;
        let spawnSequence = 0;
        const airHockeyGoal = document.querySelector(".air-hockey-goal");
        const airHockeyGoalTop = 10;
        const airHockeyHud = document.querySelector(".air-hockey-hud");
        const airHockeyTimer = document.querySelector(".air-hockey-timer");
        const airHockeyScore = document.querySelector(".air-hockey-score");
        const airHockeyScoreBurst = document.querySelector(
          ".air-hockey-score-burst",
        );
        const airHockeyEndCard = document.querySelector(
          ".air-hockey-end-card",
        );
        const airHockeyFinalScore = document.querySelector(
          ".air-hockey-final-score",
        );
        const airHockeyFinalLabel = document.querySelector(
          ".air-hockey-final-label",
        );
        const airHockeyReplay = document.querySelector(".air-hockey-replay");
        const airHockeyDone = document.querySelector(".air-hockey-done");
        const airHockeyLeaderboardList = document.querySelector(
          ".air-hockey-leaderboard-list",
        );
        const airHockeyLeaderboardForm = document.querySelector(
          ".air-hockey-leaderboard-form",
        );
        const airHockeyLeaderboardStatus = document.querySelector(
          ".air-hockey-leaderboard-status",
        );
        const airHockeyLeaderboardSubmit = document.querySelector(
          ".air-hockey-leaderboard-submit",
        );
        const airHockeyNameInput = document.querySelector(".air-hockey-name-input");
        let airHockeyState = null;
        let primaryGoalTransit = false;
        let goalPulseTimer = 0;
        let roundClockTimer = 0;
        let roundEndTimer = 0;
        let scoreBurstTimer = 0;
        let ballSize = 0;
        let collisionInset = 0;
        let ringCanvas;
        let ringContext;
        let ringPixelRatio = 1;
        let ringCanvasPadding = 0;
        let ringLayout;
        let spinAngle = 0;
        let spinVelocity = 0;
        let heldSpinAngle = null;
        let wallReleaseSettlingUntil = 0;
        let lastSpinDebugTime = 0;
        let lastSpinDebugAngle = 0;
        let hasSpinDebugSample = false;
        let lastCanvasDraw = 0;
        let popState = null;
        let popCanvas = null;
        let popContext = null;
        let smallViewportProbe = null;
        let audioContext;
        let audioMaster;
        let audioUnlocked = false;
        let audioArmPromise;
        let squeezeEncodedPromise;
        let burstEncodedPromise;
        let squeezeBuffer;
        let squeezeBufferPromise;
        let squeezeSource;
        let squeezeSampleGain;
        let squeezePlaybackOffset = 0;
        let squeezePlaybackStartedAt = null;
        let squeezePlaybackRate = 1;
        let squeezeDesiredPressure = 0;
        let squeezeFingerMoving = false;
        let squeezeRestartAfter = 0;
        let burstBuffer;
        let burstBufferPromise;
        let burstSource;
        let burstSampleGain;
        let lastSqueezePressure = 0;
        let lastSqueezeTime = 0;
        let lastThumpTime = -Infinity;
        let pendingCollision = null;
        let pendingBurst = null;
        let lastAudioRequest = "waiting for a gesture";
        let lastAudioPlay = "none";
        let lastAudioError = "";
        const audioStartButton = document.querySelector(".audio-start");
        const audioDebugOutput = document.querySelector(".audio-debug");
        const motionAcceleration = { x: 0, y: 0 };
        const motionGravity = { x: 0, y: 0 };
        let motionGravityReady = false;
        let motionEnabled = false;
        let motionPermissionRequested = false;
        let lastMotionTime = -Infinity;
        const colorThemes = [
          { background: initialBackground, text: initialForeground },
          { background: "#163cff", text: "#ffffff" },
          { background: "#ff3b30", text: "#ffffff" },
          { background: "#d7ff00", text: "#111111" },
          { background: "#7c3aed", text: "#ffffff" },
          { background: "#00d9ff", text: "#001018" },
          { background: "#ff6a00", text: "#ffffff" },
          { background: "#ff4fa3", text: "#19000c" },
        ];
        let colorThemeIndex = 0;
        let bouncesSinceThemeChange = 0;

        const advanceColorTheme = () => {
          if (popState) return;
          colorThemeIndex = (colorThemeIndex + 1) % colorThemes.length;
          const theme = colorThemes[colorThemeIndex];

          document.body.classList.remove("has-home-surface");
          useHomeGlyphColors = false;
          ringLayout?.atlases?.clear();
          document.documentElement.style.setProperty("--page-background", theme.background);
          document.documentElement.style.setProperty("--page-foreground", theme.text);
          document.querySelector('meta[name="theme-color"]')?.setAttribute(
            "content",
            theme.background,
          );

          if (ringContext) {
            ringContext.fillStyle = theme.text;
          }
          if (popContext) {
            popContext.fillStyle = theme.text;
          }
          for (const ball of spawnedBalls) {
            drawSpawnedBall(ball);
          }
          window.parent.postMessage({ type: "slides-playground-theme", color: theme.text }, window.location.origin);
        };

        const registerBounceForTheme = () => {
          if (popState) return false;

          bouncesSinceThemeChange += 1;
          const bounceInterval = Math.max(1, spawnedBalls.length + 1);
          if (bouncesSinceThemeChange < bounceInterval) return false;

          bouncesSinceThemeChange = 0;
          advanceColorTheme();
          return true;
        };

        const getPhysicsBounce = () =>
          airHockeyState
            ? Math.max(0.98, circleSettings.bounce)
            : circleSettings.bounce;

        const getPhysicsFriction = () =>
          airHockeyState
            ? 1 - circleSettings.puckFriction
            : circleSettings.friction;

        const getScreenAcceleration = (x, y) => {
          const angle = Number(
            window.screen?.orientation?.angle ??
              window.orientation ??
              0,
          );
          const normalizedAngle = ((angle % 360) + 360) % 360;

          if (normalizedAngle === 90) return { x: -y, y: -x };
          if (normalizedAngle === 180) return { x: -x, y };
          if (normalizedAngle === 270) return { x: y, y: x };
          return { x, y: -y };
        };

        const handleDeviceMotion = (event) => {
          if (airHockeyState) return;

          let x = event.acceleration?.x;
          let y = event.acceleration?.y;

          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            const includingGravity = event.accelerationIncludingGravity;
            if (
              !includingGravity ||
              !Number.isFinite(includingGravity.x) ||
              !Number.isFinite(includingGravity.y)
            ) {
              return;
            }

            if (!motionGravityReady) {
              motionGravity.x = includingGravity.x;
              motionGravity.y = includingGravity.y;
              motionGravityReady = true;
              return;
            }

            motionGravity.x += (includingGravity.x - motionGravity.x) * 0.12;
            motionGravity.y += (includingGravity.y - motionGravity.y) * 0.12;
            x = includingGravity.x - motionGravity.x;
            y = includingGravity.y - motionGravity.y;
          }

          const screenAcceleration = getScreenAcceleration(x, y);
          const removeNoise = (value) => {
            const magnitude = Math.abs(value);
            if (magnitude < 0.12) return 0;
            return Math.sign(value) * Math.min(20, magnitude - 0.12);
          };

          const inertialX = -removeNoise(screenAcceleration.x);
          const inertialY = -removeNoise(screenAcceleration.y);
          motionAcceleration.x += (inertialX - motionAcceleration.x) * 0.42;
          motionAcceleration.y += (inertialY - motionAcceleration.y) * 0.42;
          lastMotionTime = performance.now();
        };

        const enableDeviceMotion = async () => {
          if (motionEnabled || motionPermissionRequested) return;

          const MotionEvent = window.DeviceMotionEvent;
          if (!MotionEvent) return;

          motionPermissionRequested = true;

          try {
            if (typeof MotionEvent.requestPermission === "function") {
              const permission = await MotionEvent.requestPermission();
              if (permission !== "granted") return;
            }

            window.addEventListener("devicemotion", handleDeviceMotion, {
              passive: true,
            });
            motionEnabled = true;
          } catch {}
        };

        const circleLabel = window.frameElement?.dataset.circleText ||
          "Lenguaje de Marcas   Desarrollo de Interfaces   Programación de Servicios y Procesos   Despliegue de aplicaciones Web   Proyecto Intermodular   Sistemas informáticos";
        const circleText = circleLabel;
        circularView.setAttribute("aria-label", circleLabel);

        const updateBallBounds = () => {
          ballBounds.minX = -collisionInset;
          ballBounds.minY = -collisionInset;
          ballBounds.maxX = Math.max(
            ballBounds.minX,
            window.innerWidth - ballSize + collisionInset,
          );
          ballBounds.maxY = Math.max(
            ballBounds.minY,
            window.innerHeight - ballSize + collisionInset,
          );
        };

        const positionBall = () => {
          let correctionX = 0;
          let correctionY = 0;

          // Collision deformation gets a small positional correction so a
          // bouncing ring stays in contact. While it is being held, the wall
          // constraint is applied to the shape itself instead of moving the
          // entire canvas beyond the viewport.
          if (
            !dragState &&
            performance.now() >= wallReleaseSettlingUntil
          ) {
            const edgeThreshold = 0.75;
            const touchingLeft =
              Math.abs(ballPosition.x - ballBounds.minX) < edgeThreshold;
            const touchingRight =
              Math.abs(ballPosition.x - ballBounds.maxX) < edgeThreshold;
            const touchingTop =
              Math.abs(ballPosition.y - ballBounds.minY) < edgeThreshold;
            const touchingBottom =
              Math.abs(ballPosition.y - ballBounds.maxY) < edgeThreshold;

            if (touchingLeft) {
              correctionX -= Math.max(0, -sampleDeformation(Math.PI));
            } else if (touchingRight) {
              correctionX += Math.max(0, -sampleDeformation(0));
            }

            if (touchingTop) {
              correctionY -= Math.max(0, -sampleDeformation(-Math.PI / 2));
            } else if (touchingBottom) {
              correctionY += Math.max(0, -sampleDeformation(Math.PI / 2));
            }
          }

          circularView.style.transform =
            `translate3d(${ballPosition.x + correctionX}px, ${ballPosition.y + correctionY}px, 0)`;
        };

        const constrainBall = () => {
          if (primaryGoalTransit) return;

          ballPosition.x = Math.min(
            Math.max(ballPosition.x, ballBounds.minX),
            ballBounds.maxX,
          );
          const minimumY = getAirHockeyDragTopBound(
            primaryCollisionBody,
            ballBounds.minY,
          );
          ballPosition.y = Math.min(
            Math.max(ballPosition.y, minimumY),
            ballBounds.maxY,
          );
        };

        const stopPhysics = () => {
          window.cancelAnimationFrame(physicsFrame);
          physicsFrame = undefined;
        };

        const normalizeAngle = (angle) => {
          let normalized = angle % (Math.PI * 2);
          if (normalized > Math.PI) normalized -= Math.PI * 2;
          if (normalized < -Math.PI) normalized += Math.PI * 2;
          return normalized;
        };

        const sampleDeformation = (angle) => {
          const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const position = (normalized / (Math.PI * 2)) * softBodyPoints;
          const lower = Math.floor(position) % softBodyPoints;
          const upper = (lower + 1) % softBodyPoints;
          const blend = position - Math.floor(position);
          return deformation[lower] * (1 - blend) + deformation[upper] * blend;
        };

        const setAudioSessionTransient = () => {
          try {
            if ("audioSession" in navigator) {
              navigator.audioSession.type = "transient";
            }
          } catch {}
        };

        const updateAudioDebug = () => {
          if (!audioDebugEnabled || !audioDebugOutput) return;

          audioDebugOutput.textContent =
            `context  ${audioContext?.state || "not created"}\n` +
            `session  ${navigator.audioSession?.type || "unavailable"}\n` +
            `assets   squeeze:${squeezeBuffer ? "ready" : "loading"} pop:${burstBuffer ? "ready" : "loading"}\n` +
            `squeeze  ${squeezeDesiredPressure.toFixed(1)}px / ${squeezeSource ? "playing" : "stopped"}\n` +
            `pending  collision:${Boolean(pendingCollision)} pop:${Boolean(pendingBurst)}\n` +
            `request  ${lastAudioRequest}\n` +
            `played   ${lastAudioPlay}\n` +
            `error    ${lastAudioError || "none"}`;
        };

        const noteAudioError = (label, error) => {
          lastAudioError = `${label}: ${error?.message || error || "unknown error"}`;
          updateAudioDebug();
          console.warn("[audio]", label, error);
        };

        const resetClosedAudioContext = () => {
          if (audioContext?.state !== "closed") return;
          audioContext = null;
          audioMaster = null;
          squeezeBuffer = null;
          squeezeBufferPromise = null;
          burstBuffer = null;
          burstBufferPromise = null;
          squeezeSource = null;
          squeezeSampleGain = null;
          burstSource = null;
          burstSampleGain = null;
          audioUnlocked = false;
        };

        const ensureAudioContext = () => {
          resetClosedAudioContext();
          if (audioContext) return audioContext;

          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return null;

          try {
            audioContext = new AudioContextClass({ latencyHint: "interactive" });
          } catch {
            audioContext = new AudioContextClass();
          }

          setAudioSessionTransient();

          const limiter = audioContext.createDynamicsCompressor();
          audioMaster = audioContext.createGain();
          limiter.threshold.setValueAtTime(-18, audioContext.currentTime);
          limiter.knee.setValueAtTime(2, audioContext.currentTime);
          limiter.ratio.setValueAtTime(12, audioContext.currentTime);
          limiter.attack.setValueAtTime(0.002, audioContext.currentTime);
          limiter.release.setValueAtTime(0.1, audioContext.currentTime);
          audioMaster.gain.setValueAtTime(0.85, audioContext.currentTime);
          audioMaster.connect(limiter);
          limiter.connect(audioContext.destination);

          audioContext.addEventListener("statechange", () => {
            audioUnlocked = audioContext?.state === "running" || audioUnlocked;
            if (audioContext?.state === "running") {
              flushQueuedAudio();
            }
            updateAudioDebug();
          });

          updateAudioDebug();
          return audioContext;
        };

        const decodeBase64Audio = (encoded) => {
          const binary = window.atob(encoded.trim());
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
          return bytes.buffer;
        };

        const fetchEncodedAudio = (url, label) =>
          fetch(url, { cache: "force-cache" }).then((response) => {
            if (!response.ok) {
              throw new Error(`${label} request failed (${response.status})`);
            }
            return response.text();
          });

        const prefetchAudioAssets = () => {
          if (!squeezeEncodedPromise) {
            squeezeEncodedPromise = fetchEncodedAudio(
              "./assets/balloon-squeeze.b64",
              "squeeze",
            ).catch((error) => {
              squeezeEncodedPromise = null;
              noteAudioError("squeeze fetch", error);
              throw error;
            });
            // The page starts prefetching before a gesture creates the decode
            // consumers. Keep a failed speculative request from becoming an
            // unhandled rejection; the next load attempt will retry it.
            squeezeEncodedPromise.catch(() => {});
          }
          if (!burstEncodedPromise) {
            burstEncodedPromise = fetchEncodedAudio(
              "./assets/balloon-pop.b64",
              "pop",
            ).catch((error) => {
              burstEncodedPromise = null;
              noteAudioError("pop fetch", error);
              throw error;
            });
            burstEncodedPromise.catch(() => {});
          }
        };

        const loadSqueezeBuffer = () => {
          if (squeezeBuffer) return Promise.resolve(squeezeBuffer);
          if (squeezeBufferPromise) return squeezeBufferPromise;

          const context = ensureAudioContext();
          if (!context) return Promise.resolve(null);
          prefetchAudioAssets();

          squeezeBufferPromise = squeezeEncodedPromise
            .then((encoded) => context.decodeAudioData(decodeBase64Audio(encoded)))
            .then((buffer) => {
              squeezeBuffer = buffer;
              updateAudioDebug();
              return buffer;
            })
            .catch((error) => {
              squeezeBufferPromise = null;
              noteAudioError("squeeze decode", error);
              return null;
            });
          return squeezeBufferPromise;
        };

        const loadBurstBuffer = () => {
          if (burstBuffer) return Promise.resolve(burstBuffer);
          if (burstBufferPromise) return burstBufferPromise;

          const context = ensureAudioContext();
          if (!context) return Promise.resolve(null);
          prefetchAudioAssets();

          burstBufferPromise = burstEncodedPromise
            .then((encoded) => context.decodeAudioData(decodeBase64Audio(encoded)))
            .then((buffer) => {
              burstBuffer = buffer;
              updateAudioDebug();
              return buffer;
            })
            .catch((error) => {
              burstBufferPromise = null;
              noteAudioError("pop decode", error);
              return null;
            });
          return burstBufferPromise;
        };

        const primeAudioGraph = (context) => {
          if (!context || !audioMaster) return;
          try {
            const buffer = context.createBuffer(1, 1, context.sampleRate);
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(audioMaster);
            source.onended = () => source.disconnect();
            source.start(0);
          } catch (error) {
            noteAudioError("graph prime", error);
          }
        };

        const hideAudioStart = () => {
          if (!audioStartButton) return;
          audioStartButton.hidden = true;
          audioStartButton.classList.remove("is-starting");
          document.body.classList.remove("needs-audio-start");
        };

        const armAudio = () => {
          const context = ensureAudioContext();
          if (!context) {
            hideAudioStart();
            return Promise.resolve(false);
          }

          setAudioSessionTransient();

          // Keep these calls synchronous in the trusted input callback. Waiting
          // even one microtask can lose iOS user activation.
          const resumePromise =
            context.state === "running"
              ? Promise.resolve()
              : context.resume();
          primeAudioGraph(context);
          lastAudioRequest = "unlock";

          if (audioArmPromise) {
            resumePromise.catch((error) => noteAudioError("re-arm", error));
            return audioArmPromise;
          }

          const attempt = resumePromise
            .then(() => {
              if (context.state !== "running") {
                throw new Error(`AudioContext remained ${context.state}`);
              }
              audioUnlocked = true;
              return Promise.all([loadSqueezeBuffer(), loadBurstBuffer()]);
            })
            .then(([squeeze, pop]) => {
              if (!squeeze || !pop) {
                throw new Error("One or more sound effects failed to decode");
              }
              lastAudioError = "";
              hideAudioStart();
              flushQueuedAudio();
              updateAudioDebug();
              return true;
            })
            .catch((error) => {
              noteAudioError("unlock", error);
              if (audioStartButton && isIOS) {
                audioStartButton.hidden = false;
                audioStartButton.classList.remove("is-starting");
                audioStartButton.textContent = "tap anywhere for sound";
              }
              return false;
            })
            .finally(() => {
              if (audioArmPromise === attempt) audioArmPromise = null;
            });

          audioArmPromise = attempt;
          updateAudioDebug();
          return attempt;
        };

        const recoverAudio = () => {
          if (!audioUnlocked || document.hidden) return;
          const context = ensureAudioContext();
          if (!context) return;
          setAudioSessionTransient();
          const resumePromise =
            context.state === "running" ? Promise.resolve() : context.resume();
          primeAudioGraph(context);
          resumePromise
            .then(() => {
              if (context.state === "running") flushQueuedAudio();
              updateAudioDebug();
            })
            .catch((error) => noteAudioError("recovery", error));
        };

        const unlockEvents = [
          "touchstart",
          "pointerdown",
          "touchend",
          "pointerup",
          "click",
          "keydown",
        ];
        unlockEvents.forEach((eventName) => {
          document.addEventListener(
            eventName,
            () => {
              if (
                !audioUnlocked ||
                audioContext?.state !== "running"
              ) {
                armAudio();
              }
            },
            { capture: true, passive: true },
          );
        });

        window.addEventListener("pageshow", recoverAudio);
        window.addEventListener("focus", recoverAudio);
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            pendingCollision = null;
            pendingBurst = null;
            stopSqueezeSound();
            if (audioContext?.state === "running") {
              audioContext
                .suspend()
                .catch((error) => noteAudioError("background suspend", error));
            }
          } else {
            recoverAudio();
          }
        });

        document.addEventListener("pointerdown", enableDeviceMotion, {
          capture: true,
          passive: true,
        });

        if (audioStartButton) {
          if (isIOS && (window.AudioContext || window.webkitAudioContext)) {
            audioStartButton.hidden = false;
            document.body.classList.add("needs-audio-start");
          } else {
            audioStartButton.hidden = true;
          }
        }

        if (audioDebugEnabled && audioDebugOutput) {
          audioDebugOutput.hidden = false;
          window.setInterval(updateAudioDebug, 250);
        }

        prefetchAudioAssets();

        const commitSqueezePlaybackPosition = (context, throughTime) => {
          if (
            !context ||
            !squeezeBuffer ||
            squeezePlaybackStartedAt === null ||
            squeezeBuffer.duration <= 0
          ) {
            return;
          }

          const elapsed = Math.max(0, throughTime - squeezePlaybackStartedAt);
          squeezePlaybackOffset =
            (squeezePlaybackOffset + elapsed * squeezePlaybackRate) %
            squeezeBuffer.duration;
          squeezePlaybackStartedAt = throughTime;
        };

        const stopSqueezeVoice = (fade = 0.035) => {
          const context = audioContext;
          const source = squeezeSource;
          const gain = squeezeSampleGain;

          if (!context || !source || !gain) {
            squeezeSource = null;
            squeezeSampleGain = null;
            squeezePlaybackStartedAt = null;
            updateAudioDebug();
            return;
          }

          const now = context.currentTime;
          const stopAt = now + fade;
          commitSqueezePlaybackPosition(context, stopAt);
          squeezePlaybackStartedAt = null;
          squeezeSource = null;
          squeezeSampleGain = null;

          try {
            gain.gain.cancelScheduledValues(now);
            gain.gain.setTargetAtTime(0.0001, now, Math.max(0.006, fade / 3));
            source.stop(stopAt);
          } catch {}
          updateAudioDebug();
        };

        const stopSqueezeSound = () => {
          squeezeDesiredPressure = 0;
          squeezeFingerMoving = false;
          lastSqueezePressure = 0;
          lastSqueezeTime = 0;
          squeezeRestartAfter = 0;
          stopSqueezeVoice();
        };

        const getSqueezePlaybackRate = (amount, pressureDelta = 0) => {
          const pitchControl = 0.92 + circleSettings.soundPitch * 0.07;
          return (
            (0.92 + amount * 0.42 + (pressureDelta < 0 ? -0.02 : 0)) *
            pitchControl
          );
        };

        const startSqueezeVoice = (context, pressure, amount) => {
          if (!squeezeBuffer || squeezeSource || pressure < 4) return;

          const now = context.currentTime;
          const source = context.createBufferSource();
          const gain = context.createGain();
          const playbackRate = getSqueezePlaybackRate(amount);
          const playbackOffset =
            squeezeBuffer.duration > 0
              ? squeezePlaybackOffset % squeezeBuffer.duration
              : 0;
          source.buffer = squeezeBuffer;
          source.loop = true;
          source.playbackRate.setValueAtTime(playbackRate, now);
          gain.gain.setValueAtTime(0.0001, now);
          source.connect(gain);
          gain.connect(audioMaster);
          squeezeSource = source;
          squeezeSampleGain = gain;
          source.onended = () => {
            source.disconnect();
            gain.disconnect();
            if (squeezeSource === source) {
              squeezeSource = null;
              squeezeSampleGain = null;
              squeezeRestartAfter = performance.now() + 55;
            }
            updateAudioDebug();
          };
          source.start(now, playbackOffset);
          squeezePlaybackStartedAt = now;
          squeezePlaybackRate = playbackRate;
          lastAudioPlay = "squeeze";
        };

        const updateSqueezeSound = (pressure, fingerMoving = false) => {
          squeezeDesiredPressure = Math.max(0, pressure || 0);
          squeezeFingerMoving = Boolean(fingerMoving);

          if (
            squeezeDesiredPressure <= 0.75 ||
            popState ||
            circleSettings.soundVolume <= 0
          ) {
            squeezeFingerMoving = false;
            if (squeezeSource) stopSqueezeVoice();
            lastSqueezePressure = squeezeDesiredPressure;
            lastSqueezeTime = performance.now();
            updateAudioDebug();
            return;
          }

          const context = ensureAudioContext();
          if (!context || !audioMaster) return;
          if (context.state !== "running") {
            lastAudioRequest = "queued squeeze";
            updateAudioDebug();
            return;
          }

          if (!squeezeBuffer) {
            loadSqueezeBuffer().then((buffer) => {
              if (buffer && squeezeDesiredPressure > 0.75) {
                updateSqueezeSound(
                  squeezeDesiredPressure,
                  squeezeFingerMoving,
                );
              }
            });
            return;
          }

          const threshold = Math.max(
            35,
            (ringLayout?.radius || 100) * circleSettings.popDepth,
          );
          const amount = Math.min(1, squeezeDesiredPressure / threshold);
          const now = context.currentTime;
          const movementTime = performance.now();
          const hasPreviousPressure = lastSqueezeTime > 0;
          const elapsed = hasPreviousPressure
            ? Math.max(8, movementTime - lastSqueezeTime)
            : 16;
          const pressureDelta = hasPreviousPressure
            ? squeezeDesiredPressure - lastSqueezePressure
            : 0;
          const motion = Math.min(1, Math.abs(pressureDelta) / elapsed * 2.4);
          lastSqueezePressure = squeezeDesiredPressure;
          lastSqueezeTime = movementTime;

          if (
            !squeezeSource &&
            squeezeFingerMoving &&
            squeezeDesiredPressure >= 4 &&
            movementTime >= squeezeRestartAfter
          ) {
            startSqueezeVoice(context, squeezeDesiredPressure, amount);
          }
          if (!squeezeSource || !squeezeSampleGain) return;

          const playbackRate = getSqueezePlaybackRate(amount, pressureDelta);
          commitSqueezePlaybackPosition(context, now);
          squeezePlaybackRate = playbackRate;
          const platformGain = isIOS ? 1.25 : 1;
          const squeezeVolumeScale = 0.7;
          const movingGain = Math.min(
            0.62 * squeezeVolumeScale,
            (0.32 + motion * 0.22) *
              (0.6 + amount * 0.4) *
              circleSettings.soundVolume *
              platformGain *
              squeezeVolumeScale,
          );
          const targetGain = squeezeFingerMoving ? movingGain : 0.0001;

          squeezeSource.playbackRate.setTargetAtTime(
            playbackRate,
            now,
            0.045,
          );
          squeezeSampleGain.gain.cancelScheduledValues(now);
          squeezeSampleGain.gain.setTargetAtTime(
            targetGain,
            now,
            squeezeFingerMoving ? 0.024 : 0.012,
          );
          updateAudioDebug();
        };

        const playCollisionSound = (impactSpeed = 1, gainScale = 1) => {
          const context = ensureAudioContext();
          if (!context || !audioMaster || circleSettings.soundVolume <= 0) return;

          if (context.state !== "running") {
            pendingCollision = {
              impactSpeed,
              gainScale,
              expires: performance.now() + 140,
            };
            lastAudioRequest = "queued collision";
            armAudio();
            updateAudioDebug();
            return;
          }

          const now = context.currentTime;
          if (now - lastThumpTime < 0.035) return;
          lastThumpTime = now;

          const presets = {
            click: { type: "triangle", start: 185, end: 72, gain: 0.04, length: 0.65 },
            thump: { type: "sine", start: 92, end: 52, gain: 0.07, length: 2.6 },
            pop: { type: "sine", start: 280, end: 88, gain: 0.06, length: 1.35 },
            snap: {
              voices: [
                { type: "triangle", start: 820, end: 190, gain: 0.035, length: 0.38 },
                { type: "square", start: 2400, end: 700, gain: 0.008, length: 0.16 },
              ],
            },
            bubble: {
              voices: [
                { type: "sine", start: 145, end: 430, gain: 0.052, length: 0.85 },
                { type: "sine", start: 290, end: 850, gain: 0.018, length: 0.55, delay: 0.12 },
              ],
            },
            glass: {
              voices: [
                { type: "sine", start: 960, end: 780, gain: 0.032, length: 2.5 },
                { type: "sine", start: 1920, end: 1560, gain: 0.012, length: 1.9 },
              ],
            },
            boing: {
              voices: [
                { type: "triangle", start: 220, end: 90, gain: 0.045, length: 2 },
                { type: "sine", start: 330, end: 140, gain: 0.022, length: 1.5, delay: 0.1 },
              ],
            },
            tick: { type: "square", start: 720, end: 420, gain: 0.025, length: 0.42 },
          };
          const preset = presets[circleSettings.sound] || presets.click;
          const voices = preset.voices || [preset];
          const impactGain = Math.min(1, 0.55 + impactSpeed * 0.12);

          voices.forEach((voice) => {
            const duration = Math.max(
              0.008,
              (circleSettings.soundDuration / 1000) * voice.length,
            );
            const startTime =
              now +
              (circleSettings.soundDuration / 1000) * (voice.delay || 0);
            const volume =
              voice.gain *
              circleSettings.soundVolume *
              impactGain *
              gainScale;
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = voice.type;
            oscillator.frequency.setValueAtTime(
              voice.start * circleSettings.soundPitch,
              startTime,
            );
            oscillator.frequency.exponentialRampToValueAtTime(
              Math.max(30, voice.end * circleSettings.soundPitch),
              startTime + duration,
            );
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(
              0.0001,
              startTime + duration,
            );
            oscillator.connect(gain);
            gain.connect(audioMaster);
            oscillator.onended = () => {
              oscillator.disconnect();
              gain.disconnect();
            };
            oscillator.start(startTime);
            oscillator.stop(startTime + duration + 0.005);
          });
          lastAudioPlay = "collision";
          updateAudioDebug();
        };

        const playBurstSound = () => {
          const context = ensureAudioContext();
          if (!context || !audioMaster || circleSettings.soundVolume <= 0) return;

          if (!burstBuffer) {
            pendingBurst = { expires: performance.now() + 500 };
            lastAudioRequest = "queued pop";
            loadBurstBuffer().then((buffer) => {
              if (buffer) flushQueuedAudio();
            });
            updateAudioDebug();
            return;
          }

          if (context.state !== "running") {
            pendingBurst = { expires: performance.now() + 500 };
            lastAudioRequest = "queued pop";
            armAudio();
            updateAudioDebug();
            return;
          }

          const now = context.currentTime;
          pendingBurst = null;

          if (burstSource) {
            try {
              burstSource.stop(now);
            } catch {}
            try {
              burstSource.disconnect();
              burstSampleGain?.disconnect();
            } catch {}
            burstSource = null;
            burstSampleGain = null;
          }

          const source = context.createBufferSource();
          const gain = context.createGain();
          const volume = 0.72 * circleSettings.soundVolume;
          const tailStart = Math.max(now, now + burstBuffer.duration - 0.018);
          source.buffer = burstBuffer;
          gain.gain.setValueAtTime(volume, now);
          gain.gain.setValueAtTime(volume, tailStart);
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + burstBuffer.duration,
          );
          source.connect(gain);
          gain.connect(audioMaster);
          burstSource = source;
          burstSampleGain = gain;

          source.onended = () => {
            source.disconnect();
            gain.disconnect();
            if (burstSource === source) {
              burstSource = null;
              burstSampleGain = null;
            }
            updateAudioDebug();
          };
          source.start(now);
          lastAudioPlay = "pop";
          updateAudioDebug();
        };

        function flushQueuedAudio() {
          if (!audioContext || audioContext.state !== "running") return;

          const burst = pendingBurst;
          pendingBurst = null;
          if (burst && performance.now() <= burst.expires) {
            playBurstSound();
          }

          const collision = pendingCollision;
          pendingCollision = null;
          if (collision && performance.now() <= collision.expires) {
            playCollisionSound(collision.impactSpeed, collision.gainScale);
          }

          if (squeezeDesiredPressure > 0.75 && !popState) {
            updateSqueezeSound(
              squeezeDesiredPressure,
              squeezeFingerMoving,
            );
          }
          updateAudioDebug();
        }

        const injectCollisionAtAngle = (
          impactAngle,
          impactSpeed,
          radius,
        ) => {
          if (!circleSettings.squish) return;
          const effectiveImpact = Math.max(0, impactSpeed - 0.025);
          const depth =
            Math.min(radius * 0.24, effectiveImpact * radius * 0.075) *
            circleSettings.squish;

          if (depth < 0.01) return;

          for (let index = 0; index < softBodyPoints; index += 1) {
            const angle = (index / softBodyPoints) * Math.PI * 2;
            const distance = normalizeAngle(angle - impactAngle);
            const contactWeight = Math.exp(-(distance * distance) / 0.22);
            const sideBulgeWeight =
              Math.exp(-((Math.abs(distance) - Math.PI / 2) ** 2) / 0.42);
            deformationVelocity[index] -= depth * contactWeight * 0.34;
            deformationVelocity[index] += depth * sideBulgeWeight * 0.075;
          }
        };

        const injectCollision = (side, impactSpeed, radius) => {
          const impactAngles = {
            right: 0,
            bottom: Math.PI / 2,
            left: Math.PI,
            top: -Math.PI / 2,
            "top-left": -Math.PI * 0.75,
            "top-right": -Math.PI * 0.25,
            "bottom-left": Math.PI * 0.75,
            "bottom-right": Math.PI * 0.25,
          };
          injectCollisionAtAngle(
            impactAngles[side] ?? 0,
            impactSpeed,
            radius,
          );
        };

        const getHeldCompression = (side, radius) => {
          if (!dragState) return 0;

          const penetration = dragPressure[side];
          if (penetration <= 0) return 0;

          const maximum = radius * circleSettings.maxSquish;
          const drivenCompression = penetration * 1.25;

          // A soft saturation curve keeps recruiting more of the ring into
          // the wall contact instead of abruptly stopping at a hard clamp.
          return (
            maximum *
            Math.tanh(drivenCompression / maximum) *
            circleSettings.squish
          );
        };

        const getHeldPressureTarget = (angle, radius) => {
          if (!dragState) return 0;

          const pressures = [
            ["left", Math.PI],
            ["right", 0],
            ["top", -Math.PI / 2],
            ["bottom", Math.PI / 2],
          ];
          let target = 0;

          for (const [side, impactAngle] of pressures) {
            const depth = getHeldCompression(side, radius);
            if (depth <= 0) continue;

            const distance = normalizeAngle(angle - impactAngle);
            const contactWeight = Math.exp(-(distance * distance) / 0.3);
            const shoulderWeight =
              Math.exp(-((Math.abs(distance) - Math.PI / 2) ** 2) / 0.38);
            const farSideWeight =
              Math.exp(-(normalizeAngle(distance - Math.PI) ** 2) / 0.55);

            // A pressurized skin does not cave inward at the wall. It grows
            // around the shoulders and slightly at the far side as volume is
            // displaced from the flattened contact patch.
            target += depth * shoulderWeight * 0.31;
            target += depth * farSideWeight * 0.045;
            target -= depth * contactWeight * 0.025;
          }

          return target;
        };

        const updateSoftBody = (frameDelta, isSettling = false) => {
          const restStrength = dragState ? 0.19 : isSettling ? 0.13 : 0.095;
          const velocityDamping = dragState ? 0.82 : isSettling ? 0.68 : 0.82;

          for (let index = 0; index < softBodyPoints; index += 1) {
            const previous = deformation[(index - 1 + softBodyPoints) % softBodyPoints];
            const current = deformation[index];
            const next = deformation[(index + 1) % softBodyPoints];
            const neighborForce = (previous + next - current * 2) * 0.22;
            const angle = (index / softBodyPoints) * Math.PI * 2;
            const heldTarget = getHeldPressureTarget(
              angle,
              ringLayout?.radius || ballSize * circleSettings.radius,
            );
            const restForce = (heldTarget - current) * restStrength;
            nextDeformationVelocity[index] =
              (deformationVelocity[index] + (neighborForce + restForce) * frameDelta) *
              Math.pow(velocityDamping, frameDelta);
          }

          let mean = 0;
          for (let index = 0; index < softBodyPoints; index += 1) {
            deformationVelocity[index] = nextDeformationVelocity[index];
            deformation[index] += deformationVelocity[index] * frameDelta;
            mean += deformation[index];
          }

          mean /= softBodyPoints;
          for (let index = 0; index < softBodyPoints; index += 1) {
            deformation[index] -= mean;
          }
        };

        const prepareRingLayout = () => {
          const size = ballSize;
          const fontSize = circleSettings.fontSize * ringScale;
          const radius = Math.min(
            size * circleSettings.radius,
            size / 2 - fontSize * 0.62 - 2,
          );
          const gapLength = fontSize * circleSettings.gap;
          const availableLength = Math.PI * 2 * radius - gapLength;
          const characters = Array.from(circleText);

          ringContext.setTransform(ringPixelRatio, 0, 0, ringPixelRatio, 0, 0);
          ringContext.font = ringFont(fontSize);
          ringContext.textAlign = "center";
          ringContext.textBaseline = "middle";
          ringContext.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue("--page-foreground")
            .trim() || "#fff";

          const rawWidth = ringContext.measureText(circleText).width;
          const horizontalScale = Math.min(1, availableLength / rawWidth);
          const widths = new Float32Array(characters.length);
          let glyphWidth = 0;

          for (let index = 0; index < characters.length; index += 1) {
            const width = ringContext.measureText(characters[index]).width * horizontalScale;
            widths[index] = width;
            glyphWidth += width;
          }

          const tracking = Math.max(0, (availableLength - glyphWidth) / characters.length);
          const totalPathLength = glyphWidth + tracking * characters.length + gapLength;
          const angles = new Float32Array(characters.length);
          const visible = new Uint8Array(characters.length);
          let advance = gapLength / 2;

          for (let index = 0; index < characters.length; index += 1) {
            angles[index] =
              ((advance + widths[index] / 2) / totalPathLength) * Math.PI * 2;
            visible[index] = /\s/.test(characters[index]) ? 0 : 1;
            advance += widths[index] + tracking;
          }

          const metrics = ringContext.measureText("Mg");
          let colorIndex = 0;
          ringLayout = {
            characters,
            angles,
            radius,
            center: size / 2,
            horizontalScale,
            visible,
            colors: characters.map(character => /\s/u.test(character) ? null : homeGlyphColors[colorIndex++]),
            centerOffset: ((metrics.fontBoundingBoxDescent || 0) - (metrics.fontBoundingBoxAscent || 0)) / 2,
            atlases: new Map(),
          };
        };

        const getDeformedRadius = (angle) =>
          ringLayout.radius + sampleDeformation(angle);

        const getRingPoint = (angle, useDeformation = true) => {
          const radius =
            ringLayout.radius + (useDeformation ? sampleDeformation(angle) : 0);
          let x = ringLayout.center + Math.cos(angle) * radius;
          let y = ringLayout.center + Math.sin(angle) * radius;

          if (dragState && useDeformation) {
            const fontSize = circleSettings.fontSize * ringScale;
            const glyphInset = fontSize * 0.62;
            const horizontalCompression =
              getHeldCompression("right", ringLayout.radius) -
              getHeldCompression("left", ringLayout.radius);
            const verticalCompression =
              getHeldCompression("bottom", ringLayout.radius) -
              getHeldCompression("top", ringLayout.radius);
            const verticalCenter =
              ringLayout.center + verticalCompression;
            const horizontalCenter =
              ringLayout.center + horizontalCompression;

            x += horizontalCompression;
            y += verticalCompression;

            const shapeHorizontalContact = (
              side,
              wall,
              overlap,
              impactAngle,
            ) => {
              if (overlap <= 0) return;

              const strength = Math.min(
                1,
                getHeldCompression(side, ringLayout.radius) /
                  ringLayout.radius,
              );
              const blend = smoothstep(
                0,
                Math.max(1, fontSize * 1.35),
                overlap,
              );
              const distance = normalizeAngle(angle - impactAngle);
              const envelope = Math.exp(
                -(distance * distance) / 1.05,
              );
              y =
                verticalCenter +
                (y - verticalCenter) *
                  (1 - circleSettings.contactBunch * strength * blend);
              const inward =
                fontSize *
                circleSettings.contactArc *
                strength *
                blend *
                envelope;
              x = side === "left" ? wall + inward : wall - inward;
            };

            const shapeVerticalContact = (
              side,
              wall,
              overlap,
              impactAngle,
            ) => {
              if (overlap <= 0) return;

              const strength = Math.min(
                1,
                getHeldCompression(side, ringLayout.radius) /
                  ringLayout.radius,
              );
              const blend = smoothstep(
                0,
                Math.max(1, fontSize * 1.35),
                overlap,
              );
              const distance = normalizeAngle(angle - impactAngle);
              const envelope = Math.exp(
                -(distance * distance) / 1.05,
              );
              x =
                horizontalCenter +
                (x - horizontalCenter) *
                  (1 - circleSettings.contactBunch * strength * blend);
              const inward =
                fontSize *
                circleSettings.contactArc *
                strength *
                blend *
                envelope;
              y = side === "top" ? wall + inward : wall - inward;
            };

            if (dragPressure.left > 0) {
              const wall = -ballPosition.x + glyphInset;
              shapeHorizontalContact(
                "left",
                wall,
                wall - x,
                Math.PI,
              );
            }
            if (dragPressure.right > 0) {
              const wall = window.innerWidth - ballPosition.x - glyphInset;
              shapeHorizontalContact(
                "right",
                wall,
                x - wall,
                0,
              );
            }
            if (dragPressure.top > 0) {
              const wall = -ballPosition.y + glyphInset;
              shapeVerticalContact(
                "top",
                wall,
                wall - y,
                -Math.PI / 2,
              );
            }
            if (dragPressure.bottom > 0) {
              const wall = window.innerHeight - ballPosition.y - glyphInset;
              shapeVerticalContact(
                "bottom",
                wall,
                y - wall,
                Math.PI / 2,
              );
            }
          }

          return { x, y };
        };

        const getRingPose = (angle, useDeformation = true) => {
          const point = getRingPoint(angle, useDeformation);
          const epsilon = 0.006;
          const before = getRingPoint(angle - epsilon, useDeformation);
          const after = getRingPoint(angle + epsilon, useDeformation);
          return {
            x: point.x,
            y: point.y,
            rotation: Math.atan2(after.y - before.y, after.x - before.x),
          };
        };

        const getContactRingPose = (
          angle,
          index,
          useDeformation = true,
        ) => getRingPose(angle, useDeformation);

        const drawRing = () => {
          if (!ringContext || !ringCanvas || !ringLayout) return;

          const {
            characters,
            angles,
            horizontalScale,
            visible,
          } = ringLayout;
          const baseRotation =
            (circleSettings.startRotation * Math.PI) / 180 + spinAngle;
          const ratio = ringPixelRatio;

          const paddedSize = ballSize + ringCanvasPadding * 2;
          ringContext.setTransform(ratio, 0, 0, ratio, 0, 0);
          ringContext.clearRect(0, 0, paddedSize, paddedSize);

          for (let index = 0; index < characters.length; index += 1) {
            if (!visible[index]) continue;

            const character = characters[index];
            const color = (useHomeGlyphColors && ringLayout.colors[index]) || ringContext.fillStyle;
            let atlas = ringLayout.atlases.get(color);
            if (!atlas) {
              atlas = createGlyphAtlas(characters, ringFont(circleSettings.fontSize * ringScale),
                circleSettings.fontSize * ringScale, color, ratio);
              ringLayout.atlases.set(color, atlas);
            }
            const angle = baseRotation + angles[index];
            const pose = getContactRingPose(angle, index);
            const cosine = Math.cos(pose.rotation);
            const sine = Math.sin(pose.rotation);

            ringContext.setTransform(
              ratio * cosine * horizontalScale,
              ratio * sine * horizontalScale,
              ratio * -sine,
              ratio * cosine,
              ratio * (pose.x + ringCanvasPadding),
              ratio * (pose.y + ringCanvasPadding),
            );
            atlas.draw(ringContext, character);
          }
        };

        const getSpawnedBallGeometry = (scale) => {
          const artworkRect = artwork.getBoundingClientRect();
          const baseSize = Math.max(
            180,
            Math.min(
              artworkRect.width,
              window.innerWidth - 12,
              window.innerHeight - 12,
            ),
          );
          const size = baseSize * scale;
          const fontSize = circleSettings.fontSize * scale;
          const radius = Math.min(
            size * circleSettings.radius,
            size / 2 - fontSize * 0.62 - 2 * scale,
          );
          const visibleRadius = radius + fontSize * 0.62;
          const opticalOvershoot = Math.max(
            2 * scale,
            fontSize * 0.13,
          );
          const collisionInset =
            Math.max(0, size / 2 - visibleRadius) + opticalOvershoot;
          const padding = Math.ceil(Math.max(fontSize * 3, size * 0.12));

          return {
            size,
            fontSize,
            radius,
            collisionInset,
            collisionRadius: Math.max(
              Math.max(1, 12 * scale),
              size / 2 - collisionInset,
            ),
            padding,
          };
        };

        const updateSpawnedBallBounds = (ball) => {
          ball.bounds.minX = -ball.collisionInset;
          ball.bounds.minY = -ball.collisionInset;
          ball.bounds.maxX = Math.max(
            ball.bounds.minX,
            window.innerWidth - ball.size + ball.collisionInset,
          );
          ball.bounds.maxY = Math.max(
            ball.bounds.minY,
            window.innerHeight - ball.size + ball.collisionInset,
          );
        };

        const createRingHitTarget = (size, radius) => {
          const hitTarget = document.createElement("div");
          const hitRadius = Math.min(size / 2, radius + 10);
          hitTarget.className = "ring-hit-target";
          hitTarget.setAttribute("aria-hidden", "true");
          Object.assign(hitTarget.style, {
            left: `${size / 2 - hitRadius}px`,
            top: `${size / 2 - hitRadius}px`,
            width: `${hitRadius * 2}px`,
            height: `${hitRadius * 2}px`,
          });
          return hitTarget;
        };

        const constrainSpawnedBall = (ball) => {
          if (ball.goalTransit) return;

          ball.position.x = Math.min(
            Math.max(ball.position.x, ball.bounds.minX),
            ball.bounds.maxX,
          );
          const minimumY = getAirHockeyDragTopBound(
            ball,
            ball.bounds.minY,
          );
          ball.position.y = Math.min(
            Math.max(ball.position.y, minimumY),
            ball.bounds.maxY,
          );
        };

        const positionSpawnedBall = (ball, time = performance.now()) => {
          if (!ball.element || !ball.canvas) return;

          let deformationTransform = "";
          if (ball.squish) {
            const progress =
              (time - ball.squish.startedAt) / ball.squish.duration;
            if (progress >= 1) {
              ball.squish = null;
            } else if (progress >= 0) {
              const pulse = Math.sin(progress * Math.PI) * (1 - progress * 0.2);
              const amount = ball.squish.amount * pulse;
              deformationTransform =
                ` rotate(${ball.squish.angle}rad)` +
                ` scale(${1 - amount}, ${1 + amount * 0.42})` +
                ` rotate(${-ball.squish.angle}rad)`;
            }
          }

          ball.element.style.transform =
            `translate3d(${ball.position.x}px, ${ball.position.y}px, 0)` +
            deformationTransform;
          ball.canvas.style.transform = `rotate(${ball.spinAngle}rad)`;
        };

        const drawSpawnedBall = (ball) => {
          const { context, canvas, layout, pixelRatio, padding } = ball;
          if (!context || !canvas || !layout) return;

          const ratio = pixelRatio;
          const paddedSize = ball.size + padding * 2;
          const baseRotation =
            (circleSettings.startRotation * Math.PI) / 180;
          context.setTransform(ratio, 0, 0, ratio, 0, 0);
          context.clearRect(0, 0, paddedSize, paddedSize);
          context.font = ringFont(layout.fontSize);
          context.textAlign = "center";
          context.textBaseline = "middle";

          const themeStyles = getComputedStyle(document.documentElement);
          if (ball.isPassive) {
            context.fillStyle =
              themeStyles.getPropertyValue("--page-foreground").trim() ||
              "#fff";
            context.beginPath();
            context.arc(
              layout.center + padding,
              layout.center + padding,
              layout.radius + layout.fontSize * 0.62,
              0,
              Math.PI * 2,
            );
            context.fill();
          }

          context.fillStyle =
            themeStyles
              .getPropertyValue(
                ball.isPassive ? "--page-background" : "--page-foreground",
              )
              .trim() || (ball.isPassive ? "#000" : "#fff");

          for (let index = 0; index < layout.characters.length; index += 1) {
            if (!layout.visible[index]) continue;

            const angle = baseRotation + layout.angles[index];
            const x = layout.center + Math.cos(angle) * layout.radius;
            const y = layout.center + Math.sin(angle) * layout.radius;
            const rotation = angle + Math.PI / 2;
            const cosine = Math.cos(rotation);
            const sine = Math.sin(rotation);
            context.setTransform(
              ratio * cosine * layout.horizontalScale,
              ratio * sine * layout.horizontalScale,
              ratio * -sine,
              ratio * cosine,
              ratio * (x + padding),
              ratio * (y + padding),
            );
            context.fillText(layout.characters[index], 0, 0);
          }
        };

        const renderSpawnedBall = (ball) => {
          const previousSize = ball.size || 0;
          const previousCenter = previousSize
            ? {
                x: ball.position.x + previousSize / 2,
                y: ball.position.y + previousSize / 2,
              }
            : null;
          const geometry = getSpawnedBallGeometry(ball.scale);
          Object.assign(ball, geometry);
          ball.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

          if (previousCenter) {
            ball.position.x = previousCenter.x - ball.size / 2;
            ball.position.y = previousCenter.y - ball.size / 2;
          }

          const canvasSize = ball.size + ball.padding * 2;
          const canvas = document.createElement("canvas");
          canvas.className = "ring-canvas";
          canvas.width = Math.ceil(canvasSize * ball.pixelRatio);
          canvas.height = Math.ceil(canvasSize * ball.pixelRatio);
          Object.assign(canvas.style, {
            position: "absolute",
            left: `-${ball.padding}px`,
            top: `-${ball.padding}px`,
            width: `${canvasSize}px`,
            height: `${canvasSize}px`,
            transformOrigin: "50% 50%",
          });
          const context = canvas.getContext("2d", {
            alpha: true,
            desynchronized: true,
          });
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.font = ringFont(ball.fontSize);

          const characters = Array.from(circleText);
          const gapLength = ball.fontSize * circleSettings.gap;
          const availableLength = Math.PI * 2 * ball.radius - gapLength;
          const rawWidth = context.measureText(circleText).width;
          const horizontalScale = Math.min(1, availableLength / rawWidth);
          const widths = new Float32Array(characters.length);
          let glyphWidth = 0;
          for (let index = 0; index < characters.length; index += 1) {
            widths[index] =
              context.measureText(characters[index]).width * horizontalScale;
            glyphWidth += widths[index];
          }
          const tracking = Math.max(
            0,
            (availableLength - glyphWidth) / characters.length,
          );
          const totalPathLength =
            glyphWidth + tracking * characters.length + gapLength;
          const angles = new Float32Array(characters.length);
          const visible = new Uint8Array(characters.length);
          let advance = gapLength / 2;
          for (let index = 0; index < characters.length; index += 1) {
            angles[index] =
              ((advance + widths[index] / 2) / totalPathLength) * Math.PI * 2;
            visible[index] = /\s/.test(characters[index]) ? 0 : 1;
            advance += widths[index] + tracking;
          }

          ball.canvas = canvas;
          ball.context = context;
          ball.layout = {
            characters,
            angles,
            visible,
            horizontalScale,
            fontSize: ball.fontSize,
            radius: ball.radius,
            center: ball.size / 2,
          };
          ball.element.style.width = `${ball.size}px`;
          ball.element.style.height = `${ball.size}px`;
          ball.element.replaceChildren(
            canvas,
            createRingHitTarget(ball.size, ball.collisionRadius),
          );
          updateSpawnedBallBounds(ball);
          constrainSpawnedBall(ball);
          drawSpawnedBall(ball);
          positionSpawnedBall(ball);
        };

        const renderSpawnedBalls = () => {
          for (const ball of spawnedBalls) {
            renderSpawnedBall(ball);
          }
        };

        const primaryCollisionBody = {
          id: 0,
          element: circularView,
          position: ballPosition,
          velocity: ballVelocity,
          get size() {
            return ballSize;
          },
          get radius() {
            return Math.max(
              Math.max(1, 12 * ringScale),
              ballSize / 2 - collisionInset,
            );
          },
          get scale() {
            return ringScale;
          },
          get spinAngle() {
            return spinAngle;
          },
          set spinAngle(value) {
            spinAngle = value;
          },
          get spinVelocity() {
            return spinVelocity;
          },
          set spinVelocity(value) {
            spinVelocity = value;
          },
          get goalTransit() {
            return primaryGoalTransit;
          },
          set goalTransit(value) {
            primaryGoalTransit = value;
          },
        };

        const getBodyCenter = (body) => ({
          x: body.position.x + body.size / 2,
          y: body.position.y + body.size / 2,
        });

        const getBodyCollisionRadius = (body) =>
          body.id === 0 ? body.radius : body.collisionRadius;

        const updateAirHockeyGoalGeometry = () => {
          if (!airHockeyState || !airHockeyGoal) return;

          const bodies = [primaryCollisionBody, ...spawnedBalls];
          const largestRadius = Math.max(
            ...bodies.map((body) => getBodyCollisionRadius(body)),
          );
          const puckDiameter = largestRadius * 2;
          const availableWidth = Math.max(72, window.innerWidth - 24);
          const width = Math.min(
            availableWidth,
            puckDiameter * circleSettings.goalSize,
          );

          airHockeyState.goalWidth = width;
          airHockeyGoal.style.setProperty("--air-hockey-goal-width", `${width}px`);
          airHockeyHud.style.width = `${width}px`;
        };

        const fitsAirHockeyGoalAtX = (body, centerX) => {
          if (!airHockeyState) return false;

          const radius = getBodyCollisionRadius(body);
          const halfOpening = (airHockeyState.goalWidth || 0) / 2;
          const openingLeft = window.innerWidth / 2 - halfOpening;
          const openingRight = window.innerWidth / 2 + halfOpening;
          const edgeTolerance = 8;
          return (
            centerX - radius >= openingLeft - edgeTolerance &&
            centerX + radius <= openingRight + edgeTolerance
          );
        };

        const getAirHockeyRailConstraint = (body, defaultTop) => {
          const fallback = {
            minimumY: defaultTop,
            normalX: 0,
            normalY: 1,
            isCorner: false,
          };
          if (!airHockeyState || body.goalTransit) return fallback;

          const radius = getBodyCollisionRadius(body);
          const centerX = body.position.x + body.size / 2;
          if (fitsAirHockeyGoalAtX(body, centerX)) return fallback;

          const halfOpening = (airHockeyState.goalWidth || 0) / 2;
          const openingLeft = window.innerWidth / 2 - halfOpening;
          const openingRight = window.innerWidth / 2 + halfOpening;
          const circleLeft = centerX - radius;
          const circleRight = centerX + radius;

          if (circleRight <= openingLeft || circleLeft >= openingRight) {
            return {
              minimumY: defaultTop + airHockeyGoalTop,
              normalX: 0,
              normalY: 1,
              isCorner: false,
            };
          }

          const cornerX =
            centerX < window.innerWidth / 2
              ? openingLeft
              : openingRight;
          const offsetX = Math.max(
            -radius,
            Math.min(radius, centerX - cornerX),
          );
          const offsetY = Math.sqrt(
            Math.max(0, radius * radius - offsetX * offsetX),
          );

          return {
            minimumY:
              airHockeyGoalTop + offsetY - body.size / 2,
            normalX: offsetX / radius,
            normalY: offsetY / radius,
            isCorner: true,
          };
        };

        const getAirHockeyDragTopBound = (body, defaultTop) =>
          getAirHockeyRailConstraint(body, defaultTop).minimumY;

        const crossesAirHockeyGoal = (body, previousCenter) => {
          if (
            !airHockeyState ||
            body.goalTransit ||
            body.velocity.y >= 0
          ) {
            return false;
          }

          const radius = getBodyCollisionRadius(body);
          const center = getBodyCenter(body);
          if (center.y - radius > airHockeyGoalTop) return false;

          const travelY = center.y - previousCenter.y;
          const crossingProgress =
            Math.abs(travelY) > 0.0001
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    (radius + airHockeyGoalTop - previousCenter.y) / travelY,
                  ),
                )
              : 1;
          const crossingX =
            previousCenter.x +
            (center.x - previousCenter.x) * crossingProgress;

          return fitsAirHockeyGoalAtX(body, crossingX);
        };

        const beginAirHockeyGoalTransit = (body) => {
          if (!airHockeyState || body.goalTransit) return;

          body.goalTransit = true;
          body.element.classList.add("is-goal-transit");
          if (body.id === 0) {
            deformation.fill(0);
            deformationVelocity.fill(0);
            nextDeformationVelocity.fill(0);
          } else {
            body.squish = null;
          }
        };

        const nudgePartialGoalPuck = (body, impact) => {
          if (
            !airHockeyState ||
            body.goalTransit ||
            impact < 0.025
          ) {
            return false;
          }

          const radius = getBodyCollisionRadius(body);
          const center = getBodyCenter(body);
          if (center.y - radius > airHockeyGoalTop + 1) return false;

          const halfOpening = (airHockeyState.goalWidth || 0) / 2;
          const openingLeft = window.innerWidth / 2 - halfOpening;
          const openingRight = window.innerWidth / 2 + halfOpening;
          if (
            center.x + radius <= openingLeft ||
            center.x - radius >= openingRight
          ) {
            return false;
          }

          const direction =
            center.x < window.innerWidth / 2 ? 1 : -1;
          const inwardTravel = Math.min(
            radius * 0.18,
            Math.max(3, impact * radius * 0.3),
          );
          body.position.x += direction * inwardTravel;
          body.velocity.x += direction * impact * 0.25;
          body.velocity.y = Math.min(
            body.velocity.y - impact * 0.18,
            -0.06,
          );

          const nudgedCenter = getBodyCenter(body);
          if (fitsAirHockeyGoalAtX(body, nudgedCenter.x)) {
            beginAirHockeyGoalTransit(body);
            return true;
          }

          constrainCollisionBody(body);
          return true;
        };

        const hasClearedAirHockeyGoal = (body) => {
          const center = getBodyCenter(body);
          return center.y + getBodyCollisionRadius(body) < -8;
        };

        const halveAllBallsForSpawn = () => {
          const primaryCenter = getBodyCenter(primaryCollisionBody);
          ringScale *= 0.5;
          for (let index = 0; index < softBodyPoints; index += 1) {
            deformation[index] *= 0.5;
            deformationVelocity[index] *= 0.5;
            nextDeformationVelocity[index] *= 0.5;
          }
          for (const ball of spawnedBalls) {
            ball.scale *= 0.5;
          }

          renderCircularView();
          ballPosition.x = primaryCenter.x - ballSize / 2;
          ballPosition.y = primaryCenter.y - ballSize / 2;
          constrainBall();
          positionBall();

          if (dragState) {
            dragState.offsetX = dragState.lastX - ballPosition.x;
            dragState.offsetY = dragState.lastY - ballPosition.y;
            dragState.grabOffsetX =
              dragState.lastX - (ballPosition.x + ballSize / 2);
            dragState.grabOffsetY =
              dragState.lastY - (ballPosition.y + ballSize / 2);
          }
          for (const ball of spawnedBalls) {
            if (!ball.drag) continue;
            ball.drag.offsetX = ball.drag.lastX - ball.position.x;
            ball.drag.offsetY = ball.drag.lastY - ball.position.y;
          }

          activeBallContacts.clear();
        };

        const getBodyByElement = (element) => {
          const id = Number(element?.dataset?.ballId);
          if (id === 0) return primaryCollisionBody;
          return spawnedBalls.find((ball) => ball.id === id) || null;
        };

        const isBodyLocked = (body) =>
          body.id === 0
            ? Boolean(dragState || pinchState)
            : Boolean(body.drag);

        const constrainCollisionBody = (body) => {
          if (body.id === 0) {
            constrainBall();
          } else {
            constrainSpawnedBall(body);
          }
        };

        const positionCollisionBody = (body, time) => {
          if (body.id === 0) {
            if (!pinchState) positionBall();
          } else {
            positionSpawnedBall(body, time);
          }
        };

        const showAirHockeyScoreBurst = (points = 1) => {
          airHockeyScoreBurst.textContent = `+${points}`;
          airHockeyScoreBurst.classList.remove("is-visible");
          void airHockeyScoreBurst.offsetWidth;
          airHockeyScoreBurst.classList.add("is-visible");
          window.clearTimeout(scoreBurstTimer);
          scoreBurstTimer = window.setTimeout(() => {
            airHockeyScoreBurst.classList.remove("is-visible");
          }, 700);
        };

        const renderAirHockeyLeaderboard = (entries = []) => {
          airHockeyLeaderboardList.replaceChildren();

          for (let index = 0; index < 10; index += 1) {
            const entry = entries[index];
            const item = document.createElement("li");
            const rank = document.createElement("span");
            const name = document.createElement("span");
            const score = document.createElement("span");

            rank.textContent = String(index + 1).padStart(2, "0");
            rank.className = "air-hockey-leaderboard-rank";
            name.textContent = entry?.initials || "—";
            name.className = "air-hockey-leaderboard-name";
            score.textContent = entry ? String(entry.score) : "—";
            score.className = "air-hockey-leaderboard-score";

            item.append(rank, name, score);
            airHockeyLeaderboardList.append(item);
          }
        };

        const setAirHockeyLeaderboardStatus = (message, isError = false) => {
          airHockeyLeaderboardStatus.textContent = message;
          airHockeyLeaderboardStatus.classList.toggle("is-error", isError);
        };

        const fetchAirHockeyLeaderboard = () => readLeaderboard();

        const loadAirHockeyLeaderboard = async (score) => {
          const round = airHockeyState;
          airHockeyLeaderboardForm.hidden = true;
          setAirHockeyLeaderboardStatus("Cargando clasificación…");

          try {
            const data = await fetchAirHockeyLeaderboard();
            if (airHockeyState !== round || !round?.roundOver) return;

            const entries = Array.isArray(data.entries) ? data.entries : [];
            renderAirHockeyLeaderboard(entries);
            if (data.bestScore !== null && score <= data.bestScore) {
              setAirHockeyLeaderboardStatus(`Tu mejor marca: ${data.bestScore} ${data.bestScore === 1 ? "gol" : "goles"}`);
              return;
            }
            const qualifies =
              entries.length < 10 ||
              score > Number(entries[entries.length - 1]?.score ?? -1);

            airHockeyLeaderboardForm.hidden = !qualifies;
            setAirHockeyLeaderboardStatus(!entries.length ? "Aún no hay marcas. Estrena la clasificación." :
              qualifies ? "" : "Esta marca no entra en el top 10.");
          } catch (error) {
            if (airHockeyState !== round || !round?.roundOver) return;
            renderAirHockeyLeaderboard();
            setAirHockeyLeaderboardStatus(
              error.message || "Clasificación no disponible",
              true,
            );
          }
        };

        airHockeyLeaderboardForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!airHockeyState?.roundOver) return;
          const round = airHockeyState;

          let name;
          try {
            name = validateScore(airHockeyNameInput.value, round.score);
          } catch (error) {
            setAirHockeyLeaderboardStatus(error.message, true);
            airHockeyNameInput.focus();
            return;
          }
          airHockeyNameInput.value = name;

          airHockeyLeaderboardSubmit.disabled = true;
          setAirHockeyLeaderboardStatus("Guardando…");

          try {
            const data = await saveScore(name, Number(round.score || 0));
            if (airHockeyState !== round || !round.roundOver) return;

            renderAirHockeyLeaderboard(data.entries);
            airHockeyLeaderboardForm.hidden = true;
            setAirHockeyLeaderboardStatus(
              !data.improved ? `Tu mejor marca (${data.bestScore}) ya está guardada.` :
                data.qualified ? "Marca guardada en la clasificación general." : "Marca guardada. Aún no entra en el top 10.",
            );
          } catch (error) {
            if (airHockeyState !== round || !round.roundOver) return;
            setAirHockeyLeaderboardStatus(
              error.message || "No se ha podido guardar la puntuación",
              true,
            );
          } finally {
            airHockeyLeaderboardSubmit.disabled = false;
          }
        });

        const finishAirHockeyRound = () => {
          if (!airHockeyState || airHockeyState.roundOver) return;

          airHockeyState.roundOver = true;
          window.clearInterval(roundClockTimer);
          roundClockTimer = 0;
          airHockeyTimer.textContent = ":00";
          document.body.classList.add("air-hockey-round-over");

          primaryGoalTransit = false;
          circularView.classList.remove("is-goal-transit", "is-dragging");
          ballVelocity.x = 0;
          ballVelocity.y = 0;
          dragState = null;
          activePointers.clear();
          constrainBall();
          positionBall();

          for (const ball of spawnedBalls) {
            ball.goalTransit = false;
            ball.element.classList.remove("is-goal-transit", "is-dragging");
            ball.velocity.x = 0;
            ball.velocity.y = 0;
            ball.drag = null;
            constrainSpawnedBall(ball);
            positionSpawnedBall(ball);
          }

          airHockeyFinalScore.textContent = String(airHockeyState.score);
          airHockeyFinalScore.style.setProperty(
            "--score-digits",
            String(airHockeyState.score).length,
          );
          airHockeyFinalLabel.textContent =
            airHockeyState.score === 1 ? "gol" : "goles";
          airHockeyEndCard.setAttribute("aria-hidden", "false");
          document.body.classList.add("air-hockey-show-results");
          loadAirHockeyLeaderboard(airHockeyState.score);
          window.requestAnimationFrame(() => airHockeyReplay.focus());
        };

        const startAirHockeyRound = () => {
          window.clearInterval(roundClockTimer);
          window.clearTimeout(roundEndTimer);
          roundEndTimer = 0;
          airHockeyTimer.textContent = ":15";
          airHockeyScore.textContent = "0";
          airHockeyFinalScore.textContent = "0";
          airHockeyFinalScore.style.removeProperty("--score-digits");
          airHockeyFinalLabel.textContent = "goles";
          airHockeyLeaderboardForm.reset();
          airHockeyLeaderboardForm.hidden = true;
          setAirHockeyLeaderboardStatus("");
          renderAirHockeyLeaderboard();
          airHockeyEndCard.setAttribute("aria-hidden", "true");
          document.body.classList.remove(
            "air-hockey-round-over",
            "air-hockey-show-results",
          );

          const updateClock = () => {
            if (!airHockeyState || airHockeyState.roundOver) return;
            const remaining = Math.max(
              0,
              airHockeyState.roundEndsAt - performance.now(),
            );
            const seconds = Math.ceil(remaining / 1000);
            airHockeyTimer.textContent =
              `:${String(seconds).padStart(2, "0")}`;
            if (remaining <= 0) finishAirHockeyRound();
          };

          roundClockTimer = window.setInterval(updateClock, 50);
          updateClock();
        };

        const resetScoredAirHockeyPuck = (body, time) => {
          if (
            !airHockeyState ||
            airHockeyState.roundOver ||
            !body.goalTransit
          ) {
            return;
          }

          const bankBounces = body.isPassive
            ? Math.max(0, Number(body.bankBounces) || 0)
            : 0;
          const points = 2 ** Math.min(bankBounces, 30);
          airHockeyState.score += points;
          airHockeyScore.textContent = String(airHockeyState.score);
          showAirHockeyScoreBurst(points);
          airHockeyGoal.dataset.score = String(airHockeyState.score);
          airHockeyGoal.classList.remove("is-scored");
          void airHockeyGoal.offsetWidth;
          airHockeyGoal.classList.add("is-scored");
          window.clearTimeout(goalPulseTimer);
          goalPulseTimer = window.setTimeout(() => {
            airHockeyGoal.classList.remove("is-scored");
          }, 360);

          body.goalTransit = false;
          body.bankBounces = 0;
          body.element.classList.remove("is-goal-transit");
          const radius = getBodyCollisionRadius(body);
          const otherBodies = [primaryCollisionBody, ...spawnedBalls].filter(
            (other) => other !== body && !other.goalTransit,
          );
          const minimumRespawnX = radius + 12;
          const maximumRespawnX = Math.max(
            minimumRespawnX,
            window.innerWidth - radius - 12,
          );
          const minimumRespawnY = Math.max(
            radius + 72,
            window.innerHeight * 0.28,
          );
          const maximumRespawnY = Math.max(
            minimumRespawnY,
            window.innerHeight - radius - 24,
          );
          const candidateCenters = Array.from({ length: 8 }, () => ({
            x:
              minimumRespawnX +
              Math.random() * (maximumRespawnX - minimumRespawnX),
            y:
              minimumRespawnY +
              Math.random() * (maximumRespawnY - minimumRespawnY),
          }));
          let bestCandidate = candidateCenters[0];
          let bestClearance = -Infinity;

          for (const candidate of candidateCenters) {
            let clearance = Infinity;
            for (const other of otherBodies) {
              const otherCenter = getBodyCenter(other);
              clearance = Math.min(
                clearance,
                Math.hypot(
                  candidate.x - otherCenter.x,
                  candidate.y - otherCenter.y,
                ) -
                  radius -
                  getBodyCollisionRadius(other),
              );
            }
            if (clearance > bestClearance) {
              bestClearance = clearance;
              bestCandidate = candidate;
            }
          }

          body.position.x = bestCandidate.x - body.size / 2;
          body.position.y = bestCandidate.y - body.size / 2;
          constrainCollisionBody(body);
          body.velocity.x =
            bestCandidate.x < window.innerWidth / 2 ? 0.055 : -0.055;
          body.velocity.y = -0.16;
          body.spinVelocity = body.velocity.x * 0.012;
          if (body.id === 0) {
            deformation.fill(0);
            deformationVelocity.fill(0);
            nextDeformationVelocity.fill(0);
          } else {
            body.squish = null;
          }
          activeBallContacts.clear();
          positionCollisionBody(body, time);
          playCollisionSound(0.8, 0.7);
          try {
            navigator.vibrate?.([8, 24, 8]);
          } catch {}
        };

        const setSpawnedBallSquish = (ball, angle, impact, time) => {
          ball.squish = {
            angle,
            amount: Math.min(0.12, Math.max(0.025, impact * 0.12)),
            startedAt: time,
            duration: 170,
          };
        };

        const attachSpawnedBallInteractions = (ball) => {
          const beginSpawnedBallDrag = (event) => {
            if (
              popState ||
              ball.goalTransit ||
              ball.drag ||
              event.button !== 0 ||
              event.isPrimary === false
            ) {
              return;
            }

            event.preventDefault();
            ensureAudioContext();
            ball.element.setPointerCapture(event.pointerId);
            ball.drag = {
              pointerId: event.pointerId,
              offsetX: event.clientX - ball.position.x,
              offsetY: event.clientY - ball.position.y,
              lastX: event.clientX,
              lastY: event.clientY,
              lastTime: performance.now(),
            };
            ball.velocity.x = 0;
            ball.velocity.y = 0;
            artwork.appendChild(ball.element);
            ball.element.classList.add("is-dragging");
          };

          const moveSpawnedBall = (event) => {
            if (ball.drag?.pointerId !== event.pointerId || popState) return;

            event.preventDefault();
            const now = performance.now();
            const delta = Math.max(1, now - ball.drag.lastTime);
            ball.position.x = event.clientX - ball.drag.offsetX;
            ball.position.y = event.clientY - ball.drag.offsetY;
            ball.velocity.x = (event.clientX - ball.drag.lastX) / delta;
            ball.velocity.y = (event.clientY - ball.drag.lastY) / delta;
            ball.drag.lastX = event.clientX;
            ball.drag.lastY = event.clientY;
            ball.drag.lastTime = now;
            constrainSpawnedBall(ball);
            positionSpawnedBall(ball, now);
          };

          const releaseSpawnedBall = (event) => {
            if (ball.drag?.pointerId !== event.pointerId) return;
            ball.drag = null;
            ball.element.classList.remove("is-dragging");
            constrainSpawnedBall(ball);
            positionSpawnedBall(ball);
          };

          const cancelSpawnedBall = (event) => {
            if (ball.drag?.pointerId !== event.pointerId) return;
            ball.velocity.x = 0;
            ball.velocity.y = 0;
            releaseSpawnedBall(event);
          };

          ball.element.addEventListener("pointerdown", beginSpawnedBallDrag);
          ball.element.addEventListener("pointermove", moveSpawnedBall);
          ball.element.addEventListener("pointerup", releaseSpawnedBall);
          ball.element.addEventListener("pointercancel", cancelSpawnedBall);
          document.addEventListener("pointerup", releaseSpawnedBall, {
            capture: true,
            passive: true,
          });
          document.addEventListener("pointercancel", cancelSpawnedBall, {
            capture: true,
            passive: true,
          });

          ball.detachInteractions = () => {
            ball.element.removeEventListener(
              "pointerdown",
              beginSpawnedBallDrag,
            );
            ball.element.removeEventListener("pointermove", moveSpawnedBall);
            ball.element.removeEventListener("pointerup", releaseSpawnedBall);
            ball.element.removeEventListener(
              "pointercancel",
              cancelSpawnedBall,
            );
            document.removeEventListener("pointerup", releaseSpawnedBall, true);
            document.removeEventListener(
              "pointercancel",
              cancelSpawnedBall,
              true,
            );
          };
        };

        const enterAirHockeyMode = (source, tapX, tapY) => {
          if (
            airHockeyState ||
            spawnedBalls.length > 0 ||
            popState ||
            dragState ||
            pinchState ||
            spawnedBalls.some((ball) => ball.drag)
          ) {
            return null;
          }

          airHockeyState = {
            baseScale: ringScale,
            goalWidth: 0,
            score: 0,
            roundEndsAt: performance.now() + 15000,
            roundOver: false,
          };
          primaryGoalTransit = false;
          airHockeyGoal.dataset.score = "0";
          airHockeyGoal.classList.remove("is-scored");
          document.body.classList.add("air-hockey-mode");
          startAirHockeyRound();
          motionAcceleration.x = 0;
          motionAcceleration.y = 0;
          halveAllBallsForSpawn();

          const element = document.createElement("div");
          const id = nextBallId;
          nextBallId += 1;
          element.className = "circular-view spawned-ring is-passive";
          element.dataset.ballId = String(id);
          element.setAttribute("role", "img");
          element.setAttribute(
            "aria-label",
            circularView.getAttribute("aria-label") || "Material de clase de Diego Ayala",
          );

          const ball = {
            id,
            element,
            scale: source.scale,
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
            spinAngle: source.spinAngle + 0.08,
            spinVelocity: source.spinVelocity * 0.75,
            drag: null,
            isPassive: true,
            bankBounces: 0,
            squish: null,
            goalTransit: false,
          };
          artwork.appendChild(element);
          renderSpawnedBall(ball);

          const sourceCenter = getBodyCenter(source);
          const preferredAngle = Math.atan2(
            tapY - sourceCenter.y,
            tapX - sourceCenter.x,
          );
          const fallbackAngle = spawnSequence * 2.399963229728653;
          spawnSequence += 1;
          const preferred = Number.isFinite(preferredAngle)
            ? preferredAngle
            : fallbackAngle;
          const separation =
            getBodyCollisionRadius(source) + ball.collisionRadius + 6;
          const existingBodies = [primaryCollisionBody, ...spawnedBalls];
          let bestCandidate = null;

          for (let index = 0; index < 16; index += 1) {
            const offset =
              index === 0
                ? 0
                : Math.ceil(index / 2) * (Math.PI / 8) * (index % 2 ? 1 : -1);
            const angle = preferred + offset;
            const rawCenterX = sourceCenter.x + Math.cos(angle) * separation;
            const rawCenterY = sourceCenter.y + Math.sin(angle) * separation;
            const rawX = rawCenterX - ball.size / 2;
            const rawY = rawCenterY - ball.size / 2;
            const x = Math.min(
              Math.max(rawX, ball.bounds.minX),
              ball.bounds.maxX,
            );
            const y = Math.min(
              Math.max(rawY, ball.bounds.minY),
              ball.bounds.maxY,
            );
            const centerX = x + ball.size / 2;
            const centerY = y + ball.size / 2;
            let overlapPenalty = 0;

            for (const other of existingBodies) {
              const otherCenter = getBodyCenter(other);
              const distance = Math.hypot(
                centerX - otherCenter.x,
                centerY - otherCenter.y,
              );
              const overlap = Math.max(
                0,
                ball.collisionRadius +
                  getBodyCollisionRadius(other) +
                  4 -
                  distance,
              );
              overlapPenalty += overlap * overlap * 12;
            }

            const clampPenalty = Math.hypot(x - rawX, y - rawY) * 2;
            const angularPenalty = Math.abs(offset) * 8;
            const score = overlapPenalty + clampPenalty + angularPenalty;
            if (!bestCandidate || score < bestCandidate.score) {
              bestCandidate = { x, y, angle, score };
            }
          }

          ball.position.x = bestCandidate?.x ?? source.position.x;
          ball.position.y = bestCandidate?.y ?? source.position.y;
          const kickAngle = bestCandidate?.angle ?? preferred;
          const kickX = Math.cos(kickAngle);
          const kickY = Math.sin(kickAngle);
          ball.velocity.x = source.velocity.x + kickX * 0.14;
          ball.velocity.y = source.velocity.y + kickY * 0.14 - 0.02;
          if (!isBodyLocked(source)) {
            source.velocity.x -= kickX * 0.045;
            source.velocity.y -= kickY * 0.045;
          }

          spawnedBalls.push(ball);
          updateAirHockeyGoalGeometry();
          bouncesSinceThemeChange = 0;
          lastTapByBall.clear();
          activeBallContacts.add(
            [source.id, ball.id].sort((a, b) => a - b).join(":"),
          );
          positionSpawnedBall(ball);
          playCollisionSound(0.9, 0.55);
          try {
            navigator.vibrate?.(10);
          } catch {}
          return ball;
        };

        const exitAirHockeyMode = (source) => {
          if (!airHockeyState) return;

          const survivorCenter = getBodyCenter(source);
          const survivorSpinAngle = source.spinAngle;
          const restoredScale = airHockeyState.baseScale;

          airHockeyState = null;
          window.clearTimeout(goalPulseTimer);
          window.clearInterval(roundClockTimer);
          window.clearTimeout(roundEndTimer);
          window.clearTimeout(scoreBurstTimer);
          goalPulseTimer = 0;
          roundClockTimer = 0;
          roundEndTimer = 0;
          scoreBurstTimer = 0;
          airHockeyGoal.classList.remove("is-scored");
          airHockeyGoal.dataset.score = "0";
          airHockeyScoreBurst.classList.remove("is-visible");
          airHockeyEndCard.setAttribute("aria-hidden", "true");
          document.body.classList.remove(
            "air-hockey-mode",
            "air-hockey-round-over",
            "air-hockey-show-results",
          );

          for (const ball of spawnedBalls) {
            ball.drag = null;
            ball.detachInteractions?.();
            ball.element.remove();
          }
          spawnedBalls.length = 0;
          primaryGoalTransit = false;
          circularView.classList.remove("is-goal-transit", "is-dragging");
          activePointers.clear();
          dragState = null;
          pinchState = null;
          heldSpinAngle = null;
          resetDragPressure();
          tapCandidates.clear();
          lastTapByBall.clear();
          activeBallContacts.clear();
          bouncesSinceThemeChange = 0;

          deformation.fill(0);
          deformationVelocity.fill(0);
          nextDeformationVelocity.fill(0);
          ringScale = restoredScale;
          spinAngle = survivorSpinAngle;
          spinVelocity = 0;
          motionAcceleration.x = 0;
          motionAcceleration.y = 0;
          lastMotionTime = -Infinity;
          ballVelocity.x = 0;
          ballVelocity.y = 0;
          renderCircularView();
          ballPosition.x = survivorCenter.x - ballSize / 2;
          ballPosition.y = survivorCenter.y - ballSize / 2;
          constrainBall();
          positionBall();
          drawRing();
          playCollisionSound(0.7, 0.45);
          try {
            navigator.vibrate?.(8);
          } catch {}
        };

        airHockeyReplay.addEventListener("click", () => {
          if (!airHockeyState?.roundOver) return;
          const center = getBodyCenter(primaryCollisionBody);
          exitAirHockeyMode(primaryCollisionBody);
          window.requestAnimationFrame(() => {
            enterAirHockeyMode(
              primaryCollisionBody,
              center.x + ballSize * 0.7,
              center.y,
            );
          });
        });
        airHockeyDone.addEventListener("click", () => {
          if (airHockeyState) exitAirHockeyMode(primaryCollisionBody);
        });

        const updateSpawnedBalls = (time, delta, frameDelta) => {
          const direction = circleSettings.direction === "reverse" ? -1 : 1;
          const automaticSpinVelocity =
            direction *
            (Math.PI * 2) /
            (circleSettings.spinDuration * 1000);
          const motionIsFresh = time - lastMotionTime < 180;
          let strongestImpact = 0;

          for (const ball of spawnedBalls) {
            const isResting =
              !airHockeyState &&
              !ball.drag &&
              ball.position.y >= ball.bounds.maxY - 0.75 &&
              Math.abs(ball.velocity.x) < 0.03 &&
              Math.abs(ball.velocity.y) < 0.03;

            if (!ball.drag) {
              const previousCenter = getBodyCenter(ball);
              if (!airHockeyState && motionIsFresh) {
                const motionStrength = 0.00015;
                ball.velocity.x +=
                  motionAcceleration.x * motionStrength * delta;
                ball.velocity.y +=
                  motionAcceleration.y * motionStrength * delta;
              }

              ball.velocity.y +=
                (airHockeyState ? 0 : circleSettings.gravity) * delta;
              ball.position.x += ball.velocity.x * delta;
              ball.position.y += ball.velocity.y * delta;

              if (crossesAirHockeyGoal(ball, previousCenter)) {
                beginAirHockeyGoalTransit(ball);
              }

              const hitLeft =
                !ball.goalTransit &&
                ball.position.x <= ball.bounds.minX &&
                ball.velocity.x < 0;
              const hitRight =
                !ball.goalTransit &&
                ball.position.x >= ball.bounds.maxX &&
                ball.velocity.x > 0;
              const topConstraint = getAirHockeyRailConstraint(
                ball,
                ball.bounds.minY,
              );
              const topApproach =
                ball.velocity.x * topConstraint.normalX +
                ball.velocity.y * topConstraint.normalY;
              const hitTop =
                !ball.goalTransit &&
                ball.position.y <= topConstraint.minimumY &&
                topApproach < 0;
              const hitBottom =
                !ball.goalTransit &&
                ball.position.y >= ball.bounds.maxY &&
                ball.velocity.y > 0;
              const impactX = Math.abs(ball.velocity.x);
              const impactY = hitTop
                ? Math.abs(topApproach)
                : Math.abs(ball.velocity.y);
              let registeredBounce = false;

              if (hitLeft || hitRight) {
                ball.position.x = Math.min(
                  Math.max(ball.position.x, ball.bounds.minX),
                  ball.bounds.maxX,
                );
                ball.velocity.x *= -getPhysicsBounce();
                strongestImpact = Math.max(strongestImpact, impactX);
                registeredBounce ||= impactX >= 0.04;
                setSpawnedBallSquish(
                  ball,
                  hitLeft ? Math.PI : 0,
                  impactX,
                  time,
                );
              }

              if (hitTop || hitBottom) {
                ball.position.y = Math.min(
                  Math.max(
                    ball.position.y,
                    topConstraint.minimumY,
                  ),
                  ball.bounds.maxY,
                );
                if (!airHockeyState && hitBottom && impactY < 0.04) {
                  ball.velocity.y = 0;
                } else if (hitTop && airHockeyState) {
                  const bounce = getPhysicsBounce();
                  ball.velocity.x -=
                    (1 + bounce) *
                    topApproach *
                    topConstraint.normalX;
                  ball.velocity.y -=
                    (1 + bounce) *
                    topApproach *
                    topConstraint.normalY;
                  strongestImpact = Math.max(strongestImpact, impactY);
                  registeredBounce ||= impactY >= 0.04;
                  setSpawnedBallSquish(
                    ball,
                    Math.atan2(
                      -topConstraint.normalY,
                      -topConstraint.normalX,
                    ),
                    impactY,
                    time,
                  );
                } else {
                  ball.velocity.y *= -getPhysicsBounce();
                  strongestImpact = Math.max(strongestImpact, impactY);
                  registeredBounce ||= impactY >= 0.04;
                  setSpawnedBallSquish(
                    ball,
                    Math.PI / 2,
                    impactY,
                    time,
                  );
                }
              }

              if (registeredBounce) {
                if (airHockeyState && ball.isPassive) {
                  ball.bankBounces += 1;
                }
                registerBounceForTheme();
              }

              const damping = Math.pow(getPhysicsFriction(), frameDelta);
              ball.velocity.x *= damping;
              ball.velocity.y *= damping;

              if (
                ball.goalTransit &&
                hasClearedAirHockeyGoal(ball)
              ) {
                resetScoredAirHockeyPuck(ball, time);
              }
            }

            if (!isResting) {
              ball.spinAngle +=
                (automaticSpinVelocity + ball.spinVelocity) * delta;
              ball.spinVelocity *= Math.pow(0.991, frameDelta);
            } else {
              ball.spinVelocity *= Math.pow(0.88, frameDelta);
              if (Math.abs(ball.spinVelocity) < 0.00001) {
                ball.spinVelocity = 0;
              }
            }

            constrainSpawnedBall(ball);
            positionSpawnedBall(ball, time);
          }

          return strongestImpact;
        };

        const resolveBallCollisions = (time) => {
          const bodies = (
            popState
              ? [...spawnedBalls]
              : [primaryCollisionBody, ...spawnedBalls]
          );
          const nextContacts = new Set();
          let strongestImpact = 0;

          for (let iteration = 0; iteration < 3; iteration += 1) {
            for (let firstIndex = 0; firstIndex < bodies.length; firstIndex += 1) {
              for (
                let secondIndex = firstIndex + 1;
                secondIndex < bodies.length;
                secondIndex += 1
              ) {
                const first = bodies[firstIndex];
                const second = bodies[secondIndex];
                const key = [first.id, second.id]
                  .sort((a, b) => a - b)
                  .join(":");
                const firstCenter = getBodyCenter(first);
                const secondCenter = getBodyCenter(second);
                let dx = secondCenter.x - firstCenter.x;
                let dy = secondCenter.y - firstCenter.y;
                let distance = Math.hypot(dx, dy);
                if (distance < 0.0001) {
                  const angle = (first.id * 2.399963 + second.id) % (Math.PI * 2);
                  dx = Math.cos(angle);
                  dy = Math.sin(angle);
                  distance = 1;
                }
                const normalX = dx / distance;
                const normalY = dy / distance;
                const firstRadius = getBodyCollisionRadius(first);
                const secondRadius = getBodyCollisionRadius(second);
                const minimumDistance = firstRadius + secondRadius;
                const wasTouching = activeBallContacts.has(key);

                if (
                  iteration === 0 &&
                  distance <= minimumDistance + (wasTouching ? 3 : 0)
                ) {
                  nextContacts.add(key);
                }

                const overlap = minimumDistance - distance;
                if (overlap <= 0) continue;

                const firstInverseMass = isBodyLocked(first)
                  ? 0
                  : 1 / (firstRadius * firstRadius);
                const secondInverseMass = isBodyLocked(second)
                  ? 0
                  : 1 / (secondRadius * secondRadius);
                const inverseMassTotal =
                  firstInverseMass + secondInverseMass;
                if (inverseMassTotal <= 0) continue;

                const correction =
                  (Math.max(0, overlap - 0.5) * 0.85) /
                  inverseMassTotal;
                first.position.x -=
                  normalX * correction * firstInverseMass;
                first.position.y -=
                  normalY * correction * firstInverseMass;
                second.position.x +=
                  normalX * correction * secondInverseMass;
                second.position.y +=
                  normalY * correction * secondInverseMass;
                constrainCollisionBody(first);
                constrainCollisionBody(second);

                if (iteration > 0) continue;

                const relativeX = second.velocity.x - first.velocity.x;
                const relativeY = second.velocity.y - first.velocity.y;
                const normalVelocity =
                  relativeX * normalX + relativeY * normalY;
                const impact = Math.max(0, -normalVelocity);

                if (normalVelocity < 0) {
                  const restitution =
                    impact >= 0.04 ? getPhysicsBounce() : 0;
                  const impulse =
                    (-(1 + restitution) * normalVelocity) /
                    inverseMassTotal;
                  first.velocity.x -=
                    impulse * firstInverseMass * normalX;
                  first.velocity.y -=
                    impulse * firstInverseMass * normalY;
                  second.velocity.x +=
                    impulse * secondInverseMass * normalX;
                  second.velocity.y +=
                    impulse * secondInverseMass * normalY;
                }

                const heldContact =
                  isBodyLocked(first) || isBodyLocked(second);
                const overlapPressure = Math.min(
                  0.18,
                  Math.max(0, overlap / minimumDistance),
                );
                const sustainedShove = heldContact
                  ? Math.max(0.08, overlapPressure)
                  : overlap > 2
                    ? Math.max(0.04, overlapPressure)
                    : 0;
                const shoveStrength = Math.max(
                  impact,
                  sustainedShove,
                );

                if (shoveStrength >= 0.025) {
                  const firstIsDeeper =
                    getBodyCenter(first).y <= getBodyCenter(second).y;
                  const deeperBody = firstIsDeeper ? first : second;
                  const otherBody = firstIsDeeper ? second : first;
                  if (
                    !nudgePartialGoalPuck(
                      deeperBody,
                      shoveStrength,
                    )
                  ) {
                    nudgePartialGoalPuck(otherBody, shoveStrength);
                  }
                }

                if (!wasTouching && impact >= 0.04) {
                  const passiveBody = first.isPassive
                    ? first
                    : second.isPassive
                      ? second
                      : null;
                  const hitPlayerCircle =
                    first.id === 0 || second.id === 0;
                  if (
                    airHockeyState &&
                    passiveBody &&
                    hitPlayerCircle
                  ) {
                    passiveBody.bankBounces = 0;
                  }

                  strongestImpact = Math.max(strongestImpact, impact);
                  registerBounceForTheme();
                  if (first.id === 0) {
                    injectCollisionAtAngle(
                      Math.atan2(normalY, normalX),
                      impact,
                      ringLayout?.radius || first.radius,
                    );
                  } else {
                    setSpawnedBallSquish(
                      first,
                      Math.atan2(normalY, normalX),
                      impact,
                      time,
                    );
                  }
                  if (second.id === 0) {
                    injectCollisionAtAngle(
                      Math.atan2(-normalY, -normalX),
                      impact,
                      ringLayout?.radius || second.radius,
                    );
                  } else {
                    setSpawnedBallSquish(
                      second,
                      Math.atan2(-normalY, -normalX),
                      impact,
                      time,
                    );
                  }
                }
              }
            }
          }

          activeBallContacts = nextContacts;
          for (const body of bodies) {
            positionCollisionBody(body, time);
          }
          return strongestImpact;
        };

        const removePopCanvas = () => {
          popCanvas?.remove();
          popCanvas = null;
          popContext = null;
        };

        const getPopPose = (index, rect, useDeformation = false) => {
          const angle =
            (circleSettings.startRotation * Math.PI) / 180 +
            spinAngle +
            ringLayout.angles[index];
          const pose = getContactRingPose(angle, index, useDeformation);
          return {
            x: rect.left + pose.x,
            y: rect.top + pose.y,
            rotation: pose.rotation,
          };
        };

        const triggerPop = (edge) => {
          if (popState || !ringCanvas || !ringLayout) return;

          const ratio = Math.min(window.devicePixelRatio || 1, 2);
          const rect = circularView.getBoundingClientRect();
          popCanvas = document.createElement("canvas");
          popCanvas.width = Math.ceil(window.innerWidth * ratio);
          popCanvas.height = Math.ceil(window.innerHeight * ratio);
          Object.assign(popCanvas.style, {
            position: "fixed",
            left: "0",
            top: "0",
            width: `${window.innerWidth}px`,
            height: `${window.innerHeight}px`,
            pointerEvents: "none",
            zIndex: "8",
          });
          popCanvas.setAttribute("aria-hidden", "true");
          document.body.appendChild(popCanvas);
          popContext = popCanvas.getContext("2d", {
            alpha: true,
            desynchronized: true,
          });
          popContext.font = ringFont(circleSettings.fontSize * ringScale);
          popContext.textAlign = "center";
          popContext.textBaseline = "middle";
          popContext.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue("--page-foreground")
            .trim() || "#fff";

          const particleGroups = [];

          if (circleSettings.popPieces === "words") {
            let indices = [];
            const flushWord = () => {
              if (!indices.length) return;
              particleGroups.push({
                indices,
                text: indices
                  .map((index) => ringLayout.characters[index])
                  .join(""),
              });
              indices = [];
            };

            for (
              let index = 0;
              index < ringLayout.characters.length;
              index += 1
            ) {
              const character = ringLayout.characters[index];
              if (!ringLayout.visible[index] || /\s/.test(character)) {
                flushWord();
                continue;
              }
              indices.push(index);
            }
            flushWord();
          } else {
            for (
              let index = 0;
              index < ringLayout.characters.length;
              index += 1
            ) {
              if (!ringLayout.visible[index]) continue;
              particleGroups.push({
                indices: [index],
                text: ringLayout.characters[index],
              });
            }
          }

          const particleFontSize = circleSettings.fontSize * ringScale;
          const particles = particleGroups.map(({ indices, text }) => {
            const middleIndex = indices[Math.floor(indices.length / 2)];
            const pose = getPopPose(middleIndex, rect, true);
            const outwardAngle = Math.atan2(
              pose.y - (rect.top + ringLayout.center),
              pose.x - (rect.left + ringLayout.center),
            );
            const burstAngle = outwardAngle + (Math.random() - 0.5) * 0.7;
            const speed =
              (0.12 + Math.random() * 0.15) * circleSettings.burstPower;
            const halfWidth =
              (popContext.measureText(text).width *
                ringLayout.horizontalScale) /
              2;

            return {
              index: middleIndex,
              indices,
              text,
              character: text,
              x: pose.x,
              y: pose.y,
              vx: Math.cos(burstAngle) * speed,
              vy: Math.sin(burstAngle) * speed - 0.035,
              rotation: pose.rotation,
              spin: (Math.random() - 0.5) * 0.004,
              boundRadius: Math.min(
                particleFontSize * 3,
                Math.hypot(halfWidth, particleFontSize * 0.55),
              ),
              settled: false,
            };
          });

          popState = {
            startTime: performance.now(),
            previousTime: performance.now(),
            particles,
            ratio,
            settled: false,
          };
          ringCanvas.style.opacity = "0";
          ballVelocity.x = 0;
          ballVelocity.y = 0;
          spinVelocity = 0;
          heldSpinAngle =
            dragState?.spinLockAngle ?? heldSpinAngle ?? spinAngle;
          dragState = null;
          pinchState = null;
          activePointers.clear();
          resetDragPressure();
          circularView.classList.remove("is-dragging");
          lastThumpTime = -Infinity;
          playBurstSound();
          try {
            navigator.vibrate?.([18, 28, 22]);
          } catch {}
        };

        const beginReassembly = () => {
          if (!popState || popState.reassembling || !ringLayout) return;

          deformation.fill(0);
          deformationVelocity.fill(0);
          const safeViewport = getSmallViewportRect();
          ballPosition.x =
            safeViewport.left + (safeViewport.width - ballSize) / 2;
          ballPosition.y =
            safeViewport.top + (safeViewport.height - ballSize) / 2;
          constrainBall();
          positionBall();
          const rect = circularView.getBoundingClientRect();
          const particleFontSize = circleSettings.fontSize * ringScale;
          popContext.font = ringFont(particleFontSize);

          if (
            popState.particles.some(
              (particle) => particle.indices?.length > 1,
            )
          ) {
            popState.particles = popState.particles.flatMap((particle) => {
              const indices = particle.indices?.length
                ? particle.indices
                : [particle.index];

              if (indices.length === 1) {
                const character = ringLayout.characters[indices[0]];
                return [{
                  ...particle,
                  index: indices[0],
                  indices: [indices[0]],
                  text: character,
                  character,
                  boundRadius: particleFontSize * 0.55,
                }];
              }

              const widths = indices.map(
                (index) =>
                  popContext.measureText(ringLayout.characters[index]).width *
                  ringLayout.horizontalScale,
              );
              const totalWidth = widths.reduce(
                (sum, width) => sum + width,
                0,
              );
              let offset = -totalWidth / 2;

              return indices.map((index, localIndex) => {
                const centerOffset = offset + widths[localIndex] / 2;
                offset += widths[localIndex];
                const character = ringLayout.characters[index];

                return {
                  ...particle,
                  index,
                  indices: [index],
                  text: character,
                  character,
                  x:
                    particle.x +
                    Math.cos(particle.rotation) * centerOffset,
                  y:
                    particle.y +
                    Math.sin(particle.rotation) * centerOffset,
                  vx: 0,
                  vy: 0,
                  spin: 0,
                  boundRadius: particleFontSize * 0.55,
                  settled: false,
                };
              });
            });
          }

          for (const particle of popState.particles) {
            const target = getPopPose(particle.index, rect, false);
            particle.returnX = particle.x;
            particle.returnY = particle.y;
            particle.returnRotation = particle.rotation;
            particle.targetX = target.x;
            particle.targetY = target.y;
            particle.targetRotation = target.rotation;
            particle.settled = false;
          }

          popState.settled = false;
          popState.reassembling = {
            startTime: performance.now(),
            duration: 720,
          };
          lastThumpTime = -Infinity;
          playCollisionSound(1.8);
          try {
            navigator.vibrate?.(12);
          } catch {}
        };

        const getSmallViewportRect = () => {
          if (!smallViewportProbe) {
            smallViewportProbe = document.createElement("div");
            smallViewportProbe.setAttribute("aria-hidden", "true");
            Object.assign(smallViewportProbe.style, {
              position: "fixed",
              left: "0",
              top: "0",
              width: "100svw",
              height: "100svh",
              visibility: "hidden",
              pointerEvents: "none",
              contain: "strict",
            });
            document.body.appendChild(smallViewportProbe);
          }

          const rect = smallViewportProbe.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) {
            return {
              left: 0,
              top: 0,
              right: window.innerWidth,
              bottom: window.innerHeight,
              width: window.innerWidth,
              height: window.innerHeight,
            };
          }
          return rect;
        };

        const updatePop = (time) => {
          if (!popState || !popContext || !popCanvas) return;

          const ratio = popState.ratio;
          const visualViewport = window.visualViewport;
          const reportedLeft = visualViewport?.offsetLeft || 0;
          const reportedTop = visualViewport?.offsetTop || 0;
          const reportedRight =
            reportedLeft + (visualViewport?.width || window.innerWidth);
          const reportedBottom =
            reportedTop + (visualViewport?.height || window.innerHeight);
          const smallViewport = getSmallViewportRect();

          // iOS Safari can report a visual viewport that still extends under
          // its translucent bottom toolbar. The small viewport is the
          // conservative browser-chrome-safe rectangle.
          const visibleLeft = Math.max(reportedLeft, smallViewport.left);
          const visibleTop = Math.max(reportedTop, smallViewport.top);
          const visibleRight = Math.min(reportedRight, smallViewport.right);
          const visibleBottom = Math.min(reportedBottom, smallViewport.bottom);
          const visibleWidth = Math.max(1, visibleRight - visibleLeft);
          const visibleHeight = Math.max(1, visibleBottom - visibleTop);
          const previousVisibleWidth =
            popState.visibleWidth ?? visibleWidth;
          const viewportChanged =
            Math.abs((popState.visibleLeft ?? visibleLeft) - visibleLeft) > 0.5 ||
            Math.abs((popState.visibleTop ?? visibleTop) - visibleTop) > 0.5 ||
            Math.abs(previousVisibleWidth - visibleWidth) > 0.5 ||
            Math.abs((popState.visibleHeight ?? visibleHeight) - visibleHeight) > 0.5;
          const orientationChanged =
            Math.abs(previousVisibleWidth - visibleWidth) > 40;
          popState.visibleLeft = visibleLeft;
          popState.visibleTop = visibleTop;
          popState.visibleWidth = visibleWidth;
          popState.visibleHeight = visibleHeight;

          const expectedWidth = Math.ceil(window.innerWidth * ratio);
          const expectedHeight = Math.ceil(window.innerHeight * ratio);

          // Keep the CSS box and backing buffer in the same coordinate
          // system. On iOS 27, 100vh can be taller than innerHeight while
          // Safari's bottom chrome is overlaid.
          popCanvas.style.width = `${window.innerWidth}px`;
          popCanvas.style.height = `${window.innerHeight}px`;

          const resized =
            popCanvas.width !== expectedWidth ||
            popCanvas.height !== expectedHeight;

          if (resized) {
            popCanvas.width = expectedWidth;
            popCanvas.height = expectedHeight;
            popContext.font = ringFont(circleSettings.fontSize * ringScale);
            popContext.textAlign = "center";
            popContext.textBaseline = "middle";
            popContext.fillStyle = getComputedStyle(document.documentElement)
              .getPropertyValue("--page-foreground")
              .trim() || "#fff";
            popState.settled = false;
            for (const particle of popState.particles) {
              particle.settled = false;
            }
          }

          if (viewportChanged && !resized) {
            popState.settled = false;
            for (const particle of popState.particles) {
              particle.settled = false;
              if (orientationChanged) {
                particle.floorY = undefined;
              }
            }
          }

          if (popState.settled && !resized && !viewportChanged) return;

          const elapsed = Math.min(
            64,
            Math.max(1, time - popState.previousTime),
          );
          popState.previousTime = time;
          const simulationSteps = Math.max(1, Math.ceil(elapsed / 16.667));
          const stepDelta = elapsed / simulationSteps;
          const gravity = Math.min(
            0.0021,
            Math.max(0.00145, visibleHeight * 0.0000017),
          );
          const fontSize = circleSettings.fontSize * ringScale;
          const sideMargin = Math.max(8, fontSize * 0.32);
          const ceiling = visibleTop + sideMargin;
          const leftWall = visibleLeft + sideMargin;
          const rightWall = visibleRight - sideMargin;
          const screenHeight = window.screen?.height || window.innerHeight;
          const safariOverlaysChrome =
            isIOS && window.innerHeight >= screenHeight * 0.92;
          const chromeGuard = safariOverlaysChrome
            ? Math.max(96, window.innerHeight * 0.115)
            : 0;
          const chromeSafeBottom = Math.min(
            visibleBottom,
            window.innerHeight - chromeGuard,
          );
          const floor =
            chromeSafeBottom - Math.max(12, fontSize * 0.9);
          let settledCount = 0;

          popContext.setTransform(ratio, 0, 0, ratio, 0, 0);
          popContext.clearRect(
            0,
            0,
            popCanvas.width / ratio,
            popCanvas.height / ratio,
          );

          if (popState.reassembling) {
            const progress = Math.min(
              1,
              (time - popState.reassembling.startTime) /
                popState.reassembling.duration,
            );
            const eased = 1 - Math.pow(1 - progress, 4);

            for (const particle of popState.particles) {
              particle.x =
                particle.returnX +
                (particle.targetX - particle.returnX) * eased;
              particle.y =
                particle.returnY +
                (particle.targetY - particle.returnY) * eased;
              const rotationDelta = normalizeAngle(
                particle.targetRotation - particle.returnRotation,
              );
              particle.rotation =
                particle.returnRotation + rotationDelta * eased;

              popContext.setTransform(
                ratio * Math.cos(particle.rotation) * ringLayout.horizontalScale,
                ratio * Math.sin(particle.rotation) * ringLayout.horizontalScale,
                ratio * -Math.sin(particle.rotation),
                ratio * Math.cos(particle.rotation),
                ratio * particle.x,
                ratio * particle.y,
              );
              popContext.fillText(particle.text ?? particle.character, 0, 0);
            }

            if (progress >= 1) {
              removePopCanvas();
              popState = null;
              ballVelocity.x = 0;
              ballVelocity.y = 0;
              if (ringCanvas) {
                ringCanvas.style.opacity = "";
                drawRing();
              }
            }
            return;
          }

          for (const particle of popState.particles) {
            const particleMargin = Math.max(
              sideMargin,
              particle.boundRadius || 0,
            );
            const particleCeiling = visibleTop + particleMargin;
            const particleLeftWall = visibleLeft + particleMargin;
            const particleRightWall = visibleRight - particleMargin;
            const particleFloorLimit =
              chromeSafeBottom - Math.max(12, particleMargin);

            if (!particle.settled) {
              for (let step = 0; step < simulationSteps; step += 1) {
                particle.vy += gravity * stepDelta;
                particle.x += particle.vx * stepDelta;
                particle.y += particle.vy * stepDelta;
                particle.rotation += particle.spin * stepDelta;

                if (
                  particle.x < particleLeftWall ||
                  particle.x > particleRightWall
                ) {
                  particle.x = Math.min(
                    particleRightWall,
                    Math.max(particleLeftWall, particle.x),
                  );
                  particle.vx *= -0.58;
                  particle.spin *= 0.82;
                }

                if (particle.y < particleCeiling) {
                  particle.y = particleCeiling;
                  particle.vy = Math.abs(particle.vy) * 0.46;
                }

                const particleFloor = Math.min(
                  particleFloorLimit,
                  particle.floorY ?? particleFloorLimit,
                );
                if (particle.y >= particleFloor) {
                  particle.y = particleFloor;
                  particle.floorY = particleFloor;
                  if (particle.vy > 0.065) {
                    particle.vy *= -0.28;
                    particle.vx *= 0.84;
                    particle.spin *= 0.68;
                  } else {
                    particle.vy = 0;
                    particle.vx *= Math.pow(0.88, stepDelta / 16.667);
                    particle.spin *= Math.pow(0.8, stepDelta / 16.667);
                  }

                  if (
                    Math.abs(particle.vy) < 0.018 &&
                    Math.abs(particle.vx) < 0.008 &&
                    Math.abs(particle.spin) < 0.00008
                  ) {
                    particle.vy = 0;
                    particle.vx = 0;
                    particle.spin = 0;
                    particle.settled = true;
                    break;
                  }
                }
              }
            }

            if (particle.settled) settledCount += 1;

            popContext.setTransform(
              ratio * Math.cos(particle.rotation) * ringLayout.horizontalScale,
              ratio * Math.sin(particle.rotation) * ringLayout.horizontalScale,
              ratio * -Math.sin(particle.rotation),
              ratio * Math.cos(particle.rotation),
              ratio * particle.x,
              ratio * particle.y,
            );
            popContext.fillText(particle.text ?? particle.character, 0, 0);
          }

          popState.settled = settledCount === popState.particles.length;
        };

        const updatePopCharge = (time) => {
          if (airHockeyState || !dragState || popState || !ringLayout) return;

          const pressure = Math.max(
            dragPressure.left,
            dragPressure.right,
            dragPressure.top,
            dragPressure.bottom,
          );
          const edge =
            dragPressure.left === pressure && pressure > 0
              ? "left"
              : dragPressure.right === pressure && pressure > 0
                ? "right"
                : dragPressure.top === pressure && pressure > 0
                  ? "top"
                  : dragPressure.bottom === pressure && pressure > 0
                    ? "bottom"
                    : "";
          const threshold = Math.max(
            30,
            ringLayout.radius * circleSettings.popDepth,
          );

          if (!edge || pressure < threshold) {
            dragState.popCharge = 0;
            dragState.popChargeEdge = "";
            dragState.popChargeStarted = 0;
            return;
          }

          if (dragState.popChargeEdge !== edge) {
            dragState.popChargeEdge = edge;
            dragState.popChargeStarted = time;
          }

          dragState.popCharge = Math.min(
            1,
            (time - dragState.popChargeStarted) / circleSettings.popHold,
          );

          if (dragState.popCharge >= 1) {
            triggerPop(edge);
          }
        };

        const renderCircularView = () => {
          const artworkRect = artwork.getBoundingClientRect();
          const baseSize = Math.max(
            180,
            Math.min(artworkRect.width, window.innerWidth - 12, window.innerHeight - 12),
          );
          const size = baseSize * ringScale;

          // Fit complete subject names by uniformly sizing the type, without
          // squeezing the letters horizontally on smaller viewports.
          context.font = ringFont(26);
          const textWidth = Array.from(circleText).reduce((total, character) =>
            total + context.measureText(character).width, 0);
          circleSettings.fontSize = Math.min(26,
            (Math.PI * 2 * baseSize * circleSettings.radius) / (textWidth / 26 + circleSettings.gap));
          ballSize = size;
          const renderedFontSize = circleSettings.fontSize * ringScale;
          const visibleRadius = Math.min(
            size * circleSettings.radius,
            size / 2 - renderedFontSize * 0.62 - 2 * ringScale,
          ) + renderedFontSize * 0.62;
          const opticalOvershoot = Math.max(2 * ringScale, renderedFontSize * 0.13);
          collisionInset =
            Math.max(0, size / 2 - visibleRadius) + opticalOvershoot;
          ringPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          ringCanvasPadding = Math.ceil(
            Math.max(renderedFontSize * 3, size * 0.12),
          );
          const ringCanvasSize = size + ringCanvasPadding * 2;
          ringCanvas = document.createElement("canvas");
          ringCanvas.className = "ring-canvas";
          ringCanvas.width = Math.ceil(ringCanvasSize * ringPixelRatio);
          ringCanvas.height = Math.ceil(ringCanvasSize * ringPixelRatio);
          Object.assign(ringCanvas.style, {
            position: "absolute",
            left: `-${ringCanvasPadding}px`,
            top: `-${ringCanvasPadding}px`,
            width: `${ringCanvasSize}px`,
            height: `${ringCanvasSize}px`,
          });
          ringContext = ringCanvas.getContext("2d", {
            alpha: true,
            desynchronized: true,
          });
          ringContext.imageSmoothingEnabled = true;
          ringContext.imageSmoothingQuality = "high";
          prepareRingLayout();

          circularView.style.width = `${size}px`;
          circularView.style.height = `${size}px`;
          if (popState) {
            ringCanvas.style.opacity = "0";
          }
          circularView.replaceChildren(
            ringCanvas,
            createRingHitTarget(
              size,
              Math.max(12, size / 2 - collisionInset),
            ),
          );
          updateBallBounds();

          if (!hasBallPosition) {
            ballPosition.x = (window.innerWidth - size) / 2;
            ballPosition.y = (window.innerHeight - size) / 2;
            hasBallPosition = true;
          }

          constrainBall();
          positionBall();
          drawRing();
          renderSpawnedBalls();
          updateAirHockeyGoalGeometry();
        };

        const updateSpinDebug = (time) => {
          if (!showTweaks || time - lastSpinDebugTime < 100) return;

          const debugOutput = document.querySelector(".circle-debug");
          if (!debugOutput) return;

          const pressure = Math.max(
            dragPressure.left,
            dragPressure.right,
            dragPressure.top,
            dragPressure.bottom,
          );
          const angleDegrees =
            ((((spinAngle * 180) / Math.PI) % 360) + 360) % 360;
          const deltaDegrees = hasSpinDebugSample
            ? (normalizeAngle(spinAngle - lastSpinDebugAngle) * 180) / Math.PI
            : 0;
          const lockedDegrees =
            heldSpinAngle === null
              ? "—"
              : (
                  ((((heldSpinAngle * 180) / Math.PI) % 360) + 360) %
                  360
                ).toFixed(2) + "°";
          const state = popState
            ? popState.reassembling
              ? "reassembling"
              : "popped"
            : heldSpinAngle !== null
              ? "wall-locked"
              : dragState
                ? "dragging"
                : "free";

          debugOutput.textContent =
            `state  ${state}\n` +
            `angle  ${angleDegrees.toFixed(2)}°\n` +
            `delta  ${deltaDegrees >= 0 ? "+" : ""}${deltaDegrees.toFixed(3)}°\n` +
            `lock   ${lockedDegrees}\n` +
            `press  ${pressure.toFixed(1)}px\n` +
            `charge ${Math.round((dragState?.popCharge || 0) * 100)}%`;

          lastSpinDebugTime = time;
          lastSpinDebugAngle = spinAngle;
          hasSpinDebugSample = true;
        };

        const runPhysics = (time) => {
          const delta = lastPhysicsTime ? Math.min(32, time - lastPhysicsTime) : 16;
          const frameDelta = delta / 16.667;
          lastPhysicsTime = time;
          const direction = circleSettings.direction === "reverse" ? -1 : 1;
          const isRestingOnBottom =
            !airHockeyState &&
            !dragState &&
            !pinchState &&
            ballPosition.y >= ballBounds.maxY - 0.75 &&
            Math.abs(ballVelocity.x) < 0.03 &&
            Math.abs(ballVelocity.y) < 0.03;
          const isHeldAgainstWall =
            Boolean(dragState) &&
            Math.max(
              dragPressure.left,
              dragPressure.right,
              dragPressure.top,
              dragPressure.bottom,
            ) > 0.5;

          if (
            isHeldAgainstWall &&
            dragState &&
            dragState.spinLockAngle === null
          ) {
            dragState.spinLockAngle = spinAngle;
          }

          const gestureSpinLock = dragState?.spinLockAngle;
          if (gestureSpinLock !== null && gestureSpinLock !== undefined) {
            heldSpinAngle = gestureSpinLock;
            spinAngle = gestureSpinLock;
          } else if (heldSpinAngle !== null && popState) {
            spinAngle = heldSpinAngle;
          } else if (!isRestingOnBottom) {
            heldSpinAngle = null;
            const automaticSpinVelocity =
              direction *
              (Math.PI * 2) /
              (circleSettings.spinDuration * 1000);
            spinAngle +=
              (automaticSpinVelocity + spinVelocity) * delta;
            spinVelocity *= Math.pow(0.991, frameDelta);
          } else {
            spinVelocity *= Math.pow(0.88, frameDelta);
            if (Math.abs(spinVelocity) < 0.00001) {
              spinVelocity = 0;
            }
          }

          updateSpinDebug(time);

          // Keep visual compression while held, but only drive its sound while
          // the finger is actively moving. A short grace window smooths over
          // Mobile Safari's coalesced pointer events without looping at rest.
          const fingerIsMoving =
            Boolean(dragState?.lastMovementTime) &&
            time - dragState.lastMovementTime < 120;
          updateSqueezeSound(
            dragState
              ? Math.max(
                  dragPressure.left,
                  dragPressure.right,
                  dragPressure.top,
                  dragPressure.bottom,
                )
              : 0,
            fingerIsMoving,
          );

          if (!dragState && !pinchState) {
            const motionIsFresh = time - lastMotionTime < 180;
            const previousCenter = getBodyCenter(primaryCollisionBody);

            if (!airHockeyState && motionIsFresh) {
              const motionStrength = 0.00015;
              ballVelocity.x += motionAcceleration.x * motionStrength * delta;
              ballVelocity.y += motionAcceleration.y * motionStrength * delta;
            }

            const motionDecay = Math.pow(motionIsFresh ? 0.92 : 0.72, frameDelta);
            motionAcceleration.x *= motionDecay;
            motionAcceleration.y *= motionDecay;
            ballVelocity.y +=
              (airHockeyState ? 0 : circleSettings.gravity) * delta;
            ballPosition.x += ballVelocity.x * delta;
            ballPosition.y += ballVelocity.y * delta;

          if (crossesAirHockeyGoal(primaryCollisionBody, previousCenter)) {
            beginAirHockeyGoalTransit(primaryCollisionBody);
          }

          const hitLeft =
            !primaryGoalTransit &&
            ballPosition.x <= ballBounds.minX &&
            ballVelocity.x < 0;
          const hitRight =
            !primaryGoalTransit &&
            ballPosition.x >= ballBounds.maxX &&
            ballVelocity.x > 0;
          const topConstraint = getAirHockeyRailConstraint(
            primaryCollisionBody,
            ballBounds.minY,
          );
          const topApproach =
            ballVelocity.x * topConstraint.normalX +
            ballVelocity.y * topConstraint.normalY;
          const hitTop =
            !primaryGoalTransit &&
            ballPosition.y <= topConstraint.minimumY &&
            topApproach < 0;
          const hitBottom =
            !primaryGoalTransit &&
            ballPosition.y >= ballBounds.maxY &&
            ballVelocity.y > 0;
          const hitX = hitLeft || hitRight;
          const hitY = hitTop || hitBottom;
          const impactX = Math.abs(ballVelocity.x);
          const impactY = hitTop
            ? Math.abs(topApproach)
            : Math.abs(ballVelocity.y);
          let bouncedX = false;
          let bouncedY = false;

          if (hitX) {
            ballPosition.x = Math.min(
              Math.max(ballPosition.x, ballBounds.minX),
              ballBounds.maxX,
            );
            ballVelocity.x *= -getPhysicsBounce();
            bouncedX = true;
          }

          if (hitY) {
            ballPosition.y = Math.min(
              Math.max(
                ballPosition.y,
                topConstraint.minimumY,
              ),
              ballBounds.maxY,
            );

            if (!airHockeyState && hitBottom && impactY < 0.04) {
              ballVelocity.y = 0;
            } else if (hitTop && airHockeyState) {
              const bounce = getPhysicsBounce();
              ballVelocity.x -=
                (1 + bounce) *
                topApproach *
                topConstraint.normalX;
              ballVelocity.y -=
                (1 + bounce) *
                topApproach *
                topConstraint.normalY;
              bouncedY = true;
            } else {
              ballVelocity.y *= -getPhysicsBounce();
              bouncedY = true;
            }
          }

          const normalImpact = Math.max(
            bouncedX ? impactX : 0,
            bouncedY ? impactY : 0,
          );

          if (normalImpact >= 0.04) {
            const verticalSide = hitTop ? "top" : hitBottom ? "bottom" : "";
            const horizontalSide = hitLeft ? "left" : hitRight ? "right" : "";
            const side =
              verticalSide && horizontalSide
                ? `${verticalSide}-${horizontalSide}`
                : verticalSide || horizontalSide;
            injectCollision(
              side,
              normalImpact,
              ballSize * circleSettings.radius,
            );
            registerBounceForTheme();
            playCollisionSound(normalImpact);
          }

          const damping = Math.pow(getPhysicsFriction(), frameDelta);
          ballVelocity.x *= damping;
          ballVelocity.y *= damping;

          if (
            primaryGoalTransit &&
            hasClearedAirHockeyGoal(primaryCollisionBody)
          ) {
            resetScoredAirHockeyPuck(primaryCollisionBody, time);
          }
          }

          const spawnedWallImpact = updateSpawnedBalls(
            time,
            delta,
            frameDelta,
          );
          const pairImpact = resolveBallCollisions(time);
          const secondaryImpact = Math.max(spawnedWallImpact, pairImpact);
          if (secondaryImpact >= 0.04) {
            playCollisionSound(secondaryImpact);
          }

          updatePopCharge(time);

          if (popState) {
            updatePop(time);
            physicsFrame = window.requestAnimationFrame(runPhysics);
            return;
          }

          if (dragState && dragState.pendingEdgeImpact !== null) {
            dragState.pendingEdgeImpact = null;
          }

          updateSoftBody(frameDelta, isRestingOnBottom);

          if (!pinchState) {
            positionBall();
          }

          if (dragState || pinchState || !isSafari || time - lastCanvasDraw >= 32) {
            drawRing();
            lastCanvasDraw = time;
          }

          physicsFrame = window.requestAnimationFrame(runPhysics);
        };

        const startPhysics = () => {
          stopPhysics();
          lastPhysicsTime = 0;
          physicsFrame = window.requestAnimationFrame(runPhysics);
        };

        const formatCircleValue = (key, value) => {
          if (key === "spinDuration") return `${Math.round(value)}s`;
          if (key === "fontSize") return `${value.toFixed(1).replace(".0", "")}px`;
          if (key === "radius") return `${(value * 100).toFixed(1)}%`;
          if (key === "gap") return `${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
          if (key === "startRotation") return `${Math.round(value)}°`;
          if (key === "bounce") return `${Math.round(value * 100)}%`;
          if (key === "friction") return `${(value * 100).toFixed(1)}%`;
          if (key === "puckFriction") {
            return `${(value * 100).toFixed(1)}%`;
          }
          if (key === "goalSize") {
            return `${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
          }
          if (key === "gravity") return `${Math.round((value / 0.0008) * 100)}%`;
          if (key === "squish") return `${Math.round(value * 100)}%`;
          if (key === "popDepth") return `${Math.round(value * 100)}%`;
          if (key === "popHold") return `${Math.round(value)}ms`;
          if (key === "maxSquish") return `${Math.round(value * 100)}%`;
          if (key === "contactBunch") return `${Math.round(value * 100)}%`;
          if (key === "contactArc") return `${Math.round(value * 100)}%`;
          if (key === "burstPower") return `${Math.round(value * 100)}%`;
          if (key === "soundVolume") return `${Math.round(value * 100)}%`;
          if (key === "soundPitch") return `${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
          if (key === "soundDuration") return `${Math.round(value)}ms`;
          return value;
        };

        const updateCircleControl = (control, programmatic = false) => {
          const key = control.dataset.circleControl;
          if (key === "radius" && !programmatic) {
            ringRadiusCustomized = true;
          }
          const value = control.tagName === "SELECT" ? control.value : Number(control.value);
          circleSettings[key] = value;
          const output = document.querySelector(`[data-circle-output="${key}"]`);

          if (output) {
            output.textContent = formatCircleValue(key, value);
          }

          renderCircularView();
          constrainBall();
          positionBall();
        };

        circleControls.forEach((control) => {
          control.addEventListener("input", () => updateCircleControl(control));
        });

        const applyResponsiveRingDefault = () => {
          if (ringRadiusCustomized) return;

          circleSettings.radius = getResponsiveRingRadius();
          const radiusControl = document.querySelector(
            '[data-circle-control="radius"]',
          );
          if (radiusControl) {
            radiusControl.value = circleSettings.radius;
            updateCircleControl(radiusControl, true);
          }
        };

        const loadSavedCircleTweaks = () => {
          let savedTweaks;

          try {
            savedTweaks = JSON.parse(
              window.localStorage.getItem(circleTweaksStorageKey),
            );
          } catch {
            return false;
          }

          if (!savedTweaks || typeof savedTweaks !== "object") {
            return false;
          }

          let restored = false;
          circleControls.forEach((control) => {
            const key = control.dataset.circleControl;
            if (!Object.prototype.hasOwnProperty.call(savedTweaks, key)) {
              return;
            }

            control.value = savedTweaks[key];
            if (key === "radius") {
              ringRadiusCustomized = true;
            }
            updateCircleControl(control, true);
            restored = true;
          });

          return restored;
        };

        if (!loadSavedCircleTweaks()) {
          applyResponsiveRingDefault();
        }

        document.querySelector(".circle-save").addEventListener("click", (event) => {
          const savedTweaks = {};
          circleControls.forEach((control) => {
            const key = control.dataset.circleControl;
            savedTweaks[key] = circleSettings[key];
          });

          try {
            window.localStorage.setItem(
              circleTweaksStorageKey,
              JSON.stringify(savedTweaks),
            );
            event.currentTarget.textContent = "guardado";
            window.setTimeout(() => {
              if (event.currentTarget.textContent === "guardado") {
                event.currentTarget.textContent = "save";
              }
            }, 1200);
          } catch {
            event.currentTarget.textContent = "couldn't save";
          }
        });

        document.querySelector(".circle-reset").addEventListener("click", () => {
          try {
            window.localStorage.removeItem(circleTweaksStorageKey);
          } catch {}
          document.querySelector(".circle-save").textContent = "save";
          ringRadiusCustomized = false;
          const defaults = {
            spinDuration: 60,
            fontSize: 26,
            radius: getResponsiveRingRadius(),
            gap: 0.75,
            startRotation: 180,
            direction: "normal",
            bounce: 0.94,
            friction: 0.971,
            puckFriction: 0.04,
            goalSize: 2,
            gravity: 0.0004,
            squish: 0.9,
            popDepth: 0.51,
            popHold: 900,
            maxSquish: 1.4,
            contactBunch: 0.22,
            contactArc: 0.65,
            burstPower: 1.9,
            popPieces: "words",
            sound: "pop",
            soundVolume: 0.85,
            soundPitch: 1.15,
            soundDuration: 64,
          };

          circleControls.forEach((control) => {
            const key = control.dataset.circleControl;
            control.value = defaults[key];
            updateCircleControl(control, true);
          });
        });

        const pointerDistance = (first, second) =>
          Math.hypot(second.x - first.x, second.y - first.y);

        const pointerMidpoint = (first, second) => ({
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2,
        });

        const resetDragPressure = () => {
          stopSqueezeSound();
          dragPressure.left = 0;
          dragPressure.right = 0;
          dragPressure.top = 0;
          dragPressure.bottom = 0;
        };

        const beginDrag = (pointerId, pointer) => {
          dragState = {
            pointerId,
            offsetX: pointer.x - ballPosition.x,
            offsetY: pointer.y - ballPosition.y,
            grabOffsetX: pointer.x - (ballPosition.x + ballSize / 2),
            grabOffsetY: pointer.y - (ballPosition.y + ballSize / 2),
            lastX: pointer.x,
            lastY: pointer.y,
            lastTime: performance.now(),
            lastMovementTime: 0,
            edgeContact: "",
            popCharge: 0,
            popChargeEdge: "",
            popChargeStarted: 0,
            spinLockAngle: spinAngle,
            pendingEdgeImpact: null,
          };
          pinchState = null;
          heldSpinAngle = spinAngle;
          spinVelocity = 0;
          ballVelocity.x = 0;
          ballVelocity.y = 0;
          resetDragPressure();
          circularView.classList.add("is-dragging");
        };

        const beginPinch = () => {
          const pointers = [...activePointers.values()].slice(0, 2);
          if (pointers.length < 2) return;

          const midpoint = pointerMidpoint(pointers[0], pointers[1]);
          const minimumScale = Math.max(0.01, ringScale * 0.55);
          const maximumScale = ringScale * 1.45;
          pinchState = {
            startDistance: Math.max(1, pointerDistance(pointers[0], pointers[1])),
            startScale: ringScale,
            minimumScale,
            maximumScale,
            startMidpoint: midpoint,
            startCenter: {
              x: ballPosition.x + ballSize / 2,
              y: ballPosition.y + ballSize / 2,
            },
            currentScale: ringScale,
            lastScale: ringScale,
            lastScaleTime: performance.now(),
            scaleVelocity: 0,
            currentCenter: {
              x: ballPosition.x + ballSize / 2,
              y: ballPosition.y + ballSize / 2,
            },
          };
          dragState = null;
          ballVelocity.x = 0;
          ballVelocity.y = 0;
          resetDragPressure();
        };

        const rubberBandScale = (value, minimum, maximum) => {
          const rubberBandDistance = (overflow) => {
            const range = 0.22;
            const coefficient = 0.55;
            return (
              (1 - 1 / ((overflow * coefficient) / range + 1)) *
              range
            );
          };

          if (value < minimum) {
            return minimum - rubberBandDistance(minimum - value);
          }

          if (value > maximum) {
            return maximum + rubberBandDistance(value - maximum);
          }

          return value;
        };

        const updatePinch = () => {
          if (!pinchState || activePointers.size < 2) return;

          const pointers = [...activePointers.values()].slice(0, 2);
          const midpoint = pointerMidpoint(pointers[0], pointers[1]);
          const rawScale =
            pinchState.startScale *
            (pointerDistance(pointers[0], pointers[1]) / pinchState.startDistance);
          const scale = rubberBandScale(
            rawScale,
            pinchState.minimumScale,
            pinchState.maximumScale,
          );
          const previewScale = scale / pinchState.startScale;
          const now = performance.now();
          const elapsed = Math.max(8, now - pinchState.lastScaleTime) / 1000;
          const instantaneousVelocity =
            (scale - pinchState.lastScale) / elapsed;
          pinchState.scaleVelocity =
            pinchState.scaleVelocity * 0.62 + instantaneousVelocity * 0.38;
          pinchState.lastScale = scale;
          pinchState.lastScaleTime = now;
          pinchState.currentScale = scale;
          pinchState.currentCenter = {
            x: pinchState.startCenter.x + midpoint.x - pinchState.startMidpoint.x,
            y: pinchState.startCenter.y + midpoint.y - pinchState.startMidpoint.y,
          };

          ringCanvas.style.transformOrigin = "50% 50%";
          ringCanvas.style.transform = `scale(${previewScale})`;
          circularView.style.transform =
            `translate3d(${pinchState.currentCenter.x - ballSize / 2}px, ` +
            `${pinchState.currentCenter.y - ballSize / 2}px, 0)`;
        };

        const finishPinch = async () => {
          if (!pinchState) return;

          const {
            currentScale,
            currentCenter,
            startScale,
            scaleVelocity,
            minimumScale,
            maximumScale,
          } = pinchState;
          const settledScale = Math.min(
            maximumScale,
            Math.max(minimumScale, currentScale),
          );
          const isOverscrolled = Math.abs(settledScale - currentScale) > 0.001;
          const springCanvas = ringCanvas;

          if (isOverscrolled && springCanvas && !reduceMotion.matches) {
            await new Promise((resolve) => {
              let position = currentScale;
              let velocity = Math.min(2.5, Math.max(-2.5, scaleVelocity));
              let previousTime = performance.now();
              const startTime = previousTime;
              const stiffness = 210;
              const damping = 20;

              const stepSpring = (time) => {
                if (springCanvas !== ringCanvas) {
                  resolve();
                  return;
                }

                const delta = Math.min(0.032, Math.max(0.001, (time - previousTime) / 1000));
                previousTime = time;
                const displacement = position - settledScale;
                const acceleration =
                  -stiffness * displacement - damping * velocity;
                velocity += acceleration * delta;
                position += velocity * delta;
                springCanvas.style.transform =
                  `scale(${position / startScale})`;

                const hasSettled =
                  Math.abs(position - settledScale) < 0.0005 &&
                  Math.abs(velocity) < 0.006;
                const timedOut = time - startTime > 700;

                if (hasSettled || timedOut) {
                  springCanvas.style.transform =
                    `scale(${settledScale / startScale})`;
                  resolve();
                  return;
                }

                requestAnimationFrame(stepSpring);
              };

              requestAnimationFrame(stepSpring);
            });
          }

          pinchState = null;
          ringScale = settledScale;
          ringCanvas.style.transform = "";
          renderCircularView();
          ballPosition.x = currentCenter.x - ballSize / 2;
          ballPosition.y = currentCenter.y - ballSize / 2;
          constrainBall();
          positionBall();
        };

        circularView.addEventListener("pointerdown", (event) => {
          if (popState || primaryGoalTransit) return;

          if (airHockeyState && activePointers.size > 0) {
            event.preventDefault();
            return;
          }

          event.preventDefault();
          ensureAudioContext();
          stopPhysics();
          circularView.setPointerCapture(event.pointerId);
          activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

          if (activePointers.size === 1) {
            beginDrag(event.pointerId, activePointers.get(event.pointerId));
          } else if (activePointers.size === 2) {
            beginPinch();
          }

          startPhysics();
        });

        circularView.addEventListener("pointermove", (event) => {
          if (!activePointers.has(event.pointerId) || popState) return;

          activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

          if (pinchState) {
            updatePinch();
            return;
          }

          if (!dragState || dragState.pointerId !== event.pointerId) return;

          const now = performance.now();
          const delta = Math.max(1, now - dragState.lastTime);
          const rawX = event.clientX - dragState.offsetX;
          const rawY = event.clientY - dragState.offsetY;
          dragPressure.left = Math.max(0, ballBounds.minX - rawX);
          dragPressure.right = Math.max(0, rawX - ballBounds.maxX);
          dragPressure.top = Math.max(0, ballBounds.minY - rawY);
          dragPressure.bottom = Math.max(0, rawY - ballBounds.maxY);
          if (
            dragState.spinLockAngle === null &&
            Math.max(
              dragPressure.left,
              dragPressure.right,
              dragPressure.top,
              dragPressure.bottom,
            ) > 0.5
          ) {
            dragState.spinLockAngle = spinAngle;
            heldSpinAngle = spinAngle;
          }

          ballPosition.x = rawX;
          ballPosition.y = rawY;
          const pointerTravel = Math.hypot(
            event.clientX - dragState.lastX,
            event.clientY - dragState.lastY,
          );
          ballVelocity.x = (event.clientX - dragState.lastX) / delta;
          ballVelocity.y = (event.clientY - dragState.lastY) / delta;
          if (pointerTravel > 0.1) {
            dragState.lastMovementTime = now;
          }
          dragState.lastX = event.clientX;
          dragState.lastY = event.clientY;
          dragState.lastTime = now;

          const horizontalEdge =
            dragPressure.left > 0 ? "left" : dragPressure.right > 0 ? "right" : "";
          const verticalEdge =
            dragPressure.top > 0 ? "top" : dragPressure.bottom > 0 ? "bottom" : "";
          const edgeContact =
            verticalEdge && horizontalEdge
              ? `${verticalEdge}-${horizontalEdge}`
              : verticalEdge || horizontalEdge;

          if (edgeContact && edgeContact !== dragState.edgeContact) {
            dragState.pendingEdgeImpact = Math.hypot(
              ballVelocity.x,
              ballVelocity.y,
            );
          }
          dragState.edgeContact = edgeContact;
          constrainBall();
          positionBall();
        });

        const releaseBall = async (event) => {
          if (!activePointers.has(event.pointerId)) return;

          activePointers.delete(event.pointerId);

          if (pinchState) {
            await finishPinch();

            if (activePointers.size === 1) {
              const [pointerId, pointer] = activePointers.entries().next().value;
              beginDrag(pointerId, pointer);
            } else {
              circularView.classList.remove("is-dragging");
            }

            startPhysics();
            return;
          }

          if (dragState?.pointerId === event.pointerId) {
            const releasePressure = { ...dragPressure };
            const throwVelocityX = ballVelocity.x;
            const throwVelocityY = ballVelocity.y;
            const spinRadius = Math.max(1, ballSize / 2);
            const angularImpulse =
              (
                dragState.grabOffsetX * throwVelocityY -
                dragState.grabOffsetY * throwVelocityX
              ) /
              (spinRadius * spinRadius);
            spinVelocity = Math.max(
              -0.008,
              Math.min(0.008, angularImpulse * 0.9),
            );
            if (
              Math.hypot(throwVelocityX, throwVelocityY) < 0.04 ||
              Math.hypot(
                dragState.grabOffsetX,
                dragState.grabOffsetY,
              ) < spinRadius * 0.08
            ) {
              spinVelocity = 0;
            }

            const wasPressedAgainstWall =
              Math.max(
                releasePressure.left,
                releasePressure.right,
                releasePressure.top,
                releasePressure.bottom,
              ) > 0.5;
            const releasedTowardGoal =
              Boolean(airHockeyState) &&
              releasePressure.top > 0.5 &&
              ballVelocity.y < 0 &&
              fitsAirHockeyGoalAtX(
                primaryCollisionBody,
                getBodyCenter(primaryCollisionBody).x,
              );

            dragState = null;
            heldSpinAngle = null;

            if (wasPressedAgainstWall && !releasedTowardGoal) {
              const separation = 0.5;
              const minimumReboundSpeed = 0.04;
              let releasedWithBounce = false;
              wallReleaseSettlingUntil = performance.now() + 180;
              deformationVelocity.fill(0);

              if (releasePressure.left > 0 && ballVelocity.x < 0) {
                const reboundSpeed = Math.abs(ballVelocity.x);
                releasedWithBounce ||=
                  reboundSpeed >= minimumReboundSpeed;
                ballPosition.x = ballBounds.minX + separation;
                ballVelocity.x =
                  reboundSpeed >= minimumReboundSpeed
                    ? reboundSpeed * getPhysicsBounce()
                    : 0;
              } else if (
                releasePressure.right > 0 &&
                ballVelocity.x > 0
              ) {
                const reboundSpeed = Math.abs(ballVelocity.x);
                releasedWithBounce ||=
                  reboundSpeed >= minimumReboundSpeed;
                ballPosition.x = ballBounds.maxX - separation;
                ballVelocity.x =
                  reboundSpeed >= minimumReboundSpeed
                    ? -reboundSpeed * getPhysicsBounce()
                    : 0;
              }

              if (releasePressure.top > 0 && ballVelocity.y < 0) {
                const reboundSpeed = Math.abs(ballVelocity.y);
                releasedWithBounce ||=
                  reboundSpeed >= minimumReboundSpeed;
                ballPosition.y = ballBounds.minY + separation;
                ballVelocity.y =
                  reboundSpeed >= minimumReboundSpeed
                    ? reboundSpeed * getPhysicsBounce()
                    : 0;
              } else if (
                releasePressure.bottom > 0 &&
                ballVelocity.y > 0
              ) {
                const reboundSpeed = Math.abs(ballVelocity.y);
                releasedWithBounce ||=
                  reboundSpeed >= minimumReboundSpeed;
                ballPosition.y = ballBounds.maxY - separation;
                ballVelocity.y =
                  reboundSpeed >= minimumReboundSpeed
                    ? -reboundSpeed * getPhysicsBounce()
                    : 0;
              }

              if (releasedWithBounce) {
                registerBounceForTheme();
              }
            }

            resetDragPressure();
            circularView.classList.remove("is-dragging");
            positionBall();
            startPhysics();
          }
        };

        circularView.addEventListener("pointerup", releaseBall);
        circularView.addEventListener("pointercancel", releaseBall);

        document.addEventListener(
          "pointerdown",
          (event) => {
            if (!popState || popState.reassembling) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            beginReassembly();
          },
          { capture: true },
        );

        document.addEventListener(
          "click",
          (event) => {
            if (!popState?.reassembling) return;
            event.preventDefault();
            event.stopImmediatePropagation();
          },
          { capture: true },
        );

        const getTapBallElement = (event) =>
          event.target?.closest?.(".circular-view") || null;

        document.addEventListener(
          "pointerdown",
          (event) => {
            if (popState || event.button !== 0) return;

            const element = getTapBallElement(event);
            const body = getBodyByElement(element);
            if (!body) return;

            const center = getBodyCenter(body);
            if (
              Math.hypot(
                event.clientX - center.x,
                event.clientY - center.y,
              ) >
              getBodyCollisionRadius(body) + 10
            ) {
              return;
            }

            let multiTouch = false;
            for (const candidate of tapCandidates.values()) {
              if (candidate.ballId !== body.id) continue;
              candidate.multiTouch = true;
              multiTouch = true;
            }

            tapCandidates.set(event.pointerId, {
              ballId: body.id,
              element,
              startX: event.clientX,
              startY: event.clientY,
              startTime: performance.now(),
              moved: false,
              multiTouch,
            });
          },
          { capture: true, passive: true },
        );

        document.addEventListener(
          "pointermove",
          (event) => {
            const candidate = tapCandidates.get(event.pointerId);
            if (!candidate) return;
            if (
              Math.hypot(
                event.clientX - candidate.startX,
                event.clientY - candidate.startY,
              ) > 11
            ) {
              candidate.moved = true;
            }
          },
          { capture: true, passive: true },
        );

        document.addEventListener(
          "pointerup",
          (event) => {
            const candidate = tapCandidates.get(event.pointerId);
            if (!candidate) return;
            tapCandidates.delete(event.pointerId);

            const now = performance.now();
            if (
              popState ||
              candidate.moved ||
              candidate.multiTouch ||
              now - candidate.startTime > 260
            ) {
              return;
            }

            const body = getBodyByElement(candidate.element);
            if (!body) return;
            const center = getBodyCenter(body);
            if (
              Math.hypot(
                event.clientX - center.x,
                event.clientY - center.y,
              ) >
              getBodyCollisionRadius(body) + 10
            ) {
              return;
            }

            const previous = lastTapByBall.get(body.id);
            if (
              previous &&
              now - previous.time <= 320 &&
              Math.hypot(
                event.clientX - previous.x,
                event.clientY - previous.y,
              ) <= 32
            ) {
              lastTapByBall.delete(body.id);
              const sourceId = body.id;
              const tapX = event.clientX;
              const tapY = event.clientY;
              window.requestAnimationFrame(() => {
                const source =
                  sourceId === 0
                    ? primaryCollisionBody
                    : spawnedBalls.find((ball) => ball.id === sourceId);
                if (!source) return;
                if (airHockeyState) {
                  exitAirHockeyMode(source);
                } else {
                  enterAirHockeyMode(source, tapX, tapY);
                }
              });
            } else {
              lastTapByBall.set(body.id, {
                time: now,
                x: event.clientX,
                y: event.clientY,
              });
            }
          },
          { capture: true, passive: true },
        );

        document.addEventListener(
          "pointercancel",
          (event) => {
            tapCandidates.delete(event.pointerId);
          },
          { capture: true, passive: true },
        );

        document.addEventListener(
          "dblclick",
          (event) => {
            if (getTapBallElement(event)) event.preventDefault();
          },
          { capture: true },
        );

        window.addEventListener("resize", () => {
          applyResponsiveRingDefault();
          renderCircularView();
          updateAirHockeyGoalGeometry();
        });

        document.addEventListener("keydown", (event) => {
          const interactive = event.target.closest("input, textarea, select, button, summary, a, [contenteditable]");
          if (event.key === "Escape" || (event.code === "Space" && !interactive &&
              !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey)) {
            event.preventDefault();
            if (!event.repeat) window.parent.postMessage({ type: "slides-playground-close" }, window.location.origin);
            return;
          }
          if (waitingForEntrance || interactive || event.repeat || airHockeyState?.roundOver) return;
          if (event.key.startsWith("Arrow")) {
            event.preventDefault();
            ensureAudioContext();
            if (event.key === "ArrowLeft") ballVelocity.x -= 0.65;
            if (event.key === "ArrowRight") ballVelocity.x += 0.65;
            if (event.key === "ArrowUp") ballVelocity.y -= 0.9;
            if (event.key === "ArrowDown") ballVelocity.y += 0.65;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            ensureAudioContext();
            if (airHockeyState) exitAirHockeyMode(primaryCollisionBody);
            else {
              const center = getBodyCenter(primaryCollisionBody);
              enterAirHockeyMode(primaryCollisionBody, center.x, center.y);
            }
          }
        });

        // Do not accumulate animation work while this tab is in the background.
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) { stopPhysics(); stopSqueezeSound(); }
          else if (!waitingForEntrance) startPhysics();
        });

        // Expose drawn glyph poses so the host can assemble its actual page letters
        // into this ring before starting the original physics engine.
        const transitionGlyphs = () => {
          const base = circleSettings.startRotation * Math.PI / 180 + spinAngle;
          const color = getComputedStyle(document.documentElement).getPropertyValue("--page-foreground").trim();
          return ringLayout.characters.flatMap((character, index) => {
            if (!ringLayout.visible[index]) return [];
            const pose = getContactRingPose(base + ringLayout.angles[index], index);
            return [{ character,
              x: ballPosition.x + pose.x - Math.sin(pose.rotation) * ringLayout.centerOffset,
              y: ballPosition.y + pose.y + Math.cos(pose.rotation) * ringLayout.centerOffset,
              rotation: pose.rotation, fontSize: circleSettings.fontSize * ringScale,
              scale: ringLayout.horizontalScale,
              color: (useHomeGlyphColors && ringLayout.colors[index]) || color }];
          });
        };
        window.addEventListener("message", (event) => {
          if (event.source !== window.parent || event.origin !== window.location.origin) return;
          if (event.data?.type === "slides-playground-begin" && waitingForEntrance) {
            waitingForEntrance = false;
            startPhysics();
          }
          if (event.data?.type === "slides-playground-snapshot") {
            stopPhysics();
            stopSqueezeSound();
            waitingForEntrance = true;
            const glyphs = !popState && !airHockeyState ? transitionGlyphs() : null;
            if (glyphs) circularView.style.visibility = "hidden";
            window.parent.postMessage({ type: "slides-playground-snapshot", glyphs }, window.location.origin);
          }
        });
        renderCircularView();
        if (waitingForEntrance) {
          window.parent.postMessage({ type: "slides-playground-ready", glyphs: transitionGlyphs() }, window.location.origin);
        } else startPhysics();
      })();
