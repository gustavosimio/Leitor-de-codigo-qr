// Adicione jsQR via CDN:
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
document.head.appendChild(script);

document.getElementById('start').onclick = async () => {
  const video = document.createElement('video');
  video.setAttribute('playsinline', true);
  video.style.width = "100%";
  const canvas = document.createElement('canvas');
  const reader = document.getElementById('reader');
  reader.innerHTML = '';
  reader.appendChild(video);

  const constraints = { video: { facingMode: "environment" } };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  await video.play();

  function scan() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          // Parar vídeo
          stream.getTracks().forEach(track => track.stop());
          reader.innerHTML = '';
          showResult(code.data);
          return;
        }
      }
    }
    requestAnimationFrame(scan);
  }
  scan();
};

function showResult(data) {
  const output = document.getElementById('output');
  output.innerHTML =
    `<div class="result">
      <strong>QR Lido:</strong> ${data}
      <br>
      <button id="apiBtn">Buscar Livro por ISBN</button>
    </div>`;
  document.getElementById('apiBtn').onclick = () => fetchBook(data);
}

async function fetchBook(qrContent) {
  const isbn = qrContent.replace(/[^0-9X]/g, "");
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url);
  const data = await res.json();
  const book = data[`ISBN:${isbn}`];
  const output = document.getElementById('output');
  if (book) {
    output.innerHTML +=
      `<div class="book">
        <h2>${book.title}</h2>
        <p>Autor: ${(book.authors||[]).map(a=>a.name).join(', ')}</p>
        <img src="${book.cover?.medium||''}" alt="Livro">
      </div>`;
  } else {
    output.innerHTML += `<div class="book">Livro não encontrado!</div>`;
  }
}