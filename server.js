const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory database
let users = [];
let bookings = [];

// Admin credentials
const ADMIN_IDENTIFIER = "Ly9228538@gmail.com";
const ADMIN_PASSWORD = "adminpassword123";

// 1. Check user type API
app.post('/api/auth/check', (req, res) => {
    const { identifier } = req.body;
    
    if (identifier === ADMIN_IDENTIFIER) {
        return res.json({ type: 'ADMIN_EXISTS' });
    }

    const existingUser = users.find(u => u.identifier === identifier);
    if (existingUser) {
        return res.json({ type: 'USER_EXISTS' });
    } else {
        const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
        return res.json({ type: 'NEW_USER_OTP', otp: randomOtp });
    }
});

// 2. Login / Register API
app.post('/api/auth/login', (req, res) => {
    const { identifier, password, isNew } = req.body;

    if (identifier === ADMIN_IDENTIFIER) {
        if (password === ADMIN_PASSWORD) {
            return res.json({ success: true, role: 'admin' });
        } else {
            return res.json({ success: false, message: 'Invalid Admin Password!' });
        }
    }

    if (isNew) {
        users.push({ identifier, password });
        return res.json({ success: true, role: 'user' });
    } else {
        const user = users.find(u => u.identifier === identifier && u.password === password);
        if (user) {
            return res.json({ success: true, role: 'user' });
        } else {
            return res.json({ success: false, message: 'Invalid Password! Kripya sahi password dalein ya Forgot Password use karein.' });
        }
    }
});

// 3. Forgot Password API - Generate OTP for password reset
app.post('/api/auth/forgot', (req, res) => {
    const { identifier } = req.body;
    const user = users.find(u => u.identifier === identifier);
    
    if (!user) {
        return res.json({ success: false, message: 'User not registered with this identifier!' });
    }

    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    res.json({ success: true, otp: randomOtp });
});

// 4. Reset Password API
app.post('/api/auth/reset-password', (req, res) => {
    const { identifier, newPassword } = req.body;
    const user = users.find(u => u.identifier === identifier);
    
    if (user) {
        user.password = newPassword;
        return res.json({ success: true });
    } else {
        return res.json({ success: false, message: 'User not found!' });
    }
});

// 5. Create Booking API (Status forced to Pending initially)
app.post('/api/bookings/create', (req, res) => {
    const { identifier, name, phone, serviceType, address, service, date, slot } = req.body;
    const newBooking = {
        id: 'B-' + Date.now(),
        identifier,
        name,
        phone,
        serviceType,
        address: serviceType === 'Home Visit' ? address : 'Studio Location (Pilu Beauty Studio)',
        service,
        date,
        slot,
        status: 'Pending'
    };
    bookings.push(newBooking);
    res.json({ success: true, booking: newBooking });
});

// 6. Get User Bookings API
app.get('/api/bookings/user/:identifier', (req, res) => {
    const userBookings = bookings.filter(b => b.identifier === req.params.identifier);
    res.json({ bookings: userBookings });
});

// 7. Cancel Booking API (Only if Pending)
app.post('/api/bookings/cancel', (req, res) => {
    const { id, role } = req.body;
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
        return res.json({ success: false, message: 'Booking not found' });
    }

    if (role === 'user' && booking.status !== 'Pending') {
        return res.json({ success: false, message: 'Confirmed booking cannot be cancelled by user!' });
    }

    booking.status = 'Cancelled';
    res.json({ success: true });
});

// 8. Admin Update Status API
app.post('/api/admin/update-status', (req, res) => {
    const { id, status } = req.body;
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        booking.status = status;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Booking not found' });
    }
});

// 9. Admin Stats API
app.get('/api/admin/stats', (req, res) => {
    const totalUsers = users.length + 1;
    const totalBookings = bookings.length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;

    res.json({
        stats: { totalUsers, totalBookings, cancelledBookings },
        bookings: bookings
    });
});

app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});