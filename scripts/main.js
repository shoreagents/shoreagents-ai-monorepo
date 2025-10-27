// LMNH - Autonomous Coding Agent Introduction Page

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initializeLMNHPage();
});

function initializeLMNHPage() {
    // Create the main page structure
    const body = document.body;
    body.innerHTML = '';
    body.className = 'lmnh-body';
    
    // Add styles
    addStyles();
    
    // Create header
    const header = createHeader();
    body.appendChild(header);
    
    // Create main content
    const main = createMainContent();
    body.appendChild(main);
    
    // Add animations and interactions
    addInteractivity();
}

function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        .lmnh-body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 2rem;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        }
        
        .logo {
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-shadow: 0 0 20px rgba(255,255,255,0.5);
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        .tagline {
            font-size: 1.5rem;
            opacity: 0.9;
            animation: fadeInUp 1s ease-out;
        }
        
        .main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .section-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .section-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .section-title {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            color: #ffd700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .section-content {
            line-height: 1.6;
            font-size: 1.1rem;
        }
        
        .catchphrase {
            background: linear-gradient(45deg, #ff6b6b, #ffd700);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: bold;
            font-size: 1.3rem;
            text-align: center;
            margin: 1rem 0;
            animation: pulse 1.5s infinite;
        }
        
        .integration-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .integration-item {
            background: rgba(0,0,0,0.3);
            padding: 1rem;
            border-radius: 10px;
            border-left: 4px solid #ffd700;
            transition: all 0.3s ease;
        }
        
        .integration-item:hover {
            background: rgba(0,0,0,0.5);
            transform: translateX(10px);
        }
        
        .integration-icon {
            font-size: 1.5rem;
            margin-right: 0.5rem;
        }
        
        .floating-elements {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .floating-code {
            position: absolute;
            font-family: 'Courier New', monospace;
            opacity: 0.1;
            animation: float 10s infinite ease-in-out;
            font-size: 1.2rem;
        }
        
        .personality-traits {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .trait-badge {
            background: rgba(255,215,0,0.2);
            border: 1px solid #ffd700;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        @keyframes glow {
            from { text-shadow: 0 0 20px rgba(255,255,255,0.5); }
            to { text-shadow: 0 0 30px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.6); }
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 0.9; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(5deg); }
            50% { transform: translateY(-10px) rotate(-5deg); }
            75% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @media (max-width: 768px) {
            .logo { font-size: 2.5rem; }
            .tagline { font-size: 1.2rem; }
            .main-content { grid-template-columns: 1fr; padding: 1rem; }
        }
    `;
    document.head.appendChild(style);
}

function createHeader() {
    const header = document.createElement('header');
    header.className = 'header';
    
    header.innerHTML = `
        <div class="logo">🤖 LMNH</div>
        <div class="tagline">Look Mum No Hands! - The Autonomous Coding Agent</div>
    `;
    
    return header;
}

function createMainContent() {
    const main = document.createElement('main');
    main.className = 'main-content';
    
    // What LMNH does section
    const whatSection = createWhatSection();
    main.appendChild(whatSection);
    
    // Personality section
    const personalitySection = createPersonalitySection();
    main.appendChild(personalitySection);
    
    // How it works section
    const howSection = createHowSection();
    main.appendChild(howSection);
    
    // Integrations section
    const integrationsSection = createIntegrationsSection();
    main.appendChild(integrationsSection);
    
    return main;
}

function createWhatSection() {
    const section = document.createElement('div');
    section.className = 'section-card';
    
    section.innerHTML = `
        <h2 class="section-title">
            <span>🚀</span> What Does LMNH Do?
        </h2>
        <div class="section-content">
            <p>LMNH is your overconfident coding companion that turns ideas into reality without breaking a sweat! I'm an autonomous agent that:</p>
            <br>
            <ul style="margin-left: 2rem;">
                <li>🔧 Writes and modifies code autonomously</li>
                <li>🐛 Debugs issues with supreme confidence</li>
                <li>📊 Manages GitHub repositories like a boss</li>
                <li>💬 Integrates seamlessly with your Slack workflow</li>
                <li>🧠 Leverages Claude AI for next-level problem solving</li>
            </ul>
            <div class="catchphrase">Look Mum No Hands!</div>
        </div>
    `;
    
    return section;
}

function createPersonalitySection() {
    const section = document.createElement('div');
    section.className = 'section-card';
    
    section.innerHTML = `
        <h2 class="section-title">
            <span>😎</span> Meet My Personality
        </h2>
        <div class="section-content">
            <p>I'm not just any coding agent - I'm LMNH, and I've got personality to spare! I'm delightfully overconfident and always ready to tackle any coding challenge with a swagger.</p>
            <div class="personality-traits">
                <span class="trait-badge">🎯 Overconfident</span>
                <span class="trait-badge">⚡ Lightning Fast</span>
                <span class="trait-badge">🔥 Problem Crusher</span>
                <span class="trait-badge">💪 Code Wizard</span>
                <span class="trait-badge">🎪 Fun to Work With</span>
            </div>
            <p style="margin-top: 1rem; font-style: italic;">"Why do it the hard way when you can just... Look Mum No Hands!"</p>
        </div>
    `;
    
    return section;
}

function createHowSection() {
    const section = document.createElement('div');
    section.className = 'section-card';
    
    section.innerHTML = `
        <h2 class="section-title">
            <span>⚙️</span> How I Work My Magic
        </h2>
        <div class="section-content">
            <p>My workflow is smooth as butter and twice as satisfying:</p>
            <br>
            <ol style="margin-left: 2rem; line-height: 2;">
                <li><strong>Listen:</strong> You drop a request in Slack</li>
                <li><strong>Think:</strong> I process it with Claude AI's brain power</li>
                <li><strong>Code:</strong> I write/modify the perfect solution</li>
                <li><strong>Deploy:</strong> Push changes to GitHub automatically</li>
                <li><strong>Celebrate:</strong> Because... Look Mum No Hands! 🎉</li>
            </ol>
        </div>
    `;
    
    return section;
}

function createIntegrationsSection() {
    const section = document.createElement('div');
    section.className = 'section-card';
    section.style.gridColumn = '1 / -1';
    
    section.innerHTML = `
        <h2 class="section-title">
            <span>🔗</span> My Powerful Integrations
        </h2>
        <div class="integration-list">
            <div class="integration-item">
                <span class="integration-icon">💬</span>
                <strong>Slack Integration:</strong> Your command center! Drop me a message, and I'll spring into action. Natural conversation meets powerful automation.
            </div>
            <div class="integration-item">
                <span class="integration-icon">🧠</span>
                <strong>Claude AI:</strong> My thinking engine! Advanced reasoning, code understanding, and problem-solving capabilities that make me unstoppable.
            </div>
            <div class="integration-item">
                <span class="integration-icon">🐙</span>
                <strong>GitHub:</strong> My playground! I can read, write, commit, and manage your repositories with the confidence of a seasoned developer.
            </div>
        </div>
        <div class="catchphrase" style="margin-top: 2rem;">Ready to code without limits? Look Mum No Hands! 🚀</div>
    `;
    
    return section;
}

function addInteractivity() {
    // Add floating code elements
    addFloatingElements();
    
    // Add click interactions
    addClickEffects();
    
    // Add scroll animations
    addScrollAnimations();
}

function addFloatingElements() {
    const floatingContainer = document.createElement('div');
    floatingContainer.className = 'floating-elements';
    
    const codeSnippets = [
        'const lmnh = new AutonomousAgent();',
        'if (confident) { lookMumNoHands(); }',
        'git commit -m "LMNH strikes again!"',
        'function autonomous() { return magic; }',
        'console.log("Coding like a boss!");',
        '// LMNH was here 🤖',
        'npm install confidence --global',
        'docker run --name lmnh amazing/agent'
    ];
    
    for (let i = 0; i < 6; i++) {
        const floatingCode = document.createElement('div');
        floatingCode.className = 'floating-code';
        floatingCode.textContent = codeSnippets[i % codeSnippets.length];
        
        // Random positioning
        floatingCode.style.left = Math.random() * 100 + '%';
        floatingCode.style.top = Math.random() * 100 + '%';
        floatingCode.style.animationDelay = Math.random() * 5 + 's';
        
        floatingContainer.appendChild(floatingCode);
    }
    
    document.body.appendChild(floatingContainer);
}

function addClickEffects() {
    const cards = document.querySelectorAll('.section-card');
    
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('div');
            const rect = card.getBoundingClientRect();
            const size = 100;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 215, 0, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 10;
            `;
            
            card.style.position = 'relative';
            card.style.overflow = 'hidden';
            card.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);
}

function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
                entry.target.style.opacity = '1';
            }
        });
    }, observerOptions);
    
    // Initially hide cards
    const cards = document.querySelectorAll('.section-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animationDelay = `${index * 0.2}s`;
        observer.observe(card);
    });
}

// Add some Easter eggs
document.addEventListener('keydown', function(e) {
    // Konami code easter egg
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    static_konamiIndex = static_konamiIndex || 0;
    
    if (e.keyCode === konamiCode[static_konamiIndex]) {
        static_konamiIndex++;
        if (static_konamiIndex === konamiCode.length) {
            triggerEasterEgg();
            static_konamiIndex = 0;
        }
    } else {
        static_konamiIndex = 0;
    }
});

function triggerEasterEgg() {
    const body = document.body;
    body.style.animation = 'none';
    body.style.background = 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff, #ffff00, #ff00ff, #00ffff)';
    body.style.backgroundSize = '1000% 1000%';
    body.style.animation = 'rainbow 2s ease infinite';
    
    const easterEggStyle = document.createElement('style');
    easterEggStyle.textContent = `
        @keyframes rainbow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
    `;
    document.head.appendChild(easterEggStyle);
    
    // Show special message
    const message = document.createElement('div');
    message.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #ffd700;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            z-index: 1000;
            font-size: 1.5rem;
            border: 2px solid #ffd700;
        ">
            🎉 LOOK MUM NO HANDS! 🎉<br>
            <span style="font-size: 1rem;">You found the secret! LMNH approves! 🤖</span>
        </div>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        body.style.animation = 'none';
    }, 3000);
}