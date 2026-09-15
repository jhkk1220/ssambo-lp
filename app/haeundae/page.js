import BranchLanding from "../../components/BranchLanding";

export const dynamic = "force-dynamic"; // 관리자가 콘텐츠를 바꾸면 바로 반영되도록 캐시하지 않음

export const metadata = { title: "쌈보보쌈 해운대점" };

export default function Page() {
  return <BranchLanding branch="haeundae" />;
}

