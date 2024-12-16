// Base URLs for APIs
const REST_API_BASE = "http://localhost:8087/files"; // REST API - api gateway
const GRAPHQL_API_URL = "http://localhost:8082/graphql"; // GraphQL API

// DOM elements
const uploadForm = document.getElementById("upload-form");
const fileInput = document.getElementById("file");
const userInput = document.getElementById("userId");
const uploadResponse = document.getElementById("upload-response");
const queryButton = document.getElementById("query-button");
const ownerInput = document.getElementById("owner");
const metadataResult = document.getElementById("metadata-result");

// file upload
uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const userId = userInput.value.trim();

    if (!file || !userId) {
        uploadResponse.innerText = "Please provide a valid file and user ID.";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    try {
        const response = await fetch(`${REST_API_BASE}/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            uploadResponse.innerText = result.message || "File uploaded successfully!";
        } else {
            const textResponse = await response.text();
            uploadResponse.innerText = textResponse || "File uploaded successfully!";
        }
    } catch (error) {
        uploadResponse.innerText = `Error uploading file: ${error.message}`;
        console.error("Upload error:", error);
    }
});

// metadata querying
queryButton.addEventListener("click", async () => {
    const owner = ownerInput.value.trim();

    if (!owner) {
        metadataResult.innerText = "Please enter an owner name.";
        return;
    }

    const query = {
        query: `
            query GetFilesByOwner($owner: String!) {
                getFilesByOwner(owner: $owner) {
                    id
                    fileName
                    fileSize
                    owner
                    uploadDate
                }
            }
        `,
        variables: {
            owner: owner
        }
    };

    try {
        const response = await fetch(GRAPHQL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(query),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        displayMetadata(result.data.getFilesByOwner || []);
    } catch (error) {
        metadataResult.innerText = `Error fetching metadata: ${error.message}`;
        console.error("Query error:", error);
    }
});

// metadata results
function displayMetadata(metadataList) {
    metadataResult.innerHTML = "";

    if (metadataList.length === 0) {
        metadataResult.innerText = "No metadata found for this owner.";
        return;
    }

    const container = document.createElement("div");
    container.className = "metadata-grid";

    metadataList.forEach((metadata) => {
        const div = document.createElement("div");
        div.className = "metadata-item";
        div.innerHTML = `
            <p><strong>ID:</strong> ${metadata.id}</p>
            <p><strong>File Name:</strong> ${metadata.fileName}</p>
            <p><strong>File Size:</strong> ${formatFileSize(metadata.fileSize)}</p>
            <p><strong>Owner:</strong> ${metadata.owner}</p>
            <p><strong>Upload Date:</strong> ${formatDate(metadata.uploadDate)}</p>
        `;
        container.appendChild(div);
    });

    metadataResult.appendChild(container);
}

// format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}