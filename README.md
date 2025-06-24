# Weather & Diary Web App

[toc]



## 📌 **1. Project description**
Our Weather & Diary Web Application is a personal journaling platform designed to support emotional reflection and daily self-expression. Users can log in, write private diary entries, and track their moods over time in a simple and calming interface. The goal is to create a safe digital space where users can unload their thoughts, monitor emotional patterns, and gradually build a habit of self-awareness.

While initially developed with weather-based reminders and scheduling tools, the project evolved through team discussions to focus more intentionally on emotional well-being. The current version emphasizes free-form diary writing, mood logging, and gentle prompts that encourage users to engage in consistent self-reflection.

This application is especially suited for students and professionals seeking a lightweight and private way to maintain mental clarity amid their busy routines. It combines personal expression with minimalist design, offering users a peaceful corner of the internet to check in with themselves—one entry at a time.

----

## ⚙️ **2. Setup Instructions**

### - Clone the repository

```bash
git clone https://github.com/yyx201601/Weather_Diary-demo.git
```

### - Setup

```bash
npm install
```

Create .env file,  if **IOS/Linux**:

```bash
touch .env
```

if **Windows**:

```bash
New-Item .env -ItemType File
```

Add the following to `.env`   (I left the token and weather API I generated here for testing .)

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=user_information

TOKEN=pDGGn7FUGafR7vpcuAYpldNq6sqYkVuQbxjlT3zuoEw=

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=examplepassworf

# weather api
# get free api from https://www.weatherapi.com/
WEATHER_API_KEY=fc78089125004cd8ac051038251206

PORT=8080
NODE_ENV=development
```

### - Run the application

**Run in the bash:**

```bash
npm start
```

**Access via: `http://localhost:8080`**

----

## ✅ **3. Features & Functionality**

####  User Authentication & Account Management

---

- **JWT-Based Secure Login**: Email registration, login, token-based session management
- **Login State Detection**: Auto-check login status, redirect unauthorized users
- **Profile Dashboard**: View and edit personal info, change password with strength validation
- **Email Update Workflow**: Secure email modification with conflict checks

#### Security & Input Validation

---

- **Token Lifecycle Handling**: Auto refresh and expiration management
- **Front & Back-End Validation**: Prevent malformed inputs
- **XSS Protection**: Safe DOM manipulation and content escaping

#### Weather Integration

---

- **City-Based Weather Search**: Fetch real-time data from OpenWeather API
- **Dynamic Weather Icons**: Visually reflects actual weather conditions
- **Refreshable Forecasts**: Manual update capability
- **Social Sharing**: Share weather snapshots via social media

#### Diary & Mood Tracking

---

- **Create Diary Entries**: Includes title, content, mood, tags, and optional weather/location
- **View Entries**: Grid/list toggle, paginated layout
- **Edit & Auto-Save Drafts**: Live editing with draft recovery
- **Delete with Confirmation**: Safe deletion prompts
- **Search & Filter**: Search by title, content, or tags; filter by mood or date
- **Privacy Control**: Set entries as public or private
- **Mood Tracker**: Record one of 8 emotional states per entry
- **Statistics Overview**: Total entries, monthly trends, mood distribution
- **Tag System**: Organize entries with custom labels

#### UI/UX & Performance

---

- **Modern Responsive Design**: Optimized for desktop, tablet, and mobile
- **Form Validation**: Real-time validation and anti-spam double-submit lock
- **Search Debounce**: Improved performance under frequent input
- **Paginated Content**: Optimized loading for diary and weather data

#### Feedback & Notifications

---

- **Feedback Page**: Users can submit suggestions or report bugs
- **Smart Alerts**: Loading indicators, success messages, error handling

# ❓4. Known bugs / limitations

- **Diary Tag Handling**: 

  Tag input currently accepts strings instead of structured arrays. Although tags are saved successfully, improper formats (non-array types) may not trigger console warnings. 

  Additionally, attempting to save a diary without any tags causes an error, even though the entry still gets saved.

- **Mobile Responsiveness**: 

  The UI layout is optimized for desktop and may not render well on mobile or tablet devices.

- **No User Avatar Upload**

  Although the user profile page is functional, there is currently no option for users to upload or update a profile picture. This limits personal identity and visual customization.

- **Timezone Inconsistencies**

  All diary entries are timestamped based on the server's time zone. Users in different time zones may find that entry dates and times do not accurately reflect their local time.

---

# 🚀 5. Future Improvements

- **Public Entry Sharing**: 
  Currently, diary entries can be marked as “public” or “private,” but there is no sharing mechanism in place. A future update should include a sharing feature (e.g., public link or QR code) to give “public” entries meaningful functionality.

- **Better Tag Input Validation**: 
  Improve the front-end and back-end tag input handling to enforce array formats, and provide clearer feedback for incorrect or empty inputs.

- **Mobile Optimization**: 
  Introduce responsive layout adjustments for smaller screens and touch interactions to improve mobile usability.

- **Rich Text Editing for Diary**

  Upgrade the diary input field to support rich text formatting—such as bold, italic, bullet points, and embedded media—to improve the writing experience and enable expressive journaling.

- **Diary Export / Backup**

  Allow users to export their diary entries in formats such as PDF, Markdown, or JSON. This feature can also support scheduled email backups or cloud syncing for long-term data retention.

- **Social Features**

  Introduce lightweight social interaction by enabling users to follow public diaries, like or comment on posts, and optionally share entries on a timeline feed. These features can increase engagement and community-building.
