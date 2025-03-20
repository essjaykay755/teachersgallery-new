# TeachersGallery.com App Specification

## Overview
TeachersGallery.com is a platform for India where teachers can create profiles showcasing their experience, qualifications, and teaching details, similar to classified ads. Students and parents can browse these profiles, communicate with teachers, and hire them. The app includes a payment system for teachers to gain a "featured" status and a future rating system.

### Target Users
- **Teachers**: Post profiles and manage communication with students/parents.
- **Students**: Find and contact teachers for tutoring.
- **Parents**: Search for teachers for their children and communicate with them.

### Tech Stack
- **Frontend**: Next.js with Tailwind CSS and Shadcn components
- **Backend/Database**: Firebase (Firestore for database, Storage for file uploads)
- **Authentication**: Firebase Authentication
- **Payment Gateway**: Razorpay
- **Deployment**: Vercel (PaaS)
- **Design**: Files provided in the `design` folder

---

## Features

### For Teachers
1. **Registration and Onboarding**
   - Teachers register with an email and password.
   - A 3-step onboarding process collects:
     - **Step 1**: Name, contact details (email, phone number), avatar (upload)
     - **Step 2**: Experience, subjects taught, qualifications
     - **Step 3**: Location, areas covered, mode of teaching (offline/online), fees per hour, profile visibility on "Find Teachers" section (homepage)
   - Data is saved to Firebase after each step.

2. **Profile Management**
   - Teachers can edit their profile details post-onboarding.
   - Option to pay 99 INR/month for a "featured" tag, making their profile appear at the top of the homepage.

3. **Communication**
   - Receive messages from students and parents.
   - Accept or reject phone number requests from students/parents.

### For Students
1. **Registration and Onboarding**
   - Students register with an email and password.
   - A 3-step onboarding process collects:
     - **Step 1**: Email (phone number not required), avatar (upload)
     - **Step 2**: Class
     - **Step 3**: School
   - Data is saved to Firebase after each step.

2. **Finding and Communicating with Teachers**
   - Browse teacher profiles on the homepage.
   - View full teacher profiles and send messages.
   - Request teacher phone numbers (pending teacher approval).

### For Parents
1. **Registration and Onboarding**
   - Parents register with an email and password.
   - A 3-step onboarding process collects:
     - **Step 1**: Email, phone number, avatar (upload)
     - **Step 2**: Number of children
     - **Step 3**: Classes of their children
   - Data is saved to Firebase after each step.

2. **Finding and Communicating with Teachers**
   - Browse teacher profiles on the homepage.
   - View full teacher profiles and send messages.
   - Request teacher phone numbers (pending teacher approval).

### Common Features
- **Homepage**
  - Displays a grid of teacher cards.
  - Featured teachers (paid) appear at the top.
  - Clicking a card opens the teacher’s profile page.

- **Teacher Profile Page**
  - Shows all teacher details (name, subjects, fees, etc.).
  - Buttons to message the teacher or request their phone number.

- **Messaging System**
  - Real-time chat between students/parents and teachers.
  - Accessible via a dedicated messages page.

- **Phone Number Request**
  - Students/parents can request a teacher’s phone number.
  - Teachers approve/reject requests; approved requests reveal the phone number.

- **Payment System**
  - Teachers pay 99 INR/month via Razorpay for the featured tag.
  - Payment status tracked in Firebase.

- **Rating System**
  - Planned for future implementation; design database to support it.

---

## Pages

1. **Homepage (`/`)**
   - Grid of teacher cards (featured teachers at the top).
   - Links to individual teacher profiles.

2. **Teacher Profile Page (`/teachers/[teacherId]`)**
   - Dynamic page displaying teacher details.
   - Includes "Message" and "Request Phone Number" buttons.

3. **Registration Page (`/register`)**
   - User type selection (teacher, student, parent).
   - Redirects to respective onboarding flow after signup.

4. **Onboarding Pages**
   - **Teachers**: `/onboarding/teacher/step1`, `/step2`, `/step3`
   - **Students**: `/onboarding/student/step1`, `/step2`, `/step3`
   - **Parents**: `/onboarding/parent/step1`, `/step2`, `/step3`
   - Multi-step forms for each user type.

5. **Dashboard/Profile Management**
   - **Teachers**: `/dashboard/teacher` (edit profile, view messages, manage phone requests, payment status)
   - **Students**: `/dashboard/student` (edit profile, view messages)
   - **Parents**: `/dashboard/parent` (edit profile, view messages)

6. **Messaging Page (`/messages`)**
   - Lists conversations and provides a chat interface.

---

## Components

- **TeacherCard**
  - Props: name, subjects, location, fees, featured status
  - Displays a summary of the teacher’s profile; clickable to view full profile.

- **ProfileForm**
  - Reusable form for onboarding and profile editing.
  - Props: fields to display, user type.

- **MessageComposer**
  - Text input and send button for messaging.
  - Props: recipient ID.

- **PhoneNumberRequestButton**
  - Button to request a phone number.
  - Props: teacher ID, request status (pending/accepted/rejected).

- **PaymentButton**
  - Initiates Razorpay payment for the featured tag.
  - Props: teacher ID.

---

## Database Structure (Firebase Firestore)

1. **Users Collection**
   - Document ID: User UID (from Firebase Auth)
   - Fields: email, userType (teacher/student/parent), createdAt

2. **Profiles Collection**
   - **Teachers Subcollection**
     - Fields: name, email, phoneNumber, experience, subjects, qualifications, location, areasCovered, teachingMode, feesPerHour, isVisible, avatarUrl, isFeatured, featuredExpiry
   - **Students Subcollection**
     - Fields: email, class, school, avatarUrl
   - **Parents Subcollection**
     - Fields: email, phoneNumber, numChildren, childrenClasses, avatarUrl

3. **Messages Collection**
   - Document ID: Auto-generated
   - Fields: senderId, recipientId, messageText, timestamp
   - Organized by conversation threads (e.g., subcollection per user pair).

4. **PhoneNumberRequests Collection**
   - Document ID: Auto-generated
   - Fields: requesterId, teacherId, status (pending/accepted/rejected), timestamp

5. **Payments Collection**
   - Document ID: Auto-generated
   - Fields: teacherId, paymentId (from Razorpay), amount, status, createdAt, expiryDate

---

## Implementation Details

### Authentication
- Use Firebase Authentication for email/password signup and login.
- After registration, redirect users to their onboarding flow based on user type.

### File Storage
- Store avatar images in Firebase Storage.
- Save the download URL in the respective profile document.

### Payment Integration
- Use Razorpay to process 99 INR payments for the featured tag.
- On successful payment, update the teacher’s profile (`isFeatured: true`, `featuredExpiry: date + 1 month`).

### Styling
- Use Tailwind CSS and Shadcn components to match the designs in the `design` folder.
- Ensure responsive layouts for mobile and desktop.

---

## Next Steps

1. **Project Setup**
   - Initialize a Next.js project with Tailwind CSS and Shadcn.
   - Configure Firebase (Auth, Firestore, Storage) in the project.

2. **Authentication**
   - Implement registration with user type selection (`/register`).
   - Set up Firebase Auth and redirect to onboarding.

3. **Onboarding**
   - Build 3-step onboarding flows for teachers, students, and parents.
   - Create forms with validation and save data to Firestore.

4. **Homepage**
   - Fetch teacher profiles from Firestore.
   - Display teacher cards (featured first) using the `TeacherCard` component.

5. **Teacher Profile Page**
   - Create a dynamic route (`/teachers/[teacherId]`).
   - Add messaging and phone number request functionality.

6. **Messaging System**
   - Build the `/messages` page with real-time chat using Firestore.

7. **Phone Number Requests**
   - Implement request/approval logic with Firestore updates.

8. **Payment System**
   - Integrate Razorpay and update teacher profiles on payment success.

9. **Dashboards**
   - Build profile management pages for all user types.

10. **Deployment**
    - Deploy the app on Vercel with Firebase backend configured.
