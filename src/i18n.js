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
      brandName: "Smart Sport Consulting",
      tournamentDashboard: "Tournament Dashboard",
      dashboardHeroText:
        "Manage tournaments, teams, players, matches, and news from one central place with a cleaner and more modern experience.",
      liveOperations: "Live Operations",
      companiesParticipating: "Companies Participating",
      companiesParticipatingSubtitle:
        "Partner companies currently represented in the tournament",
      noCompanyLogosYet: "No company logos yet.",
      sportNews: "Smart Consulting Sport News",
      sportNewsSubtitle: "Latest content and highlights from your platform",
      goToNews: "Go to News",
      noNewsYet: "No news yet.",
      noImage: "No image",
      recentMatches5: "5 Recent Matches",
      recentMatchesSubtitle: "Latest finished, live, or break-time matches",
      noMatchesYet: "No matches yet.",
      noField: "No field",
      winnerLabel: "Winner:",
      unknownTournament: "Unknown Tournament",
      unknownTeam: "Unknown Team",
      statusLive: "live",
      statusBreak: "break",
      statusFinished: "finished",
      statusScheduled: "scheduled",
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
      brandName: "Smart Sport Consulting",
      tournamentDashboard: "Tableau de bord du tournoi",
      dashboardHeroText:
        "Gérez les tournois, les équipes, les joueurs, les matchs et les actualités depuis un espace central avec une expérience plus propre et plus moderne.",
      liveOperations: "Opérations en direct",
      companiesParticipating: "Entreprises participantes",
      companiesParticipatingSubtitle:
        "Entreprises partenaires actuellement représentées dans le tournoi",
      noCompanyLogosYet: "Aucun logo d’entreprise pour le moment.",
      sportNews: "Actualités Smart Consulting Sport",
      sportNewsSubtitle:
        "Derniers contenus et temps forts de votre plateforme",
      goToNews: "Voir les actualités",
      noNewsYet: "Aucune actualité pour le moment.",
      noImage: "Pas d'image",
      recentMatches5: "5 matchs récents",
      recentMatchesSubtitle:
        "Derniers matchs terminés, en direct ou en pause",
      noMatchesYet: "Aucun match pour le moment.",
      noField: "Aucun terrain",
      winnerLabel: "Vainqueur :",
      unknownTournament: "Tournoi inconnu",
      unknownTeam: "Équipe inconnue",
      statusLive: "en direct",
      statusBreak: "pause",
      statusFinished: "terminé",
      statusScheduled: "programmé",
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