// Global variables
let allListsData = {}; // Contains all lists and their tasks
let currentListId = 'default'; // Currently active list
let tasks = []; // Current list's tasks
let editingIndex = -1;
let sortColumn = '';
let sortDirection = 'asc';
let selectedStatuses = []; // Track selected status filters

// List management variables
let editingListId = null;

// Column management variables
let customColumns = [];
let editingColumnIndex = -1;
let columnOrder = []; // Stores the order of all columns (both default and custom)
let isAddingColumn = false; // Flag to prevent duplicate column additions

// Default columns that cannot be deleted
const defaultColumns = [
    { id: 'sr', name: 'Sr', type: 'number', required: true, sortable: true, visible: true, deletable: false, alignment: 'center' },
    { id: 'task', name: 'Task', type: 'textarea', required: true, sortable: true, visible: true, deletable: false, alignment: 'left' },
    { id: 'priority', name: 'P', type: 'number', required: true, sortable: true, visible: true, deletable: false, alignment: 'center' },
    { id: 'resource', name: 'Resource', type: 'text', required: false, sortable: true, visible: true, deletable: false, alignment: 'center' },
    { id: 'status', name: 'Status', type: 'select', required: true, sortable: true, visible: true, deletable: false, alignment: 'center', options: ['Pending', 'Assigned', 'Completed', 'Blocked'] },
    { id: 'dueDate', name: 'Due', type: 'date', required: false, sortable: true, visible: true, deletable: false, alignment: 'center' },
    { id: 'remarks', name: 'Remarks', type: 'textarea', required: false, sortable: false, visible: true, deletable: false, alignment: 'left' },
    { id: 'actions', name: 'Del', type: 'actions', required: false, sortable: false, visible: true, deletable: false, alignment: 'center' }
];

const initialTasks = [
    { sr: 1, task: "Provisional Staff Data Entry & Rights Allocation", priority: 0, resource: "Vyom", status: "Completed", dueDate: "07-06-2025", remarks: "" },
    { sr: 2, task: "School Logo Design", priority: 1, resource: "RGV + Tarangbhai", status: "Assigned", dueDate: "12-06-2025", remarks: "" },
    { sr: 3, task: "Add, Edit, List Page Redesign", priority: 1, resource: "Jay", status: "Assigned", dueDate: "10-06-2025", remarks: "" },
    { sr: 4, task: "Payment Integration - School Team Changes", priority: 1, resource: "Sagar - Reet", status: "Assigned", dueDate: "10-06-2025", remarks: "" },
    { sr: 5, task: "Payment Integration - Common Generic Changes", priority: 1, resource: "Sukhubha", status: "Assigned", dueDate: "10-06-2025", remarks: "" },
    { sr: 6, task: "Whatsapp Integration", priority: 1, resource: "", status: "Blocked", dueDate: "", remarks: "Who will do it & how we will do it?" },
    { sr: 7, task: "Metronic Physibility Check", priority: 1, resource: "Mayur + Sagar", status: "Completed", dueDate: "06-06-2025", remarks: "For more complex project, Metronic is preffered & for less complex project, Minimal is prefered" },
    { sr: 8, task: "Qurterly Fee Collection Effect", priority: 1, resource: "Mayur + Devloper", status: "Pending", dueDate: "", remarks: "" },
    { sr: 9, task: "Subject Wise Marks Entry While Admission", priority: 1, resource: "Mayur + Devloper", status: "Pending", dueDate: "", remarks: "" },
    { sr: 10, task: "Mobile App Student Content Design on Paper - Fee", priority: 2, resource: "Mayur", status: "Pending", dueDate: "", remarks: "" }
];

// Data management functions
function updatePageTitle() {
    const titleElement = document.querySelector('.title');
    if (titleElement && allListsData[currentListId]) {
        titleElement.textContent = allListsData[currentListId].name;
    }
}

// Editable title functions
function startEditListTitle() {
    const titleElement = document.querySelector('.title');
    if (!titleElement || !allListsData[currentListId]) return;
    
    const currentName = allListsData[currentListId].name;
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'title-input';
    input.maxLength = 50;
    
    // Add editing class to title element
    titleElement.classList.add('editing');
    
    // Replace title text with input
    titleElement.textContent = '';
    titleElement.appendChild(input);
    
    // Focus and select all text
    input.focus();
    input.select();
    
    // Event handlers
    input.addEventListener('blur', finishEditListTitle);
    input.addEventListener('keydown', handleTitleKeydown);
    
    // Prevent double-click from triggering again
    titleElement.style.pointerEvents = 'none';
}

function handleTitleKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        finishEditListTitle();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEditListTitle();
    }
}

function finishEditListTitle() {
    const titleElement = document.querySelector('.title');
    const input = titleElement.querySelector('.title-input');
    
    if (!input || !allListsData[currentListId]) {
        cancelEditListTitle();
        return;
    }
    
    const newName = input.value.trim();
    
    // Validate name
    if (!newName) {
        showToast('List name cannot be empty', 'error');
        input.focus();
        return;
    }
    
    // Check if name already exists (excluding current list)
    const existingList = Object.values(allListsData).find(list => 
        list.id !== currentListId && list.name.toLowerCase() === newName.toLowerCase()
    );
    
    if (existingList) {
        showToast('A list with this name already exists', 'error');
        input.focus();
        return;
    }
    
    // Update list name
    allListsData[currentListId].name = newName;
    
    // Save data
    saveAllListsData();
    
    // Update UI
    resetTitleElement();
    updatePageTitle();
    populateListSelector();
    populateListsContainer();
    
    showToast('List name updated successfully', 'success');
}

function cancelEditListTitle() {
    resetTitleElement();
    updatePageTitle();
}

function resetTitleElement() {
    const titleElement = document.querySelector('.title');
    if (!titleElement) return;
    
    // Remove editing class
    titleElement.classList.remove('editing');
    
    // Restore pointer events
    titleElement.style.pointerEvents = '';
    
    // Clear content and restore original functionality
    titleElement.innerHTML = '';
}

function loadData() {
    // Load all lists data
    const savedListsData = localStorage.getItem('taskManagerListsData');
    if (savedListsData) {
        allListsData = JSON.parse(savedListsData);
    } else {
        // Initialize with default list containing sample data
        allListsData = {
            'default': {
                id: 'default',
                name: 'Main Tasks',
                description: 'Default task list',
                tasks: [...initialTasks],
                createdAt: new Date().toISOString()
            }
        };
        saveAllListsData();
    }

    // Set current list (use first available if current doesn't exist)
    const savedCurrentList = localStorage.getItem('taskManagerCurrentList');
    if (savedCurrentList && allListsData[savedCurrentList]) {
        currentListId = savedCurrentList;
    } else {
        currentListId = Object.keys(allListsData)[0] || 'default';
    }

    // Load current list's tasks
    tasks = allListsData[currentListId]?.tasks || [];

    // Load custom columns
    loadCustomColumns();
      // Update UI
    populateListSelector();
    updatePageTitle();
    renderTasks();
    updateStats();
    
    // Load saved filter settings after data is loaded
    loadFilterSettings();
    // Load saved advanced filters
    loadAdvancedFilters();
    // Load filter presets
    loadFilterPresets();
}

function saveData() {
    // Save current list's tasks back to allListsData
    if (allListsData[currentListId]) {
        allListsData[currentListId].tasks = [...tasks];
    }
    saveAllListsData();
    // Update list selector to show updated task counts
    populateListSelector();
}

function saveAllListsData() {
    localStorage.setItem('taskManagerListsData', JSON.stringify(allListsData));
    localStorage.setItem('taskManagerCurrentList', currentListId);
}

// List management functions
function populateListSelector() {
    const listSelector = document.getElementById('listSelector');
    
    // Check if the list selector dropdown exists (it may have been removed from the UI)
    if (!listSelector) {
        return;
    }
    
    listSelector.innerHTML = '';
    
    Object.values(allListsData).forEach(list => {
        const option = document.createElement('option');
        option.value = list.id;
        option.textContent = `${list.name} (${list.tasks.length} tasks)`;
        if (list.id === currentListId) {
            option.selected = true;
        }
        listSelector.appendChild(option);
    });
}

function switchList() {
    const listSelector = document.getElementById('listSelector');
    
    // Check if the list selector dropdown exists (it may have been removed from the UI)
    if (!listSelector) {
        return;
    }
    
    const newListId = listSelector.value;
    
    if (newListId !== currentListId && allListsData[newListId]) {
        // Save current list data first
        saveData();
          // Switch to new list
        currentListId = newListId;
        tasks = [...(allListsData[currentListId].tasks || [])];
        
        // Update UI
        updatePageTitle();
        renderTasks();
        updateStats();
        saveAllListsData();
        
        // Clear filters and search
        clearAllFilters();
        document.getElementById('searchInput').value = '';
        
        showToast(`Switched to "${allListsData[currentListId].name}"`);
    }
}

function switchToList(listId) {
    if (listId !== currentListId && allListsData[listId]) {
        // Save current list data first
        saveData();
          // Switch to new list
        currentListId = listId;
        tasks = [...(allListsData[currentListId].tasks || [])];
        
        // Update UI
        updatePageTitle();
        renderTasks();
        updateStats();
        saveAllListsData();
        
        // Update list selector dropdown
        document.getElementById('listSelector').value = listId;
        
        // Clear filters and search
        clearAllFilters();
        document.getElementById('searchInput').value = '';
        
        // Close the lists panel
        toggleListsPanel();
        
        showToast(`Switched to "${allListsData[currentListId].name}"`);
    }
}

function toggleListsPanel() {
    const panel = document.getElementById('listsManagementPanel');
    const overlay = document.getElementById('listsOverlay');
    
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        overlay.classList.remove('active');
        editingListId = null;
    } else {
        panel.classList.add('open');
        overlay.classList.add('active');
        populateListsContainer();
    }
}

function closeListsPanel() {
    const panel = document.getElementById('listsManagementPanel');
    const overlay = document.getElementById('listsOverlay');
    panel.classList.remove('open');
    overlay.classList.remove('active');
    editingListId = null;
}

function populateListsContainer() {
    const container = document.getElementById('listsContainer');
    container.innerHTML = '';
      if (Object.keys(allListsData).length === 0) {
        container.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--gray-500); font-size: 12px; font-style: italic;">No lists created yet</div>';
        return;
    }
    
    Object.values(allListsData).forEach(list => {
        const listItem = document.createElement('div');
        listItem.className = `list-item ${list.id === currentListId ? 'active' : ''}`;
        
        const completedCount = list.tasks.filter(task => task.status === 'Completed').length;
        const pendingCount = list.tasks.filter(task => task.status === 'Pending').length;
          listItem.innerHTML = `
            <div class="list-info" onclick="switchToList('${list.id}')" style="cursor: pointer;">
                <div class="list-name">${escapeHtml(list.name)}</div>
                ${list.description ? `<div class="list-description">${escapeHtml(list.description)}</div>` : ''}
            </div>
            <div class="list-stats" onclick="switchToList('${list.id}')" style="cursor: pointer;">
                <span class="list-stat">${list.tasks.length} total</span>
                <span class="list-stat">${completedCount} done</span>
                <span class="list-stat">${pendingCount} pending</span>
            </div>
            <div class="list-actions" onclick="event.stopPropagation();">
                <button class="btn-icon-sm" onclick="editList('${list.id}')" title="Edit list">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                ${Object.keys(allListsData).length > 1 ? `
                <button class="btn-icon-sm danger" onclick="deleteList('${list.id}')" title="Delete list">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                    </svg>
                </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(listItem);
    });
}

function addNewList() {
    const nameInput = document.getElementById('newListName');
    const descriptionInput = document.getElementById('newListDescription');
    
    const name = nameInput.value.trim();
    if (!name) {
        showToast('Please enter a list name', 'error');
        nameInput.focus();
        return;
    }
    
    // Check if name already exists
    const existingList = Object.values(allListsData).find(list => 
        list.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingList) {
        showToast('A list with this name already exists', 'error');
        nameInput.focus();
        return;
    }
    
    // Create new list
    const listId = 'list_' + Date.now();
    allListsData[listId] = {
        id: listId,
        name: name,
        description: descriptionInput.value.trim(),
        tasks: [],
        createdAt: new Date().toISOString()
    };
    
    // Clear form
    nameInput.value = '';
    descriptionInput.value = '';
    
    // Save and update UI
    saveAllListsData();
    populateListSelector();
    populateListsContainer();
    
    showToast(`List "${name}" created successfully`);
}

function editList(listId) {
    const list = allListsData[listId];
    if (!list) return;
    
    const nameInput = document.getElementById('newListName');
    const descriptionInput = document.getElementById('newListDescription');
    
    nameInput.value = list.name;
    descriptionInput.value = list.description || '';
    editingListId = listId;
    
    // Change button text
    const addButton = document.querySelector('.add-list-section button');
    addButton.textContent = 'Update List';
    addButton.onclick = updateList;
}

function updateList() {
    if (!editingListId || !allListsData[editingListId]) return;
    
    const nameInput = document.getElementById('newListName');
    const descriptionInput = document.getElementById('newListDescription');
    
    const name = nameInput.value.trim();
    if (!name) {
        showToast('Please enter a list name', 'error');
        return;
    }
    
    // Check if name already exists (excluding current list)
    const existingList = Object.values(allListsData).find(list => 
        list.id !== editingListId && list.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingList) {
        showToast('A list with this name already exists', 'error');
        return;
    }
    
    // Update list
    allListsData[editingListId].name = name;
    allListsData[editingListId].description = descriptionInput.value.trim();
    
    // Clear form and reset
    nameInput.value = '';
    descriptionInput.value = '';
    editingListId = null;
    
    // Reset button
    const addButton = document.querySelector('.add-list-section button');
    addButton.textContent = 'Create List';
    addButton.onclick = addNewList;
    
    // Save and update UI
    saveAllListsData();
    populateListSelector();
    populateListsContainer();
    
    showToast(`List "${name}" updated successfully`);
}

function deleteList(listId) {
    const list = allListsData[listId];
    if (!list) return;
    
    if (Object.keys(allListsData).length === 1) {
        showToast('Cannot delete the last remaining list', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${list.name}"?\n\nThis will permanently delete all ${list.tasks.length} tasks in this list.`)) {
        return;
    }
    
    // If deleting current list, switch to another list first
    if (listId === currentListId) {
        const remainingLists = Object.keys(allListsData).filter(id => id !== listId);
        currentListId = remainingLists[0];
        tasks = [...(allListsData[currentListId].tasks || [])];
    }
    
    // Delete the list
    delete allListsData[listId];
    
    // Save and update UI
    saveAllListsData();
    populateListSelector();
    populateListsContainer();
    renderTasks();
    updateStats();
    
    showToast(`List "${list.name}" deleted successfully`);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Filter persistence functions
function saveFilterSettings() {
    const filterSettings = {
        searchText: document.getElementById('searchInput').value,
        statusFilters: {
            all: document.getElementById('statusAll').checked,
            completed: document.getElementById('statusCompleted').checked,
            assigned: document.getElementById('statusAssigned').checked,
            pending: document.getElementById('statusPending').checked,
            blocked: document.getElementById('statusBlocked').checked
        },
        priorityFilter: document.getElementById('priorityFilter').value
    };
    localStorage.setItem('taskFilterSettings', JSON.stringify(filterSettings));
}

function loadFilterSettings() {
    const savedFilters = localStorage.getItem('taskFilterSettings');
    if (savedFilters) {
        const filterSettings = JSON.parse(savedFilters);

        // Restore search input
        document.getElementById('searchInput').value = filterSettings.searchText || '';

        // Restore status filters
        if (filterSettings.statusFilters) {
            document.getElementById('statusAll').checked = filterSettings.statusFilters.all;
            document.getElementById('statusCompleted').checked = filterSettings.statusFilters.completed;
            document.getElementById('statusAssigned').checked = filterSettings.statusFilters.assigned;
            document.getElementById('statusPending').checked = filterSettings.statusFilters.pending;
            document.getElementById('statusBlocked').checked = filterSettings.statusFilters.blocked;

            // Update selectedStatuses array
            updateSelectedStatuses();
            updateStatusFilterText();
        }

        // Restore priority filter
        document.getElementById('priorityFilter').value = filterSettings.priorityFilter || '';

        // Apply the restored filters
        filterTasks();
    }
}

function updateSelectedStatuses() {
    selectedStatuses = [];
    if (document.getElementById('statusCompleted').checked) selectedStatuses.push('Completed');
    if (document.getElementById('statusAssigned').checked) selectedStatuses.push('Assigned');
    if (document.getElementById('statusPending').checked) selectedStatuses.push('Pending');
    if (document.getElementById('statusBlocked').checked) selectedStatuses.push('Blocked');
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('blockedTasks').textContent = blocked;
    
    // Update quick filters if panel is open
    if (isAdvancedFiltersPanelOpen) {
        renderQuickFilters();
    }
}

// Sorting functions
function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    document.querySelectorAll('.sort-indicator').forEach(el => {
        el.textContent = '↕';
        el.classList.remove('active');
    });

    const indicator = document.getElementById(`sort-${column}`);
    if (indicator) {
        indicator.textContent = sortDirection === 'asc' ? '↑' : '↓';
        indicator.classList.add('active');
    }

    // Get column metadata to determine data type
    const allColumns = getAllColumns();
    const columnInfo = allColumns.find(col => col.id === column);
    const columnType = columnInfo ? columnInfo.type : 'text';

    tasks.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle different data types based on column type
        switch (columnType) {
            case 'number':
                aVal = aVal ? parseFloat(aVal) : 0;
                bVal = bVal ? parseFloat(bVal) : 0;
                break;

            case 'date':
                // Handle date format DD-MM-YYYY
                if (aVal && typeof aVal === 'string' && aVal.includes('-')) {
                    aVal = new Date(aVal.split('-').reverse().join('-'));
                } else {
                    aVal = new Date('2099-12-31'); // Future date for empty values
                }
                if (bVal && typeof bVal === 'string' && bVal.includes('-')) {
                    bVal = new Date(bVal.split('-').reverse().join('-'));
                } else {
                    bVal = new Date('2099-12-31'); // Future date for empty values
                }
                break;

            case 'text':
            case 'textarea':
            case 'email':
            case 'url':
            case 'select':
            default:
                // String comparison (case-insensitive)
                aVal = aVal ? aVal.toString().toLowerCase() : '';
                bVal = bVal ? bVal.toString().toLowerCase() : '';
                break;
        }

        // Comparison logic
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    renderTasks();
}

// Rendering functions
function renderTasks() {
    const tbody = document.getElementById('taskTableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const priorityFilter = document.getElementById('priorityFilter').value;

    let filteredTasks = tasks.filter(task => {
        // Enhanced search to include all text fields including custom columns
        let searchMatch = false;

        // Search in default fields
        if (task.task && task.task.toLowerCase().includes(searchTerm)) searchMatch = true;
        if (task.resource && task.resource.toLowerCase().includes(searchTerm)) searchMatch = true;
        if (task.remarks && task.remarks.toLowerCase().includes(searchTerm)) searchMatch = true;

        // Search in custom text/textarea/email/url fields
        customColumns.forEach(column => {
            if (['text', 'textarea', 'email', 'url', 'select'].includes(column.type)) {
                const value = task[column.id];
                if (value && value.toString().toLowerCase().includes(searchTerm)) {
                    searchMatch = true;
                }
            }
        });

        // Updated status filter logic for multi-select
        const allStatusSelected = document.getElementById('statusAll').checked;
        const matchesStatus = allStatusSelected || selectedStatuses.length === 0 ||
            selectedStatuses.includes(task.status);

        const matchesPriority = !priorityFilter || task.priority.toString() === priorityFilter;

        return searchMatch && matchesStatus && matchesPriority;
    });

    // Get columns in the correct order according to columnOrder array
    const allColumns = getAllColumns();
    const visibleColumns = columnOrder
        .map(colId => allColumns.find(col => col.id === colId))
        .filter(col => col && col.visible);

    tbody.innerHTML = filteredTasks.map(task => {
        const cells = visibleColumns.map(column => {
            return renderTaskCell(task, column);
        }).join('');

        return `<tr data-id="${task.sr}" class="status-row-${task.status.toLowerCase()}">${cells}</tr>`;
    }).join('');

    document.querySelectorAll('.editable').forEach(el => {
        el.addEventListener('dblclick', function () {
            startInlineEdit(this);
        });
    });
    
    // Re-initialize column resize after table is re-rendered (debounced)
    clearTimeout(window.resizeInitTimeout);
    window.resizeInitTimeout = setTimeout(() => {
        initializeColumnResize();
        loadColumnWidths();
    }, 50);
}

function renderTaskCell(task, column) {
    const value = task[column.id] || '';

    switch (column.id) {
        case 'sr':
            return `<td class="sr-column">${task.sr}</td>`;

        case 'priority':
            return `
                <td class="priority-column">
                    <span class="priority-badge priority-${task.priority}" onclick="showPriorityDropdown(${task.sr}, this)" title="Click to change">${task.priority}</span>
                </td>
            `;

        case 'status':
            return `
                <td class="status-column">
                    <span class="status-badge status-${task.status.toLowerCase()}" onclick="cycleStatus(${task.sr})" title="Click to change">${task.status}</span>
                </td>
            `;

        case 'actions':
            return `
                <td class="actions-column">
                    <button class="action-btn delete-btn" onclick="deleteTask(${task.sr})" title="Delete">×</button>
                </td>
            `;

        default:
            // Handle custom columns and default columns
            const cellType = column.type === 'textarea' ? 'textarea' : column.type === 'date' ? 'date' : 'text';

            if (column.type === 'select' && column.options) {
                return `
                    <td class="${column.id}-column">
                        <span class="select-badge" onclick="showSelectDropdown(${task.sr}, '${column.id}', this)" title="Click to change">${value}</span>
                    </td>
                `;
            } else {
                return `
                    <td class="${column.id}-column">
                        <div class="editable" data-field="${column.id}" data-id="${task.sr}" data-type="${cellType}">${value}</div>
                    </td>
                `;
            }
    }
}

// Dropdown functions
function showPriorityDropdown(sr, element) {
    const existingDropdown = document.querySelector('.priority-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'priority-dropdown';

    for (let i = 0; i <= 10; i++) {
        const option = document.createElement('div');
        option.className = `priority-option priority-${i}`;
        option.textContent = i;
        option.onclick = () => {
            changePriority(sr, i);
            dropdown.remove();
        };
        dropdown.appendChild(option);
    }

    element.style.position = 'relative';
    element.appendChild(dropdown);

    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== element) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 0);
}

function showSelectDropdown(sr, fieldId, element) {
    const existingDropdown = document.querySelector('.priority-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    const allColumns = getAllColumns();
    const column = allColumns.find(col => col.id === fieldId);
    if (!column || !column.options) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'priority-dropdown';

    column.options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'priority-option';
        optionDiv.textContent = option;
        optionDiv.onclick = () => {
            changeSelectValue(sr, fieldId, option);
            dropdown.remove();
        };
        dropdown.appendChild(optionDiv);
    });

    element.style.position = 'relative';
    element.appendChild(dropdown);

    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== element) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 0);
}

function changeSelectValue(sr, fieldId, newValue) {
    const task = tasks.find(t => t.sr === sr);
    if (task) {
        task[fieldId] = newValue;
        saveData();
        renderTasks();
        updateStats();
        showToast(`${fieldId} → ${newValue}`);
    }
}

function changePriority(sr, newPriority) {
    const task = tasks.find(t => t.sr === sr);
    if (task) {
        task.priority = newPriority;
        saveData();
        renderTasks();
        updateStats();
        showToast(`Priority → ${newPriority}`);
    }
}

// Inline editing functions
function startInlineEdit(element) {
    if (element.classList.contains('editing')) return;

    const field = element.dataset.field;
    const id = parseInt(element.dataset.id);
    const type = element.dataset.type;
    const currentValue = element.textContent.trim();

    element.classList.add('editing');
    element.closest('tr').classList.add('editing');

    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'edit-textarea';
    } else if (type === 'date') {
        input = document.createElement('input');
        input.type = 'date';
        input.className = 'edit-input';
        if (currentValue) {
            input.value = currentValue.split('-').reverse().join('-');
        }
    } else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
    }

    if (type !== 'date') {
        input.value = currentValue;
    }

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    if (input.select) input.select();

    function saveEdit() {
        let newValue = input.value.trim();
        if (type === 'date' && newValue) {
            newValue = newValue.split('-').reverse().join('-');
        }

        const task = tasks.find(t => t.sr === id);
        if (task) {
            task[field] = newValue;
            saveData();
            updateStats();
        }

        element.classList.remove('editing');
        element.closest('tr').classList.remove('editing');
        element.textContent = newValue;
    }

    function cancelEdit() {
        element.classList.remove('editing');
        element.closest('tr').classList.remove('editing');
        element.textContent = currentValue;
    }    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
}

// Header editing functions
function addHeaderEditListeners() {
    // Remove existing listeners by cloning and replacing elements
    document.querySelectorAll('th[data-sortable="true"]').forEach(th => {
        const newTh = th.cloneNode(true);
        th.parentNode.replaceChild(newTh, th);
    });
    
    // Add double-click listeners for editing
    document.querySelectorAll('.header-content.editable').forEach(headerContent => {
        headerContent.addEventListener('dblclick', function(e) {
            e.stopPropagation(); // Prevent sorting when double-clicking
            e.preventDefault();
            startHeaderEdit(this);
        });
    });
    
    // Add click listeners for sorting
    document.querySelectorAll('th[data-sortable="true"]').forEach(th => {
        th.addEventListener('click', function(e) {
            // Don't sort if any header is being edited
            if (document.querySelector('.header-content.editing')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            const columnId = this.dataset.columnId;
            if (columnId) {
                sortTable(columnId);
            }
        });
    });
    
    // Re-attach drag listeners after cloning elements
    attachColumnDragListeners();
}

function startHeaderEdit(element) {
    if (element.classList.contains('editing')) return;

    const columnId = element.dataset.columnId;
    const column = getAllColumns().find(col => col.id === columnId);
    
    // Allow editing of all columns except actions
    if (!column || column.id === 'actions') {
        showToast('Actions column cannot be edited', 'error');
        return;
    }

    const currentName = column.name;
    const sortIndicator = element.querySelector('.sort-indicator');
    const dragHandle = element.querySelector('.drag-handle');

    element.classList.add('editing');

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'header-edit-input';
    input.value = currentName;

    // Store original content
    const originalContent = element.innerHTML;

    // Replace content with input
    element.innerHTML = '';
    element.appendChild(input);
    
    // Focus and select text
    input.focus();
    input.select();

    function saveHeaderEdit() {
        const newName = input.value.trim();
        
        if (!newName) {
            showToast('Column name cannot be empty', 'error');
            cancelHeaderEdit();
            return;
        }

        // Check if name already exists (excluding current column)
        const allColumns = getAllColumns();
        const existingColumn = allColumns.find(col => 
            col.name.toLowerCase() === newName.toLowerCase() && col.id !== columnId
        );

        if (existingColumn) {
            showToast('Column name already exists', 'error');
            cancelHeaderEdit();
            return;
        }        // Update column name
        const customColumnIndex = customColumns.findIndex(col => col.id === columnId);
        const defaultColumnIndex = defaultColumns.findIndex(col => col.id === columnId);
        
        if (customColumnIndex >= 0) {
            // Update custom column
            customColumns[customColumnIndex].name = newName;
            saveCustomColumns();
        } else if (defaultColumnIndex >= 0) {
            // Update default column
            defaultColumns[defaultColumnIndex].name = newName;
            // Save default column changes to localStorage
            localStorage.setItem('taskManagerDefaultColumns', JSON.stringify(defaultColumns));
        }
        
        // Regenerate table headers and re-render
        generateTableHeaders();
        renderTasks();
        
        showToast(`Column renamed to "${newName}"`);
    }    function cancelHeaderEdit() {
        element.classList.remove('editing');
        element.innerHTML = originalContent;
        
        // Re-add all header listeners by calling the main function
        // This ensures both edit and sort listeners are properly attached
        addHeaderEditListeners();
    }

    // Event listeners for input
    input.addEventListener('blur', saveHeaderEdit);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveHeaderEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelHeaderEdit();
        }
    });
}

// Status management functions
function cycleStatus(sr) {
    const statuses = ['Pending', 'Assigned', 'Completed', 'Blocked'];
    const task = tasks.find(t => t.sr === sr);
    if (task) {
        const currentIndex = statuses.indexOf(task.status);
        task.status = statuses[(currentIndex + 1) % statuses.length];
        saveData();
        renderTasks();
        updateStats();
        showToast(`Status → ${task.status}`);
    }
}

// Filter functions
function filterTasks() {
    saveFilterSettings();
    
    // If advanced filters or quick filters are active, use advanced filtering
    if (advancedFilters.length > 0 || activeQuickFilter) {
        applyAdvancedFilters();
        return;
    }
    
    renderTasks();
}

function toggleStatusDropdown() {
    const dropdown = document.querySelector('.status-filter-dropdown');
    const menu = document.getElementById('statusDropdownMenu');

    dropdown.classList.toggle('open');
    menu.classList.toggle('show');
}

function handleStatusFilterChange() {
    const allCheckbox = document.getElementById('statusAll');
    const statusCheckboxes = [
        document.getElementById('statusCompleted'),
        document.getElementById('statusAssigned'),
        document.getElementById('statusPending'),
        document.getElementById('statusBlocked')
    ];

    // Handle "All Status" checkbox
    if (event.target.id === 'statusAll') {
        if (allCheckbox.checked) {
            // Uncheck all other checkboxes
            statusCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            selectedStatuses = [];
        }
    } else {
        // If any specific status is selected, uncheck "All Status"
        if (event.target.checked) {
            allCheckbox.checked = false;
        }

        // Update selectedStatuses array
        selectedStatuses = statusCheckboxes
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.id.replace('status', ''));

        // If no specific status is selected, check "All Status"
        if (selectedStatuses.length === 0) {
            allCheckbox.checked = true;
        }
    }

    updateStatusFilterText();
    filterTasks();
}

function updateStatusFilterText() {
    const statusText = document.getElementById('statusFilterText');
    const allCheckbox = document.getElementById('statusAll');

    if (allCheckbox.checked || selectedStatuses.length === 0) {
        statusText.textContent = 'All Status';
    } else if (selectedStatuses.length === 1) {
        statusText.textContent = selectedStatuses[0];
    } else {
        statusText.textContent = `${selectedStatuses.length} Selected`;
    }
}

function deleteTask(sr) {
    if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.sr !== sr);
        saveData();
        renderTasks();
        updateStats();
        showToast('Deleted', 'error');
    }
}

// Modal functions
function openAddModal() {
    editingIndex = -1;
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    generateCustomFields();
    document.getElementById('taskModal').classList.add('show');
}

function openEditModal(task, index) {
    editingIndex = index;
    document.getElementById('modalTitle').textContent = 'Edit Task';

    // Populate default fields
    document.getElementById('taskName').value = task.task;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskResource').value = task.resource;
    document.getElementById('taskStatus').value = task.status;

    if (task.dueDate) {
        // Convert from DD-MM-YYYY to YYYY-MM-DD for input[type="date"]
        const dateParts = task.dueDate.split('-');
        if (dateParts.length === 3) {
            document.getElementById('taskDueDate').value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        }
    }

    document.getElementById('taskRemarks').value = task.remarks;

    generateCustomFields();

    // Populate custom fields
    customColumns.forEach(column => {
        const element = document.getElementById(`custom_${column.id}`);
        if (element && task[column.id] !== undefined) {
            let value = task[column.id];

            if (column.type === 'date' && value) {
                // Convert from DD-MM-YYYY to YYYY-MM-DD for input[type="date"]
                const dateParts = value.split('-');
                if (dateParts.length === 3) {
                    value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                }
            }

            element.value = value;
        }
    });

    document.getElementById('taskModal').classList.add('show');
}

function generateCustomFields() {
    const container = document.getElementById('customFieldsContainer');
    container.innerHTML = '';

    if (customColumns.length === 0) return;

    // Group custom columns into rows of two
    for (let i = 0; i < customColumns.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'form-row';

        const col1 = customColumns[i];
        const col2 = customColumns[i + 1];

        let rowHTML = `<div class="form-col">${generateFieldHTML(col1)}</div>`;
        if (col2) {
            rowHTML += `<div class="form-col">${generateFieldHTML(col2)}</div>`;
        }

        row.innerHTML = rowHTML;
        container.appendChild(row);
    }
}

function generateFieldHTML(column) {
    const required = column.required ? 'required' : '';
    const requiredClass = column.required ? 'required' : '';

    let inputHTML = '';

    switch (column.type) {
        case 'textarea':
            inputHTML = `<textarea id="custom_${column.id}" ${required} rows="3" placeholder="Enter ${column.name.toLowerCase()}..."></textarea>`;
            break;
        case 'number':
            inputHTML = `<input type="number" id="custom_${column.id}" ${required} placeholder="Enter ${column.name.toLowerCase()}...">`;
            break;
        case 'date':
            inputHTML = `<input type="date" id="custom_${column.id}" ${required}>`;
            break;
        case 'email':
            inputHTML = `<input type="email" id="custom_${column.id}" ${required} placeholder="Enter email...">`;
            break;
        case 'url':
            inputHTML = `<input type="url" id="custom_${column.id}" ${required} placeholder="Enter URL...">`;
            break;
        case 'select':
            const options = column.options ? column.options.map(opt => `<option value="${opt}">${opt}</option>`).join('') : '';
            inputHTML = `
                <select id="custom_${column.id}" ${required}>
                    <option value="">Select ${column.name.toLowerCase()}...</option>
                    ${options}
                </select>
            `;
            break;
        default: // text
            inputHTML = `<input type="text" id="custom_${column.id}" ${required} placeholder="Enter ${column.name.toLowerCase()}...">`;
    }

    return `
        <div class="form-group">
            <label for="custom_${column.id}" class="${requiredClass}">${column.name}</label>
            ${inputHTML}
        </div>
    `;
}

function openImportModal() {
    document.getElementById('importModal').classList.add('show');
    // Focus the import textarea for better user experience
    setTimeout(() => {
        document.getElementById('importData').focus();
    }, 100);
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('show');
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('show');
}

function openShortcutsModal() {
    document.getElementById('shortcutsModal').classList.add('show');
}

function closeShortcutsModal() {
    document.getElementById('shortcutsModal').classList.remove('show');
}

// Column Management Functions
function openColumnsModal() {
    renderColumnList();
    document.getElementById('columnsModal').classList.add('show');
}

function closeColumnsModal() {
    document.getElementById('columnsModal').classList.remove('show');
    clearColumnForm();
}

function getAllColumns() {
    return [...defaultColumns, ...customColumns];
}

function renderColumnList() {
    const columnList = document.getElementById('columnList');
    const columnCount = document.getElementById('columnCount');
    const allColumns = getAllColumns();

    // Update column count
    columnCount.textContent = `${allColumns.length} column${allColumns.length === 1 ? '' : 's'}`;

    // Order columns according to columnOrder array
    const orderedColumns = columnOrder
        .map(id => allColumns.find(col => col.id === id))
        .filter(col => col);

    columnList.innerHTML = orderedColumns.map(column => `
        <div class="column-item draggable-column" 
             data-column-id="${column.id}" 
             draggable="true">
            <div class="column-drag-handle" title="Drag to reorder">⋮⋮</div>
            <div class="column-info">
                <div class="column-name">${column.name}</div>
                <div class="column-meta">
                    <span class="column-type-badge">${column.type}</span>
                    ${column.required ? '<span class="column-required-badge">Required</span>' : ''}
                    ${column.sortable ? '<span class="column-sortable-badge">Sortable</span>' : ''}
                    <span class="column-alignment-badge" title="Text Alignment">${column.alignment || 'left'}</span>
                    ${column.options ? `<span style="font-size: 10px; color: var(--gray-600);">${column.options.join(', ')}</span>` : ''}
                </div>
            </div>
            <div class="column-actions">
                ${column.deletable !== false ? `
                    <button class="column-action-btn edit" onclick="editColumn('${column.id}')" title="Edit">✏</button>
                    <button class="column-action-btn delete" onclick="deleteColumn('${column.id}')" title="Delete">×</button>
                ` : `
                    <button class="column-action-btn edit" onclick="editDefaultColumn('${column.id}')" title="Edit Alignment">⚙</button>
                `}
            </div>
        </div>
    `).join('');

    // Attach drag and drop event listeners
    attachColumnManagementDragListeners();
}

function toggleColumnOptions() {
    const columnType = document.getElementById('newColumnType').value;
    const optionsGroup = document.getElementById('optionsInputGroup');
    const alignmentSelect = document.getElementById('newColumnAlignment');

    if (columnType === 'select') {
        optionsGroup.classList.add('show');
    } else {
        optionsGroup.classList.remove('show');
    }

    // Set smart default alignment based on column type
    if (columnType === 'number') {
        alignmentSelect.value = 'center';
    } else if (columnType === 'date') {
        alignmentSelect.value = 'center';
    } else {
        alignmentSelect.value = 'left';
    }
}

function clearColumnForm() {
    document.getElementById('newColumnName').value = '';
    document.getElementById('newColumnType').value = '';
    document.getElementById('newColumnOptions').value = '';
    document.getElementById('newColumnRequired').checked = false;
    document.getElementById('newColumnSortable').checked = true;
    document.getElementById('newColumnAlignment').value = 'left';
    document.getElementById('optionsInputGroup').classList.remove('show');
    editingColumnIndex = -1;
    isAddingColumn = false; // Reset the flag when clearing the form
}

function addNewColumn() {
    // Prevent duplicate calls
    if (isAddingColumn) {
        return;
    }
    isAddingColumn = true;    const name = document.getElementById('newColumnName').value.trim();
    const type = document.getElementById('newColumnType').value;
    const optionsText = document.getElementById('newColumnOptions').value.trim();
    const required = document.getElementById('newColumnRequired').checked;
    const sortable = document.getElementById('newColumnSortable').checked;
    const alignment = document.getElementById('newColumnAlignment').value;

    if (!name || !type) {
        showToast('Please fill in required fields', 'error');
        isAddingColumn = false;
        return;
    }    // Validate column name
    if (!/^[a-zA-Z][a-zA-Z0-9\s]*$/.test(name)) {
        showToast('Column name must start with a letter and contain only letters, numbers, and spaces', 'error');
        isAddingColumn = false;
        return;
    }

    // Generate unique ID
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');    // Check if column ID already exists (enhanced check)
    const allColumns = getAllColumns();
    const existingColumn = allColumns.find(col => col.id === id);
    
    if (existingColumn && (editingColumnIndex === -1 || existingColumn !== customColumns[editingColumnIndex])) {
        showToast('Column with this name already exists', 'error');
        isAddingColumn = false;
        return;
    }

    // Double-check if column already exists in customColumns array (prevent duplicates)
    if (editingColumnIndex === -1 && customColumns.find(col => col.id === id)) {
        showToast('Column already exists in custom columns', 'error');
        isAddingColumn = false;
        return;
    }

    // Validate select options
    if (type === 'select' && !optionsText) {
        showToast('Please provide options for dropdown field', 'error');
        isAddingColumn = false;
        return;
    }    const newColumn = {
        id: id,
        name: name,
        type: type,
        required: required,
        sortable: sortable,
        visible: true,
        deletable: true,
        alignment: alignment
    };// Add options for select type
    if (type === 'select' && optionsText) {
        newColumn.options = optionsText.split(',').map(opt => opt.trim()).filter(opt => opt);
        if (newColumn.options.length === 0) {
            showToast('Please provide valid options for dropdown field', 'error');
            isAddingColumn = false;
            return;
        }
    }

    if (editingColumnIndex >= 0) {
        // Update existing column
        customColumns[editingColumnIndex] = newColumn;
        showToast('Column updated successfully');
    } else {
        // Add new column
        customColumns.push(newColumn);

        // Add new column to columnOrder array (before actions column)
        const actionsIndex = columnOrder.indexOf('actions');
        if (actionsIndex > -1) {
            columnOrder.splice(actionsIndex, 0, id);
        } else {
            columnOrder.push(id);
        }

        // Add default value to all existing tasks
        tasks.forEach(task => {
            if (!(id in task)) {
                task[id] = getDefaultValueForType(type);
            }
        });

        showToast('Column added successfully');
    }    saveCustomColumns();
    saveColumnOrder(); // Save the updated column order
    renderColumnList();
    clearColumnForm();
    
    // Reset the flag after a short delay to prevent rapid clicks
    window.columnAddingTimeout = setTimeout(() => {
        isAddingColumn = false;
    }, 500);
}

function getDefaultValueForType(type) {
    switch (type) {
        case 'number': return 0;
        case 'date': return '';
        case 'select': return '';
        default: return '';
    }
}

function editColumn(columnId) {
    const column = customColumns.find(col => col.id === columnId);
    if (!column) return;

    document.getElementById('newColumnName').value = column.name;
    document.getElementById('newColumnType').value = column.type;
    document.getElementById('newColumnRequired').checked = column.required;
    document.getElementById('newColumnSortable').checked = column.sortable;
    document.getElementById('newColumnAlignment').value = column.alignment || 'left';

    if (column.options) {
        document.getElementById('newColumnOptions').value = column.options.join(', ');
    }

    toggleColumnOptions();
    editingColumnIndex = customColumns.indexOf(column);
}

function editDefaultColumn(columnId) {
    const alignmentOptions = ['left', 'center', 'right'];
    const column = defaultColumns.find(col => col.id === columnId);
    if (!column) return;

    const currentAlignment = column.alignment || 'left';
    const currentIndex = alignmentOptions.indexOf(currentAlignment);
    const nextIndex = (currentIndex + 1) % alignmentOptions.length;
    const newAlignment = alignmentOptions[nextIndex];

    // Update the alignment
    column.alignment = newAlignment;
    
    // Save default column changes to localStorage
    localStorage.setItem('taskManagerDefaultColumns', JSON.stringify(defaultColumns));
    
    // Regenerate styles and update display
    generateCustomColumnCSS();
    renderColumnList();
    
    showToast(`${column.name} alignment changed to ${newAlignment}`);
}

function deleteColumn(columnId) {
    const columnIndex = customColumns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) return;

    const column = customColumns[columnIndex];
    if (confirm(`Delete column "${column.name}"? This will remove all data in this column.`)) {
        // Remove column data from all tasks
        tasks.forEach(task => {
            delete task[columnId];
        });

        // Remove column from columnOrder array
        const orderIndex = columnOrder.indexOf(columnId);
        if (orderIndex > -1) {
            columnOrder.splice(orderIndex, 1);
        }

        customColumns.splice(columnIndex, 1);
        saveCustomColumns();
        saveColumnOrder(); // Save the updated column order
        renderColumnList();
        showToast('Column deleted', 'error');
    }
}

function applyColumnChanges() {
    // Regenerate table headers and re-render tasks
    generateTableHeaders();
    generateCustomColumnCSS();
    renderTasks();
    closeColumnsModal();
    showToast('Column changes applied');
}

function generateTableHeaders() {
    const thead = document.querySelector('.task-table thead tr');
    const allColumns = getAllColumns();

    // If no column order is set, initialize it with current column order
    if (columnOrder.length === 0) {
        columnOrder = allColumns.map(col => col.id);
    }

    // Order columns according to columnOrder array
    const orderedColumns = columnOrder
        .map(id => allColumns.find(col => col.id === id))
        .filter(col => col && col.visible);    thead.innerHTML = orderedColumns.map((column, index) => {
        const dragHandle = column.id !== 'actions' ? '<span class="drag-handle">⋮⋮</span>' : '';
        const draggableClass = column.id !== 'actions' ? 'draggable' : '';
        const editableClass = column.id !== 'actions' ? 'editable' : ''; // Make all columns except actions editable

        if (column.id === 'actions') {
            return `
                <th class="actions-column" data-column-id="${column.id}" data-column-index="${index}">
                    <div class="column-drag-indicator"></div>
                    <span class="header-content">${column.name}</span>
                </th>
            `;        } else if (column.sortable) {
            return `
                <th class="${column.id}-column ${draggableClass}" 
                    data-sortable="true"
                    draggable="true"
                    data-column-id="${column.id}"
                    data-column-index="${index}">
                    <div class="column-drag-indicator"></div>
                    <span class="header-content ${editableClass}" data-column-id="${column.id}">
                        ${dragHandle}${column.name} <span class="sort-indicator" id="sort-${column.id}">↕</span>
                    </span>
                </th>
            `;
        } else {
            return `
                <th class="${column.id}-column ${draggableClass}" 
                    draggable="true"
                    data-column-id="${column.id}"
                    data-column-index="${index}">
                    <div class="column-drag-indicator"></div>
                    <span class="header-content ${editableClass}" data-column-id="${column.id}">${dragHandle}${column.name}</span>
                </th>
            `;        }
    }).join('');

    // Add double-click event listeners for header editing (includes drag listeners)
    addHeaderEditListeners();
}

function saveCustomColumns() {
    localStorage.setItem('taskManagerCustomColumns', JSON.stringify(customColumns));
    saveData();
}

function loadCustomColumns() {
    // Load custom columns
    const saved = localStorage.getItem('taskManagerCustomColumns');
    if (saved) {
        customColumns = JSON.parse(saved);
        
        // Add default alignment to existing columns for backward compatibility
        customColumns.forEach(column => {
            if (!column.alignment) {
                column.alignment = column.type === 'number' ? 'center' : 'left';
            }
        });
    }

    // Load saved default column changes
    const savedDefaults = localStorage.getItem('taskManagerDefaultColumns');
    if (savedDefaults) {
        const savedDefaultColumns = JSON.parse(savedDefaults);
        // Update the defaultColumns array with saved names and alignment
        savedDefaultColumns.forEach(savedCol => {
            const defaultCol = defaultColumns.find(col => col.id === savedCol.id);
            if (defaultCol) {
                defaultCol.name = savedCol.name;
                // Add alignment if it exists in saved data
                if (savedCol.alignment) {
                    defaultCol.alignment = savedCol.alignment;
                }
            }
        });
    }

    // Load column order
    loadColumnOrder();

    generateTableHeaders();
    generateCustomColumnCSS();
}

function generateCustomColumnCSS() {
    // Remove existing custom column styles
    const existingStyle = document.getElementById('customColumnStyles');
    if (existingStyle) {
        existingStyle.remove();
    }

    // Create new style element for custom columns
    const style = document.createElement('style');
    style.id = 'customColumnStyles';

    let css = '';
    // Generate CSS for all columns (default + custom) to apply alignment
    // Using higher specificity to override static CSS rules
    const allColumns = getAllColumns();
    
    allColumns.forEach(column => {
        if (column.id !== 'actions') {
            const alignment = column.alignment || (column.type === 'number' ? 'center' : 'left');
            css += `
                .task-table .${column.id}-column {
                    text-align: ${alignment} !important;
                }
                .task-table .${column.id}-column .header-content {
                    justify-content: ${alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'};
                }
                .task-table .${column.id}-column .edit-input,
                .task-table .${column.id}-column .edit-textarea {
                    text-align: ${alignment} !important;
                }
                .task-table td.${column.id}-column,
                .task-table th.${column.id}-column {
                    text-align: ${alignment} !important;
                }
            `;
        }
    });

    // Additional styles for custom columns
    customColumns.forEach(column => {
        css += `
            .task-table .${column.id}-column {
                min-width: 120px;
                max-width: 200px;
            }
        `;
    });

    style.textContent = css;
    document.head.appendChild(style);
}

// Import/Export functions
function importData() {
    const data = document.getElementById('importData').value.trim();
    if (!data) {
        showToast('No data to import', 'error');
        return;
    }

    try {
        const lines = data.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            showToast('Need header + data rows', 'error');
            return;
        }        // Parse headers
        const headers = lines[0].split('\t').map(h => h.trim());
        const allColumns = getAllColumns();
        
        // Create column mapping and track new columns to create
        const columnMapping = {};
        const newColumnsToCreate = [];
        const matchedDefaultColumns = [];
        const matchedCustomColumns = [];
        let matchedColumns = 0;
        
        headers.forEach((header, index) => {
            // First, try to match with existing columns (case-insensitive)
            const existingColumn = allColumns.find(col =>
                col.name.toLowerCase() === header.toLowerCase() ||
                col.id.toLowerCase() === header.toLowerCase()
            );
            
            if (existingColumn) {
                columnMapping[index] = existingColumn.id;
                matchedColumns++;
                
                // Track which columns are matched
                if (defaultColumns.find(col => col.id === existingColumn.id)) {
                    matchedDefaultColumns.push(existingColumn.id);
                } else {
                    matchedCustomColumns.push(existingColumn.id);
                }
            } else {
                // Create a new custom column for unmatched headers
                const columnId = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
                
                // Check if this column ID already exists to avoid duplicates
                if (!allColumns.find(col => col.id === columnId) && 
                    !newColumnsToCreate.find(col => col.id === columnId)) {
                    
                    // Determine column type based on sample data
                    const sampleValues = [];
                    for (let i = 1; i < Math.min(6, lines.length); i++) {
                        const cellValue = lines[i].split('\t')[index];
                        if (cellValue && cellValue.trim()) {
                            sampleValues.push(cellValue.trim());
                        }
                    }
                    
                    const columnType = detectColumnType(sampleValues);
                    
                    const newColumn = {
                        id: columnId,
                        name: header,
                        type: columnType,
                        required: false,
                        sortable: true,
                        visible: true,
                        deletable: true,
                        alignment: columnType === 'number' ? 'center' : 'left'
                    };
                    
                    newColumnsToCreate.push(newColumn);
                }
                
                columnMapping[index] = columnId;
            }
        });        // Remove unmatched custom columns
        const unmatchedCustomColumns = customColumns.filter(col => 
            !matchedCustomColumns.includes(col.id)
        );
        
        if (unmatchedCustomColumns.length > 0) {
            // Remove unmatched custom columns
            customColumns = customColumns.filter(col => 
                matchedCustomColumns.includes(col.id)
            );
            
            // Remove from column order
            unmatchedCustomColumns.forEach(col => {
                const orderIndex = columnOrder.indexOf(col.id);
                if (orderIndex > -1) {
                    columnOrder.splice(orderIndex, 1);
                }
            });
            
            // Remove data from existing tasks for unmatched custom columns
            tasks.forEach(task => {
                unmatchedCustomColumns.forEach(col => {
                    delete task[col.id];
                });
            });
        }

        // Hide unmatched default columns (don't delete them, just hide)
        defaultColumns.forEach(col => {
            if (col.id !== 'actions') { // Never hide actions column
                col.visible = matchedDefaultColumns.includes(col.id);
            }
        });        // Add new columns to customColumns array
        if (newColumnsToCreate.length > 0) {
            newColumnsToCreate.forEach(newColumn => {
                customColumns.push(newColumn);
            });
            
            // Save new columns
            saveCustomColumns();
        }

        // Update column order to match the exact import sequence
        const newColumnOrder = [];
        
        // Add columns in the order they appear in the import headers
        headers.forEach((header, index) => {
            const columnId = columnMapping[index];
            if (columnId && !newColumnOrder.includes(columnId)) {
                newColumnOrder.push(columnId);
            }
        });
        
        // Add any existing visible columns that weren't in the import but should remain visible
        // Reuse the existing allColumns variable by getting fresh column list
        const refreshedColumns = getAllColumns();
        refreshedColumns.forEach(col => {
            if (col.visible && col.id !== 'actions' && !newColumnOrder.includes(col.id)) {
                newColumnOrder.push(col.id);
            }
        });
        
        // Always ensure actions column is at the end
        if (!newColumnOrder.includes('actions')) {
            newColumnOrder.push('actions');
        } else {
            // Move actions to the end if it's not already there
            const actionsIndex = newColumnOrder.indexOf('actions');
            if (actionsIndex !== newColumnOrder.length - 1) {
                newColumnOrder.splice(actionsIndex, 1);
                newColumnOrder.push('actions');
            }
        }
        
        columnOrder = newColumnOrder;
        
        // Save column order and regenerate table
        saveColumnOrder();
        generateTableHeaders();
        generateCustomColumnCSS();

        // Get updated column list after adding new columns
        const updatedAllColumns = getAllColumns();
        const newTasks = [];
        
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split('\t');
            const task = {};

            // Initialize with default values for all columns
            updatedAllColumns.forEach(col => {
                if (col.id !== 'actions') {
                    task[col.id] = getDefaultValueForType(col.type);
                }
            });

            // Map imported data to columns - preserve exact values as much as possible
            columns.forEach((value, colIndex) => {
                const columnId = columnMapping[colIndex];
                if (columnId) {
                    const column = updatedAllColumns.find(col => col.id === columnId);
                    let processedValue = value.trim();

                    // Handle different data types while preserving original data
                    if (column.type === 'number' && processedValue) {
                        // Try to parse as number, but keep original if it fails
                        const numValue = parseFloat(processedValue);
                        processedValue = !isNaN(numValue) ? numValue : processedValue;
                    } else if (column.type === 'select' && column.options) {
                        // For select columns, if value doesn't match options, add it as a new option
                        if (processedValue && !column.options.includes(processedValue)) {
                            column.options.push(processedValue);
                            // Update the column in customColumns if it's a custom column
                            const customColIndex = customColumns.findIndex(col => col.id === columnId);
                            if (customColIndex >= 0) {
                                customColumns[customColIndex].options = column.options;
                            }
                        }
                    }
                    // For all other types (text, textarea, date, email, url), preserve exactly as is
                    
                    task[columnId] = processedValue;
                }
            });

            // Ensure Sr is properly set
            if (!task.sr || task.sr === 0) {
                task.sr = i;
            }

            newTasks.push(task);
        }

        if (newTasks.length === 0) {
            showToast('No valid tasks found', 'error');
            return;
        }        const hiddenDefaultColumns = defaultColumns.filter(col => 
            col.id !== 'actions' && !col.visible
        ).length;
        
        const confirmMessage = `Replace all with ${newTasks.length} tasks?\n` +
                             `Matched ${matchedColumns} existing columns.\n` +
                             `Created ${newColumnsToCreate.length} new columns.\n` +
                             `Removed ${unmatchedCustomColumns.length} unmatched custom columns.\n` +
                             `Hidden ${hiddenDefaultColumns} unmatched default columns.`;
        
        if (confirm(confirmMessage)) {
            tasks = newTasks;
            saveData();
            renderTasks();
            updateStats();
            // Clear the import textbox after successful import
            document.getElementById('importData').value = '';
            closeImportModal();
            
            const summaryParts = [];
            summaryParts.push(`${newTasks.length} tasks`);
            if (newColumnsToCreate.length > 0) summaryParts.push(`${newColumnsToCreate.length} new columns`);
            if (unmatchedCustomColumns.length > 0) summaryParts.push(`${unmatchedCustomColumns.length} columns removed`);
            if (hiddenDefaultColumns > 0) summaryParts.push(`${hiddenDefaultColumns} columns hidden`);
            
            showToast(`Imported ${summaryParts.join(', ')}`);
        }
    } catch (error) {
        console.error('Import error:', error);
        showToast('Import failed: ' + error.message, 'error');
    }
}

// Helper function to detect column type based on sample values
function detectColumnType(sampleValues) {
    if (sampleValues.length === 0) return 'text';
    
    // Check if all values are numbers
    const numberCount = sampleValues.filter(val => !isNaN(parseFloat(val)) && isFinite(val)).length;
    if (numberCount === sampleValues.length) {
        return 'number';
    }
    
    // Check if values look like dates (DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY, etc.)
    const datePatterns = [
        /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/,  // DD-MM-YYYY or DD/MM/YYYY
        /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/,  // YYYY-MM-DD or YYYY/MM/DD
        /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2}$/   // DD-MM-YY or DD/MM/YY
    ];
    
    const dateCount = sampleValues.filter(val => 
        datePatterns.some(pattern => pattern.test(val))
    ).length;
    
    if (dateCount >= sampleValues.length * 0.8) { // 80% look like dates
        return 'date';
    }
    
    // Check if values look like emails
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailCount = sampleValues.filter(val => emailPattern.test(val)).length;
    if (emailCount >= sampleValues.length * 0.8) {
        return 'email';
    }
    
    // Check if values look like URLs
    const urlPattern = /^https?:\/\/[^\s]+$/;
    const urlCount = sampleValues.filter(val => urlPattern.test(val)).length;
    if (urlCount >= sampleValues.length * 0.8) {
        return 'url';
    }
    
    // Check if any value contains line breaks (for textarea)
    const multilineCount = sampleValues.filter(val => val.includes('\n') || val.length > 100).length;
    if (multilineCount > 0) {
        return 'textarea';
    }
    
    // Default to text
    return 'text';
}

function copyToExcel() {
    const visibleColumns = getAllColumns().filter(col => col.visible && col.id !== 'actions');
    const headers = visibleColumns.map(col => col.name);
    let output = headers.join('\t') + '\n';

    tasks.forEach(task => {
        const row = visibleColumns.map(col => {
            let value = task[col.id] || '';
            // Handle different data types for export
            if (col.type === 'number') {
                return value || 0;
            }
            return value.toString().replace(/\t/g, ' ').replace(/\n/g, ' ');
        });
        output += row.join('\t') + '\n';
    });

    navigator.clipboard.writeText(output).then(() => {
        showToast('Copied to clipboard');
    }).catch(() => {
        showToast('Copy failed', 'error');
    });
}

function exportToExcel() {
    const visibleColumns = getAllColumns().filter(col => col.visible && col.id !== 'actions');
    const headers = visibleColumns.map(col => col.name);

    // Create CSV content (Excel-compatible)
    let csvContent = headers.join(',') + '\n';

    tasks.forEach(task => {
        const row = visibleColumns.map(col => {
            let value = task[col.id] || '';
            // Handle different data types for export
            if (col.type === 'number') {
                return value || 0;
            }
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            value = value.toString().replace(/"/g, '""');
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value}"`;
            }
            return value;
        });
        csvContent += row.join(',') + '\n';
    });    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const listName = allListsData[currentListId]?.name || 'tasks';
        const safeListName = listName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        link.setAttribute('download', `${safeListName}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Excel file downloaded successfully');
    } else {
        showToast('Export not supported in this browser', 'error');
    }
}

function resetData() {
    if (confirm('Reset current list to original data? This will also remove all custom columns and reset column names.')) {
        // Reset current list's tasks to initial data
        tasks = [...initialTasks];
        if (allListsData[currentListId]) {
            allListsData[currentListId].tasks = [...initialTasks];
        }

        // Reset custom columns
        customColumns = [];

        // Reset column order
        columnOrder = [];

        // Reset column management flags
        editingColumnIndex = -1;
        isAddingColumn = false;

        // Reset default column names to original values
        defaultColumns[0].name = 'Sr.';
        defaultColumns[1].name = 'Task';
        defaultColumns[2].name = 'P';
        defaultColumns[3].name = 'Resource';
        defaultColumns[4].name = 'Status';
        defaultColumns[5].name = 'Due';
        defaultColumns[6].name = 'Remarks';
        defaultColumns[7].name = 'Del';

        // Clear all localStorage items related to columns
        localStorage.removeItem('taskManagerCustomColumns');
        localStorage.removeItem('taskManagerDefaultColumns');
        localStorage.removeItem('taskManagerColumnOrder');

        // Clear column widths from localStorage
        localStorage.removeItem('taskTableColumnWidths');

        // Clean up any residual states
        cleanupColumnState();

        // Save all data
        saveData();
        saveCustomColumns();
        
        // Regenerate table headers to remove custom columns
        generateTableHeaders();
        generateCustomColumnCSS();

        // Clear any inline width styles from table headers
        setTimeout(() => {
            const headers = document.querySelectorAll('.task-table th');
            headers.forEach(header => {
                header.style.width = '';
                header.style.minWidth = '';
                header.style.maxWidth = '';
            });
        }, 100);

        // Re-render everything
        renderTasks();
        updateStats();

        showToast('Data and columns reset');
    }
}

// Selective reset modal functions
function openResetModal() {
    loadResetPreferences();
    document.getElementById('resetModal').classList.add('show');
}

function closeResetModal() {
    saveResetPreferences();
    document.getElementById('resetModal').classList.remove('show');
}

function saveResetPreferences() {
    const preferences = {
        resetTasks: document.getElementById('resetTasks').checked,
        resetCustomColumns: document.getElementById('resetCustomColumns').checked,
        resetColumnNames: document.getElementById('resetColumnNames').checked,
        resetColumnOrder: document.getElementById('resetColumnOrder').checked,
        resetColumnWidths: document.getElementById('resetColumnWidths').checked,
        resetFilters: document.getElementById('resetFilters').checked
    };
    localStorage.setItem('taskManagerResetPreferences', JSON.stringify(preferences));
}

function loadResetPreferences() {
    const saved = localStorage.getItem('taskManagerResetPreferences');
    if (saved) {
        try {
            const preferences = JSON.parse(saved);
            
            // Apply saved preferences to checkboxes
            document.getElementById('resetTasks').checked = preferences.resetTasks !== undefined ? preferences.resetTasks : true;
            document.getElementById('resetCustomColumns').checked = preferences.resetCustomColumns !== undefined ? preferences.resetCustomColumns : true;
            document.getElementById('resetColumnNames').checked = preferences.resetColumnNames !== undefined ? preferences.resetColumnNames : true;
            document.getElementById('resetColumnOrder').checked = preferences.resetColumnOrder !== undefined ? preferences.resetColumnOrder : true;
            document.getElementById('resetColumnWidths').checked = preferences.resetColumnWidths !== undefined ? preferences.resetColumnWidths : true;
            document.getElementById('resetFilters').checked = preferences.resetFilters !== undefined ? preferences.resetFilters : false;
        } catch (e) {
            console.warn('Failed to load reset preferences:', e);
            // Set default values if loading fails
            setDefaultResetPreferences();
        }
    } else {
        // Set default values for first time
        setDefaultResetPreferences();
    }
}

function setDefaultResetPreferences() {
    document.getElementById('resetTasks').checked = true;
    document.getElementById('resetCustomColumns').checked = true;
    document.getElementById('resetColumnNames').checked = true;
    document.getElementById('resetColumnOrder').checked = true;
    document.getElementById('resetColumnWidths').checked = true;
    document.getElementById('resetFilters').checked = false;
}

function performSelectiveReset() {
    // Get checkbox states
    const resetTasks = document.getElementById('resetTasks').checked;
    const resetCustomColumns = document.getElementById('resetCustomColumns').checked;
    const resetColumnNames = document.getElementById('resetColumnNames').checked;
    const resetColumnOrder = document.getElementById('resetColumnOrder').checked;
    const resetColumnWidths = document.getElementById('resetColumnWidths').checked;
    const resetFilters = document.getElementById('resetFilters').checked;
    const resetFilterPresets = document.getElementById('resetFilterPresets').checked;

    // Build confirmation message
    let resetItems = [];
    if (resetTasks) resetItems.push('Task data');
    if (resetCustomColumns) resetItems.push('Custom columns');
    if (resetColumnNames) resetItems.push('Column names');
    if (resetColumnOrder) resetItems.push('Column order');
    if (resetColumnWidths) resetItems.push('Column widths');
    if (resetFilters) resetItems.push('Search & filters');
    if (resetFilterPresets) resetItems.push('Saved filter presets');

    if (resetItems.length === 0) {
        showToast('No reset options selected', 'error');
        return;
    }

    const confirmMessage = `Reset the following items?\n\n${resetItems.join('\n')}\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }

    // Perform selective resets
    let resetActions = [];

    if (resetTasks) {
        tasks = [...initialTasks];
        resetActions.push('Task data reset');
    }

    if (resetCustomColumns) {
        customColumns = [];
        localStorage.removeItem('taskManagerCustomColumns');
        resetActions.push('Custom columns removed');
    }

    if (resetColumnNames) {
        // Reset default column names to original values
        defaultColumns[0].name = 'Sr.';
        defaultColumns[1].name = 'Task';
        defaultColumns[2].name = 'P';
        defaultColumns[3].name = 'Resource';
        defaultColumns[4].name = 'Status';
        defaultColumns[5].name = 'Due';
        defaultColumns[6].name = 'Remarks';
        defaultColumns[7].name = 'Del';
        localStorage.removeItem('taskManagerDefaultColumns');
        resetActions.push('Column names reset');
    }

    if (resetColumnOrder) {
        columnOrder = [];
        localStorage.removeItem('taskManagerColumnOrder');
        resetActions.push('Column order reset');
    }

    if (resetColumnWidths) {
        localStorage.removeItem('taskTableColumnWidths');
        
        // Clear inline width styles from table headers
        setTimeout(() => {
            const headers = document.querySelectorAll('.task-table th');
            headers.forEach(header => {
                header.style.width = '';
                header.style.minWidth = '';
                header.style.maxWidth = '';
            });
        }, 100);
        resetActions.push('Column widths reset');
    }    if (resetFilters) {
        localStorage.removeItem('taskFilterSettings');
        
        // Clear filter UI
        document.getElementById('searchInput').value = '';
        document.getElementById('statusAll').checked = true;
        document.getElementById('statusCompleted').checked = false;
        document.getElementById('statusAssigned').checked = false;
        document.getElementById('statusPending').checked = false;
        document.getElementById('statusBlocked').checked = false;
        document.getElementById('priorityFilter').value = '';
        
        // Reset filter state
        selectedStatuses = [];
        updateStatusFilterText();
        resetActions.push('Filters cleared');
    }

    if (resetFilterPresets) {
        // Clear all filter presets
        filterPresets = [];
        localStorage.removeItem('taskManagerFilterPresets');
        
        // Update presets UI
        populatePresetsSelect();
        
        resetActions.push('Filter presets deleted');
    }

    // Clean up any residual states if columns were reset
    if (resetCustomColumns || resetColumnOrder) {
        editingColumnIndex = -1;
        isAddingColumn = false;
        cleanupColumnState();
    }

    // Save data and regenerate UI
    saveData();
    if (resetCustomColumns) {
        saveCustomColumns();
    }
    
    // Regenerate table if column-related resets were performed
    if (resetCustomColumns || resetColumnNames || resetColumnOrder) {
        generateTableHeaders();
        generateCustomColumnCSS();
    }

    // Re-render everything
    renderTasks();
    updateStats();
    
    // Apply filters if they weren't reset
    if (!resetFilters) {
        filterTasks();
    }

    // Close modal and show success message
    closeResetModal();
    showToast(`Reset completed: ${resetActions.join(', ')}`);
}

// Toast functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Form submission
document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const taskData = {
        task: document.getElementById('taskName').value.trim(),
        priority: parseInt(document.getElementById('taskPriority').value),
        resource: document.getElementById('taskResource').value.trim(),
        status: document.getElementById('taskStatus').value,
        dueDate: document.getElementById('taskDueDate').value ?
            document.getElementById('taskDueDate').value.split('-').reverse().join('-') : '',
        remarks: document.getElementById('taskRemarks').value.trim()
    };

    // Collect custom field data
    customColumns.forEach(column => {
        const element = document.getElementById(`custom_${column.id}`);
        if (element) {
            let value = element.value.trim();

            // Handle different field types
            if (column.type === 'number' && value) {
                value = parseFloat(value);
            } else if (column.type === 'date' && value) {
                // Convert from YYYY-MM-DD to DD-MM-YYYY
                value = value.split('-').reverse().join('-');
            }

            taskData[column.id] = value;
        }
    });

    if (editingIndex >= 0) {
        Object.assign(tasks[editingIndex], taskData);
        showToast('Updated');
    } else {
        const newSr = tasks.length > 0 ? Math.max(...tasks.map(t => t.sr)) + 1 : 1;
        tasks.push({ sr: newSr, ...taskData });
        showToast('Added');
    }

    saveData();
    renderTasks();
    updateStats();
    closeModal();
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key === 'n') {
        e.preventDefault();
        openAddModal();
    } else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        openImportModal();
    } else if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        openColumnsModal();
    } else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        openResetModal();
    } else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();    } else if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleAdvancedFilters();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleListsPanel();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyToExcel();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportToExcel();    } else if (e.key === 'Escape') {
        closeModal();
        closeImportModal();
        closeShortcutsModal();
        closeColumnsModal();
        closeResetModal();        // Close advanced filters panel if open
        if (isAdvancedFiltersPanelOpen) {
            toggleAdvancedFilters();
        }
        // Close lists panel if open
        const listsPanel = document.getElementById('listsManagementPanel');
        if (listsPanel && listsPanel.classList.contains('open')) {
            toggleListsPanel();
        }
    } else if (e.key === 'F1') {
        e.preventDefault();
        openShortcutsModal();
    }
});

// Modal click outside to close
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });
});

// Close status dropdown when clicking outside
document.addEventListener('click', function (e) {
    const dropdown = document.querySelector('.status-filter-dropdown');
    const menu = document.getElementById('statusDropdownMenu');
    const container = document.querySelector('.status-filter-container');

    if (!container.contains(e.target)) {
        dropdown.classList.remove('open');
        menu.classList.remove('show');
    }
});

let altKeyTimer;
document.addEventListener('keydown', function (e) {
    if (e.key === 'Control') {
        altKeyTimer = setTimeout(() => {
            document.getElementById('shortcutsHint').classList.add('show');
        }, 800);
    }
});

document.addEventListener('keyup', function (e) {
    if (e.key === 'Control') {
        clearTimeout(altKeyTimer);
        setTimeout(() => {
            document.getElementById('shortcutsHint').classList.remove('show');
        }, 1500);
    }
});

// Column Drag and Drop Functions
function attachColumnDragListeners() {
    const headers = document.querySelectorAll('.task-table th[draggable="true"]');

    headers.forEach(header => {
        header.addEventListener('dragstart', handleColumnDragStart);
        header.addEventListener('dragover', handleColumnDragOver);
        header.addEventListener('dragenter', handleColumnDragEnter);
        header.addEventListener('dragleave', handleColumnDragLeave);
        header.addEventListener('drop', handleColumnDrop);
        header.addEventListener('dragend', handleColumnDragEnd);
    });
}

let draggedColumn = null;

function handleColumnDragStart(e) {
    draggedColumn = this;
    this.classList.add('dragging');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);

    // Prevent sorting when dragging starts
    e.stopPropagation();
}

function handleColumnDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleColumnDragEnter(e) {
    if (this !== draggedColumn) {
        this.classList.add('drag-over');
    }
}

function handleColumnDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleColumnDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedColumn !== this) {
        const draggedId = draggedColumn.dataset.columnId;
        const targetId = this.dataset.columnId;

        reorderColumns(draggedId, targetId);
    }

    return false;
}

function handleColumnDragEnd(e) {
    // Clean up drag states
    const headers = document.querySelectorAll('.task-table th');
    headers.forEach(header => {
        header.classList.remove('dragging', 'drag-over');
    });

    draggedColumn = null;
}

function reorderColumns(draggedId, targetId) {
    const draggedIndex = columnOrder.indexOf(draggedId);
    const targetIndex = columnOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged column from its current position
    const [draggedColumn] = columnOrder.splice(draggedIndex, 1);

    // Insert it at the target position
    columnOrder.splice(targetIndex, 0, draggedColumn);

    // Save the new column order
    saveColumnOrder();    // Regenerate table headers and content
    generateTableHeaders();
    generateCustomColumnCSS();
    renderTasks();

    showToast('Column order updated');
}

function saveColumnOrder() {
    localStorage.setItem('taskManagerColumnOrder', JSON.stringify(columnOrder));
}

function loadColumnOrder() {
    const saved = localStorage.getItem('taskManagerColumnOrder');
    if (saved) {
        columnOrder = JSON.parse(saved);
    } else {
        // Initialize with default order
        const allColumns = getAllColumns();
        columnOrder = allColumns.map(col => col.id);
    }
}

// Column Management Modal Drag and Drop Functions
let draggedColumnItem = null;

function attachColumnManagementDragListeners() {
    const columnItems = document.querySelectorAll('.draggable-column');
    
    columnItems.forEach(item => {
        item.addEventListener('dragstart', handleColumnItemDragStart);
        item.addEventListener('dragover', handleColumnItemDragOver);
        item.addEventListener('dragenter', handleColumnItemDragEnter);
        item.addEventListener('dragleave', handleColumnItemDragLeave);
        item.addEventListener('drop', handleColumnItemDrop);
        item.addEventListener('dragend', handleColumnItemDragEnd);
    });
}

function handleColumnItemDragStart(e) {
    draggedColumnItem = this;
    this.classList.add('dragging');
    
    // Add visual feedback to column list
    const columnList = document.getElementById('columnList');
    if (columnList) {
        columnList.classList.add('has-dragging');
    }
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleColumnItemDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleColumnItemDragEnter(e) {
    if (this !== draggedColumnItem) {
        this.classList.add('drag-over');
    }
}

function handleColumnItemDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleColumnItemDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedColumnItem !== this) {
        const draggedId = draggedColumnItem.dataset.columnId;
        const targetId = this.dataset.columnId;
        
        reorderColumnsInManagement(draggedId, targetId);
    }

    return false;
}

function handleColumnItemDragEnd(e) {
    // Clean up drag states
    const columnItems = document.querySelectorAll('.draggable-column');
    columnItems.forEach(item => {
        item.classList.remove('dragging', 'drag-over');
    });

    // Remove visual feedback from column list
    const columnList = document.getElementById('columnList');
    if (columnList) {
        columnList.classList.remove('has-dragging');
    }

    draggedColumnItem = null;
}

function reorderColumnsInManagement(draggedId, targetId) {
    const draggedIndex = columnOrder.indexOf(draggedId);
    const targetIndex = columnOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged column from its current position
    const [draggedColumn] = columnOrder.splice(draggedIndex, 1);

    // Insert it at the target position
    columnOrder.splice(targetIndex, 0, draggedColumn);

    // Save the new column order
    saveColumnOrder();

    // Re-render the column list to show new order
    renderColumnList();

    // Regenerate table headers and content to reflect changes
    generateTableHeaders();
    generateCustomColumnCSS();
    renderTasks();

    showToast('Column order updated');
}

// Column Resize Functionality
let isResizing = false;
let currentResizeColumn = null;
let startX = 0;
let startWidth = 0;
let resizeLine = null;

function initializeColumnResize() {
    const table = document.querySelector('.task-table');
    if (!table) return; // Exit if table doesn't exist
    
    const headers = table.querySelectorAll('th');
    if (!headers.length) return; // Exit if no headers
    
    resizeLine = document.getElementById('resizeLine');
    if (!resizeLine) return; // Exit if resize line doesn't exist

    headers.forEach((header, index) => {
        // Skip the last column (actions) as it doesn't need resize
        if (index < headers.length - 1) {
            // Only add resize handle if it doesn't already exist
            let existingHandle = header.querySelector('.resize-handle');
            if (!existingHandle) {
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                header.appendChild(resizeHandle);

                resizeHandle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startResize(e, header, resizeHandle);
                });
            }
        }
    });

    // Global mouse events - remove existing listeners first to prevent duplicates
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

function startResize(e, column, handle) {
    isResizing = true;
    currentResizeColumn = column;
    startX = e.clientX;
    startWidth = column.offsetWidth;

    // Add visual feedback
    handle.classList.add('resizing');
    document.querySelector('.task-table').classList.add('resizing');
    
    // Show resize line
    resizeLine.style.display = 'block';
    resizeLine.style.left = e.clientX + 'px';

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
}

function handleResize(e) {
    if (!isResizing || !currentResizeColumn) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + deltaX); // Minimum width of 50px

    // Update resize line position
    resizeLine.style.left = e.clientX + 'px';

    // Apply the new width
    currentResizeColumn.style.width = newWidth + 'px';
    currentResizeColumn.style.minWidth = newWidth + 'px';
    currentResizeColumn.style.maxWidth = newWidth + 'px';
}

function stopResize() {
    if (!isResizing) return;

    isResizing = false;
    
    // Remove visual feedback
    const resizeHandle = currentResizeColumn?.querySelector('.resize-handle');
    if (resizeHandle) {
        resizeHandle.classList.remove('resizing');
    }
    
    document.querySelector('.task-table').classList.remove('resizing');
    resizeLine.style.display = 'none';

    // Restore normal cursor and text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Save column widths to localStorage
    saveColumnWidths();

    currentResizeColumn = null;
}

function saveColumnWidths() {
    const headers = document.querySelectorAll('.task-table th');
    const widths = {};
    
    headers.forEach((header, index) => {
        const columnClass = header.className.split(' ').find(cls => cls.endsWith('-column'));
        if (columnClass && header.style.width) {
            widths[columnClass] = header.style.width;
        }
    });
    
    localStorage.setItem('taskTableColumnWidths', JSON.stringify(widths));
}

function loadColumnWidths() {
    const savedWidths = localStorage.getItem('taskTableColumnWidths');
    if (!savedWidths) return;

    try {
        const widths = JSON.parse(savedWidths);
        const headers = document.querySelectorAll('.task-table th');
        
        headers.forEach(header => {
            const columnClass = header.className.split(' ').find(cls => cls.endsWith('-column'));
            if (columnClass && widths[columnClass]) {
                const width = widths[columnClass];
                header.style.width = width;
                header.style.minWidth = width;
                header.style.maxWidth = width;
            }
        });
    } catch (e) {
        console.warn('Failed to load column widths:', e);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Clean up any residual states
    cleanupColumnState();
    
    // Load data first
    loadData();
    
    // Initialize header edit and sort listeners for static headers
    addHeaderEditListeners();
    
    // Initialize resize functionality after a short delay to ensure table is rendered
    setTimeout(() => {
        initializeColumnResize();
        loadColumnWidths();
        initializeResetPreferences(); // Initialize reset preferences
    }, 100);
});

// Cleanup function to ensure clean state
function cleanupColumnState() {
    // Reset column management flags
    isAddingColumn = false;
    editingColumnIndex = -1;
    
    // Clear any existing timeout for the isAddingColumn flag
    if (window.columnAddingTimeout) {
        clearTimeout(window.columnAddingTimeout);
        window.columnAddingTimeout = null;
    }
}

// Initialize reset preferences functionality
function initializeResetPreferences() {
    // Add event listeners to save preferences when checkboxes change
    const resetCheckboxes = [
        'resetTasks',
        'resetCustomColumns', 
        'resetColumnNames',
        'resetColumnOrder',
        'resetColumnWidths',
        'resetFilters'
    ];
      resetCheckboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.addEventListener('change', saveResetPreferences);
        }
    });
}

// Filter Presets System
let filterPresets = [];

// Save current filters as a preset
function saveFilterPreset() {
    const presetNameInput = document.getElementById('presetNameInput');
    const presetName = presetNameInput.value.trim();
    
    if (!presetName) {
        showToast('Please enter a preset name', 'error');
        return;
    }
    
    if (advancedFilters.length === 0) {
        showToast('No filters to save. Add some filters first.', 'error');
        return;
    }
    
    // Check if preset name already exists
    const existingPreset = filterPresets.find(preset => preset.name === presetName);
    if (existingPreset) {
        if (!confirm(`A preset named "${presetName}" already exists. Do you want to overwrite it?`)) {
            return;
        }
        // Remove existing preset
        filterPresets = filterPresets.filter(preset => preset.name !== presetName);
    }
    
    // Get current filter logic
    const filterLogic = document.querySelector('input[name="filterLogic"]:checked')?.value || 'AND';
    
    // Create preset object
    const preset = {
        id: Date.now().toString(),
        name: presetName,
        filters: [...advancedFilters], // Deep copy
        logic: filterLogic,
        createdAt: new Date().toISOString()
    };
    
    // Add to presets array
    filterPresets.push(preset);
    
    // Save to localStorage
    saveFilterPresets();
    
    // Update UI
    populatePresetsSelect();
    presetNameInput.value = '';
    
    showToast(`Filter preset "${presetName}" saved successfully`, 'success');
}

// Load selected filter preset
function loadFilterPreset() {
    const presetsSelect = document.getElementById('filterPresetsSelect');
    const selectedPresetId = presetsSelect.value;
    
    if (!selectedPresetId) {
        showToast('Please select a preset to load', 'error');
        return;
    }
    
    loadSelectedPreset();
}

// Load the selected preset from dropdown
function loadSelectedPreset() {
    const presetsSelect = document.getElementById('filterPresetsSelect');
    const selectedPresetId = presetsSelect.value;
    
    if (!selectedPresetId) {
        return;
    }
    
    const preset = filterPresets.find(p => p.id === selectedPresetId);
    if (!preset) {
        showToast('Preset not found', 'error');
        return;
    }
    
    // Clear current filters
    advancedFilters = [];
    activeQuickFilter = null;
    
    // Load preset filters
    advancedFilters = [...preset.filters]; // Deep copy
    
    // Set filter logic
    const logicRadio = document.querySelector(`input[name="filterLogic"][value="${preset.logic}"]`);
    if (logicRadio) {
        logicRadio.checked = true;
    }
      // Apply filters and update UI
    applyAdvancedFilters();
    renderActiveFilters();
    renderQuickFilters(); // Add quick filters rendering
    saveAdvancedFilters();
    updateFilterIndicator();
    updateCurrentFiltersInfo(); // Update current filters info
    
    showToast(`Filter preset "${preset.name}" loaded successfully`, 'success');
}

// Delete selected filter preset
function deleteFilterPreset() {
    const presetsSelect = document.getElementById('filterPresetsSelect');
    const selectedPresetId = presetsSelect.value;
    
    if (!selectedPresetId) {
        showToast('Please select a preset to delete', 'error');
        return;
    }
    
    const preset = filterPresets.find(p => p.id === selectedPresetId);
    if (!preset) {
        showToast('Preset not found', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete the preset "${preset.name}"?`)) {
        return;
    }
    
    // Remove preset
    filterPresets = filterPresets.filter(p => p.id !== selectedPresetId);
    
    // Save to localStorage
    saveFilterPresets();
    
    // Update UI
    populatePresetsSelect();
    
    showToast(`Filter preset "${preset.name}" deleted successfully`, 'info');
}

// Populate presets dropdown
function populatePresetsSelect() {
    const presetsSelect = document.getElementById('filterPresetsSelect');
    const presetCountElement = document.getElementById('presetCount');
    
    // Clear existing options except the first one
    presetsSelect.innerHTML = '<option value="">Choose a preset to load...</option>';
    
    // Update preset count
    presetCountElement.textContent = `${filterPresets.length} preset${filterPresets.length !== 1 ? 's' : ''}`;
    
    // Add preset options
    filterPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = `${preset.name} (${preset.filters.length} filter${preset.filters.length !== 1 ? 's' : ''})`;
        presetsSelect.appendChild(option);
    });
    
    // Update current filters info
    updateCurrentFiltersInfo();
}

// Update current filters info display
function updateCurrentFiltersInfo() {
    const currentFiltersInfo = document.getElementById('currentFiltersInfo');
    if (advancedFilters.length === 0) {
        currentFiltersInfo.textContent = 'No filters to save';
        currentFiltersInfo.style.color = 'var(--gray-500)';
    } else {
        const filterLogic = document.querySelector('input[name="filterLogic"]:checked')?.value || 'AND';
        currentFiltersInfo.textContent = `${advancedFilters.length} filter${advancedFilters.length !== 1 ? 's' : ''} with ${filterLogic} logic`;
        currentFiltersInfo.style.color = 'var(--blue-600)';
    }
}

// Save filter presets to localStorage
function saveFilterPresets() {
    localStorage.setItem('taskManagerFilterPresets', JSON.stringify(filterPresets));
}

// Load filter presets from localStorage
function loadFilterPresets() {
    const savedPresets = localStorage.getItem('taskManagerFilterPresets');
    if (savedPresets) {
        try {
            filterPresets = JSON.parse(savedPresets);
            populatePresetsSelect();
        } catch (error) {
            console.error('Error loading filter presets:', error);
            filterPresets = [];
        }
    }
}

// Advanced Filters System
let advancedFilters = [];
let isAdvancedFiltersPanelOpen = false;

// Filter operators for different column types
const filterOperators = {
    text: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
    ],
    textarea: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
    ],
    number: [
        { value: 'equals', label: 'Equals' },
        { value: 'greaterThan', label: 'Greater than' },
        { value: 'lessThan', label: 'Less than' },
        { value: 'between', label: 'Between' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
    ],
    date: [
        { value: 'equals', label: 'On date' },
        { value: 'before', label: 'Before' },
        { value: 'after', label: 'After' },
        { value: 'between', label: 'Between dates' },
        { value: 'thisWeek', label: 'This week' },
        { value: 'thisMonth', label: 'This month' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
    ],
    select: [
        { value: 'equals', label: 'Equals' },
        { value: 'inList', label: 'In list' },
        { value: 'notInList', label: 'Not in list' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
    ],
    email: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'isValid', label: 'Is valid email' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
    ],
    url: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'isValid', label: 'Is valid URL' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
    ]
};

// Toggle advanced filters panel
function toggleAdvancedFilters() {
    const panel = document.getElementById('advancedFiltersPanel');
    const overlay = document.getElementById('filtersOverlay');
    
    isAdvancedFiltersPanelOpen = !isAdvancedFiltersPanelOpen;
    
    if (isAdvancedFiltersPanelOpen) {
        panel.classList.add('open');
        overlay.classList.add('active');
        populateFilterColumns();
        populatePresetsSelect(); // Populate presets dropdown
        renderActiveFilters();
        renderQuickFilters(); // Add quick filters rendering
        updateCurrentFiltersInfo(); // Update current filters info
    } else {
        panel.classList.remove('open');
        overlay.classList.remove('active');
    }
}

// Quick Filters functionality
let activeQuickFilter = null;

function renderQuickFilters() {
    const container = document.getElementById('quickFiltersList');
    const availableColumns = getAvailableColumns();
    const quickFilters = getAvailableQuickFilters(availableColumns);
    
    if (quickFilters.length === 0) {
        container.innerHTML = `
            <div class="quick-filters-empty">
                No quick filters available based on current columns
            </div>
        `;
        return;
    }
    
    container.innerHTML = quickFilters.map(filter => {
        const count = getFilterCount(filter);
        const isActive = activeQuickFilter === filter.id;
        
        return `
            <div class="quick-filter-item ${isActive ? 'active' : ''}" 
                 onclick="applyQuickFilter('${filter.id}')" 
                 data-filter-id="${filter.id}">
                <span class="filter-name">${filter.name}</span>
                <span class="filter-count">${count}</span>
            </div>
        `;
    }).join('');
}

function getAvailableColumns() {
    return getAllColumns().filter(col => col.visible && col.id !== 'actions');
}

function getAvailableQuickFilters(availableColumns) {
    const filters = [];
    const columnIds = availableColumns.map(col => col.id);
    
    // Due Date related filters
    if (columnIds.includes('dueDate')) {
        filters.push(
            { id: 'overdue', name: 'Overdue Tasks', column: 'dueDate', type: 'overdue' },
            { id: 'thisWeek', name: 'Due This Week', column: 'dueDate', type: 'thisWeek' },
            { id: 'noDeadline', name: 'No Deadline', column: 'dueDate', type: 'isEmpty' }
        );
    }
    
    // Priority related filters
    if (columnIds.includes('priority')) {
        filters.push(
            { id: 'highPriority', name: 'High Priority (0-3)', column: 'priority', type: 'between', value1: 0, value2: 3 }
        );
    }
    
    // Resource related filters
    if (columnIds.includes('resource')) {
        filters.push(
            { id: 'unassigned', name: 'Unassigned', column: 'resource', type: 'isEmpty' }
        );
    }
    
    return filters;
}

function getFilterCount(filter) {
    return tasks.filter(task => matchesQuickFilter(task, filter)).length;
}

function matchesQuickFilter(task, filter) {
    const value = task[filter.column];
    
    switch (filter.type) {
        case 'overdue':
            if (!value || value === '') return false;
            const dueDate = parseDate(value);
            return dueDate < new Date() && task.status !== 'Completed';
              case 'thisWeek':
            if (!value || value === '') return false;
            const weekDate = parseDate(value);
            const today = new Date();
            const currentDay = today.getDay();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - currentDay);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            return weekDate >= weekStart && weekDate <= weekEnd;
            
        case 'isEmpty':
            return !value || value.toString().trim() === '';
            
        case 'between':
            if (!value && value !== 0) return false;
            const numValue = parseFloat(value);
            return numValue >= filter.value1 && numValue <= filter.value2;
            
        default:
            return false;
    }
}

function applyQuickFilter(filterId) {
    const availableColumns = getAvailableColumns();
    const quickFilters = getAvailableQuickFilters(availableColumns);
    const filter = quickFilters.find(f => f.id === filterId);
    
    if (!filter) return;
    
    if (activeQuickFilter === filterId) {
        // Toggle off - remove the filter
        activeQuickFilter = null;
    } else {
        // Apply the quick filter
        activeQuickFilter = filterId;
    }
    
    // Use the unified filtering system
    applyAdvancedFilters();
    renderQuickFilters(); // Re-render to update active state
    updateFilterIndicator(); // Update filter indicator
}

// Populate column options for filter dropdown
function populateFilterColumns() {
    const selectElement = document.getElementById('filterColumn');
    selectElement.innerHTML = '<option value="">Select column...</option>';
    
    // Get all columns (default + custom)
    const allColumns = getAllColumns().filter(col => 
        col.visible && col.id !== 'actions'
    );
      allColumns.forEach(column => {
        const option = document.createElement('option');
        option.value = column.id;
        option.textContent = column.name;
        option.dataset.type = column.type;
        selectElement.appendChild(option);
    });
}

// Update operator options based on selected column
function updateFilterOperators() {
    const columnSelect = document.getElementById('filterColumn');
    const operatorSelect = document.getElementById('filterOperator');
    const selectedOption = columnSelect.options[columnSelect.selectedIndex];
    
    operatorSelect.innerHTML = '<option value="">Select operator...</option>';
    
    if (selectedOption && selectedOption.dataset.type) {
        const columnType = selectedOption.dataset.type;
        const operators = filterOperators[columnType] || filterOperators.text;
        
        operators.forEach(operator => {
            const option = document.createElement('option');
            option.value = operator.value;
            option.textContent = operator.label;
            operatorSelect.appendChild(option);
        });
    }
    
    // Reset value inputs
    updateFilterValueInput();
}

// Update value input based on selected operator and column type
function updateFilterValueInput() {
    const columnSelect = document.getElementById('filterColumn');
    const operatorSelect = document.getElementById('filterOperator');
    const valueInput = document.getElementById('filterValue');
    const value2Input = document.getElementById('filterValue2');
    const valuesRow = document.getElementById('filterValuesRow');
    
    const selectedColumn = columnSelect.options[columnSelect.selectedIndex];
    const selectedOperator = operatorSelect.value;
    
    // Hide both value inputs initially
    valueInput.style.display = 'none';
    value2Input.style.display = 'none';
    
    // Reset inputs
    valueInput.value = '';
    value2Input.value = '';
    valueInput.type = 'text';
    value2Input.type = 'text';
    valueInput.placeholder = 'Value...';
    value2Input.placeholder = 'To value...';
    
    if (!selectedOperator) return;
    
    // Show appropriate inputs based on operator
    if (['isEmpty', 'isNotEmpty', 'thisWeek', 'thisMonth', 'overdue', 'isValid'].includes(selectedOperator)) {
        // No value input needed
        return;
    }
    
    // Show primary value input
    valueInput.style.display = 'block';
    
    // Set input type based on column type
    if (selectedColumn && selectedColumn.dataset.type) {
        const columnType = selectedColumn.dataset.type;
        
        if (columnType === 'date') {
            valueInput.type = 'date';
            value2Input.type = 'date';
        } else if (columnType === 'number') {
            valueInput.type = 'number';
            value2Input.type = 'number';
        } else if (columnType === 'email') {
            valueInput.type = 'email';
        } else if (columnType === 'url') {
            valueInput.type = 'url';
        }
        
        // Special handling for select columns
        if (columnType === 'select' && ['inList', 'notInList'].includes(selectedOperator)) {
            valueInput.placeholder = 'Comma-separated...';
        } else if (columnType === 'textarea') {
            // Keep as text input for textarea columns
            valueInput.placeholder = 'Text...';
        }    }
    
    // Show second value input for "between" operators
    if (selectedOperator === 'between') {
        value2Input.style.display = 'block';
    }
}

// Add new advanced filter
function addAdvancedFilter() {
    const columnSelect = document.getElementById('filterColumn');
    const operatorSelect = document.getElementById('filterOperator');
    const valueInput = document.getElementById('filterValue');
    const value2Input = document.getElementById('filterValue2');
    
    const columnId = columnSelect.value;
    const operator = operatorSelect.value;
    const value = valueInput.value;
    const value2 = value2Input.value;
    
    if (!columnId || !operator) {
        showToast('Please select both column and operator', 'error');
        return;
    }
    
    // Validate value input for operators that require values
    const operatorsWithoutValue = ['isEmpty', 'isNotEmpty', 'thisWeek', 'thisMonth', 'overdue', 'isValid'];
    if (!operatorsWithoutValue.includes(operator) && !value.trim()) {
        showToast('Please enter a value', 'error');
        return;
    }
    
    // Validate second value for "between" operator
    if (operator === 'between' && !value2.trim()) {
        showToast('Please enter both values for between filter', 'error');
        return;
    }
    
    // Create filter object
    const filter = {
        id: Date.now().toString(),
        columnId: columnId,
        columnName: columnSelect.options[columnSelect.selectedIndex].textContent,
        operator: operator,
        operatorLabel: operatorSelect.options[operatorSelect.selectedIndex].textContent,
        value: value,
        value2: value2
    };
    
    // Add to filters array
    advancedFilters.push(filter);
    
    // Clear form
    clearFilterForm();    // Apply filters and update UI
    applyAdvancedFilters();
    renderActiveFilters();
    saveAdvancedFilters();
    updateFilterIndicator();
    updateCurrentFiltersInfo(); // Update current filters info
    
    showToast('Filter added successfully', 'success');
}

// Clear filter form
function clearFilterForm() {
    document.getElementById('filterColumn').value = '';
    document.getElementById('filterOperator').value = '';
    document.getElementById('filterValue').value = '';
    document.getElementById('filterValue2').value = '';
    document.getElementById('filterValue').style.display = 'none';
    document.getElementById('filterValue2').style.display = 'none';
}

// Remove specific filter
function removeAdvancedFilter(filterId) {
    advancedFilters = advancedFilters.filter(filter => filter.id !== filterId);    applyAdvancedFilters();
    renderActiveFilters();
    saveAdvancedFilters();
    updateFilterIndicator();
    updateCurrentFiltersInfo(); // Update current filters info
    showToast('Filter removed', 'info');
}

// Clear all advanced filters (called by the red indicator button)
function clearAllAdvancedFilters() {
    if (advancedFilters.length === 0 && !activeQuickFilter) {
        return;
    }
    
    advancedFilters = [];
    activeQuickFilter = null; // Clear quick filter too
    applyAdvancedFilters();
    renderActiveFilters();    renderQuickFilters(); // Re-render quick filters
    saveAdvancedFilters();
    updateFilterIndicator();
    updateCurrentFiltersInfo(); // Update current filters info
    showToast('All advanced filters cleared', 'info');
}

// Update the visibility of the filter reset indicator
function updateFilterIndicator() {
    const indicator = document.getElementById('filterResetIndicator');
    if (indicator) {
        if (advancedFilters.length > 0 || activeQuickFilter) {
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }
}

// Clear all filters
function clearAllFilters() {
    advancedFilters = [];
    activeQuickFilter = null; // Clear quick filter too
    applyAdvancedFilters();
    renderActiveFilters();    renderQuickFilters(); // Re-render quick filters
    saveAdvancedFilters();
    updateFilterIndicator();
    updateCurrentFiltersInfo(); // Update current filters info
    showToast('All filters cleared', 'info');
}

// Render active filters list
function renderActiveFilters() {
    const container = document.getElementById('activeFiltersList');
    const countElement = document.getElementById('activeFilterCount');
    
    countElement.textContent = `${advancedFilters.length} filter${advancedFilters.length !== 1 ? 's' : ''}`;
    
    if (advancedFilters.length === 0) {
        container.innerHTML = `
            <div class="filters-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                <div>No active filters</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = advancedFilters.map(filter => {
        let displayValue = '';
        if (filter.operator === 'between') {
            displayValue = `${filter.value} to ${filter.value2}`;
        } else if (!['isEmpty', 'isNotEmpty', 'thisWeek', 'thisMonth', 'overdue', 'isValid'].includes(filter.operator)) {
            displayValue = filter.value;
        }
        
        return `
            <div class="filter-item">
                <div class="filter-item-content">
                    <span class="filter-item-column">${filter.columnName}</span>
                    <span>${filter.operatorLabel}</span>
                    ${displayValue ? `<span>"${displayValue}"</span>` : ''}
                </div>
                <button class="filter-item-remove" onclick="removeAdvancedFilter('${filter.id}')" title="Remove filter">
                    ×
                </button>
            </div>        `;
    }).join('');
}

// Apply advanced filters to tasks
function applyAdvancedFilters() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const priorityFilter = document.getElementById('priorityFilter').value;
    const filterLogic = document.querySelector('input[name="filterLogic"]:checked')?.value || 'AND';
    
    const filteredTasks = tasks.filter(task => {
        // Apply original search and priority filters first
        let matchesOriginalFilters = true;
        
        // Search filter
        if (searchText) {
            const searchableText = [
                task.task || '',
                task.resource || '',
                task.remarks || '',
                ...customColumns.map(col => task[col.id] || '')
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchText)) {
                matchesOriginalFilters = false;
            }
        }
        
        // Priority filter
        if (priorityFilter && task.priority.toString() !== priorityFilter) {
            matchesOriginalFilters = false;
        }
        
        // Status filter
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
            matchesOriginalFilters = false;
        }
        
        if (!matchesOriginalFilters) {
            return false;
        }
        
        // Apply quick filter if active
        if (activeQuickFilter) {
            const availableColumns = getAvailableColumns();
            const quickFilters = getAvailableQuickFilters(availableColumns);
            const quickFilter = quickFilters.find(f => f.id === activeQuickFilter);
            if (quickFilter && !matchesQuickFilter(task, quickFilter)) {
                return false;
            }
        }
        
        // Apply advanced filters if any
        if (advancedFilters.length === 0) {
            return true;
        }
        
        const filterResults = advancedFilters.map(filter => {
            return applyFilterToTask(task, filter);
        });
        
        // Apply filter logic (AND/OR)
        if (filterLogic === 'AND') {
            return filterResults.every(result => result);
        } else {
            return filterResults.some(result => result);
        }
    });
    
    renderFilteredTasks(filteredTasks);
    updateStats();
    
    // Save advanced filters whenever they are applied
    if (advancedFilters.length > 0) {
        saveAdvancedFilters();
    }
}

// Apply individual filter to task
function applyFilterToTask(task, filter) {
    const value = task[filter.columnId];
    const filterValue = filter.value;
    const filterValue2 = filter.value2;
    const operator = filter.operator;
      // Get column info for type checking
    const allColumns = getAllColumns();
    const columnInfo = allColumns.find(col => col.id === filter.columnId);
    const columnType = columnInfo ? columnInfo.type : 'text';
    
    switch (operator) {
        case 'contains':
            return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
            
        case 'equals':
            if (columnType === 'number') {
                return parseFloat(value) === parseFloat(filterValue);
            }
            return value && value.toString().toLowerCase() === filterValue.toLowerCase();
            
        case 'startsWith':
            return value && value.toString().toLowerCase().startsWith(filterValue.toLowerCase());
            
        case 'endsWith':
            return value && value.toString().toLowerCase().endsWith(filterValue.toLowerCase());
            
        case 'isEmpty':
            return !value || value.toString().trim() === '';
            
        case 'isNotEmpty':
            return value && value.toString().trim() !== '';
            
        case 'greaterThan':
            return parseFloat(value) > parseFloat(filterValue);
            
        case 'lessThan':
            return parseFloat(value) < parseFloat(filterValue);
            
        case 'between':
            if (columnType === 'number') {
                const numValue = parseFloat(value);
                const numMin = parseFloat(filterValue);
                const numMax = parseFloat(filterValue2);
                return numValue >= numMin && numValue <= numMax;
            } else if (columnType === 'date') {
                const taskDate = parseDate(value);
                const startDate = new Date(filterValue);
                const endDate = new Date(filterValue2);
                return taskDate >= startDate && taskDate <= endDate;
            }
            return false;
            
        case 'before':
            const beforeDate = parseDate(value);
            const beforeFilterDate = new Date(filterValue);
            return beforeDate < beforeFilterDate;
            
        case 'after':
            const afterDate = parseDate(value);
            const afterFilterDate = new Date(filterValue);
            return afterDate > afterFilterDate;
            
        case 'thisWeek':
            const weekDate = parseDate(value);
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return weekDate >= weekStart && weekDate <= weekEnd;
            
        case 'thisMonth':
            const monthDate = parseDate(value);
            const now = new Date();
            return monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear();
            
        case 'overdue':
            const dueDate = parseDate(value);
            return dueDate < new Date() && task.status !== 'Completed';
            
        case 'inList':
            const listValues = filterValue.split(',').map(v => v.trim().toLowerCase());
            return listValues.includes(value.toString().toLowerCase());
            
        case 'notInList':
            const notListValues = filterValue.split(',').map(v => v.trim().toLowerCase());
            return !notListValues.includes(value.toString().toLowerCase());
            
        case 'isValid':
            if (columnType === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            } else if (columnType === 'url') {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
              default:
            return true;
    }
}

// Helper function to parse date in DD-MM-YYYY format
function parseDate(dateString) {
    if (!dateString) return new Date('2099-12-31');
    
    if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // DD-MM-YYYY format
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
    }
    
    return new Date(dateString);
}

// Render filtered tasks (similar to renderTasks but with filtered array)
function renderFilteredTasks(filteredTasks) {
    const tbody = document.getElementById('taskTableBody');
      // Get columns in the correct order according to columnOrder array
    const allColumns = getAllColumns();
    const visibleColumns = columnOrder
        .map(colId => allColumns.find(col => col.id === colId))
        .filter(col => col && col.visible);

    tbody.innerHTML = filteredTasks.map(task => {
        const cells = visibleColumns.map(column => {
            return renderTaskCell(task, column);
        }).join('');

        return `<tr data-id="${task.sr}" class="status-row-${task.status.toLowerCase()}">${cells}</tr>`;
    }).join('');

    // Re-add event listeners for inline editing
    document.querySelectorAll('.editable').forEach(el => {
        el.addEventListener('dblclick', function () {
            startInlineEdit(this);
        });
    });
    
    // Re-initialize column resize after table is re-rendered (debounced)
    clearTimeout(window.resizeInitTimeout);
    window.resizeInitTimeout = setTimeout(() => {
        initializeColumnResize();
        loadColumnWidths();
    }, 50);
}

// Save advanced filters to localStorage
function saveAdvancedFilters() {
    const filterData = {
        filters: advancedFilters,
        logic: document.querySelector('input[name="filterLogic"]:checked')?.value || 'AND'
    };
    localStorage.setItem('taskManagerAdvancedFilters', JSON.stringify(filterData));
}

// Load advanced filters from localStorage
function loadAdvancedFilters() {
    const savedFilters = localStorage.getItem('taskManagerAdvancedFilters');
    if (savedFilters) {
        try {
            const filterData = JSON.parse(savedFilters);
            advancedFilters = filterData.filters || [];
            
            // Set filter logic
            const logicRadio = document.querySelector(`input[name="filterLogic"][value="${filterData.logic || 'AND'}"]`);
            if (logicRadio) {
                logicRadio.checked = true;
            }
              // Apply filters if any exist
            if (advancedFilters.length > 0) {
                applyAdvancedFilters();
                renderActiveFilters();
            }
            
            // Update filter indicator
            updateFilterIndicator();
        } catch (error) {
            console.error('Error loading advanced filters:', error);
            advancedFilters = [];
            updateFilterIndicator();
        }
    } else {
        // No saved filters, make sure indicator is hidden
        updateFilterIndicator();
    }
}