# HabitPulse Security Specification & Rules Architecture

## 1. Data Invariants
1. **User Isolation**: All habit data, logs, transactions, and settings reside under `/users/{userId}`. A user can ONLY read, create, update, or delete records within their own path (`request.auth.uid == userId`).
2. **Identity Integrity**: `userId` inside every document must strictly match `request.auth.uid`.
3. **Immutability of IDs & Owners**: Once created, `userId`, `id`, `habitId`, and `createdAt` cannot be modified.
4. **Denial of Wallet Defense**: Strings, arrays, and IDs are strictly constrained with length guards (e.g. `isValidId()` <= 128 characters, string length limits).
5. **Ledger Integrity**: Transactions cannot have negative token values unless explicitly designated as spending/burn; rewards must be positive whole numbers.
6. **Catch-All Default Deny**: Root documents and unknown subpaths are blocked by default (`allow read, write: if false;`).

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempt to read `/users/victim_123/habits` with `auth = null`.
2. **Cross-User Snooping**: User `attacker_456` attempting to read `/users/victim_123/habits/habit_1`.
3. **Cross-User Habit Injection**: User `attacker_456` attempting to create `/users/victim_123/habits/habit_x` with `userId = victim_123`.
4. **ID Poisoning Attack**: Document ID greater than 128 characters or containing illegal path traversal characters.
5. **Shadow Field Injection**: Writing a habit document containing rogue properties like `{ isAdmin: true, role: 'superadmin' }`.
6. **Owner Spoofing Update**: User attempting to mutate `userId` on existing habit to hijack ownership.
7. **Negative Token Award**: Attempting to insert a transaction with negative tokens to drain wallet balances.
8. **Replay Milestone Claim**: Attempting to duplicate claim records with mismatching cycle count.
9. **Log Tampering**: Writing habit logs for another user's habits.
10. **Blanket Query Scraping**: Attempting collection group queries without path-restricted user authentication.
11. **Excessive String Payload (Resource Exhaustion)**: Name or description exceeding maximum allowable length (e.g. 100KB payload).
12. **Unauthorized Settings Mutation**: Updating another user's sound/theme settings document.

## 3. Test Runner Definitions
Tests verify that any write lacking valid `request.auth.uid == userId` or failing boundary checks results in PERMISSION_DENIED.
