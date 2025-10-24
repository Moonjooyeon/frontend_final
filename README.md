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

![Image](https://github.com/user-attachments/assets/a7fe0b0d-4aea-44e2-aa2e-704148b861b9)

<pre><code>
사용자 진입 - SC 트렌딩 호출 + YT 인기(음악) 호출 - 응답 정규화(MediaItem)·카드 렌더 - 카드 클릭 -  재생(SC 위젯 / YT iframe) 또는 플리에 추가(로컬)
</code></pre>

#### 핵심 구현 방식
* **트렌딩 및 무한 스크롤**:
    * 가로 스크롤 시, 오른쪽 끝에 위치한 'Sentinel' 요소가 감지되면 `nextCursor`를 기반으로 다음 페이지를 로드하는 **무한 스크롤**을 구현.

* **음악 재생 (NowPlaying)**:
    * 음악 카드 클릭 시, Zustand의 `useNowPlayingStore`를 사용,하단 재생바를 활성화.

* **플레이리스트 (Playlist)**:
    * 사용자가 선택한 플레이리스트에 현재 곡을 추가.

* **검색**:
    * 상단 검색창을 통해 입력된 키워드로 YouTube 및 SoundCloud 데이터를 통합 검색.

<h3>Discover</h3>

![Image](https://github.com/user-attachments/assets/910849c4-1ce2-4a0a-a701-41257bf3f254)

<pre><code>
탐색 탭 전환- SC 장르 트렌딩 호출과 정규화·Row 무한 스크롤 렌더
</code></pre>

#### 핵심 구현 방식
*  **정규화**: SC 응답을 통합 스키마으로 변환해 리스트 바인딩
*  **렌더링**: 아이템를 그리드 카드로 표시(썸네일/제목/아티스트) + 에러/로딩 상태 처리

<h3>Search</h3>

![Image](https://github.com/user-attachments/assets/25c33323-4ade-40c7-ae95-32abd7a7326c)

<pre><code>
사용자 입력 -(GET) YouTube + SoundCloud API - 결과 - UI - 재생/추가
</code></pre>

#### API 호출 흐름
* SoundCloud는 API Key 노출에 민감하고 CORS 정책 이슈가 발생할 수 있어, 백엔드 서버를 프록시(Proxy)로 사용,
* YouTube API는 브라우저 키 제한 등 클라이언트 측 직접 호출을 공식적으로 지원하므로, 불필요한 서버 트래픽을 줄이기 위해 프론트에서 직접 호출.

#### 핵심 구현 방식
* **병렬 데이터 호출**:
    * 사용자가 검색을 실행하면, 백엔드 프록시(SoundCloud)와 YouTube API로의 요청이 **병렬(Parallel)로 동시에 실행**되어 검색 응답 시간을 최소화.

* **재생 및 플레이리스트 추가**:
    * **즉시 재생**: 아이템 클릭 시 `useNowPlayingStore.playTrack(item, results)`를 호출, 현재 검색 결과(`results`)를 통째로 재생 목록 큐로 설정.
    * **플리 추가**: `usePlaylistStore`의 액션을 호출하며, 상태 업데이트 시 **함수형 업데이트**를 사용해 새 항목을 추가.

<h3>Board</h3>

![Image](https://github.com/user-attachments/assets/1a6b8ea1-53bd-44b0-8703-ed41392a9bd0)

<pre><code>
로컬 데이터 로드(LocalStorage/IndexedDB) - 목록 렌더(제목만) - 입력(제목≤20 필수·내용≤200 선택, Enter 제출) - 등록 성공 시 상단 추가+자동 펼침/알림 - 수정(펼친 상태 폼 전환)·삭제(대상만 제거) - 자동증가 ID 부여 - 즉시 화면/로컬 동기화
</code></pre>

#### 1. 성능 최적화 (Code Splitting)
* 이 게시판 컴포넌트는 사용자가 해당 기능 페이지에 진입할 때까지 로드되지 않음.
* 컴포넌트를 로드하는 동안 `<Suspense />`를 통해 **초기 로딩 성능을 최적화**.

#### 2. 핵심 구현 방식 (CRUD Flow)
* **Create (등록)**:
    * 유효성 검사, 알림을 통한 피드백, 새 글 등록시 리스트 최상단 추가되는 상태 관리.

* **Read (조회 및 아코디언 UI)**:
    * 제목 클릭 시 내용 영역이 **부드럽게 확장되는 아코디언(Accordion)** 인터페이스를 구현. 및 **사용자 편의성**을 고려.

* **Update & Delete (수정/삭제)**:
    * **수정**: 펼쳐진 상태에서 '수정' 버튼 클릭 시, 기존 내용이 채워진 동일한 폼으로 즉시 전환.
    * **삭제**: '삭제' 시 목록에서 즉시 제거되며, 열려 있던 상태도 함께 해제.

* **ID 관리**:
    * 각 게시글은 `auto-increment` 방식을 통해 고유한 `id`를 부여받아 관리.


<h3>Library</h3>

![Image](https://github.com/user-attachments/assets/ab3b4147-8889-4597-9f50-e17b70bdef4f)

<pre><code>
플리 목록 로드(LocalStorage 복원) - 플리 생성/이름변경/삭제, 트랙 추가/제거/정렬 -  변경 즉시 LocalStorage 저장 - 항목 클릭 - 재생
</code></pre>

#### 핵심 구현 방식
* **Create (목록 및 생성)**:
    * `usePlaylistStore`에 저장된 플레이리스트 카드 목록을 렌더링.
    * '새 플레이리스트 만들기' 클릭 시,새 플레이리스트 객체를 스토어에 추가.

* **Read (상세 페이지 이동 및 조회)**:
    * 플레이리스트 카드 클릭 시, 상세 페이지로 동적 라우팅합니다.
    * 상세 페이지에서는 해당 플레이리스트의 `items` (또는 `tracks`) 배열을 찾아 렌더링.
    * **조건부 렌더링**: 상세 목록의 각 항목은 타입 속성에 따라 각기 다른 UI 컴포넌트로 분기 처리하여 표시.

* **Delete (항목 삭제)**:
    * 플레이리스트 상세 목록의 각 항목(트랙) 우측에 위치한 `⋯` (컨텍스트 메뉴) 버튼을 통해 '삭제' 기능을 제공.

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



