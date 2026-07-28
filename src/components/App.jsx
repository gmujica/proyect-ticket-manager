import React, { Component } from 'react';
import { connect } from 'react-redux';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { styled } from '@mui/material/styles';
import TrelloList from './TrelloList';
import Header from './Header';
import TrelloActionButton from './TrelloActionButton';
import { sort } from '../actions';

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

    this.props.dispatch(
      sort(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index,
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
  lists: state.lists
});

export default connect(mapStateToProps)(App);