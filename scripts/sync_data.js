const fs = require('fs');
const path = require('path');

/**
 * Script Node.js tự động chuyển đổi file items.csv thành info.json
 * Cách chạy: node scripts/sync_data.js
 */

const CSV_PATH = path.join(__dirname, '../items.csv');
const JSON_OUTPUT = path.join(__dirname, '../info.json');
const TOUR_CONFIG_PATH = path.join(__dirname, '../tour_config.json');

function sync() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error("Lỗi: Không tìm thấy file items.csv");
        return;
    }

    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Xử lý tiêu đề CSV
    const headers = lines[0].split(',').map(h => h.trim());

    const result = {};

    for (let i = 1; i < lines.length; i++) {
        // Tách dòng CSV hỗ trợ dấu phẩy trong nội dung "..."
        const values = parseCSVLine(lines[i]);
        
        const item = {};
        headers.forEach((header, index) => {
            item[header] = values[index] ? values[index].trim() : "";
        });

        const id = item.id;
        if (!id) continue;

        // Đọc các cột img1_url, img1_caption, img1_desc, img2_url, ...
        const imagesArray = [];
        let imgIndex = 1;
        while (item[`img${imgIndex}_url`]) {
            imagesArray.push({
                url: item[`img${imgIndex}_url`],
                caption: item[`img${imgIndex}_caption`] || "",
                description: item[`img${imgIndex}_desc`] || ""
            });
            imgIndex++;
        }
        // Nếu không có ảnh nào, dùng ảnh mặc định theo ID
        if (imagesArray.length === 0) {
            imagesArray.push({ url: `images/hien-vat/${id}.jpg`, caption: "", description: "" });
        }

        result[id] = {
            name: item.name,
            images: imagesArray,
            period: item.period
        };
    }

    // Ghi ra file JSON
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(result, null, 4), 'utf8');
    console.log(`✅ Đã cập nhật thành công ${Object.keys(result).length} hiện vật từ CSV vào info.json`);

    // Xóa hotspot mồ côi trong tour_config.json
    if (fs.existsSync(TOUR_CONFIG_PATH)) {
        const tourConfig = JSON.parse(fs.readFileSync(TOUR_CONFIG_PATH, 'utf8'));
        let removedCount = 0;
        for (const sceneId of Object.keys(tourConfig.scenes || {})) {
            const scene = tourConfig.scenes[sceneId];
            if (!scene.hotSpots) continue;
            const before = scene.hotSpots.length;
            scene.hotSpots = scene.hotSpots.filter(hs => {
                if (hs.type === 'artifact' && !result[hs.artifactId]) {
                    console.log(`  ⚠️  Đã xóa hotspot mồ côi: artifactId="${hs.artifactId}" trong scene "${sceneId}"`);
                    return false;
                }
                return true;
            });
            removedCount += before - scene.hotSpots.length;
        }
        if (removedCount > 0) {
            fs.writeFileSync(TOUR_CONFIG_PATH, JSON.stringify(tourConfig, null, 4), 'utf8');
            console.log(`🗑️  Đã xóa ${removedCount} hotspot mồ côi khỏi tour_config.json`);
        }
    }
}

/**
 * Hàm phân tích dòng CSV hỗ trợ nội dung được bao bởi dấu ngoặc kép
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

sync();
