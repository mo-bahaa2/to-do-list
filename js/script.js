document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('enjaz_tasks')) || [];
    let selectedSound = localStorage.getItem('enjaz_sound') || 'clap';

    const soundsMap = {
        'clap': { label: 'تصفيق', emoji: '👏', file: 'sounds/تسقيف.mp3' },
        'bravo': { label: 'برافووو عليك', emoji: '😂', file: 'sounds/برافو عليك _ مدحت شلبي.mp3' },
        'yalla': { label: 'يلااا بينااا', emoji: '😎', file: 'sounds/يلا بينا.mp3' }
    };

    // --- DOM Elements ---
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const shareBtn = document.getElementById('shareBtn');
    
    const openSoundModal = document.getElementById('openSoundModal');
    const closeModal = document.getElementById('closeModal');
    const soundModal = document.getElementById('soundModal');
    const soundCards = document.querySelectorAll('.sound-card');
    const currentSoundLabel = document.getElementById('currentSoundLabel');

    // --- Audio setup ---
    // Using actual MP3 files from the 'sounds' folder
    function playSound(soundType) {
        const soundInfo = soundsMap[soundType];
        if (soundInfo && soundInfo.file) {
            const audio = new Audio(soundInfo.file);
            audio.play().catch(e => console.log('Error playing sound:', e));
        }
    }

    // --- Initialize ---
    function init() {
        updateSoundUI();
        renderTasks();
    }

    // --- Sound Modal Logic ---
    openSoundModal.addEventListener('click', () => {
        soundModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        soundModal.classList.remove('active');
    });

    // Close modal when clicking outside
    soundModal.addEventListener('click', (e) => {
        if (e.target === soundModal) {
            soundModal.classList.remove('active');
        }
    });

    soundCards.forEach(card => {
        card.addEventListener('click', () => {
            const sound = card.getAttribute('data-sound');
            selectedSound = sound;
            localStorage.setItem('enjaz_sound', selectedSound);
            
            // Play a preview!
            playSound(selectedSound);
            
            updateSoundUI();
            
            setTimeout(() => {
                soundModal.classList.remove('active');
            }, 300);
        });
    });

    function updateSoundUI() {
        soundCards.forEach(card => {
            if (card.getAttribute('data-sound') === selectedSound) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        currentSoundLabel.textContent = `صوت الإنجاز: ${soundsMap[selectedSound].label}`;
    }

    // --- Tasks Logic ---
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = taskInput.value.trim();
        const duration = document.querySelector('input[name="duration"]:checked').value;
        
        if (!title) return;

        const newTask = {
            id: Date.now().toString(),
            title,
            duration,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask); // Add to top
        saveAndRender();
        
        taskInput.value = '';
    });

    function saveAndRender() {
        localStorage.setItem('enjaz_tasks', JSON.stringify(tasks));
        renderTasks();
    }

    function formatDuration(minutes) {
        if (minutes == 30) return 'نصاية خفيفة';
        if (minutes == 60) return 'ساعة زمن';
        if (minutes == 120) return 'ساعتين تركيز';
        if (minutes == 180) return '٣ ساعات شغل';
        if (minutes == 240) return '٤ ساعات بالتمام';
        if (minutes == 300) return '٥ ساعات كفاح';
        return `${minutes} دقيقة`;
    }

    window.toggleTask = function(id, btnElement) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;

        const isCompleting = !tasks[taskIndex].completed;
        tasks[taskIndex].completed = isCompleting;
        
        if (isCompleting) {
            // Success Animation and Sound!
            playSound(selectedSound);
            
            // Confetti effect!
            const rect = btnElement.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;
            
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x, y },
                colors: ['#8b5cf6', '#10b981', '#ffffff']
            });
        }
        
        saveAndRender();
    };

    window.deleteTask = function(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    };

    function renderTasks() {
        taskList.innerHTML = '';
        
        const pendingCount = tasks.filter(t => !t.completed).length;
        taskCount.textContent = pendingCount;

        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coffee"></i>
                    <h3>مافيش مهام حالياً؟</h3>
                    <p>الظاهر إنك مخلص كل اللي وراك، أو مكسل تكتب! ضيف أول مهمة يلا.</p>
                </div>
            `;
            return;
        }

        // Sort: pending first, completed last
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.completed === b.completed) {
                return b.id - a.id; // Newest first
            }
            return a.completed ? 1 : -1;
        });

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <button class="complete-btn" onclick="toggleTask('${task.id}', this)" aria-label="تحديد كمكتمل">
                    <i class="fas fa-check"></i>
                </button>
                <div class="task-info">
                    <span class="task-name">${task.title}</span>
                    <div class="task-meta">
                        <span><i class="far fa-clock"></i> ${formatDuration(task.duration)}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteTask('${task.id}')" aria-label="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            taskList.appendChild(li);
        });
    }

    // --- Share feature ---
    shareBtn.addEventListener('click', async () => {
        const textToShare = tasks.map(t => 
            `${t.completed ? '✅' : '⏳'} ${t.title} (${formatDuration(t.duration)})`
        ).join('\n');
        
        const shareContent = `شوفوا إنجازات النهارده.. حد يتحداني؟\n\n${textToShare}\n\n#بطل_الإنجاز`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'قائمة مهامي',
                    text: shareContent
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareContent).then(() => {
                alert('تم النسخ بنجاح! جاهز تنشر الإنجاز؟');
            });
        }
    });

    init();
});
