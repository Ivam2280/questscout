import { jwtDecode as decode } from "jwt-decode";

class AuthService {
  getProfile() {
    try { return decode(this.getToken()); }
    catch { return { data: null }; }
  }

  loggedIn() {
    const token = this.getToken();
    return token && !this.isTokenExpired(token) ? true : false;
  }

  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      if (!decoded.exp || decoded.exp <= Date.now() / 1000) throw new Error("Expired");
      return false;
    } catch {
      localStorage.removeItem("id_token");
      return true;
    }
  }

  getToken() {
    return localStorage.getItem("id_token");
  }

  login(idToken) {
    localStorage.setItem("id_token", idToken);
    const profile = this.getProfile();

    if (profile.data && profile.data.isAdmin) {
      window.location.assign("/admin");
    } else {
      window.location.assign("/home");
    }
  }

  isAdmin() {
    const profile = this.getProfile();
    return profile.data && profile.data.isAdmin;
  }

  logout() {
    localStorage.removeItem("id_token");
    window.location.assign("/");
  }


}

export default new AuthService();
