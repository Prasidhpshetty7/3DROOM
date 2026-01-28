import * as THREE from 'three'
import Experience from './Experience.js'
import normalizeWheel from 'normalize-wheel'
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
    }

    setView()
    {
        this.view = {}
        this.view.spherical = {}
        this.view.spherical.value = new THREE.Spherical(32, Math.PI * 0.35, - Math.PI * 0.22)
        this.view.spherical.smoothed = this.view.spherical.value.clone()
        this.view.spherical.smoothing = 0.0008
        this.view.spherical.limits = {}
        this.view.spherical.limits.radius = { min: 10, max: 50 }
        this.view.spherical.limits.phi = { min: Math.PI * 0.15, max: Math.PI * 0.44 }
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
        this.view.target.smoothed = this.view.target.value.clone()
        this.view.target.smoothing = 0.0008

        this.view.drag = {}
        this.view.drag.delta = { x: 0, y: 0 }
        this.view.drag.previous = { x: 0, y: 0 }
        this.view.drag.sensitivity = 2

        this.view.zoom = {}
        this.view.zoom.sensitivity = 0.01
        this.view.zoom.delta = 0

        this.view.onMouseDown = (_event) =>
        {
            _event.preventDefault()
            this.view.drag.previous.x = _event.clientX
            this.view.drag.previous.y = _event.clientY
            window.addEventListener('mouseup', this.view.onMouseUp)
            window.addEventListener('mousemove', this.view.onMouseMove)
        }

        this.view.onMouseMove = (_event) =>
        {
            _event.preventDefault()
            this.view.drag.delta.x += _event.clientX - this.view.drag.previous.x
            this.view.drag.delta.y += _event.clientY - this.view.drag.previous.y
            this.view.drag.previous.x = _event.clientX
            this.view.drag.previous.y = _event.clientY
        }

        this.view.onMouseUp = (_event) =>
        {
            _event.preventDefault()
            window.removeEventListener('mouseup', this.view.onMouseUp)
            window.removeEventListener('mousemove', this.view.onMouseMove)
        }

        this.targetElement.addEventListener('mousedown', this.view.onMouseDown)

        this.view.onWheel = (_event) =>
        {
            _event.preventDefault()
            const normalized = normalizeWheel(_event)
            this.view.zoom.delta += normalized.pixelY
        }
        
        window.addEventListener('wheel', this.view.onWheel, { passive: false })
    }

    update()
    {
        this.view.spherical.value.radius += this.view.zoom.delta * this.view.zoom.sensitivity
        this.view.spherical.value.radius = Math.min(Math.max(this.view.spherical.value.radius, this.view.spherical.limits.radius.min), this.view.spherical.limits.radius.max)

        this.view.spherical.value.theta -= this.view.drag.delta.x * this.view.drag.sensitivity / this.config.smallestSide
        this.view.spherical.value.phi -= this.view.drag.delta.y * this.view.drag.sensitivity / this.config.smallestSide    
    
        this.view.spherical.value.theta = Math.min(Math.max(this.view.spherical.value.theta, this.view.spherical.limits.theta.min), this.view.spherical.limits.theta.max)
        this.view.spherical.value.phi = Math.min(Math.max(this.view.spherical.value.phi, this.view.spherical.limits.phi.min), this.view.spherical.limits.phi.max)

        this.view.drag.delta.x = 0
        this.view.drag.delta.y = 0
        this.view.zoom.delta = 0

        this.view.spherical.smoothed.radius += (this.view.spherical.value.radius - this.view.spherical.smoothed.radius) * this.view.spherical.smoothing * this.time.delta
        this.view.spherical.smoothed.phi += (this.view.spherical.value.phi - this.view.spherical.smoothed.phi) * this.view.spherical.smoothing * this.time.delta
        this.view.spherical.smoothed.theta += (this.view.spherical.value.theta - this.view.spherical.smoothed.theta) * this.view.spherical.smoothing * this.time.delta

        this.view.target.smoothed.x += (this.view.target.value.x - this.view.target.smoothed.x) * this.view.target.smoothing * this.time.delta
        this.view.target.smoothed.y += (this.view.target.value.y - this.view.target.smoothed.y) * this.view.target.smoothing * this.time.delta
        this.view.target.smoothed.z += (this.view.target.value.z - this.view.target.smoothed.z) * this.view.target.smoothing * this.time.delta

        const viewPosition = new THREE.Vector3()
        viewPosition.setFromSpherical(this.view.spherical.smoothed)
        viewPosition.add(this.view.target.smoothed)

        this.camera.modes.default.instance.position.copy(viewPosition)
        this.camera.modes.default.instance.lookAt(this.view.target.smoothed)
    }
}
