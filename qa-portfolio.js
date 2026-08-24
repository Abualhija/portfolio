(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const progressBar = document.querySelector(".scroll-progress span");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem("portfolio-theme", theme);
    themeToggle?.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    themeMeta?.setAttribute("content", theme === "dark" ? "#07100f" : "#eef5f1");
  };

  const savedTheme = localStorage.getItem("portfolio-theme");
  setTheme(savedTheme === "light" ? "light" : "dark");

  themeToggle?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  const closeMenu = () => {
    nav?.classList.remove("is-open");
    menuToggle?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation");
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = !nav?.classList.contains("is-open");
    nav?.classList.toggle("is-open", isOpen);
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      nav?.classList.contains("is-open") &&
      !nav.contains(event.target) &&
      !menuToggle?.contains(event.target)
    ) {
      closeMenu();
    }
  });

  const updateScrollUI = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  let scrollFrame = null;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        updateScrollUI();
        scrollFrame = null;
      });
    },
    { passive: true },
  );
  updateScrollUI();

  if (!reduceMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        root.style.setProperty("--mouse-x", `${event.clientX}px`);
        root.style.setProperty("--mouse-y", `${event.clientY}px`);
      },
      { passive: true },
    );
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  revealItems.forEach((item) => {
    const delay = Number(item.dataset.delay || 0);
    item.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const countValue = (element) => {
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals || 0);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const duration = 1150;
    const startedAt = performance.now();

    const tick = (time) => {
      const elapsed = Math.min((time - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const current = target * eased;
      element.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;
      if (elapsed < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const metrics = document.querySelectorAll("[data-count]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    metrics.forEach((metric) => {
      const decimals = Number(metric.dataset.decimals || 0);
      metric.textContent = `${metric.dataset.prefix || ""}${Number(metric.dataset.count).toFixed(decimals)}${metric.dataset.suffix || ""}`;
    });
  } else {
    const metricObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countValue(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );

    metrics.forEach((metric) => metricObserver.observe(metric));
  }

  const sections = [...document.querySelectorAll("main section[id]")];
  const navigationLinks = [...(nav?.querySelectorAll("a[href^='#']") || [])];
  if ("IntersectionObserver" in window && sections.length) {
    const activeSections = new Map();
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          activeSections.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        const active = [...activeSections.entries()].sort((a, b) => b[1] - a[1])[0];
        if (!active || active[1] === 0) return;

        navigationLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${active[0]}`);
        });
      },
      { rootMargin: "-25% 0px -55%", threshold: [0, 0.1, 0.4, 0.7] },
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  const runTests = () => {
    const rows = [...document.querySelectorAll("[data-test-row]")];
    const consoleCard = document.querySelector(".quality-console");

    if (reduceMotion) {
      rows.forEach((row) => {
        row.classList.add("is-passed");
        row.querySelector(".test-status").textContent = "passed";
      });
      consoleCard?.classList.add("is-complete");
      return;
    }

    rows.forEach((row, index) => {
      const status = row.querySelector(".test-status");
      window.setTimeout(() => {
        row.classList.add("is-running");
        status.textContent = "running";
      }, 550 + index * 430);

      window.setTimeout(() => {
        row.classList.remove("is-running");
        row.classList.add("is-passed");
        status.textContent = "passed";

        if (index === rows.length - 1) consoleCard?.classList.add("is-complete");
      }, 900 + index * 430);
    });
  };

  runTests();

  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${(-y * 3.5).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(x * 4.5).toFixed(2)}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  const copyButton = document.querySelector("[data-copy-email]");
  copyButton?.addEventListener("click", async () => {
    const email = copyButton.dataset.copyEmail;
    const label = copyButton.querySelector("strong");

    try {
      await navigator.clipboard.writeText(email);
      label.textContent = "Copied";
      window.setTimeout(() => {
        label.textContent = "Copy";
      }, 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
