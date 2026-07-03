import { useSyncExternalStore } from 'react';

/**
 * Tiny module-level store for which units are expanded in the course outline.
 *
 * The expand state is shared across the two plugin slots that make up the unit
 * expand feature (the contents list and the "add component" affordance), which
 * render as independent React trees. Keeping the state here avoids having to add
 * a context provider to the core UnitCard.
 */
const expandedUnits = new Set<string>();
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const toggleUnitExpanded = (unitId: string) => {
  if (expandedUnits.has(unitId)) {
    expandedUnits.delete(unitId);
  } else {
    expandedUnits.add(unitId);
  }
  emit();
};

export const useUnitExpanded = (unitId: string): boolean => useSyncExternalStore(
  subscribe,
  () => expandedUnits.has(unitId),
);
