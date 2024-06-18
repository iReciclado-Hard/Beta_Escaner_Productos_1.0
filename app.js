document.addEventListener('DOMContentLoaded', () => {
    const startScanButton = document.getElementById('startScan');
    const stopScanButton = document.getElementById('stopScan');
    const videoElement = document.getElementById('video-preview');
    let scanning = false;

    // Configuración de QuaggaJS
    function initializeQuagga() {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoElement,
                constraints: {
                    facingMode: "environment" // Utilizar cámara trasera
                },
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader"] // Tipos de códigos de barras que se desean detectar
            }
        }, function(err) {
            if (err) {
                console.error('Error al inicializar Quagga:', err);
                return;
            }
            Quagga.start();
            scanning = true;
            startScanButton.style.display = 'none';
            stopScanButton.style.display = 'inline-block';
            console.log('Quagga inicializado y escaneo iniciado.');
        });

        // Manejador para cuando se detecta un código
        Quagga.onDetected((result) => {
            const code = result.codeResult.code;
            console.log('Código de barras detectado:', code);
            findProductData(code).then(productData => displayProductData(productData));
        });
    }

    // Función para detener el escaneo
    stopScanButton.addEventListener('click', () => {
        if (scanning) {
            Quagga.stop();
            scanning = false;
            startScanButton.style.display = 'inline-block';
            stopScanButton.style.display = 'none';
            videoElement.srcObject.getTracks().forEach(track => track.stop()); // Detiene el flujo de la cámara
            document.getElementById('productInfo').innerHTML = ''; // Limpiar la información del producto
            console.log('Escaneo detenido.');
        }
    });

    // Iniciar el escaneo al hacer clic en el botón
    startScanButton.addEventListener('click', () => {
        if (!scanning) {
            initializeQuagga();
        }
    });
});

// Función para obtener datos de Google Sheets
async function fetchSheetData() {
    const sheetId = '1OyOanAl_4iX9iOZcAjdbkpOZ4NdeU20dgicUSuxxwds'; // Reemplaza con el ID de tu hoja de Google
    const sheetName = 'Hoja1'; // Reemplaza con el nombre de la hoja
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=AIzaSyDm6d6BmC8Kco00EspVcmpUHIzxu0K5vG4`; // Reemplaza TU_API_KEY con tu clave de API de Google

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener los datos');
        const data = await response.json();
        return data.values; // Devuelve los valores de la hoja de cálculo
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        return null;
    }
}

// Función para encontrar datos del producto por código
async function findProductData(code) {
    const data = await fetchSheetData();
    if (!data) return null;

    const header = data[0]; // La primera fila se asume que es el encabezado de las columnas
    const rows = data.slice(1); // Las filas de datos, omitiendo el encabezado

    for (const row of rows) {
        const rowData = {};
        row.forEach((cell, index) => {
            rowData[header[index]] = cell; // Mapea las celdas de cada fila a sus respectivos nombres de columna
        });

        if (rowData['BarCode'] === code) { // Busca en la columna "Código de Barras"
            return rowData; // Devuelve la fila completa como un objeto si encuentra el código
        }
    }
    return null; // Devuelve null si no se encuentra el código
}

// Función para mostrar los datos del producto en la página
function displayProductData(productData) {
    const productContainer = document.getElementById('productInfo');
    if (productData) {
        productContainer.innerHTML = `
            <p><strong>Nombre del Artículo:</strong> ${productData['Nombre del Artículo']}</p>
            <p><strong>Precio:</strong> ${productData['Precio']}</p>
            <p class="sugerido"><strong>Sugerido:</strong> ${productData['Sugerido']}</p>
        `;
    } else {
        productContainer.innerHTML = `<p>Producto no encontrado.</p>`;
    }
}
