
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  likes: number;
}

// UI tarafında kullanılan Görev Tipi
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // UI: camelCase
  assignee: string; // UI: camelCase (isim tutuyoruz)
  projectId: string; // UI: camelCase
  subtasks: SubTask[];
  timeSpent: number; // UI: camelCase
  isTracking: boolean; // UI: camelCase
  comments: Comment[];
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: string[];
  icon: string;
}

export interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  avatar: string;
  text: string;
  timestamp: number;
}

export interface FeedPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  videoUrl?: string;
  timestamp: number;
  likes: number;
  isLiked: boolean;
  comments: FeedComment[];
  type: 'post' | 'announcement';
  audience?: 'ALL' | 'MANAGEMENT' | 'DEVS';
}

export type ViewMode = 'LIST' | 'KANBAN' | 'GANTT' | 'SCRUM';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string;
  email?: string;
  phone?: string;
  isOnline: boolean;
  lastActive?: string;
  statusMessage?: string;
}

export interface TimeLog {
  id: string;
  user_id: string;
  check_in: string;
  check_out?: string;
  total_minutes: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  channel_id: string;
}
