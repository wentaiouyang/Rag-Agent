# TODOS

## Wire titleController to a route

- **What:** Add `POST /api/title` route in `server.js` that calls `summarizeTitle()` from `src/controllers/titleController.js`.
- **Why:** `titleController.js` exists with a working `summarizeTitle()` function but is never imported or routed. The frontend creates conversation titles client-side (truncating to 30 chars). Wiring this route would let the frontend call Gemini to generate better titles.
- **Context:** The function is already implemented and tested manually. It takes a `{ message }` body and returns `{ title }`. The frontend `ChatSidebar` and `conversationStorage` already support the `title` field on conversations — just need to call the API after the first message in a new conversation.
- **Depends on:** Nothing. Can be done independently.
