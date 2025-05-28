// // parallax.js
// export function setupParallax() {
//     const burjkhalifa = document.getElementById("burjkhalifa");
//     const stars = document.getElementById("stars");
  
//     window.addEventListener("scroll", () => {
//       let value = window.scrollY;
//       if (burjkhalifa) burjkhalifa.style.top = value * 1 + "px";
//       if (stars) stars.style.top = value * 1 + "px";
//     });
//   }

  // Charts/parallax.js
export function setupParallax() {
  const burjkhalifa = document.getElementById("burjkhalifa");
  const stars = document.getElementById("stars");

  if (!burjkhalifa || !stars) return;

  window.addEventListener("scroll", () => {
    const value = window.scrollY;
    burjkhalifa.style.top = value * 0.8 + "px";
    stars.style.top = value * 0.5 + "px";
  });
}