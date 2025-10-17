// Confetti and celebration effects for task status changes

export function triggerConfetti() {
  // Create confetti canvas
  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    color: string
    size: number
    rotation: number
    rotationSpeed: number
  }> = []

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493']

  // Create particles
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    })
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    let allDone = true
    particles.forEach(p => {
      p.y += p.vy
      p.x += p.vx
      p.vy += 0.2 // gravity
      p.rotation += p.rotationSpeed

      if (p.y < canvas.height) {
        allDone = false
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      }
    })

    if (!allDone) {
      requestAnimationFrame(animate)
    } else {
      document.body.removeChild(canvas)
    }
  }

  animate()
}

export function triggerHearts() {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '50%'
  container.style.left = '50%'
  container.style.transform = 'translate(-50%, -50%)'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '9999'
  document.body.appendChild(container)

  for (let i = 0; i < 10; i++) {
    const heart = document.createElement('div')
    heart.textContent = '❤️'
    heart.style.position = 'absolute'
    heart.style.fontSize = '30px'
    heart.style.left = '0'
    heart.style.top = '0'
    heart.style.animation = `float-up ${1 + Math.random()}s ease-out forwards`
    heart.style.animationDelay = `${i * 0.1}s`
    heart.style.opacity = '0'
    
    const angle = (i / 10) * 360
    const distance = 50 + Math.random() * 100
    heart.style.setProperty('--end-x', `${Math.cos(angle * Math.PI / 180) * distance}px`)
    heart.style.setProperty('--end-y', `${Math.sin(angle * Math.PI / 180) * distance - 100}px`)
    
    container.appendChild(heart)
  }

  // Add keyframes if not already present
  if (!document.querySelector('#float-up-keyframes')) {
    const style = document.createElement('style')
    style.id = 'float-up-keyframes'
    style.textContent = `
      @keyframes float-up {
        0% { transform: translate(0, 0) scale(0); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translate(var(--end-x), var(--end-y)) scale(1.5); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }

  setTimeout(() => {
    document.body.removeChild(container)
  }, 2000)
}

export function triggerFrustrated() {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '50%'
  container.style.left = '50%'
  container.style.transform = 'translate(-50%, -50%)'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '9999'
  document.body.appendChild(container)

  const emoji = document.createElement('div')
  emoji.textContent = '😤'
  emoji.style.fontSize = '80px'
  emoji.style.animation = 'shake 0.5s ease-in-out'
  container.appendChild(emoji)

  // Add shake keyframes if not already present
  if (!document.querySelector('#shake-keyframes')) {
    const style = document.createElement('style')
    style.id = 'shake-keyframes'
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-5deg); }
        20%, 40%, 60%, 80% { transform: translateX(10px) rotate(5deg); }
      }
    `
    document.head.appendChild(style)
  }

  setTimeout(() => {
    document.body.removeChild(container)
  }, 1000)
}

