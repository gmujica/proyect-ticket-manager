import React, { Component } from 'react';
import TrelloList from './TrelloList'
import { connect } from 'react-redux';
//import './App.css';

class App extends Component {
  render() {
    const { lists } = this.props;
    return (
      <div className="App">
        <h2>hola mundo</h2>
        { lists.map(List => (
         <TrelloList title={List.title} cards={List.cards } />
        ))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  lists: state.lists
});

export default connect(mapStateToProps) (App);
