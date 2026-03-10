/* ============================================
   PRIME NET - Invoice & Quotation System
   Main Application Logic
   ============================================ */

// ============ DATA STORAGE ============
// Now using Global Memory initialized via API
let globalData = {
    invoices: [],
    quotes: [],
    clients: [],
    products: [],
    users: [],
    settings: {},
    counters: { invoice: 1000, quote: 1000 }
};

const API_BASE = 'api/';

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: {} };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    // Append a timestamp to bypass cache on GET requests
    const url = method === 'GET' ? `${API_BASE}${endpoint}?_t=${new Date().getTime()}` : `${API_BASE}${endpoint}`;
    
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
    } catch (e) {
        console.error(`API config failed for ${endpoint}`, e);
        return null;
    }
}

async function initData() {
    // Show spinner or something if needed
    
    // Fetch all data in parallel
    const [invs, qts, clts, prods, usrs, sets] = await Promise.all([
        apiCall('invoices.php'),
        apiCall('quotes.php'),
        apiCall('clients.php'),
        apiCall('products.php'),
        apiCall('users.php'),
        apiCall('settings.php')
    ]);
    
    if (invs) globalData.invoices = invs;
    if (qts) globalData.quotes = qts;
    if (clts) globalData.clients = clts;
    if (prods) globalData.products = prods;
    if (usrs) globalData.users = usrs;
    
    if (sets) {
        if (sets.settings && Object.keys(sets.settings).length > 0) globalData.settings = sets.settings;
        if (sets.counters && Object.keys(sets.counters).length > 0) globalData.counters = sets.counters;
    }
}

function getData(key) {
    if(key === KEYS.invoices) return globalData.invoices;
    if(key === KEYS.quotes) return globalData.quotes;
    if(key === KEYS.clients) return globalData.clients;
    if(key === KEYS.products) return globalData.products;
    return [];
}

function setData(key, data) {
    // Kept for backward compatibility, but actual saving happens via API now
    if(key === KEYS.invoices) globalData.invoices = data;
    if(key === KEYS.quotes) globalData.quotes = data;
    if(key === KEYS.clients) globalData.clients = data;
    if(key === KEYS.products) globalData.products = data;
}

function getSettings() {
    const defaults = {
        companyName: 'PRIME NET',
        companyTagline: 'لتقنية المعلومات | حلول رقمية متكاملة',
        companyAddress: 'المملكة العربية السعودية',
        companyPhone: '059 297 3183',
        companyEmail: 'safiat.msh@gmail.com',
        companyTaxNumber: '',
        companyCR: '',
        vatRate: 15,
        currency: 'ر.س',
        invPrefix: 'INV-',
        quotePrefix: 'QT-',
        defaultNotes: 'نشكركم على ثقتكم بنا. الأسعار لا تشمل أي أعمال إضافية غير مذكورة في العرض.',
        vatMode: 'inclusive',
    };
    return { ...defaults, ...globalData.settings };
}

function getCounters() {
    return globalData.counters;
}

// Ensure async setting saves
async function saveSettingsWrapper(settings) {
    globalData.settings = settings;
    await apiCall('settings.php', 'POST', { settings });
}

async function saveCountersWrapper(counters) {
    globalData.counters = counters;
    await apiCall('settings.php', 'POST', { counters });
}

async function nextInvoiceNumber() {
    const c = getCounters();
    c.invoice++;
    await saveCountersWrapper(c);
    const s = getSettings();
    return s.invPrefix + String(c.invoice).padStart(4, '0');
}

async function nextQuoteNumber() {
    const c = getCounters();
    c.quote++;
    await saveCountersWrapper(c);
    const s = getSettings();
    return s.quotePrefix + String(c.quote).padStart(4, '0');
}

// ============ NAVIGATION ============
let currentPage = 'dashboard';
let editingInvoiceId = null;
let editingQuoteId = null;
let editingClientId = null;

function navigateTo(page) {
    currentPage = page;

    // Hide all pages
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    // Active nav
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    // Page titles
    const titles = {
        'dashboard': 'لوحة التحكم',
        'invoices': 'الفواتير',
        'quotes': 'عروض الأسعار',
        'new-invoice': editingInvoiceId ? 'تعديل فاتورة' : 'فاتورة جديدة',
        'new-quote': editingQuoteId ? 'تعديل عرض سعر' : 'عرض سعر جديد',
        'clients': 'العملاء',
        'settings': 'الإعدادات'
    };
    document.getElementById('pageTitle').textContent = titles[page] || '';

    // Render page content
    if (page === 'dashboard') renderDashboard();
    if (page === 'invoices') renderInvoicesList();
    if (page === 'quotes') renderQuotesList();
    if (page === 'clients') renderClientsList();
    if (page === 'settings') {
        loadSettings();
        if (document.getElementById('usersTableBody')) {
            renderUsersList();
        }
    }
    if (page === 'new-invoice' && !editingInvoiceId) resetInvoiceForm();
    if (page === 'new-quote' && !editingQuoteId) resetQuoteForm();

    // Close sidebar on mobile
    closeSidebar();

    // Scroll to top
    window.scrollTo(0, 0);
}

// ============ SIDEBAR TOGGLE ============
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarBackdrop').classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarBackdrop').classList.remove('active');
}

// ============ TOAST ============
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${icons[type]}"></i><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ CONFIRM MODAL ============
function showConfirm(title, message, onYes) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmYes').style.display = 'inline-flex'; // Restore button visibility
    document.getElementById('confirmModal').classList.add('active');
    document.getElementById('confirmYes').onclick = () => {
        closeConfirmModal();
        onYes();
    };
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

// ============ FORMAT HELPERS ============
function formatCurrency(amount) {
    const s = getSettings();
    return parseFloat(amount).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + s.currency;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

// ============ ZATCA QR CODE ============
function tlv(tag, value) {
    const buffer = new TextEncoder().encode(value);
    let str = String.fromCharCode(tag) + String.fromCharCode(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        str += String.fromCharCode(buffer[i]);
    }
    return str;
}
function generateZatcaQRBase64(sellerName, vatRegNumber, timestamp, invoiceTotal, vatTotal) {
    return btoa(
        tlv(1, sellerName) +
        tlv(2, vatRegNumber) +
        tlv(3, timestamp) +
        tlv(4, invoiceTotal) +
        tlv(5, vatTotal)
    );
}

// ============ DASHBOARD ============
function renderDashboard() {
    const invoices = getData(KEYS.invoices);
    const quotes = getData(KEYS.quotes);
    const s = getSettings();

    const totalInvoices = invoices.length;
    const totalQuotes = quotes.length;
    const totalRevenue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0);
    const totalPending = invoices
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + (i.total || 0), 0);

    document.getElementById('statsRow').innerHTML = `
        <div class="stat-card cyan">
            <div class="stat-icon"><i class="fas fa-file-invoice-dollar"></i></div>
            <div class="stat-value">${totalInvoices}</div>
            <div class="stat-label">إجمالي الفواتير</div>
        </div>
        <div class="stat-card blue">
            <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
            <div class="stat-value">${totalQuotes}</div>
            <div class="stat-label">عروض الأسعار</div>
        </div>
        <div class="stat-card green">
            <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
            <div class="stat-value">${formatCurrency(totalRevenue)}</div>
            <div class="stat-label">إجمالي المدفوعات</div>
        </div>
        <div class="stat-card orange">
            <div class="stat-icon"><i class="fas fa-hourglass-half"></i></div>
            <div class="stat-value">${formatCurrency(totalPending)}</div>
            <div class="stat-label">مستحقات معلقة</div>
        </div>
    `;

    // Badges
    document.getElementById('invoicesBadge').textContent = totalInvoices;
    document.getElementById('quotesBadge').textContent = totalQuotes;

    // Recent activity
    const allDocs = [
        ...invoices.map(i => ({ ...i, docType: 'invoice' })),
        ...quotes.map(q => ({ ...q, docType: 'quote' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

    const recentEl = document.getElementById('recentActivity');
    if (allDocs.length === 0) {
        recentEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>لا توجد عمليات بعد</h3>
                <p>ابدأ بإنشاء فاتورة أو عرض سعر جديد</p>
            </div>`;
        return;
    }

    recentEl.innerHTML = allDocs.map(doc => `
        <div class="recent-item" style="cursor:pointer" onclick="previewDoc('${doc.docType}', '${doc.id}')">
            <div class="recent-item-info">
                <div class="recent-item-icon ${doc.docType}">
                    <i class="fas ${doc.docType === 'invoice' ? 'fa-file-invoice-dollar' : 'fa-file-alt'}"></i>
                </div>
                <div class="recent-item-details">
                    <h4>${doc.number} - ${doc.clientName}</h4>
                    <p>${doc.docType === 'invoice' ? 'فاتورة' : 'عرض سعر'} • ${getStatusLabel(doc.status)}</p>
                </div>
            </div>
            <div class="recent-item-amount">
                <div class="amount">${formatCurrency(doc.total)}</div>
                <div class="date">${formatDate(doc.date)}</div>
            </div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        paid: 'مدفوعة',
        pending: 'معلقة',
        cancelled: 'ملغاة',
        draft: 'مسودة',
        quote: 'نشط'
    };
    return labels[status] || status;
}

// ============ INVOICE ITEMS ============
let invoiceItems = [];
let quoteItems = [];

function addInvoiceItem() {
    invoiceItems.push({ description: '', qty: 1, price: 0, isTaxable: true, productId: null });
    renderInvoiceItems();
}

function renderInvoiceItems() {
    const tbody = document.getElementById('invItemsBody');
    tbody.innerHTML = invoiceItems.map((item, i) => `
        <tr>
            <td class="col-num">${i + 1}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="btn-icon" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:0 10px;color:var(--primary-color);" onclick="selectProductForItem('invoice', ${i})" title="اختيار من الكتالوج"><i class="fas fa-list"></i></button>
                    <input type="text" class="form-control" value="${escapeHtml(item.description)}" placeholder="وصف البند" onchange="invoiceItems[${i}].description=this.value">
                </div>
            </td>
            <td><input type="number" class="form-control" value="${item.qty}" min="1" step="1" onchange="invoiceItems[${i}].qty=parseFloat(this.value)||1; calcInvoiceTotals()" oninput="invoiceItems[${i}].qty=parseFloat(this.value)||1; calcInvoiceTotals()"></td>
            <td><input type="number" class="form-control" value="${item.price}" min="0" step="0.01" onchange="invoiceItems[${i}].price=parseFloat(this.value)||0; calcInvoiceTotals()" oninput="invoiceItems[${i}].price=parseFloat(this.value)||0; calcInvoiceTotals()"></td>
            <td style="text-align:center;"><input type="checkbox" style="width:20px;height:20px;cursor:pointer" ${item.isTaxable !== false ? 'checked' : ''} onchange="invoiceItems[${i}].isTaxable=this.checked; calcInvoiceTotals()"></td>
            <td class="item-total">${formatCurrency(item.qty * item.price)}</td>
            <td><button type="button" class="delete-row-btn" onclick="removeInvoiceItem(${i})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    calcInvoiceTotals();
}

function removeInvoiceItem(index) {
    invoiceItems.splice(index, 1);
    renderInvoiceItems();
}

function updatePriceHeaders() {
    const s = getSettings();
    const isInclusive = s.vatMode === 'inclusive';
    const priceLabel = isInclusive ? 'السعر شامل الضريبة' : 'سعر الوحدة';
    const subtotalLabel = isInclusive ? 'المجموع قبل الضريبة' : 'المجموع الفرعي';
    // Update invoice table header
    const invHeaders = document.querySelectorAll('#invItemsTable thead th');
    if (invHeaders.length >= 4) invHeaders[3].textContent = priceLabel;
    // Update quote table header
    const qHeaders = document.querySelectorAll('#qItemsTable thead th');
    if (qHeaders.length >= 4) qHeaders[3].textContent = priceLabel;
    // Update totals labels
    const invSubLabel = document.querySelector('#invSubtotal')?.closest('.totals-row')?.querySelector('span:first-child');
    if (invSubLabel) invSubLabel.textContent = subtotalLabel;
    const qSubLabel = document.querySelector('#qSubtotal')?.closest('.totals-row')?.querySelector('span:first-child');
    if (qSubLabel) qSubLabel.textContent = subtotalLabel;
}

function calcInvoiceTotals() {
    const s = getSettings();
    let subtotal = 0, vat = 0, total = 0;

    invoiceItems.forEach(item => {
        const itemTotal = item.qty * item.price;
        const itemVatRate = item.isTaxable !== false ? s.vatRate : 0;

        if (s.vatMode === 'inclusive') {
            const itemSubtotal = itemTotal / (1 + itemVatRate / 100);
            subtotal += itemSubtotal;
            vat += itemTotal - itemSubtotal;
            total += itemTotal;
        } else {
            const itemVat = itemTotal * (itemVatRate / 100);
            subtotal += itemTotal;
            vat += itemVat;
            total += itemTotal + itemVat;
        }
    });
    document.getElementById('invSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('invVat').textContent = formatCurrency(vat);
    document.getElementById('invTotal').textContent = formatCurrency(total);

    document.querySelectorAll('#invItemsBody .item-total').forEach((el, i) => {
        if (invoiceItems[i]) el.textContent = formatCurrency(invoiceItems[i].qty * invoiceItems[i].price);
    });
    updatePriceHeaders();
}

function resetInvoiceForm() {
    editingInvoiceId = null;
    invoiceItems = [{ description: '', qty: 1, price: 0 }];
    document.getElementById('invClientName').value = '';
    document.getElementById('invClientPhone').value = '';
    document.getElementById('invClientEmail').value = '';
    document.getElementById('invClientAddress').value = '';
    document.getElementById('invClientTax').value = '';
    document.getElementById('invDate').value = todayStr();
    document.getElementById('invNotes').value = getSettings().defaultNotes;
    renderInvoiceItems();
}

async function collectInvoiceData() {
    const name = document.getElementById('invClientName').value.trim();
    if (!name) {
        showToast('يرجى إدخال اسم العميل', 'warning');
        return null;
    }
    const validItems = invoiceItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
        showToast('يرجى إضافة بند واحد على الأقل', 'warning');
        return null;
    }

    const s = getSettings();
    let subtotal = 0, vat = 0, total = 0;

    validItems.forEach(item => {
        const itemTotal = item.qty * item.price;
        const itemVatRate = item.isTaxable !== false ? s.vatRate : 0;

        if (s.vatMode === 'inclusive') {
            const itemSubtotal = itemTotal / (1 + itemVatRate / 100);
            subtotal += itemSubtotal;
            vat += itemTotal - itemSubtotal;
            total += itemTotal;
        } else {
            const itemVat = itemTotal * (itemVatRate / 100);
            subtotal += itemTotal;
            vat += itemVat;
            total += itemTotal + itemVat;
        }
    });

    const invNum = editingInvoiceId ? (getData(KEYS.invoices).find(i => i.id === editingInvoiceId)?.number || await nextInvoiceNumber()) : await nextInvoiceNumber();

    return {
        id: editingInvoiceId || 'inv_' + Date.now(),
        number: invNum,
        clientName: name,
        clientPhone: document.getElementById('invClientPhone').value.trim(),
        clientEmail: document.getElementById('invClientEmail').value.trim(),
        clientAddress: document.getElementById('invClientAddress').value.trim(),
        clientTax: document.getElementById('invClientTax').value.trim(),
        date: document.getElementById('invDate').value || todayStr(),
        items: validItems,
        subtotal,
        vatRate: s.vatRate,
        vat,
        total,
        notes: document.getElementById('invNotes').value.trim(),
        status: 'pending',
        createdAt: editingInvoiceId ? (getData(KEYS.invoices).find(i => i.id === editingInvoiceId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

async function saveInvoice() {
    const data = await collectInvoiceData();
    if (!data) return;

    let invoices = getData(KEYS.invoices);
    const idx = invoices.findIndex(i => i.id === data.id);
    if (idx >= 0) {
        invoices[idx] = data;
    } else {
        invoices.push(data);
    }
    
    const res = await apiCall('invoices.php', 'POST', data);
    if (res && res.success) {
        autoSaveClient(data.clientName, data.clientPhone, data.clientEmail, data.clientAddress, data.clientTax);

        showToast(editingInvoiceId ? 'تم تحديث الفاتورة بنجاح' : 'تم حفظ الفاتورة بنجاح', 'success');
        editingInvoiceId = null;
        navigateTo('invoices');
    } else {
        showToast('حدث خطأ أثناء حفظ الفاتورة', 'error');
    }
}

async function saveAndPreviewInvoice() {
    const data = await collectInvoiceData();
    if (!data) return;

    let invoices = getData(KEYS.invoices);
    const idx = invoices.findIndex(i => i.id === data.id);
    if (idx >= 0) {
        invoices[idx] = data;
    } else {
        invoices.push(data);
    }

    const res = await apiCall('invoices.php', 'POST', data);
    if (res && res.success) {
        autoSaveClient(data.clientName, data.clientPhone, data.clientEmail, data.clientAddress, data.clientTax);

        showToast('تم حفظ الفاتورة بنجاح', 'success');
        editingInvoiceId = null;
        previewDoc('invoice', data.id);
    } else {
        showToast('حدث خطأ أثناء حفظ الفاتورة', 'error');
    }
}

// ============ QUOTE ITEMS ============
function addQuoteItem() {
    quoteItems.push({ description: '', qty: 1, price: 0, isTaxable: true, productId: null });
    renderQuoteItems();
}

function renderQuoteItems() {
    const tbody = document.getElementById('qItemsBody');
    tbody.innerHTML = quoteItems.map((item, i) => `
        <tr>
            <td class="col-num">${i + 1}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="btn-icon" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:0 10px;color:var(--primary-color);" onclick="selectProductForItem('quote', ${i})" title="اختيار من الكتالوج"><i class="fas fa-list"></i></button>
                    <input type="text" class="form-control" value="${escapeHtml(item.description)}" placeholder="وصف البند" onchange="quoteItems[${i}].description=this.value">
                </div>
            </td>
            <td><input type="number" class="form-control" value="${item.qty}" min="1" step="1" onchange="quoteItems[${i}].qty=parseFloat(this.value)||1; calcQuoteTotals()" oninput="quoteItems[${i}].qty=parseFloat(this.value)||1; calcQuoteTotals()"></td>
            <td><input type="number" class="form-control" value="${item.price}" min="0" step="0.01" onchange="quoteItems[${i}].price=parseFloat(this.value)||0; calcQuoteTotals()" oninput="quoteItems[${i}].price=parseFloat(this.value)||0; calcQuoteTotals()"></td>
            <td style="text-align:center;"><input type="checkbox" style="width:20px;height:20px;cursor:pointer" ${item.isTaxable !== false ? 'checked' : ''} onchange="quoteItems[${i}].isTaxable=this.checked; calcQuoteTotals()"></td>
            <td class="item-total">${formatCurrency(item.qty * item.price)}</td>
            <td><button type="button" class="delete-row-btn" onclick="removeQuoteItem(${i})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    calcQuoteTotals();
}

function removeQuoteItem(index) {
    quoteItems.splice(index, 1);
    renderQuoteItems();
}

function calcQuoteTotals() {
    const s = getSettings();
    let subtotal = 0, vat = 0, total = 0;

    quoteItems.forEach(item => {
        const itemTotal = item.qty * item.price;
        const itemVatRate = item.isTaxable !== false ? s.vatRate : 0;

        if (s.vatMode === 'inclusive') {
            const itemSubtotal = itemTotal / (1 + itemVatRate / 100);
            subtotal += itemSubtotal;
            vat += itemTotal - itemSubtotal;
            total += itemTotal;
        } else {
            const itemVat = itemTotal * (itemVatRate / 100);
            subtotal += itemTotal;
            vat += itemVat;
            total += itemTotal + itemVat;
        }
    });
    document.getElementById('qSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('qVat').textContent = formatCurrency(vat);
    document.getElementById('qTotal').textContent = formatCurrency(total);

    document.querySelectorAll('#qItemsBody .item-total').forEach((el, i) => {
        if (quoteItems[i]) el.textContent = formatCurrency(quoteItems[i].qty * quoteItems[i].price);
    });
    updatePriceHeaders();
}

function resetQuoteForm() {
    editingQuoteId = null;
    quoteItems = [{ description: '', qty: 1, price: 0 }];
    document.getElementById('qClientName').value = '';
    document.getElementById('qClientPhone').value = '';
    document.getElementById('qClientEmail').value = '';
    document.getElementById('qClientAddress').value = '';
    document.getElementById('qDate').value = todayStr();
    // Valid for 30 days
    const valid = new Date();
    valid.setDate(valid.getDate() + 30);
    document.getElementById('qValidUntil').value = valid.toISOString().split('T')[0];
    document.getElementById('qNotes').value = getSettings().defaultNotes;
    renderQuoteItems();
}

async function collectQuoteData() {
    const name = document.getElementById('qClientName').value.trim();
    if (!name) {
        showToast('يرجى إدخال اسم العميل', 'warning');
        return null;
    }
    const validItems = quoteItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
        showToast('يرجى إضافة بند واحد على الأقل', 'warning');
        return null;
    }

    const s = getSettings();
    let subtotal = 0, vat = 0, total = 0;

    validItems.forEach(item => {
        const itemTotal = item.qty * item.price;
        const itemVatRate = item.isTaxable !== false ? s.vatRate : 0;

        if (s.vatMode === 'inclusive') {
            const itemSubtotal = itemTotal / (1 + itemVatRate / 100);
            subtotal += itemSubtotal;
            vat += itemTotal - itemSubtotal;
            total += itemTotal;
        } else {
            const itemVat = itemTotal * (itemVatRate / 100);
            subtotal += itemTotal;
            vat += itemVat;
            total += itemTotal + itemVat;
        }
    });

    const qNum = editingQuoteId ? (getData(KEYS.quotes).find(q => q.id === editingQuoteId)?.number || await nextQuoteNumber()) : await nextQuoteNumber();

    return {
        id: editingQuoteId || 'qt_' + Date.now(),
        number: qNum,
        clientName: name,
        clientPhone: document.getElementById('qClientPhone').value.trim(),
        clientEmail: document.getElementById('qClientEmail').value.trim(),
        clientAddress: document.getElementById('qClientAddress').value.trim(),
        date: document.getElementById('qDate').value || todayStr(),
        validUntil: document.getElementById('qValidUntil').value || '',
        items: validItems,
        subtotal,
        vatRate: s.vatRate,
        vat,
        total,
        notes: document.getElementById('qNotes').value.trim(),
        status: 'quote',
        createdAt: editingQuoteId ? (getData(KEYS.quotes).find(q => q.id === editingQuoteId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

async function saveQuote() {
    const data = await collectQuoteData();
    if (!data) return;

    let quotes = getData(KEYS.quotes);
    const idx = quotes.findIndex(q => q.id === data.id);
    if (idx >= 0) {
        quotes[idx] = data;
    } else {
        quotes.push(data);
    }
    
    const res = await apiCall('quotes.php', 'POST', data);
    if (res && res.success) {
        autoSaveClient(data.clientName, data.clientPhone, data.clientEmail, data.clientAddress, '');

        showToast(editingQuoteId ? 'تم تحديث عرض السعر بنجاح' : 'تم حفظ عرض السعر بنجاح', 'success');
        editingQuoteId = null;
        navigateTo('quotes');
    } else {
        showToast('حدث خطأ أثناء حفظ عرض السعر', 'error');
    }
}

async function saveAndPreviewQuote() {
    const data = await collectQuoteData();
    if (!data) return;

    let quotes = getData(KEYS.quotes);
    const idx = quotes.findIndex(q => q.id === data.id);
    if (idx >= 0) {
        quotes[idx] = data;
    } else {
        quotes.push(data);
    }
    
    const res = await apiCall('quotes.php', 'POST', data);
    if (res && res.success) {
        autoSaveClient(data.clientName, data.clientPhone, data.clientEmail, data.clientAddress, '');

        showToast('تم حفظ عرض السعر بنجاح', 'success');
        editingQuoteId = null;
        previewDoc('quote', data.id);
    } else {
        showToast('حدث خطأ أثناء حفظ عرض السعر', 'error');
    }
}

// ============ INVOICES LIST ============
function renderInvoicesList() {
    const invoices = getData(KEYS.invoices);
    const search = (document.getElementById('invoiceSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('invoiceStatusFilter')?.value || 'all';

    let filtered = invoices.filter(inv => {
        const matchSearch = inv.number.toLowerCase().includes(search) || inv.clientName.toLowerCase().includes(search);
        const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const container = document.getElementById('invoicesTableContainer');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice-dollar"></i>
                <h3>لا توجد فواتير</h3>
                <p>لم يتم إنشاء أي فواتير بعد</p>
                <button class="btn btn-primary" onclick="navigateTo('new-invoice')"><i class="fas fa-plus"></i> إنشاء فاتورة</button>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>رقم الفاتورة</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(inv => `
                    <tr>
                        <td><strong>${inv.number}</strong></td>
                        <td>${escapeHtml(inv.clientName)}</td>
                        <td>${formatDate(inv.date)}</td>
                        <td><strong>${formatCurrency(inv.total)}</strong></td>
                        <td><span class="status-badge ${inv.status}">${getStatusLabel(inv.status)}</span></td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="معاينة" onclick="previewDoc('invoice','${inv.id}')"><i class="fas fa-eye"></i></button>
                                <button class="btn-icon" title="تعديل" onclick="editInvoice('${inv.id}')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" title="${inv.status === 'paid' ? 'إلغاء الدفع' : 'تأكيد الدفع'}" onclick="toggleInvoiceStatus('${inv.id}')">
                                    <i class="fas ${inv.status === 'paid' ? 'fa-undo' : 'fa-check'}"></i>
                                </button>
                                <button class="btn-icon" title="حذف" onclick="deleteInvoice('${inv.id}')"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function editInvoice(id) {
    const invoices = getData(KEYS.invoices);
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    editingInvoiceId = id;
    document.getElementById('invClientName').value = inv.clientName || '';
    document.getElementById('invClientPhone').value = inv.clientPhone || '';
    document.getElementById('invClientEmail').value = inv.clientEmail || '';
    document.getElementById('invClientAddress').value = inv.clientAddress || '';
    document.getElementById('invClientTax').value = inv.clientTax || '';
    document.getElementById('invDate').value = inv.date || todayStr();
    document.getElementById('invNotes').value = inv.notes || '';
    invoiceItems = inv.items ? inv.items.map(item => ({ ...item })) : [];
    navigateTo('new-invoice');
    renderInvoiceItems();
}

async function toggleInvoiceStatus(id) {
    let invoices = getData(KEYS.invoices);
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    inv.status = inv.status === 'paid' ? 'pending' : 'paid';
    inv.updatedAt = new Date().toISOString();
    
    // Save to server
    await apiCall('invoices.php', 'POST', inv);
    
    showToast(inv.status === 'paid' ? 'تم تأكيد الدفع' : 'تم إلغاء الدفع', 'success');
    renderInvoicesList();
}

function deleteInvoice(id) {
    showConfirm('حذف الفاتورة', 'هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
        let invoices = getData(KEYS.invoices);
        invoices = invoices.filter(i => i.id !== id);
        globalData.invoices = invoices;
        
        await apiCall('invoices.php', 'DELETE', { id });
        
        showToast('تم حذف الفاتورة', 'success');
        renderInvoicesList();
    });
}

// ============ QUOTES LIST ============
function renderQuotesList() {
    const quotes = getData(KEYS.quotes);
    const search = (document.getElementById('quoteSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('quoteStatusFilter')?.value || 'all';

    let filtered = quotes.filter(q => {
        const matchSearch = q.number.toLowerCase().includes(search) || q.clientName.toLowerCase().includes(search);
        const matchStatus = statusFilter === 'all' || q.status === statusFilter;
        return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const container = document.getElementById('quotesTableContainer');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>لا توجد عروض أسعار</h3>
                <p>لم يتم إنشاء أي عروض أسعار بعد</p>
                <button class="btn btn-primary" onclick="navigateTo('new-quote')"><i class="fas fa-plus"></i> إنشاء عرض سعر</button>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>رقم العرض</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>صالح حتى</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(q => `
                    <tr>
                        <td><strong>${q.number}</strong></td>
                        <td>${escapeHtml(q.clientName)}</td>
                        <td>${formatDate(q.date)}</td>
                        <td>${formatDate(q.validUntil)}</td>
                        <td><strong>${formatCurrency(q.total)}</strong></td>
                        <td><span class="status-badge ${q.status}">${getStatusLabel(q.status)}</span></td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="معاينة" onclick="previewDoc('quote','${q.id}')"><i class="fas fa-eye"></i></button>
                                <button class="btn-icon" title="تعديل" onclick="editQuote('${q.id}')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" title="تحويل لفاتورة" onclick="convertToInvoice('${q.id}')"><i class="fas fa-exchange-alt"></i></button>
                                <button class="btn-icon" title="حذف" onclick="deleteQuote('${q.id}')"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function editQuote(id) {
    const quotes = getData(KEYS.quotes);
    const q = quotes.find(q => q.id === id);
    if (!q) return;

    editingQuoteId = id;
    document.getElementById('qClientName').value = q.clientName || '';
    document.getElementById('qClientPhone').value = q.clientPhone || '';
    document.getElementById('qClientEmail').value = q.clientEmail || '';
    document.getElementById('qClientAddress').value = q.clientAddress || '';
    document.getElementById('qDate').value = q.date || todayStr();
    document.getElementById('qValidUntil').value = q.validUntil || '';
    document.getElementById('qNotes').value = q.notes || '';
    quoteItems = q.items ? q.items.map(item => ({ ...item })) : [];
    navigateTo('new-quote');
    renderQuoteItems();
}

function convertToInvoice(quoteId) {
    showConfirm('تحويل إلى فاتورة', 'هل تريد تحويل عرض السعر هذا إلى فاتورة ضريبية؟', async () => {
        const quotes = getData(KEYS.quotes);
        const q = quotes.find(q => q.id === quoteId);
        if (!q) return;

        const invNum = await nextInvoiceNumber();

        const invoiceData = {
            id: 'inv_' + Date.now(),
            number: invNum,
            clientName: q.clientName,
            clientPhone: q.clientPhone || '',
            clientEmail: q.clientEmail || '',
            clientAddress: q.clientAddress || '',
            clientTax: '',
            date: todayStr(),
            items: q.items.map(item => ({ ...item })),
            subtotal: q.subtotal,
            vatRate: q.vatRate,
            vat: q.vat,
            total: q.total,
            notes: q.notes || '',
            status: 'pending',
            convertedFromQuote: q.number,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        let invoices = getData(KEYS.invoices);
        invoices.push(invoiceData);
        globalData.invoices = invoices;
        
        await apiCall('invoices.php', 'POST', invoiceData);

        showToast(`تم تحويل عرض السعر ${q.number} إلى فاتورة ${invoiceData.number}`, 'success');
        navigateTo('invoices');
    });
}

function deleteQuote(id) {
    showConfirm('حذف عرض السعر', 'هل أنت متأكد من حذف عرض السعر؟ لا يمكن التراجع عن هذا الإجراء.', () => {
        let quotes = getData(KEYS.quotes);
        quotes = quotes.filter(q => q.id !== id);
        setData(KEYS.quotes, quotes);
        showToast('تم حذف عرض السعر', 'success');
        renderQuotesList();
    });
}

// ============ PREVIEW ============
function previewDoc(type, id) {
    const data = type === 'invoice'
        ? getData(KEYS.invoices).find(i => i.id === id)
        : getData(KEYS.quotes).find(q => q.id === id);

    if (!data) { showToast('لم يتم العثور على المستند', 'error'); return; }

    const s = getSettings();
    const isInvoice = type === 'invoice';
    document.getElementById('previewTitle').textContent = isInvoice ? `فاتورة ${data.number}` : `عرض سعر ${data.number}`;

    document.getElementById('previewBody').innerHTML = `
        <!-- Header -->
        <div class="preview-header">
            <div class="preview-company-info">
                <img src="img/logo.png" alt="PRIME NET">
                <p>
                    ${escapeHtml(s.companyTagline)}<br>
                    ${s.companyAddress ? escapeHtml(s.companyAddress) + '<br>' : ''}
                    ${s.companyPhone ? 'هاتف: ' + escapeHtml(s.companyPhone) + '<br>' : ''}
                    ${s.companyEmail ? 'بريد: ' + escapeHtml(s.companyEmail) + '<br>' : ''}
                    ${s.companyTaxNumber ? 'الرقم الضريبي: ' + escapeHtml(s.companyTaxNumber) + '<br>' : ''}
                    ${s.companyCR ? 'السجل التجاري: ' + escapeHtml(s.companyCR) : ''}
                </p>
            </div>
            <div class="preview-doc-info">
                <div class="preview-doc-type">${isInvoice ? 'فاتورة ضريبية' : 'عرض سعر'}</div>
                <div class="preview-doc-meta" style="display:flex; justify-content:space-between; align-items:flex-start; gap:15px;">
                    <div>
                        <strong>رقم المستند:</strong> ${data.number}<br>
                        <strong>التاريخ:</strong> ${formatDate(data.date)}<br>
                        ${!isInvoice && data.validUntil ? '<strong>صالح حتى:</strong> ' + formatDate(data.validUntil) + '<br>' : ''}
                        ${isInvoice ? '<strong>الحالة:</strong> ' + getStatusLabel(data.status) : ''}
                        ${data.convertedFromQuote ? '<br><strong>محول من:</strong> ' + data.convertedFromQuote : ''}
                    </div>
                    ${isInvoice ? '<div id="qrcode" style="width:100px; height:100px; padding:4px; border:1px solid #ddd; border-radius:8px; background:#fff; flex-shrink:0;"></div>' : ''}
                </div>
            </div>
        </div>

        <!-- Client Info -->
        <div class="preview-client-box">
            <h4>${isInvoice ? 'بيانات العميل (المشتري)' : 'بيانات العميل'}</h4>
            <p>
                <strong>${escapeHtml(data.clientName)}</strong><br>
                ${data.clientAddress ? escapeHtml(data.clientAddress) + '<br>' : ''}
                ${data.clientPhone ? 'هاتف: ' + escapeHtml(data.clientPhone) + '<br>' : ''}
                ${data.clientEmail ? 'بريد: ' + escapeHtml(data.clientEmail) + '<br>' : ''}
                ${data.clientTax ? 'الرقم الضريبي: ' + escapeHtml(data.clientTax) : ''}
            </p>
        </div>

        <!-- Items Table -->
        <table class="preview-items-table">
            <thead>
                <tr>
                    <th style="width:40px; text-align:center">#</th>
                     <th>الوصف</th>
                    <th style="width:80px; text-align:center">الكمية</th>
                    <th style="width:110px; text-align:center">${s.vatMode === 'inclusive' ? 'السعر شامل الضريبة' : 'سعر الوحدة'}</th>
                    <th style="width:90px; text-align:center">قيمة الضريبة</th>
                    <th style="width:110px; text-align:center">المجموع الفرعي</th>
                    <th style="width:110px; text-align:center">المجموع الشامل</th>
                </tr>
            </thead>
            <tbody>
                ${(data.items || []).map((item, i) => {
        const itemTotal = item.qty * item.price;
        let itemVatAmt = 0;
        if (item.isTaxable !== false) {
            const vatRate = data.vatRate || getSettings().vatRate;
            if (s.vatMode === 'inclusive') {
                const sub = itemTotal / (1 + vatRate / 100);
                itemVatAmt = itemTotal - sub;
            } else {
                itemVatAmt = itemTotal * (vatRate / 100);
            }
        }
        return `
                        <tr>
                            <td style="text-align:center">${i + 1}</td>
                            <td>${escapeHtml(item.description)}</td>
                            <td style="text-align:center">${item.qty}</td>
                            <td style="text-align:center">${formatCurrency(item.price)}</td>
                            <td style="text-align:center">${formatCurrency(itemVatAmt)}</td>
                            <td style="text-align:center">${formatCurrency(itemTotal)}</td>
                            <td style="text-align:center">${formatCurrency(itemTotal + (s.vatMode === 'exclusive' ? itemVatAmt : 0))}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="preview-totals">
            <div class="preview-totals-box">
                <div class="preview-totals-row">
                    <span>${s.vatMode === 'inclusive' ? 'المجموع قبل الضريبة' : 'المجموع الفرعي'}</span>
                    <span>${formatCurrency(data.subtotal)}</span>
                </div>
                <div class="preview-totals-row">
                    <span>ضريبة القيمة المضافة</span>
                    <span>${formatCurrency(data.vat)}</span>
                </div>
                <div class="preview-totals-row grand">
                    <span>الإجمالي شامل الضريبة</span>
                    <span>${formatCurrency(data.total)}</span>
                </div>
            </div>
        </div>

        ${data.notes ? `
        <div class="preview-notes">
            <h4>ملاحظات وشروط</h4>
            <p>${escapeHtml(data.notes).replace(/\n/g, '<br>')}</p>
        </div>` : ''}

        <!-- Footer -->
        <div class="preview-footer">
            <p>شكراً لتعاملكم مع ${escapeHtml(s.companyName)} | ${escapeHtml(s.companyPhone)} | ${escapeHtml(s.companyEmail)}</p>
        </div>
    `;

    document.getElementById('previewOverlay').classList.add('active');

    if (isInvoice) {
        // Generate Zatca base64
        const sellerName = s.companyName || 'Unknown';
        const vatRegNumber = s.companyTaxNumber || '000000000000000';
        let timestamp = data.date;
        if (!timestamp.includes('T')) {
            timestamp = new Date(data.date).toISOString();
        }
        const invoiceTotal = parseFloat(data.total).toFixed(2);
        const vatTotal = parseFloat(data.vat).toFixed(2);
        const base64QR = generateZatcaQRBase64(sellerName, vatRegNumber, timestamp, invoiceTotal, vatTotal);

        document.getElementById('qrcode').innerHTML = ''; // Clear if generating again
        new QRCode(document.getElementById('qrcode'), {
            text: base64QR,
            width: 90,
            height: 90,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.M
        });
    }
}

function closePreview() {
    document.getElementById('previewOverlay').classList.remove('active');
}

function printPreview() {
    window.print();
}

// ============ CLIENTS ============
function renderClientsList() {
    const clients = getData(KEYS.clients);
    const search = (document.getElementById('clientSearch')?.value || '').toLowerCase();

    let filtered = clients.filter(c => c.name.toLowerCase().includes(search))
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    const container = document.getElementById('clientsTableContainer');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>لا يوجد عملاء</h3>
                <p>سيتم إضافة العملاء تلقائياً عند إنشاء الفواتير</p>
                <button class="btn btn-primary" onclick="showAddClientModal()"><i class="fas fa-plus"></i> إضافة عميل</button>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>اسم العميل</th>
                    <th>الهاتف</th>
                    <th>البريد</th>
                    <th>العنوان</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(c => `
                    <tr>
                        <td><strong>${escapeHtml(c.name)}</strong></td>
                        <td>${escapeHtml(c.phone || '-')}</td>
                        <td>${escapeHtml(c.email || '-')}</td>
                        <td>${escapeHtml(c.address || '-')}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="تعديل" onclick="editClient('${c.id}')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" title="حذف" onclick="deleteClient('${c.id}')"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function autoSaveClient(name, phone, email, address, tax) {
    if (!name) return;
    let clients = getData(KEYS.clients);
    const existing = clients.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        // Update existing
        if (phone) existing.phone = phone;
        if (email) existing.email = email;
        if (address) existing.address = address;
        if (tax) existing.tax = tax;
    } else {
        clients.push({
            id: 'cl_' + Date.now(),
            name, phone, email, address, tax
        });
    }
    setData(KEYS.clients, clients);
}

function showAddClientModal() {
    editingClientId = null;
    document.getElementById('clientModalTitle').textContent = 'إضافة عميل جديد';
    document.getElementById('cmClientName').value = '';
    document.getElementById('cmClientPhone').value = '';
    document.getElementById('cmClientEmail').value = '';
    document.getElementById('cmClientAddress').value = '';
    document.getElementById('cmClientTax').value = '';
    document.getElementById('clientModal').classList.add('active');
}

function editClient(id) {
    const clients = getData(KEYS.clients);
    const c = clients.find(c => c.id === id);
    if (!c) return;
    editingClientId = id;
    document.getElementById('clientModalTitle').textContent = 'تعديل بيانات العميل';
    document.getElementById('cmClientName').value = c.name || '';
    document.getElementById('cmClientPhone').value = c.phone || '';
    document.getElementById('cmClientEmail').value = c.email || '';
    document.getElementById('cmClientAddress').value = c.address || '';
    document.getElementById('cmClientTax').value = c.tax || '';
    document.getElementById('clientModal').classList.add('active');
}

async function saveClient() {
    const name = document.getElementById('cmClientName').value.trim();
    if (!name) { showToast('يرجى إدخال اسم العميل', 'warning'); return; }

    const clientData = {
        name,
        phone: document.getElementById('cmClientPhone').value.trim(),
        email: document.getElementById('cmClientEmail').value.trim(),
        address: document.getElementById('cmClientAddress').value.trim(),
        taxNumber: document.getElementById('cmClientTax').value.trim(),
    };

    let clients = globalData.clients || [];
    if (editingClientId) {
        clientData.id = editingClientId;
    } else {
        clientData.id = 'cl_' + Date.now();
    }

    const res = await apiCall('clients.php', 'POST', clientData);
    if (res && res.success) {
        if (editingClientId) {
            const idx = clients.findIndex(c => c.id === editingClientId);
            if (idx >= 0) clients[idx] = clientData;
        } else {
            clients.push(clientData);
        }
        globalData.clients = clients;
        closeClientModal();
        showToast(editingClientId ? 'تم تحديث بيانات العميل' : 'تم إضافة العميل بنجاح', 'success');
        editingClientId = null;
        renderClientsList();
    } else {
        showToast('فشل حفظ العميل', 'error');
    }
}

async function deleteClient(id) {
    showConfirm('حذف العميل', 'هل أنت متأكد من حذف هذا العميل؟', async () => {
        const res = await apiCall('clients.php', 'DELETE', { id });
        if (res && res.success) {
            let clients = globalData.clients || [];
            clients = clients.filter(c => c.id !== id);
            globalData.clients = clients;
            showToast('تم حذف العميل', 'success');
            renderClientsList();
        } else {
            showToast('خطأ في حذف العميل', 'error');
        }
    });
}

function closeClientModal() {
    document.getElementById('clientModal').classList.remove('active');
}

// ============ PRODUCTS / SERVICES ============
let editingProductId = null;

function renderProductsList() {
    const container = document.getElementById('productsTableContainer');
    const products = getData(KEYS.products);
    const search = (document.getElementById('productSearch')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('productTypeFilter')?.value || 'all';

    let filtered = products;
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
    if (typeFilter !== 'all') filtered = filtered.filter(p => p.type === typeFilter);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><h3>لا توجد منتجات أو خدمات</h3><p>ابدأ بإضافة منتج أو خدمة جديدة</p></div>`;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead><tr>
                <th>الاسم</th>
                <th>النوع</th>
                <th>السعر</th>
                <th>الضريبة %</th>
                <th>الوحدة</th>
                <th>إجراءات</th>
            </tr></thead>
            <tbody>${filtered.map(p => `
                <tr>
                    <td><strong>${escapeHtml(p.name)}</strong></td>
                    <td><span class="status-badge ${p.type === 'product' ? 'paid' : 'quote'}">${p.type === 'product' ? 'منتج' : 'خدمة'}</span></td>
                    <td>${formatCurrency(p.price)}</td>
                    <td>${p.isTaxable !== false ? 'نعم' : 'لا'}</td>
                    <td>${escapeHtml(p.unit || '-')}</td>
                    <td class="actions-cell">
                        <button class="btn-icon" onclick="showEditProductModal('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('')}</tbody>
        </table>`;
}

function showAddProductModal() {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'إضافة منتج / خدمة';
    document.getElementById('pmName').value = '';
    document.getElementById('pmPrice').value = '';
    document.getElementById('pmType').value = 'product';
    document.getElementById('pmTaxable').value = 'true';
    document.getElementById('pmUnit').value = '';
    document.getElementById('productModal').classList.add('active');
}

function showEditProductModal(id) {
    const product = getData(KEYS.products).find(p => p.id === id);
    if (!product) return;
    editingProductId = id;
    document.getElementById('productModalTitle').textContent = 'تعديل منتج / خدمة';
    document.getElementById('pmName').value = product.name;
    document.getElementById('pmPrice').value = product.price;
    document.getElementById('pmType').value = product.type;
    document.getElementById('pmTaxable').value = product.isTaxable !== false ? 'true' : 'false';
    document.getElementById('pmUnit').value = product.unit || '';
    document.getElementById('productModal').classList.add('active');
}

async function saveProduct() {
    const name = document.getElementById('pmName').value.trim();
    if (!name) { showToast('يرجى إدخال اسم المنتج/الخدمة', 'warning'); return; }
    const product = {
        id: editingProductId || 'prod_' + Date.now(),
        name: name,
        price: parseFloat(document.getElementById('pmPrice').value) || 0,
        type: document.getElementById('pmType').value,
        isTaxable: document.getElementById('pmTaxable').value === 'true',
        unit: document.getElementById('pmUnit').value.trim(),
    };

    const res = await apiCall('products.php', 'POST', product);
    if (res && res.success) {
        let products = globalData.products || [];
        if (editingProductId) {
            const idx = products.findIndex(p => p.id === editingProductId);
            if (idx >= 0) products[idx] = product;
        } else {
            products.push(product);
        }
        globalData.products = products;
        closeProductModal();
        showToast(editingProductId ? 'تم تحديث المنتج' : 'تم إضافة المنتج بنجاح', 'success');
        editingProductId = null;
        renderProductsList();
    } else {
        showToast('فشل حفظ المنتج', 'error');
    }
}

async function deleteProduct(id) {
    showConfirm('حذف المنتج', 'هل أنت متأكد من حذف هذا المنتج/الخدمة؟', async () => {
        const res = await apiCall('products.php', 'DELETE', { id });
        if (res && res.success) {
            let products = globalData.products || [];
            products = products.filter(p => p.id !== id);
            globalData.products = products;
            showToast('تم حذف المنتج', 'success');
            renderProductsList();
        } else {
            showToast('خطأ في الحذف', 'error');
        }
    });
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

function selectProductForItem(type, index) {
    const products = getData(KEYS.products);
    if (products.length === 0) { showToast('لا توجد منتجات محفوظة', 'warning'); return; }
    const items = type === 'invoice' ? invoiceItems : quoteItems;
    // Build popup
    let html = '<div style="max-height:300px;overflow-y:auto;">';
    products.forEach(p => {
        html += `<div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;" 
            onmouseover="this.style.background='rgba(6,182,212,0.1)'" onmouseout="this.style.background=''" 
            onclick="applyProductToItem('${type}',${index},'${p.id}')">
            <div><strong>${escapeHtml(p.name)}</strong> <span style="color:var(--text-muted);font-size:0.8rem">(${p.type === 'product' ? 'منتج' : 'خدمة'})</span></div>
            <div style="color:var(--primary-color);font-weight:700">${formatCurrency(p.price)} | ${p.isTaxable !== false ? 'ضريبة' : 'معفي'}</div>
        </div>`;
    });
    html += '</div>';
    // Use confirm modal as a product picker
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = 'اختر منتج / خدمة';
    document.getElementById('confirmMessage').innerHTML = html;
    document.getElementById('confirmYes').style.display = 'none';
    modal.classList.add('active');
}

function applyProductToItem(type, index, productId) {
    const product = getData(KEYS.products).find(p => p.id === productId);
    if (!product) return;
    const items = type === 'invoice' ? invoiceItems : quoteItems;
    if (items[index]) {
        items[index].description = product.name;
        items[index].price = product.price;
        items[index].isTaxable = product.isTaxable !== false;
        items[index].productId = product.id;
    }
    closeConfirmModal();
    document.getElementById('confirmYes').style.display = '';
    if (type === 'invoice') renderInvoiceItems(); else renderQuoteItems();
}

// ============ SETTINGS ============
function loadSettings() {
    const s = getSettings();
    document.getElementById('settCompanyName').value = s.companyName;
    document.getElementById('settCompanyTagline').value = s.companyTagline;
    document.getElementById('settCompanyAddress').value = s.companyAddress;
    document.getElementById('settCompanyPhone').value = s.companyPhone;
    document.getElementById('settCompanyEmail').value = s.companyEmail;
    document.getElementById('settCompanyTaxNumber').value = s.companyTaxNumber;
    document.getElementById('settCompanyCR').value = s.companyCR;
    document.getElementById('settVatRate').value = s.vatRate;
    document.getElementById('settVatMode').value = s.vatMode || 'inclusive';
    document.getElementById('settCurrency').value = s.currency;
    document.getElementById('settInvPrefix').value = s.invPrefix;
    document.getElementById('settQuotePrefix').value = s.quotePrefix;
    document.getElementById('settDefaultNotes').value = s.defaultNotes;
}

function saveSettings() {
    const settings = {
        companyName: document.getElementById('settCompanyName').value.trim(),
        companyTagline: document.getElementById('settCompanyTagline').value.trim(),
        companyAddress: document.getElementById('settCompanyAddress').value.trim(),
        companyPhone: document.getElementById('settCompanyPhone').value.trim(),
        companyEmail: document.getElementById('settCompanyEmail').value.trim(),
        companyTaxNumber: document.getElementById('settCompanyTaxNumber').value.trim(),
        companyCR: document.getElementById('settCompanyCR').value.trim(),
        vatRate: parseFloat(document.getElementById('settVatRate').value) || 15,
        vatMode: document.getElementById('settVatMode').value || 'inclusive',
        currency: document.getElementById('settCurrency').value.trim() || 'ر.س',
        invPrefix: document.getElementById('settInvPrefix').value.trim() || 'INV-',
        quotePrefix: document.getElementById('settQuotePrefix').value.trim() || 'QT-',
        defaultNotes: document.getElementById('settDefaultNotes').value.trim(),
    };
    setData(KEYS.settings, settings);
    showToast('تم حفظ الإعدادات بنجاح', 'success');
}

// ============ DATA MANAGEMENT ============
function exportAllData() {
    const data = {
        invoices: getData(KEYS.invoices),
        quotes: getData(KEYS.quotes),
        clients: getData(KEYS.clients),
        settings: getSettings(),
        counters: getCounters(),
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `primenet_backup_${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير البيانات بنجاح', 'success');
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.invoices) setData(KEYS.invoices, data.invoices);
            if (data.quotes) setData(KEYS.quotes, data.quotes);
            if (data.clients) setData(KEYS.clients, data.clients);
            if (data.settings) setData(KEYS.settings, data.settings);
            if (data.counters) setData(KEYS.counters, data.counters);
            showToast('تم استيراد البيانات بنجاح', 'success');
            navigateTo('dashboard');
        } catch {
            showToast('خطأ في قراءة الملف', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function confirmClearData() {
    showConfirm('مسح جميع البيانات', 'سيتم حذف جميع الفواتير وعروض الأسعار والعملاء. هل أنت متأكد؟', () => {
        localStorage.removeItem(KEYS.invoices);
        localStorage.removeItem(KEYS.quotes);
        localStorage.removeItem(KEYS.clients);
        localStorage.removeItem(KEYS.counters);
        showToast('تم مسح جميع البيانات', 'success');
        navigateTo('dashboard');
    });
}

// ============ UTILITIES ============
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============ AUTHENTICATION ============
function logout() {
    sessionStorage.removeItem('pn_auth');
    localStorage.removeItem('pn_auth_persist');
    window.location.href = 'login.html';
}

function checkPermissions() {
    const authList = sessionStorage.getItem('pn_auth') || localStorage.getItem('pn_auth_persist');
    if (authList) {
        const authData = JSON.parse(authList);
        
        // Hide admin-only elements if the user is not an admin
        if (authData.role !== 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
            
            // Apply granular permissions
            const perms = authData.permissions || {};
            
            if (perms.invoices === false) {
                const navLinks = document.querySelectorAll('.nav-item[data-page="invoices"]');
                navLinks.forEach(el => el.style.display = 'none');
            }
            if (perms.quotes === false) {
                const navLinks = document.querySelectorAll('.nav-item[data-page="quotes"]');
                navLinks.forEach(el => el.style.display = 'none');
            }
            if (perms.clients === false) {
                const navLinks = document.querySelectorAll('.nav-item[data-page="clients"]');
                navLinks.forEach(el => el.style.display = 'none');
            }
            if (perms.products === false) {
                const navLinks = document.querySelectorAll('.nav-item[data-page="products"]');
                navLinks.forEach(el => el.style.display = 'none');
            }
        }
    }
}

function togglePermissionsDiv() {
    const role = document.getElementById('uRole').value;
    const permsDiv = document.getElementById('permissionsDiv');
    if (role === 'admin') {
        permsDiv.style.display = 'none';
    } else {
        permsDiv.style.display = 'block';
    }
}

// ============ USERS MANAGEMENT ============
let editingUserId = null;

function renderUsersList() {
    const users = globalData.users || [];
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا يوجد مستخدمين</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${escapeHtml(u.name)}</td>
            <td>${escapeHtml(u.username)}</td>
            <td><span class="status-badge ${u.role === 'admin' ? 'paid' : 'pending'}">${u.role === 'admin' ? 'مدير' : 'موظف'}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon" title="تعديل" onclick="editUser(${u.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" title="حذف" onclick="deleteUser(${u.id})" ${(u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'samir') ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showAddUserModal() {
    editingUserId = null;
    document.getElementById('userModalTitle').textContent = 'إضافة مستخدم جديد';
    document.getElementById('uName').value = '';
    document.getElementById('uUsername').value = '';
    document.getElementById('uPassword').value = '';
    document.getElementById('uRole').value = 'employee';
    document.getElementById('uRole').disabled = false;
    
    // Default all permissions to true
    document.getElementById('permInvoices').checked = true;
    document.getElementById('permQuotes').checked = true;
    document.getElementById('permClients').checked = true;
    document.getElementById('permProducts').checked = true;
    
    togglePermissionsDiv();
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function editUser(id) {
    const users = globalData.users || [];
    const user = users.find(u => u.id === id);
    if (!user) return;

    const currentUser = JSON.parse(sessionStorage.getItem('pn_auth')) || {};
    const currentUsername = currentUser.username ? currentUser.username.toLowerCase() : '';
    
    // Protect main admins from being edited by others
    if (user.username.toLowerCase() === 'admin' && currentUsername !== 'admin') {
        showToast('عذراً! غير مصرح لك بتعديل بيانات المدير الأساسي.', 'error');
        return;
    }
    if (user.username.toLowerCase() === 'samir' && currentUsername !== 'samir') {
        showToast('عذراً! غير مصرح لك بتعديل بيانات مدير النظام (Samir).', 'error');
        return;
    }

    editingUserId = id;
    document.getElementById('userModalTitle').textContent = 'تعديل بيانات المستخدم';
    document.getElementById('uName').value = user.name || '';
    document.getElementById('uUsername').value = user.username || '';
    document.getElementById('uPassword').value = user.password || '';
    document.getElementById('uRole').value = user.role || 'employee';
    
    // Set permissions
    const perms = user.permissions || { invoices: true, quotes: true, clients: true, products: true };
    document.getElementById('permInvoices').checked = perms.invoices;
    document.getElementById('permQuotes').checked = perms.quotes;
    document.getElementById('permClients').checked = perms.clients;
    document.getElementById('permProducts').checked = perms.products;
    
    // Prevent changing role of the main admin accounts
    if (user.username.toLowerCase() === 'admin' || user.username.toLowerCase() === 'samir') {
        document.getElementById('uRole').disabled = true;
    } else {
        document.getElementById('uRole').disabled = false;
    }

    togglePermissionsDiv();
    document.getElementById('userModal').classList.add('active');
}

async function saveUser() {
    const name = document.getElementById('uName').value.trim();
    const username = document.getElementById('uUsername').value.trim();
    const password = document.getElementById('uPassword').value.trim();
    const role = document.getElementById('uRole').value;
    
    // Collect permissions
    const permissions = {
        invoices: document.getElementById('permInvoices').checked,
        quotes: document.getElementById('permQuotes').checked,
        clients: document.getElementById('permClients').checked,
        products: document.getElementById('permProducts').checked
    };

    if (!name || !username || !password) {
        showToast('يرجى تعبئة جميع الحقول المطلوبة', 'warning');
        return;
    }

    let users = globalData.users || [];

    // Check username uniqueness
    const exists = users.find(u => u.username === username && u.id !== editingUserId);
    if (exists) {
        showToast('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }

    const payload = {
        name,
        username,
        role,
        permissions
    };
    if (editingUserId) payload.id = editingUserId;
    if (password) payload.password = password;

    const res = await apiCall('users.php', 'POST', payload);
    if (res && res.success) {
        showToast(editingUserId ? 'تم تحديث بيانات المستخدم بنجاح' : 'تمت إضافة المستخدم بنجاح', 'success');
        
        // Refresh users
        const updatedUsers = await apiCall('users.php', 'GET');
        if (updatedUsers) globalData.users = updatedUsers;

        closeUserModal();
        renderUsersList();
    } else {
        showToast('فشل حفظ المستخدم', 'error');
    }
}

async function deleteUser(id) {
    let users = globalData.users || [];
    const user = users.find(u => u.id === id);
    
    if (user && (user.username.toLowerCase() === 'admin' || user.username.toLowerCase() === 'samir')) {
        showToast('لا يمكن حذف حساب إداري أساسي', 'error');
        return;
    }

    showConfirm('حذف المستخدم', 'هل أنت متأكد من حذف هذا المستخدم؟', async () => {
        const res = await apiCall('users.php', 'DELETE', { id });
        if (res && res.success) {
            users = users.filter(u => u.id !== id);
            globalData.users = users;
            showToast('تم حذف المستخدم', 'success');
            renderUsersList();
        } else {
            showToast('خطأ في الحذف', 'error');
        }
    });
}


// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async function () {
    // Set current date in top bar
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-SA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Sidebar backdrop close
    document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);

    // Close preview on overlay click
    document.getElementById('previewOverlay').addEventListener('click', function (e) {
        if (e.target === this) closePreview();
    });

    // Close modals on overlay click
    document.getElementById('confirmModal').addEventListener('click', function (e) {
        if (e.target === this) closeConfirmModal();
    });
    document.getElementById('clientModal').addEventListener('click', function (e) {
        if (e.target === this) closeClientModal();
    });

    // ESC key close
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closePreview();
            closeConfirmModal();
            closeClientModal();
            closeUserModal();
        }
    });

    // Ensure user is verified first
    checkPermissions();

    // Fetch master API data
    await initData();

    // Load initial views
    if (document.getElementById('usersTableBody')) {
        renderUsersList();
    }
    updatePriceHeaders();
    renderDashboard();
});
