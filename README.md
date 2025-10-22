<h1>🎧 MUSIC WEBSITE</h1>

<h2>기획의도</h2>

<h3>문제의식</h3>
<p>
음악을 “듣기 전 탐색” 단계에서, 플랫폼마다 흩어진 <b>트렌딩 / 검색 / 플레이리스트 관리 UX</b>가 제각각이라<br />
<b>발견 - 보관 - 재생</b> 흐름이 단절되어 있음.<br /><br />
<b>목표:</b><br />
탐색(Trending/검색) - 큐잉(재생 대기열) - 보관(플리 CRUD)을<br />
<b>하나의 화면 플로우에서 자연스럽게 이어지도록 설계.</b>
</p>

<hr />

<h3> 참고 사이트 & 차별점</h3>
<p><b>참고:</b> SoundCloud / Spotify / YouTube Music</p>

<ul>
  <li><b>트렌딩 결과를 가로 무한 스크롤(Row)로 배치</b> : 시각적 스캔 속도 향상</li>
  <li><b>경량 SPA + 코드 스플리팅</b> : 초기 로딩 최소화 및 라우트별 체감 속도 향상</li>
  <li><b>백엔드 프록시로 SoundCloud API 연동</b> : 키/쿼터 안정화 및 CORS·보안 이슈 완화</li>
</ul>

<hr />

<h3> 협업 증빙 (Notion)</h3>
<p>
📎 <a href="https://www.notion.so/28cdc650186780829d51ca8ed95de9bb?v=28cdc6501867808d96d6000c2ce8a77e" target="_blank">
프로젝트 협업 노션 바로가기
</a>
</p>

<hr />

<h2> 구현한 핵심 기능</h2>
<ul>
  <li><b>CRUD</b>: Playlist / Board 생성 · 조회 · 수정 · 삭제 기능 완비</li>
  <li><b>SPA (React Router)</b>: Home (Main), Discover, Board, Search</li>
  <li><b>가상 스크롤</b>: 대량 데이터 효율적 렌더링 (IntersectionObserver 기반)</li>
  <li><b>코드 스플리팅</b>: React.lazy + &lt;Suspense /&gt; 적용 (Discover, Board, Search)</li>
  <li><b>외부 데이터 연동</b>: YouTube Data API (Frontend) / SoundCloud API (Backend)</li>
</ul>

<hr />

<h2> 사용 기술 (Tech Stack)</h2>

<h3>
  Frontend&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="28" height="28" alt="JavaScript" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="28" height="28" alt="React" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg" width="28" height="28" alt="Vite" />
</h3>
<ul>
  <li><b>React 19 + Vite</b> — 최신 React 기반 SPA 프레임워크</li>
  <li><b>JavaScript (ES2023)</b> — 최신 문법 기반의 가벼운 개발 환경</li>
  <li><b>Axios</b> — REST API 통신</li>
  <li><b>Zustand</b> — 전역 상태관리 (현재 재생 트랙, 플레이리스트 등)</li>
  <li><b>React Router v6</b> — 라우팅 및 코드 스플리팅</li>
  <li><b>CSS Modules / Tailwind CSS</b> — 반응형 스타일링</li>
</ul>

<h3>
  Backend&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg" width="24" height="24" alt="Spring Boot" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" width="24" height="24" alt="MySQL" />
</h3>

<ul>
  <li><b>Spring Boot 3.x</b> — REST API 서버 및 비즈니스 로직 구현</li>
  <li><b>WebClient (Spring Reactive)</b> — SoundCloud API 프록시 호출</li>
  <li><b>MyBatis</b> — SQL 기반 ORM, DB CRUD 처리</li>
  <li><b>Spring Security</b> — 인증 및 접근 제어</li>
</ul>

<h3>
  External API & SDK&nbsp;
  <img src="https://cdn-icons-png.flaticon.com/512/5968/5968842.png" width="24" height="24" alt="SoundCloud" />
</h3>
<ul>
  <li><b>SoundCloud Public API (v2)</b> — 트렌딩 및 검색 데이터 연동</li>
  <li><b>Ngrok</b> — 로컬 서버 외부 공개 및 테스트용 터널링</li>
</ul>

<hr />

<h2> 실행 방법</h2>

<h3>Frontend</h3>
<pre><code>cd frontend
npm install
npm run dev
</code></pre>

<h3>Backend</h3>
<pre><code>cd backend
./gradlew bootRun
</code></pre>
<hr />

## 전체적인 시스템 구성도 

<img width="2175" height="1738" alt="Image" src="https://github.com/user-attachments/assets/e8872c75-2b7e-44dc-af04-39893f51681e" />
<img width="1328" height="736" alt="Image" src="https://github.com/user-attachments/assets/dac13f92-e3c8-40ef-89b1-1a6e61820d62" />

<h2>주요 흐름</h2>
<h3>Home</h3>
<pre><code>
사용자 진입 - SC 트렌딩 호출 + YT 인기(음악) 호출 - 응답 정규화(MediaItem)·카드 렌더 - 카드 클릭 -  재생(SC 위젯 / YT iframe) 또는 플리에 추가(로컬)
</code></pre>

<h3>Discover</h3>
<pre><code>
장르/태그 선택 - SC 장르 트렌딩 호출과 정규화·Row 무한 스크롤 렌더
</code></pre>

<h3>Search</h3>
<pre><code>
사용자 입력 -(GET) YouTube + SoundCloud API - 결과 - UI - 재생/추가
</code></pre>

<h3>Board</h3>
<pre><code>
로컬 데이터 로드(LocalStorage/IndexedDB) - 목록 렌더(제목만) - 입력(제목≤20 필수·내용≤200 선택, Enter 제출) - 등록 성공 시 상단 추가+자동 펼침/알림 - 수정(펼친 상태 폼 전환)·삭제(대상만 제거) - 자동증가 ID 부여 - 즉시 화면/로컬 동기화
</code></pre>

<h3>Library</h3>
<pre><code>
플리 목록 로드(LocalStorage 복원) - 플리 생성/이름변경/삭제, 트랙 추가/제거/정렬 -  변경 즉시 LocalStorage 저장 - 항목 클릭 - 재생
</code></pre>

<hr />

### 백엔드 다이어그램

<img width="1880" height="1050" alt="Image" src="https://github.com/user-attachments/assets/0d0a84bf-38b5-4d25-a622-36e855bca443" />
<hr />

###  프론트앤드 다이어그램

<img width="8369" height="5386" alt="Image" src="https://github.com/user-attachments/assets/3b9e05ae-beaf-4c93-9b22-e3aae76d1c34" />
<hr />

### API 명세서
![Image](https://github.com/user-attachments/assets/b8f05df7-01b8-44a1-8f5b-5f27f59efd3f)
![Image](https://github.com/user-attachments/assets/556f3b4e-2fe7-4d4e-a90a-73ede514a4b1)
![Image](https://github.com/user-attachments/assets/927a126b-a19a-4c58-a96c-a259857c6938)



