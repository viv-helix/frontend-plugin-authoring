import React from 'react';
import moment from 'moment';
import { render, screen, initializeMocks } from 'CourseAuthoring/testUtils';
import ReleaseNotesSidebar from './ReleaseNotesSidebar';

beforeEach(() => {
  initializeMocks();
});
describe('ReleaseNotesSidebar', () => {
  test('groups by day and sorts desc with unscheduled last', () => {
    const day1 = moment().subtract(2, 'days').toISOString();
    const day2 = moment().toISOString();
    const notes = [
      { id: 1, title: 'D1-A', published_at: day1 },
      { id: 2, title: 'D2-A', published_at: day2 },
      { id: 3, title: 'Unscheduled', published_at: undefined },
      { id: 4, title: 'D2-B', published_at: day2 },
    ];
    render(<ReleaseNotesSidebar notes={notes} />);

    const sections = screen.getAllByText(/\d{4}|Unscheduled/); // group labels
    expect(sections[0].textContent).toBe(moment(day2).format('MMMM D, YYYY'));
    expect(sections[1].textContent).toBe(moment(day1).format('MMMM D, YYYY'));
    expect(sections[sections.length - 1].textContent).toBe('Unscheduled');

    expect(screen.getByText('D2-A').closest('a').getAttribute('href')).toBe('#note-2');
    const unscheduledLinks = screen.getAllByText('Unscheduled').filter(el => el.tagName === 'A');
    // unscheduledLinks[0] is the group header, unscheduledLinks[1] is the note link
    expect(unscheduledLinks[0].getAttribute('href')).toBe('#note-group-unscheduled');
    expect(unscheduledLinks[1].getAttribute('href')).toBe('#note-3');
  });

  test('renders active note group date link', () => {
    const day1 = moment().subtract(2, 'days').toISOString();
    const day2 = moment().toISOString();
    const notes = [
      { id: 1, title: 'D1-A', published_at: day1 },
      { id: 2, title: 'D2-A', published_at: day2 },
      { id: 3, title: 'Unscheduled', published_at: undefined },
    ];
    const { getAllByText, getByText } = render(<ReleaseNotesSidebar notes={notes} activeNoteId={2} />);
    expect(getByText(moment(day1).format('MMMM D, YYYY')).closest('a').getAttribute('href')).toBe(`#note-group-${moment(day1).format('YYYY-MM-DD')}`);
    expect(getByText(moment(day2).format('MMMM D, YYYY')).closest('a').getAttribute('href')).toBe(`#note-group-${moment(day2).format('YYYY-MM-DD')}`);
    const unscheduledLinks = getAllByText(notes[2].title).filter(el => el.tagName === 'A');
    expect(unscheduledLinks[0].getAttribute('href')).toBe('#note-group-unscheduled');
  });

  test('renders nothing when no notes', () => {
    const { container } = render(<ReleaseNotesSidebar notes={[]} />);
    expect(container.querySelectorAll('li').length).toBe(0);
  });

  test('renders active note group date in bold', () => {
    const day1 = moment().subtract(2, 'days').toISOString();
    const day2 = moment().toISOString();
    const notes = [
      { id: 1, title: 'D1-A', published_at: day1 },
      { id: 2, title: 'D2-A', published_at: day2 },
      { id: 3, title: 'Unscheduled', published_at: undefined },
      { id: 4, title: 'D2-B', published_at: day2 },
    ];
    const { getByText } = render(<ReleaseNotesSidebar notes={notes} activeNoteId={2} />);
    expect(getByText(moment(day2).format('MMMM D, YYYY')).closest('a')).toHaveClass('font-weight-bold');
    expect(getByText(moment(day1).format('MMMM D, YYYY')).closest('a')).toHaveClass('font-weight-normal');
  });

  test('renders active note title in bold', () => {
    const day1 = moment().subtract(2, 'days').toISOString();
    const day2 = moment().toISOString();
    const notes = [
      { id: 1, title: 'D1-A', published_at: day1 },
      { id: 2, title: 'D2-A', published_at: day2 },
      { id: 3, title: 'Unscheduled', published_at: undefined },
      { id: 4, title: 'D2-B', published_at: day2 },
    ];
    const { getByText } = render(<ReleaseNotesSidebar notes={notes} activeNoteId={2} />);
    expect(getByText(notes[0].title).closest('a')).toHaveClass('font-weight-normal');
    expect(getByText(notes[1].title).closest('a')).toHaveClass('font-weight-bold');
    expect(getByText(notes[3].title).closest('a')).toHaveClass('font-weight-normal');
  });
});
