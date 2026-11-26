import { useQuery } from "@apollo/client";
import { Navigate } from "react-router-dom";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import Auth from "../../utils/auth";
import { ME_QUERY, QUERY_TOPCOMPLETEDROOMS } from "../../utils/queries";
import HomeHero from "./components/HomeHero";
import HomeLoadingState from "./components/HomeLoadingState";
import HowToBookSection from "./components/HowToBookSection";
import LocationSection from "./components/LocationSection";
import PopularRoomsSection from "./components/PopularRoomsSection";
import "./UserHomePage.css";

function UserHomePage() {
  const isLoggedIn = Auth.loggedIn();
  const isAdmin = isLoggedIn && Auth.isAdmin();
  const { data: userData } = useQuery(ME_QUERY, { skip: !isLoggedIn || isAdmin });
  const { data: roomsData, loading: roomsLoading } = useQuery(QUERY_TOPCOMPLETEDROOMS, {
    fetchPolicy: "network-only",
  });

  if (isAdmin) return <Navigate to="/admin" replace />;

  const rooms = roomsData?.getTopCompletedRooms ?? [];
  const firstName = userData?.me?.firstName || "Explorer";

  return (
    <div className="qs-page">
      <HomeHero firstName={firstName} />
      {roomsLoading && !rooms.length ? (
        <HomeLoadingState />
      ) : (
        <PopularRoomsSection rooms={rooms} />
      )}
      <HowToBookSection />
      <LocationSection />
    </div>
  );
}

export default ScrollToTop(UserHomePage);
