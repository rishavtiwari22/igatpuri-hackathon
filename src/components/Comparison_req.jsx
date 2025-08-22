const handleComparison = async (AIGeneratedimg, selectedImage) => {
    if (!AIGeneratedimg || !selectedImage) {
        alert("Please generate and select an image first");
        return;
    }

    try {
        const formData = new FormData();
        
        // Handle target image - always convert to blob
        let targetBlob;
        if (selectedImage instanceof File || selectedImage instanceof Blob) {
            targetBlob = selectedImage;
        } else if (typeof selectedImage === 'string') {
            const response = await fetch(selectedImage);
            targetBlob = await response.blob();
        } else {
            throw new Error("Invalid selected image format");
        }
        formData.append("target_img", targetBlob, "target.png");
        
        // Handle generated image
        if (typeof AIGeneratedimg === 'string' && AIGeneratedimg.startsWith('http')) {
            formData.append("generated_img", AIGeneratedimg);
        } else if (AIGeneratedimg instanceof File || AIGeneratedimg instanceof Blob) {
            formData.append("generated_img", AIGeneratedimg, "generated.png");
        } else if (typeof AIGeneratedimg === 'string' && AIGeneratedimg.startsWith('data:')) {
            const response = await fetch(AIGeneratedimg);
            const blob = await response.blob();
            formData.append("generated_img", blob, "generated.png");
        } else {
            throw new Error("Invalid AI generated image format");
        }

        console.log("Sending request to backend...");
        const res = await fetch("http://127.0.0.1:8000/game/comparison", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Backend error! status: ${res.status}, message: ${errorText}`);
        }

        const data = await res.json();
        console.log("Comparison result:", data);
        return data;
    } catch (err) {
        console.error("Error comparing:", err);
        alert(`Comparison failed: ${err.message}`);
        throw err;
    }
};

export default handleComparison