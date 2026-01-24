import './style.css'
import Experience from './Experience/Experience.js'

// Loading screen elements
const loadingScreen = document.getElementById('loading-screen')
const loadingBar = document.getElementById('loading-bar')
const loadingShine = document.getElementById('loading-shine')
const loadingPercent = document.getElementById('loading-percent')
const loadingStatus = document.getElementById('loading-status')
const loadingStartBtn = document.getElementById('loading-start-btn')

// Loading files - cool names
const loadingFiles = [
    "room_geometry.glb",
    "baked_textures.basis",
    "light_map.hdr",
    "materials.mtl",
    "shaders.glsl",
    "scene_config.json",
    "post_processing.glsl",
    "final_composite.glsl"
]

let fileIndex = 0
let fileInterval = null
let progressInterval = null
let progress = 0

// Cycle through files - 2 per second
function startFileCycle() {
    if(loadingStatus) {
        loadingStatus.textContent = `Loading ${loadingFiles[0]}...`
    }
    fileInterval = setInterval(() => {
        fileIndex++
        if(fileIndex < loadingFiles.length) {
            if(loadingStatus) {
                loadingStatus.textContent = `Loading ${loadingFiles[fileIndex]}...`
            }
        }
    }, 500) // 2 per second
}

// Update progress bar
function updateProgress() {
    progress += (100 / 4000) * 50 // 4 seconds total
    const p = Math.min(Math.round(progress), 100)
    if(loadingBar) loadingBar.style.width = p + '%'
    if(loadingShine) loadingShine.style.left = (p - 30) + '%'
    if(loadingPercent) loadingPercent.textContent = p + '%'
    
    if(progress >= 100) {
        clearInterval(progressInterval)
        clearInterval(fileInterval)
        showStartButton()
    }
}

// Preload audio for instant playback
const ambientAudio = document.getElementById('ambient-audio')
let audioContext = null
let gainNode = null

if(ambientAudio) {
    ambientAudio.load() // Preload
}

// Show start button
function showStartButton() {
    if(loadingStatus) loadingStatus.textContent = "System ready. Welcome to THE ROOM."
    if(loadingStartBtn) {
        setTimeout(() => {
            loadingStartBtn.classList.add('visible')
        }, 300)
        loadingStartBtn.addEventListener('click', () => {
            // Play audio IMMEDIATELY - before anything else
            if(ambientAudio && !audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)()
                const source = audioContext.createMediaElementSource(ambientAudio)
                gainNode = audioContext.createGain()
                gainNode.gain.value = 2.0 // 200% volume
                source.connect(gainNode)
                gainNode.connect(audioContext.destination)
                window.audioGainNode = gainNode
                
                ambientAudio.volume = 1.0
                ambientAudio.currentTime = 0
                ambientAudio.play()
                
                // Loop from 7 to 40 sec after first play
                ambientAudio.addEventListener('ended', function() {
                    ambientAudio.currentTime = 7
                    ambientAudio.play()
                })
                
                ambientAudio.addEventListener('timeupdate', function() {
                    if(ambientAudio.currentTime >= 40) {
                        ambientAudio.currentTime = 7
                    }
                })
            }
            
            // Then hide loading screen
            if(loadingScreen) loadingScreen.classList.add('hidden')
            
            // Fade in the 3D experience
            const experience = document.querySelector('.experience')
            if(experience) {
                setTimeout(() => {
                    experience.classList.add('visible')
                }, 100)
            }
            
            // Show click prompt after loading screen fades
            showClickPrompt()
            
            // Show theme toggle after loading screen closes
            const themeToggle = document.getElementById('theme-toggle')
            if(themeToggle) {
                setTimeout(() => {
                    themeToggle.classList.add('visible')
                }, 500)
            }
        })
    }
}

// Sound toggle functionality
const soundToggle = document.getElementById('sound-toggle')
const soundIconOn = document.getElementById('sound-icon-on')
const soundIconOff = document.getElementById('sound-icon-off')
let isSoundOn = true

if(soundToggle) {
    soundToggle.addEventListener('click', () => {
        isSoundOn = !isSoundOn
        const audio = document.getElementById('ambient-audio')
        if(audio) {
            if(isSoundOn) {
                audio.play().catch(e => console.log('Audio play blocked'))
                if(soundIconOn) soundIconOn.style.display = 'block'
                if(soundIconOff) soundIconOff.style.display = 'none'
            } else {
                audio.pause()
                if(soundIconOn) soundIconOn.style.display = 'none'
                if(soundIconOff) soundIconOff.style.display = 'block'
            }
        }
    })
}

// Start loading animation
startFileCycle()
progressInterval = setInterval(updateProgress, 50)

// Create experience
window.experience = new Experience({
    targetElement: document.querySelector('.experience')
})

// Click anywhere prompt with typing effect
let promptShown = false
let infoPanelStarted = false
const promptMessage = "Click anywhere to begin"

function showClickPrompt() {
    const clickPrompt = document.getElementById('click-prompt')
    const clickPromptText = document.getElementById('click-prompt-text')
    
    console.log('showClickPrompt called', { clickPrompt, clickPromptText, promptShown })
    
    if(!clickPrompt || !clickPromptText || promptShown) return
    promptShown = true
    
    // Show the prompt box 0.5 sec after START is pressed to match audio typing sound
    setTimeout(() => {
        console.log('Showing click prompt now')
        clickPrompt.style.display = 'block'
        clickPrompt.classList.add('visible')
        
        // Type out the message - slower to match audio
        let charIndex = 0
        const typeInterval = setInterval(() => {
            if(charIndex < promptMessage.length) {
                clickPromptText.textContent = promptMessage.substring(0, charIndex + 1)
                charIndex++
            } else {
                clearInterval(typeInterval)
                // Enable dismiss after typing is complete
                setTimeout(() => {
                    canDismiss = true
                }, 300)
            }
        }, 120) // Typing speed to match audio
    }, 500) // 0.5 sec after START to match audio beat
}

function hideClickPrompt() {
    if(infoPanelStarted) return // Only run once
    infoPanelStarted = true
    
    const clickPrompt = document.getElementById('click-prompt')
    if(clickPrompt) {
        clickPrompt.classList.add('fade-out')
        setTimeout(() => {
            clickPrompt.style.display = 'none'
        }, 500)
    }
    // Start showing info panel with typing effect
    showInfoPanel()
}

// Info panel typing effect
const nameText = "Prasidh P Shetty"
const roleText = "Web Designer & Developer"

function showInfoPanel() {
    const infoPanel = document.getElementById('info-panel')
    const infoName = document.getElementById('info-name')
    const infoRole = document.getElementById('info-role')
    const infoNameText = document.getElementById('info-name-text')
    const infoRoleText = document.getElementById('info-role-text')
    const nameCursor = document.getElementById('name-cursor')
    const roleCursor = document.getElementById('role-cursor')
    const infoRow = document.getElementById('info-row')
    
    if(!infoPanel) return
    
    // Show panel container
    infoPanel.classList.add('visible')
    
    // Show name box and start typing
    infoName.classList.add('visible')
    
    let nameIndex = 0
    const nameInterval = setInterval(() => {
        if(nameIndex < nameText.length) {
            infoNameText.textContent = nameText.substring(0, nameIndex + 1)
            nameIndex++
        } else {
            clearInterval(nameInterval)
            // Hide name cursor
            if(nameCursor) nameCursor.classList.add('hidden')
            
            // Show role box after short delay
            setTimeout(() => {
                infoRole.classList.add('visible')
                
                // Type role
                let roleIndex = 0
                const roleInterval = setInterval(() => {
                    if(roleIndex < roleText.length) {
                        infoRoleText.textContent = roleText.substring(0, roleIndex + 1)
                        roleIndex++
                    } else {
                        clearInterval(roleInterval)
                        // Hide role cursor
                        if(roleCursor) roleCursor.classList.add('hidden')
                        
                        // Fade in the row with time/sound/video
                        setTimeout(() => {
                            infoRow.classList.add('visible')
                        }, 200)
                    }
                }, 35) // Fast typing for role
            }, 100)
        }
    }, 45) // Typing speed for name
}

// Expose globally for Navigation to call
window.showInfoPanel = showInfoPanel

// Listen for any click, keypress, or touch to dismiss prompt (only after prompt is shown)
let canDismiss = false

function setupDismissListeners() {
    const dismissHandler = (e) => {
        // Don't dismiss if loading screen is still visible
        if(loadingScreen && !loadingScreen.classList.contains('hidden')) return
        // Don't dismiss if prompt hasn't been shown yet
        if(!promptShown) return
        // Don't dismiss until canDismiss is true (after prompt appears)
        if(!canDismiss) return
        
        // Dismiss the prompt
        hideClickPrompt()
        
        // Note: The Navigation.onClick handler will handle the zoom to PC
        // We just need to dismiss the prompt here
    }
    
    // Only listen for keyboard and touch for dismissing
    // Mouse clicks will be handled by Navigation.onClick which will trigger zoom
    document.addEventListener('keydown', dismissHandler)
    document.addEventListener('touchstart', dismissHandler)
}

setupDismissListeners()

// Live time update
function updateTime() {
    const now = new Date()
    let hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`
    const timeEl = document.getElementById('live-time')
    if(timeEl) timeEl.textContent = timeStr
}
updateTime()
setInterval(updateTime, 1000)

