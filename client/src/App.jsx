import { ApolloProvider } from "@apollo/client";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/Admin/AdminLayout";
import MainLayout from "./components/layout/MainLayout";
import { AdminRoute, GuestOnlyRoute, ProtectedRoute } from "./components/routing/RouteGuards";
import { apolloClient } from "./lib/apolloClient";
import { UserBookingsProvider } from "./utils/UserBookingsContext";

const AboutUsPage = lazy(() => import("./pages/AboutUsPage/AboutUsPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard/AdminDashboard"));
const BookingHistoryPage = lazy(() => import("./pages/BookingHistoryPage/BookingHistoryPage"));
const BookingPage = lazy(() => import("./pages/BookingPage/BookingPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage/ChangePasswordPage"));
const EscapeRoomsPage = lazy(() => import("./pages/EscapeRoomsPage/EscapeRoomsPage"));
const HowToBookPage = lazy(() => import("./pages/HowToBookPage/HowToBookPage"));
const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));
const ManageBookings = lazy(() => import("./pages/AdminDashboard/ManageBookings"));
const ManageReviews = lazy(() => import("./pages/AdminDashboard/ManageReviews"));
const ManageRooms = lazy(() => import("./pages/AdminDashboard/ManageRooms"));
const ManageUsers = lazy(() => import("./pages/AdminDashboard/ManageUsers"));
const MyAccountPage = lazy(() => import("./pages/MyAccountPage/MyAccountPage"));
const MyBookingsPage = lazy(() => import("./pages/MyBookingsPage/MyBookingsPage"));
const RulesPage = lazy(() => import("./pages/RulesPage/RulesPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage/SignUpPage"));
const UserHomePage = lazy(() => import("./pages/UserHomePage/UserHomePage"));

function PageLoader() {
  return (
    <div className="app-page-loader" role="status">
      Loading your adventure…
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="rooms" element={<ManageRooms />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="reviews" element={<ManageReviews />} />
        </Route>
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<UserHomePage />} />
        <Route path="/home" element={<UserHomePage />} />
        <Route path="/escaperooms" element={<EscapeRoomsPage />} />
        <Route path="/booking/:roomId" element={<BookingPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/howtobook" element={<HowToBookPage />} />
        <Route path="/aboutus" element={<AboutUsPage />} />

        <Route element={<GuestOnlyRoute />}>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/mybookings" element={<MyBookingsPage />} />
          <Route path="/booking-history" element={<BookingHistoryPage />} />
          <Route path="/myaccount" element={<MyAccountPage />} />
          <Route path="/changepassword" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <UserBookingsProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
      </UserBookingsProvider>
    </ApolloProvider>
  );
}
