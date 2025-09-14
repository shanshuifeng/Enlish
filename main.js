// ======= English site features =======

/**
 * 初始化文章页面功能
 * @param {string} currentArticle - 当前文章的标识符
 */
function initArticlePage(currentArticle) {
    // 从localStorage获取已学习的文章列表
    let learnedArticles = JSON.parse(localStorage.getItem('learnedArticles') || '[]');

    // 如果当前文章已在已学习列表中，则更新UI状态
    if (learnedArticles.includes(currentArticle)) {
        document.getElementById('completeBtn').textContent = '已完成学习';
        document.getElementById('completeBtn').disabled = true;
        document.querySelector('.card-body').style.opacity = '0.7';
    }

    // 翻译按钮点击事件处理函数
    document.getElementById('translateBtn').addEventListener('click', function() {
        const translation = document.getElementById('translation');
        if (translation.style.display === 'none') {
            translation.style.display = 'block';
            this.textContent = '隐藏译文';
        } else {
            translation.style.display = 'none';
            this.textContent = '显示译文';
        }
    });

    // 完成学习按钮点击事件处理函数
    document.getElementById('completeBtn').addEventListener('click', function() {
        let learnedArticles = JSON.parse(localStorage.getItem('learnedArticles') || '[]');

        // 如果当前文章未在已学习列表中，则添加并保存到localStorage
        if (!learnedArticles.includes(currentArticle)) {
            learnedArticles.push(currentArticle);
            localStorage.setItem('learnedArticles', JSON.stringify(learnedArticles));
            this.textContent = '已完成学习';
            this.disabled = true;
            document.querySelector('.card-body').style.opacity = '0.7';
        }
    });
}

// 词汇卡片功能
const flashEl = document.getElementById('flashcard');
if(flashEl){
    /**
     * 初始化词汇学习功能
     */
    async function initVocabulary() {
      let deck = JSON.parse(localStorage.getItem('en_deck') || '[]');
      if (deck.length === 0) {
        deck = Array.from({length: 100}, (_, i) => {
          const wordEl = document.getElementById(`initial-word-${i}`);
          if (wordEl) {
            return {
              front: wordEl.getAttribute('data-word'),
              back: wordEl.getAttribute('data-definition'),
              ef: 2.5,
              interval: 1,
              due: Date.now()
            };
          }
          return null;
        }).filter(Boolean);
      localStorage.setItem('en_deck', JSON.stringify(deck));
    }

    let i = 0;
    let showBack=false;
    const frontEl = flashEl.querySelector('.front');
    const backEl = flashEl.querySelector('.back');

    /**
     * 渲染当前词汇卡片
     */
    function render() {
      const card = deck[i];
      frontEl.innerHTML = `
        <div class="phonetic">${card.phonetic}</div>
        <div class="definition">${card.definition}</div>
        <div class="example-sentence">${card.example}</div>
      `;
      backEl.innerHTML = `
        <div class="word">${card.front}</div>
        <div class="detailed-definition">
          <div class="definition-item">
            <div class="definition-pos">noun</div>
            <div class="definition-text">${card.back}</div>
          </div>
        </div>
      `;
      flashEl.classList.toggle('show-back', showBack);
      document.getElementById('vocabProgress').textContent = `Card ${i + 1}/${deck.length}`;
    }

    /**
     * 切换到下一张卡片
     */
    function next(){
      i = (i+1)%deck.length;
      showBack=false;
      render();
    }

    /**
     * 对当前卡片进行评分
     * @param {number} q - 评分等级（0-5）
     */
    function rate(q){
      const card = deck[i];
      const ef = Math.max(1.3, card.ef + (0.1 - (5-q)*(0.08+(5-q)*0.02)));
      const interval = q<3 ? 1 : Math.round((card.interval||1) * ef);
      card.ef = ef;
      card.interval = interval;
      card.due = Date.now() + interval*24*3600*1000;
      updateStudyStats();
      localStorage.setItem('en_deck', JSON.stringify(deck));
      next();
    }

    document.getElementById('btnFlip')?.addEventListener('click', ()=>{
      showBack=!showBack;
      render();
    });
    document.getElementById('btnHard')?.addEventListener('click', ()=>rate(0));
    document.getElementById('btnGood')?.addEventListener('click', ()=>rate(3));
    document.getElementById('btnEasy')?.addEventListener('click', ()=>rate(5));
    render();
  }
  initVocabulary();
}

/**
 * 更新学习统计数据
 */
function updateStudyStats() {
  let stats = JSON.parse(localStorage.getItem('vocabStats') || '{}');
  if (!stats.studiedCount) stats.studiedCount = 0;
  if (!stats.todayCount) stats.todayCount = 0;
  if (!stats.streakCount) stats.streakCount = 0;
  if (!stats.masteryRate) stats.masteryRate = 0;
  stats.studiedCount++;
  stats.todayCount++;
  const initialDeck = JSON.parse(localStorage.getItem('en_deck') || '[]');
  const initialCount = initialDeck.length;
  if (initialCount > 0) {
    stats.masteryRate = (stats.studiedCount / initialCount) * 100;
  } else {
    stats.masteryRate = 0;
  }
  localStorage.setItem('vocabStats', JSON.stringify(stats));
  document.getElementById('studiedCount').textContent = Math.round(stats.studiedCount);
  document.getElementById('todayCount').textContent = Math.round(stats.todayCount);
  document.getElementById('streakCount').textContent = Math.round(stats.streakCount);
  document.getElementById('masteryRate').textContent = Math.round(stats.masteryRate) + '%';
}

/**
 * 初始化学习统计数据显示
 */
function initStudyStats() {
  const stats = JSON.parse(localStorage.getItem('vocabStats') || '{}');
  if (!stats.studiedCount) stats.studiedCount = 0;
  if (!stats.todayCount) stats.todayCount = 0;
  if (!stats.streakCount) stats.streakCount = 0;
  if (!stats.masteryRate) stats.masteryRate = 0;
  document.getElementById('studiedCount').textContent = Math.round(stats.studiedCount);
  document.getElementById('todayCount').textContent = Math.round(stats.todayCount);
  document.getElementById('streakCount').textContent = Math.round(stats.streakCount);
  document.getElementById('masteryRate').textContent = Math.round(stats.masteryRate) + '%';
}

if (document.getElementById('studiedCount')) {
  initStudyStats();
}

const audioList = document.getElementById('audioList');
const player = document.getElementById('player');
if(audioList && player){
  const items = Array.from(audioList.querySelectorAll('li'));
  let idx = 0;
  const saveKey = 'audio_progress';

  /**
   * 加载指定索引的音频项
   * @param {number} i - 音频项索引
   */
  function load(i){
    idx=i;
    items.forEach(el=>el.classList.remove('active'));
    items[i].classList.add('active');
    player.src = items[i].getAttribute('data-src');
    const saved = JSON.parse(localStorage.getItem(saveKey)||'{}');
    const rec = saved[player.src];
    if(rec){
      player.currentTime = rec.t||0;
      player.playbackRate = rec.r||1;
    }
    player.play().catch(()=>{});
    document.getElementById('audioProgress').textContent = `Episode ${i+1}/${items.length}`;
  }

  // 为每个音频项添加点击事件监听器
  items.forEach((el,i)=> el.addEventListener('click', ()=>load(i)) );

  // 监听播放器时间更新事件，保存播放进度
  player.addEventListener('timeupdate', ()=>{
    const saved = JSON.parse(localStorage.getItem(saveKey)||'{}');
    saved[player.src] = { t: player.currentTime, r: player.playbackRate };
    localStorage.setItem(saveKey, JSON.stringify(saved));
  });

  // 监听播放速度更改事件
  document.getElementById('speed')?.addEventListener('change', (e)=>{
    player.playbackRate = parseFloat(e.target.value);
  });

  // 上一集和下一集按钮事件处理
  document.getElementById('prevEp')?.addEventListener('click', ()=> load((idx-1+items.length)%items.length));
  document.getElementById('nextEp')?.addEventListener('click', ()=> load((idx+1)%items.length));

  // 加载第一个音频项
  load(0);
}

const chapters = document.getElementById('chapters');
const readerContent = document.getElementById('readerContent');
const readerNote = document.getElementById('readerNote');
if(chapters && readerContent){
  // 章节文本内容
  const texts = {
    1: 'It was a bright cold day in April, and the clocks were striking thirteen.',
    2: 'She had not known the weight until she felt the freedom.',
    3: 'All this happened, more or less. The war parts, anyway, are pretty much true.'
  };

  // 章节注释内容
  const notes = {
    1: '译：四月一个明亮而寒冷的日子，钟声敲响了十三下。注：英语中通常"十二小时制"，这里的十三下营造反乌托邦氛围。',
    2: '译：直到她感到自由，才知道先前被束缚的重量。注：weight 在此指"心理负担"。',
    3: '译：这些或多或少都发生过。战争部分基本真实。注：作者使用口语化语气增强可信度。'
  };

  /**
   * 加载指定章节内容
   * @param {string|number} id - 章节ID
   */
  function loadCh(id){
    readerContent.textContent = texts[id] || 'Coming soon...';
    if(readerNote) readerNote.textContent = notes[id] || '';
    localStorage.setItem('reader_ch', id);
  }

  // 为每个章节添加点击事件监听器
  chapters.querySelectorAll('li').forEach(li=>{
    li.addEventListener('click', ()=>{
      chapters.querySelectorAll('li').forEach(n=>n.classList.remove('active'));
      li.classList.add('active');
      loadCh(li.getAttribute('data-id'));
    });
  });

  // 字体大小调整功能
  document.getElementById('decFont')?.addEventListener('click', ()=>{
    const s = parseFloat(getComputedStyle(readerContent).fontSize);
    readerContent.style.fontSize = (s-1)+'px';
  });
  document.getElementById('incFont')?.addEventListener('click', ()=>{
    const s = parseFloat(getComputedStyle(readerContent).fontSize);
    readerContent.style.fontSize = (s+1)+'px';
  });

  // 夜间模式切换功能
  document.getElementById('toggleNight')?.addEventListener('click', ()=>{
    document.body.classList.toggle('night');
    localStorage.setItem('night_mode', document.body.classList.contains('night')?'1':'0');
  });

  // 根据保存的设置初始化夜间模式
  if(localStorage.getItem('night_mode')==='1') document.body.classList.add('night');

  // 加载上次阅读的章节或默认第一章
  loadCh(localStorage.getItem('reader_ch')||1);
}

const quizMsg = document.getElementById('quizMsg');
if(quizMsg){
  // 为所有测验按钮添加点击事件监听器
  document.querySelectorAll('.quiz').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const ok = btn.getAttribute('data-ok')==='1';
      quizMsg.textContent = ok ? 'Correct! 🎉' : 'Try again!';
    });
  });
}

const courseGrid = document.getElementById('courseGrid');
const favList = document.getElementById('favList');
const showFavorites = document.getElementById('showFavorites');

// 课程数据库
const COURSE_DB = [
  {id:'c1', title:'日常英语口语', price:99, desc:'适合零基础到入门，中文讲解+场景对话', url:'coming-soon.html',
   category:'基础课程', teacher:'张老师', lessons:'10节', duration:'6小时',
   content:'本课程专为零基础学员设计，通过日常场景对话教学，帮助学员快速掌握基本英语交流能力。课程内容包括问候、购物、点餐、问路等实用场景。'},
  {id:'c2', title:'发音训练营', price:129, desc:'音标与连读训练，配中文提示', url:'coming-soon.html',
   category:'基础课程', teacher:'李老师', lessons:'15节', duration:'10小时',
   content:'通过系统学习48个音标，掌握英语发音规律。课程包含口型示范、发音练习和纠音指导，帮助学员改善发音问题，提升口语清晰度。'},
  {id:'c3', title:'语法核心课', price:149, desc:'时态/从句/非谓语系统梳理，附中文例句', url:'coming-soon.html',
   category:'进阶课程', teacher:'王老师', lessons:'20节', duration:'15小时',
   content:'系统梳理英语语法核心知识点，包括时态、从句、非谓语动词等。通过大量实例和练习，帮助学员建立扎实的语法基础。'},
  {id:'c4', title:'商务英语实战', price:199, desc:'商务会议、邮件写作、谈判技巧', url:'coming-soon.html',
   category:'专业课程', teacher:'陈老师', lessons:'18节', duration:'12小时',
   content:'专为职场人士设计，涵盖商务会议、邮件写作、谈判技巧等实用内容。通过真实案例教学，提升学员在商务环境中的英语应用能力。'},
  {id:'c5', title:'雅思考试冲刺', price:299, desc:'听说读写四项技巧，真题解析', url:'coming-soon.html',
   category:'考试辅导', teacher:'赵老师', lessons:'25节', duration:'20小时',
   content:'针对雅思考试的专项辅导课程，涵盖听力、口语、阅读、写作四项技能。通过真题解析和模拟练习，帮助学员提升应试能力。'},
  {id:'c6', title:'英语写作提升', price:159, desc:'从句子到段落，再到完整文章', url:'coming-soon.html',
   category:'实用技能', teacher:'刘老师', lessons:'16节', duration:'11小时',
   content:'从基础句子结构开始，逐步提升到段落写作和完整文章创作。通过大量写作练习和批改，帮助学员提高英语写作水平。'},
  {id:'c7', title:'托福考试精讲', price:279, desc:'托福考试全面解析，提分技巧', url:'coming-soon.html',
   category:'考试辅导', teacher:'孙老师', lessons:'22节', duration:'18小时',
   content:'全面解析托福考试各模块，提供针对性的备考策略和提分技巧。通过模拟考试和专项训练，帮助学员取得理想成绩。'},
  {id:'c8', title:'旅游英语速成', price:89, desc:'出国旅游必备英语表达', url:'coming-soon.html',
   category:'实用技能', teacher:'周老师', lessons:'8节', duration:'5小时',
   content:'专为出国旅游设计的实用英语课程，涵盖机场、酒店、交通、购物等常见场景。帮助学员在旅行中轻松应对各种交流需求。'},
  {id:'c9', title:'儿童英语启蒙', price:169, desc:'专为儿童设计的英语启蒙课程', url:'coming-soon.html',
   category:'儿童英语', teacher:'郑老师', lessons:'12节', duration:'7小时',
   content:'通过游戏、歌曲、故事等趣味方式，激发儿童学习英语的兴趣。课程内容生动有趣，适合3-10岁儿童英语启蒙。'},
  {id:'c10', title:'商务会议英语', price:189, desc:'商务会议场景下的英语表达技巧', url:'coming-soon.html',
   category:'商务英语', teacher:'陈老师', lessons:'12节', duration:'8小时',
   content:'专注于商务会议场景下的英语表达技巧，包括会议主持、发言、讨论等实用技能。'},
  {id:'c11', title:'学术论文写作', price:219, desc:'学术论文写作规范与技巧', url:'coming-soon.html',
   category:'学术英语', teacher:'王教授', lessons:'16节', duration:'12小时',
   content:'系统讲解学术论文写作规范与技巧，包括文献综述、研究方法、结果分析等部分的写作要点。'},
  {id:'c12', title:'老年人日常英语', price:79, desc:'专为老年人设计的实用英语课程', url:'coming-soon.html',
   category:'老年英语', teacher:'李老师', lessons:'10节', duration:'6小时',
   content:'考虑到老年人的学习特点，课程内容简单实用，主要涵盖日常交流、旅游、健康等方面。'},
  {id:'c13', title:'旅游英语对话', price:99, desc:'旅游场景下的实用英语对话', url:'coming-soon.html',
   category:'旅游英语', teacher:'周老师', lessons:'10节', duration:'6小时',
   content:'涵盖旅游中常见场景的英语对话，包括机场、酒店、餐厅、景点等，帮助学员在旅行中自信交流。'},
  {id:'c14', title:'旅游英语词汇', price:79, desc:'旅游必备核心词汇', url:'coming-soon.html',
   category:'旅游英语', teacher:'王老师', lessons:'8节', duration:'5小时',
   content:'系统学习旅游中常用的英语词汇，包括交通、住宿、餐饮、购物、问路等方面的词汇。'},
  {id:'c15', title:'海外自助游英语', price:129, desc:'海外自助游全程英语指导', url:'coming-soon.html',
   category:'旅游英语', teacher:'张老师', lessons:'12节', duration:'8小时',
   content:'专为海外自助游设计的英语课程，涵盖行程规划、预订、出入境、应急处理等各个环节。'}
];

// 电影数据库
const MOVIE_DB = [
  {id:'m1', title:'Inception 盗梦空间 词汇包', price:59, desc:'电影场景词汇讲解+听力训练'},
  {id:'m2', title:'The Dark Knight 黑暗骑士 词汇包', price:59, desc:'人物对话高频表达+听辨练习'}
];

/**
 * 获取收藏列表
 * @returns {Array} 收藏的项目数组
 */
function getFav(){
  return JSON.parse(localStorage.getItem('favorites')||'[]');
}

/**
 * 设置收藏列表
 * @param {Array} arr - 要保存的收藏项目数组
 */
function setFav(arr){
  localStorage.setItem('favorites', JSON.stringify(arr));
}

/**
 * 获取已购买列表
 * @returns {Array} 已购买的项目数组
 */
function getPurchased(){
  return JSON.parse(localStorage.getItem('purchased')||'[]');
}

/**
 * 设置已购买列表
 * @param {Array} arr - 要保存的已购买项目数组
 */
function setPurchased(arr){
  localStorage.setItem('purchased', JSON.stringify(arr));
}

/**
 * 渲染课程列表
 * @param {string} categoryFilter - 课程分类筛选条件，默认为'all'
 */
function renderCourses(categoryFilter = 'all'){
  if(!courseGrid) return;
  const fav = new Set(getFav());
  const purchased = new Set(getPurchased());
  let filteredCourses = COURSE_DB;
  if (categoryFilter !== 'all') {
    filteredCourses = COURSE_DB.filter(c => c.category === categoryFilter);
  }
  courseGrid.innerHTML = filteredCourses.map(c=>`
    <div class="col-4">
      <div class="card h-100">
        <div class="card-body">
          <h5>${c.title}</h5>
          <p>${c.desc}</p>
          <p class="mb-2">分类：${c.category}</p>
          <p class="mb-2">老师：${c.teacher}</p>
          <p class="mb-2">价格：¥${c.price}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-success toggle-fav" data-id="${c.id}">${fav.has(c.id)?'已收藏':'收藏'}</button>
            <button class="btn btn-outline-info course-detail" data-id="${c.id}">详情</button>
            ${purchased.has(c.id) ? 
              `<a href="${c.url}" target="_blank" class="btn btn-success">学习</a>` : 
              `<button class="btn btn-primary buy-course" data-id="${c.id}" data-title="${c.title}" data-price="${c.price}">购买</button>`}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // 收藏按钮事件处理
  courseGrid.querySelectorAll('.toggle-fav').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      toggleFavorite(id);
      renderCourses(categoryFilter);
    });
  });

  // 课程详情按钮事件处理
  courseGrid.querySelectorAll('.course-detail').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      showCourseDetail(id);
    });
  });

  // 购买按钮事件处理
  courseGrid.querySelectorAll('.buy-course').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const price = btn.getAttribute('data-price');
      const purchased = new Set(getPurchased());
      purchased.add(id);
      setPurchased(Array.from(purchased));
      updateCourseStats();
      renderCourses(categoryFilter);
      alert(`课程"${title}"购买成功！价格：¥${price}`);
    });
  });
}

/**
 * 显示课程详情
 * @param {string} courseId - 课程ID
 */
function showCourseDetail(courseId) {
  const course = COURSE_DB.find(c => c.id === courseId);
  if (!course) return;

  document.getElementById('courseDetailTitle').textContent = course.title;
  document.getElementById('courseName').textContent = course.title;
  document.getElementById('courseDescription').textContent = course.desc;
  document.getElementById('courseCategory').textContent = course.category;
  document.getElementById('courseTeacher').textContent = course.teacher;
  document.getElementById('courseLessons').textContent = course.lessons;
  document.getElementById('courseDuration').textContent = course.duration;
  document.getElementById('courseContent').innerHTML = `<p>${course.content}</p>`;
  document.getElementById('coursePrice').textContent = course.price;

  const modalBuyBtn = document.getElementById('modalBuyBtn');
  const modalStartLearningBtn = document.getElementById('modalStartLearningBtn');
  const modalFavBtn = document.getElementById('modalFavBtn');
  modalBuyBtn.setAttribute('data-id', course.id);
  modalBuyBtn.setAttribute('data-title', course.title);
  modalBuyBtn.setAttribute('data-price', course.price);
  modalFavBtn.setAttribute('data-id', course.id);

  // 检查课程是否已购买，设置按钮显示状态
  const purchased = new Set(getPurchased());
  if (purchased.has(course.id)) {
    modalBuyBtn.style.display = 'none';
    modalStartLearningBtn.style.display = 'block';
    modalStartLearningBtn.href = course.url;
  } else {
    modalBuyBtn.style.display = 'block';
    modalStartLearningBtn.style.display = 'none';
  }

  const fav = new Set(getFav());
  modalFavBtn.textContent = fav.has(course.id) ? '已收藏' : '收藏课程';

  // 添加购买按钮点击事件
  modalBuyBtn.onclick = function() {
    const id = this.getAttribute('data-id');
    const title = this.getAttribute('data-title');
    const price = this.getAttribute('data-price');
    const purchased = new Set(getPurchased());
    purchased.add(id);
    setPurchased(Array.from(purchased));
    updateCourseStats();
    const activeCategory = document.querySelector('.list-group-item-action.active').getAttribute('data-category') || 'all';
    renderCourses(activeCategory);

    // 隐藏购买按钮，显示开始学习按钮
    modalBuyBtn.style.display = 'none';
    modalStartLearningBtn.style.display = 'block';
    // 设置开始学习按钮的链接
    const course = COURSE_DB.find(c => c.id === id);
    if (course) {
      modalStartLearningBtn.href = course.url;
    }
    alert(`课程"${title}"购买成功！价格：¥${price}`);
  };

  modalFavBtn.onclick = function() {
    const id = this.getAttribute('data-id');
    toggleFavorite(id);
    const fav = new Set(getFav());
    this.textContent = fav.has(id) ? '已收藏' : '收藏课程';
  };

  const modal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
  modal.show();
}

// 初始化课程列表显示
renderCourses();

/**
 * 批量购买收藏的课程
 */
function buyAllFavorites() {
  const fav = getFav();
  const purchased = new Set(getPurchased());
  const favCourses = COURSE_DB.filter(c => fav.includes(c.id));
  let totalPrice = 0;
  let coursesToBuy = [];
  favCourses.forEach(course => {
    if (!purchased.has(course.id)) {
      coursesToBuy.push(course);
      totalPrice += course.price;
    }
  });
  if (coursesToBuy.length === 0) {
    alert('您的收藏夹中没有未购买的课程');
    return;
  }
  if (confirm(`您将购买 ${coursesToBuy.length} 门课程，总价：¥${totalPrice}。确认购买吗？`)) {
    coursesToBuy.forEach(course => {
      purchased.add(course.id);
      updateCourseStats();
    });
    setPurchased(Array.from(purchased));
    const activeCategory = document.querySelector('.list-group-item-action.active').getAttribute('data-category') || 'all';
    renderCourses(activeCategory);
    alert('购买成功！您可以在"已购买"中查看这些课程');
  }
}

/**
 * 更新课程统计数据
 */
function updateCourseStats() {
  let courseStats = JSON.parse(localStorage.getItem('courseStats') || '{}');
  if (!courseStats.enrolledCourses) courseStats.enrolledCourses = 3;
  if (!courseStats.completionRate) courseStats.completionRate = 45;
  if (!courseStats.studyHours) courseStats.studyHours = 28;
  courseStats.enrolledCourses++;
  courseStats.studyHours += 2;
  localStorage.setItem('courseStats', JSON.stringify(courseStats));
  sessionStorage.setItem('updateCourseStats', 'true');
}

if(showFavorites && favList){
  showFavorites.addEventListener('click', (e)=>{
    e.preventDefault();
    const fav = new Set(getFav());
    const items = COURSE_DB.filter(c=>fav.has(c.id));
    favList.innerHTML = items.length? items.map(c=>`<li>${c.title} · 分类：${c.category} · 老师：${c.teacher} · ¥${c.price}</li>`).join('') : '<li>还没有收藏课程</li>';
    if(items.length > 0) {
      const buyAllBtn = document.createElement('button');
      buyAllBtn.className = 'btn btn-primary mt-3';
      buyAllBtn.textContent = '批量购买收藏课程';
      buyAllBtn.addEventListener('click', buyAllFavorites);
      favList.parentNode.appendChild(buyAllBtn);
    }
  });
}

const favoritesModal = document.getElementById('favoritesModal');
if (favoritesModal) {
  favoritesModal.addEventListener('show.bs.modal', function (event) {
    const favList = favoritesModal.querySelector('#favList');
    if (favList) {
      const fav = new Set(getFav());
      const items = COURSE_DB.filter(c => fav.has(c.id));
      favList.innerHTML = items.length ? items.map(c => `
        <li class="list-group-item">
          <div class="d-flex justify-content-between">
            <div>
              <h6>${c.title}</h6>
              <p class="mb-1">分类：${c.category} · 老师：${c.teacher}</p>
              <p class="mb-1">价格：¥${c.price}</p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-info btn-sm view-course" data-id="${c.id}">查看</button>
              ${getPurchased().includes(c.id) ? 
                `<a href="${c.url}" target="_blank" class="btn btn-success btn-sm">学习</a>` : 
                `<button class="btn btn-primary btn-sm buy-course" data-id="${c.id}" data-title="${c.title}" data-price="${c.price}">购买</button>`}
              <button class="btn btn-outline-success btn-sm toggle-fav" data-id="${c.id}">${fav.has(c.id)?'取消收藏':'收藏'}</button>
            </div>
          </div>
        </li>
      `).join('') : '<li class="list-group-item">还没有收藏课程</li>';

      // 查看课程按钮事件处理
      favList.querySelectorAll('.view-course').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          bootstrap.Modal.getInstance(favoritesModal).hide();
          showCourseDetail(id);
        });
      });

      // 收藏按钮事件处理
      favList.querySelectorAll('.toggle-fav').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          toggleFavorite(id);
          const event = new Event('show.bs.modal');
          favoritesModal.dispatchEvent(event);
        });
      });

      // 购买按钮事件处理
      favList.querySelectorAll('.buy-course').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const title = btn.getAttribute('data-title');
          const price = btn.getAttribute('data-price');
          const purchased = new Set(getPurchased());
          purchased.add(id);
          setPurchased(Array.from(purchased));
          updateCourseStats();
          const activeCategory = document.querySelector('.list-group-item-action')?.getAttribute('data-category') || 'all';
          renderCourses(activeCategory);
          btn.replaceWith(`<a href="${COURSE_DB.find(c => c.id === id)?.url || '#'}" target="_blank" class="btn btn-success btn-sm">学习</a>`);
          alert(`课程"${title}"购买成功！价格：¥${price}`);
        });
      });
    }
  });
}

/**
 * 渲染收藏的课程
 */
function renderFavoriteCourses() {
  const favContainer = document.getElementById('favCoursesContainer');
  if (!favContainer) return;

  const favorites = getFav();
  if (favorites.length === 0) {
    favContainer.innerHTML = '<div class="col-12"><p class="text-muted text-center">暂无收藏课程</p></div>';
    return;
  }

  const favoriteCourses = COURSE_DB.filter(course => favorites.includes(course.id));
  favContainer.innerHTML = favoriteCourses.map(course => `
    <div class="col-4">
      <div class="card h-100">
        <div class="card-body">
          <h5>${course.title}</h5>
          <p>分类：${course.category}</p>
          <p>老师：${course.teacher}</p>
          <p class="mb-2">价格：¥${course.price}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-info btn-sm view-course" data-id="${course.id}">查看</button>
            <button class="btn btn-outline-success toggle-fav" data-id="${course.id}">取消收藏</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // 查看课程按钮事件处理
  favContainer.querySelectorAll('.view-course').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = btn.getAttribute('data-id');
      showCourseDetail(id);
    });
  });

  // 收藏按钮事件处理
  favContainer.querySelectorAll('.toggle-fav').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = btn.getAttribute('data-id');
      toggleFavorite(id);
    });
  });
}

/**
 * 切换课程收藏状态
 * @param {string} courseId - 课程ID
 */
function toggleFavorite(courseId) {
  const fav = new Set(getFav());
  if (fav.has(courseId)) {
    fav.delete(courseId);
  } else {
    fav.add(courseId);
  }
  setFav(Array.from(fav));
  renderFavoriteCourses();
  document.dispatchEvent(new CustomEvent('favoritesUpdated'));
}

// 课程分类筛选功能
document.querySelectorAll('.list-group-item-action').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.list-group-item-action').forEach(item => {
      item.classList.remove('active');
    });
    this.classList.add('active');
    const category = this.getAttribute('data-category');
    renderCourses(category);
  });
});

// 收藏状态更新事件处理
document.addEventListener('favoritesUpdated', function() {
  const activeCategory = document.querySelector('.list-group-item-action.active')?.getAttribute('data-category') || 'all';
  renderCourses(activeCategory);
  if (document.querySelector('#favoritesModal.show')) {
    const event = new Event('show.bs.modal');
    document.querySelector('#favoritesModal').dispatchEvent(event);
  }
});
