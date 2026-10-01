# CMS 설정

## 사이트 수정
HTML: `index.html`, CSS: `css/style.css`, JavaScript: `js/script.js`, `js/cms.js`.
프레임워크와 빌드는 추가하지 않았습니다. `style.scss`는 기존 소스이며 지금은 CSS를 직접 사용합니다.
백업 브랜치: `before-cms-setup-20261001`.

## 작품 관리
1. https://app.pagescms.org 접속 → GitHub 로그인 → GitHub App을 `imoot23/portfolio`에 설치.
2. 저장소와 `main` 선택 → Works 메뉴.
3. 목록에서 작품 추가/수정/삭제 → 저장. 실제 파일은 `data/works.json`입니다.
4. 대표 이미지는 images에서 선택하거나 업로드. 공개 여부를 켜고 노출 순서를 숫자로 입력합니다(작은 숫자가 먼저).
5. 대표 작품 값은 카드의 data-featured에 연결됩니다. 별도 대표작 영역은 만들지 않았습니다.
6. 첫 확인은 비공개 테스트 작품을 하나 추가해 저장하고 GitHub의 JSON 변경을 확인한 다음 삭제하세요.

## 상세페이지 제작
GitHub에서 직접 상세 HTML을 만듭니다. 예: `details/branding.html`.

## 상세페이지 연결
Pages CMS → Detail Pages → 페이지명과 실제 HTML 경로 입력 → 저장.
Pages CMS → Works → 상세 페이지에서 검색/선택 → 저장.
경로는 `details/branding.html`처럼 저장소 루트 기준 상대 경로로 쓰세요.
기존 HTML 링크 7개는 있지만 실제 파일은 없습니다. 초기 목록에 '(HTML 업로드 필요)'로 표시했습니다.
HTML을 올린 뒤 이 표시를 지우세요. 가짜 상세페이지는 만들지 않았습니다.

## 방명록 확인
Pages CMS → Guestbook → 메시지 확인 → 승인 여부 변경 또는 삭제.
방문자의 제출은 기본 approved=false입니다. 승인해도 사이트에 목록을 공개하지 않습니다.
주의: 이 저장소는 공개 저장소이므로 방명록 JSON은 GitHub에서 누구나 읽을 수 있습니다.
이메일/개인정보를 받지 마세요. 승인 여부는 저장소 자체의 공개 여부를 바꾸지 않습니다.

## 배포
Cloudflare → Workers & Pages → Create → Pages → Import existing Git repository → `imoot23/portfolio`.
- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `.` (저장소 루트)
- Root directory: 비워두기
GitHub push → Cloudflare Pages 자동 배포. Functions는 루트 `functions/`에서 인식됩니다.
배포 주소는 Cloudflare가 발급하는 `https://프로젝트명.pages.dev`입니다.
기존 https://imoot23.github.io/portfolio/ 에서는 작품은 표시되지만 서버 방명록은 실행되지 않습니다.

## 필요한 Cloudflare Variables / Secrets
프로젝트 → Settings → Variables and Secrets에 Production 값을 등록하고 재배포하세요.
- `GITHUB_TOKEN` (Secret): 해당 저장소만 선택한 Fine-grained PAT. Repository Contents: Read and write. 그 외 추가 권한 불필요.
- `GITHUB_OWNER` (Variable): `imoot23`
- `GITHUB_REPO` (Variable): `portfolio`
- `GITHUB_BRANCH` (Variable): `main`
- `TURNSTILE_SITE_KEY` (Variable): Turnstile 위젯의 공개 Site Key
- `TURNSTILE_SECRET_KEY` (Secret): 같은 위젯의 Secret Key
Turnstile → Add widget → 실제 pages.dev/사용할 도메인 허용 → 두 키 등록.
키는 HTML/저장소에 쓰지 않습니다. 공개 Site Key만 GET /api/guestbook에서 전달합니다.
운영은 두 Turnstile 키가 없으면 전송을 차단합니다.
개발 테스트에만 `GUESTBOOK_ALLOW_UNPROTECTED=true`를 사용하고 Turnstile 두 키를 비워두세요.
운영에서는 이 테스트 변수를 삭제하세요. Preview에는 운영 GitHub 토큰을 등록하지 마세요.

## 확인
Cloudflare 주소에서 CONTACT → 이름/메시지 → 보안 확인 → 제출.
Guestbook에 JSON이 만들어지고 approved=false인지 확인 → 승인/삭제 시험.
로컬 서버 테스트: `npx wrangler pages dev .` (실제 토큰은 로컬 비공개 환경 파일에만 보관).
기존 누락 파일: `images/bg2.mp4`, `detail-video.html`, `detail-motion.html`, `detail-poster.html`,
`detail-branding.html`, `detail-cardnews.html`, `detail-brochure.html`, `detail-leaflet.html`.
기존 작품 이미지는 외부 picsum 주소를 그대로 보존했습니다. CMS에서 실제 작품으로 교체하세요.
피그마 페이지 안의 MAIN/ABOUT/WORKS/CONTACT 프레임을 각각 읽어 새 디자인을 구현했습니다.
사진과 작품 영역은 피그마의 빈 자리를 유지했습니다. CMS에서 대표 이미지를 넣으면 표시됩니다.
피그마의 5개 작품은 공개, 기존 7개 작품은 비공개로 보존했습니다.
학력/자격 정보는 피그마 원문입니다. 이름/생년월일/거주지/연락처는 공개 승인 전까지 입력 자리로 두었습니다.
