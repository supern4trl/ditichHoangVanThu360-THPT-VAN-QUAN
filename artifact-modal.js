/* =========================================================
   KHUNG HIỆN VẬT - SCRIPT ĐẦY ĐỦ
   Dùng chung với artifact-modal.css

   Hàm toàn cục:
     openArtifact(duLieu, onClose)   // mở khung; onClose (tùy chọn) chạy sau khi đóng
     closeArtifact()                 // đóng khung

   Dữ liệu hiện vật (khớp với info.json):
   {
     name:   "Tên hiện vật",
     period: "Niên đại / mô tả ngắn",
     images: [
       { url: "https://...", caption: "Chú thích", description: "Mô tả riêng của ảnh này" },
       ...
     ]
   }
   Mỗi ảnh có mô tả riêng: bấm ảnh nhỏ nào thì chữ đổi theo ảnh đó.
   Ngoài ra vẫn hiểu kiểu cũ: image / img / src, description / desc,
   images là mảng chuỗi (đường dẫn ảnh).
   ========================================================= */

(function () {
    "use strict";

    // ---------- Lấy phần tử ----------
    var modal = document.getElementById("artifact-modal");
    var closeBtn = document.getElementById("close-artifact-btn");
    var imgEl = document.getElementById("artifact-image");
    var captionEl = document.getElementById("artifact-caption");
    var galleryEl = document.getElementById("thumbnail-gallery");
    var nameEl = document.getElementById("artifact-name");
    var periodEl = document.getElementById("artifact-period");
    var descEl = document.getElementById("artifact-description");
    var textBox = modal ? modal.querySelector(".artifact-text-container") : null;

    if (!modal || !imgEl || !nameEl || !descEl || !galleryEl || !captionEl || !periodEl) {
        console.warn("[artifact-modal] Thiếu phần tử HTML của khung hiện vật.");
        return;
    }

    // ---------- Trạng thái ----------
    var slides = [];            // [{src, caption, description}]
    var baseDescription = "";   // mô tả chung (dùng khi ảnh không có mô tả riêng)
    var current = 0;
    var lastFocus = null;
    var touchStartX = null;
    var onCloseCallback = null;

    var MIN_FONT = 11;          // cỡ chữ nhỏ nhất khi tự thu nhỏ cho vừa khung (px)

    // ---------- Tiện ích ----------
    function pick(obj, keys) {
        for (var i = 0; i < keys.length; i++) {
            if (obj[keys[i]] !== undefined && obj[keys[i]] !== null && obj[keys[i]] !== "") {
                return obj[keys[i]];
            }
        }
        return "";
    }

    function normalizeSlides(data) {
        var list = [];

        // Ảnh chính kiểu cũ (nếu có)
        var mainSrc = pick(data, ["image", "img", "src", "url"]);
        if (mainSrc) {
            list.push({
                src: mainSrc,
                caption: pick(data, ["caption"]),
                description: ""
            });
        }

        // Danh sách ảnh (info.json dùng "images" với url/caption/description)
        var extra = pick(data, ["images", "gallery"]);
        if (Array.isArray(extra)) {
            extra.forEach(function (item) {
                if (typeof item === "string") {
                    list.push({ src: item, caption: "", description: "" });
                } else if (item) {
                    var src = item.url || item.src || item.image || item.img;
                    if (src) {
                        list.push({
                            src: src,
                            caption: item.caption || "",
                            description: item.description || item.desc || ""
                        });
                    }
                }
            });
        }

        // Bỏ ảnh trùng
        var seen = {};
        return list.filter(function (s) {
            if (seen[s.src]) return false;
            seen[s.src] = true;
            return true;
        });
    }

    // ---------- Tự co chữ cho vừa khung ----------
    function fitText() {
        if (!textBox || modal.classList.contains("hidden")) return;

        // Xóa cỡ chữ cũ để đo lại từ đầu
        descEl.style.fontSize = "";
        nameEl.style.fontSize = "";

        var size = parseFloat(getComputedStyle(descEl).fontSize);
        var guard = 0;
        // Còn tràn thì giảm dần 0.5px, nhưng không nhỏ hơn MIN_FONT
        while (textBox.scrollHeight > textBox.clientHeight + 1 && size > MIN_FONT && guard < 60) {
            size -= 0.5;
            descEl.style.fontSize = size + "px";
            guard++;
        }

        // Tên quá dài thì thu nhỏ tiêu đề nếu bị tràn ngang
        var titleSize = parseFloat(getComputedStyle(nameEl).fontSize);
        guard = 0;
        while (nameEl.scrollWidth > nameEl.clientWidth + 1 && titleSize > 14 && guard < 40) {
            titleSize -= 1;
            nameEl.style.fontSize = titleSize + "px";
            guard++;
        }
    }

    // ---------- Hiện ảnh + chữ theo ảnh ----------
    function showSlide(index) {
        if (!slides.length) {
            imgEl.removeAttribute("src");
            imgEl.style.display = "none";
            captionEl.textContent = "";
            captionEl.style.display = "none";
            descEl.textContent = baseDescription;
            fitText();
            return;
        }
        current = (index + slides.length) % slides.length;
        var s = slides[current];

        imgEl.style.display = "";
        imgEl.src = s.src;
        imgEl.alt = nameEl.textContent || "Hình ảnh hiện vật";
        captionEl.textContent = s.caption || "";
        captionEl.style.display = s.caption ? "" : "none";

        // Mô tả riêng của ảnh; nếu không có thì dùng mô tả chung
        descEl.textContent = s.description || baseDescription;
        if (textBox) textBox.scrollTop = 0;

        var thumbs = galleryEl.querySelectorAll("img");
        for (var i = 0; i < thumbs.length; i++) {
            thumbs[i].classList.toggle("active", i === current);
        }
        // Cuộn thumbnail đang chọn vào tầm nhìn
        if (thumbs[current] && thumbs[current].scrollIntoView) {
            thumbs[current].scrollIntoView({ block: "nearest", inline: "center" });
        }

        fitText();
    }

    function buildGallery() {
        galleryEl.innerHTML = "";
        // Chỉ hiện dãy ảnh nhỏ khi có từ 2 ảnh trở lên
        galleryEl.style.display = slides.length < 2 ? "none" : "";
        if (slides.length < 2) return;
        slides.forEach(function (s, i) {
            var t = document.createElement("img");
            t.src = s.src;
            t.alt = "Ảnh " + (i + 1);
            t.className = "thumbnail-img";
            t.loading = "lazy";
            t.addEventListener("click", function () { showSlide(i); });
            galleryEl.appendChild(t);
        });
    }

    // ---------- Mở / đóng ----------
    function openArtifact(data, onClose) {
        data = data || {};
        onCloseCallback = typeof onClose === "function" ? onClose : null;
        lastFocus = document.activeElement;

        nameEl.textContent = pick(data, ["name", "title"]);
        periodEl.textContent = pick(data, ["period", "era", "date"]);
        periodEl.style.display = periodEl.textContent ? "" : "none";
        baseDescription = pick(data, ["description", "desc", "content"]);

        slides = normalizeSlides(data);
        buildGallery();

        // Hiện khung trước, rồi mới đo chữ cho chính xác
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
        showSlide(0);

        requestAnimationFrame(function () {
            fitText();
            if (closeBtn) closeBtn.focus();
        });
    }

    function closeArtifact() {
        if (modal.classList.contains("hidden")) return;
        modal.classList.add("hidden");
        document.body.style.overflow = "";
        imgEl.removeAttribute("src");

        if (lastFocus && lastFocus.focus) {
            try { lastFocus.focus(); } catch (e) { /* bỏ qua */ }
        }

        // Báo cho nơi gọi biết đã đóng (vd: quay lại góc nhìn 360 cũ)
        var cb = onCloseCallback;
        onCloseCallback = null;
        if (cb) {
            try { cb(); } catch (e) { console.error(e); }
        }
    }

    // ---------- Sự kiện ----------
    if (closeBtn) closeBtn.addEventListener("click", closeArtifact);

    // Bấm ra ngoài khung để đóng
    modal.addEventListener("click", function (e) {
        if (e.target === modal) closeArtifact();
    });

    // Bàn phím: Esc đóng, mũi tên chuyển ảnh
    document.addEventListener("keydown", function (e) {
        if (modal.classList.contains("hidden")) return;
        if (e.key === "Escape") {
            closeArtifact();
        } else if (e.key === "ArrowRight") {
            showSlide(current + 1);
        } else if (e.key === "ArrowLeft") {
            showSlide(current - 1);
        }
    });

    // Vuốt trái/phải trên ảnh (điện thoại)
    imgEl.addEventListener("touchstart", function (e) {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    imgEl.addEventListener("touchend", function (e) {
        if (touchStartX === null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) > 50) showSlide(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // Ảnh lỗi thì ẩn đi, không để icon vỡ hình
    imgEl.addEventListener("error", function () {
        if (imgEl.getAttribute("src")) imgEl.style.display = "none";
    });
    imgEl.addEventListener("load", function () {
        imgEl.style.display = "";
        fitText();            // ảnh đổi kích thước có thể làm đổi chỗ chữ
    });

    // Xoay màn hình / đổi kích thước cửa sổ thì căn lại
    var resizeTimer = null;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(fitText, 120);
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // ---------- Xuất ra toàn cục ----------
    window.openArtifact = openArtifact;
    window.closeArtifact = closeArtifact;
})();