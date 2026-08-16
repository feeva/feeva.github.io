const root = document.querySelector("#subscribe");

if (root) {
  const apiUrl = root.dataset.apiUrl.replace(/\/$/, "");
  const siteKey = root.dataset.turnstileSiteKey;
  let widgetId = null;
  let turnstileToken = "";

  const element = (tag, options = {}) => {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text != null) node.textContent = options.text;
    if (options.attrs) Object.entries(options.attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const toggle = element("button", { className: "subscribe-toggle", text: "구독", attrs: { type: "button", "aria-expanded": "false" } });
  const panel = element("div", { className: "subscribe-panel", attrs: { hidden: "" } });
  root.append(toggle, panel);

  const openForm = () => {
    panel.hidden = false;
    toggle.hidden = true;

    const form = element("form", { className: "subscribe-form", attrs: { novalidate: "" } });
    const emailField = element("div", { className: "subscribe-field" });
    const emailId = "subscribe-email";
    const email = element("input", { attrs: { id: emailId, name: "email", type: "email", required: "", autocomplete: "email", placeholder: "이메일 주소", maxlength: "254" } });
    emailField.append(element("label", { text: "새 글이 올라오면 이메일로 알려드려요.", attrs: { for: emailId } }), email);

    const status = element("p", { className: "subscribe-status", attrs: { "aria-live": "polite" } });
    const footer = element("div", { className: "subscribe-form-footer" });
    const humanCheck = element("div", { className: "subscribe-turnstile" });
    if (siteKey) footer.append(humanCheck);
    const submit = element("button", { className: "subscribe-submit", text: "구독 신청", attrs: { type: "submit" } });
    submit.disabled = Boolean(siteKey);
    footer.append(submit);
    form.append(emailField, status, footer);
    if (siteKey) status.textContent = "사람 인증을 준비하는 중입니다.";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (siteKey && !turnstileToken) {
        status.textContent = "사람 인증을 완료해 주세요.";
        return;
      }
      submit.disabled = true;
      status.textContent = "구독을 신청하는 중입니다.";
      try {
        const response = await fetch(`${apiUrl}/api/subscribe`, {
          method: "POST",
          credentials: "omit",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.value, turnstileToken }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "구독 신청에 실패했습니다.");
        panel.replaceChildren(element("p", { className: "subscribe-status", text: result.message }));
      } catch (error) {
        status.textContent = error.message;
        if (siteKey) {
          turnstileToken = "";
          window.turnstile?.reset(widgetId);
        } else {
          submit.disabled = false;
        }
      }
    });

    panel.append(form);

    if (siteKey) {
      const renderTurnstile = () => {
        if (!humanCheck.isConnected) return;
        if (!window.turnstile) {
          setTimeout(renderTurnstile, 100);
          return;
        }
        widgetId = window.turnstile.render(humanCheck, {
          sitekey: siteKey,
          theme: "auto",
          action: "subscribe",
          callback: (token) => {
            turnstileToken = token;
            submit.disabled = false;
            status.textContent = "사람 인증이 완료되었습니다.";
          },
          "expired-callback": () => {
            turnstileToken = "";
            submit.disabled = true;
            status.textContent = "사람 인증이 만료되어 다시 확인하고 있습니다.";
          },
          "timeout-callback": () => {
            turnstileToken = "";
            submit.disabled = true;
            status.textContent = "사람 인증 시간이 초과되었습니다. 다시 확인해 주세요.";
          },
          "error-callback": (errorCode) => {
            turnstileToken = "";
            submit.disabled = true;
            console.error("Turnstile error:", errorCode);
            status.textContent = `Cloudflare 보안 확인 오류 (${errorCode})가 발생했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.`;
            return false;
          },
        });
      };
      queueMicrotask(renderTurnstile);
    }

    email.focus();
  };

  toggle.addEventListener("click", openForm);
}
