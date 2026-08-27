let dots;

function updateDots() {
    if (!dots) return;
    dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
        dot.innerHTML = i === index ? "★" : "☆";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    dots = document.querySelectorAll(".dot");
    const galleryImages = document.querySelectorAll(".gallery-item img");
    const orientationGalleries = document.querySelectorAll(".portraits-grid, .category-grid");
    const galleryModal = document.getElementById("gallery-modal");
    const galleryModalImage = document.getElementById("gallery-modal-image");
    const galleryModalClose = document.querySelector(".gallery-modal-close");
    const carouselMenus = document.querySelectorAll(".carousel-menu");

    const updateImageOrientation = (image) => {
        const card = image.closest(".portrait-card, .category-card");
        if (!card || !image.naturalWidth || !image.naturalHeight) return;

        card.classList.toggle("is-portrait", image.naturalHeight > image.naturalWidth);
        card.classList.toggle("is-landscape", image.naturalWidth >= image.naturalHeight);
    };

    orientationGalleries.forEach((gallery) => {
        const updateImages = () => {
            gallery.querySelectorAll("img").forEach((image) => {
                updateImageOrientation(image);
                image.addEventListener("load", () => updateImageOrientation(image), { once: true });
            });
        };

        updateImages();
        new MutationObserver(updateImages).observe(gallery, { childList: true });
    });

    carouselMenus.forEach((menu) => {
        const parent = menu.parentElement;
        if (!parent) return;

        const createToggle = () => {
            const button = document.createElement("button");
            button.className = "carousel-menu-toggle";
            button.type = "button";
            button.setAttribute("aria-label", "Ouvrir le menu");
            button.setAttribute("aria-expanded", "false");
            button.innerHTML = "<span></span><span></span><span></span>";
            parent.insertBefore(button, menu);
            return button;
        };

        let toggleButton = parent.querySelector(".carousel-menu-toggle");
        const closeMenu = () => {
            if (!toggleButton) return;
            menu.classList.remove("is-open");
            toggleButton.setAttribute("aria-expanded", "false");
            toggleButton.setAttribute("aria-label", "Ouvrir le menu");
            document.body.classList.remove('menu-open');
        };

        const updateToggle = () => {
            if (window.innerWidth <= 768) {
                if (!toggleButton) {
                    toggleButton = createToggle();
                    toggleButton.addEventListener("click", (event) => {
                        event.stopPropagation();
                        const isOpen = menu.classList.toggle("is-open");
                        toggleButton.setAttribute("aria-expanded", String(isOpen));
                        toggleButton.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
                        document.body.classList.toggle('menu-open', isOpen);
                    });
                }
            } else {
                if (toggleButton) {
                    toggleButton.remove();
                    toggleButton = null;
                    menu.classList.remove("is-open");
                    document.body.classList.remove('menu-open');
                }
            }
        };

        updateToggle();

        document.addEventListener("click", (event) => {
            if (window.innerWidth <= 768 && toggleButton && !parent.contains(event.target)) {
                closeMenu();
            }
        });

        // wire up explicit close button inside menu (if present)
        const closeBtn = menu.querySelector('.carousel-menu-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); });
        }

        window.addEventListener("resize", () => {
            updateToggle();
        });
    });

    function attachDotListeners() {
        dots.forEach((dot, position) => {
            dot.addEventListener("click", () => {
                index = position;
                updateCarousel();
            });
        });
    }

    function openGalleryModal(src, alt) {
        galleryModalImage.src = src;
        galleryModalImage.alt = alt || "Photo agrandie";
        galleryModal.classList.add("open");
        galleryModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    function closeGalleryModal() {
        galleryModal.classList.remove("open");
        galleryModal.setAttribute("aria-hidden", "true");
        galleryModalImage.src = "";
        galleryModalImage.alt = "";
        document.body.classList.remove("modal-open");
    }

    galleryImages.forEach((image) => {
        image.addEventListener("click", () => {
            openGalleryModal(image.src, image.alt);
        });
    });

    if (galleryModalClose) {
        galleryModalClose.addEventListener("click", closeGalleryModal);
    }

    if (galleryModal) {
        galleryModal.addEventListener("click", (event) => {
            if (event.target === galleryModal) {
                closeGalleryModal();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (galleryModal && galleryModal.classList.contains("open")) {
                closeGalleryModal();
                return;
            }
            // if any mobile menu is open, close it
            const menus = document.querySelectorAll('.carousel-menu.is-open');
            if (menus.length) {
                menus.forEach(m => m.classList.remove('is-open'));
                document.querySelectorAll('.carousel-menu-toggle').forEach(b => b.setAttribute('aria-expanded', 'false'));
                document.body.classList.remove('menu-open');
            }
        }
    });

    attachDotListeners();
    updateDots();
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
