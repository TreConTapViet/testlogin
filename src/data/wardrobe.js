// Danh mục món đồ của phòng thử. Mỗi món = loại (kind) + thông số hình dáng (shape),
// cùng một bộ hàm vẽ sẽ tạo ra cả icon trong danh sách lẫn trang phục trên ma-nơ-canh.
// gender: 'nam' | 'nu' | 'unisex'. color/color2: id trong fashionPalette hoặc mã hex.

export const CATEGORIES = [
  { id: 'ao', label: 'Áo' },
  { id: 'khoac', label: 'Áo khoác' },
  { id: 'quan', label: 'Quần' },
  { id: 'vay', label: 'Chân váy' },
  { id: 'dam', label: 'Đầm & áo dài' },
  { id: 'giay', label: 'Giày dép' },
  { id: 'tui', label: 'Túi' },
  { id: 'mu', label: 'Mũ nón' },
  { id: 'kinh', label: 'Kính' },
  { id: 'dongho', label: 'Đồng hồ' },
  { id: 'trangsuc', label: 'Trang sức' },
  { id: 'phukien', label: 'Phụ kiện khác' },
]

// Mỗi vị trí trên ma-nơ-canh chỉ mặc 1 món
export const SLOTS = {
  top: 'Áo',
  outer: 'Áo khoác',
  bottom: 'Quần / chân váy',
  dress: 'Đầm / áo dài',
  shoes: 'Giày dép',
  bag: 'Túi',
  hat: 'Mũ nón',
  glasses: 'Kính',
  watch: 'Đồng hồ',
  bracelet: 'Vòng tay',
  necklace: 'Dây chuyền',
  earrings: 'Khuyên tai',
  scarf: 'Khăn',
  belt: 'Thắt lưng',
  neckwear: 'Cà vạt / nơ',
}

const item = (id, name, category, slot, gender, kind, shape, color, extra = {}) => ({
  id,
  name,
  category,
  slot,
  gender,
  kind,
  shape,
  color,
  color2: extra.color2 ?? null,
  pattern: extra.pattern ?? 'solid',
})

export const WARDROBE = [
  // ---------- Áo ----------
  item('ao-thun', 'Áo thun cổ tròn', 'ao', 'top', 'unisex', 'top', { sleeve: 'short', neck: 'round', length: 'regular', fit: 'regular' }, 'trang'),
  item('ao-thun-oversize', 'Áo thun oversize', 'ao', 'top', 'unisex', 'top', { sleeve: 'elbow', neck: 'round', length: 'long', fit: 'loose' }, 'den'),
  item('ao-thun-graphic', 'Áo thun in hình', 'ao', 'top', 'unisex', 'top', { sleeve: 'short', neck: 'round', length: 'regular', fit: 'loose', graphic: true }, 'trang-nga', { color2: 'cam-dat' }),
  item('ao-polo', 'Áo polo', 'ao', 'top', 'unisex', 'top', { sleeve: 'short', neck: 'polo', length: 'regular', fit: 'regular' }, 'navy'),
  item('ao-polo-len', 'Áo polo len (knit polo)', 'ao', 'top', 'nam', 'top', { sleeve: 'short', neck: 'polo', length: 'regular', fit: 'slim' }, 'kem', { pattern: 'knit', color2: 'be' }),
  item('so-mi-oxford', 'Sơ mi Oxford', 'ao', 'top', 'unisex', 'top', { sleeve: 'long', neck: 'collar', length: 'regular', fit: 'regular', buttons: true, pocket: true }, 'trang'),
  item('so-mi-cuba', 'Sơ mi cổ Cuba', 'ao', 'top', 'nam', 'top', { sleeve: 'short', neck: 'cuban', length: 'regular', fit: 'loose', buttons: true }, 'be'),
  item('so-mi-linen', 'Sơ mi linen (đũi)', 'ao', 'top', 'unisex', 'top', { sleeve: 'long', neck: 'collar', length: 'regular', fit: 'loose', buttons: true }, 'trang-nga'),
  item('ao-henley', 'Áo henley dài tay', 'ao', 'top', 'nam', 'top', { sleeve: 'long', neck: 'henley', length: 'regular', fit: 'slim' }, 'xam-than'),
  item('ao-len', 'Áo len cổ tròn', 'ao', 'top', 'unisex', 'top', { sleeve: 'long', neck: 'round', length: 'regular', fit: 'regular', ribbed: true }, 'xam', { pattern: 'knit', color2: 'xam-than' }),
  item('ao-len-co-lo', 'Áo len cổ lọ', 'ao', 'top', 'unisex', 'top', { sleeve: 'long', neck: 'turtle', length: 'regular', fit: 'slim', ribbed: true }, 'den', { pattern: 'knit', color2: 'xam-than' }),
  item('hoodie', 'Áo hoodie', 'ao', 'top', 'unisex', 'top', { sleeve: 'long', neck: 'hood', length: 'regular', fit: 'loose', ribbed: true, kangaroo: true }, 'xam'),
  item('ao-blouse', 'Áo blouse cổ V', 'ao', 'top', 'nu', 'top', { sleeve: 'long', neck: 'v', length: 'regular', fit: 'regular', puff: true }, 'trang-nga'),
  item('ao-co-vuong', 'Áo kiểu cổ vuông', 'ao', 'top', 'nu', 'top', { sleeve: 'short', neck: 'square', length: 'regular', fit: 'slim', puff: true }, 'hong-pastel'),
  item('croptop', 'Áo croptop', 'ao', 'top', 'nu', 'top', { sleeve: 'short', neck: 'round', length: 'crop', fit: 'slim' }, 'trang'),
  item('ao-hai-day', 'Áo hai dây', 'ao', 'top', 'nu', 'top', { sleeve: 'strap', neck: 'strap', length: 'regular', fit: 'slim' }, 'den'),
  item('ao-corset', 'Áo corset', 'ao', 'top', 'nu', 'top', { sleeve: 'strap', neck: 'square', length: 'crop', fit: 'slim', seams: true }, 'fuchsia'),
  item('ao-tank', 'Áo ba lỗ (tank top)', 'ao', 'top', 'unisex', 'top', { sleeve: 'none', neck: 'round', length: 'regular', fit: 'regular' }, 'trang'),

  // ---------- Áo khoác ----------
  item('blazer', 'Áo blazer', 'khoac', 'outer', 'unisex', 'outer', { style: 'blazer', length: 'hip' }, 'navy'),
  item('ao-khoac-jean', 'Áo khoác jean', 'khoac', 'outer', 'unisex', 'outer', { style: 'denim', length: 'hip' }, 'denim', { pattern: 'denim', color2: 'denim-sang' }),
  item('ao-khoac-da', 'Áo khoác da', 'khoac', 'outer', 'unisex', 'outer', { style: 'leather', length: 'hip' }, 'den'),
  item('bomber', 'Áo bomber', 'khoac', 'outer', 'unisex', 'outer', { style: 'bomber', length: 'short' }, 'olive'),
  item('cardigan', 'Áo cardigan', 'khoac', 'outer', 'unisex', 'outer', { style: 'cardigan', length: 'hip' }, 'be', { pattern: 'knit', color2: 'camel' }),
  item('overshirt', 'Áo sơ mi khoác flannel', 'khoac', 'outer', 'unisex', 'outer', { style: 'overshirt', length: 'hip' }, 'burgundy', { pattern: 'caro', color2: 'den' }),
  item('trench', 'Áo măng tô (trench coat)', 'khoac', 'outer', 'unisex', 'outer', { style: 'trench', length: 'long' }, 'camel'),
  item('ao-da-dai', 'Áo khoác dạ dáng dài', 'khoac', 'outer', 'unisex', 'outer', { style: 'coat', length: 'long' }, 'xam-than'),
  item('ao-phao', 'Áo phao (puffer)', 'khoac', 'outer', 'unisex', 'outer', { style: 'puffer', length: 'hip' }, 'den'),
  item('field-jacket', 'Áo khoác field (utility)', 'khoac', 'outer', 'nam', 'outer', { style: 'utility', length: 'hip' }, 'olive'),
  item('ao-gile', 'Áo gile', 'khoac', 'outer', 'unisex', 'outer', { style: 'vest', length: 'hip', sleeveless: true }, 'xam-than'),

  // ---------- Quần ----------
  item('quan-jean', 'Quần jean ống đứng', 'quan', 'bottom', 'unisex', 'pants', { fit: 'straight', length: 'long', style: 'jeans' }, 'denim', { pattern: 'denim', color2: 'denim-sang' }),
  item('quan-jean-rong', 'Quần jean ống rộng', 'quan', 'bottom', 'unisex', 'pants', { fit: 'wide', length: 'long', style: 'jeans' }, 'denim-sang', { pattern: 'denim', color2: 'trang' }),
  item('quan-tay', 'Quần tây', 'quan', 'bottom', 'unisex', 'pants', { fit: 'straight', length: 'long', style: 'trousers' }, 'xam'),
  item('quan-tay-rong', 'Quần tây ống rộng', 'quan', 'bottom', 'nu', 'pants', { fit: 'wide', length: 'long', style: 'trousers' }, 'kem'),
  item('quan-kaki', 'Quần kaki (chinos)', 'quan', 'bottom', 'unisex', 'pants', { fit: 'slim', length: 'long', style: 'chino' }, 'be'),
  item('quan-jogger', 'Quần jogger', 'quan', 'bottom', 'unisex', 'pants', { fit: 'jogger', length: 'long', style: 'jogger' }, 'xam'),
  item('quan-cargo', 'Quần túi hộp (cargo)', 'quan', 'bottom', 'unisex', 'pants', { fit: 'straight', length: 'long', style: 'cargo' }, 'kaki'),
  item('quan-linen', 'Quần linen', 'quan', 'bottom', 'unisex', 'pants', { fit: 'wide', length: 'long', style: 'trousers' }, 'trang-nga'),
  item('quan-ong-suong', 'Quần ống suông (culottes)', 'quan', 'bottom', 'nu', 'pants', { fit: 'wide', length: 'cropped', style: 'trousers' }, 'den'),
  item('quan-short-kaki', 'Quần short kaki', 'quan', 'bottom', 'unisex', 'pants', { fit: 'straight', length: 'short', style: 'chino' }, 'be'),
  item('quan-short-jean', 'Quần short jean', 'quan', 'bottom', 'unisex', 'pants', { fit: 'straight', length: 'short', style: 'jeans' }, 'denim-sang', { pattern: 'denim', color2: 'trang' }),

  // ---------- Chân váy ----------
  item('chan-vay-chu-a', 'Chân váy chữ A', 'vay', 'bottom', 'nu', 'skirt', { shape: 'a-line', length: 'knee' }, 'be'),
  item('chan-vay-but-chi', 'Chân váy bút chì', 'vay', 'bottom', 'nu', 'skirt', { shape: 'pencil', length: 'knee' }, 'den'),
  item('chan-vay-xep-ly', 'Chân váy xếp ly midi', 'vay', 'bottom', 'nu', 'skirt', { shape: 'pleated', length: 'midi' }, 'xam'),
  item('chan-vay-mini', 'Chân váy jean mini', 'vay', 'bottom', 'nu', 'skirt', { shape: 'a-line', length: 'mini' }, 'denim', { pattern: 'denim', color2: 'denim-sang' }),
  item('chan-vay-maxi', 'Chân váy maxi', 'vay', 'bottom', 'nu', 'skirt', { shape: 'flowy', length: 'maxi' }, 'trang-nga', { pattern: 'floral', color2: 'cam-dat' }),
  item('chan-vay-da', 'Chân váy da', 'vay', 'bottom', 'nu', 'skirt', { shape: 'pencil', length: 'midi' }, 'nau'),

  // ---------- Đầm & áo dài ----------
  item('dam-suong', 'Đầm suông', 'dam', 'dress', 'nu', 'dress', { bodice: 'short', neck: 'round', skirt: 'shift', length: 'knee' }, 'be'),
  item('dam-om', 'Đầm ôm (body)', 'dam', 'dress', 'nu', 'dress', { bodice: 'none', neck: 'square', skirt: 'bodycon', length: 'midi' }, 'den'),
  item('dam-xoe', 'Đầm xòe dự tiệc', 'dam', 'dress', 'nu', 'dress', { bodice: 'strap', neck: 'v', skirt: 'flare', length: 'knee' }, 'burgundy'),
  item('dam-maxi', 'Đầm maxi', 'dam', 'dress', 'nu', 'dress', { bodice: 'strap', neck: 'v', skirt: 'flowy', length: 'maxi' }, 'trang-nga', { pattern: 'floral', color2: 'xanh-ngoc' }),
  item('dam-so-mi', 'Đầm sơ mi', 'dam', 'dress', 'nu', 'dress', { bodice: 'short', neck: 'collar', skirt: 'a-line', length: 'midi', buttons: true, belt: true }, 'xanh-baby'),
  item('dam-hoa-nhi', 'Đầm hoa nhí', 'dam', 'dress', 'nu', 'dress', { bodice: 'short', neck: 'square', skirt: 'flare', length: 'midi', puff: true }, 'vang-bo', { pattern: 'floral', color2: 'trang' }),
  item('dam-lua', 'Đầm lụa hai dây', 'dam', 'dress', 'nu', 'dress', { bodice: 'strap', neck: 'cowl', skirt: 'bias', length: 'midi' }, 'vang-bo'),
  item('ao-dai', 'Áo dài', 'dam', 'dress', 'unisex', 'aodai', { panel: 'long' }, 'do', { color2: 'trang' }),

  // ---------- Giày dép ----------
  item('sneaker-trang', 'Giày sneaker trắng', 'giay', 'shoes', 'unisex', 'shoe', { type: 'sneaker' }, 'trang', { color2: 'xam' }),
  item('sneaker-retro', 'Giày sneaker retro', 'giay', 'shoes', 'unisex', 'shoe', { type: 'chunky' }, 'kem', { color2: 'navy' }),
  item('runner', 'Giày chạy bộ (runner)', 'giay', 'shoes', 'unisex', 'shoe', { type: 'runner' }, 'xam', { color2: 'cam-dat' }),
  item('giay-oxford', 'Giày tây Oxford', 'giay', 'shoes', 'nam', 'shoe', { type: 'oxford' }, 'den'),
  item('giay-derby', 'Giày derby', 'giay', 'shoes', 'nam', 'shoe', { type: 'derby' }, 'nau'),
  item('loafer', 'Giày lười (loafer)', 'giay', 'shoes', 'unisex', 'shoe', { type: 'loafer' }, 'nau'),
  item('boat-shoes', 'Giày boat', 'giay', 'shoes', 'nam', 'shoe', { type: 'boat' }, 'camel'),
  item('chelsea-boot', 'Bốt Chelsea', 'giay', 'shoes', 'unisex', 'shoe', { type: 'chelsea' }, 'nau', { color2: 'den' }),
  item('bot-cao-co', 'Bốt cao cổ', 'giay', 'shoes', 'nu', 'shoe', { type: 'tallboot' }, 'den'),
  item('cao-got', 'Giày cao gót', 'giay', 'shoes', 'nu', 'shoe', { type: 'heel' }, 'be'),
  item('slingback', 'Giày slingback', 'giay', 'shoes', 'nu', 'shoe', { type: 'slingback' }, 'den'),
  item('giay-bup-be', 'Giày búp bê', 'giay', 'shoes', 'nu', 'shoe', { type: 'flat' }, 'den'),
  item('sandal', 'Sandal quai ngang', 'giay', 'shoes', 'unisex', 'shoe', { type: 'sandal' }, 'nau'),
  item('sandal-de-xuong', 'Sandal đế xuồng', 'giay', 'shoes', 'nu', 'shoe', { type: 'wedge' }, 'be', { color2: 'camel' }),
  item('dep-da', 'Dép da', 'giay', 'shoes', 'unisex', 'shoe', { type: 'slide' }, 'nau'),

  // ---------- Túi ----------
  item('tui-xach', 'Túi xách tay', 'tui', 'bag', 'nu', 'bag', { type: 'handbag' }, 'nau'),
  item('tui-tote', 'Túi tote', 'tui', 'bag', 'unisex', 'bag', { type: 'tote' }, 'be'),
  item('tui-deo-cheo', 'Túi đeo chéo', 'tui', 'bag', 'unisex', 'bag', { type: 'crossbody' }, 'den'),
  item('balo', 'Ba lô', 'tui', 'bag', 'unisex', 'bag', { type: 'backpack' }, 'den'),
  item('clutch', 'Ví cầm tay (clutch)', 'tui', 'bag', 'nu', 'bag', { type: 'clutch' }, 'vang-gold'),

  // ---------- Mũ nón ----------
  item('mu-luoi-trai', 'Mũ lưỡi trai', 'mu', 'hat', 'unisex', 'hat', { type: 'cap' }, 'navy'),
  item('mu-bucket', 'Mũ bucket', 'mu', 'hat', 'unisex', 'hat', { type: 'bucket' }, 'kem'),
  item('mu-rong-vanh', 'Mũ rộng vành', 'mu', 'hat', 'nu', 'hat', { type: 'wide' }, 'be', { color2: 'den' }),
  item('mu-beret', 'Mũ nồi (beret)', 'mu', 'hat', 'nu', 'hat', { type: 'beret' }, 'burgundy'),
  item('mu-len', 'Mũ len (beanie)', 'mu', 'hat', 'unisex', 'hat', { type: 'beanie' }, 'xam', { pattern: 'knit', color2: 'xam-than' }),
  item('mu-fedora', 'Mũ phớt (fedora)', 'mu', 'hat', 'unisex', 'hat', { type: 'fedora' }, 'camel', { color2: 'nau' }),
  item('non-la', 'Nón lá', 'mu', 'hat', 'unisex', 'hat', { type: 'conical' }, 'kem', { color2: 'camel' }),

  // ---------- Kính ----------
  item('kinh-ram', 'Kính râm', 'kinh', 'glasses', 'unisex', 'glasses', { type: 'sun' }, 'den'),
  item('kinh-tron', 'Kính gọng tròn', 'kinh', 'glasses', 'unisex', 'glasses', { type: 'round' }, 'vang-gold'),
  item('kinh-mat-meo', 'Kính mắt mèo', 'kinh', 'glasses', 'nu', 'glasses', { type: 'cateye' }, 'nau'),

  // ---------- Đồng hồ ----------
  item('dong-ho-da', 'Đồng hồ dây da', 'dongho', 'watch', 'unisex', 'watch', { type: 'leather' }, 'nau', { color2: 'trang' }),
  item('dong-ho-kim-loai', 'Đồng hồ dây kim loại', 'dongho', 'watch', 'unisex', 'watch', { type: 'metal' }, 'bac', { color2: 'navy' }),
  item('dong-ho-the-thao', 'Đồng hồ thể thao', 'dongho', 'watch', 'unisex', 'watch', { type: 'sport' }, 'den', { color2: 'den' }),

  // ---------- Trang sức ----------
  item('day-chuyen', 'Dây chuyền mảnh', 'trangsuc', 'necklace', 'unisex', 'necklace', { type: 'chain' }, 'vang-gold'),
  item('vong-ngoc-trai', 'Vòng cổ ngọc trai', 'trangsuc', 'necklace', 'nu', 'necklace', { type: 'pearl' }, 'trang'),
  item('khuyen-tai', 'Khuyên tai', 'trangsuc', 'earrings', 'nu', 'earrings', { type: 'drop' }, 'vang-gold'),
  item('vong-tay', 'Vòng tay', 'trangsuc', 'bracelet', 'unisex', 'bracelet', { type: 'bangle' }, 'bac'),

  // ---------- Phụ kiện khác ----------
  item('khan-choang', 'Khăn choàng len', 'phukien', 'scarf', 'unisex', 'scarf', { type: 'wrap' }, 'camel', { pattern: 'caro', color2: 'nau' }),
  item('khan-lua', 'Khăn lụa thắt cổ', 'phukien', 'scarf', 'nu', 'scarf', { type: 'neckerchief' }, 'cam-dat'),
  item('that-lung', 'Thắt lưng da', 'phukien', 'belt', 'unisex', 'belt', { type: 'leather' }, 'nau', { color2: 'vang-gold' }),
  item('ca-vat', 'Cà vạt', 'phukien', 'neckwear', 'nam', 'tie', { type: 'tie' }, 'burgundy'),
  item('no-co', 'Nơ cổ (bow tie)', 'phukien', 'neckwear', 'nam', 'tie', { type: 'bowtie' }, 'den'),
]

export const WARDROBE_BY_ID = Object.fromEntries(WARDROBE.map((entry) => [entry.id, entry]))

// Mặc đầm/áo dài thì bỏ áo + quần, mặc áo hoặc quần thì bỏ đầm
export const SLOT_CONFLICTS = {
  dress: ['top', 'bottom'],
  top: ['dress'],
  bottom: ['dress'],
}

// Thứ tự hiển thị danh sách "đang mặc"
export const SLOT_ORDER = ['hat', 'glasses', 'earrings', 'necklace', 'scarf', 'neckwear', 'outer', 'top', 'dress', 'belt', 'bottom', 'watch', 'bracelet', 'bag', 'shoes']
