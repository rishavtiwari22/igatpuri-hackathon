const handleComparison = async (AIGeneratedimg, selectedImage) => {
    console.log("Comparison inputs:", {
        AI: AIGeneratedimg,
        AI_type: typeof AIGeneratedimg,
        Target: selectedImage,
        Target_type: typeof selectedImage
    });

    if (!AIGeneratedimg || !selectedImage) {
        alert("Please generate and select an image first");
        return;
    }

    try {
        const formData = new FormData();
        
        // Handle target image
        let targetBlob;
        if (selectedImage instanceof File || selectedImage instanceof Blob) {
            targetBlob = selectedImage;
            console.log("Target is File/Blob");
        } else if (typeof selectedImage === 'string') {
            console.log("Target is string, fetching:", selectedImage.substring(0, 100));
            const response = await fetch(selectedImage);
            if (!response.ok) throw new Error(`Target fetch failed: ${response.status}`);
            targetBlob = await response.blob();
            console.log("Target blob created:", targetBlob.size, "bytes");
        } else {
            console.error("Invalid target format:", selectedImage);
            throw new Error("Invalid selected image format");
        }
        formData.append("target_img", targetBlob, "target.png");
        
        // Handle generated image
        if (typeof AIGeneratedimg === 'string') {
            if (AIGeneratedimg.startsWith('http')) {
                console.log("AI image is HTTP URL:", AIGeneratedimg);
                formData.append("generated_img", AIGeneratedimg);
            } else if (AIGeneratedimg.startsWith('data:')) {
                console.log("AI image is data URL");
                const response = await fetch(AIGeneratedimg);
                const blob = await response.blob();
                formData.append("generated_img", blob, "generated.png");
            } else {
                console.error("AI image string doesn't start with http or data:", AIGeneratedimg.substring(0, 100));
                throw new Error("Invalid AI generated image format - not HTTP or data URL");
            }
        } else if (AIGeneratedimg instanceof File || AIGeneratedimg instanceof Blob) {
            console.log("AI image is File/Blob");
            formData.append("generated_img", AIGeneratedimg, "generated.png");
        } else {
            console.error("Unknown AI image type:", typeof AIGeneratedimg, AIGeneratedimg);
            throw new Error("Invalid AI generated image format");
        }

        console.log("Sending request to backend...");
        const res = await fetch("https://difussion-engine.onrender.com/game/comparison", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Backend error:", res.status, errorText);
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