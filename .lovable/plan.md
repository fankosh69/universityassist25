
## Overview

Add user-friendly error handling for email rate limit errors on the signup form, replacing the generic "Email rate limit exceeded" message with a helpful, reassuring message that explains the situation and provides guidance.

## What Will Change

**File: `src/pages/Auth.tsx`**

Update the error handling in the `handleSignUp` function (around line 266) to detect rate limit errors and display a friendly message.

## Implementation Details

### Error Detection
The Supabase auth error for rate limiting typically contains:
- Error code: `over_email_send_rate_limit`
- Or error message containing "rate limit" or "too many requests"

### User-Friendly Message
When a rate limit error is detected, show:
- **Title**: "Please wait a moment"
- **Description**: "Our email system is temporarily busy. Please wait 2-3 minutes and try again with the same email address. Your information has been saved."

### Additional UX Improvements
1. **Temporary button disable**: After a rate limit error, disable the signup button for 60 seconds with a countdown timer to prevent rapid retries
2. **Visual indicator**: Show a gentle info alert above the form explaining the wait period
3. **Auto-clear**: The restriction automatically clears after the countdown

## Technical Implementation

```text
+----------------------------------+
|  Rate limit error detected?      |
+----------------------------------+
          |
          v
+----------------------------------+
|  Show friendly toast message     |
|  Set rateLimitCooldown = 60      |
|  Start countdown timer           |
+----------------------------------+
          |
          v
+----------------------------------+
|  Button shows: "Try again in Xs" |
|  Button disabled during cooldown |
+----------------------------------+
          |
          v (after 60s)
+----------------------------------+
|  Clear cooldown state            |
|  Re-enable button                |
+----------------------------------+
```

## Changes Summary

1. Add new state variable `rateLimitCooldown` to track cooldown seconds
2. Add `useEffect` to handle countdown timer
3. Update catch block in `handleSignUp` to detect rate limit errors
4. Update submit button to show countdown when in cooldown
5. Add optional info Alert component above the form during cooldown

## Why This Approach

- **Non-blocking**: Users understand why they need to wait without feeling locked out
- **Prevents retry spam**: The cooldown prevents users from making the rate limit worse
- **Maintains form data**: User's input is preserved so they don't need to re-enter anything
- **Clear communication**: Friendly language reduces frustration
