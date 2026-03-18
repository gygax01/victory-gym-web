(function initUiGlobal(global) {
  if (global.appAlert && global.appConfirm && global.appToast) return;

  const queue = [];
  let processing = false;
  let domReady = false;

  function onReady(cb) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      cb();
      return;
    }
    document.addEventListener("DOMContentLoaded", cb, { once: true });
  }

  function ensureUiDom() {
    if (domReady) return;
    domReady = true;

    if (!document.getElementById("app-ui-style")) {
      const style = document.createElement("style");
      style.id = "app-ui-style";
      style.textContent = `
        .app-ui-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, .65);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(3px);
        }
        .app-ui-overlay.show { display: flex; }
        .app-ui-card {
          width: min(92vw, 420px);
          background: #2b2d32;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          box-shadow: 0 16px 44px rgba(0,0,0,.45);
          padding: 18px;
          color: #fff;
          font-family: inherit;
        }
        .app-ui-title {
          margin: 0 0 8px;
          font-size: 20px;
        }
        .app-ui-msg {
          margin: 0;
          line-height: 1.45;
          opacity: .94;
          white-space: pre-wrap;
        }
        .app-ui-actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .app-ui-btn {
          border: none;
          border-radius: 9px;
          padding: 10px 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .app-ui-btn.ok { background: #f3722c; color: #fff; }
        .app-ui-btn.cancel { background: #4a4d55; color: #fff; }
        .app-ui-toast-wrap {
          position: fixed;
          right: 14px;
          bottom: 14px;
          z-index: 10000;
          display: grid;
          gap: 8px;
          max-width: min(92vw, 360px);
        }
        .app-ui-toast {
          padding: 10px 12px;
          border-radius: 10px;
          color: #fff;
          box-shadow: 0 8px 22px rgba(0,0,0,.35);
          font-size: 14px;
          line-height: 1.35;
          animation: appUiToastIn .2s ease;
        }
        .app-ui-toast.info { background: #333; }
        .app-ui-toast.success { background: #2ecc71; }
        .app-ui-toast.warn { background: #f39c12; }
        .app-ui-toast.error { background: #e74c3c; }
        @keyframes appUiToastIn {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("app-ui-overlay")) {
      const overlay = document.createElement("div");
      overlay.id = "app-ui-overlay";
      overlay.className = "app-ui-overlay";
      overlay.innerHTML = `
        <div class="app-ui-card" role="dialog" aria-modal="true" aria-live="polite">
          <h3 class="app-ui-title" id="app-ui-title">Aviso</h3>
          <p class="app-ui-msg" id="app-ui-msg"></p>
          <div class="app-ui-actions">
            <button type="button" class="app-ui-btn cancel" id="app-ui-cancel" style="display:none">Cancelar</button>
            <button type="button" class="app-ui-btn ok" id="app-ui-ok">Aceptar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    if (!document.getElementById("app-ui-toast-wrap")) {
      const wrap = document.createElement("div");
      wrap.id = "app-ui-toast-wrap";
      wrap.className = "app-ui-toast-wrap";
      document.body.appendChild(wrap);
    }
  }

  function openModal(config) {
    return new Promise(resolve => {
      queue.push({ config, resolve });
      processQueue();
    });
  }

  function processQueue() {
    if (processing || !queue.length) return;
    processing = true;

    onReady(() => {
      ensureUiDom();

      const overlay = document.getElementById("app-ui-overlay");
      const titleEl = document.getElementById("app-ui-title");
      const msgEl = document.getElementById("app-ui-msg");
      const okBtn = document.getElementById("app-ui-ok");
      const cancelBtn = document.getElementById("app-ui-cancel");

      const current = queue.shift();
      const { config, resolve } = current;

      titleEl.textContent = String(config.title || "Aviso");
      msgEl.textContent = String(config.message || "");
      okBtn.textContent = String(config.okText || "Aceptar");

      const hasCancel = Boolean(config.confirm);
      cancelBtn.style.display = hasCancel ? "inline-block" : "none";
      cancelBtn.textContent = String(config.cancelText || "Cancelar");

      const cleanup = result => {
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        overlay.onclick = null;
        window.removeEventListener("keydown", onKeyDown);
        overlay.classList.remove("show");
        resolve(result);
        processing = false;
        processQueue();
      };

      const onKeyDown = event => {
        if (event.key === "Escape") {
          cleanup(hasCancel ? false : true);
        }
      };

      okBtn.onclick = () => cleanup(true);
      cancelBtn.onclick = () => cleanup(false);
      overlay.onclick = event => {
        if (event.target === overlay) {
          cleanup(hasCancel ? false : true);
        }
      };

      window.addEventListener("keydown", onKeyDown);
      overlay.classList.add("show");
      setTimeout(() => okBtn.focus(), 20);
    });
  }

  global.appAlert = function appAlert(message, title = "Aviso") {
    return openModal({ title, message, confirm: false, okText: "Aceptar" });
  };

  global.appConfirm = function appConfirm(message, title = "Confirmar", options = {}) {
    return openModal({
      title,
      message,
      confirm: true,
      okText: options.okText || "Confirmar",
      cancelText: options.cancelText || "Cancelar"
    });
  };

  global.appToast = function appToast(message, type = "info", timeoutMs = 2200) {
    onReady(() => {
      ensureUiDom();
      const wrap = document.getElementById("app-ui-toast-wrap");
      const toast = document.createElement("div");
      const normalizedType = ["info", "success", "warn", "error"].includes(type) ? type : "info";
      toast.className = `app-ui-toast ${normalizedType}`;
      toast.textContent = String(message || "");
      wrap.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(6px)";
      }, Math.max(300, timeoutMs - 180));

      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, timeoutMs);
    });
  };
})(window);
