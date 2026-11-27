import type { SceneId } from './copy';

export interface ResponsiveLayerImage {
  name: string;
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
}

export interface ScenePropConfig {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  /** Left position in % of art-box width (centered horizontally via translateX(-50%)) */
  xPercent: number;
  /** Bottom anchor in % from top of art-box (bottom edge of prop sits at yPercent%) */
  yPercent: number;
  /** Width as % of art-box width */
  widthPercent?: number;
  /** Height as % of art-box height */
  heightPercent?: number;
  /** Render base water ripple ellipse + contact shadow under stem */
  waterBase?: boolean;
  eager?: boolean;
  preloadExtraSrc?: string;
}

export interface BoxCoordinate {
  xPercent: number;
  yPercent: number;
}

export interface SceneArtworkConfig {
  id: SceneId;
  layers: {
    sky?: ResponsiveLayerImage;
    land?: ResponsiveLayerImage;
    fore?: ResponsiveLayerImage;
  };
  /** Max total scroll parallax fraction of art-box height (strictly <= 0.04) */
  parallax: {
    sky: number;
    land: number;
    fore: number;
  };
  /** Horizontal focal center % used on <768px height-fit mobile framing */
  focusXPercent: number;
  /** % of art-box height shifted down (+ moves down, - lifts up) */
  landShiftY: number;
  /** Land layer height as % of art-box height (default 100) */
  landHeightPercent?: number;
  skyShiftY?: number;
  /** Scroll-driven sun sinking for Scene 2 */
  sunSink?: boolean;
  /** Warm gold-orange glow band above the 60% horizon (Scene 3) */
  horizonGlow?: boolean;
  eager?: boolean;
  props: ScenePropConfig[];
  /** Waypoint ring anchor in % of art-box on desktop */
  waypoint?: BoxCoordinate;
  /** Pill / card top-left anchor in % of art-box on desktop */
  card?: BoxCoordinate;
  gate?: {
    closed: ResponsiveLayerImage;
    open: ResponsiveLayerImage;
  };
}

function sceneLayer(name: string): ResponsiveLayerImage {
  return {
    name,
    src: `/landing/art/${name}.webp`,
    srcSet: `/landing/art/${name}-960.webp 960w, /landing/art/${name}.webp 1920w`,
    sizes: '100vw',
    width: 1920,
    height: 1072,
  };
}

export const HERO_IDLE_PRELOAD = '/landing/art/rama-draw.webp';

export const SCENE_ARTWORKS: Record<SceneId, SceneArtworkConfig> = {
  hero: {
    id: 'hero',
    layers: {
      sky: sceneLayer('s0-sky'),
      land: sceneLayer('s0-land'),
      fore: sceneLayer('s0-fore'),
    },
    parallax: { sky: 0.015, land: 0.035, fore: 0.04 },
    focusXPercent: 30,
    skyShiftY: -16,
    landShiftY: 21,
    landHeightPercent: 116,
    eager: true,
    props: [
      {
        id: 'rama-ready',
        name: 'rama-ready',
        src: '/landing/art/rama-ready.webp',
        width: 665,
        height: 1100,
        xPercent: 30,
        yPercent: 64,
        heightPercent: 28,
        eager: true,
      },
    ],
  },
  ashram: {
    id: 'ashram',
    layers: {
      sky: sceneLayer('s1-sky'),
      land: sceneLayer('s1-land'),
      fore: sceneLayer('s1-fore'),
    },
    parallax: { sky: 0.015, land: 0.035, fore: 0.04 },
    focusXPercent: 36,
    landShiftY: -3,
    landHeightPercent: 106,
    waypoint: { xPercent: 32, yPercent: 45 },
    card: { xPercent: 42, yPercent: 22 },
    props: [
      {
        id: 'sage',
        name: 'sage',
        src: '/landing/art/sage.webp',
        width: 805,
        height: 900,
        xPercent: 32,
        yPercent: 84,
        widthPercent: 16,
      },
      {
        id: 'diya',
        name: 'diya',
        src: '/landing/art/diya.webp',
        width: 640,
        height: 401,
        xPercent: 40,
        yPercent: 85,
        widthPercent: 4.5,
      },
    ],
  },
  bridge: {
    id: 'bridge',
    layers: {
      sky: sceneLayer('s2-sky'),
      land: sceneLayer('s2-land'),
      fore: sceneLayer('s2-fore'),
    },
    parallax: { sky: 0.015, land: 0.035, fore: 0.04 },
    focusXPercent: 50,
    landShiftY: 24,
    landHeightPercent: 105,
    sunSink: true,
    waypoint: { xPercent: 50, yPercent: 60 },
    card: { xPercent: 14, yPercent: 26 },
    props: [],
  },
  kurukshetra: {
    id: 'kurukshetra',
    layers: {
      sky: sceneLayer('s3-sky'),
      land: sceneLayer('s3-land'),
      fore: sceneLayer('s3-fore'),
    },
    parallax: { sky: 0.015, land: 0.035, fore: 0.04 },
    focusXPercent: 52,
    landShiftY: 16,
    landHeightPercent: 106,
    horizonGlow: true,
    waypoint: { xPercent: 54, yPercent: 67 },
    card: { xPercent: 62, yPercent: 20 },
    props: [
      {
        id: 'conch',
        name: 'conch',
        src: '/landing/art/conch.webp',
        width: 640,
        height: 876,
        xPercent: 20,
        yPercent: 84,
        widthPercent: 6,
      },
      {
        id: 'chariot',
        name: 'chariot',
        src: '/landing/art/chariot.webp',
        width: 1500,
        height: 944,
        xPercent: 54,
        yPercent: 80,
        widthPercent: 38,
      },
    ],
  },
  'dawn-lake': {
    id: 'dawn-lake',
    layers: {
      sky: sceneLayer('s4-sky'),
      land: sceneLayer('s4-land'),
      fore: sceneLayer('s4-fore'),
    },
    parallax: { sky: 0.015, land: 0.035, fore: 0.04 },
    focusXPercent: 48,
    landShiftY: -39.5,
    landHeightPercent: 142,
    waypoint: { xPercent: 48, yPercent: 52 },
    card: { xPercent: 14, yPercent: 18 },
    props: [
      {
        id: 'lotus-bud',
        name: 'lotus-bud',
        src: '/landing/art/lotus-bud.webp',
        width: 641,
        height: 1000,
        xPercent: 48,
        yPercent: 77,
        heightPercent: 35,
        waterBase: true,
        preloadExtraSrc: '/landing/art/lotus-open.webp',
      },
    ],
  },
  gate: {
    id: 'gate',
    layers: {
      sky: sceneLayer('s5-sky'),
    },
    parallax: { sky: 0.01, land: 0, fore: 0 },
    focusXPercent: 50,
    landShiftY: 0,
    props: [],
    gate: {
      closed: sceneLayer('s5-gate-closed'),
      open: sceneLayer('s5-gate-open'),
    },
  },
};
