# MUSIC WEBSITE 
## 기획의도 
### 문제의식: 
음악을 “듣기 전 탐색” 단계에서, 플랫폼마다 흩어진 트렌딩/검색/플리 관리 UX가 제각각이라 발견-보관-재생 흐름이 끊김. <br />
**목표**: 탐색(Trending/검색), 큐잉(재생 대기열), 보관(플리 CRUD)을 한 화면 플로우에서 이어지게 설계.
<br />
### 참고 사이트 & 차별점
**SoundCloud, Spotify, YouTube Music**
1. 트렌딩 유튜브 api 호출 결과를 가로 무한 스크롤 행(Row)로 배치로 시각적 스캔 속도 증가.
2. 경량 SPA + 코드 스플리팅으로 초기 로딩 최소화, 라우트별 체감 속도 확보
3. 백엔드 프록시로 SoundCloud API 연동으로 안정적 키/쿼터 관리, CORS/보안 이슈 완화

### 협업 증빙 (노션)
https://www.notion.so/28cdc650186780829d51ca8ed95de9bb?v=28cdc6501867808d96d6000c2ce8a77e

## 구현한 핵심 기능:
**CRUD**: 1. Playlist 2. Board  생성/조회/수정/삭제 기능 포함.<br/> 
**SPA (React Router)** : Home(main page), Discover,  Board, Search <br/> 
**가상 스크롤**: 대량 데이터 효율 렌더링<br/> 
**코드 스플리팅**: React.lazy + <Suspense /> : Discover, Board, Search 적용 <br/> 
**외부 데이터 연동**: YouTube Data API(frontend) , SoundCloud API(backend)
<br/> 
## 사용 기술 (Tech Stack)
### Frontend :
React 19 + Vite <br/> 
JavaScript (ES2023)<br/> 
Axios<br/> 
Zustand<br/> 
React Router v6<br/> 
CSS Modules / Tailwind <br/> 
### Backend:
Spring Boot 3.x <br/> 
WebClient (Spring Reactive) <br/> 
MyBatis <br/> 
Spring Security  <br/> 
### External API & SDK :
SoundCloud Public API (v2) <br/> 
Ngrok<br/> 

## 각자 맡은 역할:
이건호, 성건우, 문주연


## 전체적인 시스템 구성도 

<img width="2175" height="1738" alt="Image" src="https://github.com/user-attachments/assets/e8872c75-2b7e-44dc-af04-39893f51681e" />

### 백엔드 다이어그램

<img width="1880" height="1050" alt="Image" src="https://github.com/user-attachments/assets/0d0a84bf-38b5-4d25-a622-36e855bca443" />

###  프론트앤드 다이어그램

<img width="8369" height="5386" alt="Image" src="https://github.com/user-attachments/assets/3b9e05ae-beaf-4c93-9b22-e3aae76d1c34" />

### API 명세서

[api 명세서.pdf](https://github.com/user-attachments/files/22997552/api.pdf)



