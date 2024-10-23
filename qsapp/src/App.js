import React, { useState, useEffect } from 'react';
import './styles.css';
import highPriority from './assets/Img-High Priority.svg';
import lowPriority from './assets/Img-Low Priority.svg';
import mediumPriority from './assets/Img-Medium Priority.svg';
import inProgress from './assets/in-progress.svg';
import noPriority from './assets/No-priority.svg';
import urgentPriorityColor from './assets/SVG-Urgent Priority colour.svg';
import todo from './assets/To-do.svg';
import cancelled from './assets/Cancelled.svg';
import backlog from './assets/Backlog.svg';
import completedTask from './assets/Done.svg';

const App = () => {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [grouping, setGrouping] = useState(localStorage.getItem('grouping') || 'status');
  const [sorting, setSorting] = useState(localStorage.getItem('sorting') || 'priority');
  const [displayMenu, setDisplayMenu] = useState(false);

  useEffect(() => {
    fetchData();
    const savedGrouping = localStorage.getItem('grouping');
    const savedSorting = localStorage.getItem('sorting');
    if (savedGrouping) setGrouping(savedGrouping);
    if (savedSorting) setSorting(savedSorting);

    const handleClickOutside = (event) => {
      if (!event.target.closest('.display-button')) {
        setDisplayMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('https://api.quicksell.co/v1/internal/frontend-assignment');
      const data = await response.json();
      setTickets(data.tickets);
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const priorityMap = {
    4: { label: 'Urgent', icon: urgentPriorityColor },
    3: { label: 'High', icon: highPriority },
    2: { label: 'Medium', icon: mediumPriority },
    1: { label: 'Low', icon: lowPriority },
    0: { label: 'No priority', icon: noPriority }
  };

  const statusMap = {
    'todo': { icon: todo, label: 'Todo' },
    'in progress': { icon: inProgress, label: 'In Progress' },
    'backlog': { icon: backlog, label: 'Backlog' },
    'done': { icon: completedTask, label: 'Done' },
    'canceled': { icon: cancelled, label: 'Cancelled' }
  };

  const getPriorityIcon = (priority) => {
    const priorityInfo = priorityMap[priority];
    return priorityInfo ? (
      <img src={priorityInfo.icon} alt={priorityInfo.label} className="icon" />
    ) : null;
  };

  const getStatusIcon = (status) => {
    const statusInfo = statusMap[status.toLowerCase()];
    return statusInfo ? (
      <img src={statusInfo.icon} alt={statusInfo.label} className="icon" />
    ) : null;
  };

  const handleGroupingChange = (value) => {
    setGrouping(value);
    localStorage.setItem('grouping', value);
  };

  const handleSortingChange = (value) => {
    setSorting(value);
    localStorage.setItem('sorting', value);
  };

  const handleSelectClick = (e) => {
    e.stopPropagation();
  };

  const sortTickets = (ticketsToSort) => {
    return [...ticketsToSort].sort((a, b) => {
      if (sorting === 'priority') {
        return b.priority - a.priority;
      }
      return a.title.localeCompare(b.title);
    });
  };

  const groupTickets = () => {
    let grouped = {};

    if (grouping === 'status') {
      // Initialize all status groups to ensure they're always displayed
      Object.keys(statusMap).forEach(status => {
        grouped[statusMap[status].label] = [];
      });
      
      tickets.forEach(ticket => {
        const statusLabel = statusMap[ticket.status.toLowerCase()]?.label || ticket.status;
        if (!grouped[statusLabel]) {
          grouped[statusLabel] = [];
        }
        grouped[statusLabel].push(ticket);
      });
    } else if (grouping === 'user') {
      tickets.forEach(ticket => {
        const user = users.find(u => u.id === ticket.userId);
        const userName = user ? user.name : 'Unassigned';
        if (!grouped[userName]) {
          grouped[userName] = [];
        }
        grouped[userName].push(ticket);
      });
    } else if (grouping === 'priority') {
      // Initialize all priority groups to ensure they're always displayed
      Object.entries(priorityMap).forEach(([priority, info]) => {
        grouped[info.label] = [];
      });
      
      tickets.forEach(ticket => {
        const priorityInfo = priorityMap[ticket.priority];
        const priorityLabel = priorityInfo ? priorityInfo.label : 'No priority';
        grouped[priorityLabel].push(ticket);
      });
    }

    // Sort tickets within each group
    Object.keys(grouped).forEach(key => {
      grouped[key] = sortTickets(grouped[key]);
    });

    return grouped;
  };

  const getUserAvatar = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (
      <div className="user-avatar" style={{ backgroundColor: getAvatarColor(user.name) }}>
        {user.name.charAt(0).toUpperCase()}
      </div>
    ) : null;
  };

  const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getGroupIcon = (group) => {
    if (grouping === 'status') {
      return getStatusIcon(group.toLowerCase());
    }
    if (grouping === 'priority') {
      const priorityLevel = Object.entries(priorityMap)
        .find(([_, info]) => info.label === group)?.[0];
      return getPriorityIcon(parseInt(priorityLevel));
    }
    return null;
  };

  const groupedTickets = groupTickets();

  return (
    <div className="app">
      <header className="header">
        <div className="display-button" onClick={(e) => {
          e.stopPropagation();
          setDisplayMenu(!displayMenu);
        }}>
          <span className="display-icon">&#9776; Display</span>
          {displayMenu && (
            <div className="display-menu" onClick={(e) => e.stopPropagation()}>
              <div className="menu-item">
                <span>Grouping</span>
                <select 
                  value={grouping} 
                  onChange={(e) => handleGroupingChange(e.target.value)}
                  onClick={handleSelectClick}
                >
                  <option value="status">Status</option>
                  <option value="user">User</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              <div className="menu-item">
                <span>Ordering</span>
                <select 
                  value={sorting} 
                  onChange={(e) => handleSortingChange(e.target.value)}
                  onClick={handleSelectClick}
                >
                  <option value="priority">Priority</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="board">
        {Object.entries(groupedTickets).map(([group, tickets]) => (
          <div key={group} className="column">
            <div className="column-header">
              <div className="column-header-left">
                {getGroupIcon(group)}
                <h2>{group}</h2>
                <span className="ticket-count">{tickets.length}</span>
              </div>
              <div className="column-header-right">
                <button className="add-button">+</button>
                <button className="more-button">⋯</button>
              </div>
            </div>
            <div className="tickets">
              {tickets.map(ticket => (
                <div key={ticket.id} className="ticket">
                  <div className="ticket-header">
                    <span className="ticket-id">{ticket.id}</span>
                    {getUserAvatar(ticket.userId)}
                  </div>
                  <div className="ticket-title">
                    {grouping !== 'status' && (
                      <span className="status-indicator">
                        {getStatusIcon(ticket.status)}
                      </span>
                    )}
                    {ticket.title}
                  </div>
                  <div className="ticket-footer">
                    {grouping !== 'priority' && (
                      <div className="priority-tag">
                        {getPriorityIcon(ticket.priority)}
                      </div>
                    )}
                    <div className="feature-request">
                      <span className="feature-icon">◉</span>
                      Feature Request
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;