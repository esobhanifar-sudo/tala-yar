// --- CONFIGURATION ---
// اطلاعات پروژه Supabase شما
const SUPABASE_URL = 'https://otlechriihxznnoamzbx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bGVjaHJpaWh4em5ub2FtemJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODgyNjIsImV4cCI6MjA3ODA2NDI2Mn0._4eHezjQ_RI0Cjw_ZTz0Kxo-ysC4NN2Vexj8QUWBeLg';

// Initialize Supabase Client
// اطمینان حاصل کنید که کتابخانه supabase-js قبل از این فایل در HTML لود شده باشد
// در غیر این صورت، ارور ReferenceError خواهید گرفت.
let sb;
if (typeof supabase !== 'undefined') {
    const { createClient } = supabase;
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase client library not found. Please include the script tag.');
}

// --- AUTH FUNCTIONS ---

// 1. Sign In with Google
async function signInWithGoogle() {
    try {
        const { data, error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // بعد از لاگین به صفحه اصلی برگردد
                redirectTo: window.location.origin + '/index.html',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
        if (error) throw error;
    } catch (error) {
        console.error('Login error:', error.message);
        alert('خطا در اتصال به گوگل: ' + error.message);
    }
}

// 2. Sign Out
async function signOut() {
    const { error } = await sb.auth.signOut();
    if (!error) {
        window.location.href = 'index.html';
    } else {
        console.error('Logout error:', error);
        alert('خطا در خروج از حساب');
    }
}

// 3. Get Current User Profile (Role & Active Status)
async function getUserProfile() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;

    // دریافت اطلاعات تکمیلی از جدول users
    const { data: user, error } = await sb
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.warn('Profile fetch warning:', error.message);
        return null;
    }
    return user;
}

// 4. Protected Route Check (Auth Guard)
// این تابع را در ابتدای صفحات محافظت شده (مثل loan.html) صدا بزنید
async function checkAuthGuard() {
    const { data: { session } } = await sb.auth.getSession();
    
    // الف) آیا کاربر لاگین است؟
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // ب) آیا کاربر تایید شده است؟
    const { data: user, error } = await sb
        .from('users')
        .select('is_active')
        .eq('id', session.user.id)
        .single();

    if (error || !user) {
        console.warn("User record missing or error."); 
        return;
    }

    if (!user.is_active) {
        alert('حساب کاربری شما هنوز تایید نشده است. لطفا با ادمین تماس بگیرید.');
        window.location.href = 'index.html';
    }
}

// 5. Admin Guard
// مخصوص صفحه admin.html (اگر از این فایل استفاده شود)
async function checkAdminGuard() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    const { data: user } = await sb
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (!user || user.role !== 'admin') {
        alert('شما اجازه دسترسی به این صفحه را ندارید.');
        window.location.href = 'index.html';
    }
}