# TonFlow Earn

Build a production-ready Telegram Mini App + Telegram Bot called TonFlow.

TonFlow allows users to earn TON directly through ads, tasks, referrals, promo codes, daily rewards, and a TON spinner.

Admin ID: 2139807311

Bot: @TonFlowPayBot

Bot Token: @secret:TELEGRAM_BOT_TOKEN 

Payout Channel: @TonFlowPayouts

⸻

1. APP NAVIGATION

Bottom navigation:

🏠 Home | 🎯 Tasks | 👥 Referral | 👤 Profile

Do NOT create separate bottom tabs for:

* Spinner
* Promo Code

Both are available only from Home.

⸻

2. MULTI-LANGUAGE

On first launch, show a language selection screen.

Support languages:

1. 🇬🇧 English
2. 🇮🇳 Hindi
3. 🇷🇺 Russian
4. 🇪🇸 Spanish
5. 🇨🇳 Chinese
6. 🇧🇩 Bengali
7. 🇮🇩 Indonesian
8. 🇹🇷 Turkish
9. 🇺🇦 Ukrainian
10. 🇵🇹 Portuguese
11. 🇫🇷 French
12. 🇩🇪 German

Structure the system so additional languages can easily be added later.

Language Selection

First launch:

🌐 Choose your language

Display language buttons.

After selection, save the user’s language preference.

Change Language

Add a language selector in:

Settings → Language

Also show the current language selector/header option where appropriate.

All user-facing:

* App text
* Bot messages
* Notifications
* Buttons
* Errors
* Withdrawal messages
* Task messages

should use the selected language.

Admin can manage translation strings without changing application logic.

⸻

3. LIQUID GLASS UI

Use a premium Liquid Glass design throughout the Mini App.

Style

* Transparent glass cards
* Backdrop blur
* Subtle borders
* Premium icons
* Smooth animations
* Soft shadows
* Clean typography
* Dark premium TON/Web3 appearance
* Rounded cards
* Minimal clutter

The UI should feel like a premium Web3 financial/earning application.

⸻

4. HOME

Show:

Balance Card

* TON balance
* Total TON earned
* Today’s earnings
* Ads watched
* Tasks completed
* Referral earnings
* Spin tickets

Main Action

🎬 Watch Ads

Daily Reward

🎁 Daily Reward

Spinner

🎡 Spin & Win

Show:

* Free spin available
* Spin tickets
* Paid spin price

Open the spinner from Home.

Promo Code

🎟 Promo Code

Open promo-code input from Home.

Recent Activity

Show latest:

* Ad rewards
* Task rewards
* Referral rewards
* Spin rewards
* Withdrawals

⸻

5. WATCH ADS

Three permanent system ad tasks:

Adsgram

Reward:

0.0003–0.0009 TON

Default daily limit:

15

Monetag

Reward:

0.0003–0.0009 TON

Default daily limit:

15

Gigapub

Reward:

0.0003–0.0009 TON

Default daily limit:

15

Admin can change:

* Reward range
* Daily limit
* Ad configuration
* Enabled/disabled status

These three system tasks cannot be deleted.

Rewards are generated and credited server-side.

⸻

6. SPIN TICKET FROM ADS

After a valid completed ad:

40% chance → +1 Spin Ticket

60% chance → no ticket

Default maximum:

15 ad-generated tickets/day

Admin can change:

* Ticket chance
* Ticket limit

After reaching the ticket limit, the user can continue earning TON from eligible ads but cannot receive additional ad-generated tickets.

⸻

7. TASKS

Users can complete TON-paying tasks.

Examples:

* Join Telegram channel
* Join Telegram group
* Community tasks
* Publisher campaigns

Each task shows:

* Task name
* Description
* TON reward
* Participants
* Complete button
* Verify button

⸻

8. TASK VERIFICATION

For Telegram channel/group tasks:

1. User opens task.
2. User joins channel/group.
3. User returns to TonFlow.
4. User taps Verify.
5. Backend checks membership.
6. Reward is credited.
7. Completion is recorded.

Never trust frontend verification.

⸻

9. TASK LEAVE PENALTY

For applicable join tasks:

If the user leaves within 72 hours after receiving the reward:

0.01 TON penalty

Track:

* User
* Task
* Reward
* Verification time
* Leave status
* Penalty
* Transaction

⸻

10. PUBLISH TASK

Users/advertisers can submit their own tasks.

Required:

* Task title
* Description
* Telegram channel/group
* Reward per user
* Maximum participants
* Campaign budget

Status:

Pending → Approved → Active → Completed

Admin must approve campaigns before they become public.

⸻

11. REFERRAL SYSTEM

Referral link:

https://t.me/TonFlowPayBot/app?startapp={userid}

Referral Reward

0.005 TON per verified referral

Commission

20% lifetime commission

⸻

12. REFERRAL QUALIFICATION

An invited user must:

* Complete at least 2 tasks
* Watch at least 2 ads

Only then does the referral become verified.

After verification:

Referrer receives 0.005 TON

The configured 20% lifetime commission applies to eligible referral earnings.

⸻

13. REFERRAL ANTI-FRAUD

Block/reject:

* Self-referrals
* Fake referrals
* Multiple accounts from the same device
* Duplicate accounts
* Banned users
* Suspicious referral farming

Referral relationships are assigned server-side and cannot be changed by the user.

⸻

14. REFERRAL PAGE

Show:

* Referral link
* Copy
* Share
* Total referrals
* Verified referrals
* Pending referrals
* Referral TON earned
* Lifetime commission

Referral list:

* Username
* Profile picture
* Status
* Join date
* Task progress
* Ad progress

⸻

15. PROMO CODE

Promo Code exists only on Home.

User enters:

Promo Code → Claim

Reward is paid directly in TON.

Admin controls:

* Code
* TON reward
* Usage limit
* Per-user limit
* Expiry
* Enabled/disabled

⸻

16. SPINNER

Spinner exists only on Home.

Free Spin

1 free spin every day

Ticket Spin

1 ticket = 1 spin

Paid Spin

0.01 TON = 1 spin

Admin can change the paid-spin cost.

Rewards

* 0.0001 TON
* 0.003 TON
* 0.005 TON
* 0.01 TON
* 0.05 TON
* 0.1 TON Jackpot
* Better Luck Next Time

Jackpot

0.1 TON

Probability:

0.01%

All spin results and probability calculations happen server-side.

⸻

17. SPIN TICKET ACHIEVEMENTS

Examples:

* Complete 3 tasks → 1 ticket
* Complete 5 tasks → 1 ticket
* Complete 10 tasks → 1 ticket
* Invite 2 verified users → 1 ticket
* Invite 5 verified users → 1 ticket
* Invite 10 verified users → 1 ticket

Admin can configure these achievements.

⸻

18. PROFILE

Show:

* Telegram profile picture
* Name
* Username
* Telegram ID
* TON balance
* Total earned
* Ads watched
* Tasks completed
* Referrals
* Spin tickets

Buttons:

💸 Withdraw

📜 Withdrawal History

💳 Transactions

⚙️ Settings

⸻

19. WITHDRAWAL

Minimum withdrawal:

0.05 TON

Example fee configuration:

* 0.05 TON withdrawal → 0 fee
* 0.10 TON withdrawal → 0.025 TON fee

Admin can configure the fee structure.

Show before confirmation:

Amount: 0.10 TON
Fee: 0.025 TON
You receive: 0.075 TON

User enters TON wallet address.

⸻

20. BOT /START

When a user sends:

/start

The bot should show a personalized message.

Example:

👋 Welcome to TonFlow

💰 Balance: 0.0125 TON
👤 Username: @username
🆔 ID: 123456789

👥 Referral Link:
https://t.me/TonFlowPayBot/app?startapp=123456789

🎬 Watch ads, complete tasks and invite friends to earn TON.

Inline button:

💎 Earn TON

URL:

https://t.me/TonFlowPayBot/app

Also process referral parameters from /start/Mini App deep links.

⸻

21. /HELP

Add:

/help

Show a simple guide covering:

How to Earn

* Watch ads
* Complete tasks
* Refer users
* Use promo codes
* Daily spin
* Spin tickets

Referral

Explain:

* 0.005 TON per verified referral
* 20% commission
* 2 tasks + 2 ads required

Withdrawal

Explain:

* Minimum 0.05 TON
* Current fee
* Processing information

Tasks

Explain verification and the 72-hour leave penalty.

Include:

💎 Open TonFlow

inline Mini App button.

⸻

22. DAILY SPIN REMINDER

When a user’s free daily spin becomes available, send a Telegram notification.

Example:

🎡 Your Daily Spin is Ready!

Your free spin is available.
Try your luck and win up to 0.1 TON! 🍀

Inline button:

🎡 Spin Now

Button opens:

https://t.me/TonFlowPayBot/app

Do not spam users.

Use configurable notification frequency/settings.

⸻

23. NEW REFERRAL ALERT

When a user gets a new referral:

👥 New Referral!

@username joined TonFlow using your referral link.

Complete 2 tasks + 2 ads to become a verified referral.

If/when the referral becomes verified, send a separate reward notification:

🎉 Referral Verified!

You earned 0.005 TON.

⸻

24. WITHDRAWAL ALERTS

When a withdrawal is submitted:

💸 Withdrawal Submitted

Amount: 0.10 TON
Status: Pending

When approved/processed:

🔄 Withdrawal Processing

Amount: 0.10 TON

When paid:

✅ Withdrawal Sent

Amount: 0.10 TON

Transaction:
View on TON Explorer

Use the actual transaction hash/link.

⸻

25. NEW TASK ALERT

When a new relevant task becomes available:

🎯 New Task Available!

Complete a new task and earn 0.01 TON.

Don’t miss it!

Inline button:

🎯 View Task

Open the Mini App Tasks page.

Notifications should respect user notification preferences.

⸻

26. ADMIN NEW USER ALERT

Admin ID:

2139807311

Whenever a new user joins, send the admin a notification containing:

👤 New User

Username: @username
Name: Full Name
UID: 123456789
Invited By: @referrer / None
Join Time: Date & Time
Balance: 0 TON

Referral: referral status

Include relevant available user information without exposing unnecessary private data.

⸻

27. ADMIN /BROADCAST

Create:

/broadcast

Admin can send a message to users.

Every broadcast should automatically include an inline button:

💎 Earn TON

URL:

https://t.me/TonFlowPayBot/app

Support:

* Text
* Formatting
* Optional image/media where supported
* Preview before sending
* Confirmation
* Delivery statistics

Example:

🔥 New Tasks Available!

Complete tasks and earn TON today.

[ 💎 Earn TON ]

Only authorized admin ID 2139807311 can use /broadcast.

⸻

28. ADMIN PANEL

Admin ID:

2139807311

Secure admin dashboard with server-side authorization.

Dashboard

Show:

* Total users
* Active users
* New users
* Total TON distributed
* Total ads watched
* Ads by network
* Tasks completed
* Active tasks
* Publisher campaigns
* Referrals
* Verified referrals
* Total spins
* Jackpot wins
* TON paid through spins
* Total withdrawals
* Pending withdrawals

⸻

29. ADMIN USERS

Admin can:

* Search users
* View profile
* View balance
* View activity
* View ads
* View tasks
* View referrals
* View transactions
* Ban/unban
* Add TON
* Remove TON

Every manual balance adjustment must be logged.

⸻

30. ADMIN ADS

Manage:

Adsgram

* Enable/disable
* Reward range
* Daily limit
* Configuration

Monetag

* Enable/disable
* Reward range
* Daily limit
* Configuration

Gigapub

* Enable/disable
* Reward range
* Daily limit
* Configuration

Also configure:

* Ticket chance
* Ticket limit
* Cooldown

The three permanent ad tasks cannot be deleted.

⸻

31. ADMIN TASKS

Admin can:

* Create
* Edit
* Delete
* Enable
* Disable
* Set reward
* Set participant limit
* Approve publisher tasks
* Reject publisher tasks
* View completions
* View campaign budget
* Configure 72-hour penalty

⸻

32. ADMIN REFERRALS

Configure:

* Referral reward: 0.005 TON
* Commission: 20%
* Required tasks: 2
* Required ads: 2
* Anti-fraud settings

⸻

33. ADMIN SPINNER

Configure:

* Daily free spin
* Paid spin cost
* Ticket rewards
* Ticket probability
* Ticket limit
* Spin rewards
* Spin probabilities
* Jackpot
* Jackpot probability
* Achievement requirements

⸻

34. ADMIN PROMO CODES

Admin can:

* Create
* Edit
* Disable
* Delete
* Set TON reward
* Set usage limit
* Set expiry
* View claims

⸻

35. ADMIN WITHDRAWALS

Admin withdrawal queue:

* User
* Username
* UID
* TON amount
* Fee
* Net amount
* TON wallet
* Date/time
* Status

Actions:

Approve / Reject / Processing / Paid

⸻

36. WITHDRAWAL APPROVAL + TRANSACTION

When admin approves a withdrawal, the admin panel must ask for:

TON Transaction Hash

or the transaction details required by the configured payout system.

After the transaction is recorded:

1. Mark withdrawal as Paid.
2. Save transaction hash.
3. Generate TON Explorer link.
4. Send payout notification to the user.
5. Publish a payout notification to:

@TonFlowPayouts

⸻

37. PAYOUT CHANNEL MESSAGE

After successful payment, send:

💸 TON WITHDRAWAL PAID

👤 User: @username
💎 Amount: 0.10 TON
📊 Status: Successful

🔗 Transaction: View on TON Explorer

Add inline buttons:

🔗 View Transaction

💎 Open TonFlow

The transaction button must use the actual TON Explorer transaction URL.

The Mini App button:

https://t.me/TonFlowPayBot/app

Do not publish sensitive private information in the payout channel.

⸻

38. ADMIN /HELP

Admin-only help should explain:

* User management
* Task management
* Ad settings
* Referral settings
* Spinner settings
* Promo codes
* Withdrawal approval
* Broadcast
* Statistics

⸻

39. MULTI-LANGUAGE BOT

Bot messages must respect the user’s selected language.

Support at least:

1. 🇬🇧 English
2. 🇮🇳 Hindi
3. 🇷🇺 Russian
4. 🇪🇸 Spanish
5. 🇨🇳 Chinese
6. 🇧🇩 Bengali
7. 🇮🇩 Indonesian
8. 🇹🇷 Turkish
9. 🇺🇦 Ukrainian
10. 🇵🇹 Portuguese
11. 🇫🇷 French
12. 🇩🇪 German

Apply translations to:

* /start
* /help
* Referral alerts
* Withdrawal alerts
* Payout notifications
* Task alerts
* Spin reminders
* System messages

⸻

40. SECURITY

Backend is the source of truth.

Never trust the frontend for:

* TON balance
* User ID
* Ad completion
* Task completion
* Referral qualification
* Spin result
* Promo claims
* Withdrawal amount
* Admin permissions

Implement:

* Telegram Mini App authentication
* Server-side init-data validation
* Rate limiting
* Anti-fraud
* Idempotency
* Atomic balance updates
* Database transactions
* Admin authorization
* Audit logs
* Secure environment variables
* Withdrawal protection

All random rewards and spinner results must be generated server-side.

⸻

41. FINAL UI STRUCTURE

🏠 HOME

Balance

Watch Ads

Daily Reward

🎡 Spinner

🎟 Promo Code

Recent Activity

🎯 TASKS

Permanent Ads

Normal Tasks

Publish Task

👥 REFERRAL

Referral Link

Referral Statistics

Referral List

👤 PROFILE

Profile

Balance

Withdraw

Withdrawal History

Transactions

Settings / Language

⸻

42. FINAL EXPERIENCE

User opens:

TonFlow

↓

Selects language

↓

Telegram authentication

↓

Home

↓

Watch Ads / Complete Tasks / Refer

↓

Earn TON

↓

Use Spinner / Promo Code

↓

Reach 0.05 TON

↓

Withdraw TON

↓

Admin processes withdrawal

↓

Transaction hash recorded

↓

User receives Withdrawal Sent

↓

Payout is published to @TonFlowPayouts



Make it for vercle deployment

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6487ab0c-58bc-4ab5-bedc-4cd581bde236).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
