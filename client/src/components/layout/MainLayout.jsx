import { Outlet } from "react-router-dom";
import Footer from "../FooterComponent/Footer";
import Header from "../HeaderComponent/Header";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
