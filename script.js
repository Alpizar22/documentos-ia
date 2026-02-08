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
        status.innerText =
          "❌ Documento RECHAZADO:\n" + (data.errors || []).join("\n");
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

  if (!input.files.length) {
    alert("Selecciona un PDF");
    return;
  }

  const file = input.files[0];

  try {
    status.innerText = "📤 Subiendo factura...";

    // 1️⃣ Obtener Presigned URL
    const presignResponse = await fetch(`${API_BASE}/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type
      })
    });
    const presign = await presignResponse.json();

    // 2️⃣ Subir PDF a S3
    await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file
    });

    status.innerText = "🧠 Procesando factura...";

    // 3️⃣ Llamar Lambda transcriptor (la que devuelve el Excel)
    const response = await fetch(`${API_BASE}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: presign.documentId
      })
    });

    const result = await response.json();
    console.log("Respuesta de AWS:", result);

    // 4️⃣ Mostrar enlace de descarga
    // Usamos result.downloadUrl porque así lo definiste en el return de tu Python
    if (result.downloadUrl) {
      status.innerHTML = `
        ✅ Factura procesada<br>
        <a href="${result.downloadUrl}" target="_blank" style="color: blue; font-weight: bold; text-decoration: underline;">⬇️ Descargar Excel</a>
      `;
    } else {
      status.innerText = "❌ Error: No se recibió el enlace de descarga.";
      console.error("Resultado sin URL:", result);
    }
    
  } catch (error) {
    console.error("Error procesando factura:", error);
    status.innerText = "❌ Ocurrió un error en el proceso.";
  }
}
