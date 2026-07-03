import { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useQueryClient } from '@tanstack/react-query';

import { pasteBlock } from 'CourseAuthoring/course-outline/data/api';
import { fetchCourseSectionQuery } from 'CourseAuthoring/course-outline/data/thunk';
import { useClipboard } from 'CourseAuthoring/generic/clipboard';
import { ToastContext } from 'CourseAuthoring/generic/toast-context';
import type { XBlock } from 'CourseAuthoring/data/types';

import { useComponentTemplates } from './data/hooks';
import { useUnitExpanded } from './expandStore';
import AddComponentWidget from './AddComponentWidget';
import messages from './messages';
import './UnitCardContent.scss';

export interface AddComponentPluginProps {
  unit: XBlock;
  subsection: XBlock;
  section: XBlock;
}

/**
 * Course outline "add component" plugin. Renders the add-component dropdown for a
 * unit, visible only while the unit is expanded (state shared with the contents
 * plugin via the expand store). Creating or pasting a component refreshes both the
 * outline section data and the shared unitHandler query the contents plugin reads.
 */
const AddComponentPlugin = ({ unit, section }: AddComponentPluginProps) => {
  const { id } = unit;
  const intl = useIntl();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { courseId } = useParams();
  const { showToast } = useContext(ToastContext);
  const { showPasteXBlock } = useClipboard();

  const isExpanded = useUnitExpanded(id);

  const { data: componentTemplates } = useComponentTemplates(
    id,
    courseId || '',
    isExpanded,
  );

  const refreshUnit = useCallback(() => {
    dispatch(fetchCourseSectionQuery([section.id]));
    queryClient.invalidateQueries({ queryKey: ['unitHandler', id] });
  }, [dispatch, section.id, queryClient, id]);

  const handlePasteComponent = useCallback(async () => {
    try {
      await pasteBlock(id);
      refreshUnit();
    } catch {
      showToast(intl.formatMessage(messages.addComponentError));
    }
  }, [id, refreshUnit, showToast, intl]);

  if (!isExpanded || !componentTemplates || componentTemplates.length === 0) {
    return null;
  }

  return (
    <div className="unit-card__add-component px-3 pb-3" data-testid="add-component-widget">
      <AddComponentWidget
        unitId={id}
        componentTemplates={componentTemplates}
        showPasteXBlock={!!showPasteXBlock}
        onPasteComponent={handlePasteComponent}
        onComponentCreated={refreshUnit}
      />
    </div>
  );
};

export default AddComponentPlugin;
