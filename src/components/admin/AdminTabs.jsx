"use client";

// Onglets du tableau de bord ; l'onglet de la page ouverte est marqué pour les lecteurs d'écran.
import { ExternalLink, LayoutDashboard, Settings, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminHeader.module.css";

const DASHBOARD_PATH = "/admin";
const PUBLIC_SITE_PATH = "/fr";
const TABS = [
  { href: DASHBOARD_PATH, label: "Vue d’ensemble", Icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Réservations", Icon: Ticket },
  { href: "/admin/parametres", label: "Paramètres", Icon: Settings },
];

/**
 * Indique si un onglet correspond à la page ouverte (une fiche reste sous « Réservations »).
 * @param {string} pathname L'adresse ouverte.
 * @param {string} href L'adresse de l'onglet.
 * @returns {boolean}
 */
export function isTabActive(pathname, href) {
  if (href === DASHBOARD_PATH) {
    return pathname === DASHBOARD_PATH;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Affiche les onglets du tableau de bord et le lien vers le site public.
 * @returns {React.ReactElement} La navigation.
 */
export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections du tableau de bord" className={styles.tabs}>
      <ul className={styles.tabList}>
        {TABS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={styles.tab}
              aria-current={isTabActive(pathname, href) ? "page" : undefined}
            >
              <Icon aria-hidden="true" className={styles.tabIcon} />
              {label}
            </Link>
          </li>
        ))}
        <li className={styles.siteItem}>
          {/* Nouvel onglet : le tableau de bord reste ouvert pendant qu'on regarde le site. */}
          <a
            href={PUBLIC_SITE_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.siteLink}
          >
            <ExternalLink aria-hidden="true" className={styles.tabIcon} />
            <span className={styles.siteText}>Voir le site</span>
            <span className={styles.srOnly}> (nouvel onglet)</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
