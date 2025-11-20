import { Project, Task, TaskStatus, Priority, User, FeedPost, TimeLog, AutomationRule } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Hüseyin Öztürk',
  avatar: 'https://ui-avatars.com/api/?name=Huseyin+Ozturk&background=ea580c&color=fff',
  role: 'admin',
  department: 'Kurucu Ortak',
  email: 'huozturk@hotmail.com',
  isOnline: true,
  statusMessage: 'Yatırımcı toplantısında 💼'
};

export const USERS: User[] = [
  CURRENT_USER,
  { 
    id: 'u2', 
    name: 'Burak Yılmaz', 
    avatar: 'https://ui-avatars.com/api/?name=Burak+Yilmaz&background=random', 
    role: 'manager', 
    department: 'Executive Chef', 
    email: 'burak@drburger.tr', 
    phone: '+90 555 123 45 67',
    isOnline: true,
    statusMessage: 'Yeni menü Ar-Ge çalışmasında 🍔'
  },
  { 
    id: 'u3', 
    name: 'Selin Demir', 
    avatar: 'https://ui-avatars.com/api/?name=Selin+Demir&background=random', 
    role: 'manager', 
    department: 'Genel Koordinatör', 
    email: 'selin@drburger.tr', 
    phone: '+90 555 987 65 43',
    isOnline: false,
    lastActive: '1 saat önce',
    statusMessage: 'Şube denetiminde'
  },
  { 
    id: 'u4', 
    name: 'Ali Çevik', 
    avatar: 'https://ui-avatars.com/api/?name=Ali+Cevik&background=random', 
    role: 'manager', 
    department: 'Bölge Müdürü (Anadolu)', 
    email: 'ali@drburger.tr', 
    phone: '+90 555 444 33 22',
    isOnline: true,
    statusMessage: 'Kadıköy şubesi toplantı'
  },
];

export const PROJECTS: Project[] = [
  { id: 'p1', name: 'Franchise Genişleme', description: 'Yeni şube başvurularının değerlendirilmesi', members: ['u1', 'u3'], icon: '📈' },
  { id: 'p2', name: 'Menü Ar-Ge 2025', description: 'Yaz sezonu yeni ürün çalışmaları', members: ['u1', 'u2'], icon: '🧪' },
  { id: 'p3', name: 'Mali Denetim', description: 'Aylık ciro ve gider analizleri', members: ['u1', 'u3', 'u4'], icon: '📊' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Yatırımcı Sunumu Hazırlığı',
    description: 'Q3 büyüme hedefleri ve franchise stratejisi sunumu revize edilecek.',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    assignee: 'Hüseyin Öztürk',
    projectId: 'p1',
    subtasks: [
      { id: 'st1', title: 'Mali verileri güncelle', completed: true },
      { id: 'st2', title: 'Konsept tasarımları ekle', completed: false }
    ],
    timeSpent: 120,
    isTracking: true,
    comments: []
  },
  {
    id: 't2',
    title: 'Tedarikçi Sözleşmeleri',
    description: 'Et tedarikçisi ile yıllık fiyat sabitleme görüşmesi yapılacak.',
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    assignee: 'Selin Demir',
    projectId: 'p3',
    subtasks: [],
    timeSpent: 0,
    isTracking: false,
    comments: []
  },
  {
    id: 't3',
    title: 'Truffle Sos Tadım Onayı',
    description: 'Executive Chef Burak Bey\'in hazırladığı yeni sosun son onayı.',
    status: TaskStatus.REVIEW,
    priority: Priority.MEDIUM,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    assignee: 'Burak Yılmaz',
    projectId: 'p2',
    subtasks: [],
    timeSpent: 45,
    isTracking: false,
    comments: []
  }
];

export const INITIAL_FEED: FeedPost[] = [
  {
    id: 'f1',
    author: 'Selin Demir',
    avatar: 'https://ui-avatars.com/api/?name=Selin+Demir&background=random',
    content: 'Geçen ayın şube karlılık raporları sisteme yüklendi. Anadolu yakası şubelerinde %15 ciro artışı var, tebrikler Ali Bey! 👏',
    timestamp: Date.now() - 3600000,
    likes: 5,
    isLiked: false,
    comments: [
      {
        id: 'c1',
        authorId: 'u4',
        authorName: 'Ali Çevik',
        avatar: 'https://ui-avatars.com/api/?name=Ali+Cevik&background=random',
        text: 'Teşekkürler Selin Hanım, ekip çok sıkı çalıştı.',
        timestamp: Date.now() - 1800000
      }
    ],
    type: 'post'
  },
  {
    id: 'f2',
    author: 'Yönetim Kurulu',
    avatar: 'https://ui-avatars.com/api/?name=Dr+Burger&background=ea580c&color=fff',
    content: '📢 Yönetim Toplantısı Notları: Yeni franchise bedelleri güncellendi. Detaylar mail olarak iletildi.',
    timestamp: Date.now() - 86400000,
    likes: 8,
    isLiked: true,
    comments: [],
    type: 'announcement'
  }
];

export const INITIAL_TIME_LOGS: TimeLog[] = [
  { 
    id: 'tl1', 
    user_id: 'u1', 
    check_in: new Date(Date.now() - 86400000).toISOString(), 
    check_out: new Date(Date.now() - 86400000 + 28800000).toISOString(), 
    total_minutes: 480 
  },
];

export const INITIAL_AUTOMATION_RULES: AutomationRule[] = [
  { id: 'ar1', name: 'Haftalık Rapor Hatırlat', trigger: 'Her Cuma 17:00', action: 'Tüm müdürlere bildirim gönder', isActive: true },
  { id: 'ar2', name: 'Bütçe Aşımı Uyarısı', trigger: 'Proje bütçesi > %90', action: 'Yönetime mail at', isActive: true },
];