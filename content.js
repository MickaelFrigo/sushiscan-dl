const browserAPI = chrome || browser;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const imagesUrl = async () => {
    let ans = [];
    let imgs = document.getElementsByClassName("ts-main-image");
    let url = imgs[0].src;
    let name = url.split("/").pop().split("-")[0];

    for (let i = 0; i < imgs.length; i++) {
        ans.push(imgs[i].src);
    }

    return { name: name, urls: ans };
};
const loadImage = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve({ success: true, img });
        img.onerror = () => resolve({ success: false, url });
        img.src = url;
    });
};
const download = async () => {
    try {
        const downloadButton = document.querySelector('.download-button');
        downloadButton.innerHTML = "Downloading...";
        downloadButton.style.backgroundColor = "#cccccc";
        downloadButton.style.cursor = "wait";

        console.log("Starting download...");
        const { name, urls } = await imagesUrl();
        console.log("URLs retrieved:", urls);

        if (typeof jspdf === 'undefined') {
            throw new Error("jsPDF is not loaded");
        }

        const results = await Promise.all(urls.map(url => loadImage(url)));
        const failedImages = results.filter(r => !r.success);

        if (failedImages.length > 0) {
            const skipConfirm = confirm(`Failed to load ${failedImages.length} images. Do you want to continue without these images?`);
            if (!skipConfirm) {
                throw new Error(`Failed to load images: ${failedImages.map(f => f.url).join(', ')}`);
            }
        }

        const successfulImages = results.filter(r => r.success).map(r => r.img);
        console.log(`${successfulImages.length} images loaded successfully`);

        var doc = new jspdf.jsPDF({
            orientation: "p",
            unit: "px",
            compress: true,
        });
        doc = doc.deletePage(1);

        for (let i = 0; i < successfulImages.length; i++) {
            const img = successfulImages[i];
            
            // Déterminer si c'est une double page (plus large que haute)
            const isDoublePage = img.naturalWidth > img.naturalHeight;
            
            // Définir l'orientation en fonction du ratio d'aspect
            const orientation = isDoublePage ? "l" : "p";
            
            // Calculer les dimensions optimales
            const pageWidth = isDoublePage ? img.naturalWidth : img.naturalWidth;
            const pageHeight = isDoublePage ? img.naturalHeight : img.naturalHeight;
            
            // Ajouter une page avec les dimensions exactes de l'image
            doc.addPage([pageWidth, pageHeight], orientation);
            
            // Ajouter l'image à la page (sans mise à l'échelle)
            doc.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight, "", "FAST");
            console.log(`Image ${i+1} added to PDF with dimensions: ${pageWidth}x${pageHeight}, orientation: ${orientation}`);
            
            // Mettre à jour la barre de progression
            updateProgress(((i + 1) / successfulImages.length) * 100);
        }

        removeProgressBar(); // Supprime la barre de progression une fois terminé

        console.log("PDF creation completed");

        doc.save(`${name}.pdf`);

        downloadButton.innerHTML = "Downloaded!";
        downloadButton.style.backgroundColor = "#90EE90";
        downloadButton.style.cursor = "pointer";
        
        setTimeout(() => {
            downloadButton.innerHTML = "Download";
            downloadButton.style.backgroundColor = "#f0f0f0";
        }, 3000);

    } catch (error) {
        const downloadButton = document.querySelector('.download-button');
        downloadButton.innerHTML = "Error!";
        downloadButton.style.backgroundColor = "#ffcccc";
        
        setTimeout(() => {
            downloadButton.innerHTML = "Download";
            downloadButton.style.backgroundColor = "#f0f0f0";
        }, 3000);

        console.error("Download error:", error);
        alert("Download error: " + error.message);
    }
};

const isValidPage = () => {
    return window.location.href.includes('sushiscan.net') && 
           document.getElementsByClassName("ts-main-image").length > 0;
};

const addButton = () => {
    console.log("Attempting to add button...");
    
    if (!isValidPage()) {
        console.log("Invalid page for button addition");
        return;
    }

    const toolbar = document.querySelector(".chnav.ctop");
    console.log("Toolbar found:", toolbar);
    
    if (!toolbar) {
        console.log("Toolbar not found, retrying in 1 second");
        setTimeout(addButton, 1000);
        return;
    }

    if (document.querySelector('.download-button')) {
        console.log("Button already exists");
        return;
    }

    let div = document.createElement("div");
    div.className = "chap-btn download-button";
    div.style.cursor = "pointer";
    div.style.padding = "5px 10px";
    div.style.margin = "0 5px";
    div.style.backgroundColor = "#f0f0f0";
    div.style.borderRadius = "4px";
    div.style.userSelect = "none";
    div.innerHTML = "Download";

    div.addEventListener("mouseover", () => {
        div.style.backgroundColor = "#e0e0e0";
    });
    
    div.addEventListener("mouseout", () => {
        div.style.backgroundColor = "#f0f0f0";
    });
    
    div.addEventListener("click", download);

    toolbar.insertBefore(div, toolbar.firstChild);
    console.log("Button added successfully");
};

const autoScroll = async () => {
    const scrollHeight = document.body.scrollHeight;
    let currentPosition = 0;

    while (currentPosition < scrollHeight) {
        window.scrollBy(0, 1000); // Défilement plus rapide (1000px au lieu de 500px)
        currentPosition += 1000;
        await sleep(300); // Réduisez le délai à 300ms
    }

    // Attendez que toutes les images soient chargées
    const imgs = document.getElementsByClassName("ts-main-image");
    for (let img of imgs) {
        while (!img.complete) {
            await sleep(100); // Attendez que chaque image soit complètement chargée
        }
    }

    window.scrollTo(0, 0); // Retournez en haut de la page
    console.log("Auto-scroll completed. All images should be loaded.");
};

const observer = new MutationObserver((mutations, obs) => {
    if (isValidPage()) {
        addButton();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log("Initializing script...");
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
} else {
    addButton();
}

const updateProgress = (percentage) => {
    let progressBar = document.querySelector('.progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.position = 'fixed';
        progressBar.style.top = '0';
        progressBar.style.left = '0';
        progressBar.style.width = '0%';
        progressBar.style.height = '5px';
        progressBar.style.backgroundColor = '#4caf50';
        document.body.appendChild(progressBar);
    }
    progressBar.style.width = `${percentage}%`;
};

const removeProgressBar = () => {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.remove();
    }
};
