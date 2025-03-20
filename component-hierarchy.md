# TeachersGallery.com Component Hierarchy

Based on the application specifications and design mockups, the following component hierarchy has been planned for TeachersGallery.com.

## Layout Components
- `RootLayout`: Main layout wrapper with common elements
- `Navbar`: Site navigation with authentication state awareness
- `Footer`: Site footer with links and information

## Shared Components
- `Button`: Reusable button component with variants
- `Card`: Base card component for various content types
- `Avatar`: User avatar display
- `Input`: Form input fields with validation
- `Select`: Dropdown selection component
- `Modal`: Modal dialog for confirmations and forms
- `Spinner`: Loading indicator

## Teacher-specific Components
- `TeacherCard`: Card displaying teacher summary on homepage
- `TeacherProfile`: Full teacher profile display
- `TeacherOnboardingForm`: Multi-step onboarding for teachers
- `FeaturedBadge`: Badge for teachers with paid "featured" status
- `PaymentButton`: Razorpay integration for featured status

## Student/Parent Components
- `StudentOnboardingForm`: Multi-step onboarding for students
- `ParentOnboardingForm`: Multi-step onboarding for parents
- `PhoneNumberRequest`: Component for requesting teacher phone numbers

## Authentication Components
- `RegisterForm`: User registration with type selection
- `LoginForm`: User login
- `AuthGuard`: Protected route wrapper

## Messaging Components
- `MessageList`: List of conversations
- `MessageThread`: Individual conversation thread
- `MessageComposer`: Input for sending messages

## Page Components
- `HomePage`: Landing page with teacher listings
- `TeacherProfilePage`: Individual teacher profile
- `DashboardPage`: User dashboard based on role
- `MessagesPage`: Messaging interface
- `AboutUsPage`: About the platform
- `FAQPage`: Frequently asked questions
- `OnboardingPage`: Role-specific onboarding process

This hierarchy will be implemented progressively as we build out the application, starting with the core shared components and layout structure. 