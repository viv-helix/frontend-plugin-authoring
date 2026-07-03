import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Icon, Form, IconButtonWithTooltip, Button, OverlayTrigger, Tooltip, Stack,
} from '@openedx/paragon';
import {
  EditOutline as EditIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@openedx/paragon/icons';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useIntl } from '@edx/frontend-platform/i18n';
import { getConfig } from '@edx/frontend-platform';

import { NOTIFICATION_MESSAGES } from 'CourseAuthoring/constants';
import {
  hideProcessingNotification,
  showProcessingNotification,
} from 'CourseAuthoring/generic/processing-notification/data/slice';
import { getSectionsList } from 'CourseAuthoring/course-outline/data/selectors';
import { fetchCourseSectionQuery } from 'CourseAuthoring/course-outline/data/thunk';
import { setCourseItemOrderList } from 'CourseAuthoring/course-outline/data/api';
import cardHeaderMessages from 'CourseAuthoring/course-outline/card-header/messages';
import { invalidateLinksQuery } from 'CourseAuthoring/course-libraries/data/apiHooks';
import type { XBlock } from 'CourseAuthoring/data/types';
import AlertError from 'CourseAuthoring/generic/alert-error';
import ModalIframe from 'CourseAuthoring/generic/modal-iframe';
import EditorPage from 'CourseAuthoring/editors/EditorPage';
import supportedEditors from 'CourseAuthoring/editors/supportedEditors';
import DraggableList, { SortableItem as GenericSortableItem } from 'CourseAuthoring/generic/DraggableList';
import { ToastContext } from 'CourseAuthoring/generic/toast-context';

import { EMPTY_UNIT_COMPONENT_ACTIONS, findSectionIdForUnit } from './data/api';
import { useUnitHandler, useRenameUnitComponent } from './data/hooks';
import { getComponentIcon } from './getComponentIcon';
import { useUnitExpanded, toggleUnitExpanded } from './expandStore';
import ComponentMenu from './ComponentMenu';
import messages from './messages';
import './UnitCardContent.scss';

export interface UnitCardContentPluginProps {
  unit: XBlock;
  subsection: XBlock;
  section: XBlock;
  getTitleLink: (locator: string) => string;
}

/**
 * Course outline "unit expand" plugin. Renders an expand/collapse toggle and,
 * when expanded, an inline, reorderable list of the unit's components with
 * rename, edit and per-component action menus.
 */
const UnitCardContentPlugin = ({
  unit,
  section,
  getTitleLink,
}: UnitCardContentPluginProps) => {
  const { id } = unit;
  const dispatch = useDispatch();
  const intl = useIntl();
  const { courseId } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useContext(ToastContext);
  const sectionsList = useSelector(getSectionsList);

  const isExpanded = useUnitExpanded(id);

  const [showLegacyEditModal, setShowLegacyEditModal] = useState(false);
  const [showMFEEditorModal, setShowMFEEditorModal] = useState(false);
  const [editXBlockId, setEditXBlockId] = useState<string | null>(null);
  const [editBlockType, setEditBlockType] = useState<string>('');
  const [orderedComponents, setOrderedComponents] = useState<any[]>([]);
  const [dragComponentId, setDragComponentId] = useState<string | null>(null);
  const [renamingBlockId, setRenamingBlockId] = useState<string | null>(null);
  const [renameTitleValue, setRenameTitleValue] = useState('');
  const [openComponentMenuBlockId, setOpenComponentMenuBlockId] = useState<string | null>(null);
  const previousComponentsOrder = useRef<any[]>([]);

  const { mutateAsync: renameComponent, isPending: isRenamePending } = useRenameUnitComponent();

  // Fetch unit components when expanded.
  const {
    data: unitData,
    isLoading: isLoadingComponents,
    isError: isComponentsError,
    error: componentsError,
    refetch: refetchUnitData,
  } = useUnitHandler(id, isExpanded);

  const handleComponentClick = (blockId?: string) => {
    const baseUrl = getTitleLink(id);
    window.location.href = blockId ? `${baseUrl}#${blockId}` : baseUrl;
  };

  const getLegacyEditModalUrl = (blockId: string): string => (
    `${getConfig().STUDIO_BASE_URL}/xblock/${blockId}/action/edit`
  );

  const supportsMFEEditor = (blockType: string): boolean => Boolean(supportedEditors[blockType]);

  const getComponentEditorUrl = (blockType: string, blockId: string): string => {
    if (supportsMFEEditor(blockType)) {
      return `/course/${courseId}/editor/${blockType}/${blockId}`;
    }
    const returnTo = encodeURIComponent(`${getConfig().STUDIO_BASE_URL}/container/${id}`);
    return `${getConfig().STUDIO_BASE_URL}/xblock/${blockId}/action/edit?returnTo=${returnTo}`;
  };

  const handleShowLegacyEditModal = (blockId: string) => {
    setEditXBlockId(blockId);
    setShowLegacyEditModal(true);
  };

  const handleCloseLegacyEditModal = () => {
    setEditXBlockId(null);
    setShowLegacyEditModal(false);
  };

  const handleShowMFEEditor = (blockType: string, blockId: string) => {
    setEditBlockType(blockType);
    setEditXBlockId(blockId);
    setShowMFEEditorModal(true);
  };

  const handleCloseMFEEditor = () => {
    setEditBlockType('');
    setEditXBlockId(null);
    setShowMFEEditorModal(false);
  };

  const handleSaveEditedXBlockData = useCallback(() => (result: any) => {
    handleCloseLegacyEditModal();
    handleCloseMFEEditor();
    dispatch(fetchCourseSectionQuery([section.id]));
    if (courseId) {
      invalidateLinksQuery(queryClient, courseId);
    }

    if (result?.error) {
      showToast(intl.formatMessage(messages.componentSaveError));
    } else {
      refetchUnitData();
    }
  }, [dispatch, section.id, courseId, queryClient, showToast, intl, refetchUnitData]);

  const handleComponentEdit = (e: React.MouseEvent, blockType: string, blockId: string) => {
    e.stopPropagation();

    if (supportsMFEEditor(blockType)) {
      handleShowMFEEditor(blockType, blockId);
    } else {
      handleShowLegacyEditModal(blockId);
    }
  };

  const handleComponentActionComplete = useCallback(async (targetUnitId?: string) => {
    const sectionIds = new Set([section.id]);
    if (targetUnitId && targetUnitId !== id) {
      const targetSectionId = findSectionIdForUnit(sectionsList, targetUnitId);
      if (targetSectionId) {
        sectionIds.add(targetSectionId);
      }
    }

    await dispatch(fetchCourseSectionQuery([...sectionIds]) as any);

    const refetchPromises: Promise<unknown>[] = [refetchUnitData()];
    if (targetUnitId && targetUnitId !== id) {
      refetchPromises.push(
        queryClient.refetchQueries({ queryKey: ['unitHandler', targetUnitId] }),
      );
    }
    await Promise.all(refetchPromises);
  }, [dispatch, section.id, sectionsList, queryClient, id, refetchUnitData]);

  const handleRenameStart = useCallback((blockId: string, currentName: string) => {
    setRenamingBlockId(blockId);
    setRenameTitleValue(currentName);
  }, []);

  const handleRenameCancel = useCallback((currentName: string) => {
    setRenamingBlockId(null);
    setRenameTitleValue(currentName);
  }, []);

  const handleRenameSubmit = useCallback(async (blockId: string, currentName: string) => {
    const trimmedName = renameTitleValue.trim();

    if (!trimmedName || trimmedName === currentName) {
      setRenamingBlockId(null);
      setRenameTitleValue('');
      return;
    }

    try {
      dispatch(showProcessingNotification(NOTIFICATION_MESSAGES.saving));
      await renameComponent({ blockId, displayName: trimmedName });
      await handleComponentActionComplete();
      setRenamingBlockId(null);
      setRenameTitleValue('');
    } catch {
      setRenamingBlockId(null);
      setRenameTitleValue('');
      showToast(intl.formatMessage(messages.componentRenameError));
    } finally {
      dispatch(hideProcessingNotification());
    }
  }, [
    renameTitleValue,
    renameComponent,
    handleComponentActionComplete,
    dispatch,
    showToast,
    intl,
  ]);

  const handleComponentReorder = useCallback(() => async (newOrder: any[]) => {
    if (!newOrder) {
      return;
    }
    const componentIds = newOrder.map((c: any) => c.blockId);
    try {
      await setCourseItemOrderList(id, componentIds);
      dispatch(fetchCourseSectionQuery([section.id]));
      // Update ref after successful save
      previousComponentsOrder.current = newOrder;
    } catch (error) {
      setOrderedComponents(previousComponentsOrder.current);
      showToast(intl.formatMessage(messages.componentReorderError));
    }
  }, [id, section.id, dispatch, showToast, intl]);

  useEffect(() => {
    if (unitData?.components) {
      const componentsWithId = unitData.components.map((component) => ({
        ...component,
        id: component.blockId,
      }));
      setOrderedComponents(componentsWithId);
      previousComponentsOrder.current = componentsWithId;
    }
  }, [unitData]);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      const { data, origin } = event;
      if (origin !== getConfig().STUDIO_BASE_URL) {
        return;
      }

      if (data.type === 'closeXBlockEditorModal') {
        handleCloseLegacyEditModal();
      } else if (data.type === 'saveEditedXBlockData') {
        handleSaveEditedXBlockData()({});
      } else if (data.type === 'studioAjaxError' || data.type === 'error' || data.error) {
        handleSaveEditedXBlockData()({ error: true });
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [handleSaveEditedXBlockData]);

  return (
    <>
      {showLegacyEditModal && editXBlockId && (
        <ModalIframe
          title={intl.formatMessage(messages.legacyEditModalTitle)}
          src={getLegacyEditModalUrl(editXBlockId)}
        />
      )}
      {showMFEEditorModal && editXBlockId && editBlockType && courseId && (
        <div className="editor-page">
          <EditorPage
            courseId={courseId}
            blockType={editBlockType}
            blockId={editXBlockId}
            studioEndpointUrl={getConfig().STUDIO_BASE_URL}
            lmsEndpointUrl={getConfig().LMS_BASE_URL}
            onClose={handleCloseMFEEditor}
            returnFunction={handleSaveEditedXBlockData}
          />
        </div>
      )}
      <div className="unit-card__components-toggle">
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => toggleUnitExpanded(id)}
          iconBefore={isExpanded ? KeyboardArrowUp : KeyboardArrowDown}
          data-testid="unit-expand-toggle"
          aria-expanded={isExpanded}
        >
          {intl.formatMessage(messages.componentsToggleLabel)}
        </Button>
      </div>

      {isExpanded && (
        <div className="unit-card__components p-3" data-testid="unit-card__components">
          {(() => {
            if (isComponentsError) {
              return (
                <AlertError
                  error={componentsError}
                  title={intl.formatMessage(messages.componentsLoadError)}
                  showErrorBody={false}
                />
              );
            }
            if (isLoadingComponents) {
              return <div className="text-center p-3">{intl.formatMessage(messages.loadingComponents)}</div>;
            }
            if (orderedComponents && orderedComponents.length > 0) {
              return (
                <DraggableList
                  itemList={orderedComponents}
                  setState={setOrderedComponents}
                  updateOrder={handleComponentReorder}
                  activeId={dragComponentId}
                  setActiveId={setDragComponentId}
                >
                  {orderedComponents.map((component) => {
                    const ComponentIcon = getComponentIcon(component.blockType);

                    return (
                      <GenericSortableItem
                        id={component.blockId}
                        key={component.blockId}
                        buttonVariant="secondary"
                        componentStyle={{
                          background: 'white',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          boxShadow: '0px 1px 5px rgba(173, 173, 173, 0.4)',
                        }}
                        actionStyle={{
                          borderRadius: '6px 6px 0px 0px',
                          padding: '12px 16px',
                        }}
                        actions={(
                          <>
                            <Icon src={ComponentIcon} className="mr-2 text-dark flex-shrink-0" />
                            {renamingBlockId === component.blockId ? (
                              <Form.Group
                                className="m-0 flex-grow-1 min-width-0"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <Form.Control
                                  autoFocus
                                  data-testid="component-rename-field"
                                  value={renameTitleValue}
                                  name="displayName"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setRenameTitleValue(e.target.value);
                                  }}
                                  aria-label={intl.formatMessage(cardHeaderMessages.editFieldAriaLabel)}
                                  onBlur={() => handleRenameSubmit(
                                    component.blockId,
                                    component.displayName,
                                  )}
                                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                      handleRenameSubmit(
                                        component.blockId,
                                        component.displayName,
                                      );
                                    } else if (e.key === 'Escape') {
                                      handleRenameCancel(component.displayName);
                                    }
                                  }}
                                  disabled={isRenamePending}
                                />
                              </Form.Group>
                            ) : (
                              <Stack
                                direction="horizontal"
                                gap={0}
                                className="item-card-header component-title-group flex-grow-1 min-width-0"
                                role="presentation"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <a
                                  href={`${getTitleLink(id)}#${component.blockId}`}
                                  className="item-card-header__title-btn"
                                  data-testid="component-name-link"
                                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                    e.stopPropagation();
                                    if (!e.metaKey && !e.ctrlKey) {
                                      e.preventDefault();
                                      handleComponentClick(component.blockId);
                                    }
                                  }}
                                  onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  <span className="truncate-1-line mb-0">
                                    {component.displayName}
                                  </span>
                                </a>
                                <IconButtonWithTooltip
                                  className="item-card-button-icon component-rename-button"
                                  data-testid="component-rename-button"
                                  alt={intl.formatMessage(cardHeaderMessages.altButtonRename)}
                                  tooltipContent={(
                                    <div>{intl.formatMessage(cardHeaderMessages.altButtonRename)}</div>
                                  )}
                                  iconAs={EditIcon}
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleRenameStart(component.blockId, component.displayName);
                                  }}
                                  onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                                  // @ts-ignore
                                  disabled={isRenamePending}
                                />
                              </Stack>
                            )}
                            <Stack
                              direction="horizontal"
                              gap={2}
                              className="component-header-actions d-flex align-items-center flex-shrink-0 ml-auto"
                            >
                              <OverlayTrigger
                                placement="top"
                                overlay={(
                                  <Tooltip id={`edit-tooltip-${component.blockId}`}>
                                    {intl.formatMessage(messages.editComponent)}
                                  </Tooltip>
                                )}
                              >
                                <Button
                                  as="a"
                                  href={getComponentEditorUrl(component.blockType, component.blockId)}
                                  variant="outline-primary"
                                  size="sm"
                                  className="component-edit-button"
                                  data-testid="component-edit-button"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    if (!e.metaKey && !e.ctrlKey) {
                                      e.preventDefault();
                                      handleComponentEdit(e, component.blockType, component.blockId);
                                    }
                                  }}
                                  onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  {intl.formatMessage(messages.editButton)}
                                </Button>
                              </OverlayTrigger>
                              <ComponentMenu
                                unitId={id}
                                blockId={component.blockId}
                                displayName={component.displayName}
                                blockType={component.blockType}
                                userPartitionInfo={component.userPartitionInfo}
                                userPartitions={component.userPartitions}
                                actions={component.actions ?? EMPTY_UNIT_COMPONENT_ACTIONS}
                                onActionComplete={handleComponentActionComplete}
                                isMenuOpen={openComponentMenuBlockId === component.blockId}
                                onMenuToggle={setOpenComponentMenuBlockId}
                              />
                            </Stack>
                          </>
                        )}
                      />
                    );
                  })}
                </DraggableList>
              );
            }
            return (
              <div
                className="text-center text-muted p-3"
                role="button"
                tabIndex={0}
                onClick={() => handleComponentClick()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleComponentClick();
                  }
                }}
              >
                {intl.formatMessage(messages.noComponents)}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default UnitCardContentPlugin;
