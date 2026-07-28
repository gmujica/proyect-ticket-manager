import React from 'react';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { connect } from 'react-redux';
import { addList, addCard } from '../actions';
import { DEFAULT_PRIORITY, DEFAULT_TYPE } from '../constants/ticket';
import { priorityOptions, typeOptions } from '../constants/ticketIcons';

class TrelloActionButton extends React.Component {

    state = {
        formOpen: false,
        text: '',
        type: DEFAULT_TYPE,
        priority: DEFAULT_PRIORITY
    };

    openForm = () => {
        this.setState({ formOpen: true });
    };

    closeForm = () => {
        this.setState({ formOpen: false, text: '' });
    };

    handleInputChange = e => {
        this.setState({ text: e.target.value });
    };

    handleTypeChange = e => {
        this.setState({ type: e.target.value });
    };

    handlePriorityChange = e => {
        this.setState({ priority: e.target.value });
    };

    handleAddList = () => {
        const { dispatch } = this.props;
        const { text } = this.state;

        if (text.trim()) {
            this.setState({ text: '' });
            dispatch(addList(text.trim()));
        }
    };

    handleAddCard = () => {
        const { dispatch, listID } = this.props;
        const { text, type, priority } = this.state;

        if (text.trim()) {
            this.setState({ text: '', type: DEFAULT_TYPE, priority: DEFAULT_PRIORITY });
            dispatch(addCard(listID, text.trim(), type, priority));
        }
    };

    renderAddButton = () => {
        const { list } = this.props;

        const buttonText = list ? 'Add another list' : 'Add another card';
        const buttonTextOpacity = list ? 1 : 0.5;
        const buttonTextColor = list ? 'white' : 'inherit';
        const buttonTextBackground = list ? 'rgba(0, 0, 0, .15)' : 'inherit';

        return (
            <div
                onClick={this.openForm}
                style={{
                    ...styles.openFormButtonGroup,
                    opacity: buttonTextOpacity,
                    color: buttonTextColor,
                    backgroundColor: buttonTextBackground
                }}
            >
                <AddIcon />
                <p>{buttonText}</p>
            </div>
        );
    };

    renderSelects = () => {
        const { type, priority } = this.state;

        const renderOption = ({ key, label, Icon, color }) => (
            <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon sx={{ color, fontSize: 18 }} />
                    {label}
                </Box>
            </MenuItem>
        );

        return (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Select
                    size="small"
                    value={type}
                    onChange={this.handleTypeChange}
                    aria-label="Ticket type"
                    sx={{ flex: 1, backgroundColor: 'white' }}
                >
                    {typeOptions().map(renderOption)}
                </Select>
                <Select
                    size="small"
                    value={priority}
                    onChange={this.handlePriorityChange}
                    aria-label="Ticket priority"
                    sx={{ flex: 1, backgroundColor: 'white' }}
                >
                    {priorityOptions().map(renderOption)}
                </Select>
            </Stack>
        );
    };

    renderForm = () => {
        const { list } = this.props;

        const placeholder = list
            ? 'Enter list title...'
            : 'Enter a title for this card...';

        const buttonTitle = list ? 'Add List' : 'Add Card';

        return (
            <div>
                <Card
                    style={{
                        overflow: 'visible',
                        minHeight: 80,
                        minWidth: 272,
                        padding: '6px 8px 2px'
                    }}
                >
                    <TextareaAutosize
                        placeholder={placeholder}
                        autoFocus
                        value={this.state.text}
                        onChange={this.handleInputChange}
                        style={{
                            resize: 'none',
                            width: '100%',
                            overflow: 'hidden',
                            outline: 'none',
                            border: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                        }}
                    />
                </Card>

                {!list && this.renderSelects()}

                <div style={styles.formButtonGroup}>
                    <Button
                        onClick={list ? this.handleAddList : this.handleAddCard}
                        variant='contained'
                        style={{ color: 'white', backgroundColor: '#5aac44' }}
                    >
                        {buttonTitle}
                    </Button>
                    <IconButton
                        onClick={this.closeForm}
                        aria-label="Close form"
                        size="small"
                        sx={{ ml: 1 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </div>
            </div>
        );
    };

    render() {
        return this.state.formOpen ? this.renderForm() : this.renderAddButton();
    }
}

const styles = {
    openFormButtonGroup: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        borderRadius: 3,
        height: 36,
        width: 272,
        paddingLeft: 10
    },
    formButtonGroup: {
        display: 'flex',
        marginTop: 8,
        alignItems: 'center'
    }
};

export default connect()(TrelloActionButton);