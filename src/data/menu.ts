import { FoodMenuItem } from "../types";

/**
 * Kategori menu mengikuti urutan tampil di aplikasi tamu. Nilainya dipakai
 * sebagai key terjemahan `menu.cat.<kategori>`.
 */
export const MENU_CATEGORIES = ["breakfast", "main", "snacks", "dessert", "drinks"] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70`;

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type MenuSeed = Omit<FoodMenuItem, "formattedPrice" | "available"> & {
  category: MenuCategory;
  /**
   * Kata yang dipakai mesin klasifikasi cadangan untuk mengenali item ini di
   * chat, dalam berbagai bahasa. Huruf kecil semua.
   */
  keywords: string[];
};

const items: MenuSeed[] = [
  // ---------------- Breakfast ----------------
  {
    id: "fm-10",
    name: "Avocado & Poached Egg Bowl",
    nameIndo: "Mangkuk Alpukat & Telur",
    category: "breakfast",
    price: 95000,
    description: "Smashed avocado, poached eggs, heirloom greens and toasted seeds.",
    dietary: ["Vegetarian"],
    prepTime: "15 m",
    image: img("1482049016688-2d3e1b311543"),
    keywords: ["avocado", "alpukat", "poached egg"],
  },
  {
    id: "fm-11",
    name: "Brioche French Toast",
    nameIndo: "French Toast Brioche",
    category: "breakfast",
    price: 85000,
    description: "Thick-cut brioche, fresh berries, banana and palm sugar syrup.",
    dietary: ["Vegetarian"],
    prepTime: "15 m",
    image: img("1484723091739-30a097e8f929"),
    keywords: ["french toast", "roti bakar"],
  },
  {
    id: "fm-12",
    name: "Buttermilk Pancakes",
    nameIndo: "Pancake Buttermilk",
    category: "breakfast",
    price: 80000,
    description: "Three fluffy pancakes, blueberries, banana and maple syrup.",
    dietary: ["Vegetarian"],
    prepTime: "15 m",
    image: img("1528207776546-365bb710ee93"),
    keywords: ["pancake", "panekuk", "パンケーキ", "팬케이크", "松饼", "блин"],
  },
  {
    id: "fm-13",
    name: "Full English Breakfast",
    nameIndo: "Sarapan Inggris Lengkap",
    category: "breakfast",
    price: 125000,
    description: "Eggs your way, chicken sausage, grilled tomato, mushrooms and toast.",
    dietary: ["Halal"],
    prepTime: "20 m",
    image: img("1533089860892-a7c6f0a88666"),
    keywords: ["english breakfast", "sarapan lengkap", "sausage", "sosis"],
    isPopular: true,
  },
  {
    id: "fm-14",
    name: "Greek Yogurt Parfait",
    nameIndo: "Parfait Yogurt",
    category: "breakfast",
    price: 65000,
    description: "Greek yogurt layered with granola, strawberries and local honey.",
    dietary: ["Vegetarian", "Gluten-Free"],
    prepTime: "5 m",
    image: img("1488477181946-6428a0291777"),
    keywords: ["yogurt", "yoghurt", "parfait", "granola"],
  },

  // ---------------- Main course ----------------
  {
    id: "fm-1",
    name: "Nasi Goreng Kampung",
    nameIndo: "Nasi Goreng Kampung",
    category: "main",
    price: 135000,
    description: "Wok-fried rice with chicken satay, fried egg, pickles and prawn crackers.",
    dietary: ["Halal"],
    prepTime: "20 m",
    image: img("1603133872878-684f208fb84b"),
    keywords: ["nasi goreng", "fried rice", "炒饭", "チャーハン", "ナシゴレン", "볶음밥", "나시고랭", "жареный рис", "riz frit", "gebratener reis"],
    isPopular: true,
  },
  {
    id: "fm-2",
    name: "Sate Lilit & Sambal Matah",
    nameIndo: "Sate Lilit Khas Bali",
    category: "main",
    price: 145000,
    description: "Balinese minced fish and chicken satay on lemongrass, with sambal matah.",
    dietary: ["Halal", "Gluten-Free"],
    prepTime: "25 m",
    image: img("1544025162-d76694265947"),
    keywords: ["sate", "satay", "サテ", "沙爹", "사테"],
  },
  {
    id: "fm-3",
    name: "Grilled Oxtail Soup",
    nameIndo: "Sop Buntut Bakar",
    category: "main",
    price: 195000,
    description: "Charred oxtail in clear spiced broth, served with rice and green chilli sambal.",
    dietary: ["Halal"],
    prepTime: "25 m",
    image: img("1547928576-a4a33237cbc3"),
    keywords: ["sop buntut", "oxtail", "soup", "sup"],
  },
  {
    id: "fm-15",
    name: "Grilled Prawn Rice",
    nameIndo: "Nasi Udang Bakar",
    category: "main",
    price: 165000,
    description: "Jimbaran-style grilled prawns, steamed rice and shallot sambal.",
    dietary: ["Pescatarian", "Halal"],
    prepTime: "25 m",
    image: img("1559847844-5315695dadae"),
    keywords: ["prawn", "udang", "shrimp", "海老", "虾", "새우"],
  },
  {
    id: "fm-4",
    name: "Wagyu Beef Burger",
    nameIndo: "Burger Wagyu",
    category: "main",
    price: 185000,
    description: "Wagyu patty, aged cheddar, caramelised onion and fries.",
    dietary: [],
    prepTime: "20 m",
    image: img("1568901346375-23c9450c58cd"),
    keywords: ["burger", "hamburger", "バーガー", "汉堡", "버거", "бургер"],
  },
  {
    id: "fm-5",
    name: "Lobster Spaghetti",
    nameIndo: "Spaghetti Lobster",
    category: "main",
    price: 220000,
    description: "Spaghetti with lobster, tiger prawns, cherry tomato and chilli.",
    dietary: ["Pescatarian"],
    prepTime: "25 m",
    image: img("1563379091339-03b21ab4a4f8"),
    keywords: ["spaghetti", "pasta", "lobster", "スパゲッティ", "意大利面", "스파게티"],
  },
  {
    id: "fm-16",
    name: "Garden Buddha Bowl",
    nameIndo: "Buddha Bowl Sayur",
    category: "main",
    price: 110000,
    description: "Quinoa, roasted vegetables, chickpeas, avocado and tahini.",
    dietary: ["Vegan", "Gluten-Free"],
    prepTime: "15 m",
    image: img("1512621776951-a57141f2eefd"),
    keywords: ["salad", "salat", "buddha bowl", "vegan", "サラダ", "沙拉", "샐러드"],
  },

  // ---------------- Snacks ----------------
  {
    id: "fm-17",
    name: "Truffle Fries",
    nameIndo: "Kentang Goreng Truffle",
    category: "snacks",
    price: 65000,
    description: "Crisp fries, truffle oil and parmesan.",
    dietary: ["Vegetarian"],
    prepTime: "10 m",
    image: img("1573080496219-bb080dd4f877"),
    keywords: ["fries", "kentang goreng", "french fries", "ポテト", "薯条", "감자튀김", "картофель фри", "frites", "pommes"],
  },
  {
    id: "fm-18",
    name: "Vegetable Samosas",
    nameIndo: "Samosa Sayur",
    category: "snacks",
    price: 55000,
    description: "Four crisp samosas with mint yogurt and tamarind chutney.",
    dietary: ["Vegetarian"],
    prepTime: "12 m",
    image: img("1601050690597-df0568f70950"),
    keywords: ["samosa"],
  },
  {
    id: "fm-19",
    name: "Club Sandwich",
    nameIndo: "Club Sandwich",
    category: "snacks",
    price: 95000,
    description: "Chicken, turkey ham, egg, lettuce and tomato on toasted bread.",
    dietary: ["Halal"],
    prepTime: "15 m",
    image: img("1525351484163-7529414344d8"),
    keywords: ["sandwich", "roti isi", "サンドイッチ", "三明治", "샌드위치"],
  },

  // ---------------- Dessert ----------------
  {
    id: "fm-7",
    name: "Warm Chocolate Lava Cake",
    nameIndo: "Kue Lava Cokelat",
    category: "dessert",
    price: 85000,
    description: "Molten dark chocolate cake with vanilla bean ice cream.",
    dietary: ["Vegetarian"],
    prepTime: "15 m",
    image: img("1606313564200-e75d5e30476c"),
    keywords: ["lava cake", "chocolate cake", "kue cokelat", "ケーキ", "蛋糕", "케이크"],
    isPopular: true,
  },
  {
    id: "fm-6",
    name: "Dragon Fruit Açaí Bowl",
    nameIndo: "Açaí Bowl Buah Naga",
    category: "dessert",
    price: 95000,
    description: "Açaí and dragon fruit blend, granola, coconut and fresh fruit.",
    dietary: ["Vegan", "Gluten-Free"],
    prepTime: "10 m",
    image: img("1590301157890-4810ed352733"),
    keywords: ["acai", "açaí", "dragon fruit", "buah naga"],
  },
  {
    id: "fm-20",
    name: "Chocolate Sundae",
    nameIndo: "Sundae Cokelat",
    category: "dessert",
    price: 70000,
    description: "Vanilla and chocolate ice cream, fudge sauce and roasted nuts.",
    dietary: ["Vegetarian"],
    prepTime: "5 m",
    image: img("1563805042-7684c019e1cb"),
    keywords: ["ice cream", "es krim", "sundae", "アイス", "冰淇淋", "아이스크림", "мороженое", "glace", "eis"],
  },
  {
    id: "fm-21",
    name: "Berry Tart",
    nameIndo: "Tart Beri",
    category: "dessert",
    price: 75000,
    description: "Butter pastry with vanilla custard and mixed berries.",
    dietary: ["Vegetarian"],
    prepTime: "5 m",
    image: img("1464305795204-6f5bbfc7fb81"),
    keywords: ["tart", "pie", "dessert", "makanan penutup", "デザート", "甜点", "디저트"],
  },

  // ---------------- Drinks ----------------
  {
    id: "fm-22",
    name: "Fresh Orange Juice",
    nameIndo: "Jus Jeruk Segar",
    category: "drinks",
    price: 45000,
    description: "Freshly squeezed Kintamani oranges.",
    dietary: ["Vegan"],
    prepTime: "5 m",
    image: img("1600271886742-f049cd451bba"),
    keywords: ["orange juice", "jus jeruk", "オレンジジュース", "橙汁", "오렌지 주스", "апельсиновый сок", "jus d'orange", "orangensaft"],
    isPopular: true,
  },
  {
    id: "fm-8",
    name: "Young Coconut",
    nameIndo: "Kelapa Muda Segar",
    category: "drinks",
    price: 55000,
    description: "Chilled young coconut, served whole.",
    dietary: ["Vegan"],
    prepTime: "5 m",
    image: img("1525385133512-2f3bdd039054"),
    keywords: ["coconut", "kelapa", "ココナッツ", "椰子", "코코넛"],
  },
  {
    id: "fm-9",
    name: "Bali Highlands Latte",
    nameIndo: "Kopi Latte Bali",
    category: "drinks",
    price: 50000,
    description: "Single-origin Kintamani espresso with steamed milk.",
    dietary: ["Vegetarian"],
    prepTime: "5 m",
    image: img("1509042239860-f550ce710b93"),
    keywords: ["latte", "coffee", "kopi", "cappuccino", "コーヒー", "咖啡", "커피", "кофе", "café", "kaffee"],
  },
  {
    id: "fm-23",
    name: "Ginger Lemongrass Tea",
    nameIndo: "Teh Jahe Serai",
    category: "drinks",
    price: 40000,
    description: "Hot tea brewed with fresh ginger, lemongrass and honey.",
    dietary: ["Vegan"],
    prepTime: "5 m",
    image: img("1576092768241-dec231879fc3"),
    keywords: ["tea", "teh", "お茶", "茶", "차", "чай", "thé", "tee"],
  },
  {
    id: "fm-24",
    name: "Tropical Mocktail",
    nameIndo: "Mocktail Tropis",
    category: "drinks",
    price: 60000,
    description: "Passion fruit, lime, mint and soda. Alcohol-free.",
    dietary: ["Vegan"],
    prepTime: "5 m",
    image: img("1544145945-f90425340c7e"),
    keywords: ["mocktail", "cocktail"],
  },
];

export const FOOD_MENU: (FoodMenuItem & { keywords: string[] })[] = items.map((i) => ({
  ...i,
  formattedPrice: rp(i.price),
  available: true,
}));

/**
 * Mencari item menu yang disebut di sebuah kalimat. Dipakai mesin klasifikasi
 * cadangan di server; hasilnya berupa draf yang tetap harus dikonfirmasi tamu.
 */
export function findMenuItemsInText(text: string): { menuId: string; qty: number }[] {
  const lower = text.toLowerCase();
  const found: { menuId: string; qty: number; at: number }[] = [];
  for (const item of FOOD_MENU) {
    for (const kw of item.keywords) {
      const at = indexOfKeyword(lower, kw);
      if (at === -1) continue;
      if (!found.some((f) => f.menuId === item.id)) {
        found.push({ menuId: item.id, qty: quantityBefore(lower, at), at });
      }
      break;
    }
  }
  return found.sort((a, b) => a.at - b.at).map(({ menuId, qty }) => ({ menuId, qty }));
}

/**
 * Kata berhuruf Latin/Kiril harus berdiri sebagai kata utuh ("tea" tidak boleh
 * cocok dengan "steak", "pie" tidak boleh cocok dengan "piece"). Aksara Jepang,
 * Mandarin, dan Korea tidak memakai spasi, jadi cukup dicari sebagai potongan.
 */
export function indexOfKeyword(lower: string, kw: string): number {
  if (/[぀-ヿ一-鿿가-힯]/.test(kw)) return lower.indexOf(kw);
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Kata Kiril ditulis sebagai akar kata ("полотенц" untuk полотенце/полотенца),
  // jadi cukup cocok di awal kata.
  if (/[Ѐ-ӿ]/.test(kw)) {
    const m = new RegExp(`(^|[^\\p{L}])${escaped}`, "u").exec(lower);
    return m ? m.index + m[1].length : -1;
  }
  const m = new RegExp(`(^|[^\\p{L}])${escaped}(e?s)?(?=[^\\p{L}]|$)`, "u").exec(lower);
  return m ? m.index + m[1].length : -1;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, a: 1, an: 1,
  satu: 1, dua: 2, tiga: 3, empat: 4, se: 1,
};

/** Angka tepat sebelum nama menu: "2 nasi goreng", "two orange juices". */
function quantityBefore(lower: string, at: number): number {
  const before = lower.slice(Math.max(0, at - 14), at).trim().split(/\s+/);
  const last = before[before.length - 1] || "";
  const n = parseInt(last.replace(/x$/, ""), 10);
  if (!Number.isNaN(n) && n > 0 && n < 20) return n;
  return NUMBER_WORDS[last] || 1;
}
