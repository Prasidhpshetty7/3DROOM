import * as THREE from 'three'
import Experience from './Experience.js'
import Baked from './Baked.js'
import GoogleLeds from './GoogleLeds.js'
import LoupedeckButtons from './LoupedeckButtons.js'
import CoffeeSteam from './CoffeeSteam.js'
import TopChair from './TopChair.js'
import ElgatoLight from './ElgatoLight.js'
import BouncingLogo from './BouncingLogo.js'
import Screen from './Screen.js'

export default class World
{
    constructor(_options)
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        
        this.resources.on('groupEnd', (_group) =>
        {
            if(_group.name === 'base')
            {
                this.setBaked()
                this.setGoogleLeds()
                this.setLoupedeckButtons()
                this.setCoffeeSteam()
                this.setTopChair()
                this.setElgatoLight()
                this.setBouncingLogo()
                this.setScreens()
            }
        })
    }

    setBaked()
    {
        this.baked = new Baked()

        // Track ground elements for theme toggle
        this.groundElements = []

        // Add ground plane - very large so edges aren't visible
        const groundGeometry = new THREE.PlaneGeometry(200, 200)
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xe8e8e8
        })
        const ground = new THREE.Mesh(groundGeometry, groundMaterial)
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -0.01
        ground.visible = false
        this.scene.add(ground)
        this.groundElements.push(ground)

        // Create soft radial gradient shadow using canvas texture
        const shadowCanvas = document.createElement('canvas')
        shadowCanvas.width = 512
        shadowCanvas.height = 512
        const ctx = shadowCanvas.getContext('2d')
        
        // Create radial gradient - subtle shadow under the room
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)')
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)')
        gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.03)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)
        
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
        
        const shadowGeometry = new THREE.PlaneGeometry(14, 14)
        const shadowMaterial = new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,
            depthWrite: false
        })
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
        shadow.rotation.x = -Math.PI / 2
        shadow.position.y = 0.01
        shadow.position.x = 0.5
        shadow.position.z = 0
        shadow.visible = false
        this.scene.add(shadow)
        this.groundElements.push(shadow)

        // Add wall shadow on the left side (light from camera/front-right)
        const wallShadowCanvas = document.createElement('canvas')
        wallShadowCanvas.width = 256
        wallShadowCanvas.height = 256
        const wallCtx = wallShadowCanvas.getContext('2d')
        
        // Linear gradient for wall shadow - fades to the left
        const wallGradient = wallCtx.createLinearGradient(256, 0, 0, 0)
        wallGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)')
        wallGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.12)')
        wallGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.05)')
        wallGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        wallCtx.fillStyle = wallGradient
        wallCtx.fillRect(0, 0, 256, 256)
        
        const wallShadowTexture = new THREE.CanvasTexture(wallShadowCanvas)
        
        // Left side shadow (light from front-right, shadow falls left)
        const leftShadowGeo = new THREE.PlaneGeometry(5, 10)
        const leftShadowMat = new THREE.MeshBasicMaterial({
            map: wallShadowTexture,
            transparent: true,
            depthWrite: false
        })
        const leftShadow = new THREE.Mesh(leftShadowGeo, leftShadowMat)
        leftShadow.rotation.x = -Math.PI / 2
        leftShadow.position.set(-5, 0.02, -1)
        leftShadow.visible = false
        this.scene.add(leftShadow)
        this.groundElements.push(leftShadow)

        // Back shadow (light from front, shadow falls back)
        const backShadowCanvas = document.createElement('canvas')
        backShadowCanvas.width = 256
        backShadowCanvas.height = 256
        const backCtx = backShadowCanvas.getContext('2d')
        
        const backGradient = backCtx.createLinearGradient(0, 256, 0, 0)
        backGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)')
        backGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.12)')
        backGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.05)')
        backGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        backCtx.fillStyle = backGradient
        backCtx.fillRect(0, 0, 256, 256)
        
        const backShadowTexture = new THREE.CanvasTexture(backShadowCanvas)
        
        const backShadowGeo = new THREE.PlaneGeometry(12, 5)
        const backShadowMat = new THREE.MeshBasicMaterial({
            map: backShadowTexture,
            transparent: true,
            depthWrite: false
        })
        const backShadow = new THREE.Mesh(backShadowGeo, backShadowMat)
        backShadow.rotation.x = -Math.PI / 2
        backShadow.position.set(0, 0.02, -6)
        backShadow.visible = false
        this.scene.add(backShadow)
        this.groundElements.push(backShadow)

        // Add subtle bright glow near the room base - non-uniform shape
        const glowCanvas = document.createElement('canvas')
        glowCanvas.width = 512
        glowCanvas.height = 512
        const glowCtx = glowCanvas.getContext('2d')
        
        // Create multiple overlapping radial gradients for non-uniform look
        // First glow - slightly off-center
        const glow1 = glowCtx.createRadialGradient(280, 240, 0, 280, 240, 200)
        glow1.addColorStop(0, 'rgba(255, 255, 255, 0.12)')
        glow1.addColorStop(0.4, 'rgba(255, 255, 255, 0.06)')
        glow1.addColorStop(1, 'rgba(255, 255, 255, 0)')
        glowCtx.fillStyle = glow1
        glowCtx.fillRect(0, 0, 512, 512)
        
        // Second glow - different position for non-uniform effect
        const glow2 = glowCtx.createRadialGradient(200, 300, 0, 200, 300, 150)
        glow2.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
        glow2.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)')
        glow2.addColorStop(1, 'rgba(255, 255, 255, 0)')
        glowCtx.fillStyle = glow2
        glowCtx.fillRect(0, 0, 512, 512)
        
        // Third small glow
        const glow3 = glowCtx.createRadialGradient(350, 280, 0, 350, 280, 100)
        glow3.addColorStop(0, 'rgba(255, 255, 255, 0.06)')
        glow3.addColorStop(1, 'rgba(255, 255, 255, 0)')
        glowCtx.fillStyle = glow3
        glowCtx.fillRect(0, 0, 512, 512)
        
        const glowTexture = new THREE.CanvasTexture(glowCanvas)
        
        const glowGeo = new THREE.PlaneGeometry(16, 14)
        const glowMat = new THREE.MeshBasicMaterial({
            map: glowTexture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
        const glow = new THREE.Mesh(glowGeo, glowMat)
        glow.rotation.x = -Math.PI / 2
        glow.position.set(0.5, 0.03, 1)
        glow.visible = false
        this.scene.add(glow)
        this.groundElements.push(glow)

        // Find TV and Sofa Table meshes by name in the baked room model
        this.tvMesh = null
        this.sofaTableMesh = null
        if (this.baked && this.baked.model && this.baked.model.mesh) {
            this.baked.model.mesh.traverse((child) => {
                if (child.isMesh && child.name) {
                    const name = child.name.toLowerCase()
                    if (!this.tvMesh && name.includes('tv')) {
                        this.tvMesh = child
                    }
                    if (!this.sofaTableMesh && (name.includes('sofa') || name.includes('table'))) {
                        this.sofaTableMesh = child
                    }
                }
            })
        }

        // Remove the visible backside wall
        // Add an invisible wall (transparent, not rendered)
        const invisibleWallWidth = 8; // Match room size
        const invisibleWallHeight = 4; // Match room height
        const invisibleWallGeometry = new THREE.PlaneGeometry(invisibleWallWidth, invisibleWallHeight);
        const invisibleWallMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
        const invisibleBackWall = new THREE.Mesh(invisibleWallGeometry, invisibleWallMaterial);
        invisibleBackWall.position.set(0, invisibleWallHeight / 2, -4.01); // Place just behind the open edge
        invisibleBackWall.rotation.y = 0;
        this.scene.add(invisibleBackWall);

        // Add an invisible wall to close the open side of the room (behind desk/window/plant)
        const wallWidth = 10; // Keep the larger size for full coverage
        const wallHeight = 5;
        const wallGeometry = new THREE.PlaneGeometry(wallWidth, wallHeight);
        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 2.5, -3.7);
        backWall.rotation.y = 0;
        this.scene.add(backWall);

        // Add invisible wall to the left end of the room
        const leftWallGeometry = new THREE.PlaneGeometry(8, 5);
        const leftWallMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
        leftWall.position.set(-2.7, 2.5, 0); // Move inward, closer to bookshelf
        leftWall.rotation.y = Math.PI / 2; // Face inward
        this.scene.add(leftWall);

        // Add invisible wall to the right end of the room (behind TV/plant)
        const rightWallGeometry = new THREE.PlaneGeometry(8, 5);
        const rightWallMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        rightWall.position.set(4.01, 2.5, 0); // Right edge
        rightWall.rotation.y = -Math.PI / 2; // Face inward
        this.scene.add(rightWall);
    }

    setGoogleLeds()
    {
        this.googleLeds = new GoogleLeds()
    }

    setLoupedeckButtons()
    {
        this.loupedeckButtons = new LoupedeckButtons()
    }

    setCoffeeSteam()
    {
        this.coffeeSteam = new CoffeeSteam()
    }

    setTopChair()
    {
        this.topChair = new TopChair()
    }

    setElgatoLight()
    {
        this.elgatoLight = new ElgatoLight()
    }

    setBouncingLogo()
    {
        this.bouncingLogo = new BouncingLogo()
        this.tvMesh = this.bouncingLogo?.model?.mesh;
    }

    setScreens()
    {
        this.pcScreen = new Screen(
            this.resources.items.pcScreenModel.scene.children[0],
            '/assets/videoPortfolio.mp4'
        )
        this.macScreen = new Screen(
            this.resources.items.macScreenModel.scene.children[0],
            '/assets/videoStream.mp4'
        )
    }

    /**
     * Get all main interactable objects for camera focus
     */
    getMainObjects() {
        return [
            this.pcScreen?.model?.mesh,
            this.macScreen?.model?.mesh,
            this.tvMesh,
            this.sofaTableMesh
        ].filter(Boolean)
    }

    resize()
    {
    }

    update()
    {
        if(this.googleLeds)
            this.googleLeds.update()

        if(this.loupedeckButtons)
            this.loupedeckButtons.update()

        if(this.coffeeSteam)
            this.coffeeSteam.update()

        if(this.topChair)
            this.topChair.update()

        if(this.bouncingLogo)
            this.bouncingLogo.update()
    }

    destroy()
    {
    }
}