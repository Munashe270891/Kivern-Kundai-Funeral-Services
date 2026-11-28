# Kivern & Kundai Funeral Services Website

A responsive front-end website prototype for Kivern & Kundai Funeral Services. It includes cover-plan information, services, a premium estimator, policy-term accordion panels, contact details, and a policy application modal.

## Files

- `index.html` — page structure and content.
- `styles.css` — layout, colours, responsive breakpoints, navigation drawer, modal, form and focus styling.
- `script.js` — calculator, modal controls, accordion, mobile navigation, form validation, WhatsApp message preparation, local browser saving and printable application output.

## Run locally

1. Keep all three website files in the same folder.
2. Open `index.html` in a modern browser. No build step or package installation is required.
3. For a more production-like preview, serve the folder with any simple static HTTP server.
4. An internet connection is needed for Google Fonts and Font Awesome CDN assets. The page's own layout and JavaScript are local.

## Main interactions

- **Navigation:** on smaller screens, use the menu button to open or close the navigation drawer. Escape closes an open drawer.
- **Cover plans:** each “Select & Apply” button opens the application form with the corresponding plan selected.
- **Premium estimator:** choose a plan and a whole number of family units from 1–10. Each unit represents five covered members. “Apply With This Estimate” carries the chosen plan and unit count into the application form.
- **Policy terms:** accordion buttons expand one panel at a time.
- **Application form:** complete required principal-member fields and any dependent rows you want to include. Up to five dependent rows can be added. Required text fields reject whitespace-only entries.
- **WhatsApp:** “Send Application via WhatsApp” validates the form, prepares a prefilled message, opens WhatsApp for the configured number, and attempts to save a local copy. The applicant must review and send the message in WhatsApp.
- **Save & Download:** opens a print-friendly registration document. Use the browser print dialog to print or choose “Save as PDF”.
- **Local copy:** valid applications are stored in the current browser's `localStorage` under `kk_funeral_applications` when storage is available.

## Important limitations and production notes

This is a **front-end prototype**, not a complete policy administration system.

- There is no server, database, staff dashboard, authentication, or central application inbox.
- `localStorage` is limited to the current browser/device. It is not a secure or reliable central record system and may be cleared by the user or browser.
- Application data includes personal information (names, national ID numbers, birth dates, phone numbers and addresses). Do not use real customer data in public demonstrations or shared devices. Before production, replace browser-only storage with a properly secured backend, access controls, retention rules, backups and a privacy notice.
- The WhatsApp link uses the configured destination number `+263 772 128 153`. Confirm that this is the correct business number before publishing.
- Prices, allowances, cover descriptions, waiting periods, eligibility rules and exclusions are displayed as supplied website content. The business should verify them against approved policy documents before launch.
- The printable document is for review/printing; it does not constitute an electronically submitted or approved policy.
- Google Fonts and Font Awesome are third-party CDN dependencies. Consider self-hosting approved assets if offline availability, privacy or a strict content-security policy is required.
- A browser may block pop-up windows. Allow pop-ups for the site if WhatsApp or the print document does not open.
- A successful local save does not mean the business received or approved the application.



