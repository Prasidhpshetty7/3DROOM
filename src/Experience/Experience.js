import * as THREE from 'three'
import { Pane } from 'tweakpane'

import Time from './Utils/Time.js'
import Sizes from './Utils/Sizes.js'
import Stats from './Utils/Stats.js'

import Resources from './Resources.js'
import Renderer from './Renderer.js'
import Camera from './Camera.js'
import World from './World.js'
import Navigation from './Navigation.js'

import assets from './assets.js'

export default class Experience
{
    static instance

    constructor(_options = {})
    {
        if(Experience.instance)
        {
            return Experience.instance
        }
        Experience.instance = this

        // Options
        this.targetElement = _options.targetElement

        if(!this.targetElement)
        {
            console.warn('Missing \'targetElement\' property')
            return
        }

        this.time = new Time()
        this.sizes = new Sizes()
        this.setConfig()
        this.setStats()
        this.setDebug()
        this.setScene()
        this.setCamera()
        this.setRenderer()
        this.setResources()
        this.setWorld()
        this.setNavigation()
        
        this.sizes.on('resize', () =>
        {
            this.resize()
        })

        this.update()
    }

    // static getInstance(_options = {})
    // {
    //     console.log(Experience.instance)
    //     if(Experience.instance)
    //     {
    //         return Experience.instance
    //     }
        
    //     console.log('create')
    //     Experience.instance = new Experience(_options)
        
    //     return Experience.instance
    // }

    setConfig()
    {
        this.config = {}
    
        // Pixel ratio
        this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

        // Width and height
        const boundings = this.targetElement.getBoundingClientRect()
        this.config.width = boundings.width
        this.config.height = boundings.height || window.innerHeight
        this.config.smallestSide = Math.min(this.config.width, this.config.height)
        this.config.largestSide = Math.max(this.config.width, this.config.height)
        
        // Debug
        // this.config.debug = window.location.hash === '#debug'
        this.config.debug = this.config.width > 420
    }

    setStats()
    {
        // Stats panel disabled - using theme toggle instead
    }

    setDebug()
    {
        if(this.config.debug)
        {
            this.debug = new Pane({
                title: '⚙',
                expanded: false
            })
            
            // Position to right corner
            this.debug.containerElem_.style.position = 'fixed'
            this.debug.containerElem_.style.top = '8px'
            this.debug.containerElem_.style.right = '8px'
            this.debug.containerElem_.style.left = 'auto'
            
            // Make the whole panel white with nice styling
            const style = document.createElement('style')
            style.textContent = `
                /* Import nice font */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                
                /* Base panel styling */
                .tp-dfwv {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                
                .tp-rotv {
                    transition: all 0.3s ease;
                    background: white !important;
                    border-radius: 12px !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
                }
                
                /* Collapsed button styling */
                .tp-rotv:not(.tp-rotv-expanded) {
                    width: 44px !important;
                    min-width: 44px !important;
                    height: 44px !important;
                    border-radius: 50% !important;
                    overflow: hidden !important;
                    padding: 0 !important;
                    background: white !important;
                }
                .tp-rotv:not(.tp-rotv-expanded) .tp-rotv_b {
                    height: 44px !important;
                    padding: 0 !important;
                    background: white !important;
                }
                .tp-rotv:not(.tp-rotv-expanded) .tp-rotv_t {
                    width: 44px !important;
                    height: 44px !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 28px !important;
                    line-height: 1 !important;
                    color: #333 !important;
                }
                .tp-rotv:not(.tp-rotv-expanded) .tp-rotv_m,
                .tp-rotv:not(.tp-rotv-expanded) .tp-rotv_c {
                    display: none !important;
                }
                
                /* Expanded panel styling */
                .tp-rotv.tp-rotv-expanded {
                    width: 320px !important;
                    border-radius: 12px !important;
                }
                
                /* Header bar */
                .tp-rotv_b {
                    background: white !important;
                    border-bottom: 1px solid #eee !important;
                }
                .tp-rotv_t {
                    color: #333 !important;
                    font-weight: 600 !important;
                }
                .tp-rotv_m {
                    background: #999 !important;
                }
                
                /* Content area */
                .tp-rotv_c {
                    background: white !important;
                }
                
                /* Folder headers */
                .tp-fldv_t {
                    background: #f5f5f5 !important;
                    color: #333 !important;
                    font-weight: 500 !important;
                }
                .tp-fldv_m {
                    background: #999 !important;
                }
                
                /* Folder content */
                .tp-fldv_c {
                    background: white !important;
                }
                
                /* Labels */
                .tp-lblv_l {
                    color: #333 !important;
                    font-weight: 400 !important;
                }
                
                /* Input fields */
                .tp-txtv_i {
                    background: #f5f5f5 !important;
                    color: #333 !important;
                    border: 1px solid #ddd !important;
                    border-radius: 6px !important;
                }
                
                /* Sliders track background */
                .tp-sldv {
                    background: #e8e8e8 !important;
                    border-radius: 6px !important;
                }
                /* Slider filled part - light gray */
                .tp-sldv_k {
                    background: transparent !important;
                    border-radius: 6px !important;
                }
                
                /* Slider in combined input */
                .tp-sldtxtv_s {
                    background: #e8e8e8 !important;
                    border-radius: 6px !important;
                }
                .tp-sldtxtv_k {
                    background: transparent !important;
                    border-radius: 6px !important;
                }
                
                /* Slider knob/handle - black */
                .tp-sldv_k::after,
                .tp-sldtxtv_k::after {
                    background: #333 !important;
                }
                
                /* Number input */
                .tp-sldtxtv_t {
                    background: #f5f5f5 !important;
                    color: #333 !important;
                    border: 1px solid #ddd !important;
                    border-radius: 6px !important;
                }
                
                /* Color picker */
                .tp-colv_s {
                    border-radius: 6px !important;
                }
                
                /* All text */
                .tp-lblv, .tp-fldv, .tp-rotv {
                    color: #333 !important;
                }
            `
            document.head.appendChild(style)
        }
    }
    
    setScene()
    {
        this.scene = new THREE.Scene()
    }

    setCamera()
    {
        this.camera = new Camera()
    }

    setRenderer()
    {
        this.renderer = new Renderer({ rendererInstance: this.rendererInstance })

        this.targetElement.appendChild(this.renderer.instance.domElement)
    }

    setResources()
    {
        this.resources = new Resources(assets)
    }

    setWorld()
    {
        this.world = new World()
    }

    setNavigation()
    {
        this.navigation = new Navigation()
    }

    update()
    {
        if(this.stats)
            this.stats.update()
        
        this.camera.update()
        
        if(this.renderer)
            this.renderer.update()

        if(this.world)
            this.world.update()

        if(this.navigation)
            this.navigation.update()

        window.requestAnimationFrame(() =>
        {
            this.update()
        })
    }

    resize()
    {
        // Config
        const boundings = this.targetElement.getBoundingClientRect()
        this.config.width = boundings.width
        this.config.height = boundings.height
        this.config.smallestSide = Math.min(this.config.width, this.config.height)
        this.config.largestSide = Math.max(this.config.width, this.config.height)

        this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

        if(this.camera)
            this.camera.resize()

        if(this.renderer)
            this.renderer.resize()

        if(this.world)
            this.world.resize()
    }

    destroy()
    {
        
    }
}
