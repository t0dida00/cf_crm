---
paths:
  - "components/panels/bookings-panel*"
  - "components/booking-assign-dialog*"
  - "components/panels/staff/**"
  - "lib/booking-slots*"
---

# Bookings

- **Bookings.** A booking's day is `booking.date` ("YYYY-MM-DD", a calendar date, never shifted by time zone); compare days with `dayKey()` from `lib/booking-slots.ts`. Start times come every 15 minutes (`SLOT_TIMES`, 09:00–21:45). No bookings for past days or already-passed times today: forms offer `availableTimes(date)`, and the backend rejects past dates. Past bookings show in the Bookings tab's history list (`pastBookings()`). Guests can stay as long as they like, so there is no seat-capacity or "full" calculation; don't add one without a dining-duration rule.
- **Staff bookings reuse the admin view.** The staff Bookings tab renders `components/panels/bookings-panel.tsx` with `allowTableAssign`, which adds a per-booking "Assign table" action (`components/booking-assign-dialog.tsx`). Its "New booking" header button drives the panel's `createSignal`, as the admin shell does. Change the panel once for both apps; there's no separate staff bookings panel.
