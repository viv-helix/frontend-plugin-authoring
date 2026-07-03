import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import type { UnitComponentActions } from 'CourseAuthoring/course-outline/unit-card/data/api';

// getUnitHandler + its shared types still live in core (the editors/inVideoQuiz
// thunk depends on them); re-export so plugin modules have a single import source.
export { getUnitHandler } from 'CourseAuthoring/course-outline/unit-card/data/api';
export type { UnitComponent, UnitComponentActions, UnitHandlerData } from 'CourseAuthoring/course-outline/unit-card/data/api';

const getStudioBaseUrl = () => getConfig().STUDIO_BASE_URL;

export const EMPTY_UNIT_COMPONENT_ACTIONS: UnitComponentActions = {
  canCopy: false,
  canDuplicate: false,
  canDelete: false,
  canMove: false,
  canManageAccess: false,
};

// Shape of one entry in the component_templates array returned by the API
export interface ComponentTemplate {
  type: string;
  displayName: string;
  beta?: boolean;
  templates: Array<{
    boilerplateName?: string;
    category?: string;
    displayName: string;
    supportLevel?: string | boolean;
  }>;
  supportLegend: {
    allowUnsupportedXblocks?: boolean;
    documentationLabel?: string;
    showLegend?: boolean;
  };
}

export function findSectionIdForUnit(
  sectionsList: Array<{
    id: string;
    childInfo?: { children?: Array<{ childInfo?: { children?: Array<{ id: string }> } }> };
  }>,
  unitId: string,
): string | undefined {
  return sectionsList.find((section) => (
    section.childInfo?.children?.some((subsection) => (
      subsection.childInfo?.children?.some((unit) => unit.id === unitId)
    ))
  ))?.id;
}

const getContainerHandlerApiUrl = (unitId: string) => (
  `${getStudioBaseUrl()}/api/contentstore/v1/container_handler/${unitId}`
);

/**
 * Fetch component templates for a unit by calling the existing container_handler API.
 * Templates are course-level (identical for all units in a course), so callers
 * should cache the result per courseId rather than per unit.
 */
export async function getComponentTemplates(unitId: string): Promise<ComponentTemplate[]> {
  const { data } = await getAuthenticatedHttpClient().get(getContainerHandlerApiUrl(unitId));
  const camelData = camelCaseObject(data);
  return (camelData.componentTemplates ?? []) as ComponentTemplate[];
}
