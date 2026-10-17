/* SNGAMER STORE — Product gallery autoplay v1
 * Automatically cycles product detail images every 3 seconds.
 * Manual thumbnail selection remains available and restarts the timer.
 */
(function () {
  const INTERVAL_MS = 3000;
  let autoplayTimer = null;
  let currentProductId = null;

  function stopProductGalleryAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    currentProductId = null;
  }

  function getImages() {
    return Array.isArray(window.productImages)
      ? window.productImages.filter(Boolean)
      : [];
  }

  function getCurrentIndex(images) {
    const image = document.querySelector("#productMainImage");
    if (!image || !images.length) return 0;

    const currentSrc = image.getAttribute("src") || "";
    const index = images.findIndex(function (src) {
      return src === currentSrc || image.src === src;
    });

    return index >= 0 ? index : 0;
  }

  function changeImage(index, originalSelect) {
    const images = getImages();
    if (images.length < 2) return;

    const nextIndex = ((index % images.length) + images.length) % images.length;
    const image = document.querySelector("#productMainImage");
    if (!image) return;

    // Keep the existing thumbnail/image-selection behavior.
    if (typeof originalSelect === "function") {
      originalSelect(nextIndex);
    } else {
      image.src = images[nextIndex];
    }

    // Small premium fade without changing the gallery layout.
    image.style.opacity = "0.35";
    requestAnimationFrame(function () {
      image.style.transition = "opacity 260ms ease";
      image.style.opacity = "1";
    });
  }

  function startProductGalleryAutoplay(productId, originalSelect) {
    stopProductGalleryAutoplay();

    const images = getImages();
    if (images.length < 2) return;

    currentProductId = productId;

    autoplayTimer = setInterval(function () {
      // Stop safely if the product modal is no longer visible.
      const modal = document.querySelector("#productModal");
      if (!modal || !modal.classList.contains("show")) {
        stopProductGalleryAutoplay();
        return;
      }

      // Do not continue if another product has been opened.
      if (currentProductId !== productId) {
        stopProductGalleryAutoplay();
        return;
      }

      const currentImages = getImages();
      if (currentImages.length < 2) return;

      const currentIndex = getCurrentIndex(currentImages);
      changeImage(currentIndex + 1, originalSelect);
    }, INTERVAL_MS);
  }

  function install() {
    if (typeof window.openProduct !== "function") return;

    const originalOpenProduct = window.openProduct;
    const originalSelectProductImage = window.selectProductImage;
    const originalCloseProduct = window.closeProduct;

    window.openProduct = function (id) {
      stopProductGalleryAutoplay();
      originalOpenProduct(id);

      // Let the original gallery finish rendering before starting autoplay.
      requestAnimationFrame(function () {
        startProductGalleryAutoplay(id, originalSelectProductImage);
      });
    };

    if (typeof originalSelectProductImage === "function") {
      window.selectProductImage = function (index) {
        originalSelectProductImage(index);
        const images = getImages();
        if (images.length > 1 && currentProductId !== null) {
          startProductGalleryAutoplay(currentProductId, originalSelectProductImage);
        }
      };
    }

    if (typeof originalCloseProduct === "function") {
      window.closeProduct = function () {
        stopProductGalleryAutoplay();
        originalCloseProduct();
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
