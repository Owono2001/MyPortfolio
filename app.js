// ===== ULTIMATE PERFORMANCE CORE =====
(function() {
    // ======== DEVICE DETECTION ========
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window;

    // ======== PERFORMANCE PROFILE ========
    const particleCount = isMobile ? 3000 : 10000;
    const animationMultiplier = isMobile ? 0.7 : 1;

    /************************************************************
      1) REMOVED Lenis smooth scrolling setup to allow normal scrolling.
         (All code related to “lenis” has been taken out.)
    ************************************************************/

    // ======== GSAP SCROLL TRIGGER SETUP ========
    gsap.registerPlugin(ScrollTrigger);

    // ======== WEBGL CONTEXT ========
    let renderer;
    if (!isMobile) { // Only initialize WebGL on desktop
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.prepend(renderer.domElement);

        // ======== ADAPTIVE PARTICLE SYSTEM ========
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for(let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMesh = new THREE.Points(
            particleGeometry,
            new THREE.PointsMaterial({
                size: 0.005,
                color: new THREE.Color(0x00f3ff),
                transparent: true,
                blending: THREE.AdditiveBlending
            })
        );
        scene.add(particleMesh);
        camera.position.z = 2;

        // ======== PARTICLE ANIMATION ========
        let lastFrameTime = 0;
        const animateParticles = (time) => {
            requestAnimationFrame(animateParticles);
            const delta = time - lastFrameTime;
            particleMesh.rotation.x += 0.000008 * delta * animationMultiplier;
            particleMesh.rotation.y += 0.000008 * delta * animationMultiplier;
            particleGeometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
            lastFrameTime = time;
        };
        animateParticles(0);
    }

    // ======== SCROLL ANIMATIONS (using GSAP) ========
    gsap.utils.toArray('.section').forEach(section => {
        gsap.from(section, {
            opacity: 0,
            y: isMobile ? 50 : 100,
            duration: 1.5 * animationMultiplier,
            scrollTrigger: {
                trigger: section,
                start: 'top center+=200',
                toggleActions: 'play none none reverse',
                markers: false
            }
        });
    });

    // ======== CURSOR SYSTEM ========
    if (!isTouchDevice) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        let lastMouseUpdate = 0;
        document.addEventListener('mousemove', e => {
            if (window.innerWidth < 768) return;
            const now = performance.now();
            if(now - lastMouseUpdate < 16) return;
            lastMouseUpdate = now;

            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.3 * animationMultiplier
            });

            // Holographic Trail
            anime({
                targets: document.createElement('div'),
                left: e.clientX,
                top: e.clientY,
                translateY: [0, -50],
                translateX: () => anime.random(-20, 20),
                opacity: [1, 0],
                scale: [1, 2],
                duration: 1000 * animationMultiplier,
                easing: 'easeOutExpo',
                begin: anim => document.body.appendChild(anim.animatables[0].target),
                complete: anim => anim.animatables[0].target.remove()
            });
        });
    }

    // ======== PROJECT CARD INTERACTIONS ========
    document.querySelectorAll('.project-card').forEach(card => {
        /********************************************************************
         2) REMOVED the condition that sets pointerEvents = 'none'
            on touch devices. We want full mobile/tablet interaction.
        ********************************************************************/

        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            gsap.to(card, {
                x: (e.clientX - rect.left - rect.width/2) * 0.1,
                y: (e.clientY - rect.top - rect.height/2) * 0.1,
                rotationX: (e.clientY - rect.top - rect.height/2) * 0.1,
                rotationY: (e.clientX - rect.left - rect.width/2) * -0.1,
                duration: 0.5 * animationMultiplier
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                x: 0,
                y: 0,
                rotationX: 0,
                rotationY: 0,
                duration: 0.8 * animationMultiplier,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });

    // ======== NOISE GENERATOR ========
    if (!isMobile) {
        const noiseCanvas = document.createElement('canvas');
        const noiseCtx = noiseCanvas.getContext('2d');
        Object.assign(noiseCanvas.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
            opacity: '0.05'
        });
        document.body.appendChild(noiseCanvas);

        const resizeNoise = () => {
            noiseCanvas.width = window.innerWidth;
            noiseCanvas.height = window.innerHeight;
        };

        const generateNoise = () => {
            const imageData = noiseCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
            const data = imageData.data;
            for(let i = 0; i < data.length; i += 4) {
                const value = Math.random() * 255;
                data[i] = data[i+1] = data[i+2] = value;
                data[i+3] = 255;
            }
            noiseCtx.putImageData(imageData, 0, 0);
            requestAnimationFrame(generateNoise);
        };

        resizeNoise();
        generateNoise();
    }

    // ======== LAZY LOADING SYSTEM ========
    const mediaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                const media = entry.target;
                if(media.tagName === 'IMG' && !media.src) {
                    media.src = media.dataset.src;
                }
                media.classList.add('loaded');
            }
        });
    }, { 
        rootMargin: isMobile ? '100px 0px' : '200px 0px',
        threshold: 0.01
    });

    document.querySelectorAll('img, video').forEach(media => {
        if(media.tagName === 'IMG') {
            media.dataset.src = media.src;
            media.removeAttribute('src');
        }
        mediaObserver.observe(media);
    });

    // ======== ADAPTIVE RESIZE HANDLER ========
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            if (noiseCanvas) {
                const noiseCanvas = document.querySelector('canvas');
                if (noiseCanvas) {
                    noiseCanvas.width = window.innerWidth;
                    noiseCanvas.height = window.innerHeight;
                }
            }
            /************************************************************
              Removed lenis.resize() since we removed Lenis altogether.
            ************************************************************/
        }, 100);
    });

    // ======== SLIDESHOW SYSTEM ========
    document.querySelectorAll('.slideshow-container').forEach(slideshow => {
        let currentSlide = 0;
        const slides = slideshow.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        const nextSlide = () => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % totalSlides;
            slides[currentSlide].classList.add('active');
        };
        
        let slideshowInterval = setInterval(nextSlide, 5000);
        
        slideshow.addEventListener('mouseenter', () => clearInterval(slideshowInterval));
        slideshow.addEventListener('touchstart', () => clearInterval(slideshowInterval));
        slideshow.addEventListener('mouseleave', () => {
            if (!isTouchDevice) slideshowInterval = setInterval(nextSlide, 5000);
        });
    });

    function initializeSlideshow(containerId, dotContainerId) {
        const slideshow = document.querySelector(`#${containerId}`);
        const slides = slideshow.querySelectorAll('.slide');
        const dotsContainer = document.querySelector(`#${dotContainerId}`);
        let slideIndex = 0;

        // Create navigation dots
        slides.forEach((slide, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active-dot');
            dot.addEventListener('click', () => showSlide(index));
            dotsContainer.appendChild(dot);
        });

        function showSlide(index) {
            // Pause all videos when changing slides
            slides[slideIndex].querySelectorAll('video').forEach(video => video.pause());
            
            slideIndex = index;
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            
            // Update dots
            dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
                dot.classList.toggle('active-dot', i === index);
            });

            // Auto-play current video
            const currentVideo = slides[slideIndex].querySelector('video');
            if (currentVideo) currentVideo.play();
        }

        // Auto-advance slides every 5 seconds
        setInterval(() => {
            const nextIndex = (slideIndex + 1) % slides.length;
            showSlide(nextIndex);
        }, 5000);
    }

    document.addEventListener('DOMContentLoaded', () => {
        function initSlideshow(containerId, dotContainerId) {
            const container = document.getElementById(containerId);
            const slides = Array.from(container.querySelectorAll('.slide'));
            const dotsContainer = document.getElementById(dotContainerId);
            let currentIndex = 0;
            let interval;
    
            // Create dots
            slides.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.className = 'dot';
                if (index === 0) dot.classList.add('active-dot');
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            });
    
            function updateSlides() {
                slides.forEach((slide, index) => {
                    slide.classList.remove('active', 'prev');
                    if (index === currentIndex) {
                        slide.classList.add('active');
                    } else if (index === (currentIndex - 1 + slides.length) % slides.length) {
                        slide.classList.add('prev');
                    }
                });
    
                dotsContainer.querySelectorAll('.dot').forEach((dot, index) => {
                    dot.classList.toggle('active-dot', index === currentIndex);
                });
    
                // Handle video playback
                const activeSlide = slides[currentIndex];
                const activeVideo = activeSlide.querySelector('video');
                if (activeVideo) {
                    activeVideo.play().catch(error => {
                        console.log('Video autoplay failed:', error);
                    });
                }
            }
    
            function goToSlide(index) {
                currentIndex = (index + slides.length) % slides.length;
                updateSlides();
                resetInterval();
            }
    
            function nextSlide() {
                currentIndex = (currentIndex + 1) % slides.length;
                updateSlides();
            }
    
            function resetInterval() {
                clearInterval(interval);
                interval = setInterval(nextSlide, 5000);
            }
    
            // Initialize
            updateSlides();
            resetInterval();
    
            // Pause videos when switching slides
            container.querySelectorAll('video').forEach(video => {
                video.addEventListener('play', () => {
                    container.querySelectorAll('video').forEach(otherVideo => {
                        if (otherVideo !== video) otherVideo.pause();
                    });
                });
            });
        }
    
        // Initialize both galleries
        initSlideshow('picture-slideshow', 'picture-dots');
        initSlideshow('video-slideshow', 'video-dots');
    });

    // ======== LYRICS DISPLAY SYSTEM ========
    const gearsAndTearsLyrics = [
        { time: 0,   text: "🔥 'Gears and Tears' 🔥 - A Flamenco Ballad of Engineering Struggles" },
        { time: 3,   text: "(Intro – slow, melancholic guitar strums, soft tapping on the cajón)" },
    
        { time: 8,   text: "[Verse 1]" },
        { time: 10,  text: "Mama, why I choose this way?" },
        { time: 14,  text: "Circuit boards and numbers play..." },
        { time: 18,  text: "Mind so pening, kepala berat," },
        { time: 22,  text: "Books all open, but brain just shut." },
        { time: 26,  text: "Sitting here, kopi cold," },
        { time: 29,  text: "Midnight oil, story old..." },
        { time: 33,  text: "Professor talk, I nod my head," },
        { time: 37,  text: "But in my mind, I sudah dead." },
        { time: 42,  text: "(Deep, sorrowful guitar riff, then tempo picks up slightly)" },
    
        { time: 46,  text: "[Chorus]" },
        { time: 48,  text: "Ohhh, these gears, they turn, but I don’t know how," },
        { time: 52,  text: "Equations dancing, but my brain say ciao." },
        { time: 56,  text: "Every page I read, like foreign spell," },
        { time: 60,  text: "I try so hard, but still masuk neraka hell!" },
        { time: 64,  text: "(Claps, foot stomps, intensity rising)" },
    
        { time: 68,  text: "[Verse 2]" },
        { time: 70,  text: "Brother, they say, 'Just work smart,'" },
        { time: 74,  text: "But in this game, must break my heart." },
        { time: 78,  text: "Matlab crash, code all wrong," },
        { time: 82,  text: "One assignment take me so damn long!" },
        { time: 86,  text: "Thermo laws, stress and strain," },
        { time: 90,  text: "Euler laugh inside my pain!" },
        { time: 94,  text: "Professor say, 'Just visualize…'" },
        { time: 98,  text: "Brother, I try, but my brain just dies!" },
        { time: 102, text: "(Guitar solo, heavy on the emotion, then a softer bridge)" },
    
        { time: 106, text: "[Bridge] (slower, almost whispering)" },
        { time: 108, text: "Tolong lah, Tuhan, kasi chance sikit," },
        { time: 112, text: "Finals coming, must naik legit…" },
        { time: 116, text: "Mama call, 'Anak, you makan?'" },
        { time: 120, text: "How to eat, when GPA sinking, man?" },
        { time: 124, text: "(Drums kick back in, energy surges again!)" },
    
        { time: 128, text: "[Chorus]" },
        { time: 130, text: "Ohhh, these gears, they turn, but I don’t know how," },
        { time: 134, text: "Equations dancing, but my brain say ciao." },
        { time: 138, text: "Every page I read, like foreign spell," },
        { time: 142, text: "I try so hard, but still masuk neraka hell!" },
    
        { time: 146, text: "[Verse 3] (faster, desperation in the voice)" },
        { time: 148, text: "I see my friends, they got it right," },
        { time: 152, text: "One try only, so damn bright!" },
        { time: 156, text: "I ask them, 'Bro, teach me please?'" },
        { time: 160, text: "They say 'Easy lah!' but I still freeze!" },
        { time: 164, text: "Test come near, heart go BOOM," },
        { time: 168, text: "Library floor, my second room…" },
        { time: 172, text: "Assignment due, lecturer cold," },
        { time: 176, text: "“No late work,” man, why so bold??" },
        { time: 180, text: "(Another short but sharp guitar solo, heavy strumming, tapping, raw emotion!)" },
    
        { time: 184, text: "[Chorus – last time, louder, full desperation!]" },
        { time: 186, text: "Ohhh, these gears, they turn, but I don’t know how," },
        { time: 190, text: "Equations laughing, my brain say ciao." },
        { time: 194, text: "I swear I study, I try, I try," },
        { time: 198, text: "But one more failure, I surely die!" },
    
        { time: 202, text: "[Outro] (softly, emotional, as if losing strength)" },
        { time: 205, text: "Maybe one day, I will see," },
        { time: 209, text: "A world where formulas don’t kill me..." },
        { time: 213, text: "Till then I fight, I cry, I bleed," },
        { time: 217, text: "Final year, please let me be free…" },
        { time: 221, text: "(Guitar fades, slow rhythmic claps, a deep sigh… the struggle continues.)" },
    ];
    
    /*************************************
     * Because you want the same lyrics for
     * both songs, we do this:
     *************************************/
    const lyricsSong1 = gearsAndTearsLyrics;
    const lyricsSong2 = gearsAndTearsLyrics;
    
    /*************************************
     * 2) Grab references to needed DOM
     *************************************/
    const lyricsDisplay = document.getElementById('lyricsDisplay');
    
    /*************************************
     * 3) A helper function to pick the
     *    correct lyric line based on
     *    currentTime
     *************************************/
    function getLyricLine(lyricsArray, currentTime) {
        // Start with the first line
        let lineToShow = "";
        for (let i = 0; i < lyricsArray.length; i++) {
        // If this lyric’s start time <= currentTime, it’s eligible
        if (lyricsArray[i].time <= currentTime) {
            lineToShow = lyricsArray[i].text;
        } else {
            // The moment we find a line whose time is > currentTime, we stop
            break;
        }
        }
        return lineToShow;
    }
    
    /*************************************
     * 4) Update lyrics while Song 1 plays
     *************************************/
    song1.addEventListener("timeupdate", () => {
        if (song1.paused) return;
        const current = song1.currentTime;
        const lyric = getLyricLine(lyricsSong1, current);
        lyricsDisplay.textContent = lyric;
    });
    
    /*************************************
     * 5) Update lyrics while Song 2 plays
     *************************************/
    song2.addEventListener("timeupdate", () => {
        if (song2.paused) return;
        const current = song2.currentTime;
        const lyric = getLyricLine(lyricsSong2, current);
        lyricsDisplay.textContent = lyric;
    });
    
    /*************************************
     * 6) Clear lyrics when user pauses
     *    or switches from one song to another
     *************************************/
    song1.addEventListener("pause", () => {
        // If you want to CLEAR the text whenever song1 is paused:
        // lyricsDisplay.textContent = "";
    });
    
    song2.addEventListener("pause", () => {
        // lyricsDisplay.textContent = "";
    });
    
    /*************************************
     * 7) If you have logic that stops the other
     *    song before playing the new one,
     *    also clear lyrics there
     *************************************/
    function stopOtherSong(otherSong, otherBtn) {
        otherSong.pause();
        otherSong.currentTime = 0;
        otherBtn.textContent = otherBtn.textContent.replace('Pause', 'Play');
        // Clear lyrics if you want them gone when switching songs:
        lyricsDisplay.textContent = "";
    }
    
    /*************************************
     * 8) Existing code that sets up
     *    your toggleSong1Btn / toggleSong2Btn
     *************************************/
    document.addEventListener('DOMContentLoaded', () => {
        const song1 = document.getElementById('song1');
        const song2 = document.getElementById('song2');
        const toggleSong1Btn = document.getElementById('toggleSong1Btn');
        const toggleSong2Btn = document.getElementById('toggleSong2Btn');
        
        let song1Playing = false;
        let song2Playing = false;
    
        // Replaces your existing "stopOtherSong" with the new version above:
        // function stopOtherSong(...) { ... } – already declared above
    
        // Toggle Song 1
        toggleSong1Btn.addEventListener('click', () => {
        if (!song1Playing) {
            // If Song 2 was playing, stop it
            if (song2Playing) {
            stopOtherSong(song2, toggleSong2Btn);
            song2Playing = false;
            }
            // Attempt to play Song 1
            song1.play().then(() => {
            song1Playing = true;
            toggleSong1Btn.textContent = 'Pause Song 1';
            }).catch(err => {
            console.log('Song 1 play blocked:', err);
            });
        } else {
            // Pause Song 1
            song1.pause();
            song1Playing = false;
            toggleSong1Btn.textContent = 'Play Song 1';
        }
        });
    
        // Toggle Song 2
        toggleSong2Btn.addEventListener('click', () => {
        if (!song2Playing) {
            // If Song 1 was playing, stop it
            if (song1Playing) {
            stopOtherSong(song1, toggleSong1Btn);
            song1Playing = false;
            }
            // Attempt to play Song 2
            song2.play().then(() => {
            song2Playing = true;
            toggleSong2Btn.textContent = 'Pause Song 2';
            }).catch(err => {
            console.log('Song 2 play blocked:', err);
            });
        } else {
            // Pause Song 2
            song2.pause();
            song2Playing = false;
            toggleSong2Btn.textContent = 'Play Song 2';
        }
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Make sure ScrollTrigger is registered
        gsap.registerPlugin(ScrollTrigger);
      
        // 1) Pin the entire intro so it stays in place while user scrolls through it.
        ScrollTrigger.create({
          trigger: "#cinematicIntro",
          start: "top top",
          end: "bottom top", 
          pin: true,
          pinSpacing: false, 
          // This keeps the intro pinned until we've scrolled through it.
        });
      
        // 2) Move the background layer at a slower speed
        gsap.to(".layer-bg", {
          scrollTrigger: {
            trigger: "#cinematicIntro",
            start: "top top",
            end: "bottom top",
            scrub: true, // allows smooth parallax on scroll
          },
          y: "-30%", // background moves up 30% while scrolling
          ease: "none",
        });
      
        // 3) Move the middle layer slightly faster
        gsap.to(".layer-mid", {
          scrollTrigger: {
            trigger: "#cinematicIntro",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
          y: "-50%", // moves up 50%
          ease: "none",
        });
      
        // 4) Optionally fade in the text as we scroll
        gsap.from(".layer-front .intro-title", {
          scrollTrigger: {
            trigger: "#cinematicIntro",
            start: "top top+=100", // fade in after some scrolling
            end: "bottom top",
            scrub: true,
          },
          opacity: 0,
          y: 50,
          ease: "power1.out",
        });
      });

    
    

    

    // ======== SLIDESHOW SYSTEM ========
    document.addEventListener('DOMContentLoaded', () => {
        initializeSlideshow('picture-slideshow', 'picture-dots');
        initializeSlideshow('video-slideshow', 'video-dots');
    });

    document.addEventListener('DOMContentLoaded', () => {
        const heroSection = document.querySelector('#home');
        const elements = {
            subtitle: heroSection.querySelector('.hero-subtitle'),
            name: heroSection.querySelector('h1'),
            description: heroSection.querySelector('.hero-description'),
            buttons: heroSection.querySelector('.project-links')
        };
    
        // Typing animation function
        const typeText = (element, text, speed = 50) => {
            return new Promise(resolve => {
                element.style.opacity = '1';
                let index = 0;
                const cursor = document.createElement('span');
                cursor.className = 'typing-cursor';
                cursor.textContent = '▌';
                element.appendChild(cursor);
                
                const type = () => {
                    if (index < text.length) {
                        element.insertBefore(document.createTextNode(text[index]), cursor);
                        index++;
                        setTimeout(type, speed);
                    } else {
                        cursor.remove();
                        resolve();
                    }
                };
                
                type();
            });
        };
    
        // Animation sequence
        setTimeout(async () => {
            // Animate subtitle
            await typeText(elements.subtitle, 'Computer Engineering Student');
            
            // Animate name
            elements.name.style.opacity = '1';
            await typeText(elements.name, 'Pedro Fabian Owono', 100);
            
            // Animate description
            elements.description.style.opacity = '1';
            await typeText(elements.description, 
                'Bridging software solutions through innovative engineering ' +
                'and computational thinking. Passionate about design, sound ' +
                'engineering, programming, and full-stack development.', 30);
            
            // Show buttons
            elements.buttons.style.opacity = '1';
            elements.buttons.style.animation = 'fadeIn 1s ease-out';
        }, 1000);
    });

    document.querySelectorAll('.typing-container').forEach(container => {
        const text = container.dataset.text;
        let html = '';
        
        text.split('').forEach((char, index) => {
            html += `<span style="animation-delay: ${index * 0.1}s">${char}</span>`;
        });
        
        container.innerHTML = html + `<span class="blink-cursor"></span>`;
    });

    // Mobile Menu Toggle
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.navbar').appendChild(menuToggle);

    menuToggle.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('active');
    });

    // Touch Device Improvements
    if (isTouchDevice) {
        document.querySelectorAll('.project-link').forEach(link => {
            link.style.cursor = 'pointer';
            link.addEventListener('touchend', () => {
                link.style.transform = 'scale(0.98)';
                setTimeout(() => link.style.transform = '', 100);
            });
        });
    }

    // Prevent Mobile Zoom
    document.addEventListener('touchmove', function(e) {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });

    // Viewport Height Fix
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setVH();
    window.addEventListener('resize', setVH);

    // ======== GPU ACCELERATION ========
    const gpuAccelerate = element => {
        element.style.transform = 'translateZ(0)';
        element.style.backfaceVisibility = 'hidden';
    };
})();

/*************************************************************
  3) Also replaced the repeated “mediaObserver” below with the
     normal IntersectionObserver usage from above. Just ensure
     there’s no duplication or conflict. If you had a second one
     for some reason, remove or unify it.
*************************************************************/

// Removed the duplicate mediaObserver that was declared again.
