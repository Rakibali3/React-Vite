import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Sparkles, ArrowRight } from "lucide-react";

/* =========================================================
   FLOWER BOUQUET CANVAS
   Rose + Lily + Sunflower + Tulips
========================================================= */

function FlowerBouquet() {
  const canvasRef = useRef(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let centerX = 0;
    let baseY = 0;
    let animationFrame;

    const startTime = performance.now();

    // Total flower animation duration
    const FLOWER_DURATION = 7200;

    /* -------------------------------------------------------
       Responsive canvas
    ------------------------------------------------------- */

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      centerX = width / 2;
      baseY = height * 0.88;
    }

    resize();
    window.addEventListener("resize", resize);

    /* -------------------------------------------------------
       Helpers
    ------------------------------------------------------- */

    const clamp = (value, min, max) =>
      Math.max(min, Math.min(max, value));

    const easeOut = (x) => 1 - Math.pow(1 - x, 3);

    const easeInOut = (x) =>
      x < 0.5
        ? 2 * x * x
        : 1 - Math.pow(-2 * x + 2, 2) / 2;

    const progress = (p, start, end) =>
      easeOut(clamp((p - start) / (end - start), 0, 1));

    /* -------------------------------------------------------
       Stars
    ------------------------------------------------------- */

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.8,
      radius: Math.random() * 1.2 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.025,
      gold: Math.random() < 0.2,
    }));

    function drawBackground(time) {
      const bg = ctx.createRadialGradient(
        centerX,
        height * 0.42,
        10,
        centerX,
        height * 0.45,
        height * 0.8
      );

      bg.addColorStop(0, "#3b0714");
      bg.addColorStop(0.35, "#200714");
      bg.addColorStop(0.7, "#0e0610");
      bg.addColorStop(1, "#040207");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // warm glow underneath bouquet
      const floorGlow = ctx.createRadialGradient(
        centerX,
        baseY,
        5,
        centerX,
        baseY,
        Math.min(width, height) * 0.4
      );

      floorGlow.addColorStop(0, "rgba(244,63,94,.25)");
      floorGlow.addColorStop(0.4, "rgba(190,24,93,.12)");
      floorGlow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = floorGlow;
      ctx.fillRect(0, 0, width, height);

      // soft breathing glow
      const pulse = 0.08 + Math.sin(time * 0.001) * 0.025;

      const aura = ctx.createRadialGradient(
        centerX,
        height * 0.42,
        10,
        centerX,
        height * 0.42,
        Math.min(width, height) * 0.55
      );

      aura.addColorStop(0, `rgba(244,114,182,${pulse})`);
      aura.addColorStop(1, "rgba(244,114,182,0)");

      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);
    }

    function drawStars(time) {
      stars.forEach((star) => {
        star.phase += star.speed;

        const alpha =
          0.15 + 0.5 * Math.abs(Math.sin(star.phase));

        ctx.beginPath();

        ctx.arc(
          star.x * width,
          star.y * height,
          star.radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = star.gold
          ? `rgba(255,215,130,${alpha})`
          : `rgba(255,220,235,${alpha})`;

        ctx.fill();
      });
    }

    /* -------------------------------------------------------
       Sparkles
    ------------------------------------------------------- */

    const sparkles = Array.from({ length: 45 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2.8 + 0.7,
      delay: Math.random() * 5,
      speed: Math.random() * 2 + 1,
    }));

    function drawSparkles(time, visibility) {
      if (visibility <= 0) return;

      sparkles.forEach((spark) => {
        const phase =
          (time / 1000) * spark.speed + spark.delay;

        const alpha =
          (0.25 + Math.abs(Math.sin(phase)) * 0.75) *
          visibility;

        const x =
          centerX +
          (spark.x - 0.5) *
            Math.min(width * 0.9, 650);

        const y =
          height * 0.15 +
          spark.y * height * 0.62;

        ctx.save();

        ctx.translate(x, y);

        ctx.strokeStyle = `rgba(255,230,245,${alpha})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(-spark.size * 2, 0);
        ctx.lineTo(spark.size * 2, 0);
        ctx.moveTo(0, -spark.size * 2);
        ctx.lineTo(0, spark.size * 2);
        ctx.stroke();

        ctx.restore();
      });
    }

    /* -------------------------------------------------------
       Bezier utilities
    ------------------------------------------------------- */

    function bezierPoint(
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      t
    ) {
      const m = 1 - t;

      return [
        m * m * m * x0 +
          3 * m * m * t * x1 +
          3 * m * t * t * x2 +
          t * t * t * x3,

        m * m * m * y0 +
          3 * m * m * t * y1 +
          3 * m * t * t * y2 +
          t * t * t * y3,
      ];
    }

    function bezierAngle(
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      t
    ) {
      const m = 1 - t;

      const dx =
        3 * m * m * (x1 - x0) +
        6 * m * t * (x2 - x1) +
        3 * t * t * (x3 - x2);

      const dy =
        3 * m * m * (y1 - y0) +
        6 * m * t * (y2 - y1) +
        3 * t * t * (y3 - y2);

      return Math.atan2(dy, dx);
    }

    function drawStem(stem, p, scale, time) {
      if (p <= 0) return;

      const x0 = centerX + stem.startX * scale;
      const y0 = baseY;

      const x1 = centerX + stem.cp1X * scale;
      const y1 = baseY + stem.cp1Y * scale;

      const x2 = centerX + stem.cp2X * scale;
      const y2 = baseY + stem.cp2Y * scale;

      const x3 = centerX + stem.endX * scale;
      const y3 = baseY + stem.endY * scale;

      const steps = 60;
      const visibleSteps = Math.floor(steps * p);

      ctx.save();

      ctx.lineCap = "round";

      // dark stem
      ctx.beginPath();

      for (let i = 0; i <= visibleSteps; i++) {
        const t = i / steps;

        const [x, y] = bezierPoint(
          x0,
          y0,
          x1,
          y1,
          x2,
          y2,
          x3,
          y3,
          t
        );

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "#174d24";
      ctx.lineWidth = 3.5 * scale;
      ctx.stroke();

      // light center of stem
      ctx.beginPath();

      for (let i = 0; i <= visibleSteps; i++) {
        const t = i / steps;

        const [x, y] = bezierPoint(
          x0,
          y0,
          x1,
          y1,
          x2,
          y2,
          x3,
          y3,
          t
        );

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "#39a94b";
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();

      ctx.restore();

      return {
        x: x3,
        y: y3,
        angle: bezierAngle(
          x0,
          y0,
          x1,
          y1,
          x2,
          y2,
          x3,
          y3,
          1
        ),
      };
    }

    /* -------------------------------------------------------
       Leaves
    ------------------------------------------------------- */

    function drawLeaf(x, y, angle, size, p) {
      if (p <= 0) return;

      ctx.save();

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.scale(p, p);

      const gradient = ctx.createLinearGradient(
        0,
        -size,
        size,
        size
      );

      gradient.addColorStop(0, "#66c95a");
      gradient.addColorStop(0.5, "#2e8b3c");
      gradient.addColorStop(1, "#123d1c");

      ctx.fillStyle = gradient;

      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.bezierCurveTo(
        size * 0.3,
        -size * 0.8,
        size * 1.1,
        -size * 0.8,
        size * 1.4,
        -size * 0.2
      );

      ctx.bezierCurveTo(
        size * 0.8,
        size * 0.15,
        size * 0.3,
        size * 0.2,
        0,
        0
      );

      ctx.fill();

      ctx.strokeStyle = "rgba(170,255,150,.35)";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 1.1, -size * 0.3);
      ctx.stroke();

      ctx.restore();
    }

    /* -------------------------------------------------------
       ROSE
    ------------------------------------------------------- */

    function drawRose(x, y, size, p, time, angle) {
      if (p <= 0) return;

      const bloom = easeOut(p);

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(angle + Math.PI / 2);

      ctx.scale(bloom, bloom);

      const s = size;

      ctx.shadowColor = "rgba(255,0,60,.75)";
      ctx.shadowBlur = 18;

      // dark outer cup
      ctx.fillStyle = "#4b0010";

      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.bezierCurveTo(
        -s * 0.5,
        -s * 0.1,
        -s * 0.7,
        -s * 0.8,
        -s * 0.35,
        -s * 1.1
      );

      ctx.quadraticCurveTo(
        0,
        -s * 1.25,
        s * 0.35,
        -s * 1.1
      );

      ctx.bezierCurveTo(
        s * 0.7,
        -s * 0.8,
        s * 0.5,
        -s * 0.1,
        0,
        0
      );

      ctx.fill();

      ctx.shadowBlur = 0;

      // left petal
      ctx.fillStyle = "#a80027";

      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.bezierCurveTo(
        -s * 0.55,
        0,
        -s * 0.7,
        -s * 0.75,
        -s * 0.28,
        -s
      );

      ctx.bezierCurveTo(
        -s * 0.1,
        -s * 0.7,
        0,
        -s * 0.45,
        0,
        -s * 0.15
      );

      ctx.closePath();

      ctx.fill();

      // right petal
      ctx.fillStyle = "#e00035";

      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.bezierCurveTo(
        s * 0.55,
        0,
        s * 0.7,
        -s * 0.75,
        s * 0.28,
        -s
      );

      ctx.bezierCurveTo(
        s * 0.1,
        -s * 0.7,
        0,
        -s * 0.45,
        0,
        -s * 0.15
      );

      ctx.closePath();

      ctx.fill();

      // inner bud
      ctx.fillStyle = "#760018";

      ctx.beginPath();

      ctx.moveTo(-s * 0.25, -s * 0.25);

      ctx.lineTo(-s * 0.22, -s * 0.9);

      ctx.quadraticCurveTo(
        0,
        -s * 1.05,
        s * 0.22,
        -s * 0.9
      );

      ctx.lineTo(s * 0.25, -s * 0.25);

      ctx.closePath();

      ctx.fill();

      // front petal
      ctx.fillStyle = "#ff1747";

      ctx.beginPath();

      ctx.moveTo(-s * 0.35, -s * 0.4);

      ctx.quadraticCurveTo(
        0,
        -s * 0.12,
        s * 0.35,
        -s * 0.4
      );

      ctx.quadraticCurveTo(
        0,
        s * 0.04,
        -s * 0.35,
        -s * 0.4
      );

      ctx.fill();

      // highlight
      ctx.fillStyle = "#ff6680";

      ctx.beginPath();

      ctx.moveTo(-s * 0.23, -s * 0.36);

      ctx.quadraticCurveTo(
        0,
        -s * 0.18,
        s * 0.23,
        -s * 0.36
      );

      ctx.quadraticCurveTo(
        0,
        -s * 0.1,
        -s * 0.23,
        -s * 0.36
      );

      ctx.fill();

      // sepals
      ctx.fillStyle = "#21682b";

      ctx.beginPath();

      ctx.moveTo(0, s * 0.05);

      ctx.lineTo(-s * 0.35, -s * 0.15);
      ctx.lineTo(-s * 0.1, -s * 0.05);
      ctx.lineTo(-s * 0.42, -s * 0.28);

      ctx.lineTo(-s * 0.1, -s * 0.08);

      ctx.lineTo(0, -s * 0.18);

      ctx.lineTo(s * 0.1, -s * 0.08);
      ctx.lineTo(s * 0.42, -s * 0.28);

      ctx.lineTo(s * 0.1, -s * 0.05);
      ctx.lineTo(s * 0.35, -s * 0.15);

      ctx.closePath();

      ctx.fill();

      ctx.restore();
    }

    /* -------------------------------------------------------
       SUNFLOWER
    ------------------------------------------------------- */

    function drawSunflower(x, y, size, p, time, angle) {
      if (p <= 0) return;

      const bloom = easeOut(p);

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(angle + Math.PI / 2);

      ctx.scale(bloom, bloom);

      const petalCount = 20;

      // outer petals
      for (let i = 0; i < petalCount; i++) {
        const a =
          (Math.PI * 2 * i) / petalCount;

        ctx.save();

        ctx.rotate(a);

        const gradient = ctx.createLinearGradient(
          0,
          -size * 0.3,
          0,
          -size * 1.3
        );

        gradient.addColorStop(0, "#f59e0b");
        gradient.addColorStop(0.5, "#facc15");
        gradient.addColorStop(1, "#fde68a");

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.ellipse(
          0,
          -size * 0.85,
          size * 0.24,
          size * 0.62,
          0,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
      }

      // inner petals
      for (let i = 0; i < 12; i++) {
        const a =
          (Math.PI * 2 * i) / 12 +
          Math.PI / 12;

        ctx.save();

        ctx.rotate(a);

        ctx.fillStyle = "#fbbf24";

        ctx.beginPath();

        ctx.ellipse(
          0,
          -size * 0.58,
          size * 0.18,
          size * 0.42,
          0,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
      }

      // sunflower center
      const centerGradient = ctx.createRadialGradient(
        0,
        0,
        2,
        0,
        0,
        size * 0.5
      );

      centerGradient.addColorStop(0, "#78350f");
      centerGradient.addColorStop(0.55, "#451a03");
      centerGradient.addColorStop(1, "#1c0d03");

      ctx.fillStyle = centerGradient;

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        size * 0.42,
        0,
        Math.PI * 2
      );

      ctx.fill();

      // seeds
      for (let i = 0; i < 45; i++) {
        const a = i * 2.399;
        const r = Math.sqrt(i / 45) * size * 0.36;

        const sx = Math.cos(a) * r;
        const sy = Math.sin(a) * r;

        ctx.fillStyle =
          i % 2 === 0
            ? "#a16207"
            : "#d97706";

        ctx.beginPath();

        ctx.arc(
          sx,
          sy,
          size * 0.025,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      ctx.restore();
    }

    /* -------------------------------------------------------
       LILY
    ------------------------------------------------------- */

    function drawLily(x, y, size, p, time, angle) {
      if (p <= 0) return;

      const bloom = easeOut(p);

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(angle + Math.PI / 2);

      ctx.scale(bloom, bloom);

      // Six petals
      for (let i = 0; i < 6; i++) {
        const a =
          (Math.PI * 2 * i) / 6;

        ctx.save();

        ctx.rotate(a);

        const gradient = ctx.createLinearGradient(
          0,
          0,
          0,
          -size
        );

        gradient.addColorStop(0, "#f9a8d4");
        gradient.addColorStop(0.5, "#fbcfe8");
        gradient.addColorStop(1, "#fff1f2");

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.moveTo(0, 0);

        ctx.bezierCurveTo(
          -size * 0.5,
          -size * 0.25,
          -size * 0.55,
          -size * 0.8,
          0,
          -size
        );

        ctx.bezierCurveTo(
          size * 0.55,
          -size * 0.8,
          size * 0.5,
          -size * 0.25,
          0,
          0
        );

        ctx.fill();

        // petal vein
        ctx.strokeStyle = "rgba(190,24,93,.28)";
        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(0, -size * 0.08);
        ctx.quadraticCurveTo(
          0,
          -size * 0.45,
          0,
          -size * 0.82
        );

        ctx.stroke();

        ctx.restore();
      }

      // center
      ctx.fillStyle = "#facc15";

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        size * 0.11,
        0,
        Math.PI * 2
      );

      ctx.fill();

      // stamens
      for (let i = 0; i < 6; i++) {
        const a =
          (Math.PI * 2 * i) / 6;

        const sx =
          Math.cos(a) * size * 0.25;

        const sy =
          Math.sin(a) * size * 0.25;

        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        ctx.fillStyle = "#fde68a";

        ctx.beginPath();

        ctx.arc(
          sx,
          sy,
          size * 0.045,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      ctx.restore();
    }

    /* -------------------------------------------------------
       TULIP
    ------------------------------------------------------- */

    function drawTulip(x, y, size, p, time, angle, color) {
      if (p <= 0) return;

      const bloom = easeOut(p);

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(angle + Math.PI / 2);

      ctx.scale(bloom, bloom);

      const gradient = ctx.createLinearGradient(
        0,
        -size,
        0,
        0
      );

      gradient.addColorStop(0, color.top);
      gradient.addColorStop(1, color.bottom);

      ctx.fillStyle = gradient;

      // left petal
      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.bezierCurveTo(
        -size * 0.6,
        -size * 0.2,
        -size * 0.6,
        -size * 0.75,
        -size * 0.3,
        -size
      );

      ctx.bezierCurveTo(
        -size * 0.05,
        -size * 0.8,
        0,
        -size * 0.55,
        0,
        -size * 0.35
      );

      ctx.closePath();

      ctx.fill();

      // right petal
      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.bezierCurveTo(
        size * 0.6,
        -size * 0.2,
        size * 0.6,
        -size * 0.75,
        size * 0.3,
        -size
      );

      ctx.bezierCurveTo(
        size * 0.05,
        -size * 0.8,
        0,
        -size * 0.55,
        0,
        -size * 0.35
      );

      ctx.closePath();

      ctx.fill();

      // center petal
      ctx.fillStyle = color.center;

      ctx.beginPath();

      ctx.moveTo(-size * 0.2, -size * 0.25);

      ctx.quadraticCurveTo(
        0,
        -size * 0.9,
        size * 0.2,
        -size * 0.25
      );

      ctx.quadraticCurveTo(
        0,
        -size * 0.05,
        -size * 0.2,
        -size * 0.25
      );

      ctx.fill();

      ctx.restore();
    }

    /* -------------------------------------------------------
       Bouquet layout
    ------------------------------------------------------- */

    function getScale() {
      return Math.min(
        width,
        height
      ) / 700;
    }

    function getStems(scale) {
      return [
        // left rose
        {
          startX: -80,
          cp1X: -100,
          cp1Y: -100,
          cp2X: -130,
          cp2Y: -220,
          endX: -165,
          endY: -330,

          type: "rose",
          size: 43,
          start: 0.08,
          bloomStart: 0.47,
          wobble: -0.5,
        },

        // left tulip
        {
          startX: -45,
          cp1X: -60,
          cp1Y: -90,
          cp2X: -70,
          cp2Y: -160,
          endX: -95,
          endY: -250,

          type: "tulip",
          size: 37,
          start: 0.16,
          bloomStart: 0.52,
          wobble: -0.2,
        },

        // center sunflower
        {
          startX: 0,
          cp1X: 0,
          cp1Y: -120,
          cp2X: 0,
          cp2Y: -260,
          endX: 0,
          endY: -390,

          type: "sunflower",
          size: 58,
          start: 0,
          bloomStart: 0.42,
          wobble: 0,
        },

        // right lily
        {
          startX: 48,
          cp1X: 60,
          cp1Y: -90,
          cp2X: 70,
          cp2Y: -180,
          endX: 100,
          endY: -270,

          type: "lily",
          size: 46,
          start: 0.22,
          bloomStart: 0.58,
          wobble: 0.25,
        },

        // right rose
        {
          startX: 85,
          cp1X: 105,
          cp1Y: -100,
          cp2X: 130,
          cp2Y: -220,
          endX: 165,
          endY: -330,

          type: "rose",
          size: 43,
          start: 0.28,
          bloomStart: 0.62,
          wobble: 0.5,
        },

        // small front tulip
        {
          startX: -18,
          cp1X: -20,
          cp1Y: -65,
          cp2X: -35,
          cp2Y: -130,
          endX: -48,
          endY: -195,

          type: "tulip",
          size: 30,
          start: 0.35,
          bloomStart: 0.7,
          wobble: -0.3,
        },

        // small front lily
        {
          startX: 20,
          cp1X: 20,
          cp1Y: -65,
          cp2X: 35,
          cp2Y: -130,
          endX: 50,
          endY: -205,

          type: "lily",
          size: 31,
          start: 0.4,
          bloomStart: 0.74,
          wobble: 0.3,
        },
      ];
    }

    /* -------------------------------------------------------
       Draw bouquet
    ------------------------------------------------------- */

    function drawBouquet(elapsed) {
      const p = clamp(
        elapsed / FLOWER_DURATION,
        0,
        1
      );

      const scale = getScale();

      const stems = getStems(scale);

      // Leaves first
      stems.forEach((stem, index) => {
        const stemProgress = progress(
          p,
          stem.start,
          stem.start + 0.32
        );

        if (stemProgress <= 0) return;

        const x =
          centerX +
          stem.endX * scale;

        const y =
          baseY +
          stem.endY * scale;

        const leafProgress = progress(
          p,
          stem.start + 0.08,
          stem.start + 0.42
        );

        const side =
          index % 2 === 0 ? -1 : 1;

        drawLeaf(
          x + side * 4 * scale,
          y + 35 * scale,
          side * (0.2 + index * 0.04),
          32 * scale,
          leafProgress
        );
      });

      // Stems + flowers
      stems.forEach((stem) => {
        const stemProgress = progress(
          p,
          stem.start,
          stem.start + 0.38
        );

        const result = drawStem(
          stem,
          stemProgress,
          scale,
          elapsed
        );

        if (!result) return;

        const flowerProgress = progress(
          p,
          stem.bloomStart,
          stem.bloomStart + 0.22
        );

        if (flowerProgress <= 0) return;

        const naturalWobble =
          Math.sin(
            elapsed * 0.0012 +
              stem.wobble
          ) * 0.025;

        const flowerX =
          result.x +
          Math.sin(
            elapsed * 0.0012 +
              stem.wobble
          ) *
            4 *
            scale;

        const flowerY =
          result.y +
          Math.cos(
            elapsed * 0.001 +
              stem.wobble
          ) *
            2 *
            scale;

        const flowerAngle =
          result.angle + naturalWobble;

        if (stem.type === "rose") {
          drawRose(
            flowerX,
            flowerY,
            stem.size * scale,
            flowerProgress,
            elapsed,
            flowerAngle
          );
        }

        if (stem.type === "sunflower") {
          drawSunflower(
            flowerX,
            flowerY,
            stem.size * scale,
            flowerProgress,
            elapsed,
            flowerAngle
          );
        }

        if (stem.type === "lily") {
          drawLily(
            flowerX,
            flowerY,
            stem.size * scale,
            flowerProgress,
            elapsed,
            flowerAngle
          );
        }

        if (stem.type === "tulip") {
          const tulipColors =
            stem.wobble < 0
              ? {
                  top: "#fb7185",
                  bottom: "#be123c",
                  center: "#f43f5e",
                }
              : {
                  top: "#c084fc",
                  bottom: "#7e22ce",
                  center: "#a855f7",
                };

          drawTulip(
            flowerX,
            flowerY,
            stem.size * scale,
            flowerProgress,
            elapsed,
            flowerAngle,
            tulipColors
          );
        }
      });

      // bouquet ribbon
      const ribbonProgress = progress(
        p,
        0.35,
        0.72
      );

      if (ribbonProgress > 0) {
        ctx.save();

        ctx.globalAlpha = ribbonProgress;

        const ribbonWidth =
          Math.min(width, height) * 0.13;

        // wrapping paper
        ctx.beginPath();

        ctx.moveTo(
          centerX - ribbonWidth,
          baseY - 5
        );

        ctx.lineTo(
          centerX + ribbonWidth,
          baseY - 5
        );

        ctx.lineTo(
          centerX + ribbonWidth * 0.65,
          baseY + ribbonWidth * 1.3
        );

        ctx.lineTo(
          centerX - ribbonWidth * 0.65,
          baseY + ribbonWidth * 1.3
        );

        ctx.closePath();

        const paperGradient =
          ctx.createLinearGradient(
            centerX - ribbonWidth,
            baseY,
            centerX + ribbonWidth,
            baseY + ribbonWidth
          );

        paperGradient.addColorStop(
          0,
          "rgba(255,245,250,.8)"
        );

        paperGradient.addColorStop(
          0.5,
          "rgba(244,114,182,.45)"
        );

        paperGradient.addColorStop(
          1,
          "rgba(255,255,255,.65)"
        );

        ctx.fillStyle = paperGradient;

        ctx.fill();

        // ribbon
        ctx.fillStyle = "#ec4899";

        ctx.beginPath();

        ctx.roundRect(
          centerX - ribbonWidth * 0.4,
          baseY + ribbonWidth * 0.2,
          ribbonWidth * 0.8,
          ribbonWidth * 0.22,
          10
        );

        ctx.fill();

        // ribbon tails
        ctx.fillStyle = "#db2777";

        ctx.beginPath();

        ctx.moveTo(
          centerX - ribbonWidth * 0.3,
          baseY + ribbonWidth * 0.4
        );

        ctx.lineTo(
          centerX - ribbonWidth * 0.65,
          baseY + ribbonWidth * 0.9
        );

        ctx.lineTo(
          centerX - ribbonWidth * 0.18,
          baseY + ribbonWidth * 0.65
        );

        ctx.closePath();

        ctx.fill();

        ctx.beginPath();

        ctx.moveTo(
          centerX + ribbonWidth * 0.3,
          baseY + ribbonWidth * 0.4
        );

        ctx.lineTo(
          centerX + ribbonWidth * 0.65,
          baseY + ribbonWidth * 0.9
        );

        ctx.lineTo(
          centerX + ribbonWidth * 0.18,
          baseY + ribbonWidth * 0.65
        );

        ctx.closePath();

        ctx.fill();

        ctx.restore();
      }

      // final magical sparkles
      drawSparkles(
        elapsed,
        progress(p, 0.48, 0.75)
      );

      return p;
    }

    /* -------------------------------------------------------
       Animation loop
    ------------------------------------------------------- */

    let hasFinished = false;

    function animate(now) {
      const elapsed = now - startTime;

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      drawBackground(elapsed);
      drawStars(elapsed);

      const p = drawBouquet(elapsed);

      if (
        p >= 1 &&
        !hasFinished
      ) {
        hasFinished = true;

        setTimeout(() => {
          setFinished(true);
        }, 500);
      }

      animationFrame =
        requestAnimationFrame(animate);
    }

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener(
        "resize",
        resize
      );
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#050207]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      {/* subtle foreground glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(0,0,0,.35)_100%)]" />

      {finished && (
        <div className="absolute inset-x-0 bottom-10 z-20 flex justify-center px-5">
          <div className="rounded-full border border-white/10 bg-black/20 px-5 py-2 text-xs tracking-[.3em] text-white/40 backdrop-blur-md">
            FOR Abby ❤️
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [screen, setScreen] = useState("intro");
  const [showBouquet, setShowBouquet] =
    useState(false);
  const [noButtonPosition, setNoButtonPosition] =
    useState(null);

  const stars = useMemo(
    () =>
      Array.from(
        { length: 55 },
        (_, i) => ({
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          delay: `${Math.random() * 4}s`,
        })
      ),
    []
  );

  const petals = useMemo(
    () =>
      Array.from(
        { length: 35 },
        (_, i) => ({
          id: i,
          left: `${Math.random() * 100}%`,
          delay: `${Math.random() * 8}s`,
          duration: `${7 + Math.random() * 7}s`,
        })
      ),
    []
  );

  const hearts = useMemo(
    () =>
      Array.from(
        { length: 18 },
        (_, i) => ({
          id: i,
          left: `${Math.random() * 100}%`,
          delay: `${Math.random() * 8}s`,
          duration: `${7 + Math.random() * 7}s`,
        })
      ),
    []
  );

  const moveNoButton = () => {
    setNoButtonPosition({
      left: `${10 + Math.random() * 75}%`,
      top: `${20 + Math.random() * 65}%`,
    });
  };

  const handleYes = () => {
    setShowBouquet(true);
  };

  return (
    <main className="love-bg relative min-h-screen overflow-hidden text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      {stars.map((star) => (
        <span
          key={star.id}
          className="star pointer-events-none"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
          }}
        />
      ))}

      {petals.map((petal) => (
        <span
          key={petal.id}
          className="petal pointer-events-none"
          style={{
            left: petal.left,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        />
      ))}

      {hearts.map((heart) => (
        <Heart
          key={heart.id}
          className="floating-heart pointer-events-none text-pink-300/40"
          fill="currentColor"
          style={{
            left: heart.left,
            bottom: "-40px",
            width: "18px",
            height: "18px",
            animationDelay: heart.delay,
            animationDuration: heart.duration,
          }}
        />
      ))}

      {/* =====================================================
          INTRO
      ===================================================== */}

      {screen === "intro" && (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-5">

          <div className="fade-up w-full max-w-3xl text-center">

            <Sparkles
              className="mx-auto mb-7 animate-pulse text-pink-200"
              size={38}
            />

            <p className="text-xs uppercase tracking-[.5em] text-pink-200/50">
              A little surprise
            </p>

            <h1 className="font-romantic mt-6 text-7xl text-pink-100 sm:text-9xl">
              For Abby
            </h1>

            <p className="font-serif-romantic mx-auto mt-7 max-w-2xl text-2xl leading-relaxed text-white/60 sm:text-3xl">
              I made something special for someone very special.
            </p>

            <button
              onClick={() =>
                setScreen("message")
              }
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-pink-300/20 bg-white/5 px-7 py-4 text-sm text-white/80 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/10"
            >
              Open my surprise
              <ArrowRight size={17} />
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {screen === "message" && (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-5">

          <div className="fade-up w-full max-w-3xl text-center">

            <Heart
              className="big-heart mx-auto text-rose-400"
              fill="currentColor"
              size={75}
            />

            <p className="mt-8 text-xs uppercase tracking-[.5em] text-pink-200/50">
              Abby...
            </p>

            <h2 className="font-serif-romantic mt-6 text-4xl leading-tight text-white sm:text-6xl">
              Some people make ordinary days feel beautiful.
            </h2>

            <p className="font-serif-romantic mx-auto mt-7 max-w-2xl text-2xl leading-relaxed text-white/55 sm:text-3xl">
              And somehow, you became one of those people for me.
            </p>

            <button
              onClick={() =>
                setScreen("letter")
              }
              className="mt-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-7 py-4 text-sm font-medium shadow-lg shadow-pink-500/20 transition hover:-translate-y-1"
            >
              Continue ❤️
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          LETTER
      ===================================================== */}

      {screen === "letter" && (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

          <div className="letter w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[.055] p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-12">

            <div className="text-center">

              <p className="font-serif-romantic text-3xl text-white/90">
                Dear Abby,
              </p>

            </div>

            <div className="font-serif-romantic mt-8 space-y-5 text-xl leading-9 text-white/60 sm:text-2xl">

              <p>
                If I could give you a garden, I would fill it with
                every flower in the world.
              </p>

              <p>
                But even then, I don't think any flower could be
                as special as the smile you bring into my day.
              </p>

              <p>
                So I made you this little suprise for you.
              </p>

              <p className="text-pink-200/70">
                And now I have one little question to ask you...
              </p>

            </div>

            <div className="mt-9 text-center">

              <button
                onClick={() =>
                  setScreen("question")
                }
                className="rounded-full border border-pink-300/20 bg-pink-500/10 px-7 py-3 text-sm text-pink-100 transition hover:bg-pink-500/20"
              >
                One last thing... ❤️
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          QUESTION
      ===================================================== */}

      {screen === "question" &&
        !showBouquet && (
          <div className="relative z-10 flex min-h-screen items-center justify-center px-5">

            <div className="fade-up w-full max-w-3xl text-center">

              <Heart
                className="big-heart mx-auto text-rose-400"
                fill="currentColor"
                size={85}
              />

              <p className="mt-8 text-xs uppercase tracking-[.5em] text-pink-200/50">
                Abby
              </p>

              <h1 className="font-romantic mt-6 text-6xl leading-tight text-pink-100 sm:text-8xl">
                Will you be my girlfriend?
              </h1>

              <p className="font-serif-romantic mx-auto mt-7 max-w-xl text-xl leading-8 text-white/55 sm:text-2xl">
                I promise to bring flowers, make you smile,
                and annoy you just enough to keep things interesting. ❤️
              </p>

              <div className="relative mx-auto mt-12 flex min-h-24 max-w-xl items-center justify-center gap-4">

                <button
                  onClick={handleYes}
                  className="yes-button z-20 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-8 py-4 text-sm font-semibold shadow-2xl shadow-pink-500/30 sm:px-10 sm:text-base"
                >
                  Yes, absolutely! ❤️
                </button>

                <button
                  onMouseEnter={moveNoButton}
                  onTouchStart={moveNoButton}
                  style={
                    noButtonPosition
                      ? {
                          position: "fixed",
                          left: noButtonPosition.left,
                          top: noButtonPosition.top,
                          zIndex: 100,
                        }
                      : {}
                  }
                  className="z-20 rounded-full border border-white/10 bg-white/5 px-7 py-4 text-sm text-white/60 backdrop-blur-xl"
                >
                  Maybe... 🌸
                </button>

              </div>

            </div>

          </div>
        )}

      {/* =====================================================
          FLOWER REVEAL
      ===================================================== */}

      {showBouquet && (
        <FlowerBouquet />
      )}

    </main>
  );
}

export default App;