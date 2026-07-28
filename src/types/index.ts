import type { User, UserProfile, Book, Category, BookRequest, BorrowRecord, Payment, UserRole, BookLanguage, RequestStatus, BorrowStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

// Re-export prisma types
export type { User, UserProfile, Book, Category, BookRequest, BorrowRecord, Payment, UserRole, BookLanguage, RequestStatus, BorrowStatus, PaymentStatus, PaymentMethod };

// Extended types with relations
export type UserWithProfile = User & {
    profile: UserProfile | null;
};

export type BookWithCategory = Book & {
    category: Category | null;
    _count?: {
        reviews: number;
        borrowRecords: number;
    };
};

export type BookWithDetails = Book & {
    category: Category | null;
    reviews: ReviewWithUser[];
    _count: {
        reviews: number;
        borrowRecords: number;
    };
};

export type ReviewWithUser = {
    id: number;
    bookId: number;
    userId: number;
    rating: number;
    reviewText: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
    };
};

export type BorrowRecordWithDetails = BorrowRecord & {
    book: Book & { category: Category | null };
    user: User;
    issuedBy: User | null;
    returnedTo: User | null;
    bookRequest: BookRequest | null;
};

export type BookRequestWithDetails = BookRequest & {
    book: Book & { category: Category | null };
    user: User;
    approvedBy: User | null;
};

export type PaymentWithDetails = Payment & {
    borrowRecord: BorrowRecord & { book: Book };
    user: User;
};

// Session user type
export type SessionUser = {
    id: string;
    username: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
    firstName: string;
    lastName: string;
};

// Notification type (computed, not stored in DB directly)
export type Notification = {
    id: string;
    key: string;
    type: string;
    title: string;
    message: string;
    level: "info" | "warning" | "error" | "success";
    icon: string;
    isRead: boolean;
    fine?: number | null;
    createdAt: Date;
    url?: string;
};

// Pagination
export type PaginatedResult<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};

// Dashboard stats
export type DashboardStats = {
    totalBooks: number;
    totalCategories: number;
    totalUsers: number;
    activeUsers: number;
    availableBooks: number;
    unavailableBooks: number;
    totalCopies: number;
    availableCopies: number;
    totalBorrows: number;
    activeBorrows: number;
    overdueBooks: number;
    returnedBooks: number;
    pendingRequests: number;
    totalFines: number;
    unpaidFines: number;
};
