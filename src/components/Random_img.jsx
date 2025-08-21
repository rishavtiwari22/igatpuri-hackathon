import { useState } from "react";
import image1 from "./images/car.png"
import image2 from "./images/foxes.png"
import image3 from "./images/llama.jpg"
import image4 from "./images/owl.png"
import image5 from "./images/van.jpg"

export default function RandomImage() {
  const images = [image1,image2,image3,image4,image5];

  const [selected, setSelected] = useState(null);

  function pickRandomImage() {
    const randomIndex = Math.floor(Math.random() * images.length);
    setSelected(images[randomIndex]);
  }
}