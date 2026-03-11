document.addEventListener('DOMContentLoaded', () => {

    // Core Elements
    const world = document.getElementById('world');
    const navLinks = document.querySelectorAll('.top-nav li');
    const backBtns = document.querySelectorAll('.back-btn');
    const rooms = document.querySelectorAll('.room');

    // Video Elements
    const vidLoop = document.getElementById('vid-loop'); // clip-1
    const vidSide = document.getElementById('vid-side'); // clip-2 (Used for all transitions now)

    // Slow down the central looping background video for a more professional feel
    if (vidLoop) {
        vidLoop.playbackRate = 0.6;
    }

    // Modal Elements for "Contatos"
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    // State Management 
    let currentRoom = 'home';
    let isAnimating = false;

    // Map of coordinates for the spatial navigation "Rooms"
    const coordinates = {
        'home': { x: "0vw", y: "0vh", rotationY: 0, rotationX: 0 },
        'ads': { x: "100vw", y: "0vh", rotationY: 0, rotationX: 0 },
        'model': { x: "-100vw", y: "0vh", rotationY: 0, rotationX: 0 },
        'auto': { x: "0vw", y: "-100vh", rotationY: 0, rotationX: 0 }
    };

    /**
     * Executes the spatial camera sweep across the grid with video orchestration
     */
    function transitionTo(targetId) {
        // Prevent action if currently transitioning
        if (isAnimating) return;

        // Prevent clicking the same room
        if (currentRoom === targetId) return;

        const dest = coordinates[targetId];
        if (!dest) return;

        isAnimating = true;
        updateNavState(targetId);

        if (targetId !== 'home') {
            // ==========================================
            // DEPARTING FOR A NEW ROOM
            // ==========================================

            // ONLY play the cinematic dive clip if we are leaving from the Home Hub
            if (currentRoom === 'home' && vidSide) {
                let activeTransitionVid = vidSide;

                activeTransitionVid.currentTime = 0;
                activeTransitionVid.play();

                // Faster fade in for punchier sync
                gsap.to(activeTransitionVid, { opacity: 1, duration: 0.3 });

                // Snappy cinematic dive (1.2 seconds) before moving the camera
                gsap.delayedCall(1.2, () => {
                    executeCameraSweep(targetId, dest, () => {
                        currentRoom = targetId;
                        isAnimating = false;
                        activeTransitionVid.pause();
                    });
                });
            } else {
                // We are jumping directly between two lateral void rooms. 
                // Do not play the transition video, just sweep the camera physically across the map.
                executeCameraSweep(targetId, dest, () => {
                    currentRoom = targetId;
                    isAnimating = false;
                });
            }

        } else {
            // ==========================================
            // RETURNING HOME 
            // ==========================================

            // Immediately start fading out whatever transition video was left visible (vidSide),
            // revealing the continuous looping clip-1 underneath while the camera sweeps back.
            if (vidSide) {
                gsap.to(vidSide, { opacity: 0, duration: 1.0 });
            }

            // Sweep camera immediately back to center
            executeCameraSweep(targetId, dest, () => {
                currentRoom = 'home';
                isAnimating = false;
            });
        }
    }

    /**
     * Handles the actual GSAP spatial grid translation and text fades
     */
    function executeCameraSweep(targetId, dest, onComplete) {
        // Animate the 'world' container physically moving
        gsap.to(world, {
            x: dest.x,
            y: dest.y,
            rotationY: dest.rotationY,
            rotationX: dest.rotationX,
            duration: 1.8,
            ease: "power3.inOut",
            onComplete: onComplete
        });

        // Fade logic: Fade in the texts of the room we're arriving in
        rooms.forEach(room => {
            if (room.id === `room-${targetId}`) {
                gsap.to(room, { opacity: 1, duration: 1.0, delay: 0.5 });
            } else if (room.id !== 'room-home') {
                // Fade out other room texts
                gsap.to(room, { opacity: 0, duration: 0.6 });
            }
        });
    }

    function updateNavState(targetId) {
        navLinks.forEach(link => {
            if (link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Toggle dropdown when clicking CONTATOS
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const currentItem = e.currentTarget;
            const targetId = currentItem.getAttribute('data-target');

            if (targetId === 'contacts') {
                e.stopPropagation(); // Prevents document click from immediately closing it

                // Toggle active class on the main wrapping LI
                currentItem.classList.toggle('dropdown-open');

                const dropdown = currentItem.querySelector('.acrylic-dropdown');
                if (dropdown) {
                    dropdown.classList.toggle('active');
                }
            } else {
                // Close any open dropdowns
                const openDropdowns = document.querySelectorAll('.acrylic-dropdown.active');
                openDropdowns.forEach(d => d.classList.remove('active'));

                const openItems = document.querySelectorAll('.dropdown-open');
                openItems.forEach(i => i.classList.remove('dropdown-open'));

                // Transition to new room
                transitionTo(targetId);
            }
        });
    });

    // Close dropdown when clicking ANYWHERE outside of it
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.has-dropdown')) {
            const openDropdowns = document.querySelectorAll('.acrylic-dropdown.active');
            openDropdowns.forEach(d => d.classList.remove('active'));

            const openItems = document.querySelectorAll('.dropdown-open');
            openItems.forEach(i => i.classList.remove('dropdown-open'));
        }
    });

    // Attach Click Events to Back Buttons in the void rooms
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            transitionTo('home');
        });
    });

    // Make the new CTA buttons in the rooms open the Contact Dropdown
    const ctaBtns = document.querySelectorAll('.trigger-contact');
    ctaBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Find the Contacts nav link and simulate a click to open it
            const contactNavLink = document.querySelector('.top-nav li[data-target="contacts"]');
            if (contactNavLink) {
                contactNavLink.click();
            }
        });
    });

    // Close dropdown when clicking ANYWHERE outside of it
    document.addEventListener('click', (e) => {
        const activeDropdown = document.querySelector('.acrylic-dropdown.active');
        if (activeDropdown && !e.target.closest('.has-dropdown')) {
            activeDropdown.classList.remove('active');
        }
    });

    // ==========================================
    // INTERACTIVE PRODUCT VIDEOS (Click-to-Play Audio)
    // ==========================================
    // Behavior:
    // 1. By default, they auto-play looped and muted (set in HTML).
    // 2. On click, they restart from 0, unmute, and play until the end.
    // 3. On reaching the end, they go back to muted looping.
    const productVideos = document.querySelectorAll('.feature-media video');

    productVideos.forEach(vid => {
        // Find the visual audio indicator specific to this video
        const indicatorIcon = vid.parentElement.querySelector('.audio-indicator i');

        // Allow the user to click the video to activate sound
        vid.addEventListener('click', () => {
            // Restart video
            vid.currentTime = 0;

            // Unmute and prevent looping so we can catch the 'ended' event
            vid.muted = false;
            vid.loop = false;
            vid.play();

            // Swap icon to volume-up
            if (indicatorIcon) {
                indicatorIcon.classList.remove('fa-volume-mute');
                indicatorIcon.classList.add('fa-volume-up');
            }

            // Visual feedback that it is now "active"
            vid.classList.add('video-active');
        });

        // When the active (unmuted) playback finishes, revert back to silent looping
        vid.addEventListener('ended', () => {
            vid.muted = true;
            vid.loop = true;
            vid.classList.remove('video-active');

            // Swap icon back to mute
            if (indicatorIcon) {
                indicatorIcon.classList.remove('fa-volume-up');
                indicatorIcon.classList.add('fa-volume-mute');
            }

            vid.play();
        });
    });

});
