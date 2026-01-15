# Trade Notes Vault

Trade Notes Vault is a lightweight, offline-first web app for capturing daily
reminders, targets, and trade journal entries with chart images and notes.

## Features

- Headline-based notes with categories, priority, and reminders
- Trade details (symbol, direction, entry/exit, outcome, and P/L)
- Chart image uploads with notes and tags
- Search, filter, and sort saved notes
- Local-first storage in your browser
- Optional Appwrite login and cloud sync

## Getting started

1. Open `index.html` in your browser.
2. Add your headline, trade details, and notes.
3. Attach chart screenshots to reference later.

## Appwrite setup (optional)

1. Create an Appwrite project and copy the API endpoint and Project ID.
2. Enable Email/Password auth in the Auth settings.
3. Create a database and collection for trade notes.
4. Enable document security on the collection.
5. Add the following collection attributes:
   - `noteId` (string)
   - `headline` (string, required)
   - `category` (string)
   - `priority` (string)
   - `reminderDate` (string)
   - `tradeDate` (string)
   - `tradeSymbol` (string)
   - `tradeDirection` (string)
   - `tradeEntry` (string)
   - `tradeExit` (string)
   - `tradeOutcome` (string)
   - `tradePnl` (string)
   - `tradeStrategy` (string)
   - `notes` (string)
   - `chartNotes` (string)
   - `tags` (string array)
   - `imageIds` (string array)
   - `createdAt` (string)
   - `updatedAt` (string)
6. Create a storage bucket for chart images.
7. Enter the Appwrite IDs in the Cloud sync panel and sign in to sync notes.

## Notes on storage

Notes are stored locally in your browser for offline access. If Appwrite sync
is configured, notes are also saved to your Appwrite project. Large images can
fill the storage limit quickly, so keep uploads under 2 MB each.