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

  try {
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
  } catch (error) {
    console.error("Error en validador:", error);
    status.innerText = "❌ Error al subir documento.";
  }
}

async function esperarResultado(documentId) {
  const status = document.getElementById("status");

  const interval = setInterval(async () => {
    try {
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
        status.innerText = "❌ Documento RECHAZADO:\n" + (data.errors || []).join("\n");
      } else {
        status.innerText = "⚠️ Estado desconocido";
      }
    } catch (error) {
      console.error("Error consultando status:", error);
    }
  }, 1500);
}

/* =========================
   TRANSCRIPCIÓN DE FACTURAS
   ========================= */

async function procesarFactura() {
  const input = document.getElementById("invoiceInput");
  const status = document.getElementById("invoiceStatus");

  // Verificar que los elementos existan en el HTML
  if (!input || !status) {
    console.error("No se encontraron los elementos invoiceInput o invoiceStatus en el HTML");
    return;
  }

  if (!input.files.length) {
    alert("Selecciona un PDF");
    return;
  }

  const file = input.files[0];

  try {
    console.log("Iniciando proceso para:", file.name);
    status.innerText = "📤 Subiendo factura...";

    // 1️⃣ Presigned URL
    const presignResponse = await fetch(`${API_BASE}/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type
      })
    });
    
    if (!presignResponse.ok) throw new Error("Error en presign");
    const presign = await presignResponse.json();

    // 2️⃣ Subir PDF
    await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file
    });

    status.innerText = "🧠 Procesando factura...";

    // 3️⃣ Llamar Lambda transcriptor
    const response = await fetch(`${API_BASE}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: presign.documentId
      })
    });

    const result = await response.json();
    console.log("Respuesta de AWS:", result);

    if (result.downloadUrl) {
      status.innerHTML = `
        ✅ Factura procesada<br>
        <a href="${result.downloadUrl}" target="_blank" style="color: blue; font-weight: bold; text-decoration: underline;">⬇️ Descargar Excel</a>
      `;
    } else {
      status.innerText = "❌ Error: No se recibió enlace de descarga.";
    }

  } catch (error) {
    console.error("Error detallado:", error);
    status.innerText = "❌ Ocurrió un error. Revisa la consola (F12).";
  }
}
