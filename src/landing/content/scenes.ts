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
  /** Left position in % of scene width (centered horizontally via translateX(-50%)) */
  xPercent: number;
  /** Bottom anchor in % from bottom of scene (so y = 100 - bottomPercent), or height-based */
  yPercent: number;
  /** Width as % of scene width, or omit when heightPercent is set */
  widthPercent?: number;
  minWidthPx?: number;
  /** Height as % of scene height, or omit when widthPercent is set */
  heightPercent?: number;
  eager?: boolean;
  preloadExtraSrc?: string;
}

export interface SceneArtworkConfig {
  id: SceneId;
  layers: {
    sky?: ResponsiveLayerImage;
    land?: ResponsiveLayerImage;
    fore?: ResponsiveLayerImage;
  };
  parallax: {
    sky: number;
    land: number;
    fore: number;
  };
  /** % of scene height shifted DOWN (+ expands down, - lifts sky up) */
  landShiftY: number;
  skyShiftY?: number;
  /** Scroll-driven sun sinking for Scene 2 */
  sunSink?: boolean;
  /** Warm gold-orange glow band above the 60% horizon (Scene 3) */
  horizonGlow?: boolean;
  eager?: boolean;
  props: ScenePropConfig[];
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
    parallax: { sky: 0.15, land: 0.35, fore: 0.7 },
    skyShiftY: -16,
    landShiftY: 21,
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
    parallax: { sky: 0.15, land: 0.35, fore: 0.7 },
    landShiftY: -2,
    props: [
      {
        id: 'sage',
        name: 'sage',
        src: '/landing/art/sage.webp',
        width: 805,
        height: 900,
        xPercent: 32,
        yPercent: 82,
        widthPercent: 18,
        minWidthPx: 120,
      },
      {
        id: 'diya',
        name: 'diya',
        src: '/landing/art/diya.webp',
        width: 640,
        height: 401,
        xPercent: 50,
        yPercent: 84,
        widthPercent: 5,
        minWidthPx: 40,
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
    parallax: { sky: 0.15, land: 0.35, fore: 0.7 },
    landShiftY: 23,
    sunSink: true,
    props: [],
  },
  kurukshetra: {
    id: 'kurukshetra',
    layers: {
      sky: sceneLayer('s3-sky'),
      land: sceneLayer('s3-land'),
      fore: sceneLayer('s3-fore'),
    },
    parallax: { sky: 0.15, land: 0.35, fore: 0.7 },
    landShiftY: 14,
    horizonGlow: true,
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
        minWidthPx: 40,
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
        minWidthPx: 190,
      },
      {
        id: 'wheel',
        name: 'wheel',
        src: '/landing/art/wheel.webp',
        width: 640,
        height: 640,
        xPercent: 86,
        yPercent: 82,
        widthPercent: 12,
        minWidthPx: 56,
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
    parallax: { sky: 0.15, land: 0.35, fore: 0.7 },
    landShiftY: -5,
    props: [
      {
        id: 'lotus-bud',
        name: 'lotus-bud',
        src: '/landing/art/lotus-bud.webp',
        width: 641,
        height: 1000,
        xPercent: 50,
        yPercent: 95,
        heightPercent: 38,
        preloadExtraSrc: '/landing/art/lotus-open.webp',
      },
    ],
  },
  gate: {
    id: 'gate',
    layers: {
      sky: sceneLayer('s5-sky'),
    },
    parallax: { sky: 0.15, land: 0.35, fore: 0.7 },
    landShiftY: 0,
    props: [],
    gate: {
      closed: sceneLayer('s5-gate-closed'),
      open: sceneLayer('s5-gate-open'),
    },
  },
};
