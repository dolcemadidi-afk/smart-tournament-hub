import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      dashboard: "Dashboard",
      tournaments: "Tournaments",
      teams: "Teams",
      matches: "Matches",
      standings: "Standings",
      players: "Players",
      news: "News",
      profile: "Profile",
      logout: "Logout",
    },
  },
  fr: {
    translation: {
      dashboard: "Tableau de bord",
      tournaments: "Tournois",
      teams: "Équipes",
      matches: "Matchs",
      standings: "Classement",
      players: "Joueurs",
      news: "Actualités",
      profile: "Profil",
      logout: "Déconnexion",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;