

export function createUsersListBar() {
    let usersListBtn = null;
    // If function invoked while Users-List bar is already present in the DOM, it should be removed (so I don't double+ import it):
    if(document.getElementById('users-list-bar')) {
        const removeUsersList = document.getElementById('users-list-bar');
        document.body.removeChild(removeUsersList);
        usersListBtn = document.getElementById('users-list-button'); // Get rid of the shadow overlay effect.
        usersListBtn.classList.remove('users-l-add-shadow');
        return;
    } else {
        // Otherwise, apply darkened shadow styling to the "className="users-list-button" User Icon <div> to imply Users List is active:
        usersListBtn = document.getElementById('users-list-button');
        usersListBtn.classList.add('users-l-add-shadow');
    }

    // Creating the Users-List Bar (DEBUG: WORK IN PROGRESS duh):
    const usersListBar = document.createElement('div');
    usersListBar.id = 'users-list-bar';
    Object.assign(usersListBar.style, {
        width:'335px',
        height:'75px',
        zIndex: 99999,
        backgroundColor: '#008F11',
        borderRadius: '7.5%',
    });

    // Append Users List Bar to the webpage DOM:
    document.body.appendChild(usersListBar);    








    // Implementing "drag" functionality for the webpage:
    /*let dragUsersLBar = {
        drag_active: false,
        drag_in_prog: null,
        x_pos_og: 0,
        y_pos_og: 0,
        x_offset: 0,
        y_offset: 0
    };
    let activeDragObj = null;   // Active object "being dragged" reference.*/
    // Initiate dragging:







}


