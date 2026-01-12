const API_BASE = "https://wy28p8c6f7.execute-api.us-east-2.amazonaws.com/prod";

/* =========================
   VALIDADOR DE DOCUMENTOS
   ========================= */

async function subirDocumento() {
  const input = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!input.files.length) {
    alert("Selecciona un archivo");
    return;
  }

  const file = input.files[0];
  status.innerText = "⏳ Solicitando autorización...";

  const presignResponse = await fetch(`${API_BASE}/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type
    })
  });

  const presignData = await presignResponse.json();

  status.innerText = "📤 Subiendo documento...";

  await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file
  });

  status.innerText = "⏳ Validando documento...";

  esperarResultado(presignData.documentId);
}

async function esperarResultado(documentId) {
  const status = document.getElementById("status");

  const interval = setInterval(async () => {
    const response = await fetch(
      `${API_BASE}/status?documentId=${encodeURIComponent(documentId)}`
    );

    const data = await response.json();

    status.innerText = `⏳ Estado actual: ${data.status}`;

    if (data.status === "PENDIENTE") return;

    clearInterval(interval);

    if (data.status === "APROBADO") {
      status.innerText = "✅ Documento APROBADO";
    } else if (data.status === "RECHAZADO") {
      status.innerText =
        "❌ Documento RECHAZADO:\n" + (data.errors || []).join("\n");
    } else {
      status.innerText = "⚠️ Estado desconocido";
    }
  }, 1500);
}

/* =========================
   TRANSCRIPCIÓN DE FACTURAS
   ========================= */

async function procesarFactura() {
  const input = document.getElementById("invoiceInput");
  const status = document.getElementById("invoiceStatus");

  if (!input.files.length) {
    alert("Selecciona un PDF");
    return;
  }

  const file = input.files[0];
  status.innerText = "📤 Subiendo factura...";

  // 1️⃣ Presigned URL
  const presign = await fetch(`${API_BASE}/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type
    })
  }).then(r => r.json());

  // 2️⃣ Subir PDF
  await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file
  });

  status.innerText = "🧠 Procesando factura...";

  // 3️⃣ Llamar Lambda transcriptor
  const result = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: presign.documentId
    })
  }).then(r => r.json());

  status.innerHTML = `
    ✅ Factura procesada<br>
    <a href="${result.downloadUrl}" target="_blank">⬇️ Descargar Excel</a>
  `;
}
