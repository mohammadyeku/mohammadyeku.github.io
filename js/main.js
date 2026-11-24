// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Click a design image to view it full-size
const lightbox = document.querySelector(".lightbox");
const lbImg = lightbox.querySelector("img");
const lbCaption = lightbox.querySelector(".lightbox-caption");

document.querySelectorAll(".gallery .zoom").forEach((btn) => {
  btn.addEventListener("click", () => {
    const img = btn.querySelector("img");
    const caption = btn.closest("figure").querySelector("figcaption");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = caption
      ? [...caption.children].map((el) => el.textContent.trim()).join(" — ")
      : "";
    lightbox.showModal();
  });
});

lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
// Click outside the image closes it
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});
