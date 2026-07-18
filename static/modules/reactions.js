const root = document.querySelector("#post-reactions");

if (root) {
  const apiUrl = root.dataset.apiUrl.replace(/\/$/, "");
  const postId = root.dataset.postId;
  const storageKey = "abcbox-post-reactions-v1";
  const reactionLabels = { up: "좋아요", down: "아쉬워요" };
  const reactionIcons = { up: "👍", down: "👎" };
  const tokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const readStorage = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        voterToken: tokenPattern.test(saved.voterToken || "") ? saved.voterToken : crypto.randomUUID(),
        selections: saved.selections && typeof saved.selections === "object" && !Array.isArray(saved.selections) ? { ...saved.selections } : {},
      };
    } catch {
      return { voterToken: crypto.randomUUID(), selections: {} };
    }
  };

  const storage = readStorage();
  try { localStorage.setItem(storageKey, JSON.stringify(storage)); } catch { /* 메모리 안에서는 같은 토큰을 유지한다. */ }
  let selection = ["up", "down"].includes(storage.selections[postId]) ? storage.selections[postId] : null;
  let counts = { up: 0, down: 0 };
  let busy = false;
  let message = "";
  let error = false;

  const saveSelection = () => {
    if (selection) storage.selections[postId] = selection;
    else delete storage.selections[postId];
    try { localStorage.setItem(storageKey, JSON.stringify(storage)); } catch { /* 현재 페이지에서는 계속 동작한다. */ }
  };

  const element = (tag, options = {}) => {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text != null) node.textContent = options.text;
    if (options.attrs) Object.entries(options.attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const normalizedCounts = (value = {}) => ({
    up: Math.max(0, Number(value.up) || 0),
    down: Math.max(0, Number(value.down) || 0),
  });

  const updateSelection = async (reaction) => {
    if (busy) return;
    const previousSelection = selection;
    const previousCounts = { ...counts };
    const nextSelection = selection === reaction ? null : reaction;
    if (selection) counts[selection] = Math.max(0, counts[selection] - 1);
    if (nextSelection) counts[nextSelection] += 1;
    selection = nextSelection;
    busy = true;
    message = "반응을 저장하는 중입니다.";
    error = false;
    render();

    try {
      const response = await fetch(`${apiUrl}/api/reactions`, {
        method: "PUT",
        credentials: "omit",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId, voterToken: storage.voterToken, reaction: selection }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "반응을 저장하지 못했습니다.");
      selection = result.reaction;
      counts = normalizedCounts(result.counts);
      saveSelection();
      message = selection ? `${reactionLabels[selection]} 반응을 남겼습니다.` : "반응을 취소했습니다.";
    } catch (requestError) {
      selection = previousSelection;
      counts = previousCounts;
      message = requestError.message;
      error = true;
    } finally {
      busy = false;
      render();
    }
  };

  const reactionButton = (reaction) => {
    const button = element("button", {
      className: `reaction-button reaction-${reaction}`,
      attrs: {
        type: "button",
        "aria-pressed": String(selection === reaction),
        "aria-label": `${reactionLabels[reaction]} ${counts[reaction]}개`,
      },
    });
    button.disabled = busy;
    button.append(
      element("span", { className: "reaction-icon", text: reactionIcons[reaction], attrs: { "aria-hidden": "true" } }),
      element("span", { className: "reaction-label", text: reactionLabels[reaction] }),
      element("span", { className: "reaction-count", text: counts[reaction].toLocaleString() }),
    );
    button.addEventListener("click", () => { void updateSelection(reaction); });
    return button;
  };

  function render() {
    const heading = element("h2", { text: "이 글은 어땠나요?", attrs: { id: "post-reactions-title" } });
    const buttons = element("div", { className: "reaction-buttons", attrs: { "aria-label": "글 반응" } });
    buttons.append(reactionButton("up"), reactionButton("down"));
    const status = element("p", {
      className: `reaction-status${error ? " reaction-status-error" : ""}`,
      text: message,
      attrs: { "aria-live": "polite" },
    });
    root.setAttribute("aria-busy", String(busy));
    root.replaceChildren(heading, buttons, status);
  }

  fetch(`${apiUrl}/api/reactions?postId=${encodeURIComponent(postId)}`, { cache: "no-store", credentials: "omit" })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "반응을 불러오지 못했습니다.");
      return result;
    })
    .then((result) => {
      counts = normalizedCounts(result.counts);
      message = "";
      render();
    })
    .catch((requestError) => {
      root.setAttribute("aria-busy", "false");
      root.replaceChildren(
        element("h2", { text: "이 글은 어땠나요?", attrs: { id: "post-reactions-title" } }),
        element("p", { className: "reaction-status reaction-status-error", text: requestError.message, attrs: { "aria-live": "polite" } }),
      );
    });
}
