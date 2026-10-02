# Inventaire CTA — FASE 5 (slider, galerie, calendrier)

Contrôles vérifiés dans `Nos Réalisations Récentes & Avant / Après` et le calendrier de jardinage. UI en français.

| Emplacement | Attendu | Avant (erreur) | Correctif | Test |
|---|---|---|---|---|
| Curseur Avant/Après (fenêtre Réalisations) | Glisser, cliquer, clavier déplacent le masque « avant » | `querySelector('.ba-slider')` prenait le curseur **lightbox** (premier dans le DOM, caché). Handle galerie lié à un `getBoundingClientRect()` de largeur 0. | `PinoBaSlider.initBaSlider` par instance (`.ba-resize` / `.ba-handle` enfants). | `tests/e2e/ui-slider.spec.mjs` |
| Flèches inférieures « Avant / Après » | Boutons réels, `aria-label`, désactivés aux extrémités | `<span>` inertes avec icônes flèche | `#galerie-ba-prev` → 0 %, `#galerie-ba-next` → 100 %, indicateur `%` | e2e : next désactivé à 100 %, prev à 0 % |
| Clavier sur le curseur | ← → Home End | Aucun | `role="slider"` + pas de 10 % | unit `clampPct` / `navState` |
| Touch / souris | Drag n’importe où sur le curseur | Uniquement `mousedown` sur le handle de la mauvaise instance | `pointerdown/move/up` sur le slider visible | e2e + navigateur |
| Lightbox galerie | Prev/next entre chantiers visibles, désactivés aux bouts | Pas de navigation | `#lightbox-prev` / `#lightbox-next` + flèches clavier | e2e titre change |
| Filtres galerie (Haies, Tonte…) | Filtrent les cartes | `event.currentTarget` implicite (casse hors handler inline) | `filterGallery(cat, this)` | e2e filtre Haies |
| Onglets Printemps / Été / Automne / Hiver | Affichent le panneau saison | JS existant, onglets sans `type="button"` | `type="button"` + garde si nœud absent | e2e `#tab-ete` |
| « Réserver ce service » | Ouvre le devis prérempli | `showModal` devis **par-dessus** réalisations (dialogues empilés) | Ferme réalisations, ouvre devis, texte dans `#details` | e2e hiver → devis |
| Alias `#calendrier` | Ouvre la fenêtre et scrolle jusqu’au calendrier | Pas d’entrée dans `openWindowModal` | `calendrier` → `modal-window-realisations` + `scrollIntoView` | e2e `openWindowModal('calendrier')` |

## Hors périmètre (inchangé)

Header Unipros, chat `fa-comments`, devis, auth Google, mails Resend. FASE 6 (couche d’erreurs globale) livrée : toast `textContent`, 404 réelle, 500/maintenance, `PinoErrors`. FASE 7 (Custom Claims `/admin`) non commencée.
