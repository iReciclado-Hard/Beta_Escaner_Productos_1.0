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
    if (productData) {
        const productContainer = document.getElementById('productInfo');
        // Limpiamos el contenedor
        productContainer.innerHTML = `
            <p><strong>Nombre del Artículo:</strong> ${productData['Nombre del Artículo']}</p>
            <p><strong>Precio:</strong> ${productData['Precio']}</p>
            <p class="sugerido"><strong>Sugerido:</strong> ${productData['Sugerido']}</p>
        `;
    } else {
        alert('Producto no encontrado.');
    }
}

// Configuración de Instascan
const scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
scanner.addListener('scan', function (content) {
    console.log(content);
    findProductData(content).then(productData => displayProductData(productData));
});

Instascan.Camera.getCameras().then(function (cameras) {
    const cameraSelect = document.getElementById('cameraSelect');
    const videoElement = document.getElementById('preview');
    
    if (cameras.length > 0) {
        cameras.forEach((camera, index) => {
            // Añadir las opciones al selector de cámaras
            const option = document.createElement('option');
            option.value = index;
            option.text = camera.name || `Cámara ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        let selectedCamera = cameras[0];
        cameras.forEach(camera => {
            if (camera.name.toLowerCase().includes('back') || camera.name.toLowerCase().includes('environment')) {
                selectedCamera = camera;
            }
        });

        // Aplicar la clase .inverted si se usa la cámara trasera
        if (selectedCamera.name.toLowerCase().includes('back') || selectedCamera.name.toLowerCase().includes('environment')) {
            videoElement.classList.add('inverted');
        } else {
            videoElement.classList.remove('inverted');
        }

        scanner.start(selectedCamera);

        // Cambiar la cámara al seleccionar una diferente
        cameraSelect.addEventListener('change', function () {
            const cameraIndex = this.value;
            const selectedCamera = cameras[cameraIndex];

            // Aplicar o remover la clase .inverted
            if (selectedCamera.name.toLowerCase().includes('back') || selectedCamera.name.toLowerCase().includes('environment')) {
                videoElement.classList.add('inverted');
            } else {
                videoElement.classList.remove('inverted');
            }

            scanner.start(selectedCamera);
        });
    } else {
        console.error('No se encontraron cámaras.');
    }
}).catch(function (e) {
    console.error(e);
});
