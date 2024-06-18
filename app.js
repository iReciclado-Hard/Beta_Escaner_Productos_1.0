document.addEventListener('DOMContentLoaded', () => {
    const codeReader = new ZXing.BrowserQRCodeReader();
    const videoElement = document.getElementById('video-preview');
    const startScanButton = document.getElementById('startScan');
    const stopScanButton = document.getElementById('stopScan');
    const cameraSelect = document.getElementById('cameraSelect');

    let scanning = false;

    // Función para obtener y listar las cámaras disponibles
    codeReader.listVideoInputDevices()
        .then(videoInputDevices => {
            videoInputDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Cámara ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Intentar seleccionar automáticamente la cámara trasera si está disponible
            const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment'));
            if (backCamera) {
                cameraSelect.value = backCamera.deviceId;
            }
        })
        .catch(err => console.error('Error al obtener las cámaras:', err));

    // Función para iniciar el escaneo
    startScanButton.addEventListener('click', () => {
        if (!scanning) {
            const selectedDeviceId = cameraSelect.value;
            codeReader.decodeFromVideoDevice(selectedDeviceId, 'video-preview', (result, err) => {
                if (result) {
                    console.log(result.text);
                    findProductData(result.text).then(productData => displayProductData(productData));
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Error al escanear el código:', err);
                }
            });
            scanning = true;
        }
    });

    // Función para detener el escaneo
    stopScanButton.addEventListener('click', () => {
        if (scanning) {
            codeReader.reset();
            scanning = false;
            document.getElementById('productInfo').innerHTML = ''; // Limpiar la información del producto
        }
    });
});

// Función para obtener datos de Google Sheets
async function fetchSheetData() {
    const sheetId = '1OyOanAl_4iX9iOZcAjdbkpOZ4NdeU20dgicUSuxxwds'; // Reemplaza con el ID de tu hoja de Google
    const sheetName = 'CodigoBarras'; // Reemplaza con el nombre de la hoja
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

        if (rowData['BarCode'] === code) { // Busca en la columna "Código"
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
