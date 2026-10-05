(() => {
  const header = document.querySelector("header.nav");
  const nav = header?.querySelector("nav");
  if (!header || !nav) return;

  if (!nav.id) nav.id = "primary-nav";

  let toggle = header.querySelector(".nav-toggle");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.innerHTML = "<span></span><span></span><span></span>";
    nav.insertAdjacentElement("afterend", toggle);
  }
  toggle.setAttribute("aria-label", "Open navigation menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", nav.id);

  if (!nav.querySelector(".mobile-register")) {
    const registerLink = header.querySelector(":scope > a.btn");
    if (registerLink) {
      const mobileRegister = document.createElement("a");
      mobileRegister.className = "mobile-register";
      mobileRegister.href = registerLink.href;
      mobileRegister.textContent = registerLink.textContent.trim();
      nav.append(mobileRegister);
    }
  }

  const closeMenu = (returnFocus = false) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    if (returnFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("is-open", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !header.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeMenu();
  });
})();
