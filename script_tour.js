// =================================================================
// script_tour.js - PHIÊN BẢN HƯỚNG DẪN (DÀNH CHO HỌC SINH)
// Tác giả: Gemini & [Tên của bạn]
// Ngày cập nhật: 26/08/2025
// =================================================================

// =================================================================
// ⚙️ CHẾ ĐỘ PHÁT TRIỂN - Đặt thành false trước khi xuất bản cho học sinh, còn lúc sửa thì đặt là true
const DEV_MODE = false;
// =================================================================

// --- 1. KHAI BÁO BIẾN TOÀN CỤC ---
let artifactData = {};      // Chứa toàn bộ thông tin hiện vật từ file info.json
let hotspotConfig = {};     // Chứa cấu hình của các điểm tương tác
let previousViewState = {}; // Lưu lại góc nhìn cũ trước khi "zoom" vào hiện vật
let viewer;                 // Đối tượng Pannellum chính để hiển thị ảnh 360
let tourConfig = {};        // Cấu hình tour từ file tour_config.json

// Lấy ID bảo tàng từ URL (ví dụ: tour.html?m=ha_giang)
const urlParams = new URLSearchParams(window.location.search);
const museumId = urlParams.get('m');

// Hàm bổ trợ để lấy đúng tên file
function getFileName(defaultName) {
    if (!museumId) return defaultName;
    return `${museumId}_${defaultName}`;
}

// --- 2. CÁC HÀM XỬ LÝ DỮ LIỆU VÀ GIAO DIỆN MODAL ---

/**
 * Tải dữ liệu thông tin chi tiết của các hiện vật từ info.json (Do script Node.js sinh ra)
 */
async function loadArtifactData() {
    try {
        const fileName = getFileName('info.json');
        let response = await fetch(fileName);

        // Nếu không tìm thấy file riêng (404) và đang dùng ID đặc biệt
        if (!response.ok && museumId) {
            console.warn(`Không tìm thấy ${fileName}, đang nạp info.json mặc định.`);
            response = await fetch('info.json');
        }

        if (!response.ok) {
            throw new Error(`Lỗi tải file dữ liệu hiện vật!`);
        }
        artifactData = await response.json();
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

/**
 * Hiển thị thông tin hiện vật lên "Modal" (Cửa sổ chi tiết)
 * artifactId: ID của hiện vật bạn đã đặt trong file CSV và JSON
 */
function showArtifactInfo(hotspotDOM, artifactId) {
    const data = artifactData[artifactId];
    const artifactModal = document.getElementById('artifact-modal');
    const artifactImage = document.getElementById('artifact-image');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');

    if (!data || !artifactModal) {
        console.error("Lỗi: Không tìm thấy dữ liệu cho ID:", artifactId);
        return;
    }

    // 1. Đưa thông tin văn bản vào Modal
    thumbnailGallery.innerHTML = ''; // Xóa các ảnh cũ của hiện vật trước
    document.getElementById('artifact-name').textContent = data.name;
    document.getElementById('artifact-period').textContent = data.period;

    const images = data.images;
    const captionEl = document.getElementById('artifact-caption');
    const descriptionEl = document.getElementById('artifact-description');

    // Hàm cập nhật ảnh lớn + caption + description theo ảnh được chọn
    function selectImage(index) {
        const img = images[index];
        artifactImage.src = img.url;
        if (captionEl) captionEl.textContent = img.caption || '';
        descriptionEl.innerText = img.description || '';
        thumbnailGallery.querySelectorAll('.thumbnail-img').forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
    }

    // 2. Xử lý hiển thị ảnh (1 ảnh hay nhiều ảnh)
    if (images && images.length > 1) {
        // Nếu có nhiều ảnh -> Hiển thị dạng bộ sưu tập (Gallery)
        thumbnailGallery.style.display = 'flex';

        images.forEach((imgObj, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgObj.url;
            thumb.classList.add('thumbnail-img');
            thumb.addEventListener('click', () => selectImage(index));
            thumbnailGallery.appendChild(thumb);
        });

        selectImage(0); // Hiện ảnh đầu tiên
    } else if (images && images.length === 1) {
        // Chỉ có 1 ảnh -> Ẩn bộ sưu tập đi cho gọn
        thumbnailGallery.style.display = 'none';
        selectImage(0);
    }

    // 3. Hiển thị cửa sổ Modal lên màn hình
    artifactModal.classList.remove('hidden');
}

/**
 * Đóng cửa sổ thông tin hiện vật và quay về góc nhìn panorama cũ
 */
function closeArtifactModal() {
    const artifactModal = document.getElementById('artifact-modal');
    if (artifactModal) {
        artifactModal.classList.add('hidden');
    }
    // Zoom ngược ra như ban đầu
    if (previousViewState.pitch !== undefined && viewer) {
        viewer.lookAt(previousViewState.pitch, previousViewState.yaw, previousViewState.hfov, 1000);
    }
}

/**
 * Hiệu ứng zoom vào hotspot trước khi hiện thông tin
 */
function zoomAndShowInfo(hotspotDOM, args) {
    const { pitch, yaw, hfov, artifactId } = args;
    if (!viewer) return;

    // Lưu lại vị trí đang đứng để lát nữa "quay về"
    previousViewState = {
        pitch: viewer.getPitch(),
        yaw: viewer.getYaw(),
        hfov: viewer.getHfov()
    };

    // Bắt đầu zoom vào điểm click
    viewer.lookAt(pitch, yaw, hfov, 1000);

    // Đợi 1 giây (để hiệu ứng zoom xong) thì mới hiện bảng thông tin
    setTimeout(() => {
        showArtifactInfo(null, artifactId);
    }, 1000);
}

// --- 3. CÁC HÀM TẠO HOTSPOT (NHÀ MÁY SẢN XUẤT HOTSPOT) ---

/**
 * Tạo hotspot loại hiện vật (Artifact) - Khi click sẽ hiện Modal
 */
function createArtifactHotspot(hotspotInfo) {
    return {
        pitch: hotspotInfo.pitch,
        yaw: hotspotInfo.yaw,
        type: 'info',
        text: hotspotInfo.text || "Xem hiện vật",
        cssClass: 'pulsating-hotspot', // Kiểu CSS lấp lánh
        clickHandlerFunc: zoomAndShowInfo,
        clickHandlerArgs: {
            pitch: hotspotInfo.pitch,
            yaw: hotspotInfo.yaw,
            hfov: hotspotInfo.hfov || 60,
            artifactId: hotspotInfo.artifactId
        }
    };
}

/**
 * Tạo hotspot loại chuyển cảnh (Scene) - Khi click sẽ bay sang phòng khác
 * Nếu sceneId là đường dẫn URL (vd: "index.html") thì chuyển trang thay vì đổi scene
 */
function createSceneHotspot(hotspotInfo) {
    const isUrl = hotspotInfo.sceneId && hotspotInfo.sceneId.includes('.html');
    if (isUrl) {
        // Lấy ID hiện tại để quay về đúng bảo tàng
        const currentId = museumId || 'tuyen_quang';
        let targetUrl = hotspotInfo.sceneId;

        // Nếu đích đến là index.html (cổng cũ) -> Chuyển thành welcome.html (cổng mới)
        if (targetUrl === 'index.html') {
            targetUrl = `welcome.html?m=${currentId}`;
        } else if (!targetUrl.includes('?m=')) {
            // Đảm bảo luôn mang theo ID bảo tàng
            targetUrl += targetUrl.includes('?') ? `&m=${currentId}` : `?m=${currentId}`;
        }

        return {
            pitch: hotspotInfo.pitch,
            yaw: hotspotInfo.yaw,
            type: 'info',
            text: hotspotInfo.text || "Thoát",
            cssClass: hotspotInfo.cssClass || 'pnlm-hotspot-arrow-up',
            clickHandlerFunc: (_, args) => { window.location.href = args.url; },
            clickHandlerArgs: { url: targetUrl }
        };
    }
    return {
        pitch: hotspotInfo.pitch,
        yaw: hotspotInfo.yaw,
        type: 'scene',
        text: hotspotInfo.text || "Đi tiếp",
        sceneId: hotspotInfo.sceneId,
        cssClass: hotspotInfo.cssClass || 'pnlm-hotspot-arrow-up'
    };
}

// --- 4. HÀM KHỞI TẠO TOUR (CHẠY KHI MỞ TRANG) ---

async function initializeTour() {
    try {
        // Tải dữ liệu từ 2 file cấu hình
        await loadArtifactData(); // Nạp dữ liệu hiện vật trước

        const configFileName = getFileName('tour_config.json');
        let configRes = await fetch(configFileName);

        if (!configRes.ok && museumId) {
            console.warn(`Không tìm thấy ${configFileName}, đang nạp tour_config.json mặc định.`);
            configRes = await fetch('tour_config.json');
        }

        tourConfig = await configRes.json();

        // Phân tích các hotspots từ tour_config.json sang dạng Pannellum hiểu được
        const scenesConfig = tourConfig.scenes;
        for (const sceneId in scenesConfig) {
            if (scenesConfig[sceneId].hotSpots) {
                scenesConfig[sceneId].hotSpots = scenesConfig[sceneId].hotSpots.map(hotspotInfo => {
                    if (hotspotInfo.type === 'artifact') return createArtifactHotspot(hotspotInfo);
                    if (hotspotInfo.type === 'scene') return createSceneHotspot(hotspotInfo);
                    return null;
                }).filter(Boolean);
            }
        }

        // Khởi tạo Viewer với cấu hình đã xử lý
        viewer = pannellum.viewer('panorama-container', {
            "default": tourConfig.default,
            "scenes": scenesConfig
        });

        // Gán sự kiện cho các nút chức năng (Đóng modal...)
        setupEventListeners();
        setupCoordsCopier(); // Công cụ hỗ trợ lấy tọa độ cho HS

    } catch (error) {
        console.error("Lỗi khởi tạo Tour:", error);
    }
}

function setupEventListeners() {
    const closeBtn = document.getElementById('close-artifact-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeArtifactModal);

    // Xử lý bật tắt nhạc nền
    setupMusic();

    // KHỞI TẠO HƯỚNG DẪN VIÊN ẢO (MỚI)
    setupVirtualGuide(tourConfig);
}

/**
 * HƯỚNG DẪN VIÊN ẢO: Tự động phát thuyết minh khi đổi phòng
 */
function setupVirtualGuide(tourConfig) {
    const guideContainer = document.getElementById('guide-container');
    const guideAudio = document.getElementById('guide-audio');
    const guideImg = document.getElementById('guide-gif'); // Khai báo đúng ID
    const toggleBtn = document.getElementById('guide-toggle-btn');

    if (!guideContainer || !guideAudio || !toggleBtn) return;

    let isGuideActive = true; // Mặc định là BẬT

    let guidesData = {};

    // Nạp dữ liệu hướng dẫn viên tập trung
    fetch('guides_config.json')
        .then(res => res.json())
        .then(data => { guidesData = data; updateSceneGuide(viewer.getScene()); })
        .catch(err => console.error("Lỗi nạp guides_config.json:", err));

    // Hàm cập nhật âm thanh khi vào phòng
    function updateSceneGuide(sceneId) {
        const currentId = museumId || 'tuyen_quang';
        const locationGuides = guidesData[currentId];
        const sceneGuide = (locationGuides && locationGuides.scenes) ? locationGuides.scenes[sceneId] : null;

        // Nếu phòng này có cấu hình audio thuyết minh
        if (sceneGuide && sceneGuide.audio) {
            guideAudio.src = sceneGuide.audio;
            if (sceneGuide.image && guideImg) guideImg.src = sceneGuide.image;

            if (isGuideActive) {
                guideContainer.classList.remove('hidden');
                guideAudio.play();
            }
        } else {
            // Nếu phòng không có thuyết minh
            guideContainer.classList.add('hidden');
            guideAudio.pause();
        }
    }

    // Sự kiện khi học sinh nhấn nút Bật/Tắt hướng dẫn viên
    toggleBtn.addEventListener('click', () => {
        isGuideActive = !isGuideActive;
        if (isGuideActive) {
            toggleBtn.textContent = "Tắt Hướng dẫn";
            // Phát lại âm thanh phòng hiện tại
            updateSceneGuide(viewer.getScene());
        } else {
            toggleBtn.textContent = "Bật Hướng dẫn";
            guideContainer.classList.add('hidden');
            guideAudio.pause();
        }
    });

    // Tự động ẩn hướng dẫn viên khi phát xong audio
    guideAudio.addEventListener('ended', () => {
        guideContainer.classList.add('hidden');
    });

    // LẮNG NGHE SỰ KIỆN ĐỔI PHÒNG (Pannellum Event)
    viewer.on('scenechange', (newSceneId) => {
        updateSceneGuide(newSceneId);
    });

    // Chạy thử lần đầu cho phòng khởi tạo
    updateSceneGuide(viewer.getScene());
}

/**
 * Điều khiển nhạc nền (Dành cho HS tập thực hành)
 */
function setupMusic() {
    const music = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');

    if (!music || !musicBtn) return;

    music.volume = 0.3;

    let isPlaying = false;

    function setMusicState(playing) {
        isPlaying = playing;
        sessionStorage.setItem('bgMusicPlaying', playing ? '1' : '0');
        musicBtn.textContent = playing ? "🎵 Nhạc nền: BẬT" : "🎵 Nhạc nền: TẮT";
    }

    musicBtn.addEventListener('click', () => {
        if (isPlaying) {
            music.pause();
            setMusicState(false);
        } else {
            music.play();
            setMusicState(true);
        }
    });

    // Tiếp tục nhạc nếu đang bật từ trang index, hoặc chờ click đầu tiên
    if (sessionStorage.getItem('bgMusicPlaying') === '1') {
        music.play().then(() => setMusicState(true)).catch(() => {
            // Trình duyệt chặn autoplay, chờ click đầu tiên
            document.addEventListener('click', function startMusic() {
                music.play();
                setMusicState(true);
                document.removeEventListener('click', startMusic);
            }, { once: true });
        });
    } else {
        // Chưa từng bật: chờ click đầu tiên rồi tự phát
        document.addEventListener('click', function startMusic() {
            music.play();
            setMusicState(true);
            document.removeEventListener('click', startMusic);
        }, { once: true });
    }
}

/**
 * ARTIFACT EDITOR: Công cụ lấy tọa độ để đặt hiện vật vào tour_config.json
 * Khi click vào ảnh 360, sẽ hiển thị pitch/yaw và tạo JSON sẵn để copy.
 */
function setupCoordsCopier() {
    const editor = document.getElementById('artifact-editor');
    const toggleBtn = document.getElementById('artifact-editor-toggle');

    if (!DEV_MODE) {
        if (editor) editor.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'none';
        const openBtn2 = document.getElementById('artifact-editor-open');
        if (openBtn2) openBtn2.style.display = 'none';
        return;
    }

    // Nút ✕ trong header → ẩn panel, hiện nút mở lại
    const openBtn = document.getElementById('artifact-editor-open');
    if (toggleBtn && openBtn) {
        toggleBtn.addEventListener('click', () => {
            editor.style.display = 'none';
            openBtn.style.display = 'block';
        });
        openBtn.addEventListener('click', () => {
            editor.style.display = 'block';
            openBtn.style.display = 'none';
        });
        openBtn.style.display = 'none'; // Mặc định ẩn nút mở, panel đang hiện
    }

    const coordsText = document.getElementById('coords-text');
    const currentViewText = document.getElementById('current-view-text');
    const typeSelect = document.getElementById('hotspot-type-select');
    const artifactFields = document.getElementById('artifact-fields');
    const sceneFields = document.getElementById('scene-fields');
    const artifactSelect = document.getElementById('artifact-id-select');
    const sceneSelect = document.getElementById('scene-id-select');
    const arrowSelect = document.getElementById('scene-arrow-select');
    const copyBtn = document.getElementById('copy-json-btn');
    const getCurrentViewBtn = document.getElementById('get-current-view-btn');
    const statusEl = document.getElementById('copy-json-status');

    if (!coordsText || !typeSelect || !artifactSelect || !copyBtn || !viewer) return;

    // HIỂN THỊ GÓC HIỆN TẠI (Loop cập nhật liên tục)
    function updateCurrentViewDisplay() {
        if (!viewer) return;
        const p = viewer.getPitch().toFixed(2);
        const y = viewer.getYaw().toFixed(2);
        const h = viewer.getHfov().toFixed(2);
        if (currentViewText) {
            currentViewText.textContent = `pitch: ${p}, yaw: ${y}, hfov: ${h}`;
        }
        requestAnimationFrame(updateCurrentViewDisplay);
    }
    updateCurrentViewDisplay();

    // NÚT LẤY GÓC XUẤT PHÁT (Cho Scene)
    if (getCurrentViewBtn) {
        getCurrentViewBtn.addEventListener('click', () => {
            const pitch = viewer.getPitch().toFixed(2);
            const yaw = viewer.getYaw().toFixed(2);
            const hfov = viewer.getHfov().toFixed(2);

            // Định dạng chuỗi copy theo đúng ý người dùng (không chứa dấu { })
            const textToCopy = `"pitch": ${pitch},\n"yaw": ${yaw},\n"hfov": ${hfov},`;

            navigator.clipboard.writeText(textToCopy).then(() => {
                if (statusEl) {
                    statusEl.textContent = `✅ Đã copy thông số góc nhìn!`;
                    setTimeout(() => { statusEl.textContent = ''; }, 3000);
                }
            }).catch(() => {
                alert("❌ Không copy được góc nhìn. Vui lòng sử dụng Live Server.");
            });
        });
    }

    // Điền danh sách hiện vật
    for (const id in artifactData) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${id} — ${artifactData[id].name || ''}`;
        artifactSelect.appendChild(option);
    }

    // Điền danh sách scenes
    if (tourConfig && tourConfig.scenes) {
        for (const id in tourConfig.scenes) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            sceneSelect.appendChild(option);
        }
    }
    // Thêm option thoát về trang chủ
    const exitOption = document.createElement('option');
    exitOption.value = 'index.html';
    exitOption.textContent = '🏠 index.html (Trang chủ)';
    sceneSelect.appendChild(exitOption);

    // Bật/tắt fields theo loại
    typeSelect.addEventListener('change', () => {
        const isScene = typeSelect.value === 'scene';
        artifactFields.style.display = isScene ? 'none' : '';
        sceneFields.style.display = isScene ? '' : 'none';
        coordsText.textContent = 'Alt+Click vào ảnh 360';
        if (statusEl) statusEl.textContent = '';
    });

    const container = document.getElementById('panorama-container');
    if (container) {
        container.addEventListener('mousedown', (e) => {
            if (!e.altKey) return;
            e.preventDefault();
            e.stopPropagation();

            const isScene = typeSelect.value === 'scene';

            // Kiểm tra đã chọn chưa
            if (isScene) {
                if (!sceneSelect.value) {
                    if (statusEl) statusEl.textContent = '⚠️ Chọn scene đích trước!';
                    return;
                }
            } else {
                if (!artifactSelect.value) {
                    if (statusEl) statusEl.textContent = '⚠️ Chọn hiện vật trước!';
                    return;
                }
            }

            const coords = viewer.mouseEventToCoords(e);
            const pitch = parseFloat(coords[0].toFixed(2));
            const yaw = parseFloat(coords[1].toFixed(2));
            coordsText.textContent = `pitch: ${pitch}, yaw: ${yaw}`;

            let json, label;
            if (isScene) {
                label = sceneSelect.value;
                json = JSON.stringify({
                    type: "scene",
                    pitch: pitch,
                    yaw: yaw,
                    sceneId: sceneSelect.value,
                    cssClass: arrowSelect.value
                }, null, 4);
            } else {
                label = artifactSelect.value;
                json = JSON.stringify({
                    type: "artifact",
                    pitch: pitch,
                    yaw: yaw,
                    artifactId: artifactSelect.value
                }, null, 4);
            }

            navigator.clipboard.writeText(json).then(() => {
                if (statusEl) {
                    statusEl.textContent = `✅ Đã copy "${label}"!`;
                    setTimeout(() => { statusEl.textContent = ''; }, 2000);
                }
                // Reset về chờ chọn tiếp
                if (isScene) {
                    sceneSelect.value = '';
                } else {
                    artifactSelect.value = '';
                }
                coordsText.textContent = 'Alt+Click vào ảnh 360';
            }).catch(() => {
                if (statusEl) statusEl.textContent = '❌ Không copy được, hãy dùng Live Server!';
            });
        });
    }

    // Nút Copy JSON giữ lại để dùng thủ công nếu cần
    copyBtn.addEventListener('click', () => {
        if (statusEl) statusEl.textContent = '⚠️ Hãy dùng Alt+Click trực tiếp trên ảnh!';
    });
}

// Bắt đầu khởi động tour
initializeTour();