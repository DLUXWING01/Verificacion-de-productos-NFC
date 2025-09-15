// app.js

// Estas variables se llenarán automáticamente con los valores de Vercel
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Productos'; // Cambia por el nombre exacto de tu tabla en Airtable

// Variable para guardar el número de serie leído del NFC
let serialNumberLeido = '';

// Función principal que se ejecuta al tocar el NFC
async function leerNFC() {
    try {
        // Intenta conectarse al lector NFC del teléfono
        const ndef = new NDEFReader();
        await ndef.scan();

        // Cuando se detecte una etiqueta NFC, esta función se ejecuta
        ndef.onreading = event => {
            const decoder = new TextDecoder();
            // Decodifica el mensaje guardado en el chip NFC
            // ASUNCIÓN: El chip guarda SOLO el número de serie como texto
            serialNumberLeido = decoder.decode(event.message.records[0].data);
            
            // Muestra el número leído en pantalla (para debug)
            document.getElementById('serialNumber').innerText = `Serial leído: ${serialNumberLeido}`;
            
            // Llama a la función que verifica en Airtable
            verificarProducto(serialNumberLeido);
        }
    } catch (error) {
        // Si hay error (ej: navegador no compatible), lo mostramos
        console.error("Error NFC:", error);
        document.getElementById('resultado').innerText = "Error: NFC no soportado o desactivado.";
    }
}

// Función que consulta Airtable usando las variables de entorno
async function verificarProducto(serialNumber) {
    // Construye la URL de la API de Airtable con tu BASE_ID y TABLE_NAME
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={Serial Number}='${serialNumber}'`;
    // NOTA: Asegúrate que 'Serial Number' coincida exactamente con el nombre de tu campo en Airtable

    try {
        // Hace la petición a la API de Airtable con la API Key en los headers
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        const data = await response.json();

        // Si hay registros en la respuesta, el producto es original
        if (data.records.length > 0) {
            document.getElementById('resultado').innerText = "✅ PRODUCTO ORIGINAL";
            document.getElementById('resultado').style.color = 'green';
        } else {
            document.getElementById('resultado').innerText = "❌ PRODUCTO NO VERIFICADO (Posible falsificación)";
            document.getElementById('resultado').style.color = 'red';
        }
    } catch (error) {
        console.error("Error fetching Airtable:", error);
        document.getElementById('resultado').innerText = "Error de conexión. Intenta de nuevo.";
    }
}

// Ejecuta la función para leer NFC cuando se cargue la página
document.addEventListener('DOMContentLoaded', leerNFC);
