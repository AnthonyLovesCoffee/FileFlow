// Base URLs for APIs
const REST_API_BASE = "http://localhost:8081/files"; // REST API
const GRAPHQL_API_URL = "http://localhost:8082/graphql"; // GraphQL API

// Handle file upload
document.getElementById("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("file");
    const userInput = document.getElementById("userId")

    const file = fileInput.files[0];
    const userId = userInput.value.trim();

    if (!file || !userId) {
        document.getElementById("upload-response").innerText = "Please provide a valid file and user ID.";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId)

    try {
        const response = await fetch(`${REST_API_BASE}/upload`, {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        document.getElementById("upload-response").innerText = result.message || "File uploaded successfully!";
    } catch (error) {
        document.getElementById("upload-response").innerText = "Error uploading file!";
        console.error(error);
    }
});

// metadata querying
document.getElementById("query-button").addEventListener("click", async () => {
    const owner = document.getElementById("owner").value.trim();
    if (!owner) {
        alert("Please enter an owner name.");
        return;
    }

    const query = {
        query: `query { getFilesByOwner(owner: "${owner}") { id fileName fileSize owner uploadDate } }`
    };

    try {
        const response = await fetch(GRAPHQL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(query),
        });
        const result = await response.json();
        displayMetadata(result.data.getFilesByOwner || []);
    } catch (error) {
        document.getElementById("metadata-result").innerText = "Error fetching metadata!";
        console.error(error);
    }
});

// metadata results
function displayMetadata(metadataList) {
    const resultDiv = document.getElementById("metadata-result");
    resultDiv.innerHTML = ""; // Clear previous results

    if (metadataList.length === 0) {
        resultDiv.innerText = "No metadata found for this owner.";
        return;
    }

    metadataList.forEach((metadata) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>ID:</strong> ${metadata.id}</p>
            <p><strong>File Name:</strong> ${metadata.fileName}</p>
            <p><strong>File Size:</strong> ${metadata.fileSize} bytes</p>
            <p><strong>Owner:</strong> ${metadata.owner}</p>
            <p><strong>Upload Date:</strong> ${metadata.uploadDate}</p>
        `;
        div.style.marginBottom = "10px";
        div.style.padding = "10px";
        div.style.border = "1px solid #ccc";
        div.style.borderRadius = "5px";
        resultDiv.appendChild(div);
    });
}
