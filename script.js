(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("no-js");
  root.classList.add("js");
  const enhancementFailSafe = window.setTimeout(() => {
    if (root.classList.contains("reveal-ready")) return;
    root.classList.remove("js");
    root.classList.add("no-js");
  }, 1500);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const desktopPreview = window.matchMedia("(min-width: 901px)");

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // Scroll state: progress, compact header and active navigation.
  const progressBar = document.querySelector(".page-progress span");
  const topbar = document.querySelector(".topbar");
  const navLinks = [...document.querySelectorAll(".topbar__nav a")];
  const observedSections = ["work", "approach", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let scrollTicking = false;

  const updateScrollState = () => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    progressBar.style.transform = `scaleX(${progress})`;
    topbar.classList.toggle("is-compact", window.scrollY > 48);

    let current = "";
    for (const section of observedSections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.38) current = section.id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle("is-current", link.getAttribute("href") === `#${current}`);
    });

    scrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollState);
  }, { passive: true });

  updateScrollState();

  // Reveal sections when they enter the viewport.
  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    revealItems.forEach((item) => revealObserver.observe(item));
  }
  root.classList.add("reveal-ready");
  window.clearTimeout(enhancementFailSafe);

  // Fine-pointer spotlight and responsive custom cursor.
  if (finePointer && !reducedMotion) {
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let cursorStarted = false;

    const renderCursor = () => {
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(renderCursor);
    };

    window.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
      if (!cursorStarted) {
        cursorStarted = true;
        body.classList.add("cursor-ready");
      }
    }, { passive: true });

    document.querySelectorAll("a, button").forEach((element) => {
      element.addEventListener("pointerenter", () => body.classList.add("cursor-over-link"));
      element.addEventListener("pointerleave", () => body.classList.remove("cursor-over-link"));
    });

    document.querySelectorAll(".project-row").forEach((element) => {
      element.addEventListener("pointerenter", () => body.classList.add("cursor-over-project"));
      element.addEventListener("pointerleave", () => body.classList.remove("cursor-over-project"));
    });

    window.addEventListener("blur", () => body.classList.remove("cursor-ready"));
    window.addEventListener("focus", () => {
      if (cursorStarted) body.classList.add("cursor-ready");
    });

    renderCursor();
  }

  // Subtle magnetic movement for two main calls to action.
  if (finePointer && !reducedMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
        element.style.transform = `translate3d(${x * 9}px, ${y * 9}px, 0)`;
      });

      element.addEventListener("pointerleave", () => {
        element.style.transform = "";
      });
    });
  }

  // Live project preview: hover/focus the list, keep links fully usable.
  const projectRows = [...document.querySelectorAll(".project-row")];
  const previewFrame = document.querySelector(".preview-frame");
  const previewViewport = document.querySelector(".preview-viewport");
  const previewIframe = document.getElementById("project-preview");
  const previewName = document.getElementById("preview-name");
  const previewType = document.getElementById("preview-type");
  const previewIndex = document.getElementById("preview-index");
  const previewUrl = document.getElementById("preview-url");
  const workSection = document.getElementById("work");

  let activeRow = projectRows[0];
  let previewLoadedOnce = false;
  let previewIntentTimer = 0;
  let previewSwapTimer = 0;

  const updatePreviewCopy = (row) => {
    const name = row.dataset.projectName;
    const type = row.dataset.projectType;
    const index = row.dataset.projectIndex;
    const accent = row.dataset.projectAccent;

    root.style.setProperty("--active-accent", accent);
    previewName.textContent = name;
    previewType.textContent = type;
    previewIndex.textContent = `${index} / 05`;
    previewUrl.textContent = `/project${Number(index)}/`;
    previewIframe.title = `Превью проекта ${name}`;
  };

  const loadPreview = (row, immediate = false) => {
    if (!desktopPreview.matches) return;
    const nextSource = row.dataset.preview;
    const currentSource = previewIframe.getAttribute("src");
    updatePreviewCopy(row);

    if (currentSource === nextSource) return;

    window.clearTimeout(previewSwapTimer);
    previewViewport.classList.add("is-switching");
    const delay = immediate || !currentSource ? 0 : 180;

    previewSwapTimer = window.setTimeout(() => {
      previewViewport.classList.remove("is-loaded");
      previewIframe.setAttribute("src", nextSource);
    }, delay);
  };

  const activateProject = (row, immediate = false) => {
    if (!row || row === activeRow && previewLoadedOnce) return;
    activeRow = row;
    projectRows.forEach((item) => {
      const isActive = item === row;
      item.classList.toggle("is-active", isActive);
    });
    loadPreview(row, immediate);
  };

  previewIframe.addEventListener("load", () => {
    previewLoadedOnce = true;
    previewViewport.classList.remove("is-switching");
    previewViewport.classList.add("is-loaded");
  });

  projectRows.forEach((row) => {
    const queueActivation = () => {
      window.clearTimeout(previewIntentTimer);
      previewIntentTimer = window.setTimeout(() => activateProject(row), 85);
    };

    row.addEventListener("mouseenter", queueActivation);
    row.addEventListener("focus", () => activateProject(row));
  });

  if ("IntersectionObserver" in window) {
    const previewObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (desktopPreview.matches && !previewLoadedOnce) loadPreview(activeRow, true);
      observer.disconnect();
    }, { rootMargin: "240px 0px", threshold: 0.01 });
    previewObserver.observe(workSection);
  } else if (desktopPreview.matches) {
    loadPreview(activeRow, true);
  }

  desktopPreview.addEventListener("change", (event) => {
    if (event.matches) loadPreview(activeRow, true);
  });

  // Small 3D response on the preview, capped to keep it calm.
  if (finePointer && !reducedMotion && previewFrame) {
    previewFrame.addEventListener("pointermove", (event) => {
      const rect = previewFrame.getBoundingClientRect();
      const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
      const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;
      previewFrame.style.setProperty("--preview-tilt-x", `${normalizedX * 2.5}deg`);
      previewFrame.style.setProperty("--preview-tilt-y", `${normalizedY * -2.5}deg`);
    });
    previewFrame.addEventListener("pointerleave", () => {
      previewFrame.style.setProperty("--preview-tilt-x", "0deg");
      previewFrame.style.setProperty("--preview-tilt-y", "0deg");
    });
  }

  // Hero signal field: lightweight canvas, never part of the content layer.
  const canvas = document.getElementById("signal-canvas");
  if (canvas && !reducedMotion) {
    const context = canvas.getContext("2d", { alpha: true });
    const hero = canvas.parentElement;
    const pointer = { x: 0, y: 0, active: false };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    let animationFrame = 0;

    const createPoints = () => {
      const count = clamp(Math.floor(width / 58), 14, 31);
      points = Array.from({ length: count }, (_, index) => ({
        x: (index / Math.max(count - 1, 1)) * width + (Math.random() - 0.5) * 50,
        y: height * (0.18 + Math.random() * 0.64),
        baseY: height * (0.18 + Math.random() * 0.64),
        speed: 0.12 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() > 0.8 ? 2.2 : 1.1
      }));
    };

    const resizeCanvas = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createPoints();
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      const elapsed = time * 0.001;

      points.forEach((point, index) => {
        point.y = point.baseY + Math.sin(elapsed * point.speed + point.phase) * 34;

        if (pointer.active) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 210) {
            const pull = (1 - distance / 210) * 0.018;
            point.y += dy * pull;
          }
        }

        for (let next = index + 1; next < points.length; next += 1) {
          const other = points[next];
          const dx = other.x - point.x;
          const dy = other.y - point.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 178) continue;
          const alpha = (1 - distance / 178) * 0.15;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(202, 255, 56, ${alpha})`;
          context.lineWidth = 0.7;
          context.stroke();
        }

        context.beginPath();
        context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        context.fillStyle = point.size > 2 ? "rgba(255, 86, 53, 0.78)" : "rgba(202, 255, 56, 0.46)";
        context.fill();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }, { passive: true });

    hero.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(hero);
    resizeCanvas();
    animationFrame = requestAnimationFrame(draw);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(animationFrame);
      else animationFrame = requestAnimationFrame(draw);
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
