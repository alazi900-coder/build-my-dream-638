export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    en: string[];
    ar: string[];
  };
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2024-12-23",
    changes: {
      en: [
        "Added offline mode with section-based downloads",
        "New auto-update toggle for manual control",
        "Update notification badge in navigation",
        "Improved Service Worker caching",
      ],
      ar: [
        "إضافة وضع بدون إنترنت مع تحميل حسب القسم",
        "خيار جديد للتحكم بالتحديث التلقائي",
        "شارة إشعار التحديث في التنقل",
        "تحسين التخزين المؤقت",
      ],
    },
  },
  {
    version: "1.1.0",
    date: "2024-12-20",
    changes: {
      en: [
        "Added team builder with type coverage analysis",
        "New gym battle recommendations",
        "Pokémon comparison feature",
        "Bilingual support (English & Arabic)",
      ],
      ar: [
        "إضافة بناء الفريق مع تحليل تغطية الأنواع",
        "توصيات جديدة لمعارك الصالات",
        "ميزة مقارنة البوكيمون",
        "دعم ثنائي اللغة (إنجليزي وعربي)",
      ],
    },
  },
  {
    version: "1.0.0",
    date: "2024-12-15",
    changes: {
      en: [
        "Initial release",
        "Complete Pokédex with stats and moves",
        "Items and locations database",
        "Dark and light theme support",
      ],
      ar: [
        "الإصدار الأول",
        "بوكيديكس كامل مع الإحصائيات والحركات",
        "قاعدة بيانات الأدوات والمواقع",
        "دعم المظهر الداكن والفاتح",
      ],
    },
  },
];

export const currentVersion = "1.2.0";
