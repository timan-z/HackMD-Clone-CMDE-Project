// THIS WILL BE OLD CODE LEFT FOR REFERENCE...

function removeUsersList(usersListBtn) {
    const removeUsersList = document.getElementById('users-list-container');
    document.body.removeChild(removeUsersList);
    usersListBtn = document.getElementById('users-list-button'); // Get rid of the shadow overlay effect.
    usersListBtn.classList.remove('users-l-add-shadow');
}

export function createUsersList() {
    let usersListBtn = null;
    // If function invoked while Users-List bar is already present in the DOM, it should be removed (so I don't double+ import it):
    if(document.getElementById('users-list-container')) {
        removeUsersList(usersListBtn);
        return;
    } else {
        // Otherwise, apply darkened shadow styling to the "className="users-list-button" User Icon <div> to imply Users List is active:
        usersListBtn = document.getElementById('users-list-button');
        usersListBtn.classList.add('users-l-add-shadow');
    }

    // Creating Users-List Container that'll wrap the header (Users-List Bar) and collaspible body (the actual Users List):
    const usersListContainer = document.createElement('div');
    usersListContainer.id = 'users-list-container';
    Object.assign(usersListContainer.style, {
        top:'0%', // Important for positioning it at the top (the positionToTheRight() function I added *only* does that).
        width:'375px',
        backgroundColor: '#008F11', // NOTE: This is the darker Matrix green.
        border: '5px solid #0D0208',
        borderRadius: '7.5%',
        fontFamily: 'Arial, sans-serif',
        position: 'fixed',
        cursor: 'grab',
        zIndex: 99999,
    });

    // Creating the Users-List Bar (only element that will show when the full Users List Component is collapse):
    const usersListBar = document.createElement('div');
    usersListBar.id = 'users-list-bar';
    Object.assign(usersListBar.style, {
        width:'335px',
        height:'50px',
        fontSize: '37px',
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        backgroundColor: '#008F11',
        display: 'flex',
        userSelect: 'none',
        borderRadius: '35%',
    });
    usersListBar.textContent = 'Users List';

    /* Adding buttons for the Users-List Bar: 
    1 - "^" (upside-down "V") collapse the Users List (button will transform to a regular "V" symbol after for re-expanding).
    2 - "X" to close the Users-List Bar. */
    let buttonStyling = {
        width: '37px',
        height: '37px',
        backgroundColor: '#0D0208',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '35px',
        borderColor: '#00FF41',
        borderStyle: 'solid',
        borderWidth: '3px',
        color: '#00FF41',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        userSelect: 'none',
    };

    // 1 - Making the ("^"/"V") button:
    const expBtn = document.createElement('div');
    expBtn.id = 'ulb-exp-btn';
    Object.assign(expBtn.style, buttonStyling);
    expBtn.textContent = 'V';
    // Line below is for rotating the V so it looks like "^" (default state, pointing upwards as if to retract the Users List, which expands down).
    expBtn.style.transform = 'rotate(180deg)';
    usersListBar.appendChild(expBtn);

    // Adding functionality for the ("^"/"V") button - expanding and collapsing the Users List Body (which will be defined later on).
    expBtn.addEventListener("click", function () {
        const getExpBtn = document.getElementById('ulb-exp-btn');
        const getUserListBody = document.getElementById('users-list-body');
        if(!getExpBtn || !getUserListBody) return;

        if(getExpBtn.style.transform === 'rotate(0deg)') {
            // [1/2] The Users List Body <div> wants to be visible (so the "V" button should be rotated while the display is enabled):
            getExpBtn.style.transform = 'rotate(180deg)';
            getUserListBody.style.display = 'flex';
            return;
        }
        getExpBtn.style.transform = 'rotate(0deg)'; // [2/2] vice-versa.
        getUserListBody.style.display = 'none';
    });

    // 2 - Making the "X" button:
    const closeBtn = document.createElement('div');
    closeBtn.id = 'ulb-close-btn';
    Object.assign(closeBtn.style, buttonStyling);
    closeBtn.textContent = 'X';
    closeBtn.addEventListener("click", function () {
        removeUsersList(usersListBtn);
    });
    usersListBar.appendChild(closeBtn);

    // DEBUG: BELOW = WORKING ON THE BODY!!!

    // need to figure out how i'll be loading in the user information

    /* NOTE: Remember there's an "Active Users" section first, then an "Offline Users" section (maybe differentiate with colour).
    Also, I guess I can sort the users alphabetically by username and then if there's a match or something, sort by Socket.ID... */

    /* Creating the collapsible body for the Users List Container. It's here that the Users List will appear...
    (In each User Row of the list, there will be Username, Socket.IO ID (unique identifier), and a Chat Msg icon to open live chat). */
    const usersListBody = document.createElement('div');
    usersListBody.id = 'users-list-body';
    Object.assign(usersListBody.style, {
        backgroundColor: '#001F10',
        borderRadius: '5%',
        color: 'white',
        height: '400px',
        //maxHeight: '500px', // <---DEBUG:+NOTE: I want to make this Users List <div> EXPANDABLE VERTICALLY to a max height of 500px. I know how to do this. Come back and do it later!!!
        padding: '10px',
        overflowY: 'auto',
    });

    // Active Users Section:
    const activeUsersSection = document.createElement('div');
    activeUsersSection.id = 'active-users-section';
    Object.assign(activeUsersSection.style, {
        display:'flex',
        flexDirection:'column',
        gap:'5px'
    });
    // Active Users Header:
    const activeUsersHeader = document.createElement('div');
    activeUsersHeader.id = 'active-users-header';
    Object.assign(activeUsersHeader.style, {
        fontSize: '20px',
        fontWeight: 'bold',
    });
    activeUsersHeader.textContent = 'Active Users';
    activeUsersSection.append(activeUsersHeader);

    // BELOW-DEBUG: TEST USERS FOR ACTIVE SECTION:
    // NOTE: Need to make this more advanced -- username, underneath it is user.id, to the far right is the Text Msg icon w/ link to the user.
    const activeUsers = ['Adam', 'Stavros', 'Nick', 'Neo', 'Trinity', 'Morpheus', 'Something new'];

    //activeUsersSection.appendChild(document.createElement('hr'));
    
    activeUsers.forEach(user => {
        // Horizontal line above each "User" entry row (just style formatting):
        const horLineAUS = document.createElement('hr');
        Object.assign(horLineAUS.style, {
            width:"100%",
        });
        activeUsersSection.appendChild(horLineAUS);

        // Actual "User" entry row:
        const userItem = document.createElement('div');
        userItem.textContent = '• ' + user;
        activeUsersSection.appendChild(userItem);
    });
    // Last Horizontal line in the Active Users section -- or just the one separating the Active and Inactive section:
    const lastHorLineAUS = document.createElement('hr');
    Object.assign(lastHorLineAUS.style, {
        width:"100%",
    });
    activeUsersSection.appendChild(lastHorLineAUS);

    // ABOVE-DEBUG: TEST USERS FOR ACTIVE SECTION!

    // Inactive Users Section:
    /*const inactiveUsersSection = document.createElement('div');
    inactiveUsersSection.id = 'inactive-users-section';
    Object.assign(activeUsersSection.style, {
        display: 'flex',
        flexDirection:'column',
        gap:'5px',
    });
    // Inactive Users Header:
    const inactiveUsersHeader = document.createElement('div');
    inactiveUsersHeader.id = 'inactive-users-header';
    Object.assign(inactiveUsersHeader.style, {
        fontSize: '20px',
        fontWeight: 'bold',
    });
    inactiveUsersHeader.textContent = 'Inactive Users';
    inactiveUsersSection.append(inactiveUsersHeader);

    // BELOW-DEBUG: TEST USERS FOR INACTIVE SECTION:
    activeUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.textContent = '• ' + user;
        inactiveUsersSection.appendChild(userItem);
    });
    // ABOVE-DEBUG: TEST USERS FOR INACTIVE SECTION.*/


    usersListBody.append(activeUsersSection);
    //usersListBody.append(inactiveUsersSection);
    usersListContainer.appendChild(usersListBar);
    usersListContainer.appendChild(usersListBody);
    document.body.appendChild(usersListContainer);

    // Making this whole container "draggable":
    addDragFunc(usersListContainer);  
}

// NOTE: Maybe move these functions below to UtilityFuncs.js afterwards... (if it makes sense to do so):
// (This code here may feel very foreign and that's because it is largely stuff I'm refactoring from old university projects).
function addDragFunc(element) {
    const dragObj = {
        drag_active: false,
        drag_in_prog: null,
        x_pos_og: 0,
        y_pos_og: 0,
        x_offset: 0,
        y_offset: 0,
    };

    // Series of nested functions below are for updating the coordinates of the <div> during and after the dragging:
    // 1. "setOriginalPosition":
    function setOriginalPosition(e, dragObj) {
        dragObj.x_pos_og = e.clientX - dragObj.x_offset;
        dragObj.y_pos_og = e.clientY - dragObj.y_offset;
    }
    // 2. "updatePosition" (mid-drag):
    function updatePosition(e, dragObj) {
        let newX = e.clientX - dragObj.x_pos_og;
        let newY = e.clientY - dragObj.y_pos_og;
        // viewport stuff
        let viewportWidth = window.innerWidth;
        let viewportHeight = window.innerHeight;
        let rect = dragObj.drag_in_prog.getBoundingClientRect();
        // ceil/floor
        newX = Math.min(viewportWidth - rect.width, Math.max(0, newX));
        newY = Math.min(viewportHeight - rect.height, Math.max(0, newY));
        dragObj.x_offset = newX;
        dragObj.y_offset = newY;
    }
    // 3. "newPosition" (after-drag):
    function newPosition(dragObj) {
        if (dragObj.drag_in_prog) {
            dragObj.drag_in_prog.style.transform = "translate3d(" + dragObj.x_offset + "px, " + dragObj.y_offset + "px, 0)";
        }
    }

    /* Above, the boundaries over which the passed element can be dragged are defined, but defined based on the initial positioning 
    of said element, and so to correctly capture the user's viewport, it needs to be manually positioned at the right space.
    (Setting it at the top-right corner of the webpage, totally not because this is recycled code from a previous project and I'm lazy). */
    function positionToTheRight(element) {

        console.log("DEBUG: Function positionToTheRight() has been entered...");

        let reposElement = document.getElementById(element.id);
        if(reposElement) {
            var viewportWidth = window.innerWidth; // I want to shift it to the top right corner so I need the width.
            var viewportHeight = window.innerHeight;
            var rect = reposElement.getBoundingClientRect();
            dragObj.x_pos_og = 0; // DEBUG: <-- I can probably get rid of these =0 lines now that I added individual objects but I'm incoherent rn. 
            dragObj.y_pos_og = 0;
            dragObj.x_offset = viewportWidth - rect.width - 32; // DISCLAIMER: 16 PIXELS = 1 REM (THIS IS FOR THE RIGHTMOST PADDING).
            dragObj.y_offset = viewportHeight - (viewportHeight - 75);
            dragObj.drag_in_prog = reposElement;
            newPosition(dragObj);
        }
    }

    // Adding the event listeners for the "draggability" feature to the <div> element and webpage document:
    // 1.
    element.addEventListener("mousedown", (e) => {
        // NOTE: MAYBE Tweak the if-condition below so that it excludes Text Message stuff (so the user can go and copy and paste stuff).
        if(element.contains(e.target) && !dragObj.drag_active) {
            dragObj.drag_in_prog = element;
            setOriginalPosition(e, dragObj);
            dragObj.drag_active = true;
        }
    });
    // 2.
    document.addEventListener("mousemove", (e) => {
        if (dragObj.drag_active) {
          e.preventDefault();
          updatePosition(e, dragObj);
          newPosition(dragObj);
        }
    });
    // 3.
    document.addEventListener("mouseup", () => {
        if (dragObj.drag_active) {
          dragObj.drag_in_prog = null;
          dragObj.drag_active = false;
        }
    });

    // Custom positioning of the <div> element:
    positionToTheRight(element);
}