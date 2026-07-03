import React from 'react';
import { getItemIcon } from 'CourseAuthoring/generic/block-type-utils';
import LtiIcon from './icons/LtiIcon';
import ScormIcon from './icons/ScormIcon';
import H5pIcon from './icons/H5pIcon';

// Component types whose icons used to live in the core block-type icon map.
// They now ship with this plugin so the core app stays free of outline-only icons.
const PLUGIN_ICONS: Record<string, React.ComponentType> = {
  lti_consumer: LtiIcon,
  scorm: ScormIcon,
  h5pxblock: H5pIcon,
};

/**
 * Resolve the icon for a component block type, preferring the plugin-local icons
 * and falling back to the core `getItemIcon` resolver for everything else.
 */
export const getComponentIcon = (blockType: string): React.ComponentType => (
  PLUGIN_ICONS[blockType] ?? getItemIcon(blockType)
);
