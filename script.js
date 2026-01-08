const API_BASE = "https://wy28p8c6f7.execute-api.us-east-2.amazonaws.com/prod";

async function subirDocumento() {
  const input = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!input.files.length) {
    alert("Selecciona un archivo");
    return;
  }

  const file = input.files[0];
  status.innerText = "⏳ Solicitando autorización...";

  // 1️⃣ Pedir URL prefirmada
  const presignResponse = await fetch(`${API_BASE}/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type
    })
  });

  const presignData = await presignResponse.json();

  status.innerText = "📤 Subiendo documento...";

  // 2️⃣ Subir a S3
  await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type
    },
    body: file
  });

  status.innerText = "⏳ Validando documento...";

  // 3️⃣ Polling
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
      if (data.status === "PENDIENTE") {
        return;
    }

    clearInterval(interval);

    if (data.status === "APROBADO") {
      status.innerText = "✅ Documento APROBADO";
    } else if (data.status === "RECHAZADO") {
      status.innerText =
        "❌ Documento RECHAZADO:\n" + (data.errors || []).join("\n");
    } else {
      status.innerText = "⚠️ Estado desconocido";
    }
  }, 3000);
}
