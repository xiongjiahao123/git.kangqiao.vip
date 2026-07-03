const jobs = [
  { keyword: '基层医疗 AI', topic: '社区健康科普图文', status: '已发布', progress: 100 },
  { keyword: '慢病管理', topic: '高血压患者日常管理', status: '审核中', progress: 75 },
  { keyword: '儿童肥胖', topic: '儿童体重管理科普', status: '生成中', progress: 48 }
];

const screens = document.querySelectorAll('.screen');
const tabs = document.querySelectorAll('[data-tab]');
const jobList = document.querySelector('#jobList');
const form = document.querySelector('#createForm');
const preview = document.querySelector('#preview');

function switchTab(tabName) {
  screens.forEach(screen => screen.classList.toggle('active', screen.id === tabName));
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
}

function renderJobs() {
  jobList.innerHTML = jobs.map(job => `
    <article class="job panel">
      <div class="job-top">
        <div class="job-title">${job.keyword}</div>
        <span class="badge">${job.status}</span>
      </div>
      <p>${job.topic}</p>
      <div class="progress"><i style="width: ${job.progress}%"></i></div>
    </article>
  `).join('');
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const keyword = document.querySelector('#keyword').value.trim();
  const topic = document.querySelector('#topic').value.trim();
  const channel = document.querySelector('#channel').value;
  if (!keyword || !topic) return;

  jobs.unshift({ keyword, topic, status: '生成中', progress: 35 });
  renderJobs();
  preview.classList.remove('hidden');
  preview.innerHTML = `
    <h3>${keyword} | 康桥数智 GEO 图文</h3>
    <p>面向${channel}生成“${topic}”内容草案，并进入监测队列。</p>
    <div class="prompt">Healthcare editorial illustration about ${keyword}, warm clinical lighting, trustworthy media style</div>
  `;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

renderJobs();
