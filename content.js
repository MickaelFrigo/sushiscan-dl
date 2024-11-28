const browserAPI = chrome || browser;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const imagesUrl = async () => {
    let ans = new Array();
    let imgs = document.getElementsByClassName("ts-main-image");
    let url = imgs[0].src;
    let name = url.split("/").pop().split("-")[0];
    if ("-001.jpg" !== url.slice(-8)) {
        throw "The first image should end with -001.jpg";
    }
    for (let i = 1; i < imgs.length + 1; i++) {
        let newUrl = url.slice(0, -7) + ("00" + i).slice(-3) + ".jpg";
        ans.push(newUrl);
    }
    return { name: name, urls: ans };
};
const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
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

        const imgs = await Promise.all(urls.map(url => loadImage(url)));
        console.log("Images loaded successfully");

        var doc = new jspdf.jsPDF({
            orientation: "p",
            unit: "px",
            format: "a4",
            compress: true,
        });
        doc = doc.deletePage(1);

        for (const img of imgs) {
            doc.addPage([img.width, img.height], "p");
            doc.addImage(img, "JPEG", 0, 0, img.width, img.height, "", "FAST");
            console.log("Image added to PDF");
        }

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
