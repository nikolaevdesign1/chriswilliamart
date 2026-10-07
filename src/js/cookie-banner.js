import gsap from "gsap";

// Cookie consent. Shown once; the answer is kept so it never asks again.
// Declining is as easy as accepting, one click, same size of target.

const STORAGE_KEY = "cw-cookie-consent";

function readConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* private mode, the banner will simply ask again next visit */
  }
}

/** "accepted", "declined", or null if the visitor hasn't answered yet. */
export function cookieConsent() {
  return readConsent();
}

export function initCookieBanner({ delay = 1 } = {}) {
  if (readConsent()) return;

  const banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <p class="cookie-banner__text">
      We use cookies to remember your settings and to see how visitors move through the gallery.
    </p>
    <div class="cookie-banner__actions">
      <button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-consent="declined">Decline</button>
      <button type="button" class="cookie-banner__btn" data-consent="accepted">Accept</button>
    </div>
  `;
  document.body.appendChild(banner);

  gsap.fromTo(
    banner,
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, delay, ease: "back.out(1.4)" }
  );

  banner.addEventListener("click", (event) => {
    const button = event.target.closest("[data-consent]");
    if (!button) return;
    writeConsent(button.dataset.consent);
    document.dispatchEvent(new CustomEvent("cookieconsent", { detail: button.dataset.consent }));
    gsap.to(banner, {
      y: 16,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => banner.remove(),
    });
  });
}
