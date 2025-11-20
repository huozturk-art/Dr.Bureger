import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bell, 
  Search, 
  Menu, 
  Plus, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  MoreHorizontal, 
  Sparkles,
  List,
  Columns,
  GanttChartSquare,
  Users,
  ChevronLeft,
  Lock,
  Mail,
  Phone,
  LogOut,
  PlayCircle,
  StopCircle,
  Settings,
  Heart,
  Share2,
  Image as ImageIcon,
  Paperclip,
  Send,
  X,
  Trash2,
  Edit,
  Globe,
  Briefcase,
  Shield,
  UserCircle,
  Loader2,
  Video,
  Calendar,
  Flag,
  Save,
  Zap,
  Utensils,
  ChefHat,
  Briefcase as BusinessCase,
  FileText
} from 'lucide-react';
import { 
  Task, 
  TaskStatus, 
  Project, 
  ViewMode, 
  FeedPost, 
  SubTask,
  User,
  TimeLog,
  AutomationRule,
  FeedComment,
  Priority,
  Message
} from './types';
import { generateSubtasks, analyzeWorkload } from './services/aiService';
import { supabaseService, supabase } from './services/supabase';
import { INITIAL_AUTOMATION_RULES, PROJECTS } from './constants';

// --- Helper Components ---

const Avatar = ({ src, alt, size = "sm" }: { src: string; alt: string; size?: "sm" | "md" | "lg" | "xl" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };
  return (
    <img 
      src={src || `https://ui-avatars.com/api/?name=${alt || 'User'}&background=random`} 
      alt={alt || 'User'} 
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0 bg-gray-200`} 
    />
  );
};

const Badge = ({ children, color = "orange" }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    blue: "bg-orange-100 text-orange-700", // Dr. Burger Primary
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    gray: "bg-gray-100 text-gray-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colors[color] || colors.orange}`}>
      {children}
    </span>
  );
};

// --- Main App Component ---

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  // Default credentials (can be overwritten by localStorage)
  const [email, setEmail] = useState('huozturk@hotmail.com');
  const [password, setPassword] = useState('Sanane12--');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState<'feed' | 'tasks' | 'chat' | 'menu'>('feed');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); 
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [activeTimeLog, setActiveTimeLog] = useState<TimeLog | null>(null);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(INITIAL_AUTOMATION_RULES);
  
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [workloadSummary, setWorkloadSummary] = useState<string>('');
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Header Actions State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Feed & Create Post State
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileData, setTempProfileData] = useState({ statusMessage: '', phone: '' });
  
  // Create Task State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  
  // Post Settings State
  const [postAudience, setPostAudience] = useState<'ALL' | 'MANAGEMENT' | 'DEVS'>('ALL');
  const [isAudienceMenuOpen, setIsAudienceMenuOpen] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  
  // Media State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Menu Sub-pages State
  const [menuPage, setMenuPage] = useState<'main' | 'employees' | 'time' | 'reports' | 'automation' | 'settings'>('main');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRuleData, setNewRuleData] = useState({ name: '', trigger: '', action: '' });
  const [appSettings, setAppSettings] = useState({ notifications: true, darkMode: false });
  
  // --- Auth & Data Loading ---

  // Check for saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('drburger_email');
    const savedPassword = localStorage.getItem('drburger_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await loadUserData();
        } else {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Session check error", e);
        setIsLoading(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadUserData();
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setTasks([]);
        setFeed([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await supabaseService.getCurrentUserProfile();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // Load App Data
        const [dbTasks, dbProjects, dbFeed, dbUsers, dbLogs] = await Promise.all([
          supabaseService.getTasks(),
          supabaseService.getProjects(),
          supabaseService.getFeed(),
          supabaseService.getUsers(),
          supabaseService.getTimeLogs(user.id)
        ]);
        
        setTasks(dbTasks);
        setProjects(dbProjects.length ? dbProjects : PROJECTS); 
        setFeed(dbFeed);
        setUsers(dbUsers);
        setTimeLogs(dbLogs);
        
        // Check active log
        const active = dbLogs.find(l => !l.check_out);
        if (active) setActiveTimeLog(active);
        
      }
    } catch (error) {
      console.error('Data loading failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Realtime Chat Subscriptions
  useEffect(() => {
    if (activeTab === 'chat' && isAuthenticated) {
      // Initial fetch
      const fetchMessages = async () => {
        const msgs = await supabaseService.getMessages('general');
        setChatMessages(msgs);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      };
      fetchMessages();

      // Realtime subscription
      const channel = supabaseService.subscribeToMessages((newMsg) => {
        setChatMessages(prev => [...prev, newMsg]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeTab, isAuthenticated]);

  // --- Logic Handlers ---

  const filteredTasks = tasks.filter(t => selectedProject ? t.projectId === selectedProject : true);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await supabaseService.updateTask(taskId, { status: newStatus });
  };

  const toggleTimer = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, isTracking: !t.isTracking };
      }
      return { ...t, isTracking: false };
    }));
  };

  const handleAiSubtasks = async (task: Task) => {
    setIsAiLoading(true);
    const newSubtaskTitles = await generateSubtasks(task.title, task.description);
    const newSubtasks: SubTask[] = newSubtaskTitles.map((title, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      title,
      completed: false
    }));
    
    const updatedSubtasks = [...(task.subtasks || []), ...newSubtasks];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: updatedSubtasks } : t));
    await supabaseService.updateTask(task.id, { subtasks: updatedSubtasks });
    setIsAiLoading(false);
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    if (!selectedTask) return;

    const updatedSubtasks = selectedTask.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // Optimistic update
    const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
    setSelectedTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    await supabaseService.updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const handleAssigneeChange = async (newAssigneeName: string) => {
      if (!selectedTask) return;
      
      const updatedTask = { ...selectedTask, assignee: newAssigneeName };
      setSelectedTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      
      await supabaseService.updateTask(selectedTask.id, { assignee: newAssigneeName });
  };

  const handleLikePost = async (postId: string) => {
    const post = feed.find(p => p.id === postId);
    if (!post) return;
    const newIsLiked = !post.isLiked;
    const newLikes = newIsLiked ? post.likes + 1 : post.likes - 1;
    setFeed(prev => prev.map(p => p.id === postId ? { ...p, isLiked: newIsLiked, likes: newLikes } : p));
    await supabaseService.toggleLike(postId, newLikes);
  };

  const toggleComments = (postId: string) => {
    const newSet = new Set(expandedComments);
    if (newSet.has(postId)) newSet.delete(postId);
    else newSet.add(postId);
    setExpandedComments(newSet);
  };

  const handlePostComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim() || !currentUser) return;
    const newComment: FeedComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      avatar: currentUser.avatar,
      text: text,
      timestamp: Date.now()
    };
    const post = feed.find(p => p.id === postId);
    if (post) {
       const updatedComments = [...post.comments, newComment];
       setFeed(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
       setCommentInputs(prev => ({ ...prev, [postId]: '' }));
       await supabaseService.addComment(postId, newComment, post.comments);
    }
  };

  const handleSavePost = async () => {
    if ((!newPostText.trim() && !selectedImage && !selectedVideo) || !currentUser) return;
    setIsSavingPost(true);
    const newPostData = {
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_avatar: currentUser.avatar,
      content: newPostText,
      image: selectedImage || undefined,
      video_url: selectedVideo || undefined,
      type: 'post' as const,
      likes: 0,
      comments: [],
      audience: postAudience
    };
    const tempId = `temp-${Date.now()}`;
    setFeed(prev => [{ ...newPostData, id: tempId, timestamp: Date.now(), isLiked: false, author: currentUser.name, avatar: currentUser.avatar } as FeedPost, ...prev]);
    try {
      const { data: savedPost, error } = await supabaseService.createPost(newPostData);
      if (error) {
        console.error("Post creation error:", error);
        alert(`Gönderi paylaşılamadı. Hata: ${error.message}`);
        setFeed(prev => prev.filter(p => p.id !== tempId));
      } else if (savedPost) {
         const dbFeed = await supabaseService.getFeed();
         setFeed(dbFeed);
      }
    } catch (err) {
      setFeed(prev => prev.filter(p => p.id !== tempId));
      alert("Bir hata oluştu.");
    }
    setNewPostText('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setEditingPostId(null);
    setIsCreatePostOpen(false);
    setIsSavingPost(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !currentUser) return;
    const newTask: Partial<Task> = {
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      status: TaskStatus.TODO,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      assignee: currentUser.name,
      subtasks: [],
      timeSpent: 0,
      isTracking: false
    };
    
    try {
      const savedTask = await supabaseService.createTask(newTask);
      if (savedTask) {
        setTasks(prev => [savedTask, ...prev]);
        setIsCreateTaskOpen(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
      }
    } catch(e: any) {
      alert("Görev oluşturulamadı: " + e.message);
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if(confirm("Bu görevi silmek istediğinize emin misiniz?")) {
      await supabaseService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTask(null);
    }
  };

  const handleEditPost = (post: FeedPost) => {
    setNewPostText(post.content);
    setSelectedImage(post.image || null);
    setSelectedVideo(post.videoUrl || null);
    setEditingPostId(post.id);
    setPostAudience(post.audience || 'ALL');
    setIsCreatePostOpen(true);
    setOpenMenuId(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) {
      setFeed(prev => prev.filter(p => p.id !== postId));
      setOpenMenuId(null);
      await supabaseService.deletePost(postId);
    }
  };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentUser) return;
    try {
      await supabaseService.sendMessage(chatInput, currentUser.id, currentUser.name);
      // Optimistic update handled by Realtime subscription, but we clear input immediately
      setChatInput('');
    } catch (e) {
      console.error("Send message error:", e);
    }
  };
  
  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    try {
        await supabaseService.updateUserProfile(currentUser.id, {
            statusMessage: tempProfileData.statusMessage,
            phone: tempProfileData.phone
        });
        // Update local state
        setCurrentUser(prev => prev ? { ...prev, statusMessage: tempProfileData.statusMessage, phone: tempProfileData.phone } : null);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, statusMessage: tempProfileData.statusMessage, phone: tempProfileData.phone } : u));
        setIsEditingProfile(false);
    } catch(e) {
        alert("Profil güncellenemedi");
    }
  };
  
  const handleToggleAutomation = (id: string) => {
      setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const handleAddAutomation = () => {
      if (!newRuleData.name) return;
      const newRule: AutomationRule = {
          id: `ar-${Date.now()}`,
          name: newRuleData.name,
          trigger: newRuleData.trigger,
          action: newRuleData.action,
          isActive: true
      };
      setAutomationRules(prev => [...prev, newRule]);
      setIsAddRuleOpen(false);
      setNewRuleData({ name: '', trigger: '', action: '' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (file.type.startsWith('video/')) {
           setSelectedVideo(result);
           setSelectedImage(null);
        } else {
           setSelectedImage(result);
           setSelectedVideo(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
            // Optimistic update
            setCurrentUser(prev => prev ? { ...prev, avatar: result } : null);
            
            // Save to DB
            await supabaseService.updateUserProfile(currentUser.id, {
                avatar: result
            });
        } catch(e) {
            console.error(e);
            alert("Profil fotoğrafı yüklenirken hata oluştu.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (activeTab === 'tasks' && isAuthenticated) {
      analyzeWorkload(tasks).then(setWorkloadSummary);
    }
  }, [activeTab, tasks, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
        await supabaseService.signIn(email, password);
        
        // Save credentials if 'Remember Me' is checked
        if (rememberMe) {
          localStorage.setItem('drburger_email', email);
          localStorage.setItem('drburger_password', password);
        } else {
          localStorage.removeItem('drburger_email');
          localStorage.removeItem('drburger_password');
        }

    } catch (error: any) {
        console.error("Login error:", error);
        let msg = error.message || 'Bilinmeyen hata';
        if (msg === 'Failed to fetch') msg = 'Bağlantı hatası.';
        else if (msg.includes('Invalid login credentials')) msg = 'Hatalı e-posta veya şifre. Kayıtlı değilseniz lütfen "Kayıt Ol" butonunu kullanın.';
        else if (msg.includes('Email not confirmed')) msg = 'Lütfen e-posta adresinizi doğrulayın.';
        setAuthError(msg);
    }
  };
  
  const handleSignUp = async () => {
    setAuthError('');
    if (password.length < 6) {
      setAuthError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    try {
        const name = email.split('@')[0];
        const data = await supabaseService.signUp(email, password, name, 'Yönetim');
        if (data.user && !data.session) {
          alert(`Kayıt başarılı! Lütfen ${email} adresine gönderilen doğrulama linkine tıklayın.`);
          setAuthError('Lütfen e-posta adresinizi onaylayın.');
        } else {
          alert('Kayıt başarılı! Giriş yapılıyor...');
        }
    } catch (error: any) {
        setAuthError('Kayıt hatası: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setActiveTab('feed');
    setMenuPage('main');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // --- Render Functions ---

  const renderLoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-gray-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-lg mb-4 border-4 border-white/20">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dr. Burger</h1>
          <p className="text-orange-100 text-sm mt-1 font-medium">Yönetim ve Ortaklık Portalı</p>
        </div>

        {authError && (
             <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 mb-4 text-white text-xs text-center font-medium">
                {authError}
             </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="email" 
              placeholder="E-posta Adresi" 
              className="w-full bg-white/90 rounded-xl py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Şifre" 
              className="w-full bg-white/90 rounded-xl py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center pl-1">
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-orange-100 font-medium cursor-pointer select-none">
              Beni Hatırla
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
                type="submit" 
                className="flex-1 bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 transition-colors shadow-lg border border-orange-500/50"
            >
                Giriş Yap
            </button>
            <button 
                type="button"
                onClick={handleSignUp}
                className="flex-1 bg-gray-800/50 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800/70 transition-colors shadow-lg border border-gray-500/30"
            >
                Kayıt Ol
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderHeader = (title: string, subtitle?: string, onBack?: () => void, rightAction?: React.ReactNode) => (
    <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-200 pt-safe-top pb-2 px-4 shadow-sm relative">
      <div className="flex items-center justify-between h-12">
        <div className="flex items-center gap-2 flex-1">
          {onBack && (
            <button onClick={onBack} className="p-1 -ml-2 text-gray-600">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {isSearchActive ? (
            <div className="flex-1 relative animate-fade-in">
               <input 
                 type="text" 
                 placeholder="Ara..." 
                 className="w-full bg-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 autoFocus
               />
               <button 
                 onClick={() => { setIsSearchActive(false); setSearchQuery(''); }}
                 className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>
          ) : (
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {title === 'Akış' ? <LayoutDashboard className="w-5 h-5 text-orange-600" /> : null}
                {title}
              </h1>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          )}
        </div>
        <div className="flex gap-3 pl-2">
          {!isSearchActive && !rightAction && (
             <button onClick={() => setIsSearchActive(true)} className="text-gray-600 hover:text-gray-900">
               <Search className="w-5 h-5" />
             </button>
          )}
          {rightAction}
          {!rightAction && (
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="text-gray-600 hover:text-gray-900 relative"
              >
                 <Bell className="w-5 h-5" />
                 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
              </button>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute right-0 top-8 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-40 p-2 animate-slide-up">
                     <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">Bildirimler</div>
                     {[1, 2].map(i => (
                       <div key={i} className="p-2 hover:bg-gray-50 rounded-lg flex gap-2 cursor-pointer transition-colors">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 shrink-0"></div>
                          <div>
                             <p className="text-xs text-gray-800 font-medium">Finans Raporu Güncellendi</p>
                             <p className="text-[10px] text-gray-500">Mali işler birimi dosya ekledi.</p>
                          </div>
                       </div>
                     ))}
                  </div>
                </>
              )}
            </div>
          )}
          {!rightAction && currentUser && (
            <button onClick={() => {
                setSelectedUserProfile(currentUser);
                setTempProfileData({ 
                    statusMessage: currentUser.statusMessage || '', 
                    phone: currentUser.phone || '' 
                });
                setIsEditingProfile(false);
            }}>
              <Avatar src={currentUser.avatar} alt="Me" />
            </button>
          )}
        </div>
      </div>
      {activeTab === 'tasks' && !onBack && (
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-2">
          <button 
            onClick={() => setSelectedProject(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!selectedProject ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Tümü
          </button>
          {projects.map(p => (
            <button 
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedProject === p.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderFeedView = () => {
    const filteredFeed = feed.filter(post => 
      searchQuery ? post.content.toLowerCase().includes(searchQuery.toLowerCase()) || post.author.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    return (
      <div className="pb-24 animate-fade-in">
        {renderHeader('Akış', 'Yönetim Paneli & Duyurular')}
        
        <div className="bg-white pb-4 shadow-sm border-b border-gray-100">
          <div className="flex gap-4 overflow-x-auto no-scrollbar p-4 pb-2">
            <div 
              className="flex flex-col items-center space-y-1 min-w-[60px] cursor-pointer hover:opacity-80" 
              onClick={() => {
                setEditingPostId(null);
                setNewPostText('');
                setSelectedImage(null);
                setSelectedVideo(null);
                setIsCreatePostOpen(true);
              }}
            >
               <div className="w-14 h-14 rounded-full border-2 border-dashed border-orange-400 flex items-center justify-center bg-orange-50 shadow-sm">
                  <Plus className="w-6 h-6 text-orange-500" />
               </div>
               <span className="text-xs text-gray-600 font-medium">Paylaş</span>
            </div>
            {users.filter(u => u.id !== currentUser?.id).map((u, i) => (
               <div 
                 key={u.id} 
                 className="flex flex-col items-center space-y-1 min-w-[60px] cursor-pointer"
                 onClick={() => setSelectedUserProfile(u)}
               >
                 <div className="relative">
                   <Avatar src={u.avatar} alt={u.name} size="lg" />
                   <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                 </div>
                 <span className="text-xs text-gray-600 truncate w-14 text-center">{u.name.split(' ')[0]}</span>
               </div>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filteredFeed.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
              <div className="p-4 pb-2 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={post.avatar} alt={post.author || "User"} />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{post.author}</h3>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500">
                          {Math.floor((Date.now() - post.timestamp) / (1000 * 60 * 60))}s önce
                        </p>
                        {post.audience && post.audience !== 'ALL' && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            {post.audience === 'MANAGEMENT' ? <Shield className="w-2.5 h-2.5"/> : <Briefcase className="w-2.5 h-2.5"/>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {openMenuId === post.id && (
                      <div className="absolute right-0 top-8 bg-white shadow-xl border border-gray-100 rounded-lg p-1.5 z-20 w-32 animate-slide-up origin-top-right">
                         <button 
                            onClick={() => handleEditPost(post)}
                            className="w-full text-left text-sm p-2 hover:bg-gray-50 rounded flex items-center gap-2 text-gray-700 transition-colors"
                         >
                            <Edit className="w-4 h-4" /> Düzenle
                         </button>
                         <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full text-left text-sm p-2 hover:bg-red-50 text-red-600 rounded flex items-center gap-2 transition-colors"
                         >
                            <Trash2 className="w-4 h-4" /> Sil
                         </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-800 text-sm mb-3 leading-relaxed whitespace-pre-line">{post.content}</p>
                
                {post.videoUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-3">
                    <video controls className="w-full h-full object-cover">
                      <source src={post.videoUrl} type="video/mp4" />
                    </video>
                  </div>
                )}
                {post.image && (
                   <div className="relative rounded-xl overflow-hidden mb-3">
                      <img src={post.image} alt="Content" className="w-full h-auto object-cover" />
                   </div>
                )}
              </div>

              <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between">
                 <div className="flex gap-4">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                       <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                       <span>{post.likes}</span>
                    </button>
                    <button 
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-orange-600 text-sm font-medium transition-colors"
                    >
                       <MessageSquare className="w-5 h-5" />
                       <span>{post.comments.length}</span>
                    </button>
                 </div>
                 <button className="text-gray-400 hover:text-gray-600">
                    <Share2 className="w-5 h-5" />
                 </button>
              </div>

              {expandedComments.has(post.id) && (
                 <div className="bg-gray-50 p-4 border-t border-gray-100 animate-slide-up">
                    <div className="space-y-3 mb-4">
                       {post.comments.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                             <Avatar src={comment.avatar} alt={comment.authorName} size="sm" />
                             <div className="flex-1 bg-white p-2.5 rounded-r-xl rounded-bl-xl shadow-sm text-sm">
                                <div className="flex justify-between items-baseline mb-1">
                                   <span className="font-semibold text-xs text-gray-900">{comment.authorName}</span>
                                </div>
                                <p className="text-gray-700">{comment.text}</p>
                             </div>
                          </div>
                       ))}
                       {post.comments.length === 0 && (
                         <div className="text-center py-2 text-gray-400 text-xs">Henüz yorum yok.</div>
                       )}
                    </div>
                    
                    <div className="flex gap-2 items-center">
                       {currentUser && <Avatar src={currentUser.avatar} alt="Me" size="sm" />}
                       <div className="flex-1 relative">
                          <input 
                            type="text" 
                            placeholder="Yorum yaz..." 
                            className="w-full bg-white border border-gray-200 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-orange-400"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                          />
                          <button 
                             onClick={() => handlePostComment(post.id)}
                             disabled={!commentInputs[post.id]}
                             className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 text-orange-600 disabled:text-gray-300 hover:bg-orange-50 rounded-full transition-colors"
                          >
                             <Send className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 </div>
              )}
            </div>
          ))}
          {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>}
        </div>

        {/* Create / Edit Post Modal */}
        {isCreatePostOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:w-[480px] rounded-t-2xl sm:rounded-2xl p-4 h-[80vh] sm:h-auto shadow-2xl animate-slide-up flex flex-col">
               <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                 <button 
                   onClick={() => {
                     setIsCreatePostOpen(false);
                     setEditingPostId(null);
                     setSelectedImage(null);
                     setSelectedVideo(null);
                   }} 
                   className="text-gray-500 hover:text-gray-800"
                 >
                   <X className="w-6 h-6" />
                 </button>
                 <span className="font-semibold text-gray-900">
                   {editingPostId ? 'Düzenle' : 'Paylaş'}
                 </span>
                 <button 
                   onClick={handleSavePost}
                   disabled={(!newPostText.trim() && !selectedImage && !selectedVideo) || isSavingPost}
                   className="text-orange-600 font-semibold disabled:opacity-50 flex items-center gap-2"
                 >
                   {isSavingPost && <Loader2 className="w-4 h-4 animate-spin" />}
                   {editingPostId ? 'Güncelle' : 'Gönder'}
                 </button>
               </div>
               
               <div className="flex gap-3 mb-4 relative z-10">
                  {currentUser && <Avatar src={currentUser.avatar} alt="Me" size="md" />}
                  <div className="flex-1">
                     <h4 className="font-medium text-sm text-gray-900">{currentUser?.name}</h4>
                     
                     <div className="relative mt-1 inline-block">
                       <button 
                         onClick={() => setIsAudienceMenuOpen(!isAudienceMenuOpen)}
                         className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-gray-200 transition-colors"
                       >
                          {postAudience === 'ALL' && <><Globe className="w-3 h-3" /> Tüm Ekip</>}
                          {postAudience === 'MANAGEMENT' && <><Shield className="w-3 h-3" /> Yönetim</>}
                          {postAudience === 'DEVS' && <><ChefHat className="w-3 h-3" /> Mutfak Şefi</>}
                          <span className="text-[10px] ml-0.5">▼</span>
                       </button>
                       
                       {isAudienceMenuOpen && (
                         <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-lg w-48 z-20 overflow-hidden">
                           <button onClick={() => { setPostAudience('ALL'); setIsAudienceMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 flex items-center gap-2 text-gray-700"><Globe className="w-3 h-3" /> Tüm Ekip</button>
                           <button onClick={() => { setPostAudience('MANAGEMENT'); setIsAudienceMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 flex items-center gap-2 text-gray-700"><Shield className="w-3 h-3" /> Yönetim</button>
                           <button onClick={() => { setPostAudience('DEVS'); setIsAudienceMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 flex items-center gap-2 text-gray-700"><ChefHat className="w-3 h-3" /> Mutfak Şefi</button>
                         </div>
                       )}
                     </div>
                  </div>
               </div>

               <textarea 
                 placeholder={editingPostId ? "Gönderiyi düzenle..." : "Yönetim ekibiyle paylaş..."} 
                 className="w-full flex-1 resize-none text-base placeholder-gray-400 focus:outline-none mb-4 p-1"
                 value={newPostText}
                 onChange={(e) => setNewPostText(e.target.value)}
               />

               {selectedImage && (
                 <div className="mb-4 relative inline-block">
                   <img src={selectedImage} alt="Preview" className="max-h-32 rounded-lg border border-gray-200" />
                   <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"><X className="w-3 h-3" /></button>
                 </div>
               )}
               
               {selectedVideo && (
                 <div className="mb-4 relative inline-block">
                   <video src={selectedVideo} className="max-h-32 rounded-lg border border-gray-200" controls />
                   <button onClick={() => setSelectedVideo(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"><X className="w-3 h-3" /></button>
                 </div>
               )}

               <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />

               <div className="mt-auto border-t border-gray-100 pt-3 flex gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 text-gray-500 hover:text-orange-600"><div className="p-2 bg-gray-50 rounded-full"><ImageIcon className="w-5 h-5" /></div><span className="text-[10px]">Medya</span></button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 text-gray-500 hover:text-orange-600"><div className="p-2 bg-gray-50 rounded-full"><Paperclip className="w-5 h-5" /></div><span className="text-[10px]">Dosya</span></button>
                  <button onClick={() => setIsAudienceMenuOpen(!isAudienceMenuOpen)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-orange-600"><div className="p-2 bg-gray-50 rounded-full"><Users className="w-5 h-5" /></div><span className="text-[10px]">Etiketle</span></button>
               </div>
            </div>
            {isAudienceMenuOpen && <div className="fixed inset-0 z-0" onClick={() => setIsAudienceMenuOpen(false)}></div>}
          </div>
        )}
      </div>
    );
  };

  const renderTasksView = () => (
    <div className="h-screen flex flex-col bg-ios-bg animate-fade-in">
      {renderHeader('Görevler', selectedProject ? projects.find(p => p.id === selectedProject)?.name : 'Stratejik Planlama')}
      
      {workloadSummary && (
         <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-900 leading-snug">{workloadSummary}</p>
         </div>
      )}

      <div className="flex justify-between items-center px-4 py-3">
         <div className="flex bg-gray-200/60 p-1 rounded-lg">
           <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><List className="w-4 h-4" /></button>
           <button onClick={() => setViewMode('KANBAN')} className={`p-1.5 rounded-md transition-all ${viewMode === 'KANBAN' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Columns className="w-4 h-4" /></button>
           <button onClick={() => setViewMode('GANTT')} className={`p-1.5 rounded-md transition-all ${viewMode === 'GANTT' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><GanttChartSquare className="w-4 h-4" /></button>
         </div>
         <button 
           onClick={() => setIsCreateTaskOpen(true)}
           className="bg-orange-600 text-white p-2 rounded-full shadow-lg shadow-orange-200 active:scale-90 transition-transform"
         >
           <Plus className="w-5 h-5" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {viewMode === 'LIST' && (
          <div className="space-y-3 p-4">
            {filteredTasks.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Bekleyen görev yok.</p>}
            {filteredTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{task.title}</h3>
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'HIGH' ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                   <span>{projects.find(p => p.id === task.projectId)?.name || 'Genel'}</span>
                   <span className={new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}>
                     • {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                   </span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge color={task.status === TaskStatus.DONE ? 'green' : task.status === TaskStatus.IN_PROGRESS ? 'orange' : 'gray'}>
                    {task.status}
                  </Badge>
                  <Avatar src={`https://ui-avatars.com/api/?name=${task.assignee}&background=random`} alt={task.assignee} />
                </div>
              </div>
            ))}
          </div>
        )}
        {viewMode === 'KANBAN' && (
          <div className="flex gap-4 p-4 overflow-x-auto h-[calc(100vh-260px)] snap-x">
            {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE].map(status => (
              <div key={status} className="min-w-[280px] snap-center flex flex-col h-full">
                <div className="flex justify-between items-center mb-3 px-1">
                   <h3 className="font-semibold text-gray-700 text-sm">{status}</h3>
                   <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                     {filteredTasks.filter(t => t.status === status).length}
                   </span>
                </div>
                <div className="flex-1 bg-gray-100/50 rounded-2xl p-2 overflow-y-auto space-y-2">
                   {filteredTasks.filter(t => t.status === status).map(task => (
                     <div 
                       key={task.id} 
                       onClick={() => setSelectedTask(task)}
                       className="bg-white p-3 rounded-xl shadow-sm border border-gray-200/50"
                     >
                        <p className="text-sm font-medium text-gray-800 mb-2">{task.title}</p>
                        <div className="flex justify-between items-center mt-2">
                           <Avatar src={`https://ui-avatars.com/api/?name=${task.assignee}&background=random`} alt={task.assignee} />
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 m-4 shadow-2xl animate-slide-up">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Yeni Görev</h3>
             <input 
                className="w-full mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-orange-500" 
                placeholder="Görev Başlığı" 
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
             />
             <textarea 
                className="w-full mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-orange-500 h-24 resize-none" 
                placeholder="Açıklama"
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
             />
             <div className="mb-4">
               <label className="text-xs text-gray-500 block mb-1">Öncelik</label>
               <div className="flex gap-2">
                 {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => (
                   <button 
                     key={p} 
                     onClick={() => setNewTaskPriority(p)}
                     className={`flex-1 py-2 rounded-lg text-xs font-medium border ${newTaskPriority === p ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-gray-200 text-gray-600'}`}
                   >
                     {p}
                   </button>
                 ))}
               </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setIsCreateTaskOpen(false)} className="flex-1 py-3 text-gray-600 font-medium">İptal</button>
                <button onClick={handleCreateTask} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200">Oluştur</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderChatView = () => (
    <div className="flex flex-col h-screen pb-24 bg-white animate-fade-in">
       {renderHeader('Yönetim Sohbet', 'Merkez Ofis')}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {chatMessages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                 {!isMe && <div className="mr-2 mt-1"><Avatar src="" alt={msg.sender_name} size="sm"/></div>}
                 <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                    {!isMe && <p className="text-[10px] text-gray-400 mb-0.5">{msg.sender_name}</p>}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                 </div>
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
       </div>
       <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
          <input 
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" 
            placeholder="Mesaj yaz..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage} className="p-2.5 bg-orange-600 text-white rounded-full shadow-md active:scale-95">
             <Send className="w-5 h-5" />
          </button>
       </div>
    </div>
  );

  // --- Render Sub-Pages ---

  const renderEmployeesPage = () => {
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
        u.department?.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    return (
      <div className="animate-slide-up min-h-screen bg-ios-bg pb-24">
        {renderHeader('Yönetim Kadrosu', `${users.length} Yönetici`, () => setMenuPage('main'))}
        <div className="p-4 space-y-4">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               className="w-full bg-white rounded-lg pl-9 pr-4 py-2.5 text-sm shadow-sm border-none focus:ring-2 focus:ring-orange-300" 
               placeholder="İsim veya departman ara..."
               value={employeeSearch}
               onChange={(e) => setEmployeeSearch(e.target.value)}
             />
          </div>

          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative">
                  <Avatar src={user.avatar} alt={user.name} size="md" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex-1">
                   <h3 className="font-semibold text-gray-900">{user.name}</h3>
                   <p className="text-xs text-gray-500">{user.department} • {user.role === 'manager' ? 'Yönetici' : 'Yönetim Kurulu'}</p>
                   {user.statusMessage && <p className="text-xs text-orange-600 mt-0.5">{user.statusMessage}</p>}
                </div>
                <div className="flex gap-2">
                   <a href={user.phone ? `tel:${user.phone}` : '#'} className={`p-2 rounded-full ${user.phone ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
                      <Phone className="w-4 h-4" />
                   </a>
                   <a href={user.email ? `mailto:${user.email}` : '#'} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                      <Mail className="w-4 h-4" />
                   </a>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Yönetici bulunamadı.</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderTimeTrackingPage = () => {
    const handleClockIn = async () => {
      if (!currentUser) return;
      try {
        const newLog = await supabaseService.clockIn(currentUser.id);
        setActiveTimeLog(newLog);
        setTimeLogs(prev => [newLog, ...prev]);
      } catch (e) { console.error(e); }
    };

    const handleClockOut = async () => {
      if (!currentUser || !activeTimeLog) return;
      try {
        const startTime = new Date(activeTimeLog.check_in).getTime();
        const now = Date.now();
        const minutes = Math.floor((now - startTime) / 60000);
        
        const updatedLog = await supabaseService.clockOut(currentUser.id, activeTimeLog.id, minutes);
        setActiveTimeLog(null);
        setTimeLogs(prev => prev.map(l => l.id === activeTimeLog.id ? updatedLog : l));
      } catch (e) { console.error(e); }
    };

    return (
      <div className="animate-slide-up min-h-screen bg-ios-bg pb-24">
        {renderHeader('Zaman Yönetimi', 'Aktif Çalışma Süresi', () => setMenuPage('main'))}
        <div className="p-4 flex flex-col items-center space-y-6">
           {/* Clock Circle */}
           <div className="mt-8 relative">
              <div className={`w-64 h-64 rounded-full flex items-center justify-center border-8 ${activeTimeLog ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'} transition-colors duration-500`}>
                 <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">{activeTimeLog ? 'Çalışma Süresi' : 'Mesaide Değil'}</p>
                    <p className="text-4xl font-mono font-bold text-gray-800">
                      {activeTimeLog ? 'AKTİF' : '00:00'}
                    </p>
                    {activeTimeLog && <p className="text-xs text-green-600 mt-2">Başlama: {new Date(activeTimeLog.check_in).toLocaleTimeString()}</p>}
                 </div>
              </div>
              <button 
                onClick={activeTimeLog ? handleClockOut : handleClockIn}
                className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 ${activeTimeLog ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
              >
                 {activeTimeLog ? <><StopCircle className="w-5 h-5" /> Bitir</> : <><PlayCircle className="w-5 h-5" /> Başla</>}
              </button>
           </div>

           <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <div className="p-3 bg-gray-50 border-b border-gray-100 font-medium text-gray-700 text-sm">Son Aktiviteler</div>
              {timeLogs.map(log => (
                <div key={log.id} className="p-3 border-b border-gray-50 flex justify-between items-center text-sm">
                   <div>
                      <p className="font-medium text-gray-800">{new Date(log.check_in).toLocaleDateString('tr-TR')}</p>
                      <p className="text-xs text-gray-400">{`${new Date(log.check_in).toLocaleTimeString()} - ${log.check_out ? new Date(log.check_out).toLocaleTimeString() : '...'}`}</p>
                   </div>
                   <div className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono text-xs">
                      {Math.floor(log.total_minutes / 60)}s {log.total_minutes % 60}d
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  const renderReportsPage = () => (
    <div className="animate-slide-up min-h-screen bg-ios-bg pb-24">
      {renderHeader('Raporlar', 'Performans & KPI', () => setMenuPage('main'))}
      <div className="p-4 space-y-4">
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
               <p className="text-xs text-gray-500 mb-1">Tamamlanan Görev</p>
               <p className="text-2xl font-bold text-orange-600">{tasks.filter(t => t.status === TaskStatus.DONE).length}</p>
               <div className="h-1 w-full bg-orange-100 rounded-full mt-2"><div className="h-full bg-orange-500 w-[70%] rounded-full"></div></div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
               <p className="text-xs text-gray-500 mb-1">Bekleyen İşler</p>
               <p className="text-2xl font-bold text-gray-600">{tasks.filter(t => t.status !== TaskStatus.DONE).length}</p>
               <div className="h-1 w-full bg-gray-200 rounded-full mt-2"><div className="h-full bg-gray-500 w-[40%] rounded-full"></div></div>
            </div>
         </div>

         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Haftalık Verimlilik</h3>
            <div className="flex items-end justify-between h-32 gap-2">
               {[40, 60, 30, 80, 55, 20, 70].map((h, i) => (
                 <div key={i} className="w-full bg-orange-100 rounded-t-md relative group">
                    <div className="absolute bottom-0 w-full bg-orange-500 rounded-t-md transition-all duration-500" style={{ height: `${h}%` }}></div>
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
               <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
            </div>
         </div>
      </div>
    </div>
  );

  const renderAutomationPage = () => (
    <div className="animate-slide-up min-h-screen bg-ios-bg pb-24">
      {renderHeader('Otomasyon', 'Yönetim Kuralları', () => setMenuPage('main'), 
          <button onClick={() => setIsAddRuleOpen(true)} className="p-1 text-orange-600 bg-orange-50 rounded-full hover:bg-orange-100"><Plus className="w-5 h-5" /></button>
      )}
      
      <div className="p-4 space-y-4">
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-3">
           <Sparkles className="w-6 h-6 text-orange-600" />
           <p className="text-xs text-orange-800">Yönetim süreçlerini hızlandırır ve denetimi artırır.</p>
        </div>

        <div className="space-y-3">
           {automationRules.map(rule => (
             <div key={rule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     <h3 className="font-semibold text-gray-900 text-sm">{rule.name}</h3>
                     {rule.isActive ? <Badge color="green">Aktif</Badge> : <Badge color="gray">Pasif</Badge>}
                   </div>
                   <p className="text-xs text-gray-500">Eğer: {rule.trigger}</p>
                   <p className="text-xs text-gray-700 font-medium">Yap: {rule.action}</p>
                </div>
                <div 
                  onClick={() => handleToggleAutomation(rule.id)}
                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                   <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${rule.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl">
                <h3 className="text-lg font-bold mb-4">Yeni Kural</h3>
                <input className="w-full mb-3 p-2 border rounded" placeholder="Kural Adı" value={newRuleData.name} onChange={e => setNewRuleData({...newRuleData, name: e.target.value})} />
                <input className="w-full mb-3 p-2 border rounded" placeholder="Tetikleyici (Örn: Ciro Hedefi %90)" value={newRuleData.trigger} onChange={e => setNewRuleData({...newRuleData, trigger: e.target.value})} />
                <input className="w-full mb-4 p-2 border rounded" placeholder="Aksiyon (Örn: Yönetime Raporla)" value={newRuleData.action} onChange={e => setNewRuleData({...newRuleData, action: e.target.value})} />
                <div className="flex gap-2">
                    <button onClick={() => setIsAddRuleOpen(false)} className="flex-1 py-2 text-gray-500">İptal</button>
                    <button onClick={handleAddAutomation} className="flex-1 py-2 bg-orange-600 text-white rounded">Ekle</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
  
  const renderSettingsPage = () => (
    <div className="animate-slide-up min-h-screen bg-ios-bg pb-24">
      {renderHeader('Ayarlar', 'Tercihler', () => setMenuPage('main'))}
      <div className="p-4 space-y-4">
         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-700">Bildirimler</span>
                <div 
                  onClick={() => setAppSettings(prev => ({...prev, notifications: !prev.notifications}))}
                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.notifications ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full transition-transform ${appSettings.notifications ? 'translate-x-4' : ''}`}></div>
                </div>
             </div>
             <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <span className="text-gray-700">Karanlık Mod</span>
                <div 
                  onClick={() => setAppSettings(prev => ({...prev, darkMode: !prev.darkMode}))}
                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.darkMode ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full transition-transform ${appSettings.darkMode ? 'translate-x-4' : ''}`}></div>
                </div>
             </div>
             <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                <span className="text-gray-700">Hesap Güvenliği</span>
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
             </div>
         </div>
      </div>
    </div>
  );

  const renderMainMenuPage = () => (
     <div className="p-4 space-y-4 bg-ios-bg min-h-screen pb-24 animate-fade-in">
        {renderHeader('Menü', 'Yönetim Araçları')}
        <div className="grid grid-cols-2 gap-4">
           <button onClick={() => setMenuPage('employees')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-transform">
              <Users className="w-8 h-8 text-orange-500" />
              <span className="font-medium text-gray-700 text-sm">Kadrolar</span>
           </button>
           <button onClick={() => setMenuPage('time')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-transform">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="font-medium text-gray-700 text-sm">Zaman Yönetimi</span>
           </button>
           <button onClick={() => setMenuPage('reports')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-transform">
              <BarChart3 className="w-8 h-8 text-gray-700" />
              <span className="font-medium text-gray-700 text-sm">Raporlar</span>
           </button>
           <button onClick={() => setMenuPage('automation')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-transform">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <span className="font-medium text-gray-700 text-sm">Otomasyon</span>
           </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-4">
           <button onClick={() => setMenuPage('settings')} className="w-full p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50">
              <div className="flex items-center gap-3">
                 <Settings className="w-5 h-5 text-gray-500" />
                 <span className="text-gray-800 text-sm font-medium">Ayarlar</span>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
           </button>
           <button onClick={handleLogout} className="w-full p-4 flex justify-between items-center hover:bg-red-50">
              <div className="flex items-center gap-3 text-red-600">
                 <LogOut className="w-5 h-5" />
                 <span className="text-sm font-medium">Çıkış Yap</span>
              </div>
           </button>
        </div>
        
        <div className="text-center text-xs text-gray-400 mt-4 pb-6">
           Dr. Burger Yönetim v2.1.0
        </div>
     </div>
  );

  // --- Task Detail Modal ---
  const renderTaskDetail = () => {
    if (!selectedTask) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-ios-bg w-full sm:w-[480px] h-[90vh] sm:h-[800px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
           <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <button onClick={() => setSelectedTask(null)} className="text-orange-600 font-medium">Kapat</button>
              <span className="font-semibold text-gray-900">Detaylar</span>
              <button onClick={() => handleDeleteTask(selectedTask.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 className="w-5 h-5" /></button>
           </div>
           <div className="overflow-y-auto p-4 space-y-6 flex-1">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <Badge color={selectedTask.status === TaskStatus.DONE ? 'green' : 'orange'}>{selectedTask.status}</Badge>
                   {selectedTask.priority === 'HIGH' && <Badge color="red">Acil</Badge>}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedTask.title}</h2>
              </div>

              {/* Assignee Selection */}
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-full">
                          <UserCircle className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Sorumlu</span>
                  </div>
                  <select 
                    value={selectedTask.assignee} 
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="bg-gray-50 border-none text-sm font-medium text-gray-800 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-orange-200 cursor-pointer"
                  >
                      {users.map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                  </select>
              </div>

              <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedTask.isTracking ? 'bg-green-100' : 'bg-gray-100'}`}>
                       <Clock className={`w-5 h-5 ${selectedTask.isTracking ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                       <p className="text-xs text-gray-500">Süre</p>
                       <p className="font-mono font-medium text-lg">{Math.floor(selectedTask.timeSpent / 60)}s {selectedTask.timeSpent % 60}d</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => toggleTimer(selectedTask.id)}
                   className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedTask.isTracking ? 'bg-red-50 text-red-600' : 'bg-green-600 text-white'}`}
                 >
                   {selectedTask.isTracking ? 'Durdur' : 'Başlat'}
                 </button>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100">
                 <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <h3 className="font-semibold text-orange-900 text-sm">AI Asistan</h3>
                 </div>
                 <p className="text-xs text-orange-700 mb-3">Görevi analiz et ve kontrol listesi oluştur.</p>
                 <button 
                   onClick={() => handleAiSubtasks(selectedTask)}
                   disabled={isAiLoading}
                   className="w-full bg-white border border-orange-200 text-orange-600 py-2 rounded-lg text-sm font-medium shadow-sm active:bg-orange-50 flex justify-center items-center gap-2"
                 >
                   {isAiLoading ? (
                     <span className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full"></span>
                   ) : "Kontrol Listesi Oluştur"}
                 </button>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                 <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4 text-gray-400" /> Yapılacaklar
                 </h3>
                 <div className="space-y-2">
                    {selectedTask.subtasks?.map(st => (
                      <div key={st.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors" onClick={() => handleToggleSubtask(selectedTask.id, st.id)}>
                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${st.completed ? 'bg-orange-600 border-orange-600' : 'border-gray-300 bg-white'}`}>
                            {st.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                         </div>
                         <span className={`text-sm select-none ${st.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{st.title}</span>
                      </div>
                    ))}
                    {(!selectedTask.subtasks || selectedTask.subtasks.length === 0) && <p className="text-sm text-gray-400 italic">Liste boş.</p>}
                 </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Açıklama</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedTask.description || 'Açıklama yok.'}</p>
              </div>
           </div>
           <div className="bg-white p-4 border-t border-gray-200 flex justify-between items-center">
              <button className="flex flex-col items-center text-gray-400 hover:text-orange-600 gap-1">
                 <MessageSquare className="w-5 h-5" />
                 <span className="text-[10px]">Yorum</span>
              </button>
              <button onClick={() => setSelectedTask(null)} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-200 w-2/3">
                 Tamam
              </button>
           </div>
        </div>
      </div>
    );
  };
  
  const renderUserProfileModal = () => {
    if (!selectedUserProfile) return null;
    const isMe = currentUser?.id === selectedUserProfile.id;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up relative">
           <button 
             onClick={() => { setSelectedUserProfile(null); setIsEditingProfile(false); }} 
             className="absolute top-4 right-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors z-10"
           >
              <X className="w-5 h-5 text-gray-500" />
           </button>
           
           <div className="h-32 bg-gradient-to-r from-orange-500 to-red-600"></div>
           <div className="px-6 pb-6 -mt-16">
              <div className="relative inline-block">
                <Avatar src={selectedUserProfile.avatar} alt={selectedUserProfile.name} size="xl" />
                <div className={`absolute bottom-1 right-1 w-5 h-5 border-4 border-white rounded-full ${selectedUserProfile.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </div>
              
              <div className="mt-4 text-center">
                 <h2 className="text-xl font-bold text-gray-900">{selectedUserProfile.name}</h2>
                 <p className="text-sm text-gray-500">{selectedUserProfile.department}</p>
                 
                 {isEditingProfile ? (
                     <div className="mt-4 space-y-3 text-left">
                         <div>
                             <label className="text-xs text-gray-500">Durum Mesajı</label>
                             <input 
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                value={tempProfileData.statusMessage}
                                onChange={e => setTempProfileData({...tempProfileData, statusMessage: e.target.value})}
                                placeholder="Örn: Toplantıda 💼"
                             />
                         </div>
                         <div>
                             <label className="text-xs text-gray-500">Telefon</label>
                             <input 
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                value={tempProfileData.phone}
                                onChange={e => setTempProfileData({...tempProfileData, phone: e.target.value})}
                                placeholder="+90 555..."
                             />
                         </div>
                         <button onClick={handleUpdateProfile} className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium text-sm">Kaydet</button>
                     </div>
                 ) : (
                     <>
                        {selectedUserProfile.statusMessage && (
                           <div className="mt-3 inline-block bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700 font-medium">
                              {selectedUserProfile.statusMessage}
                           </div>
                        )}
                        {selectedUserProfile.phone && (
                           <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> {selectedUserProfile.phone}</p>
                        )}
                     </>
                 )}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                 {!isEditingProfile && (
                     <>
                        {isMe ? (
                            <button onClick={() => setIsEditingProfile(true)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                <Edit className="w-4 h-4" /> Düzenle
                            </button>
                        ) : (
                            <button className="flex-1 bg-orange-600 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Mesaj
                            </button>
                        )}
                     </>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return renderLoginScreen();
  }

  return (
    <div className="min-h-screen bg-ios-bg text-gray-900 font-sans">
      <main className="max-w-md mx-auto bg-ios-bg min-h-screen relative shadow-2xl overflow-hidden">
        
        {activeTab === 'feed' && renderFeedView()}
        {activeTab === 'tasks' && renderTasksView()}
        {activeTab === 'chat' && renderChatView()}
        {activeTab === 'menu' && (
          <>
            {menuPage === 'main' && renderMainMenuPage()}
            {menuPage === 'employees' && renderEmployeesPage()}
            {menuPage === 'time' && renderTimeTrackingPage()}
            {menuPage === 'reports' && renderReportsPage()}
            {menuPage === 'automation' && renderAutomationPage()}
            {menuPage === 'settings' && renderSettingsPage()}
          </>
        )}
      
        {/* Bottom Tab Bar */}
        {menuPage === 'main' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-safe-bottom z-10 max-w-md mx-auto">
            <div className="flex justify-around items-center h-16">
              <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'feed' ? 'text-orange-600' : 'text-gray-400'}`}>
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-medium">Yönetim</span>
              </button>
              <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'tasks' ? 'text-orange-600' : 'text-gray-400'}`}>
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-[10px] font-medium">Görevler</span>
              </button>
              <div className="relative -top-5">
                 <button 
                   onClick={() => {
                     if(activeTab === 'tasks') {
                       setIsCreateTaskOpen(true);
                     } else {
                       setEditingPostId(null);
                       setNewPostText('');
                       setSelectedImage(null);
                       setSelectedVideo(null);
                       setIsCreatePostOpen(true);
                     }
                   }}
                   className="bg-orange-600 text-white p-4 rounded-full shadow-lg shadow-orange-300 active:scale-95 transition-transform"
                 >
                    <Plus className="w-6 h-6" />
                 </button>
              </div>
              <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'chat' ? 'text-orange-600' : 'text-gray-400'}`}>
                <MessageSquare className="w-6 h-6" />
                <span className="text-[10px] font-medium">Sohbet</span>
              </button>
              <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'menu' ? 'text-orange-600' : 'text-gray-400'}`}>
                <Menu className="w-6 h-6" />
                <span className="text-[10px] font-medium">Araçlar</span>
              </button>
            </div>
          </div>
        )}

        {selectedTask && renderTaskDetail()}
        {selectedUserProfile && renderUserProfileModal()}
      </main>
    </div>
  );
}