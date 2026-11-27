/**
 * Kivern & Kundai Funeral Services - Frontend Interactivity & Application Engine
 * Step 3: safer document output, reliable validation and calculator/modal sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
    initAccordion();
    initModalControls();
    initFormHandlers();
    initMobileNavigation();
    initSmoothScrolling();
    initAccessibleVisibilityStates();
});

const PLAN_DETAILS = {
    5: { name: 'Kivern Diamond Plan', value: 'Kivern Diamond Plan ($5/pm)', foodAllowance: 0 },
    7: { name: 'Kundai Family Plan', value: 'Kundai Family Plan ($7/pm)', foodAllowance: 50 },
    9: { name: 'Kundai Emerald Plan', value: 'Kundai Emerald Plan ($9/pm)', foodAllowance: 100 }
};

let applicationEstimateUnits = 1;
let modalPreviousFocus = null;
let previousBodyOverflow = '';
let toastTimeout = null;

/* ----------------------------------------------------
 * 1. Plan Calculator Logic & Application Estimate Sync
 * ---------------------------------------------------- */
function getCalculatorValues() {
    const planSelect = document.getElementById('plan-select');
    const familyGroups = document.getElementById('family-groups');
    const rate = Number(planSelect?.value);
    const rawUnits = Number(familyGroups?.value);
    const unitsValid = Number.isInteger(rawUnits) && rawUnits >= 1 && rawUnits <= 10;
    const plan = PLAN_DETAILS[rate] || PLAN_DETAILS[7];

    return {
        rate: PLAN_DETAILS[rate] ? rate : 7,
        units: unitsValid ? rawUnits : 1,
        unitsValid,
        rawUnits,
        plan
    };
}

function calculateEstimate(rate, units) {
    const plan = PLAN_DETAILS[Number(rate)] || PLAN_DETAILS[7];
    const safeUnits = Number.isInteger(Number(units)) && Number(units) >= 1 && Number(units) <= 10
        ? Number(units)
        : 1;

    return {
        rate: Number(rate) || 7,
        units: safeUnits,
        plan,
        total: (Number(rate) || 7) * safeUnits,
        members: safeUnits * 5,
        foodAllowance: plan.foodAllowance * safeUnits
    };
}

function updateCalculatorEstimate({ announce = false } = {}) {
    const planSelect = document.getElementById('plan-select');
    const familyGroups = document.getElementById('family-groups');
    const totalElement = document.getElementById('calc-total');
    const descElement = document.getElementById('calc-desc');
    if (!planSelect || !familyGroups || !totalElement || !descElement) return null;

    const values = getCalculatorValues();
    familyGroups.setCustomValidity(values.unitsValid ? '' : 'Enter a whole number of family units from 1 to 10.');
    familyGroups.setAttribute('aria-invalid', String(!values.unitsValid));

    if (!values.unitsValid) {
        totalElement.textContent = 'Check family units';
        descElement.textContent = 'Enter a whole number from 1 to 10 to calculate the estimate.';
        if (announce) familyGroups.reportValidity();
        return null;
    }

    const estimate = calculateEstimate(values.rate, values.units);
    totalElement.textContent = `$${estimate.total.toFixed(2)} USD`;
    if (estimate.rate === 5) {
        descElement.textContent = `Covering ${estimate.members} members under the Kivern Diamond Plan.`;
    } else {
        descElement.textContent = `Covering ${estimate.members} members with $${estimate.foodAllowance} food allowance under ${estimate.plan.name}.`;
    }

    updateApplicationEstimate();
    return estimate;
}

function initCalculator() {
    const planSelect = document.getElementById('plan-select');
    const familyGroups = document.getElementById('family-groups');
    const btnCalculate = document.getElementById('btn-calculate');
    const btnCalcApply = document.getElementById('btn-calc-apply');
    if (!planSelect || !familyGroups) return;

    planSelect.addEventListener('change', () => updateCalculatorEstimate());
    familyGroups.addEventListener('input', () => updateCalculatorEstimate());
    familyGroups.addEventListener('change', () => updateCalculatorEstimate());

    btnCalculate?.addEventListener('click', () => {
        const estimate = updateCalculatorEstimate({ announce: true });
        if (estimate) showToast('Monthly premium estimate updated.');
    });

    btnCalcApply?.addEventListener('click', () => {
        const estimate = updateCalculatorEstimate({ announce: true });
        if (!estimate) return;
        openApplicationModal('', { rate: estimate.rate, units: estimate.units });
    });

    updateCalculatorEstimate();
}

function updateApplicationEstimate() {
    const summary = document.getElementById('application-estimate');
    const formPlan = document.getElementById('form-plan-name');
    if (!summary || !formPlan) return;

    const rate = getRateFromPlanValue(formPlan.value);
    const estimate = calculateEstimate(rate, applicationEstimateUnits);
    const allowanceText = estimate.foodAllowance
        ? `, including a $${estimate.foodAllowance} food allowance`
        : '';
    summary.textContent = `Current estimate: $${estimate.total.toFixed(2)} USD per month for ${estimate.members} covered members${allowanceText}. This is an estimate based on ${estimate.units} family unit${estimate.units === 1 ? '' : 's'}.`;
}

function getRateFromPlanValue(value = '') {
    if (value.includes('Diamond')) return 5;
    if (value.includes('Emerald')) return 9;
    return 7;
}

/* ----------------------------------------------------
 * 2. Accordion UI Controls
 * ---------------------------------------------------- */
function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        const panelId = header.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : header.nextElementSibling;
        const item = header.closest('.accordion-item');
        if (!panel || !item) return;

        const initiallyOpen = item.classList.contains('active');
        header.setAttribute('aria-expanded', String(initiallyOpen));
        panel.hidden = !initiallyOpen;

        header.addEventListener('click', () => {
            const shouldOpen = header.getAttribute('aria-expanded') !== 'true';
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                otherItem.classList.remove('active');
                const otherHeader = otherItem.querySelector('.accordion-header');
                const otherPanelId = otherHeader?.getAttribute('aria-controls');
                const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : otherHeader?.nextElementSibling;
                otherHeader?.setAttribute('aria-expanded', 'false');
                if (otherPanel) otherPanel.hidden = true;
            });

            if (shouldOpen) {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                panel.hidden = false;
            }
        });
    });
}

/* ----------------------------------------------------
 * 3. Modal Controls & Focus Management
 * ---------------------------------------------------- */
const appModal = document.getElementById('app-modal');
const btnCloseModal = document.getElementById('btn-close-modal');

function getModalFocusableElements() {
    if (!appModal) return [];
    return [...appModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0);
}

function openApplicationModal(planName = '', options = {}) {
    if (!appModal) return;
    modalPreviousFocus = document.activeElement;

    const planSelectInForm = document.getElementById('form-plan-name');
    if (planSelectInForm && planName) {
        const normalized = planName.toLowerCase();
        const match = [...planSelectInForm.options].find(option => normalized.includes('diamond') && option.value.includes('Diamond')
            || normalized.includes('emerald') && option.value.includes('Emerald')
            || normalized.includes('family') && option.value.includes('Family'));
        if (match) planSelectInForm.value = match.value;
    }

    if (Number.isFinite(Number(options.rate)) && PLAN_DETAILS[Number(options.rate)]) {
        const matchingOption = [...(planSelectInForm?.options || [])].find(option => getRateFromPlanValue(option.value) === Number(options.rate));
        if (matchingOption) planSelectInForm.value = matchingOption.value;
    }

    applicationEstimateUnits = Number.isInteger(Number(options.units)) && Number(options.units) >= 1 && Number(options.units) <= 10
        ? Number(options.units)
        : 1;

    const depContainer = document.getElementById('dependents-container');
    if (depContainer && depContainer.children.length === 0) addDependentRow();

    previousBodyOverflow = document.body.style.overflow;
    appModal.classList.add('active');
    appModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    updateApplicationEstimate();

    const firstField = appModal.querySelector('#form-plan-name');
    const modalCard = appModal.querySelector('.modal-card');
    (firstField || btnCloseModal || modalCard)?.focus();
}

function closeApplicationModal() {
    if (!appModal || !appModal.classList.contains('active')) return;
    appModal.classList.remove('active');
    appModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;

    if (modalPreviousFocus && typeof modalPreviousFocus.focus === 'function' && document.contains(modalPreviousFocus)) {
        modalPreviousFocus.focus();
    }
    modalPreviousFocus = null;
}

function initModalControls() {
    btnCloseModal?.addEventListener('click', closeApplicationModal);
    appModal?.addEventListener('click', event => {
        if (event.target === appModal) closeApplicationModal();
    });

    document.getElementById('form-plan-name')?.addEventListener('change', updateApplicationEstimate);

    document.addEventListener('keydown', event => {
        if (!appModal?.classList.contains('active')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeApplicationModal();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = getModalFocusableElements();
        if (!focusable.length) {
            event.preventDefault();
            appModal.querySelector('.modal-card')?.focus();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === appModal.querySelector('.modal-card'))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

/* ----------------------------------------------------
 * 3a. Mobile Navigation Drawer
 * ---------------------------------------------------- */
function initMobileNavigation() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('primary-navigation');
    if (!toggle || !links) return;
    const mobileQuery = window.matchMedia('(max-width: 960px)');

    function setMenuOpen(open, moveFocus = false) {
        const isMobile = mobileQuery.matches;
        const effectiveOpen = isMobile && open;
        toggle.setAttribute('aria-expanded', String(effectiveOpen));
        toggle.setAttribute('aria-label', effectiveOpen ? 'Close navigation menu' : 'Open navigation menu');
        links.setAttribute('aria-hidden', String(isMobile && !effectiveOpen));
        links.classList.toggle('is-open', effectiveOpen);
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !effectiveOpen);
            icon.classList.toggle('fa-xmark', effectiveOpen);
        }
        if (moveFocus) {
            if (effectiveOpen) links.querySelector('a')?.focus();
            else toggle.focus();
        }
    }

    function syncForViewport() {
        setMenuOpen(false);
        if (!mobileQuery.matches) {
            links.classList.remove('is-open');
            links.setAttribute('aria-hidden', 'false');
        }
    }

    toggle.addEventListener('click', () => setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true', true));
    links.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', () => {
        if (mobileQuery.matches) setMenuOpen(false);
    }));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && mobileQuery.matches && toggle.getAttribute('aria-expanded') === 'true') {
            setMenuOpen(false, true);
        }
    });
    if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', syncForViewport);
    else mobileQuery.addListener(syncForViewport);
    syncForViewport();
}

/* ----------------------------------------------------
 * 3b. Smooth Scrolling & Accessible Visibility Defaults
 * ---------------------------------------------------- */
function initSmoothScrolling() {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            let target;
            try { target = document.querySelector(targetId); } catch { return; }
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'start' });
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
            if (history.replaceState) history.replaceState(null, '', targetId);
        });
    });
}

function initAccessibleVisibilityStates() {
    if (appModal && !appModal.classList.contains('active')) appModal.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.accordion-item').forEach(item => {
        const header = item.querySelector('.accordion-header');
        const panelId = header?.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : header?.nextElementSibling;
        if (!header || !panel) return;
        const open = item.classList.contains('active');
        header.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
    });
}

/* ----------------------------------------------------
 * 4. Dynamic Dependents Management
 * ---------------------------------------------------- */
function addDependentRow() {
    const container = document.getElementById('dependents-container');
    if (!container) return;
    if (container.children.length >= 5) {
        showToast('Maximum limit of 5 dependents reached.');
        return;
    }

    const depId = `dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const row = document.createElement('div');
    row.className = 'dependent-row';
    row.id = depId;
    row.innerHTML = `
        <div class="form-group">
            <label for="${depId}-name">Full Name *</label>
            <input type="text" id="${depId}-name" class="dep-name" placeholder="Name & Surname" autocomplete="name" required>
        </div>
        <div class="form-group">
            <label for="${depId}-relation">Relationship</label>
            <select id="${depId}-relation" class="dep-relation">
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Extended Family">Extended Family</option>
            </select>
        </div>
        <div class="form-group">
            <label for="${depId}-dob">Date of Birth *</label>
            <input type="date" id="${depId}-dob" class="dep-dob" required>
        </div>
        <div class="form-group">
            <label for="${depId}-id">National ID</label>
            <input type="text" id="${depId}-id" class="dep-id" placeholder="Optional/ID">
        </div>
        <button type="button" class="btn-remove-dep" data-remove-dependent="${depId}" aria-label="Remove dependent row">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>`;
    container.appendChild(row);
    row.querySelector('.dep-name')?.focus();
}

function removeDependentRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const container = row.parentElement;
    row.remove();
    if (container) container.querySelector('.dep-name')?.focus();
}

/* ----------------------------------------------------
 * 5. Form Validation, WhatsApp & Local Save
 * ---------------------------------------------------- */
function initFormHandlers() {
    const btnAddDep = document.getElementById('btn-add-dependent');
    const form = document.getElementById('policy-application-form');
    const btnWhatsApp = document.getElementById('btn-send-whatsapp');

    btnAddDep?.addEventListener('click', addDependentRow);

    // Required text fields (including dynamically-added dependents) must contain
    // non-whitespace content. Delegation keeps validation working for new rows.
    const touchedTrimmedFields = new WeakSet();
    const isTrimmedRequiredField = input =>
        input instanceof HTMLInputElement &&
        input.required &&
        (input.type === 'text' || input.type === 'tel');

    const validateTrimmedValue = (input, markTouched = false) => {
        if (!isTrimmedRequiredField(input)) return;
        if (markTouched) touchedTrimmedFields.add(input);

        if (!touchedTrimmedFields.has(input) && !input.value) {
            input.setCustomValidity('');
            input.removeAttribute('aria-invalid');
            return;
        }

        input.setCustomValidity(input.value.trim() ? '' : 'Please complete this field.');
        input.setAttribute('aria-invalid', String(!input.checkValidity()));
    };

    form?.addEventListener('input', event => {
        if (isTrimmedRequiredField(event.target)) {
            validateTrimmedValue(event.target, true);
        }
    });
    form?.addEventListener('focusout', event => {
        if (isTrimmedRequiredField(event.target)) {
            validateTrimmedValue(event.target, true);
        }
    });

    document.getElementById('dependents-container')?.addEventListener('click', event => {
        const button = event.target.closest('[data-remove-dependent]');
        if (button) removeDependentRow(button.dataset.removeDependent);
    });

    btnWhatsApp?.addEventListener('click', () => {
        if (!form) return;
        if (!form.reportValidity()) return;
        const data = collectFormData();
        const message = buildWhatsAppMessage(data);
        const whatsappUrl = `https://wa.me/263772128153?text=${encodeURIComponent(message)}`;
        const openedWindow = window.open(whatsappUrl, '_blank');
        if (!openedWindow) {
            showToast('Your browser blocked the WhatsApp window. Allow pop-ups and try again.');
            return;
        }
        // Prevent the opened tab from controlling this page.
        try { openedWindow.opener = null; } catch { /* Some browsers restrict opener access. */ }
        const saved = saveApplicationLocally(data);
        closeApplicationModal();
        showToast(saved
            ? 'Application prepared for WhatsApp. Please review and send it there.'
            : 'WhatsApp was opened, but this browser could not save a local copy.');
    });

    form?.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const data = collectFormData();
        const printWindow = generateApplicationDocument(data);
        if (!printWindow) {
            showToast('The print window was blocked. Allow pop-ups, then try again.');
            return;
        }
        const saved = saveApplicationLocally(data);
        closeApplicationModal();
        showToast(saved
            ? 'Application prepared for printing.'
            : 'Print document prepared, but this browser could not save a local copy.');
    });
}

function buildWhatsAppMessage(data) {
    let message = '*KIVERN & KUNDAI POLICY APPLICATION*\n';
    message += '------------------------------------\n';
    message += `*Plan Selected:* ${data.plan}\n`;
    message += `*Estimated Monthly Premium:* $${data.estimate.total.toFixed(2)} USD\n`;
    message += `*Family Units:* ${data.estimate.units} (${data.estimate.members} members)\n`;
    if (data.estimate.foodAllowance) message += `*Estimated Food Allowance:* $${data.estimate.foodAllowance}\n`;
    message += `*Payment Mode:* ${data.paymentMode}\n\n`;
    message += '*PRINCIPAL MEMBER DETAILS*\n';
    message += `*Name:* ${data.firstname} ${data.surname}\n`;
    message += `*ID Number:* ${data.nationalId}\n`;
    message += `*DOB:* ${data.dob}\n`;
    message += `*Phone:* ${data.phone}\n`;
    message += `*Address:* ${data.address}\n\n`;
    if (data.dependents.length) {
        message += `*REGISTERED DEPENDENTS (${data.dependents.length})*\n`;
        data.dependents.forEach((dependent, index) => {
            message += `${index + 1}. ${dependent.name} (${dependent.relation}) - DOB: ${dependent.dob} - ID: ${dependent.id || 'N/A'}\n`;
        });
    }
    return message;
}

function collectFormData() {
    const dependents = [...document.querySelectorAll('#dependents-container .dependent-row')].map(row => ({
        name: row.querySelector('.dep-name')?.value.trim() || '',
        relation: row.querySelector('.dep-relation')?.value || '',
        dob: row.querySelector('.dep-dob')?.value || '',
        id: row.querySelector('.dep-id')?.value.trim() || ''
    }));
    const plan = document.getElementById('form-plan-name')?.value || PLAN_DETAILS[7].value;
    const estimate = calculateEstimate(getRateFromPlanValue(plan), applicationEstimateUnits);

    return {
        plan,
        paymentMode: document.getElementById('form-payment-mode')?.value || '',
        surname: document.getElementById('form-surname')?.value.trim() || '',
        firstname: document.getElementById('form-firstname')?.value.trim() || '',
        nationalId: document.getElementById('form-national-id')?.value.trim() || '',
        dob: document.getElementById('form-dob')?.value || '',
        phone: document.getElementById('form-phone')?.value.trim() || '',
        address: document.getElementById('form-address')?.value.trim() || '',
        dependents,
        estimate,
        timestamp: new Date().toISOString()
    };
}

function saveApplicationLocally(applicationData) {
    try {
        const existing = JSON.parse(localStorage.getItem('kk_funeral_applications') || '[]');
        if (!Array.isArray(existing)) throw new Error('Stored application data is not a list.');
        existing.push(applicationData);
        localStorage.setItem('kk_funeral_applications', JSON.stringify(existing));
        return true;
    } catch (error) {
        console.error('Unable to save the application in this browser:', error);
        return false;
    }
}

/* ----------------------------------------------------
 * 6. Printable Registration Document (escape all user values)
 * ---------------------------------------------------- */
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function generateApplicationDocument(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return null;

    const safe = value => escapeHtml(value);
    const dependentRows = data.dependents.length
        ? data.dependents.map((dependent, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${safe(dependent.name)}</td>
                <td>${safe(dependent.relation)}</td>
                <td>${safe(dependent.dob)}</td>
                <td>${safe(dependent.id || 'N/A')}</td>
            </tr>`).join('')
        : '<tr><td colspan="5">No dependents registered.</td></tr>';

    const content = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Policy Application - ${safe(data.firstname)} ${safe(data.surname)}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        h1 { color: #4A154B; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; overflow-wrap: anywhere; }
        th { background-color: #f1f5f9; }
        .footer { margin-top: 40px; font-size: .85rem; color: #666; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <h1>Kivern &amp; Kundai Funeral Services</h1>
    <h2>Official Registration Document</h2>
    <hr>
    <p><strong>Plan Selected:</strong> ${safe(data.plan)}</p>
    <p><strong>Estimated Monthly Premium:</strong> $${Number(data.estimate.total).toFixed(2)} USD</p>
    <p><strong>Family Units / Covered Members:</strong> ${Number(data.estimate.units)} / ${Number(data.estimate.members)}</p>
    ${data.estimate.foodAllowance ? `<p><strong>Estimated Food Allowance:</strong> $${Number(data.estimate.foodAllowance)}</p>` : ''}
    <p><strong>Payment Mode:</strong> ${safe(data.paymentMode)}</p>
    <h3>Principal Member Details</h3>
    <p><strong>Full Name:</strong> ${safe(data.firstname)} ${safe(data.surname)}</p>
    <p><strong>National ID:</strong> ${safe(data.nationalId)}</p>
    <p><strong>Date of Birth:</strong> ${safe(data.dob)}</p>
    <p><strong>Phone:</strong> ${safe(data.phone)}</p>
    <p><strong>Residential Address:</strong> ${safe(data.address)}</p>
    <h3>Covered Dependents</h3>
    <table>
        <thead><tr><th>#</th><th>Full Name</th><th>Relationship</th><th>Date of Birth</th><th>National ID</th></tr></thead>
        <tbody>${dependentRows}</tbody>
    </table>
    <div class="footer">
        <p>Declaration: Information provided is complete and verified.</p>
        <p>Stand 595 Budiriro 1, 212 Close, Harare | Tel: +263 772 128 153</p>
        <p>Prepared: ${safe(new Date(data.timestamp).toLocaleString())}</p>
    </div>
    <script>window.addEventListener('load', () => window.print());<\/script>
</body>
</html>`;

    try {
        printWindow.document.open();
        printWindow.document.write(content);
        printWindow.document.close();
        return printWindow;
    } catch (error) {
        console.error('Unable to prepare the print document:', error);
        printWindow.close();
        return null;
    }
}

/* ----------------------------------------------------
 * 7. Toast Notifications
 * ---------------------------------------------------- */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    if (toastTimeout) window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
        toast.style.display = 'none';
    }, 4500);
}
