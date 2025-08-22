// Comparison_req.js

// Compare two images (AI-generated + local asset)
    const handleComparison = async (AIGeneratedimg, selectedImage) => {
    if (!AIGeneratedimg || !selectedImage) {
        alert("Please generate and select an image first");
        return;
    }

    const formData = new FormData();
    formData.append("generated_img", AIGeneratedimg, "generated.png");
    formData.append("target_img", selectedImage, "target.png");
    console.log(formData)
    try {
        const res = await fetch("http://127.0.0.1:8000/game/comparison", {
        method: "POST",
        body: formData,
        });

        // Must await JSON, not return raw res
        const data = await res.json();
        console.log("Comparison result:", data);
        return data;
    } catch (err) {
        console.error("Error comparing:", err);
        throw err;
    }
};

export default handleComparison;
