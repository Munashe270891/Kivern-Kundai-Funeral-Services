/**
 * Kivern & Kundai Funeral Services - Frontend Interactivity & Application Engine
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

/* ----------------------------------------------------
 * 1. Plan Calculator Logic
 * ---------------------------------------------------- */
function initCalculator() {
    const planSelect = document.getElementById('plan-select');
    const familyGroups = document.getElementById('family-groups');
    const btnCalculate = document.getElementById('btn-calculate');
    const btnCalcApply = document.getElementById('btn-calc-apply');

    if (!planSelect || !familyGroups) return;

    function runCalculation() {
        const planRate = parseFloat(planSelect.value) || 0;
        const units = parseInt(familyGroups.value) || 1;
        const total = planRate * units;
        
        document.getElementById('calc-total').innerText = '$' + total.toFixed(2) + ' USD';

        const descElem = document.getElementById('calc-desc');
        if (planRate === 5) {
            descElem.innerText = `Covering ${units * 5} members under the Kivern Diamond Plan.`;
        } else if (planRate === 7) {
            descElem.innerText = `Covering ${units * 5} members with $${units * 50} food allowance under Kundai Family Plan.`;
        } else if (planRate === 9) {
            descElem.innerText = `Covering ${units * 5} members with $${units * 100} food allowance under Kundai Emerald Plan.`;
        }
    }

    btnCalculate?.addEventListener('click', () => {
        runCalculation();
        showToast("Calculated monthly premium successfully.");
    });

    btnCalcApply?.addEventListener('click', () => {
        runCalculation();
        const selectedText = planSelect.options[planSelect.selectedIndex].text;
        openApplicationModal(selectedText);
    });

    planSelect.addEventListener('change', runCalculation);
    familyGroups.addEventListener('input', runCalculation);
}

/* ----------------------------------------------------
 * 2. Accordion UI Controls
 * ---------------------------------------------------- */
function initAccordion() {
    const headers = document.querySelectorAll('.accordion-header');

    headers.forEach(header => {
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
                const otherPanel = otherHeader?.getAttribute('aria-controls')
                    ? document.getElementById(otherHeader.getAttribute('aria-controls'))
                    : otherHeader?.nextElementSibling;
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
 * 3. Modal Form Display Controls & Focus Management
 * ---------------------------------------------------- */
const appModal = document.getElementById('app-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
let modalPreviousFocus = null;
let previousBodyOverflow = '';

function getModalFocusableElements() {
    if (!appModal) return [];
    return [...appModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}

function openApplicationModal(planName = '') {
    if (!appModal) return;
    modalPreviousFocus = document.activeElement;

    if (planName) {
        const planSelectInForm = document.getElementById('form-plan-name');
        if (planSelectInForm) {
            for (let i = 0; i < planSelectInForm.options.length; i++) {
                if (planSelectInForm.options[i].value.includes(planName) || planName.includes(planSelectInForm.options[i].value)) {
                    planSelectInForm.selectedIndex = i;
                    break;
                }
            }
        }
    }

    const depContainer = document.getElementById('dependents-container');
    if (depContainer && depContainer.children.length === 0) addDependentRow();

    previousBodyOverflow = document.body.style.overflow;
    appModal.classList.add('active');
    appModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const modalCard = appModal.querySelector('.modal-card');
    const firstField = appModal.querySelector('#form-plan-name');
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
    appModal?.addEventListener('click', (e) => {
        if (e.target === appModal) closeApplicationModal();
    });

    document.addEventListener('keydown', (e) => {
        if (!appModal?.classList.contains('active')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            closeApplicationModal();
            return;
        }

        if (e.key === 'Tab') {
            const focusable = getModalFocusableElements();
            if (!focusable.length) {
                e.preventDefault();
                appModal.querySelector('.modal-card')?.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === appModal.querySelector('.modal-card'))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}

/* ----------------------------------------------------
 * 3a. Mobile Navigation Drawer
 * ---------------------------------------------------- */
function initMobileNavigation() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('primary-navigation');
    const nav = document.getElementById('main-navigation');
    if (!toggle || !links || !nav) return;

    const mobileQuery = window.matchMedia('(max-width: 960px)');

    function setMenuOpen(open, moveFocus = false) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        links.setAttribute('aria-hidden', String(mobileQuery.matches ? !open : false));
        links.classList.toggle('is-open', open && mobileQuery.matches);

        const icon = toggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !open);
            icon.classList.toggle('fa-xmark', open);
        }
        if (moveFocus) {
            if (open) links.querySelector('a')?.focus();
            else toggle.focus();
        }
    }

    function syncForViewport() {
        if (mobileQuery.matches) {
            setMenuOpen(false);
        } else {
            links.classList.remove('is-open');
            links.setAttribute('aria-hidden', 'false');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open navigation menu');
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-xmark');
            }
        }
    }

    toggle.addEventListener('click', () => {
        setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true', true);
    });

    links.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', () => {
            if (mobileQuery.matches) setMenuOpen(false);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileQuery.matches && toggle.getAttribute('aria-expanded') === 'true') {
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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
            if (history.replaceState) history.replaceState(null, '', targetId);
        });
    });
}

function initAccessibleVisibilityStates() {
    if (appModal && !appModal.classList.contains('active')) {
        appModal.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.accordion-item').forEach(item => {
        const header = item.querySelector('.accordion-header');
        const panel = header?.getAttribute('aria-controls')
            ? document.getElementById(header.getAttribute('aria-controls'))
            : header?.nextElementSibling;
        if (header && panel) {
            const open = item.classList.contains('active');
            header.setAttribute('aria-expanded', String(open));
            panel.hidden = !open;
        }
    });
}

/* ----------------------------------------------------
 * 4. Dynamic Dependents Management
 * ---------------------------------------------------- */
function addDependentRow() {
    const container = document.getElementById('dependents-container');
    if (!container) return;

    if (container.children.length >= 5) {
        showToast("Maximum limit of 5 dependents per standard plan reached.");
        return;
    }

    const depId = Date.now();
    const row = document.createElement('div');
    row.className = 'dependent-row';
    row.id = `dep-${depId}`;
    row.innerHTML = `
        <div class="form-group">
            <label>Full Name</label>
            <input type="text" class="dep-name" placeholder="Name & Surname" required>
        </div>
        <div class="form-group">
            <label>Relationship</label>
            <select class="dep-relation">
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Extended Family">Extended Family</option>
            </select>
        </div>
        <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" class="dep-dob" required>
        </div>
        <div class="form-group">
            <label>National ID</label>
            <input type="text" class="dep-id" placeholder="Optional/ID">
        </div>
        <button type="button" class="btn-remove-dep" onclick="removeDependentRow('dep-${depId}')"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function removeDependentRow(rowId) {
    const elem = document.getElementById(rowId);
    if (elem) elem.remove();
}

/* ----------------------------------------------------
 * 5. Form Submissions (WhatsApp & Local Data Save)
 * ---------------------------------------------------- */
function initFormHandlers() {
    const btnAddDep = document.getElementById('btn-add-dependent');
    const form = document.getElementById('policy-application-form');
    const btnWhatsApp = document.getElementById('btn-send-whatsapp');

    btnAddDep?.addEventListener('click', addDependentRow);

    btnWhatsApp?.addEventListener('click', () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = collectFormData();
        let message = `*KIVERN %26 KUNDAI POLICY APPLICATION*\n`;
        message += `------------------------------------\n`;
        message += `*Plan Selected:* ${data.plan}\n`;
        message += `*Payment Mode:* ${data.paymentMode}\n\n`;
        message += `*PRINCIPAL MEMBER DETAILS*\n`;
        message += `*Name:* ${data.firstname} ${data.surname}\n`;
        message += `*ID Number:* ${data.nationalId}\n`;
        message += `*DOB:* ${data.dob}\n`;
        message += `*Phone:* ${data.phone}\n`;
        message += `*Address:* ${data.address}\n\n`;

        if (data.dependents.length > 0) {
            message += `*REGISTERED DEPENDENTS (${data.dependents.length})*\n`;
            data.dependents.forEach((dep, index) => {
                message += `${index + 1}. ${dep.name} (${dep.relation}) - DOB: ${dep.dob}\n`;
            });
        }

        saveApplicationLocally(data);
        const whatsappUrl = `https://wa.me/263772128153?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        closeApplicationModal();
        showToast("Opening WhatsApp with structured application...");
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectFormData();
        saveApplicationLocally(data);
        generateApplicationDocument(data);
        closeApplicationModal();
        showToast("Application saved & copy prepared for printing!");
    });
}

function collectFormData() {
    const dependents = [];
    document.querySelectorAll('.dependent-row').forEach(row => {
        dependents.push({
            name: row.querySelector('.dep-name').value,
            relation: row.querySelector('.dep-relation').value,
            dob: row.querySelector('.dep-dob').value,
            id: row.querySelector('.dep-id').value
        });
    });

    return {
        plan: document.getElementById('form-plan-name').value,
        paymentMode: document.getElementById('form-payment-mode').value,
        surname: document.getElementById('form-surname').value,
        firstname: document.getElementById('form-firstname').value,
        nationalId: document.getElementById('form-national-id').value,
        dob: document.getElementById('form-dob').value,
        phone: document.getElementById('form-phone').value,
        address: document.getElementById('form-address').value,
        dependents: dependents,
        timestamp: new Date().toISOString()
    };
}

function saveApplicationLocally(applicationData) {
    const existing = JSON.parse(localStorage.getItem('kk_funeral_applications') || '[]');
    existing.push(applicationData);
    localStorage.setItem('kk_funeral_applications', JSON.stringify(existing));
}

function generateApplicationDocument(data) {
    const printWindow = window.open('', '_blank');
    const content = `
        <html>
        <head>
            <title>Policy Application - ${data.firstname} ${data.surname}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
                h1 { color: #4A154B; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                th { background-color: #f1f5f9; }
                .footer { margin-top: 40px; font-size: 0.85rem; color: #666; }
            </style>
        </head>
        <body>
            <h1>Kivern & Kundai Funeral Services</h1>
            <h2>Official Registration Document</h2>
            <hr>
            <p><strong>Plan Selected:</strong> ${data.plan}</p>
            <p><strong>Payment Mode:</strong> ${data.paymentMode}</p>
            <h3>Principal Member Details</h3>
            <p><strong>Full Name:</strong> ${data.firstname} ${data.surname}</p>
            <p><strong>National ID:</strong> ${data.nationalId}</p>
            <p><strong>Date of Birth:</strong> ${data.dob}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Residential Address:</strong> ${data.address}</p>
            
            <h3>Covered Dependents</h3>
            <table>
                <tr>
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Relationship</th>
                    <th>Date of Birth</th>
                    <th>National ID</th>
                </tr>
                ${data.dependents.map((d, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${d.name}</td>
                        <td>${d.relation}</td>
                        <td>${d.dob}</td>
                        <td>${d.id || 'N/A'}</td>
                    </tr>
                `).join('')}
            </table>

            <div class="footer">
                <p>Declaration: Information provided is complete and verified.</p>
                <p>Stand 595 Budiriro 1, 212 Close, Harare | Tel: +263 772 128 153</p>
            </div>
            <script>window.print();</script>
        </body>
        </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}