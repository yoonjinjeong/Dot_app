document.addEventListener('DOMContentLoaded', () => {
  const circle = document.querySelector('.circle');
  const container = document.querySelector('.container');
  if (!circle) return;

  // Page Management
  let currentPage = 'dot';
  
  const showPage = (pageId) => {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('is-active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
      targetPage.classList.add('is-active');
      currentPage = pageId;
    }
    
    // Show/hide physics dots based on page
    const dotCanvas = document.querySelector('.dot-canvas');
    if (dotCanvas) {
      if (pageId === 'dot') {
        dotCanvas.style.display = 'block';
      } else {
        dotCanvas.style.display = 'none';
      }
    }
    
    // Disable/enable scrolling based on page
    if (pageId === 'dot') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Update navigation
    updateNavigation(pageId);
  };
  
  const updateNavigation = (activeTab) => {
    document.querySelectorAll('.nav-item').forEach(item => {
      const tab = item.getAttribute('data-tab');
      if (tab === activeTab) {
        item.classList.add('is-active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
      }
    });
  };
  
  // Navigation event listeners
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (ev) => {
      const tab = ev.currentTarget.getAttribute('data-tab');
      showPage(tab);
    });
  });
  
  // Initialize with dot page
  showPage('dot');
  
  // Chip functionality
  const handleChipClick = (ev) => {
    const clickedChip = ev.currentTarget;
    const chipContainer = clickedChip.parentElement;
    
    // Remove active class from all chips in this container
    chipContainer.querySelectorAll('.chip').forEach(chip => {
      chip.classList.remove('chip-active');
      chip.classList.add('chip-inactive');
    });
    
    // Add active class to clicked chip
    clickedChip.classList.remove('chip-inactive');
    clickedChip.classList.add('chip-active');
    
    // Get chip value and update list
    const chipValue = clickedChip.getAttribute('data-chip');
    console.log('Selected chip:', chipValue);
    updateListData(chipValue);
  };
  
  // Add chip event listeners
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', handleChipClick);
  });
  
  // Database for archive data (user input)
  const archiveData = [];
  
  // Function to get month abbreviation from date
  const getMonthFromDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  };

  // Function to update list with real data
  const updateListData = (selectedChip = 'all') => {
    const listContainers = document.querySelectorAll('.list-container');
    
    listContainers.forEach(container => {
      // Clear existing items
      container.innerHTML = '';
      
      // Filter data based on selected chip
      let filteredData = archiveData;
      if (selectedChip !== 'all') {
        filteredData = archiveData.filter(item => {
          const itemMonth = getMonthFromDate(item.date);
          return itemMonth.toLowerCase() === selectedChip.toLowerCase();
        });
      }
      
      // Group data by date
      const groupedData = {};
      filteredData.forEach(item => {
        const dateKey = item.formattedDate;
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = [];
        }
        groupedData[dateKey].push(item);
      });
      
      // Sort dates in descending order (newest first)
      const sortedDates = Object.keys(groupedData).sort((a, b) => {
        const dateA = new Date(groupedData[a][0].date);
        const dateB = new Date(groupedData[b][0].date);
        return dateB - dateA;
      });
      
      // Create list items grouped by date
      sortedDates.forEach(dateKey => {
        // Add date subtitle
        const subtitle = document.createElement('div');
        subtitle.className = 'list-date-subtitle';
        subtitle.textContent = dateKey;
        container.appendChild(subtitle);
        
        // Add list items for this date
        groupedData[dateKey].forEach(item => {
          const listItem = document.createElement('div');
          listItem.className = 'list-item';
          
          listItem.innerHTML = `
            <div class="list-left">
              <div class="list-circle"></div>
              <span class="list-word">${item.word}</span>
            </div>
            <div class="list-right">
              <div class="list-date">${item.formattedDate} | ${item.count}</div>
              <div class="list-text">${item.line}</div>
            </div>
          `;
          
          container.appendChild(listItem);
        });
      });
    });
  };
  
  // Function to format date to abbreviated format (Jan 01)
  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    return `${month} ${day}`;
  };

  // Function to add data to archive
  const addToArchive = (word, line, isNewDot = false, dotId = null) => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const formattedDate = formatDate(today);
    
    if (isNewDot) {
      // Check if word already exists to increment count
      const existingWordIndex = archiveData.findIndex(item => item.word === word);
      let wordCount = 1;
      
      if (existingWordIndex >= 0) {
        // Find the highest count for this word
        const sameWordItems = archiveData.filter(item => item.word === word);
        wordCount = Math.max(...sameWordItems.map(item => item.count)) + 1;
      }
      
      // Add new entry for new dot
      const newId = Date.now() + Math.random();
      archiveData.unshift({
        word: word,
        date: dateString,
        formattedDate: formattedDate,
        count: wordCount,
        line: line,
        id: newId // Unique ID for each dot
      });
      return newId; // Return the ID for tracking
    } else {
      // Update existing entry by ID (only update line, don't increment count)
      if (dotId) {
        const existingIndex = archiveData.findIndex(item => String(item.id) === String(dotId));
        console.log('Looking for dotId:', dotId, 'Found index:', existingIndex);
        
        if (existingIndex >= 0) {
          // Update existing entry with specific ID
          archiveData[existingIndex].line = line;
          archiveData[existingIndex].date = dateString;
          archiveData[existingIndex].formattedDate = formattedDate;
          console.log('Updated archive entry:', archiveData[existingIndex]);
        } else {
          console.log('No existing entry found for dotId:', dotId);
        }
      }
    }
    
    // Update the list display (show all by default)
    updateListData('all');
    console.log('Added to archive:', { word, line, date: formattedDate, dotId });
  };
  
  // Initialize list data
  updateListData('all');

  // Unified input interaction elements
  const inputLayer = document.querySelector('.input-interaction-layer');
  const inputCircleContent = document.querySelector('.input-circle-content');
  const inputDescriptionText = document.querySelector('.input-description-text');
  
  let currentMode = null; // 'main-circle' or 'small-dot'
  let currentDotText = null; // for small-dot mode
  let currentDotId = null; // for tracking individual dots
  const savedTexts = {}; // store descriptions for small dots

  // Helper function to check if contenteditable is truly empty
  const isEmpty = (element) => {
    if (!element) return true;
    const text = element.textContent?.trim() || '';
    return text === '';
  };

  // Helper function to update placeholder visibility
  const updatePlaceholder = (element, className) => {
    if (!element) return;
    if (isEmpty(element)) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  };

  const showInputInteraction = (mode, wordText = '', dotId = null) => {
    if (!inputLayer || !inputCircleContent) return;
    
    currentMode = mode;
    currentDotText = wordText;
    currentDotId = String(dotId); // Ensure ID is string
    
    // Set mode class
    inputLayer.className = `input-interaction-layer ${mode}-mode`;
    
    // Set word text
    inputCircleContent.textContent = wordText;
    
    // Load saved description for small-dot mode
    if (mode === 'small-dot' && wordText && dotId && savedTexts[dotId]) {
      inputDescriptionText.textContent = savedTexts[dotId];
    } else {
      inputDescriptionText.textContent = '';
    }
    
    // Show layer
    inputLayer.classList.add('is-visible');
    document.documentElement.classList.add('is-expanded-screen');
    
    // Focus appropriate element and set cursor to end
    setTimeout(() => {
      if (mode === 'main-circle') {
        inputCircleContent.focus();
        // Set cursor to the very end of the element
        const range = document.createRange();
        const sel = window.getSelection();
        // Create a text node at the end if needed
        if (inputCircleContent.childNodes.length === 0) {
          inputCircleContent.appendChild(document.createTextNode(''));
        }
        // Move cursor to the end
        range.setStart(inputCircleContent, inputCircleContent.childNodes.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (mode === 'small-dot') {
        inputDescriptionText.focus();
        // Set cursor to the very end of the element
        const range = document.createRange();
        const sel = window.getSelection();
        // Create a text node at the end if needed
        if (inputDescriptionText.childNodes.length === 0) {
          inputDescriptionText.appendChild(document.createTextNode(''));
        }
        // Move cursor to the end
        range.setStart(inputDescriptionText, inputDescriptionText.childNodes.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 150);
  };

  const hideInputInteraction = () => {
    if (!inputLayer) return;
    
    inputLayer.classList.remove('is-visible');
    document.documentElement.classList.remove('is-expanded-screen');
    
    // Clear content
    inputCircleContent.textContent = '';
    inputDescriptionText.textContent = '';
    
    currentMode = null;
    currentDotText = null;
    currentDotId = null;
  };

  // Main circle click - show main-circle mode
  circle.addEventListener('click', (ev) => {
    ev.stopPropagation();
    showInputInteraction('main-circle');
  });

  // Click outside to close
  document.addEventListener('click', (ev) => {
    if (!inputLayer?.classList.contains('is-visible')) return;
    
    const target = ev.target;
    if (inputLayer.contains(target)) {
      // Click inside layer - check if it's background
      if (!target.closest('.input-circle') && 
          !target.closest('.input-circle-content') &&
          !target.closest('.input-description-text')) {
        hideInputInteraction();
      }
    } else {
      // Click outside layer
      hideInputInteraction();
    }
  });

  // Real-time placeholder management for contenteditable elements
  const handleInput = (ev) => {
    const element = ev.target;
    if (element === inputCircleContent) {
      updatePlaceholder(element, 'show-placeholder');
    } else if (element === inputDescriptionText) {
      updatePlaceholder(element, 'show-placeholder');
    }
  };

  // Add input event listeners
  if (inputCircleContent) {
    inputCircleContent.addEventListener('input', handleInput);
  }
  if (inputDescriptionText) {
    inputDescriptionText.addEventListener('input', handleInput);
  }

  // Placed dots logic
  const canvas = document.querySelector('.dot-canvas');
  const DOT_SIZE = 90;
  const R = DOT_SIZE / 2;
  const NAV_HEIGHT = 87;
  const GRAVITY = 1800; // px/s^2
  const DAMPING = 0.55; // bounce damping on floor
  const FRICTION = 0.98; // simple velocity damping
  const bodies = [];
  let lastTs = 0;
  let rafId = null;

  const floorY = () => window.innerHeight - 110 - R; // center-based floor (110px from bottom)
  const minX = () => R;
  const maxX = () => window.innerWidth - R;

  const makeBody = (text, dotId = null) => {
    if (!canvas) return null;
    const el = document.createElement('div');
    el.className = 'placed-dot';
    el.textContent = text;
    el.style.cursor = 'pointer';
    el.setAttribute('data-dot-id', String(dotId)); // Store dot ID as string in element
    // 직접 클릭 이벤트 추가
    el.addEventListener('click', (ev) => {
      console.log('Direct click on dot:', text, 'ID:', dotId);
      ev.stopPropagation();
      showInputInteraction('small-dot', text, dotId);
    });
    canvas.appendChild(el);
    // spawn from top with random x
    const x = Math.max(minX(), Math.min(maxX(), Math.random() * window.innerWidth));
    const y = -R - Math.random() * 60;
    return { x, y, vx: (Math.random()-0.5)*120, vy: 0, el, dotId };
  };

  const step = (dt) => {
    const fy = floorY();
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      // integrate
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // walls
      if (b.x < minX()) { b.x = minX(); b.vx *= -DAMPING; }
      if (b.x > maxX()) { b.x = maxX(); b.vx *= -DAMPING; }
      // floor
      if (b.y > fy) {
        b.y = fy;
        b.vy *= -DAMPING;
        b.vx *= FRICTION;
      }
    }
    // collisions
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], c = bodies[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const dist2 = dx*dx + dy*dy;
        const minDist = DOT_SIZE; // 2R
        if (dist2 > 0 && dist2 < minDist*minDist) {
          const dist = Math.sqrt(dist2);
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;
          // separate
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          c.x += nx * overlap;
          c.y += ny * overlap;
          // simple velocity response (swap along normal)
          const avn = a.vx*nx + a.vy*ny;
          const cvn = c.vx*nx + c.vy*ny;
          const diff = cvn - avn;
          const impulse = diff * 0.5;
          a.vx += nx * impulse;
          a.vy += ny * impulse;
          c.vx -= nx * impulse;
          c.vy -= ny * impulse;
        }
      }
    }
    // render
    for (const b of bodies) {
      // 드래그 중인 원은 물리 시뮬레이션으로 위치 업데이트하지 않음
      if (isDragging && b.el === draggedElement) {
        continue;
      }
      b.el.style.left = (b.x - R) + 'px';
      b.el.style.top = (b.y - R) + 'px';
    }
  };

  const loop = (ts) => {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    step(dt);
    rafId = requestAnimationFrame(loop);
  };

  const ensureLoop = () => {
    if (rafId == null) rafId = requestAnimationFrame(loop);
  };

  // Enter key handling for unified input interaction
  document.addEventListener('keydown', (ev) => {
    if (!inputLayer?.classList.contains('is-visible')) return;
    if (ev.key !== 'Enter') return;
    
    ev.preventDefault();
    
    if (currentMode === 'main-circle') {
      // Main circle mode: create new physics dot and add to archive
      const wordText = inputCircleContent?.textContent?.trim() || '';
      if (wordText) {
        // Add to archive with empty line (will be filled when user adds description)
        const newDotId = addToArchive(wordText, '', true);
        const body = makeBody(wordText, newDotId);
        if (body) {
          bodies.push(body);
          ensureLoop();
        }
      }
      hideInputInteraction();
      
    } else if (currentMode === 'small-dot') {
      // Small dot mode: save description
      if (ev.shiftKey) {
        // Shift + Enter: allow newline
        return;
      }
      
      const descriptionText = inputDescriptionText?.textContent?.trim() || '';
      
      if (descriptionText && currentDotText && currentDotId) {
        // Save description and change color
        savedTexts[currentDotId] = descriptionText;
        console.log('Saved text for', currentDotText, 'ID:', currentDotId, ':', descriptionText);
        
        // Update archive with description (don't increment count)
        addToArchive(currentDotText, descriptionText, false, currentDotId);
        
        // Change dot color
        const targetDot = Array.from(document.querySelectorAll('.placed-dot')).find(dot => 
          dot.getAttribute('data-dot-id') === currentDotId
        );
        if (targetDot) {
          targetDot.classList.add('has-description');
          console.log('Added has-description class to dot:', currentDotText, 'ID:', currentDotId);
        } else {
          console.log('Target dot not found for ID:', currentDotId);
        }
      } else if (!descriptionText && currentDotText && currentDotId && savedTexts[currentDotId]) {
        // Remove description and restore color
        delete savedTexts[currentDotId];
        console.log('Deleted saved text for:', currentDotText, 'ID:', currentDotId);
        
        // Update archive with empty line (don't increment count)
        addToArchive(currentDotText, '', false, currentDotId);
        
        const targetDot = Array.from(document.querySelectorAll('.placed-dot')).find(dot => 
          dot.getAttribute('data-dot-id') === currentDotId
        );
        if (targetDot) {
          targetDot.classList.remove('has-description');
          console.log('Removed has-description class from dot:', currentDotText, 'ID:', currentDotId);
        }
      }
      
      hideInputInteraction();
    }
  }, { capture: true });


  // Long press and click on small circles
  let longPressTimer = null;
  let isLongPress = false;
  let isDragging = false;
  let draggedElement = null;
  let dragOffset = { x: 0, y: 0 };
  const topGradient = document.querySelector('.top-gradient');

  // 드래그 핸들러 함수들
  const handleDragMove = (ev) => {
    if (isDragging && draggedElement) {
      // Only preventDefault for touch events to avoid blocking normal clicks
      if (ev.touches) {
        ev.preventDefault(); // Prevent scrolling on mobile
      }
      
      // Get coordinates (mouse or touch)
      const clientX = ev.clientX || (ev.touches && ev.touches[0]?.clientX);
      const clientY = ev.clientY || (ev.touches && ev.touches[0]?.clientY);
      
      if (clientX !== undefined && clientY !== undefined) {
        // 드래그 중인 원을 위치로 이동
        const newX = clientX - dragOffset.x;
        const newY = clientY - dragOffset.y;
        draggedElement.style.left = newX + 'px';
        draggedElement.style.top = newY + 'px';
        console.log('Dragging to:', newX, newY); // 디버깅
      }
    }
  };

  const handleDragEnd = (ev) => {
    if (isDragging && draggedElement) {
      // Get coordinates (mouse or touch)
      const clientX = ev.clientX || (ev.changedTouches && ev.changedTouches[0]?.clientX);
      const clientY = ev.clientY || (ev.changedTouches && ev.changedTouches[0]?.clientY);
      
      // 드래그 종료 - 드롭 영역 확인
      const gradientRect = topGradient?.getBoundingClientRect();
      if (gradientRect && clientX !== undefined && clientY !== undefined &&
          clientX >= gradientRect.left && 
          clientX <= gradientRect.right &&
          clientY >= gradientRect.top && 
          clientY <= gradientRect.bottom) {
        // 그래디언트 영역에 드롭됨 - 원 삭제
        console.log('Dropped in gradient area, deleting dot:', draggedElement.textContent);
        
        // 물리 바디에서도 제거
        const bodyIndex = bodies.findIndex(b => b.el === draggedElement);
        if (bodyIndex >= 0) {
          bodies.splice(bodyIndex, 1);
        }
        
        // 저장된 텍스트도 삭제
        const dotId = draggedElement.getAttribute('data-dot-id');
        if (savedTexts[dotId]) {
          delete savedTexts[dotId];
        }
        
        // 아카이브에서도 삭제
        const archiveIndex = archiveData.findIndex(item => String(item.id) === String(dotId));
        if (archiveIndex >= 0) {
          archiveData.splice(archiveIndex, 1);
          console.log('Removed from archive:', archiveData[archiveIndex]);
          // 리스트 업데이트
          updateListData('all');
        }
        
        // DOM에서 제거
        draggedElement.remove();
      } else {
        // 그래디언트 영역이 아닌 곳에서 놓음 - 물리엔진 다시 적용
        console.log('Dropped outside gradient, applying physics');
        
        // 현재 위치를 물리 바디에 반영
        const currentRect = draggedElement.getBoundingClientRect();
        const bodyIndex = bodies.findIndex(b => b.el === draggedElement);
        
        if (bodyIndex >= 0) {
          // 기존 물리 바디의 위치를 현재 드래그 위치로 업데이트
          bodies[bodyIndex].x = currentRect.left + R; // center-based
          bodies[bodyIndex].y = currentRect.top + R; // center-based
          bodies[bodyIndex].vx = 0; // 초기 속도 0
          bodies[bodyIndex].vy = 0; // 초기 속도 0
          
          console.log('Updated physics body position:', bodies[bodyIndex].x, bodies[bodyIndex].y);
        }
        
        // 스타일 복구
        draggedElement.style.position = 'absolute';
        draggedElement.style.zIndex = '';
        draggedElement.style.pointerEvents = 'auto';
        draggedElement.style.transform = '';
        draggedElement.style.left = '';
        draggedElement.style.top = '';
        
        // 물리 루프 재시작
        ensureLoop();
      }
      
      isDragging = false;
      draggedElement = null;
    }
    
    // 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    
    if (topGradient) {
      topGradient.classList.remove('is-visible');
    }
    // 상단 원 다시 보이기
    const mainCircle = document.querySelector('.circle');
    if (mainCircle) {
      mainCircle.style.opacity = '1';
    }
  };

  // Common function for starting drag (mouse and touch)
  const startDrag = (target, clientX, clientY) => {
    isLongPress = false;
    isDragging = false;
    
    // 드래그 시작을 위한 위치 저장
    const rect = target.getBoundingClientRect();
    dragOffset.x = clientX - rect.left;
    dragOffset.y = clientY - rect.top;
    
    // 위치를 저장 (타이머 내부에서 사용)
    const startX = clientX;
    const startY = clientY;
    
    // Long press timer 시작 (300ms)
    longPressTimer = setTimeout(() => {
      console.log('Long press detected on:', target.textContent);
      isLongPress = true;
      isDragging = true;
      draggedElement = target;
      
      if (topGradient) {
        topGradient.classList.add('is-visible');
      }
      // 상단 원 숨기기
      const mainCircle = document.querySelector('.circle');
      if (mainCircle) {
        mainCircle.style.opacity = '0';
      }
      
      // 드래그 시작 - 원을 위치로 이동
      target.style.position = 'fixed';
      target.style.zIndex = '1000';
      target.style.pointerEvents = 'none';
      target.style.transform = 'none';
      target.style.left = (startX - dragOffset.x) + 'px';
      target.style.top = (startY - dragOffset.y) + 'px';
      
      // 전역 이벤트 활성화
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      
      // Long press가 감지된 후에만 터치 스크롤 방지
      // 이 시점에서 preventDefault를 적용
    }, 300);
  };

  // Mouse events
  document.addEventListener('mousedown', (ev) => {
    const target = ev.target.closest('.placed-dot');
    if (target) {
      startDrag(target, ev.clientX, ev.clientY);
    }
  });

  // Touch events
  document.addEventListener('touchstart', (ev) => {
    const target = ev.target.closest('.placed-dot');
    if (target && ev.touches.length === 1) {
      // Don't preventDefault here - let normal clicks work
      const touch = ev.touches[0];
      startDrag(target, touch.clientX, touch.clientY);
    }
  });

  document.addEventListener('mouseup', (ev) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    // 드래그가 아닌 경우에만 처리
    if (!isDragging) {
      if (topGradient) {
        topGradient.classList.remove('is-visible');
      }
      // 상단 원 다시 보이기
      const mainCircle = document.querySelector('.circle');
      if (mainCircle) {
        mainCircle.style.opacity = '1';
      }
    }
  });

  document.addEventListener('touchend', (ev) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    // 드래그가 아닌 경우에만 처리
    if (!isDragging) {
      if (topGradient) {
        topGradient.classList.remove('is-visible');
      }
      // 상단 원 다시 보이기
      const mainCircle = document.querySelector('.circle');
      if (mainCircle) {
        mainCircle.style.opacity = '1';
      }
    }
  });

  document.addEventListener('mouseleave', (ev) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    
    if (isDragging && draggedElement) {
      // 드래그 중에 마우스가 벗어나면 원래 위치로 복구
      draggedElement.style.position = 'absolute';
      draggedElement.style.zIndex = '';
      draggedElement.style.pointerEvents = 'auto';
      draggedElement.style.transform = '';
      draggedElement.style.left = '';
      draggedElement.style.top = '';
      
      isDragging = false;
      draggedElement = null;
      
      // 이벤트 리스너 제거
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    }
    
    if (topGradient) {
      topGradient.classList.remove('is-visible');
    }
    // 상단 원 다시 보이기
    const mainCircle = document.querySelector('.circle');
    if (mainCircle) {
      mainCircle.style.opacity = '1';
    }
  });


  // Recompute on resize
  window.addEventListener('resize', () => {
    // nothing persistent to recompute except future bounds; step() uses live values
  });
});
