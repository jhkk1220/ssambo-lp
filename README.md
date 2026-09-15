# 쌈보보쌈 랜딩페이지 + 관리자 대시보드

해운대점 · 온천장점 광고용 랜딩페이지와, 성과를 확인하는 관리자 화면(`/admin`)입니다.

## 로컬에서 확인하기

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD, SESSION_SECRET 값을 채워넣기
npm run dev
```

`http://localhost:3000/haeundae`, `http://localhost:3000/oncheonjang`, `http://localhost:3000/admin` 접속.
로컬에서는 Blob 연결이 없어도 `data/` 폴더에 자동 저장되니 그대로 테스트할 수 있습니다.

## Vercel에 배포하기

1. 이 프로젝트를 GitHub에 올리고 Vercel에서 "Import Project"로 연결
2. Vercel 프로젝트 설정 > Environment Variables 에서 `ADMIN_PASSWORD`, `SESSION_SECRET` 두 개만 입력 (코드에는 절대 적지 않기)
3. Vercel 프로젝트 > Storage 탭에서 Blob 스토어 하나 생성 후 이 프로젝트에 연결 (그러면 `BLOB_READ_WRITE_TOKEN`이 자동으로 추가됩니다)
4. Deploy

배포 후에도 관리자 화면(콘텐츠 관리 탭)에서 사진·문구·링크를 계속 바꿀 수 있고, 코드를 다시 배포할 필요 없이 바로 반영됩니다.
