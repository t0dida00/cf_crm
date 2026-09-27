# Orders, menu and tax

- **Sessions.** History and bills group orders by `sessionId` (one dining party). An order without one stands alone. `lib/orderMath.ts` has the grouping (`toSession`, `groupIntoSessions`).
- **Tax.** Each order snapshots its own `taxRate`. Always use `order.taxRate` for past orders, never the current Settings rate. Label taxes with `formatTaxRates()`.
- **Sold count and best sellers.** `Dish.soldCount` comes from the backend's `menu_items.sold_count` (a trigger keeps it current). Only the admin menu shows the number. Staff and guest menus show a "Best seller" tag on the top 5:
  - Staff compute it with `bestSellerIds()` (`lib/bestSellers.ts`).
  - Guests get `Dish.isBestSeller` from the public menu API and never receive the count.
  - `lib/bestSellers.ts` mirrors the backend rule (not hidden, active category, sold at least once, ties by name); change both together.
- **React keys for order lines** use `line.id ?? line.itemId`: one order can contain the same dish on two lines.
