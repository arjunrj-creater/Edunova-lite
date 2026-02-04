export function attachPasswordToggle({
  inputId,
  toggleId,
  autoHideMs = 10000
}) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);

  if (!input || !toggle) return;

  let isVisible = false;
  let autoHideTimer = null;

  function hidePassword() {
    input.type = "password";
    toggle.innerText = "Show";
    isVisible = false;
    clearTimeout(autoHideTimer);
  }

  function startAutoHide() {
    clearTimeout(autoHideTimer);
    autoHideTimer = setTimeout(hidePassword, autoHideMs);
  }

  // Show / Hide toggle
  toggle.addEventListener("click", () => {
    if (!isVisible) {
      input.type = "text";
      toggle.innerText = "Hide";
      isVisible = true;
      startAutoHide();
    } else {
      hidePassword();
    }
  });

  // 🔥 KEY FIX: typing IMMEDIATELY hides password
  input.addEventListener("input", () => {
    if (isVisible) {
      hidePassword();
    }
  });
}
