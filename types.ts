
export enum Role {
    USER = 'user',
    INSTRUCTOR = 'instructor',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

export type UserStatus = 'Active' | 'Pending' | 'Suspended' | 'Banned';

export interface CoinTransaction {
    id: string;
    type: 'Earned' | 'Spent';
    amount: number;
    description: string;
    timestamp: Date;
}

export interface Badge {
    id: string;
    name: string;
    icon: string; // e.g., an SVG path or a character
    description: string;
    earnedAt: Date;
}

export interface UserActivity {
    id: string;
    type: 'Login' | 'Course Enrollment' | 'Lesson Complete' | 'Exam Attempt';
    description: string;
    timestamp: Date;
}

export interface ActiveSession {
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    loggedInAt: Date;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: Role;
    avatarUrl: string;
    createdAt: Date;
    enrolledCourseIds: string[];
    wishlistCourseIds: string[];
    // New professional fields
    status: UserStatus;
    statusReason?: string;
    lastLoginAt?: Date;
    loginHistory?: { ip: string, timestamp: Date }[];
    phone?: string;
    // New automated flow fields
    isFirstVisit?: boolean;
    agreementStatus: 'Agreed' | 'Not Agreed';
    agreementTimestamp?: Date;
    agreedInstructionVersion?: string;
    // News System Feature
    bookmarkedPostIds?: string[];
    // Registration fields
    dob?: string;
    gender?: string;
    grade?: string;
    school?: string;
    medium?: string;
    address?: string;
    // Lesson Watching Feature
    lessonProgress?: {
        [lessonId: string]: { progress: number; completed: boolean };
    };
    // Exam System Features
    coins: number;
    coinTransactions: CoinTransaction[];
    badges: Badge[];
    // Session Management
    currentSessionId?: string;
    activeSessions?: ActiveSession[];
    // Data Preservation
    deletedAt?: Date;
    // Instructor Link
    instructorProfileId?: string;
}

export interface LessonResource {
    id: string;
    title: string;
    url: string;
    type: 'PDF' | 'ZIP' | 'Note';
}

export interface Lesson {
    id:string;
    title: string;
    contentUrl: string;
    type: 'Video' | 'PDF' | 'Note';
    duration: string; // e.g., "10:32"
    isFree?: boolean;
    coinReward?: number;
    // Lesson Watching Features
    likes: string[]; // Array of user IDs
    comments: Comment[];
    resources: LessonResource[];
}

export interface InstructorSlide {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string; // e.g., YouTube embed ID
}

export interface Instructor {
    id: string;
    name: string;
    title: string; // e.g., "Lead Physics Instructor"
    degrees: string; // e.g., "M.Sc in Physics, DU"
    experience: string; // e.g., "10+ years"
    bio: string; // Rich text
    photoUrl: string;
    email: string;
    phone?: string;
    socialLinks?: {
        linkedIn?: string;
        youtube?: string;
        website?: string;
    };
    status: 'Active' | 'Inactive';
    isVerified?: boolean;
    slides: InstructorSlide[];
    // Fields from registration
    expertise?: string;
    experienceYears?: number;
    languages?: string[];
    portfolioUrl?: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    author: string;
    authorId: string;
    price: number;
    discount?: number;
    thumbnailUrl: string;
    lessons: Lesson[];
    category: string;
    publishStatus: 'Draft' | 'Published';
    resources: { title: string; url: string }[];
    createdAt: Date;
    updatedAt: Date;
    instructorIds?: string[];
    // Data Preservation
    deletedAt?: Date;
}

export interface Coupon {
    id: string;
    code: string;
    discountType: 'Fixed' | 'Percentage';
    discountValue: number;
    expiresAt?: Date;
    isActive: boolean;
    usageLimit: number; // 0 for unlimited
    timesUsed: number;
    createdAt: Date;
}

export interface Order {
    id: string;
    userId: string;
    courseId: string;
    courseTitle: string;
    amount: number;
    discountAmount?: number;
    couponCode?: string;
    finalAmount: number;
    promoCode?: string;
    status: 'Pending' | 'Completed' | 'Failed' | 'Rejected';
    createdAt: Date;
    paymentMethod: 'bKash' | 'Nagad' | 'Card' | 'Coins';
    transactionId?: string;
    screenshotUrl?: string;
    rejectionReason?: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'Manual' | 'Gateway';
    iconUrl: string;
    status: 'Active' | 'Inactive';
    accountNumber?: string;
    credentials?: string;
}

export interface AdminLog {
    id: string;
    adminId: string;
    adminName: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: Date;
    ipAddress?: string;
}

export interface Notice {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
}

export enum QuestionType {
    MCQ = 'Multiple Choice',
    TrueFalse = 'True/False',
}

export interface Question {
    id: string;
    questionText: string;
    questionType: QuestionType;
    options?: string[];
    correctAnswer: string;
    marks: number;
}

export interface Exam {
    id: string;
    title: string;
    description: string;
    courseId: string;
    duration: number; // in minutes
    totalMarks: number;
    passMarks: number;
    status: 'Draft' | 'Published' | 'Archived';
    questions: Question[];
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    // Exam System Features
    coinReward: number;
    fullMarksBonus: number;
    attemptLimit: number; // 0 for unlimited
}

export interface ExamAttempt {
    id: string;
    examId: string;
    userId: string;
    username: string;
    score: number;
    totalMarks: number;
    submittedAt: Date;
    timeTaken: number; // in seconds
    coinsEarned: number;
}

export enum PostCategory {
    GENERAL = 'General',
    ANNOUNCEMENT = 'Announcement',
    UPDATE = 'Update',
    ACADEMIC = 'Academic',
    TIPS = 'Tips & Tricks',
}

export interface Media {
    id: string;
    url: string;
    type: 'image' | 'pdf';
    caption: string;
    uploadedAt: Date;
    // New professional fields
    fileName: string;
    fileSize: number; // in bytes
    uploadedByUserId: string;
    status: 'Approved' | 'Pending' | 'Rejected';
}

export interface YouTubeVideo {
    id: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    type: 'youtube';
}

export interface Comment {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    content: string;
    createdAt: Date;
    isPinned?: boolean;
}

export interface PostVersion {
    version: number;
    editedAt: Date;
    editedBy: string; // userId
    content: Pick<NewsPost, 'title' | 'subtitle' | 'shortDescription' | 'longDescription' | 'attachments'>;
}

export interface NewsPost {
    id: string;
    title: string;
    subtitle?: string;
    slug: string;
    shortDescription: string;
    longDescription: string;
    category: PostCategory;
    tags?: string[];
    status: 'Draft' | 'Published' | 'Archived' | 'Scheduled';
    isPinned: boolean;
    isFeatured?: boolean;
    isBreaking?: boolean;
    priority: 'Top' | 'Normal';
    scheduledAt?: Date;
    expiresAt?: Date;
    attachments: (Media | YouTubeVideo)[];
    createdAt: Date;
    authorId: string;
    viewCount: number;
    readTime: number; // in minutes
    comments: Comment[];
    likes: string[]; // Array of user IDs
    deletedAt?: Date; // For soft delete
    history?: PostVersion[];
}

// --- Instructor Post System ---
export type PostVisibility = 'Public' | 'Course-Only' | 'Enrolled-Only';

export interface InstructorPostComment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    avatarUrl: string;
    content: string;
    createdAt: Date;
    isPinned: boolean;
}

export interface InstructorPost {
    id: string;
    authorId: string; // User ID of the instructor
    title: string;
    content: string; // Markdown/rich text
    attachments: (Media | YouTubeVideo)[];
    likes: string[]; // Array of user IDs
    comments: InstructorPostComment[];
    visibility: PostVisibility;
    courseId?: string; // if visibility is course-related
    status: 'Draft' | 'Published' | 'Scheduled';
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    history?: any[]; // Simplified for now
    deletedAt?: Date;
}

export type Page = 'login' | 'register' | 'instructorRegister' | 'dashboard' | 'admin' | 'courses' | 'courseDetail' | 'profile' | 'notifications' | 'examAttempt' | 'news' | 'newsDetail' | 'lessonWatch' | 'exams' | 'leaderboard' | 'instructorDashboard' | 'instructorPosts' | 'instructorPostDetail';

export enum NotificationType {
    SUCCESS = 'success',
    ERROR = 'error',
    INFO = 'info',
}

export interface NotificationMessage {
    id: number;
    message: string;
    type: NotificationType;
}

export interface VersionInfo {
    version: string;
    releaseDate: string;
    changelog: string[];
}

export interface InstructionVersion {
    version: string;
    editedAt: Date;
    editedBy: string;
    content: Pick<InstructionContent, 'title' | 'content'>;
}

export interface InstructionContent {
    version: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
    history?: InstructionVersion[];
}

export type ContactType = 'Phone' | 'WhatsApp' | 'Telegram' | 'Email';

export interface ContactInfo {
    id: string;
    type: ContactType;
    value: string;
    isPublic: boolean;
}

export interface SystemSettings {
    isCoursePopupEnabled: boolean;
    isInstructionPopupEnabled: boolean;
    logoUrl: string;
    contactInfo: ContactInfo[];
    sessionTimeoutInMinutes: number;
    singleDeviceLogin: boolean;
    storageUsageGB: number;
    storageLimitGB: number;
}

export interface Backup {
    id: string;
    timestamp: Date;
    data: string; // JSON string of the entire database state
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    sessionId?: string;
    message: string;
}
