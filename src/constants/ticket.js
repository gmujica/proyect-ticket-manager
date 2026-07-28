// Pure ticket metadata: no UI imports, so the reducer and the persistence layer
// can depend on it without pulling icon components into the store. The matching
// icons live in ./ticketIcons.

export const TICKET_TYPES = {
    task: { label: 'Task', color: '#4bade8' },
    bug: { label: 'Bug', color: '#e5493a' },
    story: { label: 'Story', color: '#63ba3c' }
};

export const PRIORITIES = {
    highest: { label: 'Highest', color: '#cd1317' },
    high: { label: 'High', color: '#e9494a' },
    medium: { label: 'Medium', color: '#e97f33' },
    low: { label: 'Low', color: '#2d8738' },
    lowest: { label: 'Lowest', color: '#57a55a' }
};

export const DEFAULT_TYPE = 'task';
export const DEFAULT_PRIORITY = 'medium';

export const isValidType = key => Object.hasOwn(TICKET_TYPES, key);
export const isValidPriority = key => Object.hasOwn(PRIORITIES, key);