import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { priorityOptions, typeOptions } from '../constants/ticketIcons';
import {
  ALL,
  clearFilters,
  isFilterActive,
  setPriorityFilter,
  setTypeFilter,
  visibleCards
} from '../store/filtersSlice';

const countCards = (lists, mapper) =>
  lists.reduce((total, list) => total + mapper(list).length, 0);

const renderOption = ({ key, label, Icon, color }) => (
  <MenuItem key={key} value={key}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Icon sx={{ color, fontSize: 18 }} />
      {label}
    </Box>
  </MenuItem>
);

const selectSx = { minWidth: 160, backgroundColor: 'white' };

const FilterBar = () => {
  const dispatch = useDispatch();
  const filters = useSelector(state => state.filters);
  const lists = useSelector(state => state.lists);

  const active = isFilterActive(filters);
  const total = countCards(lists, list => list.cards);
  const shown = active
    ? countCards(lists, list => visibleCards(list.cards, filters))
    : total;

  return (
    <Toolbar variant="dense" sx={{ gap: 1.5, flexWrap: 'wrap', pb: 1 }}>
      <Select
        size="small"
        value={filters.type}
        onChange={event => dispatch(setTypeFilter(event.target.value))}
        aria-label="Filter by type"
        sx={selectSx}
      >
        <MenuItem value={ALL}>All types</MenuItem>
        {typeOptions().map(renderOption)}
      </Select>

      <Select
        size="small"
        value={filters.priority}
        onChange={event => dispatch(setPriorityFilter(event.target.value))}
        aria-label="Filter by priority"
        sx={selectSx}
      >
        <MenuItem value={ALL}>All priorities</MenuItem>
        {priorityOptions().map(renderOption)}
      </Select>

      {/* Without this count a filter that hides everything is hard to tell
          apart from an empty board. */}
      {active && (
        <>
          <Typography variant="body2">
            Showing {shown} of {total} cards
          </Typography>
          <Button
            size="small"
            color="inherit"
            startIcon={<FilterListOffIcon />}
            onClick={() => dispatch(clearFilters())}
          >
            Clear filters
          </Button>
        </>
      )}
    </Toolbar>
  );
};

export default FilterBar;