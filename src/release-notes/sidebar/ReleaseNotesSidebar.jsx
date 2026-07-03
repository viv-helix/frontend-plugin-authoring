import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { groupNotesByDate } from '../utils/groupNotes';

const ReleaseNotesSidebar = ({ notes, activeNoteId, onNoteClick }) => {
  const intl = useIntl();
  const groups = useMemo(() => groupNotesByDate(notes, intl), [notes, intl]);

  return (
    <aside className="release-notes-sidebar">
      <div className="pt-5">
        {groups.map((g) => {
          const isActiveGroup = g.items.some((n) => String(n.id) === String(activeNoteId));
          return (
            <div key={g.key}>
              <h6 className="mb-2.5">
                <a
                  href={`#note-group-${g.key}`}
                  className={`text-decoration-none ${isActiveGroup ? 'font-weight-bold' : 'font-weight-normal'}`}
                  aria-label={`Navigate to ${g.label} section`}
                >
                  {g.label}
                </a>
              </h6>
              <ul className="list-unstyled m-0 p-0 ml-3">
                {g.items.map((n) => {
                  const isActiveNote = String(n.id) === String(activeNoteId);
                  return (
                    <li key={n.id} className="mb-2.5">
                      <a
                        href={`#note-${n.id}`}
                        className={`text-decoration-none ${isActiveNote ? 'font-weight-bold' : 'font-weight-normal'}`}
                        onClick={() => onNoteClick && onNoteClick(n.id)}
                        title={n.title}
                      >
                        {n.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

ReleaseNotesSidebar.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    published_at: PropTypes.string,
  })).isRequired,
  activeNoteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNoteClick: PropTypes.func,
};

ReleaseNotesSidebar.defaultProps = {
  activeNoteId: undefined,
  onNoteClick: undefined,
};

export default ReleaseNotesSidebar;
