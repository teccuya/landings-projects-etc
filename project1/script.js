(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    revealItems.forEach((item) => observer.observe(item));
  }

  if (finePointer && !reducedMotion) {
    const shell = document.querySelector("[data-app-shell]");
    const visual = document.querySelector(".hero__visual");

    visual.addEventListener("pointermove", (event) => {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      shell.style.transform = `rotateY(${-4 + x * 3}deg) rotateX(${2 - y * 3}deg)`;
    });

    visual.addEventListener("pointerleave", () => {
      shell.style.transform = "";
    });
  }

  const rooms = {
    lounge: {
      title: "lounge",
      subtitle: "место без повестки",
      placeholder: "Написать в #lounge",
      count: "4 человека",
    },
    ideas: {
      title: "ideas",
      subtitle: "черновики и мысли вслух",
      placeholder: "Написать в #ideas",
      count: "8 человек",
    },
    focus: {
      title: "focus-room",
      subtitle: "тихий совместный режим",
      placeholder: "Написать в #focus-room",
      count: "3 человека",
    },
  };

  document.querySelectorAll("[data-room]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-room]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const room = rooms[button.dataset.room];
      document.querySelector("[data-room-title]").textContent = room.title;
      document.querySelector("[data-room-subtitle]").textContent = room.subtitle;
      document.querySelector("[data-listener-count]").textContent = room.count;
      document.querySelector("#message").placeholder = room.placeholder;
    });
  });

  const joinButton = document.querySelector("[data-join]");
  joinButton.addEventListener("click", () => {
    const joined = joinButton.classList.toggle("is-joined");
    joinButton.querySelector("span").textContent = joined ? "✓" : "+";
    joinButton.querySelector("b").textContent = joined ? "В эфире" : "Войти";
    document.querySelector("[data-listener-count]").textContent = joined ? "5 человек" : "4 человека";
  });

  document.querySelectorAll("[data-control]").forEach((control) => {
    control.addEventListener("click", () => {
      const active = control.classList.toggle("is-active");
      control.setAttribute("aria-pressed", String(active));
    });
  });

  const composer = document.querySelector("[data-composer]");
  const input = composer.querySelector("input");
  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;

    const message = document.createElement("article");
    message.className = "message";
    message.innerHTML = `
      <i class="avatar avatar--four">Y</i>
      <div>
        <p><strong>you</strong><time>сейчас</time></p>
        <span></span>
      </div>`;
    message.querySelector("span").textContent = value;
    document.querySelector("[data-messages]").append(message);
    input.value = "";
  });

  document.querySelector("[data-download]").addEventListener("click", (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const original = button.firstChild.textContent;
    button.firstChild.textContent = "SFERA скоро откроется ";
    window.setTimeout(() => {
      button.firstChild.textContent = original;
    }, 1800);
  });

  document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
})();
