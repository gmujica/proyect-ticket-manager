import { Component } from 'react';
import { connect } from 'react-redux';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { styled } from '@mui/material/styles';
import TrelloList from './TrelloList';
import Header from './Header';
import TrelloActionButton from './TrelloActionButton';
import { sort } from '../store/listsSlice';
import { toStoreIndexes } from '../store/dragIndexes';

const ListsContainer = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  padding: '0 8px',
  overflowX: 'auto'
});

class App extends Component {

  onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    const { dispatch, lists, filters } = this.props;

    // Lists are never filtered, so a list drop already reports store indexes.
    // Cards are: their indexes are positions in the filtered view and have to be
    // mapped back before the reducer splices with them.
    const indexes =
      type === 'list'
        ? { startIndex: source.index, endIndex: destination.index }
        : toStoreIndexes(lists, filters, source, destination, draggableId);

    if (!indexes) {
      return;
    }

    dispatch(
      sort(
        source.droppableId,
        destination.droppableId,
        indexes.startIndex,
        indexes.endIndex,
        draggableId,
        type
      )
    );
  };

  render() {
    const { lists } = this.props;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div>
          <Header />
          <Droppable droppableId='all-list' direction='horizontal' type='list'>
            {provided => (
              <ListsContainer
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {lists.map((list, index) => (
                  <TrelloList
                    listID={list.id}
                    key={list.id}
                    title={list.title}
                    cards={list.cards}
                    index={index}
                  />
                ))}
                {provided.placeholder}
                <TrelloActionButton list />
              </ListsContainer>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    );
  }
}

const mapStateToProps = state => ({
  lists: state.lists,
  filters: state.filters
});

export default connect(mapStateToProps)(App);