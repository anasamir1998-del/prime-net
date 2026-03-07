document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav ul li a');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        // Check if the click is outside the menu toggle and the nav itself
        if (menuToggle && nav && !menuToggle.contains(e.target) && !nav.contains(e.target)) {
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            // Close mobile menu on click if it's open
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }

            const targetId = this.getAttribute('href');
            if (targetId === '#') {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80; // Original offset
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        const logo = document.querySelector('.logo-img');
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            header.style.padding = '5px 0';
            if (logo) {
                logo.style.height = '100px';
                logo.style.width = '200px';
            }
        } else {
            header.style.boxShadow = 'none';
            header.style.padding = '10px 0';
            if (logo) {
                logo.style.height = '180px';
                logo.style.width = '350px';
            }
        }
    });
});

// Element Animations are now handled by AOS in index.html

// Portfolio Filtering
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterBtns.length > 0 && projectCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                filterBtns.forEach(b => b.classList.remove('active'));
                // Set active to clicked
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                projectCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });

                // Refresh AOS after DOM changes
                setTimeout(() => {
                    if (typeof AOS !== 'undefined') AOS.refresh();
                }, 350);
            });
        });
    }
});

// Stats Counter Animation
const statsSection = document.querySelector('.stats');
const counters = document.querySelectorAll('.counter');
let started = false;

if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !started) {
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const duration = 2000;
                const increment = target / (duration / 16);

                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.innerText = Math.ceil(current) + "+";
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target + "+";
                    }
                };
                updateCounter();
            });
            started = true;
        }
    });
    statsObserver.observe(statsSection);
}

// AI Chat Widget Logic
document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chatToggle');
    const chatWidget = document.getElementById('chatWidget');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendMessage = document.getElementById('sendMessage');
    const chatBody = document.getElementById('chatBody');

    if (chatToggle && chatWidget) {
        chatToggle.addEventListener('click', () => {
            chatWidget.classList.add('active');
            chatToggle.style.display = 'none';
        });

        closeChat.addEventListener('click', () => {
            chatWidget.classList.remove('active');
            chatToggle.style.display = 'flex';
        });
    }

    const addMessage = (text, sender) => {
        const div = document.createElement('div');
        div.classList.add('message', sender);

        const content = document.createElement('div');
        content.classList.add('message-content');
        content.innerHTML = text;

        const time = document.createElement('div');
        time.classList.add('message-time');
        time.innerText = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

        div.appendChild(content);
        div.appendChild(time);
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Advanced Chatbot Logic with Fuzzy Matching & Expanded Knowledge Base
    const knowledgeBase = [
        {
            intent: 'greeting',
            keywords: ['مرحبا', 'هلا', 'اهلين', 'سلام', 'السلام عليكم', 'هاي', 'الو', 'مساء الخير', 'صباح الخير'],
            responses: [
                'أهلاً بك في PRIME NET! 👋 كيف يمكنني مساعدتك اليوم؟',
                'وعليكم السلام! نورتنا 🌹، تفضل بأي استفسار.',
                'يا هلا! 🤩 أنا هنا لخدمتك، اطلب ما تشاء.'
            ]
        },
        {
            intent: 'price',
            keywords: ['سعر', 'اسعار', 'بكام', 'تكلفة', 'فلوس', 'عرض', 'خصم', 'كم يكلف', 'غالي', 'رخيص'],
            responses: [
                'الأسعار تعتمد بدقة على تفاصيل مشروعك (نوع الأجهزة، العدد، التمديدات). 💰\nالأفضل تتواصل معنا اتصال أو واتساب عشان نعطيك عرض سعر يناسبك تماماً!',
                'صدقني بنعطيك أفضل سعر مقابل الجودة! 💎\nبس حتاج نعرف تفاصيل طلبك أولاً. تواصل معنا واتساب من الزر العائم.',
                'ما نختلف في السعر إن شاء الله! 😉\nتواصل مع المبيعات على 0592973183 وراح يضبطوك.'
            ]
        },
        {
            intent: 'services',
            keywords: ['خدمات', 'ايش تسوو', 'نشاط', 'عمل', 'ماذا تقدمون', 'انظمة', 'كاميرات', 'شبكات', 'سنترال', 'بصمة', 'صوتيات'],
            responses: [
                'احنا في PRIME NET بتاع كله في التقنية! 😎\nنقدم:\n📹 كاميرات مراقبة\n🌐 شبكات وسنترالات\n🔐 أجهزة بصمة وتحكم\n🔊 أنظمة صوتية\n💻 تصميم مواقع وتطبيقات',
                'نقدر نخدمك في أي شيء يخص الـ Low Current Systems والبرمجة. 🛠️\nمن الكاميرات للشبكات وحتى تصميم موقعك الإلكتروني.',
                'خدماتنا شاملة: توريد، تركيب، وضمان. ✅\nمتخصصين في الأنظمة الأمنية والشبكات وحلول الويب.'
            ]
        },
        {
            intent: 'contact',
            keywords: ['رقم', 'جوال', 'هاتف', 'تواصل', 'اتصال', 'كلمكم', 'وينكم', 'واتس', 'ايميل'],
            responses: [
                'أسرع طريقة تتواصل معنا هي الواتساب أو الاتصال المباشر. 📞\nرقمنا: 0592973183',
                'موجودين لخدمتك! 🤝\nاتصل بنا على 0592973183 أو اضغط على زر الواتساب في الزاوية.',
                'فريقنا جاهز للرد على استفساراتك. 👂\nرقم الجوال والواتس: 0592973183'
            ]
        },
        {
            intent: 'location',
            keywords: ['موقع', 'عنوان', 'وين مكانكم', 'مقر', 'فرع', 'الرياض', 'جده', 'الدمام'],
            responses: [
                'المقر الرئيسي في المملكة العربية السعودية 🇸🇦 ونغطي مشاريع في مختلف المناطق.',
                'نحن نعمل في السعودية ونوصل خدماتنا لأغلب المدن. 🚚',
                'موقعنا السعودية، ونقدر نوصلك وين ما كنت! 📍'
            ]
        },
        {
            intent: 'thanks',
            keywords: ['شكرا', 'مشكور', 'يعطيك العافية', 'ما قصرت', 'تسلم', 'جزاك الله خير'],
            responses: [
                'العفو! هذا واجبنا 🌹',
                'الله يعافيك! نحن بالخدمة دائماً. 😊',
                'ولو! اتشرفنا بك. 🙏'
            ]
        },
        {
            intent: 'who_are_you',
            keywords: ['مين انت', 'الروبوت', 'اسمك', 'عرفني بنفسك', 'ذكاء اصطناعي'],
            responses: [
                'أنا المساعد الذكي الخاص بـ PRIME NET! 🤖\nمبرمج عشان أجاوبك بسرعة وأساعدك توصل للي تبيه.',
                'أنا زميلك الرقمي 👾\nلسه بتعلم، بس بحاول أكون مفيد قد ما أقدر!'
            ]
        },
        {
            intent: 'insult',
            keywords: ['غبي', 'حيوان', 'احمق', 'ما تفهم', 'زفت'],
            responses: [
                'سامحك الله 😅 انا مجرد روبوت أحاول المساعدة.',
                'شكراً على ذوقك! 🤖💔 سأحاول تحسين نفسي.',
                'الكلمة الطيبة صدقة 🌹'
            ]
        }
    ];

    // Helper: Calculate Levenshtein Distance (Typo tolerance)
    const levenshtein = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    // Helper: Calculate Similarity Score (0 to 1)
    const getSimilarity = (s1, s2) => {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;
        return (longerLength - levenshtein(longer, shorter)) / longerLength;
    };

    // Google Gemini API Configuration (To make it smart, add your key here)
    const GEMINI_API_KEY = 'AIzaSyD0ZPyUT_bw1XQjyRgsDk-VUv1ahU1wB2o'; // ضَع مفتاح الـ API الخاص بـ Gemini هنا بين علامات التنصيص
    let chatHistory = [];

    const callGeminiAPI = async (message) => {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            const systemInstruction = `أنت مساعد ذكي لشركة PRIME NET (برايم نت) لتقنية المعلومات والأنظمة الأمنية في السعودية.
خدماتنا تشمل: تركيب كاميرات مراقبة، أجهزة شبكات وسيرفرات، بوابات تحكم بالدخول، أجهزة حضور وانصراف (بصمة)، سنترالات وإنتركم، وأنظمة صوتية.
أجب باختصار وبطريقة احترافية وودودة باللغة العربية. إذا سألك أحد عن الأسعار، أخبره أن الأسعار تعتمد على المعاينة والمتطلبات واطلب منه تعبئة نموذج طلب عرض السعر أو الاستشارة في الموقع.`;

            const contents = chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
            contents.push({ role: 'user', parts: [{ text: message }] });

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: contents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const reply = data.candidates[0].content.parts[0].text;

            chatHistory.push({ role: 'user', text: message });
            chatHistory.push({ role: 'bot', text: reply });
            if (chatHistory.length > 10) chatHistory = chatHistory.slice(chatHistory.length - 10);

            // Convert simple markdown (**bold**) to HTML for nice rendering
            return reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } catch (error) {
            console.error('Gemini Error:', error);
            // Fallback to local rules if API fails
            return getAIResponse(message);
        }
    };

    const getAIResponse = (input) => {
        const text = input.toLowerCase().trim();
        let bestIntent = null;
        let highestScore = 0;

        // Check against Knowledge Base
        knowledgeBase.forEach(category => {
            category.keywords.forEach(keyword => {
                const score = getSimilarity(text, keyword); // Direct match check

                // Allow partial sentence matching too (if user types a long sentence)
                // We check if any significant word provided by user is close to a keyword
                const userWords = text.split(' ');
                let wordHighScore = 0;
                userWords.forEach(word => {
                    if (word.length < 2) return; // Skip short words
                    const wScore = getSimilarity(word, keyword);
                    if (wScore > wordHighScore) wordHighScore = wScore;
                });

                const finalScore = Math.max(score, wordHighScore);

                if (finalScore > highestScore) {
                    highestScore = finalScore;
                    bestIntent = category;
                }
            });
        });

        // Threshold for understanding (0.6 means 60% similarity required)
        if (highestScore > 0.60 && bestIntent) {
            const responses = bestIntent.responses;
            return responses[Math.floor(Math.random() * responses.length)];
        }

        return 'عذراً، ما فهمت عليك بالضبط 🤔\nممكن توضح أكثر؟ أو تختار من القائمة:\n\n1️⃣ خدماتنا\n2️⃣ الأسعار\n3️⃣ التواصل';
    }

    const handleUserMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        // Simulate typing
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot');
        loadingDiv.innerHTML = '<div class="message-content">جاري الكتابة...</div>';
        chatBody.appendChild(loadingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        let responseText = '';

        // If Gemini API Key is provided, use it, otherwise fall back to local responses
        if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
            responseText = await callGeminiAPI(text);
        } else {
            // Simulate network delay for local responses
            await new Promise(resolve => setTimeout(resolve, 800));
            responseText = getAIResponse(text);
        }

        loadingDiv.remove();
        addMessage(responseText, 'bot');
    }

    if (sendMessage && chatInput) {
        sendMessage.addEventListener('click', handleUserMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserMessage();
        });

        // Chat Chips Logic
        const chatChips = document.querySelectorAll('.chat-chip');
        chatChips.forEach(chip => {
            chip.addEventListener('click', () => {
                chatInput.value = chip.textContent;
                handleUserMessage();

                // Hide chips after first use to clean up chat
                const chipsContainer = document.querySelector('.chat-chips');
                if (chipsContainer) {
                    chipsContainer.style.display = 'none';
                }
            });
        });
    }
});



// Custom Right Click Alert & Enhanced Screenshot Protection
const createCustomAlert = () => {
    if (document.getElementById('customAlert')) return;

    const alertHTML = `
        <div id="customAlert" class="custom-alert-overlay">
            <div class="custom-alert-box">
                <div class="custom-alert-icon">🚫</div>
                <div class="custom-alert-message">عذراً، هذا الإجراء غير مسموح به لحماية المحتوى 🚫</div>
                <p style="color: #94a3b8;">حقوق الملكية محفوظة لـ PRIME NET</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);

    const alertOverlay = document.getElementById('customAlert');

    const showRestrictedAlert = () => {
        alertOverlay.classList.add('active');
        if (navigator.vibrate) navigator.vibrate(200);

        // Lock screen and ensure overlay is visible
        document.body.style.overflow = 'hidden';

        // Clear clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText('حقوق الملكية محفوظة لـ PRIME NET - ممنوع النسخ');
        }

        // Hide alert after 3 seconds
        setTimeout(() => {
            alertOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }, 3000);
    };

    // Right Click Protection
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showRestrictedAlert();
    });

    // Keyboard Shortcuts Protection
    const checkKey = (e) => {
        if (
            e.key === 'PrintScreen' ||
            (e.ctrlKey && e.key === 'p') ||
            (e.ctrlKey && e.key === 's') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.key === 'F12') ||
            (e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS'))
        ) {
            e.preventDefault();
            e.stopPropagation();
            showRestrictedAlert();
            return true;
        }
        return false;
    };

    document.addEventListener('keydown', checkKey);
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') showRestrictedAlert();
    });

    // Window Blur (Often triggered by Snipping Tool)
    window.addEventListener('blur', () => {
        showRestrictedAlert(); // Trigger black screen on blur
        if (navigator.clipboard) {
            navigator.clipboard.writeText('');
        }
    });

    // Mobile Long Press Support with Tolerance
    let longPressTimer;
    let startX, startY;
    let longPressHappened = false;
    const tolerance = 10;

    document.addEventListener('touchstart', (e) => {
        longPressHappened = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        longPressTimer = setTimeout(() => {
            longPressHappened = true;
            showRestrictedAlert();
        }, 500);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        const diffX = Math.abs(e.touches[0].clientX - startX);
        const diffY = Math.abs(e.touches[0].clientY - startY);

        if (diffX > tolerance || diffY > tolerance) {
            clearTimeout(longPressTimer);
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        clearTimeout(longPressTimer);
        if (longPressHappened) {
            e.preventDefault(); // Prevent ghost click
        }
    }, { passive: false });

    document.addEventListener('touchcancel', () => clearTimeout(longPressTimer));

    // Close on click anywhere
    alertOverlay.addEventListener('click', () => {
        alertOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            alertOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
};

document.addEventListener('DOMContentLoaded', createCustomAlert);

// Preloader Logic
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 4500); // Minimum 4.5s display time for full animation
    }
});

// Typewriter Effect
const typewriterElement = document.getElementById('typewriter');
if (typewriterElement) {
    const phrases = [
        "حلول تقنية متكاملة",
        "نبتكر المستقبل الرقمي",
        "نؤمن بياناتك وأعمالك",
        "شريكك في النجاح"
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typewriterElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typewriterElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // Pause before new phrase
        }

        setTimeout(type, typeSpeed);
    }

    // Start typing after preloader
    setTimeout(type, 5000);
}

// Back to Top Logic
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    });
}

/* ==========================================================================
   Admin & Content Editor System
   ========================================================================== */

(function () {
    // 1. Configuration
    const ADMIN_PASSWORD = '3798';
    const GITHUB_CONFIG = {
        owner: 'anasamir1998-del',
        repo: 'primenet',
        path: 'index.html'
    };

    let isLoggedIn = false;
    let isEditing = false;
    let originalHTML = '';

    // 2. Inject Admin UI
    const injectAdminUI = () => {
        const uiHTML = `
            <!-- Admin Login Modal -->
            <div id="adminLoginModal">
                <div class="admin-login-box">
                    <h2>تسجيل دخول المسؤول</h2>
                    <input type="password" id="adminPasswordInput" placeholder="ادخل كلمة المرور">
                    <div id="githubTokenSetup" style="display:none; margin-top:15px; border-top:1px solid rgba(255,255,255,0.1); padding-top:15px">
                        <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px">إعداد الحفظ التلقائي (GitHub API)</p>
                        <input type="password" id="ghTokenInput" placeholder="GitHub Personal Access Token">
                    </div>
                    <button class="btn btn-primary" id="adminLoginBtn">دخول</button>
                    <button class="btn" style="margin-top:10px; color:#94a3b8" id="closeAdminLogin">إغلاق</button>
                </div>
            </div>

            <!-- Editor Toolbar -->
            <div id="editorToolbar">
                <button class="editor-btn toggle-edit-btn" id="toggleEditBtn">
                    <i class="fas fa-edit"></i> وضع التحرير: <span>مغلق</span>
                </button>
                <div class="toolbar-divider" style="width:1px; height:20px; background:rgba(255,255,255,0.1)"></div>
                <button class="editor-btn btn-save" id="saveContentBtn"><i class="fas fa-cloud-upload-alt"></i> حفظ في GitHub</button>
                <button class="editor-btn btn-cancel" id="cancelEditBtn"><i class="fas fa-undo"></i> تراجع</button>
                <button class="editor-btn btn-export" id="exportBtn"><i class="fas fa-file-code"></i> تصدير الكود</button>
                <button class="editor-btn btn-token" id="setupTokenBtn"><i class="fas fa-key"></i> إعداد الـ Token</button>
                <button class="editor-btn btn-logout" id="adminLogoutBtn"><i class="fas fa-sign-out-alt"></i> خروج</button>
            </div>
            
            <!-- Loading Indicator -->
            <div id="adminLoading">
                <div class="loader"></div>
                <p>جاري تحديث الموقع على GitHub...</p>
            </div>

            <!-- Export Modal -->
            <div id="exportModal">
                <div class="export-box">
                    <h3>
                        <span>تصدير كود HTML المعدل</span>
                        <button id="closeExportModal" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer">&times;</button>
                    </h3>
                    <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:10px">انسخ الكود التالي وضعه في ملف index.html لحفظ التعديلات بشكل دائم.</p>
                    <textarea id="exportCodeArea" readonly></textarea>
                    <button class="btn btn-primary" id="copyCodeBtn">نسخ الكود</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', uiHTML);
    };

    // 3. Authentication Logic
    const initAuth = () => {
        const trigger = document.getElementById('adminTrigger');
        if (trigger) {
            trigger.addEventListener('click', () => {
                const hasToken = !!localStorage.getItem('gh_token');
                document.getElementById('githubTokenSetup').style.display = hasToken ? 'none' : 'block';
                document.getElementById('adminLoginModal').classList.add('active');
            });
        }

        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            const pass = document.getElementById('adminPasswordInput').value;
            const token = document.getElementById('ghTokenInput').value;

            if (pass === ADMIN_PASSWORD) {
                isLoggedIn = true;
                if (token) localStorage.setItem('gh_token', token);
                document.getElementById('adminLoginModal').classList.remove('active');
                document.getElementById('editorToolbar').classList.add('active');
                alert('تم تسجيل الدخول بنجاح! يمكنك الآن تفعيل وضع التحرير.');
                localStorage.setItem('primenet_admin', 'true');
            } else {
                alert('كلمة المرور غير صحيحة!');
            }
        });

        document.getElementById('closeAdminLogin').addEventListener('click', () => {
            document.getElementById('adminLoginModal').classList.remove('active');
        });

        document.getElementById('setupTokenBtn').addEventListener('click', () => {
            const newToken = prompt('ادخل GitHub Personal Access Token الجديد:', localStorage.getItem('gh_token') || '');
            if (newToken !== null) {
                localStorage.setItem('gh_token', newToken);
                alert('تم حفظ الـ Token بنجاح.');
            }
        });

        document.getElementById('adminLogoutBtn').addEventListener('click', () => {
            isLoggedIn = false;
            disableEditMode();
            document.getElementById('editorToolbar').classList.remove('active');
            localStorage.removeItem('primenet_admin');
        });

        if (localStorage.getItem('primenet_admin') === 'true') {
            isLoggedIn = true;
            document.getElementById('editorToolbar').classList.add('active');
        }
    };

    // 4. Editor Logic
    const enableEditMode = () => {
        isEditing = true;
        originalHTML = document.body.innerHTML;
        const btn = document.getElementById('toggleEditBtn');
        btn.classList.add('editing');
        btn.querySelector('span').innerText = 'مفتوح';

        // Make text elements editable
        const editableSelectors = 'h1, h2, h3, h4, p, span, li, .btn';
        document.querySelectorAll(editableSelectors).forEach(el => {
            if (!el.closest('#editorToolbar') && !el.closest('#adminLoginModal') && !el.closest('#exportModal')) {
                el.setAttribute('contenteditable', 'true');
            }
        });

        // Make images editable
        document.querySelectorAll('img').forEach(img => {
            if (!img.closest('#editorToolbar') && !img.closest('.admin-login-box')) {
                img.classList.add('edit-mode-image');
                img.addEventListener('click', imageHandler);
            }
        });

        // Disable overlays in section cards to allow clicking images
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.style.pointerEvents = 'none';
        });
    };

    const disableEditMode = () => {
        isEditing = false;
        const btn = document.getElementById('toggleEditBtn');
        if (btn) {
            btn.classList.remove('editing');
            btn.querySelector('span').innerText = 'مغلق';
        }

        document.querySelectorAll('[contenteditable]').forEach(el => {
            el.removeAttribute('contenteditable');
        });

        document.querySelectorAll('.edit-mode-image').forEach(img => {
            img.classList.remove('edit-mode-image');
            img.removeEventListener('click', imageHandler);
        });

        // Re-enable overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.style.pointerEvents = '';
        });
    };

    const imageHandler = function (e) {
        if (!isEditing) return;
        e.preventDefault();
        e.stopPropagation();

        const img = this;
        const choice = confirm('هل تريد اختيار صورة من جهازك؟\n(موافق للأجهزة، إلغاء لإدخال رابط)');

        if (choice) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = ev => {
                const file = ev.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = readerEvent => {
                        img.src = readerEvent.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        } else {
            const newSrc = prompt('ادخل رابط الصورة الجديد (أو اسم الملف):', img.src);
            if (newSrc) {
                img.src = newSrc;
            }
        }
    };

    // 5. GitHub API Operations
    const updateFileOnGitHub = async (content) => {
        const token = localStorage.getItem('gh_token');
        if (!token) {
            alert('يرجى إعداد GitHub Token أولاً من قائمة الإعدادات.');
            return;
        }

        const loading = document.getElementById('adminLoading');
        loading.classList.add('active');

        try {
            // 1. Get the current file SHA
            const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
            const response = await fetch(getUrl, {
                headers: { 'Authorization': `token ${token}` }
            });

            if (!response.ok) throw new Error('فشل الحصول على بيانات الملف من GitHub');
            const fileData = await response.json();
            const sha = fileData.sha;

            // 2. Prepare the update
            // Note: GitHub API expects base64 encoded content
            // We use btoa(unescape(encodeURIComponent(content))) to handle UTF-8
            const encodedContent = btoa(unescape(encodeURIComponent(content)));

            const putResponse = await fetch(getUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update content via Admin Panel',
                    content: encodedContent,
                    sha: sha
                })
            });

            if (putResponse.ok) {
                alert('تم حفظ التعديلات ونشرها على GitHub بنجاح! قد يستغرق ظهورها أونلاين دقيقة واحدة.');
            } else {
                const errorData = await putResponse.json();
                throw new Error(errorData.message || 'فشل تحديث الملف');
            }
        } catch (error) {
            console.error('GitHub API Error:', error);
            alert('حدث خطأ أثناء الحفظ: ' + error.message);
        } finally {
            loading.classList.remove('active');
        }
    };

    // 6. Action Handlers
    const initHandlers = () => {
        document.getElementById('toggleEditBtn').addEventListener('click', () => {
            if (isEditing) disableEditMode();
            else enableEditMode();
        });

        document.getElementById('saveContentBtn').addEventListener('click', async () => {
            if (isEditing) disableEditMode();

            // Prepare clean code for export/save
            const clone = document.documentElement.cloneNode(true);
            clone.querySelectorAll('#adminLoginModal, #editorToolbar, #exportModal, #adminLoading, #customAlert, #chatToggle, #chatWidget, #preloader').forEach(el => el.remove());
            clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
            clone.querySelectorAll('.edit-mode-image').forEach(el => el.classList.remove('edit-mode-image'));

            // Re-inject core scripts if they were removed (to ensure they exist in source)
            // Actually, we only remove items that are injected via JS.

            const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;

            const choice = confirm('هل تريد حفظ التعديلات ونشرها مباشرة على GitHub؟');
            if (choice) {
                await updateFileOnGitHub(htmlContent);
            } else {
                localStorage.setItem('primenet_saved_content', htmlContent);
                alert('تم الحفظ محلياً في المتصفح فقط.');
            }
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من التراجع عن جميع التغييرات غير المحفظة؟')) {
                location.reload();
            }
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            disableEditMode();
            const clone = document.documentElement.cloneNode(true);
            clone.querySelectorAll('#adminLoginModal, #editorToolbar, #exportModal, #adminLoading, #customAlert, #chatToggle, #chatWidget, #preloader').forEach(el => el.remove());
            clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
            clone.querySelectorAll('.edit-mode-image').forEach(el => el.classList.remove('edit-mode-image'));

            const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
            document.getElementById('exportCodeArea').value = htmlContent;
            document.getElementById('exportModal').classList.add('active');
        });

        document.getElementById('closeExportModal').addEventListener('click', () => {
            document.getElementById('exportModal').classList.remove('active');
        });

        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            const area = document.getElementById('exportCodeArea');
            area.select();
            document.execCommand('copy');
            alert('تم نسخ الكود بنجاح!');
        });
    };

    // 6. Persistence Loader
    const loadSavedContent = () => {
        const saved = localStorage.getItem('primenet_saved_content');
        if (saved) {
            // We need to be careful not to overwrite the editor UI if it was already injected
            // Best way: check if admin UI exists after loading
            // But since this is a self-contained IIFE, we run it after DOMContentLoaded
            // and we inject UI *after* loading content if needed.
        }
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        // Only load saved content if it exists
        const saved = localStorage.getItem('primenet_saved_content');
        if (saved) {
            // This is tricky because we might lose event listeners.
            // For a simple static site, it works for text/images.
            // However, it's safer to just encourage the user to EXPORT the code.
            // I will enable loading but with a warning.
            // document.body.innerHTML = saved; 
        }

        injectAdminUI();
        initAuth();
        initHandlers();
    });
})();

/* ==========================================================================
   Contact Form Integration (WhatsApp & Email)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            // 1. Collect Data
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const phone = document.getElementById('contactPhone').value;
            const message = document.getElementById('contactMessage').value;

            // 2. Prepare WhatsApp Message
            const whatsappNumber = '966592973183';
            const text = `*طلبية/استفسار جديدة من الموقع* \n\n` +
                `*الاسم:* ${name}\n` +
                `*الايميل:* ${email}\n` +
                `*الجوال:* ${phone}\n` +
                `*الرسالة:* ${message}`;

            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

            // 3. Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');

            // 4. Note: The form will continue its submission to Formspree 
            // set in the 'action' attribute of the HTML form.
        });
    }
});

/* ==========================================================================
   Quote Modal Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const openQuoteBtn = document.getElementById('openQuoteBtn');
    const quoteModal = document.getElementById('quoteModal');
    const closeQuoteBtn = document.querySelector('.close-quote-modal');
    const quoteForm = document.getElementById('quoteForm');

    if (openQuoteBtn && quoteModal && closeQuoteBtn) {
        openQuoteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            quoteModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeQuoteBtn.addEventListener('click', () => {
            quoteModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close on outside click
        quoteModal.addEventListener('click', (e) => {
            if (e.target === quoteModal) {
                quoteModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('quoteName').value;
            const phone = document.getElementById('quotePhone').value;
            const service = document.getElementById('quoteService').options[document.getElementById('quoteService').selectedIndex].text;
            const details = document.getElementById('quoteDetails').value;

            const text = `*طلب عرض سعر جديد* \n\n` +
                `*الاسم/الشركة:* ${name}\n` +
                `*الجوال:* ${phone}\n` +
                `*الخدمة:* ${service}\n` +
                `*التفاصيل:* ${details || 'لا يوجد'}`;

            const whatsappNumber = '966592973183';
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

            window.open(whatsappUrl, '_blank');
            quoteModal.classList.remove('active');
            document.body.style.overflow = '';
            quoteForm.reset();
        });
    }
});

