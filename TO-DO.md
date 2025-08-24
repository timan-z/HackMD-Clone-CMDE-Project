8/23/2025
## After hosting my MVP (Minimal Viable Product) — Before Implementing Version Control:
*Take a break first, have earned one I think*.

### Medium-Hard Effort:
1. I need to upgrade my dependencies (e.g., **y-websocket**) and adjust my yjs-server.js file where I can (*I use **/bin/utils.js** from **y-websocket 1.5.0** which won’t be exposed in later versions*).
- Relating to **1.**, it's worth checking to see how these updated dependencies affect the edge case I face with my current versions (outlined here: https://github.com/yjs/y-websocket/issues/81#issuecomment-1453185788). *If it's even doable since my workaround takes care of the vast majority of edge cases*.

2. Since I start the y-websocket server that Yjs-Lexical uses through code — instead of programmatically running a CLI command on a Railway service — then I might as well merge the logic of **yjs-server.js** and **server.js** (my Socket.IO and express server file, maybe rename this too) together, and then host them on one single Railway server.

3. I need to restructure my project repo to keep the frontend and backend separate like a monorepo (just for cleanliness). My current repo is quite messy with how I'm specifying paths and package.json files (wrote the majority of this project developing locally before I had much experience deploying).

4. Add document persistence (properly). The method I implemented working locally (that relied on Socket.IO emits) barely works.

5. I should re-record a demo going through and displaying the features of my project, this time touching more on the architectural aspect of the project. (What makes it interesting and impressive). ***Maybe this can wait until I implement Version Control, my last big major feature here***.

### Easy Effort:
1. I'm going to be linking this (deployment to the site aka Netlify frontend) in my SWE-related resume — so it would be helpful to have my GitHub linked somewhere on the UI. Maybe on the Logic/Registration page I can have a Navigation bar at the top of the viewport where you can click a link leading to it? (Or just some simple icon in either top corner of the viewport).
2. A "Help" page for recruiters — some test accounts they can use (clarify, of course, that no actual valid emails are needed for the Registration pages).

#### Changes to README.
- This basically marks version 2.0 (having it deployed and accessible to people). Also the added y-websocket server set up in a .js file, how it manually seeds to documents and so on.
- Document the changes I faced hosting this project (namely just the y-websocket version bug with 'sync' being fired too early, lessons I learned from it — skills I developed as a programmer — and so on). Be sure to touch on what I've learned from developing locally vs translating that to deployment (how things won't always correlate one-to-one).
- Link the "RUST vs JS Markdown Parser" repo I had in my README too as a justification for adding the RUSt-powered parser.

#### Lowest Priority (Aesthetic Changes):
- Fix the problem I had with RemoteCursorOverlay (if it's too complex, maybe just give up and use the default CollaborationPlugin built-in one)
- Some visual indicator over the render panel in the Editor pages that let you know if the RUST or JS-powered parser is being used. (This is minor but nice to have).

#### Bugs
- My RemoteCursorOverlay doesn't account for Editor window scroll haha