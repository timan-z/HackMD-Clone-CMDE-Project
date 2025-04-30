function removeUsersListBar(usersListBtn) {
    const removeUsersList = document.getElementById('users-list-bar');
    document.body.removeChild(removeUsersList);
    usersListBtn = document.getElementById('users-list-button'); // Get rid of the shadow overlay effect.
    usersListBtn.classList.remove('users-l-add-shadow');
}

export function createUsersList() {
    let usersListBtn = null;
    // If function invoked while Users-List bar is already present in the DOM, it should be removed (so I don't double+ import it):
    if(document.getElementById('users-list-bar')) {
        removeUsersListBar(usersListBtn);
        return;
    } else {
        // Otherwise, apply darkened shadow styling to the "className="users-list-button" User Icon <div> to imply Users List is active:
        usersListBtn = document.getElementById('users-list-button');
        usersListBtn.classList.add('users-l-add-shadow');
    }



    // Wrapper for the usersListBar (what initially appears in collapsed form) and the hidden section (the actual Users List).
    /*const usersListWrapper = document.createElement('div');
    usersListWrapper.id = 'users-list-wrapper';
    Object.assign(usersListWrapper.style, {
        position: 'fixed',
        zIndex: 99999,
        top: '0',
        left: '0',
        transform: 'translate3d(0, 0, 0)',
    });*/






    // Creating the Users-List Bar:
    // 1. The main usersListBar (non-expanded):
    const usersListBar = document.createElement('div');
    usersListBar.id = 'users-list-bar';
    Object.assign(usersListBar.style, {
        width:'335px',
        height:'50px',
        top:'0%',
        zIndex: 99999,
        fontSize: '37px',
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#008F11',
        borderColor: '#0D0208',
        borderRadius: '7.5%',
        borderStyle: 'solid',
        borderWidth: '5px',
        cursor:'grab',
        display:'flex',
        position:'fixed', /* Combination of a high zIndex and position:'fixed' will make sure this <div> won't interfere with existing webpage HTML. */
    });
    usersListBar.textContent = 'Users List';

    // 2. The buttons within the usersListBar ([2.1]:"V" = expand downwards, [2.2]:"^" = expand upwards, [2.3]:"X" = close):
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
    }; // All three buttons will use the same styling, including "^" but it has transform(180deg) because it's just flipping a "V".

    // [2.1] - Making the "V" button:
    const expDownBtn = document.createElement('div');
    expDownBtn.id = 'ulb-expd-btn';
    Object.assign(expDownBtn.style, buttonStyling);
    expDownBtn.textContent = 'V';
    usersListBar.appendChild(expDownBtn);

    // [2.2] - Making the "^" button:
    const expUpBtn = document.createElement('div');
    expUpBtn.id = 'ulb-expu-btn';
    Object.assign(expUpBtn.style, {
        width: '40px',
        height: '40px',
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
        transform: 'rotate(180deg)',
    });
    expUpBtn.textContent = 'V';
    usersListBar.appendChild(expUpBtn);

    // [2.3] - Making the "X" button:
    const closeBtn = document.createElement('div');
    closeBtn.id = 'ulb-close-btn';
    Object.assign(closeBtn.style, buttonStyling);
    closeBtn.textContent = 'X';
    closeBtn.addEventListener("click", function () {
        removeUsersListBar(usersListBtn);
    });
    usersListBar.appendChild(closeBtn);

    /* 3. The "V" and "^" buttons are meant to expand a rectangular <div> element downwards or upwards,
    and that rectangular <div> is where the Users List will be rendered. Section below will be for writing that <div>: */
    
    
    
    
    
    
    











    // Append Users List Bar to the webpage DOM:
    document.body.appendChild(usersListBar);
    addDragFunc(usersListBar);  // Make it "draggable".
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
        if(e.target === element && !dragObj.drag_active) {
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