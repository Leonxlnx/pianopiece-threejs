/** Shared photometric presentation values for browser rendering and offline QA. */
export const PERFORMANCE_LOOK={
 fogColor:0x687c85,
 fogDensity:.006,
 exposure:1.02,
 environmentIntensity:.78,
 environmentPosition:[0,1.15,-.45] as [number,number,number],
 environmentSize:256,
} as const;

/** Subtle motes in window light; the offline renderer reads these same values. */
export const DUST_LOOK={
 drift:[.07,.11,.06,.09],
 size:[8,.6,2.2],
 alpha:[.11,.025,.045],
 color:[.93,.86,.70],
 edge:.07,
} as const;
