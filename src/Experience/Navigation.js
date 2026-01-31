import * as THREE from 'three'
import Experience from './Experience.js'
import normalizeWheel from 'normalize-wheel'

// For smooth camera animation
import { gsap } from 'gsap'

export default class Navigation
{
    constructor()
    {
        this.experience = new Experience()
        this.targetElement = this.experience.targetElement
        this.camera = this.experience.camera
        this.config = this.experience.config
        this.time = this.experience.time
        this.world = this.experience.world

        this.setView()

        // Raycaster for object selection
        this.raycaster = new THREE.Raycaster()
        this.pointer = new THREE.Vector2()

        // Listen for click events for object focus
        this.targetElement.addEventListener('click', this.onClick.bind(this))

        // For advanced PC zoom/pan system
        this.pcZoomState = 'none' // 'none', 'zoomed75', 'zoomed35', 'returning'
        this.defaultCameraState = null
        this.pcScreenCenter = null
        this.isFirstClick = true // Track if this is the first click after loading
        this.clickEnabled = false // Disable clicks initially
        this.isZoomingIn = false // Track if currently zooming in
        this.hasEnteredScreenAfterZoom = false // Track if cursor entered screen after zoom completed

        // Listen for mouse move to handle zoom-out and pan
        this.targetElement.addEventListener('mousemove', this.onMouseMoveAdvanced.bind(this))
        
        this.tvZoomed = false
        this.tvZoomInComplete = false
        
        // Sofa zoom state
        this.sofaZoomed = false
        this.sofaZoomInComplete = false
        this.sofaCenter = null
        
        // Laptop zoom state
        this.laptopZoomed = false
        this.laptopZoomInComplete = false
        
        // Video button toggle - enables/disables free exploration mode
        this.freeExploreMode = false
        this.videoButton = document.getElementById('free-camera-toggle')
        if(this.videoButton) {
            this.videoButton.addEventListener('click', () => {
                this.freeExploreMode = !this.freeExploreMode
                
                if (this.freeExploreMode) {
                    this.videoButton.classList.add('active')
                    
                    // Capture ACTUAL current camera position before exiting zoom states
                    const currentPos = this.camera.modes.default.instance.position.clone()
                    const currentTarget = this.view.target.smoothed.clone()
                    
                    // Exit any zoom states when entering free explore mode
                    if (this.pcZoomState !== 'none') {
                        this.pcZoomState = 'none'
                        this.pcScreenCenter = null
                    }
                    if (this.laptopZoomed) {
                        this.laptopZoomed = false
                        this.laptopZoomInComplete = false
                    }
                    if (this.tvZoomed) {
                        this.tvZoomed = false
                        this.tvZoomInComplete = false
                    }
                    
                    // Calculate spherical coordinates from actual current position
                    const offset = currentPos.clone().sub(currentTarget)
                    const spherical = new THREE.Spherical().setFromVector3(offset)
                    
                    // Set both value and smoothed to current actual state
                    this.view.spherical.value.copy(spherical)
                    this.view.spherical.smoothed.copy(spherical)
                    this.view.target.value.copy(currentTarget)
                    this.view.target.smoothed.copy(currentTarget)
                    
                    console.log('Free explore mode: ON at position:', currentPos)
                } else {
                    this.videoButton.classList.remove('active')
                    
                    // Capture current position when exiting free explore mode
                    const currentPos = this.camera.modes.default.instance.position.clone()
                    const currentTarget = this.view.target.smoothed.clone()
                    
                    // Calculate spherical coordinates from actual current position
                    const offset = currentPos.clone().sub(currentTarget)
                    const spherical = new THREE.Spherical().setFromVector3(offset)
                    
                    // Set both value and smoothed to current actual state
                    this.view.spherical.value.copy(spherical)
                    this.view.spherical.smoothed.copy(spherical)
                    this.view.target.value.copy(currentTarget)
                    this.view.target.smoothed.copy(currentTarget)
                    
                    console.log('Free explore mode: OFF')
                }
            })
        }
        
        // Enable clicks after START button is pressed
        const loadingStartBtn = document.getElementById('loading-start-btn')
        if(loadingStartBtn) {
            loadingStartBtn.addEventListener('click', () => {
                setTimeout(() => {
                    this.clickEnabled = true
                }, 2000) // 2 seconds delay
            })
        } else {
            // Fallback if no loading screen
            setTimeout(() => {
                this.clickEnabled = true
            }, 2000)
        }
        
        // Dev mode: toggled by pressing 'D' on the keyboard
        this.devMode = false;
        this.devPanel = null;
        window.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                this.devMode = !this.devMode;
                if (this.devMode) {
                    this.createDevPanel();
                } else {
                    this.removeDevPanel();
                }
            }
        });

        // Room boundaries for camera restriction
        this.cameraBounds = {
            x: { min: -4, max: 4 },
            y: { min: 1, max: 6 },
            z: { min: -4, max: 4 }
        };
    }

    setView()
    {
        this.view = {}

        this.view.spherical = {}
        // Start position (centered view)
        this.view.spherical.value = new THREE.Spherical(32, Math.PI * 0.35, - Math.PI * 0.22)
        // this.view.spherical.value.radius = 5
        this.view.spherical.smoothed = this.view.spherical.value.clone()
        this.view.spherical.smoothing = 0.0008
        this.view.spherical.limits = {}
        this.view.spherical.limits.radius = { min: 10, max: 50 }
        // Restrict phi (vertical) to prevent seeing behind the room
        this.view.spherical.limits.phi = { min: Math.PI * 0.15, max: Math.PI * 0.44 }
        // Restrict theta (horizontal) more tightly
        this.view.spherical.limits.theta = { min: -Math.PI * 0.45, max: -Math.PI * 0.05 }

        // Intro animation: rotate to final position after loading screen closes
        const startIntroAnimation = () => {
            gsap.to(this.view.spherical.value, {
                theta: -Math.PI * 0.12,
                duration: 5,
                ease: 'power2.inOut'
            })
        }
        
        // Listen for loading screen to close
        const loadingStartBtn = document.getElementById('loading-start-btn')
        if(loadingStartBtn) {
            loadingStartBtn.addEventListener('click', () => {
                setTimeout(startIntroAnimation, 300)
            })
        } else {
            // Fallback if no loading screen
            setTimeout(startIntroAnimation, 300)
        }

        this.view.target = {}
        this.view.target.value = new THREE.Vector3(0, 2.5, 0)
        // this.view.target.value.set(0, 3, -3)
        this.view.target.smoothed = this.view.target.value.clone()
        this.view.target.smoothing = 0.0008
        this.view.target.limits = {}
        this.view.target.limits.x = { min: - 4, max: 4 }
        this.view.target.limits.y = { min: 1, max: 6 }
        this.view.target.limits.z = { min: - 4, max: 4 }

        this.view.drag = {}
        this.view.drag.delta = {}
        this.view.drag.delta.x = 0
        this.view.drag.delta.y = 0
        this.view.drag.previous = {}
        this.view.drag.previous.x = 0
        this.view.drag.previous.y = 0
        this.view.drag.sensitivity = 2
        this.view.drag.freeExploreSensitivity = 8 // Higher sensitivity for free explore mode
        this.view.drag.alternative = false

        this.view.zoom = {}
        this.view.zoom.sensitivity = 0.01
        this.view.zoom.freeExploreSensitivity = 0.08 // Much faster zoom for free explore
        this.view.zoom.delta = 0

        /**
         * Methods
         */
        this.view.down = (_x, _y) =>
        {
            this.view.drag.previous.x = _x
            this.view.drag.previous.y = _y
        }

        this.view.move = (_x, _y) =>
        {
            this.view.drag.delta.x += _x - this.view.drag.previous.x
            this.view.drag.delta.y += _y - this.view.drag.previous.y

            this.view.drag.previous.x = _x
            this.view.drag.previous.y = _y
        }

        this.view.up = () =>
        {

        }

        this.view.zoomIn = (_delta) =>
        {
            this.view.zoom.delta += _delta
        }

        /**
         * Mouse events
         */
        this.view.onMouseDown = (_event) =>
        {
            _event.preventDefault()

            this.view.drag.alternative = _event.button === 2 || _event.button === 1 || _event.ctrlKey || _event.shiftKey

            this.view.down(_event.clientX, _event.clientY)

            window.addEventListener('mouseup', this.view.onMouseUp)
            window.addEventListener('mousemove', this.view.onMouseMove)
        }

        this.view.onMouseMove = (_event) =>
        {
            _event.preventDefault()
            
            this.view.move(_event.clientX, _event.clientY)
        }

        this.view.onMouseUp = (_event) =>
        {
            _event.preventDefault()
            
            this.view.up()

            window.removeEventListener('mouseup', this.view.onMouseUp)
            window.removeEventListener('mousemove', this.view.onMouseMove)
        }

        this.targetElement.addEventListener('mousedown', this.view.onMouseDown)
        
        /**
         * Touch events
         */
        this.view.onTouchStart = (_event) =>
        {
            _event.preventDefault()

            this.view.drag.alternative = _event.touches.length > 1

            this.view.down(_event.touches[0].clientX, _event.touches[0].clientY)

            window.addEventListener('touchend', this.view.onTouchEnd)
            window.addEventListener('touchmove', this.view.onTouchMove)
        }

        this.view.onTouchMove = (_event) =>
        {
            _event.preventDefault()
            
            this.view.move(_event.touches[0].clientX, _event.touches[0].clientY)
        }

        this.view.onTouchEnd = (_event) =>
        {
            _event.preventDefault()
            
            this.view.up()

            window.removeEventListener('touchend', this.view.onTouchEnd)
            window.removeEventListener('touchmove', this.view.onTouchMove)
        }

        window.addEventListener('touchstart', this.view.onTouchStart)

        /**
         * Context menu
         */
        this.view.onContextMenu = (_event) =>
        {
            _event.preventDefault()
        }
        
        window.addEventListener('contextmenu', this.view.onContextMenu)

        /**
         * Wheel
         */
        this.view.onWheel = (_event) =>
        {
            _event.preventDefault()

            const normalized = normalizeWheel(_event)
            this.view.zoomIn(normalized.pixelY)
        }
        
        window.addEventListener('mousewheel', this.view.onWheel, { passive: false })
        window.addEventListener('wheel', this.view.onWheel, { passive: false })
    }

    update() {
        // If in PC zoom states or returning, block ALL camera updates (unless in free explore mode)
        if (!this.freeExploreMode && (this.pcZoomState === 'zoomed75' || this.pcZoomState === 'zoomed35' || this.pcZoomState === 'returning')) {
            // Only update lookAt for zoomed states, not during return
            if (this.pcScreenCenter && this.pcZoomState !== 'returning') {
                this.camera.modes.default.instance.lookAt(this.pcScreenCenter);
            }
            // Don't run any of the spherical camera update code below
            return;
        }
        // If zoomed in on laptop, block all camera updates except lookAt (unless in free explore mode)
        if (!this.freeExploreMode && this.laptopZoomed) {
            const laptopScreen = this.world.macScreen?.model?.mesh;
            if (laptopScreen) {
                const box = new THREE.Box3().setFromObject(laptopScreen);
                const center = new THREE.Vector3();
                box.getCenter(center);
                this.camera.modes.default.instance.lookAt(center);
            }
            return;
        }
        // If zoomed in on sofa, block all camera updates except lookAt (unless in free explore mode)
        if (!this.freeExploreMode && this.sofaZoomed) {
            if (this.sofaCenter) {
                this.camera.modes.default.instance.lookAt(this.sofaCenter);
            }
            return;
        }
        // If zoomed in on TV, block all camera updates except lookAt (unless in free explore mode)
        if (!this.freeExploreMode && this.tvZoomed) {
            const tvMesh = this.world.tvMesh;
            if (tvMesh) {
                const box = new THREE.Box3().setFromObject(tvMesh);
                const center = new THREE.Vector3();
                box.getCenter(center);
                this.camera.modes.default.instance.lookAt(center);
            }
            return;
        }
        /**
         * View - ONLY runs when not in any zoom state
         */
        // Use different sensitivity and smoothing for free explore mode
        const currentDragSensitivity = this.freeExploreMode ? this.view.drag.freeExploreSensitivity : this.view.drag.sensitivity
        const currentZoomSensitivity = this.freeExploreMode ? this.view.zoom.freeExploreSensitivity : this.view.zoom.sensitivity
        const currentSmoothing = this.freeExploreMode ? 0.002 : this.view.spherical.smoothing // 2.5x faster smoothing
        const currentTargetSmoothing = this.freeExploreMode ? 0.002 : this.view.target.smoothing
        
        // Zoom
        this.view.spherical.value.radius += this.view.zoom.delta * currentZoomSensitivity

        // Apply limits - more relaxed in free explore mode
        if (this.freeExploreMode) {
            // Allow wider zoom range in free explore mode
            this.view.spherical.value.radius = Math.min(Math.max(this.view.spherical.value.radius, 5), 60)
        } else {
            this.view.spherical.value.radius = Math.min(Math.max(this.view.spherical.value.radius, this.view.spherical.limits.radius.min), this.view.spherical.limits.radius.max)
        }

        // Drag
        if(this.view.drag.alternative)
        {
            const up = new THREE.Vector3(0, 1, 0)
            const right = new THREE.Vector3(- 1, 0, 0)

            up.applyQuaternion(this.camera.modes.default.instance.quaternion)
            right.applyQuaternion(this.camera.modes.default.instance.quaternion)

            up.multiplyScalar(this.view.drag.delta.y * 0.01)
            right.multiplyScalar(this.view.drag.delta.x * 0.01)

            this.view.target.value.add(up)
            this.view.target.value.add(right)

            // Apply limits (always apply to keep camera in room)
            this.view.target.value.x = Math.min(Math.max(this.view.target.value.x, this.view.target.limits.x.min), this.view.target.limits.x.max)
            this.view.target.value.y = Math.min(Math.max(this.view.target.value.y, this.view.target.limits.y.min), this.view.target.limits.y.max)
            this.view.target.value.z = Math.min(Math.max(this.view.target.value.z, this.view.target.limits.z.min), this.view.target.limits.z.max)
        }
        else
        {
            this.view.spherical.value.theta -= this.view.drag.delta.x * currentDragSensitivity / this.config.smallestSide
            this.view.spherical.value.phi -= this.view.drag.delta.y * currentDragSensitivity / this.config.smallestSide    
        
            // Apply limits - skip in free explore mode for unlimited rotation
            if (!this.freeExploreMode) {
                this.view.spherical.value.theta = Math.min(Math.max(this.view.spherical.value.theta, this.view.spherical.limits.theta.min), this.view.spherical.limits.theta.max)
                this.view.spherical.value.phi = Math.min(Math.max(this.view.spherical.value.phi, this.view.spherical.limits.phi.min), this.view.spherical.limits.phi.max)
            }
        }

        this.view.drag.delta.x = 0
        this.view.drag.delta.y = 0
        this.view.zoom.delta = 0

        // Smoothing - faster in free explore mode
        this.view.spherical.smoothed.radius += (this.view.spherical.value.radius - this.view.spherical.smoothed.radius) * currentSmoothing * this.time.delta
        this.view.spherical.smoothed.phi += (this.view.spherical.value.phi - this.view.spherical.smoothed.phi) * currentSmoothing * this.time.delta
        this.view.spherical.smoothed.theta += (this.view.spherical.value.theta - this.view.spherical.smoothed.theta) * currentSmoothing * this.time.delta

        this.view.target.smoothed.x += (this.view.target.value.x - this.view.target.smoothed.x) * currentTargetSmoothing * this.time.delta
        this.view.target.smoothed.y += (this.view.target.value.y - this.view.target.smoothed.y) * currentTargetSmoothing * this.time.delta
        this.view.target.smoothed.z += (this.view.target.value.z - this.view.target.smoothed.z) * currentTargetSmoothing * this.time.delta

        // Restore original camera update logic
        const viewPosition = new THREE.Vector3();
        viewPosition.setFromSpherical(this.view.spherical.smoothed);
        viewPosition.add(this.view.target.smoothed);
        
        this.camera.modes.default.instance.position.copy(viewPosition);
        this.camera.modes.default.instance.lookAt(this.view.target.smoothed);

        // Update dev panel with camera coords if enabled
        if (this.devMode && this.devPanel) {
            const coordsDiv = this.devPanel.querySelector('#dev-coords');
            if (coordsDiv) {
                coordsDiv.textContent = `X: ${this.camera.modes.default.instance.position.x.toFixed(2)}, Y: ${this.camera.modes.default.instance.position.y.toFixed(2)}, Z: ${this.camera.modes.default.instance.position.z.toFixed(2)}`;
            }
        }
    }

    // Removed onCursorMove: camera does not follow mouse freely

    /**
     * Advanced mouse move handler for PC zoom/pan system and laptop/TV screens
     */
    onMouseMoveAdvanced(event) {
        // Don't process mouse move for zoom/pan in free explore mode
        if (this.freeExploreMode) return;
        
        const rect = this.targetElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // PC advanced zoom/pan logic
        if (this.pcZoomState === 'zoomed75') {
            // Don't process mouse leave during zoom-in animation
            if (this.isZoomingIn) return;
            
            const pcScreen = this.world.pcScreen?.model?.mesh;
            if (!pcScreen) return;
            
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            const pcIntersects = this.raycaster.intersectObject(pcScreen, true);
            
            // Track if cursor is on screen
            if (pcIntersects.length > 0) {
                this.hasEnteredScreenAfterZoom = true;
            }
            
            // Only zoom out if cursor has entered screen at least once after zoom, then leaves
            if (pcIntersects.length === 0 && this.hasEnteredScreenAfterZoom) {
                this.zoomOutTo35Percent();
            }
            return;
        }

        if (this.pcZoomState === 'zoomed35') {
            const pcScreen = this.world.pcScreen?.model?.mesh;
            if (!pcScreen) return;
            
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            const pcIntersects = this.raycaster.intersectObject(pcScreen, true);
            
            // If mouse returns to monitor, zoom back to 75%
            if (pcIntersects.length > 0) {
                this.zoomBackTo75Percent();
                return;
            }
            
            // Otherwise, handle horizontal pan based on mouse X position
            const mouseXNormalized = (event.clientX - rect.left) / rect.width; // 0 to 1
            
            // Pan left if mouse is on left side (< 0.3), pan right if on right side (> 0.7)
            if (mouseXNormalized < 0.3) {
                this.panCameraLeft();
            } else if (mouseXNormalized > 0.7) {
                this.panCameraRight();
            }
            return;
        }

        // Laptop logic - zoom out when mouse leaves
        if (this.laptopZoomed && this.laptopZoomInComplete) {
            const laptopScreen = this.world.macScreen?.model?.mesh;
            if (!laptopScreen) return;
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            const laptopIntersects = this.raycaster.intersectObject(laptopScreen, true);
            if (laptopIntersects.length === 0) {
                this.zoomOutFromLaptop();
            }
            return;
        }

        // Sofa logic - pan left/right and zoom out when mouse leaves
        if (this.sofaZoomed && this.sofaZoomInComplete) {
            const sofaMesh = this.world.topChair?.model?.group;
            if (!sofaMesh) return;
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            const sofaIntersects = this.raycaster.intersectObject(sofaMesh, true);
            
            if (sofaIntersects.length === 0) {
                // Mouse left sofa, zoom out
                this.zoomOutFromSofa();
            } else {
                // Mouse on sofa, handle horizontal pan based on mouse X position
                const mouseXNormalized = (event.clientX - rect.left) / rect.width; // 0 to 1
                
                // Pan left if mouse is on left side (< 0.3), pan right if on right side (> 0.7)
                if (mouseXNormalized < 0.3) {
                    this.panSofaCameraLeft();
                } else if (mouseXNormalized > 0.7) {
                    this.panSofaCameraRight();
                }
            }
            return;
        }

        // TV logic
        if (this.tvZoomed && this.tvZoomInComplete) {
            const tvMesh = this.world.tvMesh;
            if (!tvMesh) return;
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            const tvIntersects = this.raycaster.intersectObject(tvMesh, true);
            if (tvIntersects.length === 0) {
                this.zoomOutBackwardsFromTV();
            }
            return;
        }
    }

    /**
     * Click handler: Advanced PC zoom system + laptop/sofa zoom
     */
    onClick(event) {
        // Don't process clicks in free explore mode
        if (this.freeExploreMode) return;
        
        // Don't process clicks until 2 seconds after START button
        if (!this.clickEnabled) return;
        
        // Get pointer position normalized
        const rect = this.targetElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // If in any zoomed state, check if clicking away to return
        if (this.pcZoomState !== 'none' || this.laptopZoomed || this.sofaZoomed) {
            // Check if clicking on the currently zoomed object
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            
            let clickedOnCurrentObject = false;
            
            // Check PC screen
            if (this.pcZoomState !== 'none') {
                const pcScreen = this.world.pcScreen?.model?.mesh;
                if (pcScreen) {
                    const pcIntersects = this.raycaster.intersectObject(pcScreen, true);
                    if (pcIntersects.length > 0) {
                        clickedOnCurrentObject = true;
                    }
                }
            }
            
            // Check laptop screen
            if (this.laptopZoomed) {
                const laptopScreen = this.world.macScreen?.model?.mesh;
                if (laptopScreen) {
                    const laptopIntersects = this.raycaster.intersectObject(laptopScreen, true);
                    if (laptopIntersects.length > 0) {
                        clickedOnCurrentObject = true;
                    }
                }
            }
            
            // Check sofa
            if (this.sofaZoomed) {
                const sofaMesh = this.world.topChair?.model?.group;
                if (sofaMesh) {
                    const sofaIntersects = this.raycaster.intersectObject(sofaMesh, true);
                    if (sofaIntersects.length > 0) {
                        clickedOnCurrentObject = true;
                    }
                }
            }
            
            // If clicking on current object, stay in current state
            if (clickedOnCurrentObject) {
                return;
            }
            
            // If clicking anywhere else, return to original position
            this.returnToOriginalPosition();
            return;
        }

        // Check laptop screen for zoom
        const laptopScreen = this.world.macScreen?.model?.mesh;
        if (laptopScreen) {
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            const laptopIntersects = this.raycaster.intersectObject(laptopScreen, true);
            if (laptopIntersects.length > 0) {
                this.zoomToLaptop();
                
                // Dismiss the "Click anywhere" prompt
                const clickPrompt = document.getElementById('click-prompt');
                if (clickPrompt && clickPrompt.style.display !== 'none') {
                    clickPrompt.classList.add('fade-out');
                    setTimeout(() => {
                        clickPrompt.style.display = 'none';
                    }, 500);
                    
                    // Start showing info panel
                    if (window.showInfoPanel) {
                        window.showInfoPanel();
                    }
                }
                return;
            }
        }

        // Check sofa for zoom
        const sofaMesh = this.world.topChair?.model?.group;
        if (sofaMesh) {
            this.raycaster.setFromCamera(this.pointer, this.camera.instance);
            const sofaIntersects = this.raycaster.intersectObject(sofaMesh, true);
            if (sofaIntersects.length > 0) {
                this.zoomToSofa();
                
                // Dismiss the "Click anywhere" prompt
                const clickPrompt = document.getElementById('click-prompt');
                if (clickPrompt && clickPrompt.style.display !== 'none') {
                    clickPrompt.classList.add('fade-out');
                    setTimeout(() => {
                        clickPrompt.style.display = 'none';
                    }, 500);
                    
                    // Start showing info panel
                    if (window.showInfoPanel) {
                        window.showInfoPanel();
                    }
                }
                return;
            }
        }

        // Default: Click anywhere else zooms to PC monitor
        this.zoomToPCAt75Percent();
        
        // Dismiss the "Click anywhere" prompt
        const clickPrompt = document.getElementById('click-prompt');
        if (clickPrompt && clickPrompt.style.display !== 'none') {
            clickPrompt.classList.add('fade-out');
            setTimeout(() => {
                clickPrompt.style.display = 'none';
            }, 500);
            
            // Start showing info panel
            if (window.showInfoPanel) {
                window.showInfoPanel();
            }
        }
    }

    /**
     * Zoom in on the given screen mesh (PC/laptop)
     */
    zoomInOnScreen(mesh) {
        if (!this.zoomedScreen) {
            this.defaultCameraState = {
                radius: this.view.spherical.value.radius,
                phi: this.view.spherical.value.phi,
                theta: this.view.spherical.value.theta,
                target: this.view.target.value.clone()
            };
        }
        this.zoomedScreen = mesh;

        // Get mesh world position and orientation
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());
        // Calculate distance so the screen fills ~98% of viewport (closer zoom)
        const screenMax = Math.max(size.x, size.y);
        const fov = this.camera.instance.fov * Math.PI / 180;
        const distance = (screenMax / (2 * Math.tan(fov / 2))) * 1.02; // 98% fill, closer

        // Use a fixed direction for each screen to avoid obstacles
        let direction = new THREE.Vector3(0, 0, 1); // Default: +Z
        if (mesh === this.world.macScreen?.model?.mesh) {
            direction = new THREE.Vector3(-1, 0, 0); // Laptop: -X (adjust if needed)
        }
        // Optionally, add a small upward offset to avoid low obstacles
        const upwardOffset = new THREE.Vector3(0, 0.1 * size.y, 0);

        // Camera position: in front of the screen, with upward offset
        const camPos = center.clone().add(direction.clone().multiplyScalar(distance)).add(upwardOffset);

        // Animate camera to this position and look at center
        gsap.to(this.camera.modes.default.instance.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            }
        });
        gsap.to(this.view.target.value, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        });
    }

    /**
     * Zoom out to previous/default camera state
     */
    zoomOutFromScreen() {
        if (!this.zoomedScreen || !this.defaultCameraState) return;
        gsap.to(this.view.spherical.value, {
            radius: this.defaultCameraState.radius,
            phi: this.defaultCameraState.phi,
            theta: this.defaultCameraState.theta,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        });
        gsap.to(this.view.target.value, {
            x: this.defaultCameraState.target.x,
            y: this.defaultCameraState.target.y,
            z: this.defaultCameraState.target.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onComplete: () => {
                this.zoomedScreen = null;
                this.defaultCameraState = null;
            }
        });
    }

    /**
     * Smoothly move camera to focus on the given mesh
     */
    focusOnObject(mesh) {
        // Get mesh world position and bounding sphere
        const box = new THREE.Box3().setFromObject(mesh)
        const center = new THREE.Vector3()
        box.getCenter(center)
        const size = box.getSize(new THREE.Vector3()).length()
        const distance = Math.max(size * 1.5, 6)

        // Calculate spherical coordinates to look at the object from the current angle
        const phi = Math.PI / 4 // 45 deg from above
        const theta = 0 // in front

        // Animate spherical and target
        gsap.to(this.view.spherical.value, {
            radius: distance,
            phi: phi,
            theta: theta,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        })
        gsap.to(this.view.target.value, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        })
    }

    /**
     * Advanced PC Zoom System Functions
     */
    
    // Zoom to PC monitor - top and bottom edges reach screen edges
    zoomToPCAt75Percent() {
        const pcScreen = this.world.pcScreen?.model?.mesh;
        if (!pcScreen) return;

        // Save original camera state
        if (!this.defaultCameraState) {
            this.defaultCameraState = {
                position: this.camera.modes.default.instance.position.clone(),
                spherical: {
                    radius: this.view.spherical.value.radius,
                    phi: this.view.spherical.value.phi,
                    theta: this.view.spherical.value.theta
                },
                target: this.view.target.value.clone()
            };
        }

        this.pcZoomState = 'zoomed75';
        this.isZoomingIn = true; // Mark as zooming in
        this.hasEnteredScreenAfterZoom = false; // Reset the flag

        // Get PC screen center
        const box = new THREE.Box3().setFromObject(pcScreen);
        const center = new THREE.Vector3();
        box.getCenter(center);
        this.pcScreenCenter = center;

        const size = box.getSize(new THREE.Vector3());
        
        // Calculate distance so top/bottom edges reach screen edges
        const screenMax = Math.max(size.x, size.y);
        const fov = this.camera.instance.fov * Math.PI / 180;
        const distance = (screenMax / (2 * Math.tan(fov / 2))) * 0.58; // Edges reach screen

        // Position camera in front of screen
        const camPos = center.clone().add(new THREE.Vector3(0, 0.2, distance));

        gsap.to(this.camera.modes.default.instance.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 1.5,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            },
            onComplete: () => {
                this.isZoomingIn = false; // Zoom in complete
            }
        });
    }

    // Zoom out to 35-40% screen coverage (chair visible)
    zoomOutTo35Percent() {
        if (this.pcZoomState !== 'zoomed75') return;
        
        this.pcZoomState = 'zoomed35';

        const pcScreen = this.world.pcScreen?.model?.mesh;
        if (!pcScreen) return;

        const box = new THREE.Box3().setFromObject(pcScreen);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());

        // Calculate distance for 35% screen coverage (chair visible - like current view)
        const screenMax = Math.max(size.x, size.y);
        const fov = this.camera.instance.fov * Math.PI / 180;
        const distance = (screenMax / (2 * Math.tan(fov / 2))) * 1.05; // Chair visible

        // Move camera back along same angle
        const currentPos = this.camera.modes.default.instance.position.clone();
        const direction = currentPos.clone().sub(center).normalize();
        const newPos = center.clone().add(direction.multiplyScalar(distance));

        gsap.to(this.camera.modes.default.instance.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            }
        });
    }
    
    // Helper functions for iframe overlay
    showPCIframe() {
        if (this.world.pcScreen && this.world.pcScreen.isWebsite) {
            // Calculate screen position in viewport
            const rect = this.targetElement.getBoundingClientRect();
            this.world.pcScreen.showIframe({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            });
        }
    }
    
    hidePCIframe() {
        if (this.world.pcScreen && this.world.pcScreen.isWebsite) {
            this.world.pcScreen.hideIframe();
        }
    }

    // Zoom back to close view when mouse returns to monitor - edges reach screen
    zoomBackTo75Percent() {
        if (this.pcZoomState !== 'zoomed35') return;
        
        this.pcZoomState = 'zoomed75';
        this.isZoomingIn = true; // Mark as zooming in
        this.hasEnteredScreenAfterZoom = false; // Reset the flag

        const pcScreen = this.world.pcScreen?.model?.mesh;
        if (!pcScreen) return;

        const box = new THREE.Box3().setFromObject(pcScreen);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());

        // Calculate distance so top/bottom edges reach screen edges
        const screenMax = Math.max(size.x, size.y);
        const fov = this.camera.instance.fov * Math.PI / 180;
        const distance = (screenMax / (2 * Math.tan(fov / 2))) * 0.58; // Edges reach screen

        // Move camera forward along same angle
        const currentPos = this.camera.modes.default.instance.position.clone();
        const direction = currentPos.clone().sub(center).normalize();
        const newPos = center.clone().add(direction.multiplyScalar(distance));

        gsap.to(this.camera.modes.default.instance.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            },
            onComplete: () => {
                this.isZoomingIn = false; // Zoom in complete
            }
        });
    }

    // Pan camera left (same angle and level)
    panCameraLeft() {
        if (this.pcZoomState !== 'zoomed35') return;
        
        const currentPos = this.camera.modes.default.instance.position;
        const targetX = currentPos.x - 0.02; // Smooth continuous pan

        gsap.to(this.camera.modes.default.instance.position, {
            x: targetX,
            duration: 0.3,
            overwrite: 'auto',
            ease: 'power1.out',
            onUpdate: () => {
                if (this.pcScreenCenter) {
                    this.camera.modes.default.instance.lookAt(this.pcScreenCenter);
                }
            }
        });
    }

    // Pan camera right (same angle and level)
    panCameraRight() {
        if (this.pcZoomState !== 'zoomed35') return;
        
        const currentPos = this.camera.modes.default.instance.position;
        const targetX = currentPos.x + 0.02; // Smooth continuous pan

        gsap.to(this.camera.modes.default.instance.position, {
            x: targetX,
            duration: 0.3,
            overwrite: 'auto',
            ease: 'power1.out',
            onUpdate: () => {
                if (this.pcScreenCenter) {
                    this.camera.modes.default.instance.lookAt(this.pcScreenCenter);
                }
            }
        });
    }

    // Return to original position with visible reverse motion from CURRENT position
    returnToOriginalPosition() {
        if (!this.defaultCameraState) return;
        
        // IMMEDIATELY set states to returning to block update() interference
        const wasPC = this.pcZoomState !== 'none';
        const wasLaptop = this.laptopZoomed;
        const wasSofa = this.sofaZoomed;
        
        this.pcZoomState = 'returning';
        this.laptopZoomed = false;
        this.laptopZoomInComplete = false;
        this.sofaZoomed = false;
        this.sofaZoomInComplete = false;

        // Kill any ongoing animations FIRST
        gsap.killTweensOf(this.camera.modes.default.instance.position);
        gsap.killTweensOf(this.view.target.value);

        // Get CURRENT camera position RIGHT NOW (before anything else happens)
        const startPos = this.camera.modes.default.instance.position.clone();
        const endPos = this.defaultCameraState.position.clone();
        
        // Get CURRENT target RIGHT NOW
        const startTarget = this.view.target.value.clone();
        const endTarget = this.defaultCameraState.target.clone();

        console.log('Return animation starting from:', startPos);
        console.log('Return animation going to:', endPos);

        // Animate both position and target together for visible motion
        const animObj = { progress: 0 };
        
        gsap.to(animObj, {
            progress: 1,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                const t = animObj.progress;
                
                // Interpolate position from CURRENT to original
                const newPos = new THREE.Vector3().lerpVectors(startPos, endPos, t);
                this.camera.modes.default.instance.position.copy(newPos);
                
                // Interpolate target from CURRENT to original
                const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, t);
                this.view.target.value.copy(currentTarget);
                
                // Update camera lookAt
                this.camera.modes.default.instance.lookAt(currentTarget);
            },
            onComplete: () => {
                // Restore spherical values
                this.view.spherical.value.radius = this.defaultCameraState.spherical.radius;
                this.view.spherical.value.phi = this.defaultCameraState.spherical.phi;
                this.view.spherical.value.theta = this.defaultCameraState.spherical.theta;
                this.view.spherical.smoothed.copy(this.view.spherical.value);
                
                this.view.target.value.copy(this.defaultCameraState.target);
                this.view.target.smoothed.copy(this.defaultCameraState.target);
                
                this.pcZoomState = 'none';
                this.pcScreenCenter = null;
                this.sofaCenter = null;
                
                console.log('Return animation complete');
            }
        });
    }

    /**
     * Old PC zoom functions (kept for reference, not used in new system)
     */

    zoomInOnLaptop() {
        if (this.laptopZoomed) return;
        this.laptopZoomed = true;
        this.laptopZoomInComplete = false;
        // Well-composed position and look-at for laptop
        const laptopScreen = this.world.macScreen?.model?.mesh;
        const box = new THREE.Box3().setFromObject(laptopScreen);
        const center = new THREE.Vector3();
        box.getCenter(center);
        // Use a fixed direction: slightly left (-X), slightly above, and closer (+Z)
        const camPos = center.clone().add(new THREE.Vector3(-0.3, 0.2, 4.0));
        gsap.to(this.camera.modes.default.instance.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            },
            onComplete: () => {
                this.laptopZoomInComplete = true;
            }
        });
        gsap.to(this.view.target.value, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        });
    }

    zoomOutBackwardsFromLaptop() {
        if (!this.laptopZoomed || !this.laptopZoomInComplete) return;
        this.laptopZoomed = false;
        this.laptopZoomInComplete = false;
        const laptopScreen = this.world.macScreen?.model?.mesh;
        if (!laptopScreen) return;
        const box = new THREE.Box3().setFromObject(laptopScreen);
        const center = new THREE.Vector3();
        box.getCenter(center);
        // Move camera straight back by 4.0 units from current zoomed-in position
        const camPos = this.camera.modes.default.instance.position.clone();
        const backDir = camPos.clone().sub(center).normalize();
        const newPos = camPos.clone().add(backDir.multiplyScalar(4.0));
        gsap.to(this.camera.modes.default.instance.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            },
            onComplete: () => {
                this.view.target.value.copy(center);
                this.view.spherical.value.radius = newPos.distanceTo(center);
                const offset = newPos.clone().sub(center);
                const spherical = new THREE.Spherical().setFromVector3(offset);
                this.view.spherical.value.theta = spherical.theta;
                this.view.spherical.value.phi = spherical.phi;
                this.view.spherical.smoothed.copy(this.view.spherical.value);
                this.view.target.smoothed.copy(center);
            }
        });
        gsap.to(this.view.target.value, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        });
    }

    zoomInOnTV() {
        if (this.tvZoomed) return;
        this.defaultCameraState = {
            radius: this.view.spherical.value.radius,
            phi: this.view.spherical.value.phi,
            theta: this.view.spherical.value.theta,
            target: this.view.target.value.clone()
        };
        this.tvZoomed = true;
        this.tvZoomInComplete = false;
        // Use the bouncingLogo mesh as the TV
        const tvMesh = this.world.bouncingLogo?.model?.mesh;
        if (!tvMesh) {
            console.error('bouncingLogo (TV) mesh not found!');
            return;
        }
        console.log('Using bouncingLogo (TV) mesh for zoom:', tvMesh);
        const box = new THREE.Box3().setFromObject(tvMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());
        // Calculate distance so the TV fills ~98% of viewport (like PC/laptop)
        const screenMax = Math.max(size.x, size.y);
        const fov = this.camera.instance.fov * Math.PI / 180;
        const distance = (screenMax / (2 * Math.tan(fov / 2))) * 1.02; // 98% fill
        // Get the TV's world normal (assume its local +Z is the screen normal)
        const normal = new THREE.Vector3(0, 0, 1); // local +Z
        tvMesh.getWorldDirection(normal); // normal now points out of the TV screen
        // Optionally, add a small upward offset
        const upwardOffset = new THREE.Vector3(0, 0.1 * size.y, 0);
        const camPos = center.clone().add(normal.clone().multiplyScalar(distance)).add(upwardOffset);
        gsap.to(this.camera.modes.default.instance.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            },
            onComplete: () => {
                this.tvZoomInComplete = true;
            }
        });
        gsap.to(this.view.target.value, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        });
    }

    zoomOutBackwardsFromTV() {
        if (!this.tvZoomed || !this.tvZoomInComplete) return;
        this.tvZoomed = false;
        this.tvZoomInComplete = false;
        this.zoomedScreen = null;
        // Restore previous camera state
        if (this.defaultCameraState) {
            gsap.to(this.view.spherical.value, {
                radius: this.defaultCameraState.radius,
                phi: this.defaultCameraState.phi,
                theta: this.defaultCameraState.theta,
                duration: 1.2,
                overwrite: true,
                ease: 'power2.inOut',
            });
            gsap.to(this.view.target.value, {
                x: this.defaultCameraState.target.x,
                y: this.defaultCameraState.target.y,
                z: this.defaultCameraState.target.z,
                duration: 1.2,
                overwrite: true,
                ease: 'power2.inOut',
            });
        }
    }

    zoomToDevCoords(x, y, z) {
        // Default: look at TV mesh center if available
        let lookAtTarget = new THREE.Vector3(0, 0, 0);
        const tvMesh = this.world.tvMesh;
        if (tvMesh) {
            const box = new THREE.Box3().setFromObject(tvMesh);
            box.getCenter(lookAtTarget);
        }
        gsap.to(this.camera.modes.default.instance.position, {
            x,
            y,
            z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(lookAtTarget);
            }
        });
        gsap.to(this.view.target.value, {
            x: lookAtTarget.x,
            y: lookAtTarget.y,
            z: lookAtTarget.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut'
        });
    }

    // New zoom functions for laptop and sofa
    zoomToLaptop() {
        if (this.laptopZoomed) return;
        
        // Save original camera state
        if (!this.defaultCameraState) {
            this.defaultCameraState = {
                position: this.camera.modes.default.instance.position.clone(),
                spherical: {
                    radius: this.view.spherical.value.radius,
                    phi: this.view.spherical.value.phi,
                    theta: this.view.spherical.value.theta
                },
                target: this.view.target.value.clone()
            };
        }
        
        this.laptopZoomed = true;
        this.laptopZoomInComplete = false;
        
        const laptopScreen = this.world.macScreen?.model?.mesh;
        if (!laptopScreen) return;
        
        const box = new THREE.Box3().setFromObject(laptopScreen);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());
        
        // Calculate distance for smooth zoom (like PC monitor)
        const screenMax = Math.max(size.x, size.y);
        const fov = this.camera.instance.fov * Math.PI / 180;
        const distance = (screenMax / (2 * Math.tan(fov / 2))) * 0.65;
        
        // Position camera in front of laptop screen
        const camPos = center.clone().add(new THREE.Vector3(-0.2, 0.3, distance));
        
        gsap.to(this.camera.modes.default.instance.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 1.5,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            },
            onComplete: () => {
                this.laptopZoomInComplete = true;
            }
        });
    }
    
    zoomOutFromLaptop() {
        if (!this.laptopZoomed || !this.laptopZoomInComplete) return;
        this.laptopZoomed = false;
        this.laptopZoomInComplete = false;
        
        const laptopScreen = this.world.macScreen?.model?.mesh;
        if (!laptopScreen) return;
        
        const box = new THREE.Box3().setFromObject(laptopScreen);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Zoom out smoothly
        const currentPos = this.camera.modes.default.instance.position.clone();
        const direction = currentPos.clone().sub(center).normalize();
        const newPos = currentPos.clone().add(direction.multiplyScalar(3.0));
        
        gsap.to(this.camera.modes.default.instance.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            }
        });
    }
    
    zoomToSofa() {
        if (this.sofaZoomed) return;
        
        // Save original camera state
        if (!this.defaultCameraState) {
            this.defaultCameraState = {
                position: this.camera.modes.default.instance.position.clone(),
                spherical: {
                    radius: this.view.spherical.value.radius,
                    phi: this.view.spherical.value.phi,
                    theta: this.view.spherical.value.theta
                },
                target: this.view.target.value.clone()
            };
        }
        
        this.sofaZoomed = true;
        this.sofaZoomInComplete = false;
        
        const sofaMesh = this.world.topChair?.model?.group;
        if (!sofaMesh) return;
        
        const box = new THREE.Box3().setFromObject(sofaMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        this.sofaCenter = center;
        
        // Camera position from your screenshot: looking at sofa from front-right
        // Position: approximately (1.5, 2.8, 1.5) looking at sofa center
        const camPos = new THREE.Vector3(1.5, 2.8, 1.5);
        
        gsap.to(this.camera.modes.default.instance.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 1.5,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(center);
            },
            onComplete: () => {
                this.sofaZoomInComplete = true;
            }
        });
    }
    
    zoomOutFromSofa() {
        if (!this.sofaZoomed || !this.sofaZoomInComplete) return;
        this.sofaZoomed = false;
        this.sofaZoomInComplete = false;
        
        if (!this.sofaCenter) return;
        
        // Zoom out smoothly
        const currentPos = this.camera.modes.default.instance.position.clone();
        const direction = currentPos.clone().sub(this.sofaCenter).normalize();
        const newPos = currentPos.clone().add(direction.multiplyScalar(3.0));
        
        gsap.to(this.camera.modes.default.instance.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: 1.2,
            overwrite: true,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.modes.default.instance.lookAt(this.sofaCenter);
            }
        });
    }
    
    panSofaCameraLeft() {
        if (!this.sofaZoomed) return;
        
        const currentPos = this.camera.modes.default.instance.position;
        const targetX = currentPos.x - 0.02;
        
        gsap.to(this.camera.modes.default.instance.position, {
            x: targetX,
            duration: 0.3,
            overwrite: 'auto',
            ease: 'power1.out',
            onUpdate: () => {
                if (this.sofaCenter) {
                    this.camera.modes.default.instance.lookAt(this.sofaCenter);
                }
            }
        });
    }
    
    panSofaCameraRight() {
        if (!this.sofaZoomed) return;
        
        const currentPos = this.camera.modes.default.instance.position;
        const targetX = currentPos.x + 0.02;
        
        gsap.to(this.camera.modes.default.instance.position, {
            x: targetX,
            duration: 0.3,
            overwrite: 'auto',
            ease: 'power1.out',
            onUpdate: () => {
                if (this.sofaCenter) {
                    this.camera.modes.default.instance.lookAt(this.sofaCenter);
                }
            }
        });
    }

    createDevPanel() {
        // Create a simple overlay panel
        this.devPanel = document.createElement('div');
        const panel = this.devPanel;
        panel.style.position = 'fixed';
        panel.style.top = '20px';
        panel.style.right = '20px';
        panel.style.background = 'rgba(30,30,30,0.95)';
        panel.style.color = '#fff';
        panel.style.padding = '16px';
        panel.style.zIndex = 9999;
        panel.style.borderRadius = '8px';
        panel.style.fontFamily = 'monospace';
        panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:8px;">Dev Camera Info</div>
            <div id="dev-coords">X: 0, Y: 0, Z: 0</div>
        `;
        document.body.appendChild(panel);
    }
    removeDevPanel() {
        if (this.devPanel) {
            this.devPanel.remove();
            this.devPanel = null;
        }
    }
}