const root = document.querySelector("#comments");

if (root) {
  const apiUrl = root.dataset.apiUrl.replace(/\/$/, "");
  const postId = root.dataset.postId;
  const siteKey = root.dataset.turnstileSiteKey;
  const formatter = new Intl.DateTimeFormat(navigator.languages, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
  const markdown = typeof window.markdownit === "function"
    ? window.markdownit({ html: false, linkify: false, typographer: false, breaks: true })
    : null;
  markdown?.disable(["heading", "lheading", "image", "table", "hr", "strikethrough"], true);

  let comments = [];
  let replyTo = null;
  let deleteTarget = null;
  let formOpen = false;
  let widgetId = null;
  let notice = "";
  const draft = { authorName: "", email: "", password: "", body: "" };

  const element = (tag, options = {}) => {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text != null) node.textContent = options.text;
    if (options.attrs) Object.entries(options.attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const removeTurnstile = () => {
    if (widgetId != null) window.turnstile?.remove(widgetId);
    widgetId = null;
  };

  const base64urlEncode = (bytes) => {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  };

  const deriveDeleteCredential = async (password, credential = {}) => {
    const salt = credential.salt
      ? Uint8Array.from(atob(credential.salt.replaceAll("-", "+").replaceAll("_", "/") + "=="), (character) => character.charCodeAt(0))
      : crypto.getRandomValues(new Uint8Array(16));
    const algorithm = credential.algorithm || "pbkdf2-sha256";
    const iterations = credential.iterations || 600_000;
    if (algorithm !== "pbkdf2-sha256" || iterations !== 600_000 || salt.byteLength !== 16) throw new Error("삭제 비밀번호 정보를 확인할 수 없습니다.");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const proof = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
    return { passwordProof: base64urlEncode(proof), passwordSalt: base64urlEncode(salt), passwordAlgorithm: algorithm, passwordIterations: iterations };
  };

  const safeLink = (value) => {
    try {
      const url = new URL(value, document.baseURI);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  };

  const markdownTags = {
    paragraph_open: "p",
    blockquote_open: "blockquote",
    bullet_list_open: "ul",
    ordered_list_open: "ol",
    list_item_open: "li",
    em_open: "em",
    strong_open: "strong",
  };
  const markdownCloses = new Set([
    "paragraph_close",
    "blockquote_close",
    "bullet_list_close",
    "ordered_list_close",
    "list_item_close",
    "em_close",
    "strong_close",
    "link_close",
  ]);

  const appendMarkdownTokens = (tokens, container) => {
    const stack = [container];
    const current = () => stack[stack.length - 1];

    for (const token of tokens || []) {
      if (token.type === "inline") {
        appendMarkdownTokens(token.children, current());
      } else if (markdownTags[token.type]) {
        const node = element(markdownTags[token.type]);
        if (token.type === "ordered_list_open") {
          const start = token.attrGet("start");
          if (/^[1-9]\d{0,2}$/.test(start || "") && start !== "1") node.setAttribute("start", start);
        }
        current().append(node);
        stack.push(node);
      } else if (token.type === "link_open") {
        const href = safeLink(token.attrGet("href"));
        const node = href
          ? element("a", { attrs: { href, rel: "ugc nofollow" } })
          : element("span", { className: "comment-link-invalid" });
        current().append(node);
        stack.push(node);
      } else if (markdownCloses.has(token.type)) {
        if (stack.length > 1) stack.pop();
      } else if (token.type === "text") {
        current().append(document.createTextNode(token.content));
      } else if (token.type === "softbreak" || token.type === "hardbreak") {
        current().append(element("br"));
      } else if (token.type === "code_inline") {
        current().append(element("code", { text: token.content }));
      } else if (token.type === "fence" || token.type === "code_block") {
        const pre = element("pre");
        pre.append(element("code", { text: token.content }));
        current().append(pre);
      } else if (token.type === "html_inline" || token.type === "html_block" || token.type === "image") {
        current().append(document.createTextNode(token.content || ""));
      } else if (token.content) {
        current().append(document.createTextNode(token.content));
      }
    }
  };

  const renderMarkdown = (source) => {
    const fragment = document.createDocumentFragment();
    if (!markdown) {
      fragment.append(document.createTextNode(source));
      return fragment;
    }
    appendMarkdownTokens(markdown.parse(source, {}), fragment);
    return fragment;
  };

  const commentTree = () => {
    const byParent = new Map();
    comments.forEach((comment) => {
      const parent = comment.parentId || "root";
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(comment);
    });
    for (const siblings of byParent.values()) {
      siblings.sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
    }
    const pruneDeletedLeaves = (parentId) => {
      const visible = (byParent.get(parentId) || []).filter((comment) => {
        const children = pruneDeletedLeaves(comment.id);
        byParent.set(comment.id, children);
        return !comment.deleted || children.length > 0;
      });
      byParent.set(parentId, visible);
      return visible;
    };
    pruneDeletedLeaves("root");
    return byParent;
  };

  const sortTopLevelByActivity = (topLevel, byParent) => {
    const activity = new Map();
    const latest = (comment) => {
      if (activity.has(comment.id)) return activity.get(comment.id);
      const childTimes = (byParent.get(comment.id) || []).map(latest);
      const time = Math.max(Date.parse(comment.createdAt) || 0, ...childTimes);
      activity.set(comment.id, time);
      return time;
    };
    return [...topLevel].sort((left, right) => latest(right) - latest(left));
  };

  const renderCommentBody = (comment) => {
    const body = element("div", {
      className: `comment-body ${comment.bodyFormat === "markdown" ? "comment-body-markdown" : "comment-body-plain"}`,
    });
    if (comment.bodyFormat === "markdown") body.append(renderMarkdown(comment.body));
    else body.textContent = comment.body;
    return body;
  };

  const focusEditor = () => document.querySelector("#comment-body")?.focus();

  const renderForm = () => {
    let turnstileToken = "";
    const form = element("form", {
      className: `comment-form${replyTo ? " comment-form-reply" : ""}`,
      attrs: { id: "comment-form", novalidate: "" },
    });
    const heading = element("div", { className: "comment-form-heading" });
    heading.append(element("h3", { text: replyTo ? `${replyTo.authorName}님에게 답글` : "댓글 남기기" }));
    if (replyTo) {
      const cancel = element("button", { className: "comment-form-cancel", text: "답글 취소", attrs: { type: "button" } });
      cancel.addEventListener("click", () => {
        replyTo = null;
        formOpen = false;
        render();
      });
      heading.append(cancel);
    }
    form.append(heading);
    form.append(element("p", {
      className: "comment-form-note",
      text: "댓글은 관리자 승인 후 공개됩니다. HTML은 실행되지 않고 문자로 표시됩니다.",
      attrs: { id: "comment-form-note" },
    }));

    const bodyField = element("div", { className: "comment-field comment-body-field" });
    const bodyLabelRow = element("div", { className: "comment-label-row" });
    bodyLabelRow.append(element("label", { text: "댓글", attrs: { for: "comment-body" } }));
    const counter = element("span", { className: "comment-counter", text: `${draft.body.length} / 4000` });
    bodyLabelRow.append(counter);
    const editorTabs = element("div", { className: "comment-editor-tabs", attrs: { "aria-label": "댓글 편집 화면" } });
    const writeButton = element("button", { text: "작성", attrs: { type: "button", "aria-pressed": "true" } });
    const previewButton = element("button", { text: "미리보기", attrs: { type: "button", "aria-pressed": "false" } });
    editorTabs.append(writeButton, previewButton);
    const body = element("textarea", {
      attrs: {
        id: "comment-body",
        name: "body",
        maxlength: "4000",
        required: "",
        rows: "7",
        "aria-describedby": "comment-form-note comment-markdown-help",
      },
    });
    body.value = draft.body;
    const preview = element("div", {
      className: "comment-preview",
      attrs: { hidden: "", "aria-label": "댓글 미리보기" },
    });
    const previewContent = element("div", { className: "comment-body comment-body-markdown" });
    preview.append(element("p", { className: "comment-preview-title", text: "미리보기" }), previewContent);
    const updatePreview = () => {
      previewContent.replaceChildren(draft.body ? renderMarkdown(draft.body) : element("p", { className: "comments-empty", text: "미리 볼 내용이 없습니다." }));
    };
    const setPreview = (show) => {
      preview.hidden = !show;
      writeButton.setAttribute("aria-pressed", String(!show));
      previewButton.setAttribute("aria-pressed", String(show));
      if (show) updatePreview();
    };
    writeButton.addEventListener("click", () => { setPreview(false); body.focus(); });
    previewButton.addEventListener("click", () => setPreview(true));
    body.addEventListener("input", () => {
      draft.body = body.value;
      counter.textContent = `${draft.body.length} / 4000`;
      if (!preview.hidden) updatePreview();
    });
    bodyField.append(bodyLabelRow, editorTabs, body, preview);
    bodyField.append(element("p", {
      className: "comment-markdown-help",
      text: "Markdown: **굵게**, *기울임*, `코드`, 목록, 인용문, 링크를 사용할 수 있습니다. 이미지와 제목은 사용할 수 없습니다.",
      attrs: { id: "comment-markdown-help" },
    }));
    form.append(bodyField);

    const identity = element("div", { className: "comment-identity" });
    const nameField = element("div", { className: "comment-field" });
    const name = element("input", { attrs: { id: "comment-author-name", name: "authorName", maxlength: "40", required: "", autocomplete: "name" } });
    name.value = draft.authorName;
    name.addEventListener("input", () => { draft.authorName = name.value; });
    nameField.append(element("label", { text: "이름", attrs: { for: "comment-author-name" } }), name);
    const emailField = element("div", { className: "comment-field" });
    const email = element("input", { attrs: { id: "comment-email", name: "email", type: "email", maxlength: "254", autocomplete: "email" } });
    email.value = draft.email;
    email.addEventListener("input", () => { draft.email = email.value; });
    emailField.append(element("label", { text: "이메일 (선택·비공개)", attrs: { for: "comment-email" } }), email);
    const passwordField = element("div", { className: "comment-field comment-password-field" });
    const password = element("input", { attrs: { id: "comment-password", name: "password", type: "password", minlength: "8", maxlength: "128", required: "", autocomplete: "new-password", "aria-describedby": "comment-password-help" } });
    password.value = draft.password;
    password.addEventListener("input", () => { draft.password = password.value; });
    passwordField.append(
      element("label", { text: "삭제 비밀번호", attrs: { for: "comment-password" } }),
      password,
      element("p", { className: "comment-password-help", text: "8자 이상 입력하세요. 댓글 삭제 때 필요하며 잊으면 복구할 수 없습니다.", attrs: { id: "comment-password-help" } }),
    );
    identity.append(nameField, emailField, passwordField);
    form.append(identity);

    const status = element("p", { className: "comment-status", attrs: { "aria-live": "polite" } });
    const footer = element("div", { className: "comment-form-footer" });
    const humanCheck = element("div", { className: "comment-turnstile" });
    if (siteKey) footer.append(humanCheck);
    const submit = element("button", { className: "comment-submit", text: "댓글 등록", attrs: { type: "submit" } });
    submit.disabled = Boolean(siteKey);
    footer.append(submit);
    form.append(status, footer);
    if (siteKey) status.textContent = "사람 인증을 준비하는 중입니다.";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        setPreview(false);
        form.reportValidity();
        return;
      }
      if (siteKey && !turnstileToken) {
        status.textContent = "사람 인증을 완료해 주세요.";
        return;
      }
      submit.disabled = true;
      status.textContent = "댓글을 등록하는 중입니다.";
      try {
        const deleteCredential = await deriveDeleteCredential(password.value);
        const response = await fetch(`${apiUrl}/api/comments`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            postId,
            parentId: replyTo?.id,
            authorName: name.value,
            email: email.value,
            ...deleteCredential,
            body: body.value,
            turnstileToken,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "댓글 등록에 실패했습니다.");
        draft.authorName = "";
        draft.email = "";
        draft.password = "";
        draft.body = "";
        replyTo = null;
        formOpen = false;
        notice = result.message;
        render();
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
          action: "turnstile-spin-v2",
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
      // renderForm()이 반환된 뒤 호출자가 폼을 DOM에 붙인 다음 위젯을 만든다.
      queueMicrotask(renderTurnstile);
    }
    return form;
  };

  const renderDeleteForm = (comment) => {
    const form = element("form", { className: "comment-delete-form", attrs: { novalidate: "" } });
    const id = `comment-delete-password-${comment.id}`;
    const password = element("input", { attrs: { id, name: "password", type: "password", minlength: "8", maxlength: "128", required: "", autocomplete: "current-password" } });
    const status = element("p", { className: "comment-status", attrs: { "aria-live": "polite" } });
    const buttons = element("div", { className: "comment-delete-buttons" });
    const submit = element("button", { className: "comment-delete-submit", text: "삭제 확인", attrs: { type: "submit" } });
    const cancel = element("button", { className: "comment-delete-cancel", text: "취소", attrs: { type: "button" } });
    cancel.addEventListener("click", () => {
      deleteTarget = null;
      render();
    });
    buttons.append(submit, cancel);
    form.append(
      element("label", { text: "댓글을 삭제하려면 등록할 때 정한 비밀번호를 입력하세요.", attrs: { for: id } }),
      password,
      buttons,
      status,
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      submit.disabled = true;
      status.textContent = "댓글을 삭제하는 중입니다.";
      try {
        const { passwordProof } = await deriveDeleteCredential(password.value, comment.deleteCredential);
        const response = await fetch(`${apiUrl}/api/comments/${encodeURIComponent(comment.id)}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ passwordProof }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "댓글 삭제에 실패했습니다.");
        Object.assign(comment, {
          authorName: "삭제된 댓글",
          body: "작성자가 삭제한 댓글입니다.",
          bodyFormat: "plain",
          deleted: true,
          deleteCredential: null,
        });
        deleteTarget = null;
        notice = result.message;
        render();
      } catch (error) {
        submit.disabled = false;
        status.textContent = error.message;
      }
    });
    queueMicrotask(() => password.focus());
    return form;
  };

  const renderComment = (comment, byParent) => {
    const item = element("li", { className: "comment-item" });
    const article = element("article", { className: `comment${comment.deleted ? " comment-deleted" : ""}`, attrs: { "data-comment-id": comment.id } });
    const header = element("header", { className: "comment-header" });
    header.append(element("strong", { text: comment.authorName }));
    header.append(element("time", { text: formatter.format(new Date(comment.createdAt)), attrs: { datetime: comment.createdAt } }));
    article.append(header, renderCommentBody(comment));
    if (!comment.deleted) {
      const actions = element("footer", { className: "comment-actions" });
      const reply = element("button", { className: "comment-reply", text: "답글 쓰기", attrs: { type: "button" } });
      reply.addEventListener("click", () => {
        notice = "";
        deleteTarget = null;
        replyTo = comment;
        formOpen = true;
        render();
        focusEditor();
      });
      actions.append(reply);
      if (comment.deleteCredential) {
        const remove = element("button", { className: "comment-delete", text: "삭제", attrs: { type: "button", "aria-expanded": String(deleteTarget === comment.id) } });
        remove.addEventListener("click", () => {
          notice = "";
          deleteTarget = deleteTarget === comment.id ? null : comment.id;
          render();
        });
        actions.append(remove);
      }
      article.append(actions);
    }
    item.append(article);
    if (deleteTarget === comment.id) item.append(renderDeleteForm(comment));
    if (formOpen && replyTo?.id === comment.id) item.append(renderForm());
    const children = byParent.get(comment.id) || [];
    if (children.length) {
      const list = element("ol", { className: "comment-replies" });
      children.forEach((child) => list.append(renderComment(child, byParent)));
      item.append(list);
    }
    return item;
  };

  const render = () => {
    removeTurnstile();
    const sectionHeader = element("div", { className: "comments-header" });
    sectionHeader.append(element("h2", { text: `댓글 ${comments.filter((comment) => !comment.deleted).length}개`, attrs: { id: "comments-title" } }));
    const write = element("button", {
      className: "comment-write",
      text: formOpen && !replyTo ? "작성 취소" : "댓글 쓰기",
      attrs: { type: "button", "aria-controls": "comment-form", "aria-expanded": String(formOpen && !replyTo) },
    });
    write.addEventListener("click", () => {
      notice = "";
      deleteTarget = null;
      if (formOpen && !replyTo) formOpen = false;
      else {
        replyTo = null;
        formOpen = true;
      }
      render();
      if (formOpen) focusEditor();
    });
    sectionHeader.append(write);
    root.replaceChildren(sectionHeader);
    if (notice) root.append(element("p", { className: "comment-status comment-status-success", text: notice, attrs: { "aria-live": "polite" } }));
    if (formOpen && !replyTo) root.append(renderForm());

    const byParent = commentTree();
    const topLevel = sortTopLevelByActivity(byParent.get("root") || [], byParent);
    if (topLevel.length) {
      const list = element("ol", { className: "comment-list", attrs: { "aria-label": "댓글 목록" } });
      topLevel.forEach((comment) => list.append(renderComment(comment, byParent)));
      root.append(list);
    } else {
      root.append(element("p", { className: "comments-empty", text: "첫 댓글을 남겨 보세요." }));
    }
  };

  fetch(`${apiUrl}/api/comments?postId=${encodeURIComponent(postId)}`)
    .then(async (response) => {
      if (!response.ok) throw new Error("댓글을 불러오지 못했습니다.");
      return response.json();
    })
    .then((result) => {
      comments = result.comments;
      render();
    })
    .catch((error) => {
      root.replaceChildren(
        element("h2", { text: "댓글", attrs: { id: "comments-title" } }),
        element("p", { className: "comments-error", text: error.message }),
      );
    });
}
