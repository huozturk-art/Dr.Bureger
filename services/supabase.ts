
import { createClient } from '@supabase/supabase-js';
import { Task, Project, FeedPost, User, Message, TimeLog } from '../types';

// Supabase Yapılandırması
// Öncelik Vercel/Env değişkenlerindedir. Yoksa hardcoded değerler kullanılır.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tuifbxtxkrzjkrycnxqd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aWZieHR4a3J6amtyeWNueHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjE5MjEsImV4cCI6MjA3OTIzNzkyMX0.lTs1ekoE3viroA4Yzc2SXqV3hBNK1kquktiWizCzS3g';

// İstemciyi başlat
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseService = {
  
  // --- Storage ---

  async uploadFile(file: File, bucket: string = 'media'): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('File upload exception:', error);
      return null;
    }
  },
  
  // --- Auth & Profile ---
  
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, name: string, department: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, department } // Metadata
      }
    });
    
    if (error) throw error;
    
    // Profil oluşturmayı dene
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        name: name,
        department: department,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
        role: 'employee',
        is_online: true
      });
      
      if (profileError) {
        console.warn("Profil otomatik oluşturulamadı veya zaten var:", profileError);
      }
    }
    
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUserProfile(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
       console.error("Profil çekme hatası:", error);
       // Eğer profil yoksa metadata'dan oluşturmayı dene (Fallback)
       if (user.user_metadata) {
          return {
            id: user.id,
            name: user.user_metadata.name || 'Kullanıcı',
            email: user.email,
            avatar: `https://ui-avatars.com/api/?name=${user.user_metadata.name}&background=random`,
            role: 'employee',
            isOnline: true
          } as User;
       }
       return null;
    }

    // DB Profilini UI User tipine dönüştür
    return {
       id: profile.id,
       name: profile.name,
       avatar: profile.avatar,
       role: profile.role,
       department: profile.department,
       email: profile.email,
       phone: profile.phone,
       isOnline: profile.is_online,
       statusMessage: profile.status_message
    } as User;
  },

  async updateUserProfile(userId: string, updates: Partial<User>) {
    // UI tipinden DB kolonlarına çevir
    const payload: any = {};
    if (updates.statusMessage !== undefined) payload.status_message = updates.statusMessage;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.isOnline !== undefined) payload.is_online = updates.isOnline;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select();
      
    if (error) throw error;
    return data?.[0];
  },

  // --- Data Fetching ---

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];

    return (data || []).map((p: any) => ({
       id: p.id,
       name: p.name,
       avatar: p.avatar,
       role: p.role,
       department: p.department,
       email: p.email,
       phone: p.phone,
       isOnline: p.is_online,
       statusMessage: p.status_message
    }));
  },

  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Görevler çekilemedi:", error);
        return [];
    }

    // CRITICAL: Mapping DB columns (snake_case) to UI types (camelCase)
    return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date, // Mapped
        assignee: row.assignee_name, // Mapped
        projectId: row.project_id || 'p1', // Mapped
        subtasks: row.subtasks || [],
        timeSpent: row.time_spent || 0, // Mapped
        isTracking: row.is_tracking || false, // Mapped
        comments: row.comments || [],
        created_at: row.created_at
    }));
  },

  async getProjects(): Promise<Project[]> {
    const { data } = await supabase.from('projects').select('*');
    return (data as Project[]) || [];
  },

  async getFeed(): Promise<FeedPost[]> {
    const { data, error } = await supabase.from('feed_posts').select('*').order('created_at', { ascending: false });
    
    if (error || !data) return [];

    return data.map((post: any) => ({
      id: post.id,
      author: post.author_name,
      avatar: post.author_avatar,
      content: post.content,
      image: post.image,
      videoUrl: post.video_url,
      type: post.type,
      likes: post.likes,
      isLiked: false,
      comments: post.comments || [],
      timestamp: new Date(post.created_at).getTime(),
      audience: post.audience
    }));
  },

  // --- Chat ---

  async getMessages(channelId: string = 'general'): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return [];
    }
    return data as Message[];
  },

  async sendMessage(content: string, senderId: string, senderName: string, channelId: string = 'general') {
    const { data, error } = await supabase.from('messages').insert([{
      content,
      sender_id: senderId,
      sender_name: senderName,
      channel_id: channelId
    }]).select();
    
    if (error) throw error;
    return data?.[0];
  },

  subscribeToMessages(callback: (msg: Message) => void) {
    return supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },

  // --- Tasks Operations (With Mapping) ---

  async createTask(task: Partial<Task>) {
    // UI Tipinden DB kolonlarına çevir
    const payload = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate, // camel -> snake
      assignee_name: task.assignee, // camel -> snake
      project_id: task.projectId === 'p1' || task.projectId === 'p2' || task.projectId === 'p3' ? null : task.projectId,
      subtasks: task.subtasks || [],
      time_spent: task.timeSpent || 0,
      is_tracking: task.isTracking || false
    };

    const { data, error } = await supabase.from('tasks').insert([payload]).select();
    
    if (error) throw error;

    // Dönen veriyi tekrar UI tipine çevirip döndür
    const row = data?.[0];
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        assignee: row.assignee_name,
        projectId: row.project_id,
        subtasks: row.subtasks,
        timeSpent: row.time_spent,
        isTracking: row.is_tracking,
        comments: [],
        created_at: row.created_at
    } as Task;
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    // Mapping UI -> DB
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.assignee !== undefined) payload.assignee_name = updates.assignee;
    if (updates.projectId !== undefined) payload.project_id = updates.projectId;
    if (updates.subtasks !== undefined) payload.subtasks = updates.subtasks;
    if (updates.timeSpent !== undefined) payload.time_spent = updates.timeSpent;
    if (updates.isTracking !== undefined) payload.is_tracking = updates.isTracking;

    const { data, error } = await supabase.from('tasks').update(payload).eq('id', taskId).select();
    
    if (error) console.error('Error updating task:', error);
    return data?.[0];
  },

  async deleteTask(taskId: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  // --- Time Tracking ---

  async getTimeLogs(userId: string): Promise<TimeLog[]> {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', userId)
      .order('check_in', { ascending: false });
    
    if (error) return [];
    return data as TimeLog[];
  },

  async clockIn(userId: string) {
    const { data, error } = await supabase.from('time_logs').insert([{
      user_id: userId,
      check_in: new Date().toISOString(),
      total_minutes: 0
    }]).select();
    if (error) throw error;
    return data?.[0];
  },

  async clockOut(userId: string, logId: string, minutes: number) {
    const { data, error } = await supabase.from('time_logs').update({
      check_out: new Date().toISOString(),
      total_minutes: minutes
    }).eq('id', logId).select();
    if (error) throw error;
    return data?.[0];
  },

  // --- Feed ---

  async createPost(postData: any) {
    // Feed yapısı DB ile uyumlu olduğu için direkt mapping yapıyoruz
    const payload = {
      author_id: postData.author_id,
      author_name: postData.author_name,
      author_avatar: postData.author_avatar,
      content: postData.content,
      image: postData.image,
      video_url: postData.video_url,
      type: postData.type,
      likes: 0,
      comments: [],
      audience: postData.audience
    };

    const { data, error } = await supabase.from('feed_posts').insert([payload]).select();
    return { data: data?.[0], error };
  },

  async deletePost(postId: string) {
    await supabase.from('feed_posts').delete().eq('id', postId);
  },

  async addComment(postId: string, comment: any, currentComments: any[]) {
    const newComments = [...currentComments, comment];
    const { error } = await supabase
      .from('feed_posts')
      .update({ comments: newComments })
      .eq('id', postId);
    if (error) console.error('Error commenting:', error);
    return newComments;
  },

  async toggleLike(postId: string, currentLikes: number) {
      const { error } = await supabase
        .from('feed_posts')
        .update({ likes: currentLikes })
        .eq('id', postId);
  }
};
