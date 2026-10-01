let currentIdentifier = "";
let serverGeneratedOtp = "";
let activeMode = 'phone'; // 'phone' or 'email'
let isForgotPasswordFlow = false;

const today = new Date().toISOString().split('T')[0];
const dateInput = document.getElementById('bDate');
if(dateInput) dateInput.setAttribute('min', today);

function toggleInputMode(mode) {
    activeMode = mode;
    const phoneDiv = document.getElementById('phoneModeDiv');
    const emailDiv = document.getElementById('emailModeDiv');
    const subtitle = document.getElementById('loginSubtitle');
    const continueBtn = document.getElementById('continueBtn');

    continueBtn.disabled = true;
    continueBtn.className = "w-full bg-[#E8C5C8] text-[#4A3331] font-bold py-4 rounded-2xl transition duration-300 shadow-sm text-sm mt-2 cursor-not-allowed";

    if (mode === 'email') {
        phoneDiv.classList.add('hidden');
        emailDiv.classList.remove('hidden');
        subtitle.innerText = "Enter your Email ID to continue";
        document.getElementById('phoneInputId').value = '';
        document.getElementById('phoneError').classList.add('hidden');
    } else {
        emailDiv.classList.add('hidden');
        phoneDiv.classList.remove('hidden');
        subtitle.innerText = "Enter your mobile number to continue";
        document.getElementById('emailInputId').value = '';
        document.getElementById('emailError').classList.add('hidden');
    }
}

function toggleServiceMode() {
    const serviceType = document.getElementById('bServiceType').value;
    const addressBox = document.getElementById('addressBoxDiv');
    const addressInput = document.getElementById('bAddress');

    if (serviceType === 'Studio Visit') {
        addressBox.classList.add('hidden');
        addressInput.required = false;
    } else {
        addressBox.classList.remove('hidden');
        addressInput.required = true;
    }
}

function selectServiceCard(serviceName) {
    const serviceSelect = document.getElementById('bService');
    for (let i = 0; i < serviceSelect.options.length; i++) {
        if (serviceSelect.options[i].value === serviceName) {
            serviceSelect.selectedIndex = i;
            break;
        }
    }
    document.getElementById('bookingForm').scrollIntoView({ behavior: 'smooth' });
}

function validateInput(element, type) {
    const val = element.value.trim();
    const continueBtn = document.getElementById('continueBtn');
    
    const mobileRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const isAdmin = (val === "Ly9228538@gmail.com");

    let isValid = false;

    if (type === 'phone') {
        element.value = val.replace(/\D/g, '').slice(0, 10);
        const currentVal = element.value;
        
        if (mobileRegex.test(currentVal) || currentVal === "Ly9228538@gmail.com") {
            isValid = true;
            document.getElementById('phoneError').classList.add('hidden');
        } else if (currentVal.length > 0) {
            document.getElementById('phoneError').classList.remove('hidden');
        } else {
            document.getElementById('phoneError').classList.add('hidden');
        }
    } else {
        if (emailRegex.test(val) || isAdmin) {
            isValid = true;
            document.getElementById('emailError').classList.add('hidden');
        } else if (val.length > 0) {
            document.getElementById('emailError').classList.remove('hidden');
        } else {
            document.getElementById('emailError').classList.add('hidden');
        }
    }

    if (isValid) {
        continueBtn.disabled = false;
        continueBtn.className = "w-full bg-[#6B4242] hover:bg-[#523232] text-white font-bold py-4 rounded-2xl transition duration-300 shadow-lg shadow-[#6B4242]/20 text-sm mt-2 cursor-pointer hover:shadow-xl hover:-translate-y-0.5";
    } else {
        continueBtn.disabled = true;
        continueBtn.className = "w-full bg-[#E8C5C8] text-[#4A3331] font-bold py-4 rounded-2xl transition duration-300 shadow-sm text-sm mt-2 cursor-not-allowed";
    }
}

async function checkUserType() {
    let inputVal = "";
    if (activeMode === 'phone') {
        inputVal = document.getElementById('phoneInputId').value.trim();
    } else {
        inputVal = document.getElementById('emailInputId').value.trim();
    }

    currentIdentifier = inputVal;
    isForgotPasswordFlow = false;

    try {
        const response = await fetch('/api/auth/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: currentIdentifier })
        });
        const data = await response.json();

        document.getElementById('identifierBox').classList.add('hidden');

        if (data.type === 'ADMIN_EXISTS' || data.type === 'USER_EXISTS') {
            document.getElementById('passwordBox').classList.remove('hidden');
            document.getElementById('pwdPrompt').innerText = data.type === 'ADMIN_EXISTS' ? "Enter Salon Admin Password" : "Enter your Password";
        } else if (data.type === 'NEW_USER_OTP') {
            serverGeneratedOtp = data.otp;
            alert(`[SALON OTP SECURE] Your verification code is: ${serverGeneratedOtp}`);
            document.getElementById('otpBox').classList.remove('hidden');
            document.getElementById('otpNotice').innerText = `Verification code sent to ${currentIdentifier}`;
        }
    } catch (err) {
        alert('Server connection error!');
    }
}

async function triggerForgotPassword() {
    isForgotPasswordFlow = true;
    try {
        const response = await fetch('/api/auth/forgot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: currentIdentifier })
        });
        const data = await response.json();

        if (data.success) {
            serverGeneratedOtp = data.otp;
            document.getElementById('passwordBox').classList.add('hidden');
            alert(`[FORGOT PASSWORD OTP] Your reset code is: ${serverGeneratedOtp}`);
            document.getElementById('otpBox').classList.remove('hidden');
            document.getElementById('otpNotice').innerText = `Password reset code sent to ${currentIdentifier}`;
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error initiating password reset');
    }
}

async function submitLogin() {
    const password = document.getElementById('passwordInput').value;
    if(!password) return alert('Password enter karna zaroori hai!');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: currentIdentifier, password, isNew: false })
        });
        const data = await response.json();

        if (data.success) {
            handleLoginSuccess(data.role);
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Login failed!');
    }
}

function verifyOtp() {
    const enteredOtp = document.getElementById('otpInput').value.trim();
    if(!enteredOtp) {
        alert('Kripya OTP enter karein!');
        return;
    }
    
    if(enteredOtp === serverGeneratedOtp) {
        document.getElementById('otpBox').classList.add('hidden');
        document.getElementById('setNewPasswordBox').classList.remove('hidden');
        document.getElementById('pwdSetTitle').innerText = isForgotPasswordFlow ? "Reset Your Password" : "Set your password for future visits.";
    } else {
        alert('Invalid OTP! Kripya sahi OTP enter karein.');
    }
}

async function registerNewUser() {
    const password = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    if(!password || !confirmPassword) {
        alert('Dono password fields bharna zaroori hai!');
        return;
    }

    if(password !== confirmPassword) {
        alert('New Password aur Confirm Password match nahi kar rahe hain! Kripya dobara check karein.');
        return;
    }

    if (isForgotPasswordFlow) {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: currentIdentifier, newPassword: password })
            });
            const data = await response.json();
            if (data.success) {
                alert('Password successfully reset! Now logging in...');
                handleLoginSuccess(currentIdentifier === "Ly9228538@gmail.com" ? 'admin' : 'user');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to reset password');
        }
    } else {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: currentIdentifier, password, isNew: true })
            });
            const data = await response.json();

            if (data.success) {
                handleLoginSuccess('user');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Registration failed!');
        }
    }
}

function handleLoginSuccess(role) {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('navUser').innerText = `Account: ${currentIdentifier}`;

    if(role === 'admin') {
        document.getElementById('adminDashboard').classList.remove('hidden');
        loadAdminPanel();
    } else {
        document.getElementById('userDashboard').classList.remove('hidden');
        loadUserBookings();
    }
}

function showPaymentModal(e) {
    e.preventDefault();
    document.getElementById('upiModal').classList.remove('hidden');
}

function cancelPaymentModal() {
    document.getElementById('upiModal').classList.add('hidden');
}

async function confirmBookingAfterPayment() {
    const serviceType = document.getElementById('bServiceType').value;
    const bookingData = {
        identifier: currentIdentifier,
        name: document.getElementById('bName').value,
        phone: document.getElementById('bPhone').value,
        serviceType: serviceType,
        address: serviceType === 'Home Visit' ? document.getElementById('bAddress').value : 'Studio Location',
        service: document.getElementById('bService').value,
        date: document.getElementById('bDate').value,
        slot: document.getElementById('bSlot').value
    };

    try {
        const response = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        const data = await response.json();

        if(data.success) {
            document.getElementById('upiModal').classList.add('hidden');
            alert('✨ Appointment Booked Successfully! Status is currently Pending until Admin confirms.');
            document.getElementById('bookingForm').reset();
            toggleServiceMode();
            loadUserBookings();
        }
    } catch (err) {
        alert('Booking failed');
    }
}

async function loadUserBookings() {
    try {
        const response = await fetch(`/api/bookings/user/${currentIdentifier}`);
        const data = await response.json();
        const listDiv = document.getElementById('myBookingsList');

        if(data.bookings.length === 0) {
            listDiv.innerHTML = `<p class="text-sm text-[#8C7A75]">No appointments booked yet.</p>`;
            return;
        }

        let html = '';
        data.bookings.forEach(b => {
            let statusColor = 'text-amber-600';
            if(b.status === 'Confirmed') statusColor = 'text-emerald-700 font-bold';
            if(b.status === 'Cancelled') statusColor = 'text-rose-600 font-bold';

            html += `
                <div class="p-4 bg-[#FAF7F5] border border-[#EEDFD8] rounded-2xl space-y-1 text-sm shadow-sm transition hover:shadow-md">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-[#A67B7B] uppercase tracking-wider">Booking ID: ${b.id} | Mode: ${b.serviceType}</span>
                        <span class="${statusColor}">Status: ${b.status}</span>
                    </div>
                    <div>
                        <b class="text-[#3D2C2A]">${b.service}</b> on ${b.date} (${b.slot})<br>
                        <span class="text-xs text-[#8C7A75]">📍 <b>Location:</b> ${b.address}</span>
                    </div>
                    ${b.status === 'Pending' ? `<div class="pt-2"><button onclick="cancelBookingUser('${b.id}')" class="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-xl text-xs hover:bg-rose-100 font-semibold transition">Cancel Appointment</button></div>` : (b.status === 'Confirmed' ? `<p class="text-[11px] text-emerald-700 font-semibold pt-1">✓ Confirmed by Admin</p>` : '')}
                </div>
            `;
        });
        listDiv.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

async function cancelBookingUser(id) {
    try {
        const res = await fetch('/api/bookings/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, role: 'user' })
        });
        const data = await res.json();
        if(data.success) {
            loadUserBookings();
            alert('Appointment Cancelled successfully.');
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error cancelling appointment');
    }
}

async function loadAdminPanel() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        document.getElementById('statUsers').innerText = data.stats.totalUsers;
        document.getElementById('statBookings').innerText = data.stats.totalBookings;
        document.getElementById('statCancelled').innerText = data.stats.cancelledBookings;

        const tableDiv = document.getElementById('adminBookingsTable');
        if(data.bookings.length === 0) {
            tableDiv.innerHTML = `<p class="text-sm text-[#8C7A75]">No salon activity recorded yet.</p>`;
            return;
        }

        let tableHtml = `
            <table class="w-full text-left text-sm border-collapse">
                <thead>
                    <tr class="bg-[#FAF7F5] text-[#6B4242]">
                        <th class="p-3.5 rounded-l-2xl font-bold">Booking ID & Client</th>
                        <th class="p-3.5 font-bold">Service & Mode</th>
                        <th class="p-3.5 font-bold">Date & Slot</th>
                        <th class="p-3.5 font-bold">Status</th>
                        <th class="p-3.5 rounded-r-2xl font-bold text-center">Admin Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.bookings.forEach(b => {
            let statusBadge = 'bg-amber-100 text-amber-800';
            if(b.status === 'Confirmed') statusBadge = 'bg-emerald-100 text-emerald-800';
            if(b.status === 'Cancelled') statusBadge = 'bg-rose-100 text-rose-700';

            tableHtml += `
                <tr class="border-b border-[#F3E8E6] transition hover:bg-[#FAF7F5]/50">
                    <td class="p-3.5 font-medium text-[#3D2C2A]">
                        <span class="text-xs font-bold text-[#A67B7B]">${b.id}</span><br>
                        <b>${b.name}</b><br>
                        <span class="text-xs text-[#8C7A75]">${b.phone}</span>
                    </td>
                    <td class="p-3.5 text-[#3D2C2A]">
                        <b>${b.service}</b><br>
                        <span class="text-xs font-semibold text-indigo-700">📌 ${b.serviceType}</span><br>
                        <span class="text-xs text-[#8C7A75]">📍 ${b.address}</span>
                    </td>
                    <td class="p-3.5 text-xs text-[#8C7A75]">${b.date}<br>${b.slot}</td>
                    <td class="p-3.5"><span class="px-3 py-1 rounded-full text-xs font-semibold ${statusBadge}">${b.status}</span></td>
                    <td class="p-3.5 text-center space-x-1">
                        ${b.status !== 'Confirmed' ? `<button onclick="adminUpdateStatus('${b.id}', 'Confirmed')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">Confirm</button>` : ''}
                        ${b.status !== 'Cancelled' ? `<button onclick="adminUpdateStatus('${b.id}', 'Cancelled')" class="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">Cancel</button>` : ''}
                    </td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;
        tableDiv.innerHTML = tableHtml;
    } catch (err) {
        console.error(err);
    }
}

async function adminUpdateStatus(id, status) {
    try {
        const res = await fetch('/api/admin/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const data = await res.json();
        if(data.success) {
            loadAdminPanel();
            alert(`Booking successfully marked as ${status}!`);
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error updating status');
    }
}

function logout() {
    location.reload();
}