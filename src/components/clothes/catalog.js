import {
  Boot,
  Dress,
  Handbag,
  Hat,
  Heel,
  Hoodie,
  Jacket,
  Pants,
  Scarf,
  Shirt,
  Shorts,
  Skirt,
  Sneaker,
  Sunglasses,
  Tie,
  Tote,
  TShirt,
  Watch,
} from './ClothShapes'

// Thứ tự xen kẽ để hai bên màn hình đều có cả áo, quần, giày và phụ kiện.
// size: hệ số kích thước để món to/nhỏ trông cân đối khi đặt cạnh nhau.
export const CLOTHES = [
  { id: 'dress', label: 'Đầm', Shape: Dress, color: '#e8a6a1', detail: '#a8504b', size: 1.15 },
  { id: 'jacket', label: 'Áo khoác', Shape: Jacket, color: '#3f4a5c', detail: '#232a35', size: 1.1 },
  { id: 'sneaker', label: 'Giày thể thao', Shape: Sneaker, color: '#fbfaf7', detail: '#c8664a', size: 0.9 },
  { id: 'hat', label: 'Mũ rộng vành', Shape: Hat, color: '#e6cf9f', detail: '#3b3a36', size: 0.95 },
  { id: 'tshirt', label: 'Áo thun', Shape: TShirt, color: '#f4c9b5', detail: '#c8664a', size: 1 },
  { id: 'handbag', label: 'Túi xách', Shape: Handbag, color: '#c98f62', detail: '#7b4a2b', size: 0.9 },
  { id: 'sunglasses', label: 'Kính râm', Shape: Sunglasses, color: '#2c2b33', detail: '#b8924f', size: 0.85 },
  { id: 'pants', label: 'Quần kaki', Shape: Pants, color: '#cdb89a', detail: '#8a7556', size: 1.1 },
  { id: 'heel', label: 'Giày cao gót', Shape: Heel, color: '#b2273c', detail: '#5c1320', size: 0.85 },
  { id: 'hoodie', label: 'Áo hoodie', Shape: Hoodie, color: '#9fb59a', detail: '#56694f', size: 1.05 },
  { id: 'scarf', label: 'Khăn choàng', Shape: Scarf, color: '#cfa9d6', detail: '#7c5a86', size: 0.95 },
  { id: 'boot', label: 'Bốt da', Shape: Boot, color: '#7a5233', detail: '#3d2918', size: 0.9 },
  { id: 'shirt', label: 'Sơ mi', Shape: Shirt, color: '#dfe8f3', detail: '#6f86a6', size: 1.05 },
  { id: 'tote', label: 'Túi tote', Shape: Tote, color: '#efe6d3', detail: '#8b7a58', size: 0.9 },
  { id: 'skirt', label: 'Chân váy', Shape: Skirt, color: '#f0d58f', detail: '#a8853c', size: 0.95 },
  { id: 'tie', label: 'Cà vạt', Shape: Tie, color: '#2f4f80', detail: '#1b2d4b', size: 0.8 },
  { id: 'watch', label: 'Đồng hồ', Shape: Watch, color: '#d9b66e', detail: '#5a4632', size: 0.75 },
  { id: 'shorts', label: 'Quần short', Shape: Shorts, color: '#8db4d4', detail: '#4c7394', size: 0.9 },
]

export const CLOTHES_BY_ID = Object.fromEntries(CLOTHES.map((item) => [item.id, item]))
