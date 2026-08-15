import './style.css';
import { buildingStructure, pendingApartments, isPending, isReported } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const navHome = document.getElementById('nav-home');
  const navSearch = document.getElementById('nav-search');
  const navAdmin = document.getElementById('nav-admin');
  
  const viewHome = document.getElementById('view-home');
  const viewSearch = document.getElementById('view-search');
  const viewReport = document.getElementById('view-report');
  const viewAdmin = document.getElementById('view-admin');

  function hideAllViews() {
    [viewHome, viewSearch, viewReport, viewAdmin].forEach(v => {
      v.classList.remove('active');
      v.classList.add('hidden');
    });
    [navHome, navSearch, navAdmin].forEach(n => n.classList.remove('active'));
  }

  function showHome() {
    hideAllViews();
    viewHome.classList.add('active');
    viewHome.classList.remove('hidden');
    navHome.classList.add('active');
  }

  function showSearch() {
    hideAllViews();
    viewSearch.classList.add('active');
    viewSearch.classList.remove('hidden');
    navSearch.classList.add('active');
  }

  function showAdmin() {
    hideAllViews();
    viewAdmin.classList.add('active');
    viewAdmin.classList.remove('hidden');
    navAdmin.classList.add('active');
    renderHeatmap();
  }

  function showReportForm(apt) {
    hideAllViews();
    viewReport.classList.add('active');
    viewReport.classList.remove('hidden');
    document.getElementById('form-apt-label').textContent = apt;
    document.getElementById('form-apt-hidden').value = apt;
  }

  navHome.addEventListener('click', showHome);
  navSearch.addEventListener('click', showSearch);
  navAdmin.addEventListener('click', showAdmin);
  
  document.getElementById('btn-go-search').addEventListener('click', showSearch);

  // Populate Search Select
  const searchSelect = document.getElementById('search-apartment');
  Object.keys(buildingStructure).forEach(floor => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = `Piso ${floor}`;
    buildingStructure[floor].forEach(apt => {
      const option = document.createElement('option');
      option.value = apt;
      option.textContent = `Apto ${apt}`;
      optgroup.appendChild(option);
    });
    searchSelect.appendChild(optgroup);
  });

  // Handle Search logic
  const resultReported = document.getElementById('result-reported');
  const resultPending = document.getElementById('result-pending');
  let currentSelectedApt = null;

  searchSelect.addEventListener('change', (e) => {
    currentSelectedApt = e.target.value;
    resultReported.classList.add('hidden');
    resultPending.classList.add('hidden');
    
    if (isPending(currentSelectedApt)) {
      resultPending.classList.remove('hidden');
    } else if (isReported(currentSelectedApt)) {
      resultReported.classList.remove('hidden');
    }
  });

  document.getElementById('btn-new-report').addEventListener('click', () => {
    showReportForm(currentSelectedApt);
  });

  document.getElementById('btn-update-report').addEventListener('click', () => {
    showReportForm(currentSelectedApt);
  });

  document.getElementById('btn-view-gallery').addEventListener('click', () => {
    openGallery(currentSelectedApt);
  });

  document.getElementById('btn-cancel-report').addEventListener('click', () => {
    showSearch();
  });

  // Admin Heatmap
  function renderHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    grid.innerHTML = '';
    
    // Reverse floors to show 10 at top, 2 at bottom
    const floors = Object.keys(buildingStructure).sort((a,b) => b - a);
    
    floors.forEach(floor => {
      const floorRow = document.createElement('div');
      floorRow.className = 'heatmap-row';
      
      const floorLabel = document.createElement('div');
      floorLabel.className = 'floor-label';
      floorLabel.textContent = `Piso ${floor}`;
      floorRow.appendChild(floorLabel);
      
      const aptsContainer = document.createElement('div');
      aptsContainer.className = 'apts-container';
      
      buildingStructure[floor].forEach(apt => {
        const aptBox = document.createElement('div');
        aptBox.className = `apt-box ${isPending(apt) ? 'pending' : 'reported'}`;
        aptBox.textContent = apt;
        if (!isPending(apt)) {
          aptBox.addEventListener('click', () => openGallery(apt));
        }
        aptsContainer.appendChild(aptBox);
      });
      
      floorRow.appendChild(aptsContainer);
      grid.appendChild(floorRow);
    });
  }

  // File Input preview (from previous logic)
  const fileInput = document.getElementById('media');
  const filePreview = document.getElementById('file-preview');
  const dropArea = document.getElementById('file-drop-area');

  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.remove('drag-over');
    });
  });

  dropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    fileInput.files = dt.files; 
    updateFilePreview(dt.files);
  });

  fileInput.addEventListener('change', (e) => {
    updateFilePreview(e.target.files);
  });

  function updateFilePreview(files) {
    filePreview.innerHTML = '';
    Array.from(files).forEach(file => {
      const el = document.createElement('div');
      el.className = 'file-preview-item';
      const icon = file.type.startsWith('video') ? '🎥' : '🖼️';
      el.innerHTML = `<span>${icon}</span> <span>${file.name}</span>`;
      filePreview.appendChild(el);
    });
  }

  // Form Submission
  const damageForm = document.getElementById('damage-form');
  const btnSubmit = document.querySelector('.btn-submit');
  const btnText = btnSubmit.querySelector('span');
  const spinner = btnSubmit.querySelector('.spinner');
  const successModal = document.getElementById('success-modal');

  // URL del Webhook de Google Apps Script (Reemplazar con la URL final)
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwlfWBatz2kqPNBLPom8gQwf9PYf6H9bGRLpjIzH2YUDvJezOM0A1mpU0Va217UtQGG/exec"; 

  damageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    btnSubmit.disabled = true;
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');

    const formData = new FormData(damageForm);
    const apartment = formData.get('apartment');
    const description = formData.get('description');
    const files = fileInput.files;

    try {
      if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.startsWith("http")) {
        // Real upload to Google Drive via Apps Script
        const base64Files = await Promise.all(Array.from(files).map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
              name: file.name,
              type: file.type,
              base64: e.target.result
            });
            reader.readAsDataURL(file);
          });
        }));

        const payload = {
          apartment: apartment,
          description: description,
          files: base64Files
        };

        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log("Upload result:", result);
      } else {
        // Simulación (si no hay URL configurada)
        console.warn("No hay URL de Google Script configurada. Simulando envío...");
        await new Promise(r => setTimeout(r, 2000));
      }

      // Success
      damageForm.reset();
      filePreview.innerHTML = '';
      successModal.classList.remove('hidden');

    } catch (error) {
      console.error("Error enviando el reporte:", error);
      alert("Hubo un error al enviar el reporte. Por favor intenta de nuevo.");
    } finally {
      btnSubmit.disabled = false;
      btnText.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    successModal.classList.add('hidden');
    showSearch();
  });

  // Gallery Logic
  const galleryModal = document.getElementById('gallery-modal');
  const galleryTitle = document.getElementById('gallery-title');
  const galleryLoading = document.getElementById('gallery-loading');
  const galleryContent = document.getElementById('gallery-content');
  const galleryError = document.getElementById('gallery-error');
  const galleryDescription = document.getElementById('gallery-description');
  const galleryImages = document.getElementById('gallery-images');

  document.getElementById('btn-close-gallery').addEventListener('click', () => {
    galleryModal.classList.add('hidden');
  });

  async function openGallery(apt) {
    galleryModal.classList.remove('hidden');
    galleryTitle.textContent = `Evidencia Apto ${apt}`;
    galleryLoading.classList.remove('hidden');
    galleryContent.classList.add('hidden');
    galleryError.classList.add('hidden');
    galleryImages.innerHTML = '';
    galleryDescription.textContent = '';

    try {
      // Usar la URL GET configurada para obtener datos
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?apt=${apt}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.reports.length > 0) {
        // Tomar el reporte más reciente
        const latestReport = data.reports[0];
        galleryDescription.textContent = latestReport.description;
        
        latestReport.photos.forEach(photo => {
          const img = document.createElement('img');
          img.src = photo.url;
          img.alt = photo.name;
          galleryImages.appendChild(img);
        });
        
        galleryLoading.classList.add('hidden');
        galleryContent.classList.remove('hidden');
      } else {
        throw new Error('No reports found');
      }
    } catch (error) {
      console.error(error);
      galleryLoading.classList.add('hidden');
      galleryError.classList.remove('hidden');
    }
  }

});
