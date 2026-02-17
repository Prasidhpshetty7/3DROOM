import * as THREE from 'three'

import Experience from './Experience.js'

export default class Screen
{
    constructor(_mesh, _sourcePath)
    {
        this.experience = new Experience()
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.scene = this.experience.scene
        this.world = this.experience.world

        this.mesh = _mesh
        this.sourcePath = _sourcePath

        this.setModel()
    }

    setModel()
    {
        this.model = {}

        // Check if source is a website URL (starts with http)
        const isWebsite = this.sourcePath.startsWith('http://') || this.sourcePath.startsWith('https://');

        if (isWebsite) {
            // Create iframe for website
            this.model.element = document.createElement('iframe')
            this.model.element.src = this.sourcePath
            this.model.element.style.width = '1920px'
            this.model.element.style.height = '1080px'
            this.model.element.style.border = 'none'
            this.model.element.style.position = 'absolute'
            this.model.element.style.top = '0'
            this.model.element.style.left = '0'
            this.model.element.style.pointerEvents = 'none'
            this.model.element.style.visibility = 'hidden'
            this.model.element.style.zIndex = '10'
            this.model.element.style.transformOrigin = 'top left'
            document.body.appendChild(this.model.element)

            // Create canvas for rendering
            const canvas = document.createElement('canvas')
            canvas.width = 1920
            canvas.height = 1080
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(0, 0, 1920, 1080)

            // Create texture from canvas
            this.model.texture = new THREE.CanvasTexture(canvas)
            this.model.texture.encoding = THREE.sRGBEncoding
            this.model.canvas = canvas
            this.model.ctx = ctx
            
            this.isWebsite = true
        } else {
            // Original video element
            this.model.element = document.createElement('video')
            this.model.element.muted = true
            this.model.element.loop = true
            this.model.element.controls = true
            this.model.element.playsInline = true
            this.model.element.autoplay = true
            this.model.element.src = this.sourcePath
            this.model.element.play()

            // Texture
            this.model.texture = new THREE.VideoTexture(this.model.element)
            this.model.texture.encoding = THREE.sRGBEncoding
            
            this.isWebsite = false
        }
        
        // Material
        this.model.material = new THREE.MeshBasicMaterial({
            map: this.model.texture
        })

        // Mesh
        this.model.mesh = this.mesh
        this.model.mesh.material = this.model.material
        this.scene.add(this.model.mesh)
    }
    
    updateIframePosition() {
        if (!this.isWebsite || !this.model.element) return;
        
        const mesh = this.model.mesh;
        if (!mesh) return;
        
        const camera = this.experience.camera.instance;
        const canvas = this.experience.renderer.instance.domElement;
        
        const geometry = mesh.geometry;
        if (!geometry) return;
        
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        
        const corners = [
            new THREE.Vector3(box.min.x, box.max.y, 0),
            new THREE.Vector3(box.max.x, box.max.y, 0),
            new THREE.Vector3(box.max.x, box.min.y, 0),
            new THREE.Vector3(box.min.x, box.min.y, 0)
        ];
        
        corners.forEach(corner => {
            corner.applyMatrix4(mesh.matrixWorld);
            corner.project(camera);
            corner.x = (corner.x + 1) / 2 * canvas.clientWidth;
            corner.y = -(corner.y - 1) / 2 * canvas.clientHeight;
        });
        
        const minX = Math.min(...corners.map(c => c.x));
        const maxX = Math.max(...corners.map(c => c.x));
        const minY = Math.min(...corners.map(c => c.y));
        const maxY = Math.max(...corners.map(c => c.y));
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Only show iframe if it's visible on screen
        if (width > 10 && height > 10) {
            this.model.element.style.left = minX + 'px';
            this.model.element.style.top = minY + 'px';
            this.model.element.style.width = width + 'px';
            this.model.element.style.height = height + 'px';
            this.model.element.style.visibility = 'visible';
        } else {
            this.model.element.style.visibility = 'hidden';
        }
    }

    update()
    {
        if (this.isWebsite) {
            this.updateIframePosition();
        }
    }
}
