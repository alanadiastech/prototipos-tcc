const MAX_USAGE_TIME = 8 * 60 * 1000;
const BLOCK_KEY = "blockedUntil";

const btn = document.getElementById("generateBtn");
const input = document.getElementById("promptInput");
const img = document.getElementById("generatedImage");
const placeholder = document.getElementById("imagePlaceholder");
const statusText = document.getElementById("status");
const historicoPlaceholder = document.getElementById("historicoPlaceholder");
const history = document.getElementById("history");

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzRBDUM7qDGcT1o4cKK0Qs76H787WWz96qVixWwyPmSBVn_rnE-VxWE63fcQNtuG8a5/exec";

let clickCount = 0;
let startTime = 0;
let lastPromptSource = 'typed';

function bloquearUsuario() {
  btn.disabled = true;
  btn.innerHTML = `<span>Tempo expirado</span>`;
  placeholder.style.display = "none";
  statusText.textContent = "Tempo de uso expirado (8 minutos).";

  localStorage.setItem(BLOCK_KEY, Date.now() + MAX_USAGE_TIME);

  sendData({
    prompt: "USUÁRIO BLOQUEADO POR TEMPO",
    promptSource: "system",
    clickCount,
    elapsedTime: MAX_USAGE_TIME / 1000
  });
}

function checarBloqueio() {
  const blockedUntil = localStorage.getItem(BLOCK_KEY);
  const now = Date.now();

  if (blockedUntil && now < Number(blockedUntil)) {
    bloquearUsuario();
    return true;
  }

  localStorage.removeItem(BLOCK_KEY);
  return false;
}

if (!checarBloqueio()) {
  setTimeout(() => {
    bloquearUsuario();
  }, MAX_USAGE_TIME);
}

const suggestions = document.querySelectorAll(".suggestion");
suggestions.forEach(s => {
  s.addEventListener("click", () => {
    input.value = s.textContent;
    lastPromptSource = 'suggestion';
  });
});

btn.addEventListener("click", () => {
  if (btn.disabled) return;

  const prompt = input.value.trim();
  if (!prompt) return;

  clickCount++;
  document.getElementById('clickCount')?.remove();
  startTime = Date.now();

  const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?model=flux";

  img.src = "";
  img.style.display = "none";
  placeholder.style.display = "block";
  placeholder.textContent = "Carregando...";
  statusText.textContent = "";
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span><span>Gerando...</span>`;

  const nowDate = new Date();
  const hora = nowDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  img.onload = () => {
    btn.disabled = false;
    btn.innerHTML = `<span>Gerar imagem</span>`;
    placeholder.style.display = "none";
    img.style.display = "block";
    statusText.textContent = `Imagem gerada com sucesso às ${hora}.`;

    if (historicoPlaceholder) historicoPlaceholder.style.display = "none";
    const item = document.createElement("div");
    item.className = "history-item";
    const thumb = document.createElement("img");
    thumb.src = img.src;
    thumb.alt = prompt;
    const time = document.createElement("div");
    time.className = "history-time";
    time.textContent = `Prompt: "${prompt}" | ${hora}`;
    item.appendChild(thumb);
    item.appendChild(time);
    history.prepend(item);
    let historyData = JSON.parse(localStorage.getItem("imageHistory") || "[]");
    historyData.unshift({ url: img.src, prompt, time: hora });
    localStorage.setItem("imageHistory", JSON.stringify(historyData));

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    sendData({ prompt, promptSource: lastPromptSource, clickCount, elapsedTime });
    clickCount = 0;
    lastPromptSource = 'typed';
  };

  img.onerror = () => {
    btn.disabled = false;
    btn.innerHTML = `<span>Gerar imagem</span>`;
    placeholder.textContent = "Erro ao gerar imagem.";
    statusText.textContent = "Tente novamente em instantes.";
  };

  img.src = url;
});

function loadHistory() {
  const historyData = JSON.parse(localStorage.getItem("imageHistory") || "[]");
  if (historyData.length === 0) return;
  if (historicoPlaceholder) historicoPlaceholder.style.display = "none";
  historyData.forEach(itemData => {
    const item = document.createElement("div");
    item.className = "history-item";
    const thumb = document.createElement("img");
    thumb.src = itemData.url;
    thumb.alt = itemData.prompt;
    const time = document.createElement("div");
    time.className = "history-time";
    time.textContent = `Prompt: "${itemData.prompt}" | ${itemData.time}`;
    item.appendChild(thumb);
    item.appendChild(time);
    history.appendChild(item);
  });
}
loadHistory();

function sendData(data) {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: "B",
      ...data
    })
  }).catch(e => console.error('Erro ao enviar dados:', e));
}
