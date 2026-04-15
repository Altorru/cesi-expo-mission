/**
 * Bones boneyard-js/native écrites à la main.
 *
 * On utilise SkeletonResult (pas ResponsiveBones) : pas besoin de breakpoints
 * multiples — l'app est single-column. Avantage : `bones.height` est directement
 * accessible pour dimensionner les enfants du <Skeleton> et forcer la hauteur
 * du conteneur (cf. native.tsx : l'overlay est absoluteFill sur ce conteneur).
 *
 * Pattern : <View style={styles.card}><Skeleton><View style={{height: BONES.height}}/></Skeleton></View>
 * Le wrapper View fournit fond/ombre/radius ; le Skeleton anime les os intérieurs.
 *
 * Calcul des hauteurs (theme.ts) :
 *   spacing : xs=4  sm=8  md=16  lg=24
 *   font    : xs=11 sm=13 md=16  xl=26
 *   lineHeight RN ≈ fontSize × 1.25 (arrondi)
 */
import type { SkeletonResult } from 'boneyard-js';

// ─── Carte mission ────────────────────────────────────────────────────────────
// Zone de contenu INSIDE card (padding md=16, gap sm=8 entre enfants).
// Décomposition  :
//   titre           fontSize md=16  → h≈20
//   gap sm=8
//   2 chips         paddingV 3 + fontSize xs=11 + 3 → h≈18
//   gap sm=8
//   desc 2 lignes   lineHeight=20 × 2            → h=40
//   gap sm=8 + marginTop xs=4 (cardFooter)       = 12
//   footer          icon size=14                 → h=14
//   ─────────────────────────────────────────────────────
//   Total contenu   20+8+18+8+40+12+14           = 120 px
//   Carte totale    16 + 120 + 16                = 152 px ✓

export const MISSION_CARD_BONES = {
  name: 'mission-card',
  viewportWidth: 375,
  width: 311,   // 375 - 2×16(listPadding) - 2×16(cardPadding)
  height: 120,
  bones: [
    // titre
    { x: 0,  y: 0,   w: 72,  h: 20, r: 4  },
    // chip catégorie + badge priorité (même ligne)
    { x: 0,  y: 28,  w: 30,  h: 18, r: 11 },
    { x: 33, y: 28,  w: 22,  h: 18, r: 11 },
    // description 2 lignes (lineHeight 20 entre les tops)
    { x: 0,  y: 54,  w: 96,  h: 14, r: 3  },
    { x: 0,  y: 74,  w: 68,  h: 14, r: 3  },
    // footer : icône auteur + nom + date
    { x: 0,  y: 100, w: 4,   h: 14, r: 7  },
    { x: 6,  y: 100, w: 28,  h: 14, r: 4  },
    { x: 78, y: 100, w: 20,  h: 14, r: 4  },
  ],
} satisfies SkeletonResult;

// ─── Détail : titre + chips ───────────────────────────────────────────────────
// content a gap lg=24 entre ses enfants directs → titre (child1) + tagsRow (child2)
// sont 2 enfants séparés dans le vrai écran mais on les regroupe dans un Skeleton.
// Décomposition :
//   titre      fontSize xl=26  → h≈32  (26×1.25)
//   espace     = gap lg=24 (simulé à l'intérieur du bloc)
//   chips      paddingV xs=4 + fontSize xs=11 + 4 → h≈20
//   ─────────────────────────────────────────────────────
//   Total      32 + 24 + 20 = 76 px

export const MISSION_HEADER_BONES = {
  name: 'mission-header',
  viewportWidth: 375,
  width: 327,   // 375 - 2×24
  height: 76,
  bones: [
    // titre principal
    { x: 0,  y: 0,  w: 80,  h: 30, r: 6  },
    // chip catégorie + chip priorité
    { x: 0,  y: 54, w: 28,  h: 20, r: 10 },
    { x: 30, y: 54, w: 22,  h: 20, r: 10 },
  ],
} satisfies SkeletonResult;

// ─── Détail : section description ────────────────────────────────────────────
// <View style={styles.section}> → gap xs=4
//   sectionLabel  fontSize sm=13  uppercased        → h≈16
//   gap xs=4
//   sectionText   fontSize md=16  lineHeight=22 ×2  → h=44
//   ─────────────────────────────────────────────────────
//   Total         16 + 4 + 44 = 64 px

export const MISSION_DESC_BONES = {
  name: 'mission-desc',
  viewportWidth: 375,
  width: 327,
  height: 64,
  bones: [
    // label "DESCRIPTION" uppercase
    { x: 0, y: 0,  w: 28, h: 12, r: 3 },
    // texte 2 lignes (lineHeight 22 entre les tops)
    { x: 0, y: 20, w: 96, h: 16, r: 4 },
    { x: 0, y: 42, w: 68, h: 16, r: 4 },
  ],
} satisfies SkeletonResult;

// ─── Détail : meta-card ───────────────────────────────────────────────────────
// INSIDE <View style={styles.metaCard}> (paddingH md=16, paddingV sm=8).
// 4 × MetaRow : paddingVertical xs=4, icon size=16, borderBottom 1px
//   row height = 4 + 16 + 4 + 1 = 25 px
//   4 rows     = 100 px
// Skeleton height = zone intérieure (sans paddingV) = 100 px.
// La View metaCard apporte : sm=8 + 100 + 8 = 116 px de hauteur totale.

export const MISSION_META_BONES = {
  name: 'mission-meta',
  viewportWidth: 375,
  width: 295,   // 327 - 2×16
  height: 100,
  bones: [
    // Row 1 (y=5 : centré dans 25px avec paddingV=4 → 4+(16-14)/2=5)
    { x: 0,  y: 5,  w: 4,  h: 14, r: 7 },
    { x: 6,  y: 5,  w: 22, h: 13, r: 3 },
    { x: 60, y: 5,  w: 36, h: 13, r: 3 },
    // Row 2
    { x: 0,  y: 30, w: 4,  h: 14, r: 7 },
    { x: 6,  y: 30, w: 22, h: 13, r: 3 },
    { x: 60, y: 30, w: 36, h: 13, r: 3 },
    // Row 3
    { x: 0,  y: 55, w: 4,  h: 14, r: 7 },
    { x: 6,  y: 55, w: 22, h: 13, r: 3 },
    { x: 60, y: 55, w: 36, h: 13, r: 3 },
    // Row 4
    { x: 0,  y: 80, w: 4,  h: 14, r: 7 },
    { x: 6,  y: 80, w: 22, h: 13, r: 3 },
    { x: 60, y: 80, w: 36, h: 13, r: 3 },
  ],
} satisfies SkeletonResult;
