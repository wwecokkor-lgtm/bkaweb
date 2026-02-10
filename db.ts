
import type { User, Course, Order, Lesson, PaymentMethod, AdminLog, Exam, Notice, NewsPost, Media, YouTubeVideo, ExamAttempt, Comment, UserStatus, VersionInfo, SystemSettings, InstructionContent, Backup, Badge, UserActivity, Instructor, InstructorSlide, InstructorPost, Coupon } from './types';
import { Role, QuestionType, PostCategory } from './types';

// --- DATABASE STATE & PERSISTENCE ---

interface DBState {
    users: User[]; courses: Course[]; orders: Order[]; paymentMethods: PaymentMethod[]; 
    exams: Exam[]; notices: Notice[]; newsPosts: NewsPost[]; media: Media[]; 
    examAttempts: ExamAttempt[]; adminLogs: AdminLog[]; backups: Backup[]; 
    badges: Badge[]; userActivities: UserActivity[]; instructors: Instructor[]; instructorPosts: InstructorPost[];
    coupons: Coupon[]; version: VersionInfo; systemSettings: SystemSettings; instructionContent: InstructionContent;
}

const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
const hydrateDates = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string' && isoDateRegex.test(value)) {
                obj[key] = new Date(value);
            } else if (typeof value === 'object') {
                hydrateDates(value);
            }
        }
    }
    return obj;
};

let dbState: DBState;

export const saveDB = () => {
    try {
        localStorage.setItem('bk-academy-db', JSON.stringify(dbState));
    } catch (e) {
        console.error("Failed to save DB state to localStorage", e);
    }
};

const loadDB = () => {
    try {
        const savedStateJSON = localStorage.getItem('bk-academy-db');
        if (savedStateJSON) {
            dbState = hydrateDates(JSON.parse(savedStateJSON));
        } else {
            dbState = getInitialState();
            saveDB();
        }
    } catch (e) {
        console.error("Failed to load DB state, falling back to initial state.", e);
        dbState = getInitialState();
    }
};

// --- INITIAL MOCK DATA (ONLY FOR FIRST-TIME LOAD) ---

function getInitialState(): DBState {
    const badges: Badge[] = [ { id: 'b1', name: 'Course Pioneer', icon: '🚀', description: 'Completed your first course!', earnedAt: new Date() }, { id: 'b2', name: 'Exam Master', icon: '🏆', description: 'Scored 100% on an exam!', earnedAt: new Date() }, ];
    const userActivities: UserActivity[] = [ { id: 'ua1', type: 'Login', description: 'Logged in from a new device.', timestamp: new Date(Date.now() - 3600000) }, { id: 'ua2', type: 'Lesson Complete', description: 'Completed "Chapter 1: Motion" in Physics.', timestamp: new Date(Date.now() - 86400000) }, ];
    const instructorSlides: { [key: string]: InstructorSlide[] } = { i1: [ { id: 's1-1', title: 'My Teaching Philosophy', content: 'I believe in making complex topics simple and relatable.' }, { id: 's1-2', title: 'Why Physics?', content: 'Physics is the key to understanding the universe around us.', imageUrl: 'https://picsum.photos/seed/physics-slide/400/200' }, ], i2: [ { id: 's2-1', title: 'The Beauty of Mathematics', content: 'Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding.' }, ], };
    const instructors: Instructor[] = [ { id: 'i1', name: 'Dr. Alam', title: 'Lead Physics Instructor', degrees: 'Ph.D. in Physics, University of Dhaka', experience: '15+ years of teaching experience', bio: 'Dr. Alam is a renowned physics educator known for his engaging teaching style and deep understanding of the subject.', photoUrl: 'https://picsum.photos/seed/dralam/200', email: 'dralam@bk.academy', status: 'Active', isVerified: true, slides: instructorSlides.i1, }, { id: 'i2', name: 'Prof. Kabir', title: 'Senior Mathematics Instructor', degrees: 'M.Sc in Applied Mathematics, BUET', experience: '20+ years of experience', bio: 'Professor Kabir has a passion for mathematics and has helped thousands of students excel in their exams.', photoUrl: 'https://picsum.photos/seed/profkabir/200', email: 'profkabir@bk.academy', status: 'Active', isVerified: true, slides: instructorSlides.i2, }, { id: 'i3', name: 'Mrs. Sultana', title: 'Chemistry Specialist', degrees: 'M.Sc in Chemistry, Jahangirnagar University', experience: '8+ years of experience', bio: 'Mrs. Sultana makes chemistry fun and accessible for students of all levels.', photoUrl: 'https://picsum.photos/seed/mrssultana/200', email: 'mrssultana@bk.academy', status: 'Inactive', isVerified: false, slides: [], }, ];
    const users: User[] = [ { id: '1', username: 'Bayzid', email: 'fffgamer066@gmail.com', role: Role.SUPER_ADMIN, status: 'Active', avatarUrl: 'https://picsum.photos/seed/admin/200', createdAt: new Date(), enrolledCourseIds: ['c1', 'c2', 'c3'], wishlistCourseIds: [], lastLoginAt: new Date(), agreementStatus: 'Agreed', bookmarkedPostIds: ['np1'], phone: '01711111111', grade: 'N/A', school: 'BK Academy Admin', coins: 500, coinTransactions: [], badges: [], activeSessions: [], currentSessionId: undefined }, { id: '2', username: 'Student1', email: 'student1@bk.academy', role: Role.USER, status: 'Active', avatarUrl: 'https://picsum.photos/seed/student1/200', createdAt: new Date(), enrolledCourseIds: ['c1'], wishlistCourseIds: ['c2'], lastLoginAt: new Date(Date.now() - 86400000), agreementStatus: 'Agreed', bookmarkedPostIds: [], phone: '01822222222', grade: '10', school: 'Dhaka Residential Model College', medium: 'Bangla', lessonProgress: { 'l1-1': { progress: 100, completed: true }, 'l1-2': {progress: 20, completed: false} }, coins: 150, coinTransactions: [{id: 'tx1', type: 'Earned', amount: 150, description: 'Welcome bonus', timestamp: new Date()}], badges: [badges[0]], activeSessions: [], currentSessionId: undefined }, { id: '6', username: 'Dr. Alam', email: 'dralam@bk.academy', role: Role.INSTRUCTOR, status: 'Active', avatarUrl: 'https://picsum.photos/seed/dralam/200', createdAt: new Date(), enrolledCourseIds: [], wishlistCourseIds: [], agreementStatus: 'Agreed', instructorProfileId: 'i1', coins: 0, coinTransactions: [], badges: [], activeSessions: [], currentSessionId: undefined }, ];
    const lessons: { [key: string]: Lesson[] } = { c1: [ {id: 'l1-1', title: 'Chapter 1: Motion', contentUrl: 'https://www.youtube.com/watch?v=y_i-x_P26gM', type: 'Video', duration: '08:45', isFree: true, coinReward: 10, likes: ['2', '1'], comments: [{id: 'lc1', userId: '6', username: 'Dr. Alam', avatarUrl: 'https://picsum.photos/seed/dralam/200', content: 'Welcome to the first lesson! Feel free to ask any questions.', createdAt: new Date(Date.now() - 86400000*2), isPinned: true}], resources: [{id: 'r1', title: 'Chapter 1 Notes', url: '#', type: 'PDF'}]}, {id: 'l1-2', title: 'Chapter 2: Forces', contentUrl: 'https://www.youtube.com/watch?v=a_i-x_P26gM', type: 'Video', duration: '12:30', coinReward: 15, likes: [], comments: [], resources: []}, ], c2: [ {id: 'l2-1', title: 'Chapter 1: Matrices', contentUrl: 'https://www.youtube.com/watch?v=b_i-x_P26gM', type: 'Video', duration: '14:55', isFree: true, coinReward: 10, likes: [], comments: [], resources: []}, ], c3: [ {id: 'l3-1', title: 'Chapter 1: Chemical Reactions', contentUrl: 'https://www.youtube.com/watch?v=c_i-x_P26gM', type: 'Video', duration: '10:00', coinReward: 5, likes: [], comments: [], resources: []}, ], };
    const courses: Course[] = [ { id: 'c1', title: 'Physics for Class 10', description: 'Complete course covering the SSC physics syllabus.', author: 'Dr. Alam', authorId: '6', price: 1500, thumbnailUrl: 'https://picsum.photos/seed/physics/400/225', lessons: lessons.c1, category: 'SSC', publishStatus: 'Published', resources: [], createdAt: new Date(), updatedAt: new Date(), instructorIds: ['i1'] }, { id: 'c2', title: 'Higher Math for Class 12', description: 'Advanced topics in mathematics for HSC students.', author: 'Prof. Kabir', authorId: '1', price: 2000, discount: 1800, thumbnailUrl: 'https://picsum.photos/seed/math/400/225', lessons: lessons.c2, category: 'HSC', publishStatus: 'Published', resources: [], createdAt: new Date(), updatedAt: new Date(), instructorIds: ['i2'] }, { id: 'c3', title: 'Chemistry for Class 9', description: 'Fundamental concepts of chemistry.', author: 'Mrs. Sultana', authorId: '1', price: 1200, thumbnailUrl: 'https://picsum.photos/seed/chemistry/400/225', lessons: lessons.c3, category: 'JSC', publishStatus: 'Draft', resources: [], createdAt: new Date(), updatedAt: new Date(), instructorIds: ['i3'] }, ];
    const orders: Order[] = [ { id: 'o1', userId: '2', courseId: 'c1', courseTitle: 'Physics for Class 10', amount: 1500, finalAmount: 1500, status: 'Completed', createdAt: new Date(), paymentMethod: 'bKash', transactionId: 'BK12345XYZ' }, ];
    const paymentMethods: PaymentMethod[] = [ { id: 'pm1', name: 'bKash', type: 'Manual', iconUrl: 'https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg', status: 'Active', accountNumber: '01700000000' }, { id: 'pm2', name: 'Nagad', type: 'Manual', iconUrl: 'https://media.licdn.com/dms/image/D560BAQEg2I27732sVg/company-logo_200_200/0/1687873324158/nagad_logo?e=2147483647&v=beta&t=M8Xq0iWso6s33H520o3p_22j5825J3G9WX0a2CWh3-A', status: 'Active', accountNumber: '01800000000' }, ];
    const exams: Exam[] = [ { id: 'e1', title: 'Physics Chapter 1 Quiz', description: 'A quick quiz on the first chapter of physics.', courseId: 'c1', duration: 10, totalMarks: 10, passMarks: 5, status: 'Published', createdAt: new Date(), questions: [ { id: 'q1-1', questionText: 'What is the unit of force?', questionType: QuestionType.MCQ, options: ['Joule', 'Watt', 'Newton', 'Pascal'], correctAnswer: 'Newton', marks: 5}, { id: 'q1-2', questionText: 'Velocity is a vector quantity.', questionType: QuestionType.TrueFalse, correctAnswer: 'True', marks: 5}, ], coinReward: 10, fullMarksBonus: 5, attemptLimit: 1}, ];
    const newsPosts: NewsPost[] = [ { id: 'np1', title: 'New Physics Batch Starting Soon!', slug: 'new-physics-batch-soon', shortDescription: 'Enroll in our new batch for Class 10 Physics to get a head start.', longDescription: 'Detailed description about the new physics batch, curriculum, and schedule.', category: PostCategory.ANNOUNCEMENT, status: 'Published', isPinned: true, isFeatured: true, priority: 'Top', authorId: '1', attachments: [], createdAt: new Date(), viewCount: 152, readTime: 3, comments: [], likes: ['2'] }, ];
    const media: Media[] = [ { id: 'm1', url: 'https://picsum.photos/seed/media1/400/300', type: 'image', caption: 'Sample Image 1', uploadedAt: new Date(), fileName: 'sample1.jpg', fileSize: 120 * 1024, uploadedByUserId: '1', status: 'Approved' }, ];
    const instructorPosts: InstructorPost[] = [ { id: 'ip1', authorId: '6', title: 'Understanding Newton\'s Laws of Motion', content: 'Today we will dive deep...', attachments: [], likes: ['2'], comments: [], visibility: 'Public', status: 'Published', createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(), viewCount: 250 }, ];
    const coupons: Coupon[] = [ { id: 'coupon1', code: 'BK100', discountType: 'Fixed', discountValue: 100, isActive: true, usageLimit: 0, timesUsed: 5, createdAt: new Date() }, { id: 'coupon2', code: 'SAVE10', discountType: 'Percentage', discountValue: 10, isActive: true, usageLimit: 100, timesUsed: 10, createdAt: new Date() }, ];

    return {
        users, courses, orders, paymentMethods, exams, newsPosts, media, instructorPosts, coupons,
        notices: [], examAttempts: [], adminLogs: [], backups: [], badges, userActivities, instructors,
        version: { version: '1.3.0', releaseDate: '2024-07-30', changelog: [ 'Implemented data persistence.', 'Added coupon system.' ] },
        systemSettings: { isCoursePopupEnabled: true, isInstructionPopupEnabled: true, logoUrl: '', contactInfo: [], sessionTimeoutInMinutes: 30, singleDeviceLogin: true, storageUsageGB: 15.5, storageLimitGB: 200 },
        instructionContent: { version: '1.0', title: 'Welcome & Important Instructions', content: 'Welcome to BK Academy! Before you begin, please read and agree to our terms of use.', lastUpdatedAt: new Date() },
    };
}

loadDB();

// --- EXPORTED DATA & HELPERS ---
export let mockUsers = dbState.users;
export let mockCourses = dbState.courses;
export let mockOrders = dbState.orders;
export let mockPaymentMethods = dbState.paymentMethods;
export let mockExams = dbState.exams;
export let mockNotices = dbState.notices;
export let mockNewsPosts = dbState.newsPosts;
export let mockMedia = dbState.media;
export let mockExamAttempts = dbState.examAttempts;
export let mockAdminLogs = dbState.adminLogs;
export let mockBackups = dbState.backups;
export let mockBadges = dbState.badges;
export let mockUserActivities = dbState.userActivities;
export let currentVersion = dbState.version;
export let systemSettings = dbState.systemSettings;
export let instructionContent = dbState.instructionContent;
export let mockInstructors = dbState.instructors;
export let mockInstructorPosts = dbState.instructorPosts;
export let mockCoupons = dbState.coupons;

export const getDatabaseState = (): DBState => {
    return {
        users: mockUsers,
        courses: mockCourses,
        orders: mockOrders,
        paymentMethods: mockPaymentMethods,
        exams: mockExams,
        notices: mockNotices,
        newsPosts: mockNewsPosts,
        media: mockMedia,
        examAttempts: mockExamAttempts,
        adminLogs: mockAdminLogs,
        backups: mockBackups,
        badges: mockBadges,
        userActivities: mockUserActivities,
        instructors: mockInstructors,
        instructorPosts: mockInstructorPosts,
        coupons: mockCoupons,
        version: currentVersion,
        systemSettings: systemSettings,
        instructionContent: instructionContent,
    };
};

export const setDatabaseState = (newState: DBState) => {
    dbState = hydrateDates(newState);
    
    mockUsers = dbState.users;
    mockCourses = dbState.courses;
    mockOrders = dbState.orders;
    mockPaymentMethods = dbState.paymentMethods;
    mockExams = dbState.exams;
    mockNotices = dbState.notices;
    mockNewsPosts = dbState.newsPosts;
    mockMedia = dbState.media;
    mockExamAttempts = dbState.examAttempts;
    mockAdminLogs = dbState.adminLogs;
    mockBackups = dbState.backups;
    mockBadges = dbState.badges;
    mockUserActivities = dbState.userActivities;
    currentVersion = dbState.version;
    systemSettings = dbState.systemSettings;
    instructionContent = dbState.instructionContent;
    mockInstructors = dbState.instructors;
    mockInstructorPosts = dbState.instructorPosts;
    mockCoupons = dbState.coupons;

    saveDB();
};

export const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));
const getDummyIp = () => `103.12.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;

export const logAdminAction = (adminId: string, action: string, entity: string, entityId: string) => { 
    const admin = dbState.users.find(u => u.id === adminId); 
    if (admin) {
        dbState.adminLogs.unshift({ 
            id: `log${dbState.adminLogs.length + 1}`, 
            adminId, 
            adminName: admin.username, 
            action, 
            entity, 
            entityId, 
            timestamp: new Date(), 
            ipAddress: getDummyIp(),
        }); 
        saveDB();
    }
};
