import BugReportIcon from '@mui/icons-material/BugReport';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';

import {
    DEFAULT_PRIORITY,
    DEFAULT_TYPE,
    PRIORITIES,
    TICKET_TYPES
} from './ticket';

const TYPE_ICONS = {
    task: TaskAltIcon,
    bug: BugReportIcon,
    story: BookmarkIcon
};

const PRIORITY_ICONS = {
    highest: KeyboardDoubleArrowUpIcon,
    high: KeyboardArrowUpIcon,
    medium: DragHandleIcon,
    low: KeyboardArrowDownIcon,
    lowest: KeyboardDoubleArrowDownIcon
};

// Label, colour and icon for a key, falling back to the default when a card
// carries a value that is no longer in the catalog.
export const getType = key => {
    const resolved = TICKET_TYPES[key] ? key : DEFAULT_TYPE;
    return { ...TICKET_TYPES[resolved], Icon: TYPE_ICONS[resolved] };
};

export const getPriority = key => {
    const resolved = PRIORITIES[key] ? key : DEFAULT_PRIORITY;
    return { ...PRIORITIES[resolved], Icon: PRIORITY_ICONS[resolved] };
};

export const typeOptions = () =>
    Object.keys(TICKET_TYPES).map(key => ({ key, ...getType(key) }));

export const priorityOptions = () =>
    Object.keys(PRIORITIES).map(key => ({ key, ...getPriority(key) }));
