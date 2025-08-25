### Origin UI installation tracker

Use this checklist to coordinate which Origin UI components are installed, themed, and wired. Tick boxes as you go and add links/notes. Keep living in this file during the UI refresh.

Legend:
- [ ] not started  |  [x] done  |  [~] in progress

#### Global checks (run once per session)
- [ ] Design tokens mapped to shadcn variables verified on new components
- [ ] No icons inside text buttons rule verified
- [ ] Accessibility pass: focus states, labels, keyboard nav

#### Already integrated
- **Appointment Picker** (booking form)
  - [x] Installed  
  - Path: `src/components/booking/AppointmentPicker.tsx`
  - Notes: Day indicators, auto-select next available date

- **Event Calendar** (admin schedule + dashboard preview)
  - [x] Installed  
  - Paths: `src/components/event-calendar/*`, used in `src/app/admin/schedule/page.tsx`, `src/app/admin/enhanced-dashboard/page.tsx`
  - Notes: Month default, add/edit/delete slots, booked-slot quick-view modal

---

### Booking Details page (admin/bookings/[id]) roll-in

Install the following in order. Paste component link (Origin UI URL) when you install.

- **Badge** (status)
  - [ Created 2 files:
  - src/components/comp-420.tsx
  - src/components/ui/badge.tsx] Installed  
  - [ ] Variants mapped to brand semantic colors  
  - Link: npx shadcn@latest add https://originui.com/r/comp-420.json 
  - Notes: To be the new replacement for all components using this - old ones need to be deleted from the app to ensure clean code

- **Breadcrumb** (header trail)
  - [Created 2 files:
  - src/components/comp-448.tsx
  - src/components/ui/breadcrumb.tsx ] Installed  
  - [ ] Wired to `/admin/bookings` → `#/ref`  
  - Link:  npx shadcn@latest add https://originui.com/r/comp-448.json
  - Notes:

- **Button** (page actions)
  - [ Fit we installed on earlier ] Installed  
  - [ ] Text buttons have no icons  
  - Link: npx shadcn@latest add https://originui.com/r/comp-91.json 
  - Notes:

- **Dialog** FULL SET
 - npx shadcn@latest add https://originui.com/r/comp-313.json - Confirm Dialog + Alert Dialog
 - npx shadcn@latest add https://originui.com/r/comp-317.json - (Scrollable Sticky Header) Quick view
 - npx shadcn@latest add https://originui.com/r/comp-331.json - (Edit Profile Dialog) - Fields can be changed to adapt to each use.
 - npx shadcn@latest add https://originui.com/r/comp-517.json - (Stepper) For booking form
 -  npx shadcn@latest add https://originui.com/r/comp-361.json - Tooltip
 - npx shadcn@latest add https://originui.com/r/comp-432.json - Tabs

- **Table** (services list)
  - [ ] Installed  
  - [ ] Footer total row styled  
  - Link:  
  - Notes:

- **Alert** (customer instructions)
  - [ ] Installed  
  - [ ] Non-destructive style  
  - Link:  
  - Notes:

- **Avatar** (customer block)
  - [ ] Installed  
  - Link:  
  - Notes:

- **Tooltip** (copy actions)
  - [ ] Installed  
  - [ ] Copy to clipboard wired  
  - Link:  
  - Notes:

- **Textarea** (admin notes)
  - [ ] Installed  
  - [ ] Save button state (dirty/disabled)  
  - Link:  
  - Notes:

- **Timeline** (history)
  - [ ] Installed  
  - [ ] Items: created/confirmed/in-progress/completed/cancelled  
  - Link:  
  - Notes:

Optional
- **Tabs** (group subsections)
  - [ ] Installed  
  - Link:  
  - Notes:

---

### Admin list pages (future swaps)

- **Table + Pagination + Input/Select** (Bookings/Customers/Services)
  - [ ] Installed  
  - [ ] Column sorting/filtering  
  - Links:  
  - Notes:

- **Navbar** (replace AdminSidebar)
  - [ ] Installed  
  - [ ] Collapsible / active state  
  - Link:  
  - Notes:

- **Accordion** (pricing breakdown)
  - [ ] Installed  
  - Link:  
  - Notes:

- **Notification** (optional; otherwise keep `sonner`)
  - [ ] Installed  
  - Link:  
  - Notes:

---

### Per-component QA checklist (paste under each component)
- [ ] Theming: uses brand tokens (background, text, primary, border)
- [ ] States: hover/active/focus/disabled match brand
- [ ] Density: paddings/margins consistent with app
- [ ] A11y: labels, roles, focus order, escape/close for dialogs
- [ ] RTL safe (if applicable)
- [ ] No regression in existing flows

---

### Notes
- Keep new UI behind `NEXT_PUBLIC_NEW_UI` where risk is higher.
- Add install links here before asking to wire; I’ll integrate without touching backend logic.

